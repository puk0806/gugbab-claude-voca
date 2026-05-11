import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, resetDb } from '../schema';
import { clearMark, countMarksByLevel, getMark, listMarksByLevel, setMark } from './markRepo';

const NOW = Date.parse('2026-05-10T00:00:00Z');

describe('markRepo (단어장 마킹, M5)', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await db.delete();
  });

  describe('getMark + setMark', () => {
    it('미존재 cardId → null', async () => {
      expect(await getMark('w_a1_999')).toBeNull();
    });

    it('known 마킹 후 조회 가능', async () => {
      await setMark('w_a1_001', 'word', 'A1', 'known', NOW);
      expect(await getMark('w_a1_001')).toBe('known');
    });

    it('동일 cardId 재마킹 시 갱신 (insert 아님)', async () => {
      await setMark('w_a1_001', 'word', 'A1', 'known', NOW);
      await setMark('w_a1_001', 'word', 'A1', 'unknown', NOW + 1000);
      expect(await getMark('w_a1_001')).toBe('unknown');
      expect(await db.cardMark.count()).toBe(1);
    });
  });

  describe('clearMark', () => {
    it('마킹 해제 → null 반환', async () => {
      await setMark('w_a1_001', 'word', 'A1', 'known', NOW);
      await clearMark('w_a1_001');
      expect(await getMark('w_a1_001')).toBeNull();
    });

    it('미존재 마킹 해제는 noop (에러 X)', async () => {
      await clearMark('w_a1_999');
      expect(await getMark('w_a1_999')).toBeNull();
    });
  });

  describe('listMarksByLevel (composeQueue가 사용)', () => {
    it('레벨 + cardType의 모든 마킹을 Map으로', async () => {
      await setMark('w_a1_001', 'word', 'A1', 'known', NOW);
      await setMark('w_a1_002', 'word', 'A1', 'unknown', NOW);
      await setMark('w_a2_001', 'word', 'A2', 'known', NOW); // 다른 레벨

      const map = await listMarksByLevel('word', 'A1');
      expect(map.size).toBe(2);
      expect(map.get('w_a1_001')).toBe('known');
      expect(map.get('w_a1_002')).toBe('unknown');
      expect(map.has('w_a2_001')).toBe(false);
    });

    it('마킹 0개 → 빈 Map', async () => {
      const map = await listMarksByLevel('word', 'A1');
      expect(map.size).toBe(0);
    });
  });

  describe('countMarksByLevel', () => {
    it('known·unknown 카운트 분리 반환', async () => {
      await setMark('w1', 'word', 'A1', 'known', NOW);
      await setMark('w2', 'word', 'A1', 'known', NOW);
      await setMark('w3', 'word', 'A1', 'unknown', NOW);
      const counts = await countMarksByLevel('word', 'A1');
      expect(counts).toEqual({ known: 2, unknown: 1 });
    });

    it('마킹 0개 → 0/0', async () => {
      expect(await countMarksByLevel('word', 'A1')).toEqual({ known: 0, unknown: 0 });
    });
  });
});
