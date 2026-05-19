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

/**
 * 단어장 마킹 4단계:
 * - 'unknown': 모름 — 마지막 응답이 again 또는 hint 사용
 * - 'known': 한 mode 만 통과 (학습 mode 또는 검증 mode 한쪽)
 * - 'mastered': 진짜 졸업
 *   - word: recall.lastRating === 'good' (한 번만 통과해도 mastered — 검증 mode 자체가 어려움)
 *   - sentence: flashcard.lastRating === 'good' && cloze.lastRating === 'good' (둘 다 통과)
 *
 * null: 미학습 (아무 mode 도 답 안 함)
 */
export const USER_MARKS = ['known', 'unknown', 'mastered'] as const;
export type UserMark = (typeof USER_MARKS)[number] | null;

export function isCardType(value: unknown): value is CardType {
  return typeof value === 'string' && (CARD_TYPES as readonly string[]).includes(value);
}

export function isStudyMode(value: unknown): value is StudyMode {
  return typeof value === 'string' && (STUDY_MODES as readonly string[]).includes(value);
}

/**
 * cardType별 사용 가능한 학습 모드.
 *
 * - word: flashcard (학습) + recall (검증). recall 한 mode 통과로 mastered 인정.
 * - sentence: flashcard (학습) + cloze (검증). 두 mode 모두 통과해야 mastered.
 *
 * sentence 에서 recall 은 cloze 와 역할 중복이라 제거 — cloze 가 문장 검증 mode.
 * 단어는 클로즈 모드 미지원 (단어 자체가 빈칸이면 리콜과 동일).
 */
export const STUDY_MODES_BY_CARD_TYPE: Record<CardType, readonly StudyMode[]> = {
  word: ['flashcard', 'recall'],
  sentence: ['flashcard', 'cloze'],
} as const;

export function isStudyModeAvailable(cardType: CardType, mode: StudyMode): boolean {
  return STUDY_MODES_BY_CARD_TYPE[cardType].includes(mode);
}
