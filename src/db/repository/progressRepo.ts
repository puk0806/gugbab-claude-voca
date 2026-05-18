/**
 * cardProgress 테이블 repository.
 *
 * 모든 함수는 외부 시각(now)·검색 조건만 입력으로 받고
 * Dexie 호출 결과를 반환한다. UI/React 의존 0.
 */
import type { CardType, CEFR, StudyMode } from '@/shared/types';
import type { SrsCard } from '@/srs/types';
import { db } from '../schema';
import { type ProgressSummary, summarizeProgress } from './progressSummary';

/**
 * 단일 카드 진도 조회 (cardId + studyMode 복합 PK).
 */
export async function getProgress(
  cardId: string,
  studyMode: StudyMode,
): Promise<SrsCard | undefined> {
  return await db.cardProgress.get([cardId, studyMode]);
}

/**
 * 카드 진도 upsert (insert or update). 동일 [cardId+studyMode] 키 갱신.
 */
export async function upsertProgress(card: SrsCard): Promise<void> {
  await db.cardProgress.put(card);
}

/**
 * 학습 세션 시작 시 due 카드 조회.
 * `[studyMode+cardType+level+dueAt]` 인덱스 단일 스캔.
 *
 * dueAt 오름차순 (가장 오래 묵은 것부터) 정렬 + 'new' 상태 제외.
 */
export async function getDueCards(
  studyMode: StudyMode,
  cardType: CardType,
  level: CEFR,
  now: number,
): Promise<SrsCard[]> {
  return await db.cardProgress
    .where('[studyMode+cardType+level+dueAt]')
    .between([studyMode, cardType, level, 0], [studyMode, cardType, level, now], true, true)
    .filter((card) => card.state !== 'new')
    .sortBy('dueAt');
}

/**
 * 'new' 상태인 카드 진도 조회.
 * (cardProgress에 row가 없는 카드는 별도로 콘텐츠 ID 비교로 식별 — composeQueue가 처리)
 */
export async function getNewProgress(
  studyMode: StudyMode,
  cardType: CardType,
  level: CEFR,
): Promise<SrsCard[]> {
  return await db.cardProgress
    .where('[studyMode+cardType+level+state]')
    .equals([studyMode, cardType, level, 'new'])
    .toArray();
}

/**
 * 레벨 + 모드 조합의 due 카운트 (홈/모드 선택 화면 표시용).
 */
export async function countDue(
  studyMode: StudyMode,
  cardType: CardType,
  level: CEFR,
  now: number,
): Promise<number> {
  return await db.cardProgress
    .where('[studyMode+cardType+level+dueAt]')
    .between([studyMode, cardType, level, 0], [studyMode, cardType, level, now], true, true)
    .filter((card) => card.state !== 'new')
    .count();
}

/**
 * 모든 학습 모드(flashcard·recall·cloze)의 진도를 cardId로 조회.
 * 단어장 상세 모달에서 "모드별 진도" 표시용.
 */
export async function getAllProgressByCardId(cardId: string): Promise<SrsCard[]> {
  return await db.cardProgress.where('cardId').equals(cardId).toArray();
}

/**
 * `(cardType, level)` 범위의 전체 progress 일괄 조회.
 * 모든 studyMode 합쳐서 반환 — 단어장 학습 우선순위 정렬 입력으로 사용.
 *
 * Dexie `cardType` 인덱스 조회 후 `level` in-memory 필터.
 * A1 600개 × 최대 3 mode = 1800 row 한도라 일괄 fetch 비용 무시할 수준.
 */
export async function getAllProgressByLevel(cardType: CardType, level: CEFR): Promise<SrsCard[]> {
  return await db.cardProgress
    .where('cardType')
    .equals(cardType)
    .filter((c) => c.level === level)
    .toArray();
}

/**
 * (cardType, level) 범위의 progress를 cardId 단위로 집계.
 * 학습 진도 표시(Home·Level·Mode loader)에 사용.
 */
export async function getProgressSummary(
  cardType: CardType,
  level: CEFR,
  totalContent: number,
  now: number,
): Promise<ProgressSummary> {
  const progress = await getAllProgressByLevel(cardType, level);
  return summarizeProgress({ totalContent, progress, now });
}
