import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, GugbabVocaDB, resetDb } from './schema';

describe('GugbabVocaDB schema v1', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('DB 인스턴스가 정상 생성된다', () => {
    expect(db).toBeInstanceOf(GugbabVocaDB);
    expect(db.name).toBe('gugbab-voca');
  });

  it('4개 테이블이 정의된다', () => {
    const tableNames = db.tables.map((t) => t.name).sort();
    expect(tableNames).toEqual(['appSettings', 'cardMark', 'cardProgress', 'sessionLog']);
  });

  it('cardProgress: 복합 PK [cardId+studyMode] (M1)', () => {
    const table = db.table('cardProgress');
    expect(table.schema.primKey.keyPath).toEqual(['cardId', 'studyMode']);
  });

  it('cardProgress: due 조회용 복합 인덱스 [studyMode+cardType+level+dueAt] 존재', () => {
    const table = db.table('cardProgress');
    const indexes = table.schema.indexes.map((i) => i.name);
    expect(indexes).toContain('[studyMode+cardType+level+dueAt]');
  });

  it('cardMark: PK = cardId, 마킹 인덱스 [cardType+level+mark] 존재', () => {
    const table = db.table('cardMark');
    expect(table.schema.primKey.keyPath).toBe('cardId');
    const indexes = table.schema.indexes.map((i) => i.name);
    expect(indexes).toContain('[cardType+level+mark]');
  });

  it('appSettings: PK = key', () => {
    const table = db.table('appSettings');
    expect(table.schema.primKey.keyPath).toBe('key');
  });

  it('sessionLog: auto-increment id + 통계 매트릭스 인덱스', () => {
    const table = db.table('sessionLog');
    expect(table.schema.primKey.auto).toBe(true);
    const indexes = table.schema.indexes.map((i) => i.name);
    expect(indexes).toContain('[level+cardType+studyMode+startedAt]');
  });
});
