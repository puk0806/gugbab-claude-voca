import { describe, expect, it } from 'vitest';
import type { SrsCard } from '@/srs/types';
import { computeLearningScore, STAGE_META } from './computeLearningScore';

const NOW = 1_700_000_000_000;

function makeProgress(overrides: Partial<SrsCard> = {}): SrsCard {
  return {
    cardId: 'w_a1_001',
    studyMode: 'flashcard',
    cardType: 'word',
    level: 'A1',
    state: 'new',
    repetitions: 0,
    easeFactor: 2.5,
    intervalDays: 0,
    dueAt: NOW,
    lastReviewedAt: 0,
    lapses: 0,
    lastRating: null,
    ...overrides,
  };
}

describe('computeLearningScore', () => {
  describe('mark 우선 처리', () => {
    it('mark === "unknown"은 점수 -50, stage "unknown"', () => {
      const result = computeLearningScore({
        mark: 'unknown',
        progressByMode: [],
        now: NOW,
      });
      expect(result.score).toBe(-50);
      expect(result.stage).toBe('unknown');
    });

    it('mark === "known"은 점수 +50, stage "known"', () => {
      const result = computeLearningScore({
        mark: 'known',
        progressByMode: [makeProgress({ state: 'review', repetitions: 5 })],
        now: NOW,
      });
      expect(result.score).toBe(50);
      expect(result.stage).toBe('known');
    });
  });

  describe('progress 없음', () => {
    it('mark null + progress 빈 배열 → score 0, stage "new"', () => {
      const result = computeLearningScore({
        mark: null,
        progressByMode: [],
        now: NOW,
      });
      expect(result.score).toBe(0);
      expect(result.stage).toBe('new');
    });
  });

  describe('SRS state 기반 stage', () => {
    it('모든 mode가 state === "new" → stage "new"', () => {
      const result = computeLearningScore({
        mark: null,
        progressByMode: [makeProgress({ studyMode: 'flashcard', state: 'new' })],
        now: NOW,
      });
      expect(result.stage).toBe('new');
    });

    it('어떤 mode든 review-due → stage "review-due"', () => {
      const result = computeLearningScore({
        mark: null,
        progressByMode: [
          makeProgress({ studyMode: 'flashcard', state: 'review', dueAt: NOW - 86400000 }),
          makeProgress({ studyMode: 'recall', state: 'review', dueAt: NOW + 86400000 }),
        ],
        now: NOW,
      });
      expect(result.stage).toBe('review-due');
    });

    it('어떤 mode든 learning, review-due 없음 → stage "learning"', () => {
      const result = computeLearningScore({
        mark: null,
        progressByMode: [
          makeProgress({ studyMode: 'flashcard', state: 'learning' }),
          makeProgress({ studyMode: 'recall', state: 'review', dueAt: NOW + 86400000 }),
        ],
        now: NOW,
      });
      expect(result.stage).toBe('learning');
    });

    it('모든 mode가 review AND dueAt > now → stage "completed"', () => {
      const result = computeLearningScore({
        mark: null,
        progressByMode: [
          makeProgress({ studyMode: 'flashcard', state: 'review', dueAt: NOW + 86400000 }),
          makeProgress({ studyMode: 'recall', state: 'review', dueAt: NOW + 172800000 }),
        ],
        now: NOW,
      });
      expect(result.stage).toBe('completed');
    });
  });

  describe('score 계산', () => {
    it('review-due 1개 → -20', () => {
      const result = computeLearningScore({
        mark: null,
        progressByMode: [
          makeProgress({ state: 'review', dueAt: NOW - 1000, repetitions: 0 }),
        ],
        now: NOW,
      });
      expect(result.score).toBe(-20);
    });

    it('repetitions 5회 × 2 = +10', () => {
      const result = computeLearningScore({
        mark: null,
        progressByMode: [
          makeProgress({ state: 'review', dueAt: NOW + 1000, repetitions: 5 }),
        ],
        now: NOW,
      });
      expect(result.score).toBe(10 + 10); // +10 for review-not-due, +10 for reps
    });

    it('3개 mode 합산 — 2개 review완료 + 1개 learning', () => {
      const result = computeLearningScore({
        mark: null,
        progressByMode: [
          makeProgress({ studyMode: 'flashcard', state: 'review', dueAt: NOW + 1000, repetitions: 3 }),
          makeProgress({ studyMode: 'recall', state: 'review', dueAt: NOW + 1000, repetitions: 2 }),
          makeProgress({ studyMode: 'cloze', state: 'learning', repetitions: 1 }),
        ],
        now: NOW,
      });
      // flashcard: +10 + 6 = 16
      // recall:    +10 + 4 = 14
      // cloze:     -10 + 2 = -8
      // total: 22
      expect(result.score).toBe(22);
      expect(result.stage).toBe('learning');
    });
  });
});

describe('STAGE_META', () => {
  it('6개 단계 모두 정의', () => {
    expect(Object.keys(STAGE_META)).toHaveLength(6);
  });

  it('priority가 학습 우선순위 순서 (낮을수록 위)', () => {
    expect(STAGE_META.unknown.priority).toBeLessThan(STAGE_META['review-due'].priority);
    expect(STAGE_META['review-due'].priority).toBeLessThan(STAGE_META.learning.priority);
    expect(STAGE_META.learning.priority).toBeLessThan(STAGE_META.new.priority);
    expect(STAGE_META.new.priority).toBeLessThan(STAGE_META.completed.priority);
    expect(STAGE_META.completed.priority).toBeLessThan(STAGE_META.known.priority);
  });
});
