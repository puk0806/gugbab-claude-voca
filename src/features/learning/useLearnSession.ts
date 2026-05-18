import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SentenceEntry, WordEntry } from '@/content';
import { upsertProgress } from '@/db';
import { initialFromMark, safeReview, type SrsCard } from '@/srs';
import type { CardType, CEFR, SrsRating, StudyMode } from '@/shared/types';
import { useSessionStore } from '@/store';

export interface LearnSessionData {
  readonly level: CEFR;
  readonly cardType: CardType;
  readonly studyMode: StudyMode;
  readonly queue: readonly string[];
  readonly cardsById: Readonly<Record<string, WordEntry | SentenceEntry>>;
  readonly marksByCardId: Readonly<Record<string, 'known' | 'unknown'>>;
  readonly progressByCardId: Readonly<Record<string, SrsCard>>;
}

export interface UseLearnSessionResult {
  readonly currentCard: WordEntry | SentenceEntry | undefined;
  readonly cursor: number;
  readonly queueLength: number;
  readonly finished: boolean;
  /** 종료 시점에만 호출 권장 — 매 렌더 호출 시 zustand getter가 새 객체 반환할 수 있음 */
  readonly getSummary: () => {
    readonly cardsSeen: number;
    readonly goodCount: number;
    readonly againCount: number;
  };
  readonly handleAnswer: (rating: SrsRating) => Promise<void>;
  readonly restart: () => void;
}

function makeInitialCard(
  cardId: string,
  cardType: CardType,
  level: CEFR,
  studyMode: StudyMode,
  mark: 'known' | 'unknown' | null,
  now: number,
): SrsCard {
  const init = initialFromMark(mark);
  return {
    cardId,
    studyMode,
    cardType,
    level,
    state: 'new',
    repetitions: 0,
    easeFactor: init.easeFactor,
    intervalDays: init.intervalDays,
    dueAt: now,
    lastReviewedAt: 0,
    lapses: 0,
    lastRating: null,
  };
}

/**
 * 학습 세션 라이프사이클 통합 훅.
 *
 * 책임:
 * - 마운트 시 세션 시작 (loader queue 사용)
 * - 카드 0개 → 즉시 finished
 * - 큐 소진 → finished
 * - 답변 처리: safeReview → upsertProgress → advance
 * - 언마운트 시 reset
 * - restart: loader refetch (navigate(0))
 */
export function useLearnSession(data: LearnSessionData): UseLearnSessionResult {
  const navigate = useNavigate();
  const startSession = useSessionStore((s) => s.startSession);
  const recordResult = useSessionStore((s) => s.recordResult);
  const advance = useSessionStore((s) => s.advance);
  const reset = useSessionStore((s) => s.reset);
  const summaryFn = useSessionStore((s) => s.summary);
  const cursor = useSessionStore((s) => s.cursor);
  const queue = useSessionStore((s) => s.queue);

  const [finished, setFinished] = useState(false);

  useEffect(() => {
    startSession({
      cefr: data.level,
      cardType: data.cardType,
      studyMode: data.studyMode,
      queue: data.queue,
      now: Date.now(),
    });
    if (data.queue.length === 0) {
      setFinished(true);
    }
    return () => {
      reset();
    };
  }, [data, startSession, reset]);

  const currentId = queue[cursor];
  const currentCard = currentId ? data.cardsById[currentId] : undefined;

  useEffect(() => {
    if (queue.length > 0 && cursor >= queue.length) {
      setFinished(true);
    }
  }, [queue.length, cursor]);

  const handleAnswer = useCallback(
    async (rating: SrsRating): Promise<void> => {
      if (!currentId) return;
      const now = Date.now();
      const existing = data.progressByCardId[currentId];
      const base =
        existing ??
        makeInitialCard(
          currentId,
          data.cardType,
          data.level,
          data.studyMode,
          data.marksByCardId[currentId] ?? null,
          now,
        );

      const { card: updated } = safeReview(base, { rating, now });
      await upsertProgress(updated);

      recordResult(currentId, rating);
      advance();
    },
    [currentId, data, recordResult, advance],
  );

  const restart = useCallback(() => {
    setFinished(false);
    navigate(0); // refetch loader
  }, [navigate]);

  return {
    currentCard,
    cursor,
    queueLength: queue.length,
    finished,
    getSummary: summaryFn,
    handleAnswer,
    restart,
  };
}
