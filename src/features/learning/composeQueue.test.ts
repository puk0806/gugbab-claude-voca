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

describe('composeQueue — due + new 혼합 (진행률 적응)', () => {
  it('진행률 낮음(27%): 틀린 due 30 + new 80, N=20, R=0.3 → 신규 비율 상향으로 due 9 + new 11', () => {
    // 50% 미만에선 통과(good) due 는 숨겨지므로, 비율 검증은 틀린(again) due 로 구성
    const dueProgress = Array.from({ length: 30 }, (_, i) =>
      makeCard({
        cardId: `due_${i}`,
        dueAt: NOW - (i + 1) * DAY,
        state: 'relearning',
        lastRating: 'again',
      }),
    );
    const contentIds = [
      ...dueProgress.map((p) => p.cardId),
      ...Array.from({ length: 80 }, (_, i) => `new_${i}`),
    ];
    // coverage = 30/110 ≈ 0.27 → 유효 R = 0.6 - 0.3×0.27 ≈ 0.52 → due floor(20×0.48) = 9
    const allProgress = new Map(dueProgress.map((p) => [p.cardId, [p]]));
    const queue = callQueue({
      progress: dueProgress,
      contentIds,
      allProgressByCardId: allProgress,
    });
    expect(queue).toHaveLength(20);
    expect(queue.filter((id) => id.startsWith('due_'))).toHaveLength(9);
    expect(queue.filter((id) => id.startsWith('new_'))).toHaveLength(11);
  });

  it('진행률 100%: due 30 + 통과 80, N=20, R=0.3 → 현행 due 14 + new 6 으로 수렴', () => {
    const dueProgress = Array.from({ length: 30 }, (_, i) =>
      makeCard({ cardId: `due_${i}`, dueAt: NOW - (i + 1) * DAY }),
    );
    const passedIds = Array.from({ length: 80 }, (_, i) => `new_${i}`);
    const contentIds = [...dueProgress.map((p) => p.cardId), ...passedIds];
    // 모든 카드에 응답 이력 → coverage = 1 → 유효 R = 0.3 (기존 동작)
    const allProgress = new Map<string, SrsCard[]>(dueProgress.map((p) => [p.cardId, [p]]));
    for (const id of passedIds) {
      allProgress.set(id, [
        makeCard({ cardId: id, studyMode: 'recall', lastRating: 'good', state: 'new' }),
      ]);
    }
    const queue = callQueue({
      progress: dueProgress,
      contentIds,
      allProgressByCardId: allProgress,
    });
    expect(queue).toHaveLength(20);
    expect(queue.filter((id) => id.startsWith('due_'))).toHaveLength(14);
    expect(queue.filter((id) => id.startsWith('new_'))).toHaveLength(6);
  });
});

describe('composeQueue — 통과 카드 숨김 (진행률 50% 미만, flashcard 큐)', () => {
  it('통과(good) due 8개는 전부 숨겨지고 큐가 신규로만 채워진다', () => {
    // "통과 8개" 시나리오 — coverage 8/88 ≈ 9%
    const passedDue = Array.from({ length: 8 }, (_, i) =>
      makeCard({ cardId: `due_${i}`, dueAt: NOW - DAY }),
    );
    const contentIds = [
      ...passedDue.map((p) => p.cardId),
      ...Array.from({ length: 80 }, (_, i) => `new_${i}`),
    ];
    const allProgress = new Map(passedDue.map((p) => [p.cardId, [p]]));
    const queue = callQueue({
      progress: passedDue,
      contentIds,
      allProgressByCardId: allProgress,
    });
    expect(queue).toHaveLength(20);
    expect(queue.filter((id) => id.startsWith('due_'))).toHaveLength(0);
    expect(queue.filter((id) => id.startsWith('new_'))).toHaveLength(20);
  });

  it('틀린(again) due 는 숨기지 않는다 — 통과 8 숨김 + 틀린 3 유지', () => {
    const passedDue = Array.from({ length: 8 }, (_, i) =>
      makeCard({ cardId: `pass_${i}`, dueAt: NOW - DAY }),
    );
    const failedDue = Array.from({ length: 3 }, (_, i) =>
      makeCard({
        cardId: `fail_${i}`,
        dueAt: NOW - DAY,
        state: 'relearning',
        lastRating: 'again',
      }),
    );
    const progress = [...passedDue, ...failedDue];
    const contentIds = [
      ...progress.map((p) => p.cardId),
      ...Array.from({ length: 80 }, (_, i) => `new_${i}`),
    ];
    const allProgress = new Map(progress.map((p) => [p.cardId, [p]]));
    const queue = callQueue({ progress, contentIds, allProgressByCardId: allProgress });
    expect(queue).toHaveLength(20);
    expect(queue.filter((id) => id.startsWith('pass_'))).toHaveLength(0);
    expect(queue.filter((id) => id.startsWith('fail_'))).toHaveLength(3);
    expect(queue.filter((id) => id.startsWith('new_'))).toHaveLength(17);
  });

  it('검증 큐(word recall)는 50% 미만에도 통과 카드가 그대로 나온다', () => {
    // flashcard 통과 100 + fresh 900 → coverage 0.1, recall 큐
    const contentIds: string[] = [];
    const allProgress = new Map<string, SrsCard[]>();
    for (let i = 0; i < 900; i++) contentIds.push(`fresh_${i}`);
    for (let i = 0; i < 100; i++) {
      const id = `rev_${i}`;
      contentIds.push(id);
      allProgress.set(id, [
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
    // 고정 가중치 reverse 70% → 14장 (숨김 미적용)
    expect(queue.filter((id) => id.startsWith('rev_'))).toHaveLength(14);
  });

  it('진행률 50% 이상이면 통과 due 도 정상 노출된다', () => {
    // 통과 due 30 + fresh 20 → coverage 30/50 = 0.6 (≥ 0.5)
    const passedDue = Array.from({ length: 30 }, (_, i) =>
      makeCard({ cardId: `due_${i}`, dueAt: NOW - (i + 1) * DAY }),
    );
    const contentIds = [
      ...passedDue.map((p) => p.cardId),
      ...Array.from({ length: 20 }, (_, i) => `new_${i}`),
    ];
    const allProgress = new Map(passedDue.map((p) => [p.cardId, [p]]));
    const queue = callQueue({
      progress: passedDue,
      contentIds,
      allProgressByCardId: allProgress,
    });
    // coverage 0.6 → 유효 R = 0.6-0.3×0.6 = 0.42 → due floor(20×0.58) = 11
    expect(queue.filter((id) => id.startsWith('due_'))).toHaveLength(11);
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
      // coverage = 1 → R=0 그대로 (전량 due)
      allProgressByCardId: new Map(progress.map((p) => [p.cardId, [p]])),
      sessionSize: 2,
      newCardRatio: 0,
    });
    expect(queue).toContain('oldest');
    expect(queue).toContain('mid');
    expect(queue).not.toContain('newest');
  });
});

describe('composeQueue — word flashcard 큐 (학습 mode, 미학습 위주)', () => {
  it('진행률 10%: fresh 우대 (16/3/1/0) — coverage 앵커 0.8/0.15/0.04/0.01 쪽으로 보간', () => {
    // 900 fresh + 40 unknown + 40 reverse + 20 mastered = 1000, coverage = 0.1
    const contentIds: string[] = [];
    const allProgress = new Map<string, SrsCard[]>();

    for (let i = 0; i < 900; i++) contentIds.push(`fresh_${i}`);
    for (let i = 0; i < 40; i++) {
      const id = `unk_${i}`;
      contentIds.push(id);
      allProgress.set(id, [
        makeCard({ cardId: id, studyMode: 'recall', lastRating: 'again', state: 'new' }),
      ]);
    }
    for (let i = 0; i < 40; i++) {
      const id = `rev_${i}`;
      contentIds.push(id);
      allProgress.set(id, [
        makeCard({ cardId: id, studyMode: 'recall', lastRating: 'good', state: 'new' }),
      ]);
    }
    for (let i = 0; i < 20; i++) {
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
    // lerp(coverage 0.1): fresh 0.78→16, unknown 0.16→3
    // 50% 미만이라 통과 클래스(reverse·both)는 숨김 → 잔여 1장은 fresh/unknown fallback
    expect(queue.filter((id) => id.startsWith('fresh_')).length).toBeGreaterThanOrEqual(16);
    expect(queue.filter((id) => id.startsWith('unk_')).length).toBeGreaterThanOrEqual(3);
    expect(queue.filter((id) => id.startsWith('rev_'))).toHaveLength(0);
    expect(queue.filter((id) => id.startsWith('mas_'))).toHaveLength(0);
  });

  it('진행률 75%: 가중치 fresh 65 / unknown 22.5 / reverse 8.5 / mastered 4 로 보간', () => {
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
    // coverage 0.75 보간: fresh 0.65→13, unknown 0.225→5, reverse 0.085→2 (여기서 20 도달)
    // bothPassed 0.04→1 은 cap 에서 잘림 (우선순위 최하)
    expect(fresh).toBe(13);
    expect(unk).toBe(5);
    expect(rev).toBe(2);
    expect(mas).toBe(0);
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
