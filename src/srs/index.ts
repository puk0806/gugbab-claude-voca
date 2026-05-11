/**
 * `src/srs/` public API.
 *
 * SRS(Spaced Repetition System) 모듈은 SM-2 알고리즘과 입력 매칭을
 * 외부 의존 0의 순수 함수로 제공한다.
 *
 * 외부 모듈은 본 barrel만 import. 개별 파일 직접 접근 X (캡슐화).
 *
 * @example
 *   import { type SrsCard, applySm2, safeReview, isCorrect } from '@/srs';
 */

export type { InitialSrsState } from './initialFromMark';
// 마킹 → 초기값 (M6)
export { initialFromMark } from './initialFromMark';
// 입력 매칭 (M3)
export { isAllCorrect, isCorrect, normalize } from './matching';

// Rating 매핑
export { ratingToQuality } from './rating';

// Safe wrapper (시계 방어 + 단조 증가)
export { safeReview } from './safeReview';
// SM-2 알고리즘
export { applySm2, SM2_CONSTANTS } from './sm2';
// Types
export type { Quality, SrsCard, SrsInput, SrsResult } from './types';
