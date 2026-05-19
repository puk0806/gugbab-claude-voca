/**
 * 학습 세션 in-memory 상태 (Zustand).
 *
 * 휘발성: 새로고침 시 폐기. SRS 결과는 Dexie에 즉시 저장되므로
 * 카드 단위 진도는 유지됨.
 *
 * 아키텍처 §7.2 시그니처 기반.
 */
import { create } from 'zustand';
import type { CardType, CEFR, SrsRating, StudyMode } from '@/shared/types';

export interface SessionResult {
  readonly cardId: string;
  readonly rating: SrsRating;
}

export interface SessionSummary {
  readonly cardsSeen: number;
  readonly goodCount: number;
  readonly againCount: number;
  readonly level: CEFR | null;
  readonly cardType: CardType | null;
  readonly studyMode: StudyMode | null;
}

interface StartSessionInput {
  readonly cefr: CEFR;
  readonly cardType: CardType;
  readonly studyMode: StudyMode;
  readonly queue: readonly string[];
  readonly now: number;
}

interface SessionState {
  cefr: CEFR | null;
  cardType: CardType | null;
  studyMode: StudyMode | null;
  queue: readonly string[];
  cursor: number;
  results: readonly SessionResult[];
  startedAt: number | null;

  startSession: (input: StartSessionInput) => void;
  recordResult: (cardId: string, rating: SrsRating) => void;
  advance: () => void;
  reset: () => void;
  summary: () => SessionSummary;
}

const INITIAL: Omit<
  SessionState,
  'startSession' | 'recordResult' | 'advance' | 'reset' | 'summary'
> = {
  cefr: null,
  cardType: null,
  studyMode: null,
  queue: [],
  cursor: 0,
  results: [],
  startedAt: null,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...INITIAL,

  startSession: (input) =>
    set({
      cefr: input.cefr,
      cardType: input.cardType,
      studyMode: input.studyMode,
      queue: input.queue,
      cursor: 0,
      results: [],
      startedAt: input.now,
    }),

  recordResult: (cardId, rating) =>
    set((state) => ({
      results: [...state.results, { cardId, rating }],
    })),

  advance: () =>
    set((state) => ({
      cursor: Math.min(state.cursor + 1, state.queue.length),
    })),

  reset: () => set({ ...INITIAL }),

  summary: () => {
    const state = get();
    const goodCount = state.results.filter((r) => r.rating === 'good').length;
    const againCount = state.results.length - goodCount;
    return {
      cardsSeen: state.results.length,
      goodCount,
      againCount,
      level: state.cefr,
      cardType: state.cardType,
      studyMode: state.studyMode,
    };
  },
}));
