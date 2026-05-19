import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SentenceEntry, WordEntry } from '@/content';
import type { CardType, StudyMode, UserMark } from '@/shared/types';
import type { SrsCard } from '@/srs/types';
import { computeLearningScore, type LearningStage } from './computeLearningScore';

export interface ScoredCard {
  readonly card: WordEntry | SentenceEntry;
  readonly mark: Exclude<UserMark, null> | null;
  readonly stage: LearningStage;
  readonly score: number;
  readonly reps: number;
  /** 각 mode 의 마지막 응답 통과 여부 (배지 표시용). */
  readonly passedByMode: Readonly<Partial<Record<StudyMode, boolean>>>;
}

export interface UseVocabularyCardsParams {
  readonly cards: ReadonlyArray<WordEntry | SentenceEntry>;
  readonly cardType: CardType;
  readonly marks: Readonly<Record<string, Exclude<UserMark, null>>>;
  readonly initialProgress: readonly SrsCard[];
  readonly query: string;
  readonly stageFilter: LearningStage | 'all';
  readonly pageSize: number;
  readonly getDisplayEnglish: (card: WordEntry | SentenceEntry, cardType: CardType) => string;
  readonly getDisplayKorean: (card: WordEntry | SentenceEntry, cardType: CardType) => string;
}

export interface UseVocabularyCardsResult {
  readonly scored: readonly ScoredCard[];
  readonly stageCounts: Readonly<Record<LearningStage, number>>;
  readonly filtered: readonly ScoredCard[];
  readonly visible: readonly ScoredCard[];
  readonly visibleCount: number;
  readonly hasMore: boolean;
  readonly loadMore: () => void;
}

/**
 * 단어장 카드 점수 계산·필터·검색·페이지네이션 통합 훅.
 *
 * 책임:
 * - cardId별 progress 그룹화
 * - 카드별 학습 점수·단계 계산
 * - 단계별 카운트 집계
 * - 검색·단계 필터·정렬
 * - 페이지네이션 (visibleCount, hasMore, loadMore)
 *
 * 정렬 안정성: 한 세션 내 `now` 고정 (스크롤 중 재정렬 방지).
 */
export function useVocabularyCards(params: UseVocabularyCardsParams): UseVocabularyCardsResult {
  const {
    cards,
    cardType,
    marks,
    initialProgress,
    query,
    stageFilter,
    pageSize,
    getDisplayEnglish,
    getDisplayKorean,
  } = params;

  const [now] = useState(() => Date.now());

  const progressByCardId = useMemo(() => {
    const m = new Map<string, SrsCard[]>();
    for (const p of initialProgress) {
      const arr = m.get(p.cardId) ?? [];
      arr.push(p);
      m.set(p.cardId, arr);
    }
    return m;
  }, [initialProgress]);

  const scored = useMemo<readonly ScoredCard[]>(() => {
    return cards.map((c) => {
      const mark = marks[c.id] ?? null;
      const progressByMode = progressByCardId.get(c.id) ?? [];
      const { score, stage } = computeLearningScore({
        mark,
        progressByMode,
        now,
      });
      const reps = progressByMode.reduce((sum, p) => sum + p.repetitions, 0);
      const passedByMode: Partial<Record<StudyMode, boolean>> = {};
      for (const p of progressByMode) {
        passedByMode[p.studyMode] = p.lastRating === 'good';
      }
      return { card: c, mark, stage, score, reps, passedByMode };
    });
  }, [cards, marks, progressByCardId, now]);

  const stageCounts = useMemo<Readonly<Record<LearningStage, number>>>(() => {
    const init: Record<LearningStage, number> = {
      unknown: 0,
      'review-due': 0,
      learning: 0,
      new: 0,
      completed: 0,
      known: 0,
      mastered: 0,
    };
    for (const s of scored) init[s.stage] += 1;
    return init;
  }, [scored]);

  const filtered = useMemo<readonly ScoredCard[]>(() => {
    let arr: readonly ScoredCard[] = scored;
    if (stageFilter !== 'all') {
      arr = arr.filter((s) => s.stage === stageFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      arr = arr.filter((s) => {
        const en = getDisplayEnglish(s.card, cardType).toLowerCase();
        const ko = getDisplayKorean(s.card, cardType).toLowerCase();
        return en.includes(q) || ko.includes(q);
      });
    }
    return [...arr].sort((a, b) => a.score - b.score);
  }, [scored, stageFilter, query, cardType, getDisplayEnglish, getDisplayKorean]);

  const [visibleCount, setVisibleCount] = useState(pageSize);

  // 필터·검색 변경 시 visibleCount 리셋
  // biome-ignore lint/correctness/useExhaustiveDependencies: stageFilter/query 변화 트리거가 의도
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [stageFilter, query, pageSize]);

  const visible = useMemo(
    () => filtered.slice(0, Math.min(visibleCount, filtered.length)),
    [filtered, visibleCount],
  );

  const hasMore = visible.length < filtered.length;

  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + pageSize, filtered.length));
  }, [filtered.length, pageSize]);

  return {
    scored,
    stageCounts,
    filtered,
    visible,
    visibleCount,
    hasMore,
    loadMore,
  };
}
