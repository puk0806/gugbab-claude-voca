import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SrsCard } from '@/srs/types';
import { db, resetDb } from '../schema';
import {
  countDue,
  getAllProgressByCardId,
  getAllProgressByLevel,
  getDueCards,
  getNewProgress,
  getProgress,
  upsertProgress,
} from './progressRepo';

const NOW = Date.parse('2026-05-10T00:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

function makeCard(overrides: Partial<SrsCard> = {}): SrsCard {
  return {
    cardId: 'w_a1_001',
    studyMode: 'flashcard',
    cardType: 'word',
    level: 'A1',
    state: 'review',
    repetitions: 1,
    easeFactor: 2.5,
    intervalDays: 1,
    dueAt: NOW,
    lastReviewedAt: NOW - DAY,
    lapses: 0,
    lastRating: 'good',
    ...overrides,
  };
}

describe('progressRepo', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await db.delete();
  });

  describe('upsertProgress + getProgress', () => {
    it('insert 후 같은 PK로 조회 가능', async () => {
      const card = makeCard();
      await upsertProgress(card);
      const got = await getProgress(card.cardId, card.studyMode);
      expect(got?.cardId).toBe(card.cardId);
      expect(got?.repetitions).toBe(1);
    });

    it('동일 PK 두 번 put → update (insert 아님)', async () => {
      await upsertProgress(makeCard({ repetitions: 1 }));
      await upsertProgress(makeCard({ repetitions: 5 }));
      const got = await getProgress('w_a1_001', 'flashcard');
      expect(got?.repetitions).toBe(5);
      const total = await db.cardProgress.count();
      expect(total).toBe(1);
    });

    it('같은 cardId 다른 studyMode → 별도 row (M1 복합 PK)', async () => {
      await upsertProgress(makeCard({ studyMode: 'flashcard' }));
      await upsertProgress(makeCard({ studyMode: 'recall' }));
      const total = await db.cardProgress.count();
      expect(total).toBe(2);
    });

    it('미존재 PK 조회 시 undefined', async () => {
      const got = await getProgress('w_a1_999', 'flashcard');
      expect(got).toBeUndefined();
    });
  });

  describe('getDueCards (학습 시작 시 핵심 쿼리)', () => {
    it('dueAt <= now AND state != "new" 만 반환', async () => {
      await upsertProgress(makeCard({ cardId: 'past', dueAt: NOW - DAY }));
      await upsertProgress(makeCard({ cardId: 'future', dueAt: NOW + DAY }));
      await upsertProgress(makeCard({ cardId: 'newCard', dueAt: NOW - DAY, state: 'new' }));

      const due = await getDueCards('flashcard', 'word', 'A1', NOW);
      expect(due.map((c) => c.cardId)).toEqual(['past']);
    });

    it('dueAt 오름차순 정렬 (오래된 순)', async () => {
      await upsertProgress(makeCard({ cardId: 'b', dueAt: NOW - DAY }));
      await upsertProgress(makeCard({ cardId: 'a', dueAt: NOW - 2 * DAY }));
      await upsertProgress(makeCard({ cardId: 'c', dueAt: NOW - 0.5 * DAY }));

      const due = await getDueCards('flashcard', 'word', 'A1', NOW);
      expect(due.map((c) => c.cardId)).toEqual(['a', 'b', 'c']);
    });

    it('다른 모드/레벨 카드 제외', async () => {
      await upsertProgress(makeCard({ cardId: 'match', dueAt: NOW - DAY }));
      await upsertProgress(
        makeCard({ cardId: 'wrong-mode', dueAt: NOW - DAY, studyMode: 'recall' }),
      );
      await upsertProgress(makeCard({ cardId: 'wrong-level', dueAt: NOW - DAY, level: 'A2' }));

      const due = await getDueCards('flashcard', 'word', 'A1', NOW);
      expect(due.map((c) => c.cardId)).toEqual(['match']);
    });
  });

  describe('countDue', () => {
    it('due 카드 수 반환', async () => {
      await upsertProgress(makeCard({ cardId: 'a', dueAt: NOW - DAY }));
      await upsertProgress(makeCard({ cardId: 'b', dueAt: NOW - 2 * DAY }));
      await upsertProgress(makeCard({ cardId: 'c', dueAt: NOW + DAY })); // 미래
      const n = await countDue('flashcard', 'word', 'A1', NOW);
      expect(n).toBe(2);
    });
  });

  describe('getNewProgress', () => {
    it('state == "new" 카드만 반환', async () => {
      await upsertProgress(makeCard({ cardId: 'new1', state: 'new' }));
      await upsertProgress(makeCard({ cardId: 'review1', state: 'review' }));
      const news = await getNewProgress('flashcard', 'word', 'A1');
      expect(news.map((c) => c.cardId)).toEqual(['new1']);
    });
  });

  describe('getAllProgressByCardId (단어장 상세 모달용)', () => {
    it('동일 cardId의 모든 모드 진도 반환', async () => {
      await upsertProgress(makeCard({ studyMode: 'flashcard' }));
      await upsertProgress(makeCard({ studyMode: 'recall' }));
      const all = await getAllProgressByCardId('w_a1_001');
      expect(all).toHaveLength(2);
      expect(all.map((c) => c.studyMode).sort()).toEqual(['flashcard', 'recall']);
    });
  });

  describe('getAllProgressByLevel (단어장 학습 우선순위 정렬용)', () => {
    it('cardType + level 일치하는 모든 mode progress 반환', async () => {
      await upsertProgress(makeCard({ cardId: 'a', studyMode: 'flashcard', level: 'A1' }));
      await upsertProgress(makeCard({ cardId: 'a', studyMode: 'recall', level: 'A1' }));
      await upsertProgress(makeCard({ cardId: 'b', studyMode: 'cloze', cardType: 'sentence', level: 'A1' }));
      const wordA1 = await getAllProgressByLevel('word', 'A1');
      expect(wordA1).toHaveLength(2);
      expect(wordA1.map((c) => c.studyMode).sort()).toEqual(['flashcard', 'recall']);
    });

    it('level이 다르면 제외', async () => {
      await upsertProgress(makeCard({ cardId: 'a', level: 'A1' }));
      await upsertProgress(makeCard({ cardId: 'b', level: 'A2' }));
      const a1 = await getAllProgressByLevel('word', 'A1');
      expect(a1).toHaveLength(1);
      expect(a1[0]?.cardId).toBe('a');
    });

    it('cardType이 다르면 제외', async () => {
      await upsertProgress(makeCard({ cardId: 'w_a1_001', cardType: 'word' }));
      await upsertProgress(makeCard({ cardId: 's_a1_001', cardType: 'sentence' }));
      const words = await getAllProgressByLevel('word', 'A1');
      expect(words).toHaveLength(1);
      expect(words[0]?.cardId).toBe('w_a1_001');
    });
  });
});
