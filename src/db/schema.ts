/**
 * Dexie v1 스키마.
 *
 * 테이블 4개:
 *   - cardProgress: SRS 진도 (M1: 복합 PK [cardId+studyMode])
 *   - cardMark: 단어장 마킹 (M5: cardId 단위)
 *   - appSettings: key-value 설정
 *   - sessionLog: 학습 세션 로그 (P1)
 *
 * 본 모듈은 단일 db 인스턴스(`db`)를 export. 테스트에서는 `resetDb`로 격리.
 *
 * 인덱스 설계 (아키텍처 §4.3):
 *   - [studyMode+cardType+level+dueAt] — 학습 시작 시 due 카드 단일 인덱스 스캔
 *   - [studyMode+cardType+level+state] — 신규 카드 카운트
 *   - [cardType+level+mark] — 단어장에서 mark별 필터·카운트
 *   - [level+cardType+studyMode+startedAt] — 통계 화면 매트릭스 집계
 */
import Dexie, { type Table } from 'dexie';
import type { SrsCard } from '@/srs/types';
import type { AppSettingRow, CardMarkRow, SessionLogRow } from './types';

const DB_NAME = 'gugbab-voca';
const DB_VERSION = 1;

export class GugbabVocaDB extends Dexie {
  // Dexie 표준 패턴: `declare`로 타입만 선언, 실제 초기화는 version().stores().
  // (`!` 단언을 피해 noNonNullAssertion 룰과 호환)
  declare cardProgress: Table<SrsCard, [string, string]>;
  declare cardMark: Table<CardMarkRow, string>;
  declare appSettings: Table<AppSettingRow, string>;
  declare sessionLog: Table<SessionLogRow, number>;

  constructor(dbName: string = DB_NAME) {
    super(dbName);
    this.version(DB_VERSION).stores({
      cardProgress:
        '&[cardId+studyMode], cardId, studyMode, cardType, level, state, dueAt, [studyMode+cardType+level+dueAt], [studyMode+cardType+level+state]',
      cardMark: '&cardId, cardType, level, mark, [cardType+level+mark]',
      appSettings: '&key',
      sessionLog:
        '++id, startedAt, level, cardType, studyMode, [level+cardType+studyMode+startedAt]',
    });
  }
}

export const db = new GugbabVocaDB();

/**
 * 테스트 격리용. production 코드에서 호출 X.
 */
export async function resetDb(): Promise<void> {
  await db.delete();
  await db.open();
}
