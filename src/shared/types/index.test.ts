/**
 * Barrel export 테스트 — public API가 의도한 심볼만 노출하는지 검증.
 * 캡슐화 보장: 내부 helper나 비공개 심볼이 외부로 새지 않게.
 */
import { describe, expect, it } from 'vitest';
import * as PublicApi from './index';

describe('shared/types public API (barrel)', () => {
  it('CEFR 도메인 심볼이 노출된다', () => {
    expect(PublicApi.CEFR_LEVELS).toBeDefined();
    expect(typeof PublicApi.isCefr).toBe('function');
  });

  it('학습 도메인 상수가 노출된다', () => {
    expect(PublicApi.CARD_TYPES).toBeDefined();
    expect(PublicApi.STUDY_MODES).toBeDefined();
    expect(PublicApi.SRS_STATES).toBeDefined();
    expect(PublicApi.SRS_RATINGS).toBeDefined();
    expect(PublicApi.USER_MARKS).toBeDefined();
    expect(PublicApi.STUDY_MODES_BY_CARD_TYPE).toBeDefined();
  });

  it('학습 도메인 타입 가드가 노출된다', () => {
    expect(typeof PublicApi.isCardType).toBe('function');
    expect(typeof PublicApi.isStudyMode).toBe('function');
    expect(typeof PublicApi.isStudyModeAvailable).toBe('function');
  });

  it('public API 심볼 수가 명시된 만큼이다 (캡슐화 회귀 방지)', () => {
    // 외부 노출 심볼이 늘어났다면 의도된 변경인지 검토 필요.
    // 추가 시 본 테스트와 함께 갱신.
    const exportedKeys = Object.keys(PublicApi).sort();
    expect(exportedKeys).toEqual([
      'CARD_TYPES',
      'CEFR_LEVELS',
      'SRS_RATINGS',
      'SRS_STATES',
      'STUDY_MODES',
      'STUDY_MODES_BY_CARD_TYPE',
      'USER_MARKS',
      'isCardType',
      'isCefr',
      'isStudyMode',
      'isStudyModeAvailable',
    ]);
  });
});
