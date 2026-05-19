import { describe, expect, it } from 'vitest';
import type { CardType } from '@/shared/types';
import type { SrsCard } from '@/srs/types';
import { type DetermineMarkInput, determineMark } from './determineMark';

function mkProgress(studyMode: SrsCard['studyMode'], lastRating: 'good' | 'again' | null): SrsCard {
  return {
    cardId: 'c1',
    studyMode,
    cardType: 'word',
    level: 'A1',
    state: 'learning',
    repetitions: 1,
    easeFactor: 2.5,
    intervalDays: 1,
    dueAt: 1,
    lastReviewedAt: 0,
    lapses: 0,
    lastRating,
  };
}

function input(
  cardType: CardType,
  studyMode: SrsCard['studyMode'],
  rating: 'good' | 'again',
  otherModeProgress: readonly SrsCard[] = [],
): DetermineMarkInput {
  return { cardType, studyMode, rating, otherModeProgress };
}

describe('determineMark', () => {
  describe('again 응답 — 어떤 mode·cardType 든 unknown', () => {
    it('word flashcard again → unknown', () => {
      expect(determineMark(input('word', 'flashcard', 'again'))).toBe('unknown');
    });
    it('word recall again → unknown (hint 사용 시 PR B 에서 again 으로 호출됨)', () => {
      expect(determineMark(input('word', 'recall', 'again'))).toBe('unknown');
    });
    it('sentence flashcard again → unknown', () => {
      expect(determineMark(input('sentence', 'flashcard', 'again'))).toBe('unknown');
    });
    it('sentence cloze again → unknown', () => {
      expect(determineMark(input('sentence', 'cloze', 'again'))).toBe('unknown');
    });
  });

  describe('word — recall 통과로 즉시 mastered', () => {
    it('word recall good (다른 mode 미통과) → mastered', () => {
      const r = determineMark(input('word', 'recall', 'good', [mkProgress('flashcard', null)]));
      expect(r).toBe('mastered');
    });
    it('word recall good (flashcard 도 통과) → mastered', () => {
      const r = determineMark(input('word', 'recall', 'good', [mkProgress('flashcard', 'good')]));
      expect(r).toBe('mastered');
    });
    it('word recall good (flashcard again 이력) → mastered (recall 단독 졸업)', () => {
      const r = determineMark(input('word', 'recall', 'good', [mkProgress('flashcard', 'again')]));
      expect(r).toBe('mastered');
    });
  });

  describe('word — flashcard 통과는 known. recall 통과 이력 있으면 mastered 유지', () => {
    it('word flashcard good (recall 미통과) → known', () => {
      const r = determineMark(input('word', 'flashcard', 'good', [mkProgress('recall', null)]));
      expect(r).toBe('known');
    });
    it('word flashcard good (recall already good) → mastered (recall 졸업 상태 유지)', () => {
      const r = determineMark(input('word', 'flashcard', 'good', [mkProgress('recall', 'good')]));
      expect(r).toBe('mastered');
    });
    it('word flashcard good (recall again 이력) → known', () => {
      const r = determineMark(input('word', 'flashcard', 'good', [mkProgress('recall', 'again')]));
      expect(r).toBe('known');
    });
  });

  describe('sentence — 둘 다 통과해야 mastered', () => {
    it('sentence flashcard good (cloze 미통과) → known', () => {
      const r = determineMark(input('sentence', 'flashcard', 'good', [mkProgress('cloze', null)]));
      expect(r).toBe('known');
    });
    it('sentence flashcard good (cloze good 이력) → mastered', () => {
      const r = determineMark(
        input('sentence', 'flashcard', 'good', [mkProgress('cloze', 'good')]),
      );
      expect(r).toBe('mastered');
    });
    it('sentence cloze good (flashcard 미통과) → known', () => {
      const r = determineMark(input('sentence', 'cloze', 'good', [mkProgress('flashcard', null)]));
      expect(r).toBe('known');
    });
    it('sentence cloze good (flashcard good 이력) → mastered', () => {
      const r = determineMark(
        input('sentence', 'cloze', 'good', [mkProgress('flashcard', 'good')]),
      );
      expect(r).toBe('mastered');
    });
    it('sentence cloze good (flashcard again 이력) → known (mastered 아님)', () => {
      const r = determineMark(
        input('sentence', 'cloze', 'good', [mkProgress('flashcard', 'again')]),
      );
      expect(r).toBe('known');
    });
  });

  describe('otherModeProgress 빈 배열 — 다른 mode 학습 이력 없음', () => {
    it('word recall good + 빈 배열 → mastered (단독 졸업)', () => {
      expect(determineMark(input('word', 'recall', 'good', []))).toBe('mastered');
    });
    it('word flashcard good + 빈 배열 → known', () => {
      expect(determineMark(input('word', 'flashcard', 'good', []))).toBe('known');
    });
    it('sentence flashcard good + 빈 배열 → known', () => {
      expect(determineMark(input('sentence', 'flashcard', 'good', []))).toBe('known');
    });
    it('sentence cloze good + 빈 배열 → known', () => {
      expect(determineMark(input('sentence', 'cloze', 'good', []))).toBe('known');
    });
  });
});
