/**
 * sessionLog 테이블 repository (P1: 학습 세션 로그).
 *
 * 학습 시작 시 createSession → 종료 시 endSession.
 * 통계 화면(P2)에서 listRecent + 매트릭스 집계 사용.
 */
import type { CardType, CEFR, StudyMode } from '@/shared/types';
import { db } from '../schema';
import type { SessionLogRow } from '../types';

export interface CreateSessionInput {
  readonly startedAt: number;
  readonly level: CEFR;
  readonly cardType: CardType;
  readonly studyMode: StudyMode;
}

export interface EndSessionInput {
  readonly endedAt: number;
  readonly cardsSeen: number;
  readonly goodCount: number;
  readonly againCount: number;
}

/**
 * 새 세션 row 생성. id는 auto-increment.
 */
export async function createSession(input: CreateSessionInput): Promise<number> {
  const row: SessionLogRow = {
    startedAt: input.startedAt,
    endedAt: null,
    level: input.level,
    cardType: input.cardType,
    studyMode: input.studyMode,
    cardsSeen: 0,
    goodCount: 0,
    againCount: 0,
  };
  return (await db.sessionLog.add(row as SessionLogRow & { id?: number })) as number;
}

/**
 * 세션 종료 시 endedAt + 결과 집계 갱신.
 * 미존재 id면 던지지 않고 noop (테스트 가능성).
 */
export async function endSession(id: number, input: EndSessionInput): Promise<void> {
  await db.sessionLog.update(id, input);
}

/**
 * 최근 N개 세션 (통계 화면용). startedAt 내림차순.
 */
export async function listRecent(limit: number): Promise<SessionLogRow[]> {
  return await db.sessionLog.orderBy('startedAt').reverse().limit(limit).toArray();
}

/**
 * 단일 세션 조회 (요약 화면 직접 진입 시).
 */
export async function getSession(id: number): Promise<SessionLogRow | undefined> {
  return await db.sessionLog.get(id);
}
