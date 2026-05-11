import { describe, expect, it } from 'vitest';
import { safeReview } from './safeReview';
import { SM2_CONSTANTS } from './sm2';
import type { SrsCard } from './types';

const NOW = Date.parse('2026-05-10T00:00:00Z');
const MS_PER_DAY = SM2_CONSTANTS.MS_PER_DAY;

function makeCard(overrides: Partial<SrsCard> = {}): SrsCard {
  return {
    cardId: 'w_a1_001',
    studyMode: 'flashcard',
    cardType: 'word',
    level: 'A1',
    state: 'new',
    repetitions: 0,
    easeFactor: 2.5,
    intervalDays: 0,
    dueAt: 0,
    lastReviewedAt: 0,
    lapses: 0,
    lastRating: null,
    ...overrides,
  };
}

describe('safeReview — 정상 흐름', () => {
  it('good rating → SrsResult.card·nextDueAt 일치', () => {
    const card = makeCard();
    const { card: updated, nextDueAt } = safeReview(card, { rating: 'good', now: NOW });
    expect(updated.lastRating).toBe('good');
    expect(updated.repetitions).toBe(1);
    expect(nextDueAt).toBe(updated.dueAt);
  });

  it('again rating → state=relearning, lapses 증가', () => {
    const card = makeCard({ repetitions: 5, lapses: 2 });
    const { card: updated } = safeReview(card, { rating: 'again', now: NOW });
    expect(updated.state).toBe('relearning');
    expect(updated.lapses).toBe(3);
  });
});

describe('safeReview — 시계 변경 방어', () => {
  it('now < lastReviewedAt 이면 lastReviewedAt + 1초로 보정', () => {
    const lastReviewedAt = NOW;
    const card = makeCard({
      repetitions: 1,
      intervalDays: 1,
      lastReviewedAt,
      state: 'learning',
    });
    const past = NOW - MS_PER_DAY * 7;
    const { card: updated } = safeReview(card, { rating: 'good', now: past });
    expect(updated.lastReviewedAt).toBe(lastReviewedAt + 1000);
    // dueAt은 보정된 시각 + interval 기준으로 미래여야 함
    expect(updated.dueAt).toBeGreaterThan(lastReviewedAt);
  });

  it('now == lastReviewedAt 이면 보정하지 않는다', () => {
    const card = makeCard({ lastReviewedAt: NOW });
    const { card: updated } = safeReview(card, { rating: 'good', now: NOW });
    expect(updated.lastReviewedAt).toBe(NOW);
  });

  it('now > lastReviewedAt 이면 보정하지 않는다 (정상 흐름)', () => {
    const card = makeCard({ lastReviewedAt: NOW });
    const future = NOW + MS_PER_DAY;
    const { card: updated } = safeReview(card, { rating: 'good', now: future });
    expect(updated.lastReviewedAt).toBe(future);
  });
});

describe('safeReview — 단조 증가 보장', () => {
  it('연속 good rating 10회 → dueAt 단조 증가', () => {
    let card = makeCard();
    let prev = -Infinity;
    for (let i = 0; i < 10; i++) {
      const { card: updated } = safeReview(card, {
        rating: 'good',
        now: NOW + i * MS_PER_DAY,
      });
      expect(updated.dueAt).toBeGreaterThan(prev);
      prev = updated.dueAt;
      card = updated;
    }
  });
});

describe('safeReview — immutable', () => {
  it('원본 카드는 mutate되지 않는다', () => {
    const card = makeCard({ repetitions: 3 });
    const snapshot = { ...card };
    safeReview(card, { rating: 'good', now: NOW });
    expect(card).toEqual(snapshot);
  });
});
