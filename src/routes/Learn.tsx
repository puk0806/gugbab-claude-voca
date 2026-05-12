/**
 * `/learn/:cefr/:cardType/:studyMode` — 학습 세션 화면.
 *
 * 흐름:
 *   1. loader: 콘텐츠 + 진도 + 마킹 → composeQueue → 세션 시작
 *   2. 카드 표시 (studyMode별 컴포넌트)
 *   3. onAnswer: safeReview → upsertProgress → 다음 카드
 *   4. 큐 소진 시 종료 요약
 */
import { useCallback, useEffect, useState } from 'react';
import {
  type LoaderFunctionArgs,
  Link,
  useLoaderData,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { ClozePrompt } from '@/features/cloze';
import { composeQueue } from '@/features/learning';
import { Flashcard } from '@/features/flashcard';
import { RecallPrompt } from '@/features/recall';
import {
  getDueCards,
  getNewProgress,
  listMarksByLevel,
  upsertProgress,
} from '@/db';
import { loadSentences, loadWords } from '@/content';
import type { SentenceEntry, WordEntry } from '@/content';
import { initialFromMark, safeReview, type SrsCard } from '@/srs';
import { EmptyState } from '@/shared/components';
import {
  type CardType,
  type CEFR,
  isCardType,
  isCefr,
  isStudyMode,
  isStudyModeAvailable,
  type SrsRating,
  type StudyMode,
} from '@/shared/types';
import { useSessionStore } from '@/store';
import { useSpeak } from '@/tts';
import styles from './Learn.module.css';

interface LearnLoaderData {
  readonly level: CEFR;
  readonly cardType: CardType;
  readonly studyMode: StudyMode;
  readonly queue: readonly string[];
  readonly cardsById: Readonly<Record<string, WordEntry | SentenceEntry>>;
  readonly marksByCardId: Readonly<Record<string, 'known' | 'unknown'>>;
  readonly progressByCardId: Readonly<Record<string, SrsCard>>;
}

const DEFAULT_SESSION_SIZE = 20;
const DEFAULT_NEW_RATIO = 0.3;

export async function learnLoader({ params }: LoaderFunctionArgs): Promise<LearnLoaderData> {
  const cefr = params.cefr;
  const cardType = params.cardType;
  const studyMode = params.studyMode;

  if (!cefr || !isCefr(cefr)) throw new Response('Invalid level', { status: 404 });
  if (!cardType || !isCardType(cardType)) throw new Response('Invalid card type', { status: 404 });
  if (!studyMode || !isStudyMode(studyMode)) throw new Response('Invalid mode', { status: 404 });
  if (!isStudyModeAvailable(cardType, studyMode)) {
    throw new Response('Mode not available for this card type', { status: 404 });
  }

  const content =
    cardType === 'word' ? await loadWords(cefr) : await loadSentences(cefr);
  const due = await getDueCards(studyMode, cardType, cefr, Date.now());
  const newProgress = await getNewProgress(studyMode, cardType, cefr);
  const marks = await listMarksByLevel(cardType, cefr);

  const contentIds = content.map((c) => c.id);
  const progress: SrsCard[] = [...due, ...newProgress];

  const queue = composeQueue({
    progress,
    contentIds,
    marks,
    sessionSize: DEFAULT_SESSION_SIZE,
    newCardRatio: DEFAULT_NEW_RATIO,
    now: Date.now(),
  });

  const cardsById: Record<string, WordEntry | SentenceEntry> = {};
  for (const c of content) cardsById[c.id] = c;

  const marksByCardId: Record<string, 'known' | 'unknown'> = {};
  for (const [id, mark] of marks.entries()) marksByCardId[id] = mark;

  const progressByCardId: Record<string, SrsCard> = {};
  for (const p of progress) progressByCardId[p.cardId] = p;

  return {
    level: cefr,
    cardType,
    studyMode,
    queue,
    cardsById,
    marksByCardId,
    progressByCardId,
  };
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

export function Learn() {
  const data = useLoaderData() as LearnLoaderData;
  const navigate = useNavigate();
  const params = useParams();
  const { speak, supported: ttsSupported } = useSpeak();

  const startSession = useSessionStore((s) => s.startSession);
  const recordResult = useSessionStore((s) => s.recordResult);
  const advance = useSessionStore((s) => s.advance);
  const reset = useSessionStore((s) => s.reset);
  const summary = useSessionStore((s) => s.summary);
  const cursor = useSessionStore((s) => s.cursor);
  const queue = useSessionStore((s) => s.queue);

  const [finished, setFinished] = useState(false);

  // 마운트 시 세션 시작 (loader queue 사용). 카드 0개면 즉시 종료.
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

  // 모든 카드 소진 시 종료
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

  if (finished) {
    const sum = summary();
    return (
      <div className={styles.summary}>
        <div className={styles.summaryTitle}>
          {sum.cardsSeen === 0 ? '오늘 학습할 카드가 없어요' : '세션 완료!'}
        </div>
        <div className={styles.summaryMetrics}>
          <div className={styles.metric}>
            <div className={styles.metricValue}>{sum.cardsSeen}</div>
            <div className={styles.metricLabel}>본 카드</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricValue}>{sum.goodCount}</div>
            <div className={styles.metricLabel}>알았음</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricValue}>{sum.againCount}</div>
            <div className={styles.metricLabel}>모르겠음</div>
          </div>
        </div>
        <div className={styles.summaryActions}>
          <Link to="/" className={styles.summaryAction}>
            홈으로
          </Link>
          {sum.cardsSeen > 0 && (
            <button
              type="button"
              className={`${styles.summaryAction} ${styles.primary}`}
              onClick={() => {
                setFinished(false);
                navigate(0); // refetch loader
              }}
            >
              한 세션 더 하기
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return <EmptyState title="카드를 불러오는 중..." />;
  }

  const modeLabel =
    data.studyMode === 'flashcard'
      ? '플래시카드'
      : data.studyMode === 'recall'
        ? '리콜'
        : '클로즈';

  return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <span>
          {params.cefr} · {data.cardType === 'word' ? '단어' : '문장'}
        </span>
        <span className={styles.progress}>
          {cursor + 1} / {queue.length}
        </span>
        <span className={styles.modeChip}>{modeLabel}</span>
      </div>

      {data.studyMode === 'flashcard' && (
        <Flashcard
          card={currentCard}
          cardType={data.cardType}
          onAnswer={handleAnswer}
          onSpeak={ttsSupported ? speak : undefined}
          ttsSupported={ttsSupported}
        />
      )}
      {data.studyMode === 'recall' && (
        <RecallPrompt card={currentCard} cardType={data.cardType} onAnswer={handleAnswer} />
      )}
      {data.studyMode === 'cloze' && data.cardType === 'sentence' && (
        <ClozePrompt card={currentCard as SentenceEntry} onAnswer={handleAnswer} />
      )}
    </div>
  );
}
