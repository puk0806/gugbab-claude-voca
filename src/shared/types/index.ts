/**
 * `src/shared/types/` public API.
 *
 * 외부 모듈에서 도메인 타입·가드·상수 사용 시 본 barrel을 통해 import.
 * 내부 단위 테스트는 개별 파일을 직접 import (관행).
 *
 * @example
 *   import { type CEFR, isCefr, CEFR_LEVELS } from '@/shared/types';
 *   import { type StudyMode, isStudyModeAvailable } from '@/shared/types';
 */

// CEFR 레벨
export type { CEFR } from './cefr';
export { CEFR_LEVELS, isCefr } from './cefr';

// 학습 도메인
export type { CardType, SrsRating, SrsState, StudyMode, UserMark } from './learning';
export {
  CARD_TYPES,
  isCardType,
  isStudyMode,
  isStudyModeAvailable,
  SRS_RATINGS,
  SRS_STATES,
  STUDY_MODES,
  STUDY_MODES_BY_CARD_TYPE,
  USER_MARKS,
} from './learning';
