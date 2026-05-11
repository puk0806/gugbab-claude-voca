/**
 * 단어장 마킹(known/unknown/null) → 첫 학습 시 SRS 초기값 (M6).
 *
 *   known   → ef=3.0, interval=6  (사용자가 안다고 했으므로 신뢰)
 *   unknown → ef=2.0, interval=1  (자주 검증)
 *   null    → ef=2.5, interval=1  (SM-2 표준)
 *
 * 이후 review 결과(rating)는 평소처럼 SM-2에 입력되어 EF 진화.
 * 본 함수는 *첫 cardProgress row 생성 시점*에만 호출.
 */
import type { UserMark } from '@/shared/types';

export interface InitialSrsState {
  readonly easeFactor: number;
  readonly intervalDays: number;
}

const INITIAL_KNOWN: InitialSrsState = { easeFactor: 3.0, intervalDays: 6 };
const INITIAL_UNKNOWN: InitialSrsState = { easeFactor: 2.0, intervalDays: 1 };
const INITIAL_NEUTRAL: InitialSrsState = { easeFactor: 2.5, intervalDays: 1 };

export function initialFromMark(mark: UserMark): InitialSrsState {
  switch (mark) {
    case 'known':
      return INITIAL_KNOWN;
    case 'unknown':
      return INITIAL_UNKNOWN;
    default:
      return INITIAL_NEUTRAL;
  }
}
