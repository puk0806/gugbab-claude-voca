/**
 * cardMark 테이블 repository (M5: 단어장 마킹).
 *
 * 마킹은 cardId 단위로 1개 (모드 무관). null 마킹은 row 자체 미존재로 표현 (storage 절약).
 * UserMark 값: 'known' | 'unknown' | 'mastered' (+ null).
 */
import type { CardType, CEFR, UserMark } from '@/shared/types';
import { db } from '../schema';
import type { CardMarkRow } from '../types';

type NonNullMark = Exclude<UserMark, null>;

/**
 * 단일 카드의 마킹 조회.
 * row 미존재 시 null 반환.
 */
export async function getMark(cardId: string): Promise<UserMark> {
  const row = await db.cardMark.get(cardId);
  return row?.mark ?? null;
}

/**
 * 마킹 설정 (known/unknown/mastered).
 * 동일 cardId의 기존 row를 갱신.
 */
export async function setMark(
  cardId: string,
  cardType: CardType,
  level: CEFR,
  mark: NonNullMark,
  now: number,
): Promise<void> {
  const row: CardMarkRow = { cardId, cardType, level, mark, markedAt: now };
  await db.cardMark.put(row);
}

/**
 * 마킹 해제 (null로 전환). row 자체 삭제로 처리.
 */
export async function clearMark(cardId: string): Promise<void> {
  await db.cardMark.delete(cardId);
}

/**
 * 레벨 + 콘텐츠 타입의 모든 마킹을 Map으로 반환.
 * composeQueue가 가중치 분배 시 사용 (M5).
 */
export async function listMarksByLevel(
  cardType: CardType,
  level: CEFR,
): Promise<Map<string, NonNullMark>> {
  const rows = await db.cardMark
    .where('[cardType+level+mark]')
    .between([cardType, level, ''], [cardType, level, '￿'])
    .toArray();
  const map = new Map<string, NonNullMark>();
  for (const row of rows) {
    map.set(row.cardId, row.mark);
  }
  return map;
}

/**
 * 마킹별 카운트 (단어장 필터 표시용).
 */
export async function countMarksByLevel(
  cardType: CardType,
  level: CEFR,
): Promise<{ known: number; unknown: number; mastered: number }> {
  const known = await db.cardMark
    .where('[cardType+level+mark]')
    .equals([cardType, level, 'known'])
    .count();
  const unknown = await db.cardMark
    .where('[cardType+level+mark]')
    .equals([cardType, level, 'unknown'])
    .count();
  const mastered = await db.cardMark
    .where('[cardType+level+mark]')
    .equals([cardType, level, 'mastered'])
    .count();
  return { known, unknown, mastered };
}
