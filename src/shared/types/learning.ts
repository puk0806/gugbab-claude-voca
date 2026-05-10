/**
 * 학습 도메인 핵심 union 타입.
 *
 * - CardType: 콘텐츠 종류 (단어/문장)
 * - StudyMode: 학습 방식 (플래시카드/리콜/클로즈). 단어장은 학습 X이므로 별도
 * - SrsState: SM-2 상태 머신
 * - SrsRating: 자가체크/자동채점 결과 (2-rating system)
 * - UserMark: 단어장 마킹 (M5·M6)
 */

export const CARD_TYPES = ['word', 'sentence'] as const;
export type CardType = (typeof CARD_TYPES)[number];

export const STUDY_MODES = ['flashcard', 'recall', 'cloze'] as const;
export type StudyMode = (typeof STUDY_MODES)[number];

export const SRS_STATES = ['new', 'learning', 'review', 'relearning'] as const;
export type SrsState = (typeof SRS_STATES)[number];

export const SRS_RATINGS = ['again', 'good'] as const;
export type SrsRating = (typeof SRS_RATINGS)[number];

export const USER_MARKS = ['known', 'unknown'] as const;
export type UserMark = (typeof USER_MARKS)[number] | null;

export function isCardType(value: unknown): value is CardType {
  return typeof value === 'string' && (CARD_TYPES as readonly string[]).includes(value);
}

export function isStudyMode(value: unknown): value is StudyMode {
  return typeof value === 'string' && (STUDY_MODES as readonly string[]).includes(value);
}

/**
 * cardType별 사용 가능한 학습 모드.
 * 단어는 클로즈 모드 미지원 (단어 자체가 빈칸이면 리콜과 동일).
 */
export const STUDY_MODES_BY_CARD_TYPE: Record<CardType, readonly StudyMode[]> = {
  word: ['flashcard', 'recall'],
  sentence: ['flashcard', 'recall', 'cloze'],
} as const;

export function isStudyModeAvailable(cardType: CardType, mode: StudyMode): boolean {
  return STUDY_MODES_BY_CARD_TYPE[cardType].includes(mode);
}
