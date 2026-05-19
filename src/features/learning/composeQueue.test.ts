import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CardType, StudyMode } from '@/shared/types';
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

function callQueue(opts: {
  progress?: readonly SrsCard[];
  contentIds: readonly string[];
  allProgressByCardId?: ReadonlyMap<string, readonly SrsCard[]>;
  cardType?: CardType;
  studyMode?: StudyMode;
  sessionSize?: number;
  newCardRatio?: number;
  now?: number;
}): string[] {
  return composeQueue({
    progress: opts.progress ?? [],
    contentIds: opts.contentIds,
    allProgressByCardId: opts.allProgressByCardId ?? new Map(),
    cardType: opts.cardType ?? 'word',
    studyMode: opts.studyMode ?? 'flashcard',
    sessionSize: opts.sessionSize ?? 20,
    newCardRatio: opts.newCardRatio ?? 0.3,
    now: opts.now ?? NOW,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('composeQueue — 신규 only (진도 0)', () => {
  it('due 0 + new 80, N=20, R=0.3 → 20개 모두 new', () => {
    const contentIds = Array.from({ length: 80 }, (_, i) => `w_a1_${i}`);
    const queue = callQueue({ contentIds });
    expect(queue).toHaveLength(20);
    expect(queue.every((id) => contentIds.includes(id))).toBe(true);
  });
});

describe('composeQueue — due + new 혼합', () => {
  it('due 30 + new 80, N=20, R=0.3 → due 14 + new 6', () => {
    const dueProgress = Array.from({ length: 30 }, (_, i) =>
      makeCard({ cardId: `due_${i}`, dueAt: NOW - (i + 1) * DAY }),
    );
    const contentIds = [
      ...dueProgress.map((p) => p.cardId),
      ...Array.from({ length: 80 }, (_, i) => `new_${i}`),
    ];
    const queue = callQueue({ progress: dueProgress, contentIds });
    expect(queue).toHaveLength(20);
    expect(queue.filter((id) => id.startsWith('due_'))).toHaveLength(14);
    expect(queue.filter((id) => id.startsWith('new_'))).toHaveLength(6);
  });
});

describe('composeQueue — empty', () => {
  it('빈 입력 → 빈 배열', () => {
    expect(callQueue({ contentIds: [] })).toEqual([]);
  });

  it('contentIds < N 일 때 보유분만 반환', () => {
    expect(callQueue({ contentIds: ['a', 'b', 'c'] })).toHaveLength(3);
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
    const queue = callQueue({
      progress,
      contentIds,
      sessionSize: 2,
      newCardRatio: 0,
    });
    expect(queue).toContain('oldest');
    expect(queue).toContain('mid');
    expect(queue).not.toContain('newest');
  });
});

describe('composeQueue — word flashcard 큐 (학습 mode, 미학습 위주)', () => {
  it('가중치 fresh 60 / unknown 25 / reverse(recall good) 10 / mastered 5', () => {
    // 100 fresh + 100 unknown + 100 reverse(recall good) + 100 mastered(둘 다 good)
    const contentIds: string[] = [];
    const allProgress = new Map<string, SrsCard[]>();

    for (let i = 0; i < 100; i++) contentIds.push(`fresh_${i}`);
    for (let i = 0; i < 100; i++) {
      const id = `unk_${i}`;
      contentIds.push(id);
      allProgress.set(id, [
        makeCard({ cardId: id, studyMode: 'recall', lastRating: 'again', state: 'new' }),
      ]);
    }
    for (let i = 0; i < 100; i++) {
      const id = `rev_${i}`;
      contentIds.push(id);
      allProgress.set(id, [
        makeCard({ cardId: id, studyMode: 'recall', lastRating: 'good', state: 'new' }),
      ]);
    }
    for (let i = 0; i < 100; i++) {
      const id = `mas_${i}`;
      contentIds.push(id);
      allProgress.set(id, [
        makeCard({ cardId: id, studyMode: 'recall', lastRating: 'good', state: 'new' }),
        makeCard({ cardId: id, studyMode: 'flashcard', lastRating: 'good', state: 'new' }),
      ]);
    }

    const queue = callQueue({
      contentIds,
      allProgressByCardId: allProgress,
      cardType: 'word',
      studyMode: 'flashcard',
      newCardRatio: 1,
      sessionSize: 20,
    });
    expect(queue).toHaveLength(20);
    const fresh = queue.filter((id) => id.startsWith('fresh_')).length;
    const unk = queue.filter((id) => id.startsWith('unk_')).length;
    const rev = queue.filter((id) => id.startsWith('rev_')).length;
    const mas = queue.filter((id) => id.startsWith('mas_')).length;
    // 가중치 60/25/10/5 → 12/5/2/1
    expect(fresh).toBe(12);
    expect(unk).toBe(5);
    expect(rev).toBe(2);
    expect(mas).toBe(1);
  });
});

describe('composeQueue — word recall 큐 (검증 mode, flashcard 통과 우선)', () => {
  it('가중치 reverse(flashcard good) 70 / fresh 25 / unknown 4 / mastered 1', () => {
    const contentIds: string[] = [];
    const allProgress = new Map<string, SrsCard[]>();

    for (let i = 0; i < 100; i++) contentIds.push(`fresh_${i}`);
    for (let i = 0; i < 100; i++) {
      const id = `unk_${i}`;
      contentIds.push(id);
      allProgress.set(id, [
        makeCard({ cardId: id, studyMode: 'flashcard', lastRating: 'again', state: 'new' }),
      ]);
    }
    for (let i = 0; i < 100; i++) {
      const id = `rev_${i}`;
      contentIds.push(id);
      allProgress.set(id, [
        makeCard({ cardId: id, studyMode: 'flashcard', lastRating: 'good', state: 'new' }),
      ]);
    }
    for (let i = 0; i < 100; i++) {
      const id = `mas_${i}`;
      contentIds.push(id);
      allProgress.set(id, [
        makeCard({ cardId: id, studyMode: 'recall', lastRating: 'good', state: 'new' }),
        makeCard({ cardId: id, studyMode: 'flashcard', lastRating: 'good', state: 'new' }),
      ]);
    }

    const queue = callQueue({
      contentIds,
      allProgressByCardId: allProgress,
      cardType: 'word',
      studyMode: 'recall',
      newCardRatio: 1,
      sessionSize: 20,
    });
    expect(queue).toHaveLength(20);
    const fresh = queue.filter((id) => id.startsWith('fresh_')).length;
    const unk = queue.filter((id) => id.startsWith('unk_')).length;
    const rev = queue.filter((id) => id.startsWith('rev_')).length;
    const mas = queue.filter((id) => id.startsWith('mas_')).length;
    // 70/25/4/1 → 14/5/1/0 (반올림 4% → 1 카드, mastered 1% → 0)
    expect(rev).toBe(14);
    expect(fresh).toBe(5);
    expect(unk).toBe(1);
    expect(mas).toBe(0);
  });
});

describe('composeQueue — sentence (대칭 검증 유도)', () => {
  it('sentence flashcard 큐: cloze 통과 카드 70% / fresh 25 / unknown 4 / mastered 1', () => {
    const contentIds: string[] = [];
    const allProgress = new Map<string, SrsCard[]>();

    for (let i = 0; i < 100; i++) contentIds.push(`fresh_${i}`);
    for (let i = 0; i < 100; i++) {
      const id = `unk_${i}`;
      contentIds.push(id);
      allProgress.set(id, [
        makeCard({
          cardId: id,
          cardType: 'sentence',
          studyMode: 'cloze',
          lastRating: 'again',
          state: 'new',
        }),
      ]);
    }
    for (let i = 0; i < 100; i++) {
      const id = `rev_${i}`;
      contentIds.push(id);
      allProgress.set(id, [
        makeCard({
          cardId: id,
          cardType: 'sentence',
          studyMode: 'cloze',
          lastRating: 'good',
          state: 'new',
        }),
      ]);
    }
    for (let i = 0; i < 100; i++) {
      const id = `mas_${i}`;
      contentIds.push(id);
      allProgress.set(id, [
        makeCard({
          cardId: id,
          cardType: 'sentence',
          studyMode: 'flashcard',
          lastRating: 'good',
          state: 'new',
        }),
        makeCard({
          cardId: id,
          cardType: 'sentence',
          studyMode: 'cloze',
          lastRating: 'good',
          state: 'new',
        }),
      ]);
    }

    const queue = callQueue({
      contentIds,
      allProgressByCardId: allProgress,
      cardType: 'sentence',
      studyMode: 'flashcard',
      newCardRatio: 1,
      sessionSize: 20,
    });
    expect(queue).toHaveLength(20);
    // 가중치 70/25/4/1 → 14/5/1/0
    expect(queue.filter((id) => id.startsWith('rev_'))).toHaveLength(14);
    expect(queue.filter((id) => id.startsWith('fresh_'))).toHaveLength(5);
    expect(queue.filter((id) => id.startsWith('unk_'))).toHaveLength(1);
    expect(queue.filter((id) => id.startsWith('mas_'))).toHaveLength(0);
  });

  it('sentence mastered = flashcard.good && cloze.good (둘 다)', () => {
    const allProgress = new Map<string, SrsCard[]>([
      [
        'card_only_fc',
        [
          makeCard({
            cardId: 'card_only_fc',
            cardType: 'sentence',
            studyMode: 'flashcard',
            lastRating: 'good',
            state: 'new',
          }),
        ],
      ],
      [
        'card_both',
        [
          makeCard({
            cardId: 'card_both',
            cardType: 'sentence',
            studyMode: 'flashcard',
            lastRating: 'good',
            state: 'new',
          }),
          makeCard({
            cardId: 'card_both',
            cardType: 'sentence',
            studyMode: 'cloze',
            lastRating: 'good',
            state: 'new',
          }),
        ],
      ],
    ]);
    // sentence cloze 큐 — card_only_fc 는 reverse (flashcard 통과만), card_both 는 mastered
    const contentIds = ['card_only_fc', 'card_both'];
    const queue = callQueue({
      contentIds,
      allProgressByCardId: allProgress,
      cardType: 'sentence',
      studyMode: 'cloze',
      newCardRatio: 1,
      sessionSize: 2,
    });
    // reverse 70% → 1.4 → 1, mastered 1% → 0, fallback 으로 둘 다 노출
    expect(queue).toHaveLength(2);
    expect(queue).toContain('card_only_fc');
    expect(queue).toContain('card_both');
  });
});

describe('composeQueue — 결정론·격리', () => {
  it('Math.random mock으로 결정론 검증', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const contentIds = ['a', 'b', 'c'];
    const queue1 = callQueue({ contentIds, sessionSize: 3, newCardRatio: 1 });
    const queue2 = callQueue({ contentIds, sessionSize: 3, newCardRatio: 1 });
    expect(queue1).toEqual(queue2);
  });
});
