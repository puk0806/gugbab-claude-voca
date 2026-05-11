import { describe, expect, it } from 'vitest';
import { applySm2, SM2_CONSTANTS } from './sm2';
import type { Quality, SrsCard } from './types';

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

describe('applySm2 — 첫 학습 (n=0)', () => {
  it('good (q=4) → repetitions=1, intervalDays=1, state=learning', () => {
    const result = applySm2(makeCard(), 4, NOW);
    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
    expect(result.state).toBe('learning');
    expect(result.dueAt).toBe(NOW + MS_PER_DAY);
    expect(result.lastReviewedAt).toBe(NOW);
    expect(result.lastRating).toBe('good');
  });

  it('again (q=1) → repetitions=0, intervalDays=1, state=relearning, lapses=1', () => {
    const result = applySm2(makeCard(), 1, NOW);
    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
    expect(result.state).toBe('relearning');
    expect(result.lapses).toBe(1);
    expect(result.lastRating).toBe('again');
  });
});

describe('applySm2 — 두 번째 학습 (n=1)', () => {
  it('good → intervalDays=6, state=review', () => {
    const card = makeCard({ repetitions: 1, intervalDays: 1, state: 'learning' });
    const result = applySm2(card, 4, NOW);
    expect(result.repetitions).toBe(2);
    expect(result.intervalDays).toBe(6);
    expect(result.state).toBe('review');
  });
});

describe('applySm2 — 세 번째 이후 (n>=2)', () => {
  it('good → intervalDays = round(prev × ef)', () => {
    const card = makeCard({ repetitions: 2, intervalDays: 6, easeFactor: 2.5 });
    const result = applySm2(card, 4, NOW);
    // ef 갱신: 2.5 + (0.1 - 1*(0.08 + 0.02)) = 2.5 + 0 = 2.5
    // interval: round(6 * 2.5) = 15
    expect(result.intervalDays).toBe(15);
    expect(result.easeFactor).toBe(2.5);
  });
});

describe('applySm2 — EF floor 1.3', () => {
  it('연속 again 10회 시 EF는 1.3 미만으로 떨어지지 않는다', () => {
    let card = makeCard();
    for (let i = 0; i < 10; i++) {
      card = applySm2(card, 1, NOW + i * MS_PER_DAY);
    }
    expect(card.easeFactor).toBe(SM2_CONSTANTS.EF_MIN);
    expect(card.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('q=0 단발에도 EF >= 1.3', () => {
    const card = makeCard({ easeFactor: 1.4 });
    const result = applySm2(card, 0, NOW);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});

describe('applySm2 — fail reset', () => {
  it('q=2 (fail) → repetitions=0, intervalDays=1', () => {
    const card = makeCard({ repetitions: 5, intervalDays: 30, state: 'review' });
    const result = applySm2(card, 2, NOW);
    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
    expect(result.state).toBe('relearning');
    expect(result.lapses).toBe(card.lapses + 1);
  });
});

describe('applySm2 — 단조 증가 보장 (연속 good)', () => {
  it('연속 good 10회 시 dueAt이 단조 증가한다', () => {
    let card = makeCard();
    let prevDueAt = -Infinity;
    for (let i = 0; i < 10; i++) {
      card = applySm2(card, 4, NOW + i * MS_PER_DAY);
      expect(card.dueAt).toBeGreaterThan(prevDueAt);
      prevDueAt = card.dueAt;
    }
  });
});

describe('applySm2 — 결정론 (외부 의존 0)', () => {
  it('같은 입력 → 같은 출력', () => {
    const card = makeCard({ repetitions: 3, intervalDays: 10, easeFactor: 2.3 });
    const r1 = applySm2(card, 4, NOW);
    const r2 = applySm2(card, 4, NOW);
    expect(r1).toEqual(r2);
  });

  it('원본 카드는 mutate 되지 않는다 (immutable)', () => {
    const card = makeCard({ repetitions: 3 });
    const snapshot = { ...card };
    applySm2(card, 4, NOW);
    expect(card).toEqual(snapshot);
  });
});

describe('applySm2 — 모든 quality 등급', () => {
  it.each<[Quality, 'pass' | 'fail']>([
    [0, 'fail'],
    [1, 'fail'],
    [2, 'fail'],
    [3, 'pass'],
    [4, 'pass'],
    [5, 'pass'],
  ])('q=%i → %s 처리', (q, expected) => {
    const card = makeCard({ repetitions: 2, intervalDays: 6 });
    const result = applySm2(card, q, NOW);
    if (expected === 'fail') {
      expect(result.repetitions).toBe(0);
      expect(result.intervalDays).toBe(1);
      expect(result.lastRating).toBe('again');
    } else {
      expect(result.repetitions).toBe(card.repetitions + 1);
      expect(result.lastRating).toBe('good');
    }
  });
});
