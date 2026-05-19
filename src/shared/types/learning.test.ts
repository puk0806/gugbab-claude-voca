import { describe, expect, it } from 'vitest';
import {
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

describe('학습 도메인 타입', () => {
  describe('상수 배열 정합성', () => {
    it('CARD_TYPES = [word, sentence]', () => {
      expect(CARD_TYPES).toEqual(['word', 'sentence']);
    });

    it('STUDY_MODES = 3개 학습 모드 (단어장 제외)', () => {
      expect(STUDY_MODES).toEqual(['flashcard', 'recall', 'cloze']);
    });

    it('SRS_STATES = SM-2 상태 머신 4개', () => {
      expect(SRS_STATES).toEqual(['new', 'learning', 'review', 'relearning']);
    });

    it('SRS_RATINGS = 2-rating system', () => {
      expect(SRS_RATINGS).toEqual(['again', 'good']);
    });

    it('USER_MARKS = known | unknown | mastered (null은 별개로 union)', () => {
      expect(USER_MARKS).toEqual(['known', 'unknown', 'mastered']);
    });
  });

  describe('isCardType 타입 가드', () => {
    it('유효한 cardType에 true', () => {
      expect(isCardType('word')).toBe(true);
      expect(isCardType('sentence')).toBe(true);
    });

    it('유효하지 않은 값에 false', () => {
      expect(isCardType('paragraph')).toBe(false);
      expect(isCardType('')).toBe(false);
      expect(isCardType(null)).toBe(false);
      expect(isCardType(undefined)).toBe(false);
    });
  });

  describe('isStudyMode 타입 가드', () => {
    it('유효한 studyMode에 true', () => {
      expect(isStudyMode('flashcard')).toBe(true);
      expect(isStudyMode('recall')).toBe(true);
      expect(isStudyMode('cloze')).toBe(true);
    });

    it('vocabulary는 학습 모드가 아님 (false)', () => {
      expect(isStudyMode('vocabulary')).toBe(false);
    });

    it('유효하지 않은 값에 false', () => {
      expect(isStudyMode('quiz')).toBe(false);
      expect(isStudyMode('')).toBe(false);
      expect(isStudyMode(null)).toBe(false);
    });
  });

  describe('STUDY_MODES_BY_CARD_TYPE 매트릭스', () => {
    it('word는 flashcard·recall 두 모드만 지원', () => {
      expect(STUDY_MODES_BY_CARD_TYPE.word).toEqual(['flashcard', 'recall']);
    });

    it('sentence 는 flashcard·cloze 두 모드만 지원 (recall 제거)', () => {
      expect(STUDY_MODES_BY_CARD_TYPE.sentence).toEqual(['flashcard', 'cloze']);
    });
  });

  describe('isStudyModeAvailable', () => {
    it('단어 + 플래시카드 = 가능', () => {
      expect(isStudyModeAvailable('word', 'flashcard')).toBe(true);
    });

    it('단어 + 리콜 = 가능', () => {
      expect(isStudyModeAvailable('word', 'recall')).toBe(true);
    });

    it('단어 + 클로즈 = 불가능 (M2: 클로즈는 문장 전용)', () => {
      expect(isStudyModeAvailable('word', 'cloze')).toBe(false);
    });

    it('문장 + flashcard·cloze = 가능', () => {
      expect(isStudyModeAvailable('sentence', 'flashcard')).toBe(true);
      expect(isStudyModeAvailable('sentence', 'cloze')).toBe(true);
    });

    it('문장 + recall = 불가능 (cloze 가 검증 mode 역할)', () => {
      expect(isStudyModeAvailable('sentence', 'recall')).toBe(false);
    });
  });
});
