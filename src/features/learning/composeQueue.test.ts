import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SrsCard } from '@/srs/types';
import { composeQueue } from './composeQueue';

const NOW = Date.parse('2026-05-10T00:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

function makeCard(overrides: Partial<SrsCard> & Pick<SrsCard, 'cardId'>): SrsCard {
  return {
    studyMode: 'flashcard',
    cardType: 'word',
    level: 'A1',
    state: 'review',
    repetitions: 1,
    easeFactor: 2.5,
    intervalDays: 1,
    dueAt: NOW - DAY,
    lastReviewedAt: NOW - DAY,
    lapses: 0,
    lastRating: 'good',
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('composeQueue — 신규 only (진도 0)', () => {
  it('due 0 + new 80, N=20, R=0.3 → 20개 모두 new', () => {
    const contentIds = Array.from({ length: 80 }, (_, i) => `w_a1_${i}`);
    const queue = composeQueue({
      progress: [],
      contentIds,
      marks: new Map(),
      sessionSize: 20,
      newCardRatio: 0.3,
      now: NOW,
    });
    expect(queue).toHaveLength(20);
    expect(queue.every((id) => contentIds.includes(id))).toBe(true);
  });
});

describe('composeQueue — due + new 혼합', () => {
  it('due 30 + new 80, N=20, R=0.3 → due 14 + new 6 (복습 우선)', () => {
    const dueProgress = Array.from({ length: 30 }, (_, i) =>
      makeCard({ cardId: `due_${i}`, dueAt: NOW - (i + 1) * DAY }),
    );
    const contentIds = [
      ...dueProgress.map((p) => p.cardId),
      ...Array.from({ length: 80 }, (_, i) => `new_${i}`),
    ];
    const queue = composeQueue({
      progress: dueProgress,
      contentIds,
      marks: new Map(),
      sessionSize: 20,
      newCardRatio: 0.3,
      now: NOW,
    });
    expect(queue).toHaveLength(20);
    const dueInQueue = queue.filter((id) => id.startsWith('due_'));
    const newInQueue = queue.filter((id) => id.startsWith('new_'));
    expect(dueInQueue).toHaveLength(14);
    expect(newInQueue).toHaveLength(6);
  });

  it('due 100 + new 80, N=20, R=0.3 → due 14 + new 6 (정원 유지)', () => {
    const dueProgress = Array.from({ length: 100 }, (_, i) =>
      makeCard({ cardId: `due_${i}`, dueAt: NOW - (i + 1) * DAY }),
    );
    const contentIds = [
      ...dueProgress.map((p) => p.cardId),
      ...Array.from({ length: 80 }, (_, i) => `new_${i}`),
    ];
    const queue = composeQueue({
      progress: dueProgress,
      contentIds,
      marks: new Map(),
      sessionSize: 20,
      newCardRatio: 0.3,
      now: NOW,
    });
    expect(queue).toHaveLength(20);
    expect(queue.filter((id) => id.startsWith('due_'))).toHaveLength(14);
  });
});

describe('composeQueue — empty', () => {
  it('due 0 + new 0 → 빈 배열', () => {
    const queue = composeQueue({
      progress: [],
      contentIds: [],
      marks: new Map(),
      sessionSize: 20,
      newCardRatio: 0.3,
      now: NOW,
    });
    expect(queue).toEqual([]);
  });

  it('contentIds < N 일 때 보유분만 반환', () => {
    const contentIds = ['a', 'b', 'c'];
    const queue = composeQueue({
      progress: [],
      contentIds,
      marks: new Map(),
      sessionSize: 20,
      newCardRatio: 0.3,
      now: NOW,
    });
    expect(queue).toHaveLength(3);
  });
});

describe('composeQueue — due 정렬 (dueAt 오래된 순)', () => {
  it('due 카드는 dueAt 오름차순으로 우선 선택', () => {
    const progress = [
      makeCard({ cardId: 'mid', dueAt: NOW - 5 * DAY }),
      makeCard({ cardId: 'oldest', dueAt: NOW - 10 * DAY }),
      makeCard({ cardId: 'newest', dueAt: NOW - 1 * DAY }),
    ];
    const contentIds = progress.map((p) => p.cardId);
    const queue = composeQueue({
      progress,
      contentIds,
      marks: new Map(),
      sessionSize: 2,
      newCardRatio: 0,
      now: NOW,
    });
    // dueCount = floor(2 * 1) = 2 → oldest, mid 선택
    expect(queue).toContain('oldest');
    expect(queue).toContain('mid');
    expect(queue).not.toContain('newest');
  });
});

describe('composeQueue — 마킹 가중치 (M5)', () => {
  it('unknown 마킹 카드가 신규 풀에서 우선 등장', () => {
    // unknown 100개 / unmarked 100개 / known 100개 / N=20·R=1 (전부 신규)
    const contentIds = [
      ...Array.from({ length: 100 }, (_, i) => `unk_${i}`),
      ...Array.from({ length: 100 }, (_, i) => `none_${i}`),
      ...Array.from({ length: 100 }, (_, i) => `kn_${i}`),
    ];
    const marks = new Map<string, 'known' | 'unknown'>();
    for (let i = 0; i < 100; i++) marks.set(`unk_${i}`, 'unknown');
    for (let i = 0; i < 100; i++) marks.set(`kn_${i}`, 'known');

    const queue = composeQueue({
      progress: [],
      contentIds,
      marks,
      sessionSize: 20,
      newCardRatio: 1,
      now: NOW,
    });
    expect(queue).toHaveLength(20);
    const unkCount = queue.filter((id) => id.startsWith('unk_')).length;
    const noneCount = queue.filter((id) => id.startsWith('none_')).length;
    const knCount = queue.filter((id) => id.startsWith('kn_')).length;
    // 가중치 70/25/5 → 14 / 5 / 1
    expect(unkCount).toBe(14);
    expect(noneCount).toBe(5);
    expect(knCount).toBe(1);
  });

  it('known 마킹도 5% 비율로 등장 (자기평가 검증 기회)', () => {
    const contentIds = Array.from({ length: 100 }, (_, i) => `kn_${i}`);
    const marks = new Map<string, 'known' | 'unknown'>();
    for (const id of contentIds) marks.set(id, 'known');

    const queue = composeQueue({
      progress: [],
      contentIds,
      marks,
      sessionSize: 20,
      newCardRatio: 1,
      now: NOW,
    });
    // known 100개만 있으니 fallback으로 채워서 20개
    expect(queue).toHaveLength(20);
  });
});

describe('composeQueue — channel fallback', () => {
  it('unknown 부족 → unmarked·known으로 보충', () => {
    const contentIds = [
      ...Array.from({ length: 5 }, (_, i) => `unk_${i}`), // 부족
      ...Array.from({ length: 100 }, (_, i) => `none_${i}`),
    ];
    const marks = new Map<string, 'known' | 'unknown'>();
    for (let i = 0; i < 5; i++) marks.set(`unk_${i}`, 'unknown');

    const queue = composeQueue({
      progress: [],
      contentIds,
      marks,
      sessionSize: 20,
      newCardRatio: 1,
      now: NOW,
    });
    expect(queue).toHaveLength(20); // 부족분 보충됨
  });
});

describe('composeQueue — 결정론·격리', () => {
  it('Math.random mock으로 결정론 검증', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const contentIds = ['a', 'b', 'c'];
    const queue1 = composeQueue({
      progress: [],
      contentIds,
      marks: new Map(),
      sessionSize: 3,
      newCardRatio: 1,
      now: NOW,
    });
    const queue2 = composeQueue({
      progress: [],
      contentIds,
      marks: new Map(),
      sessionSize: 3,
      newCardRatio: 1,
      now: NOW,
    });
    expect(queue1).toEqual(queue2);
  });
});
