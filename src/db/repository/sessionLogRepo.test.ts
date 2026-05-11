import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, resetDb } from '../schema';
import { createSession, endSession, getSession, listRecent } from './sessionLogRepo';

const NOW = Date.parse('2026-05-10T00:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

describe('sessionLogRepo', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await db.delete();
  });

  describe('createSession + getSession', () => {
    it('세션 생성 후 id 반환·조회 가능', async () => {
      const id = await createSession({
        startedAt: NOW,
        level: 'A1',
        cardType: 'word',
        studyMode: 'flashcard',
      });
      expect(typeof id).toBe('number');

      const got = await getSession(id);
      expect(got?.startedAt).toBe(NOW);
      expect(got?.endedAt).toBeNull();
      expect(got?.cardsSeen).toBe(0);
    });

    it('연속 생성 시 id auto-increment', async () => {
      const id1 = await createSession({
        startedAt: NOW,
        level: 'A1',
        cardType: 'word',
        studyMode: 'flashcard',
      });
      const id2 = await createSession({
        startedAt: NOW + 1000,
        level: 'A1',
        cardType: 'word',
        studyMode: 'flashcard',
      });
      expect(id2).toBeGreaterThan(id1);
    });
  });

  describe('endSession', () => {
    it('endedAt + 결과 집계 갱신', async () => {
      const id = await createSession({
        startedAt: NOW,
        level: 'A1',
        cardType: 'word',
        studyMode: 'flashcard',
      });
      await endSession(id, {
        endedAt: NOW + 5 * 60 * 1000,
        cardsSeen: 20,
        goodCount: 17,
        againCount: 3,
      });
      const got = await getSession(id);
      expect(got?.endedAt).toBe(NOW + 5 * 60 * 1000);
      expect(got?.cardsSeen).toBe(20);
      expect(got?.goodCount).toBe(17);
      expect(got?.againCount).toBe(3);
    });
  });

  describe('listRecent', () => {
    it('startedAt 내림차순 (최근 → 과거)', async () => {
      await createSession({
        startedAt: NOW - DAY,
        level: 'A1',
        cardType: 'word',
        studyMode: 'flashcard',
      });
      await createSession({
        startedAt: NOW,
        level: 'A1',
        cardType: 'word',
        studyMode: 'flashcard',
      });
      await createSession({
        startedAt: NOW - 2 * DAY,
        level: 'A1',
        cardType: 'word',
        studyMode: 'flashcard',
      });

      const recent = await listRecent(10);
      expect(recent.map((s) => s.startedAt)).toEqual([NOW, NOW - DAY, NOW - 2 * DAY]);
    });

    it('limit 적용', async () => {
      for (let i = 0; i < 5; i++) {
        await createSession({
          startedAt: NOW + i * 1000,
          level: 'A1',
          cardType: 'word',
          studyMode: 'flashcard',
        });
      }
      const recent = await listRecent(3);
      expect(recent).toHaveLength(3);
    });
  });
});
