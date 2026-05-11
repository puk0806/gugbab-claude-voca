/**
 * Barrel public API 회귀 테스트.
 * 외부 노출 심볼이 의도된 만큼인지 명시적으로 검증.
 */
import { describe, expect, it } from 'vitest';
import * as PublicApi from './index';

describe('srs public API (barrel)', () => {
  it('SM-2 알고리즘이 노출된다', () => {
    expect(typeof PublicApi.applySm2).toBe('function');
    expect(PublicApi.SM2_CONSTANTS).toBeDefined();
    expect(PublicApi.SM2_CONSTANTS.EF_MIN).toBe(1.3);
    expect(PublicApi.SM2_CONSTANTS.EF_INITIAL).toBe(2.5);
  });

  it('Rating 매핑이 노출된다', () => {
    expect(typeof PublicApi.ratingToQuality).toBe('function');
  });

  it('Safe wrapper가 노출된다', () => {
    expect(typeof PublicApi.safeReview).toBe('function');
  });

  it('마킹 → 초기값(M6) 함수가 노출된다', () => {
    expect(typeof PublicApi.initialFromMark).toBe('function');
  });

  it('매칭 함수(M3)가 노출된다', () => {
    expect(typeof PublicApi.normalize).toBe('function');
    expect(typeof PublicApi.isCorrect).toBe('function');
    expect(typeof PublicApi.isAllCorrect).toBe('function');
  });

  it('public API 심볼 수가 명시된 만큼이다 (캡슐화 회귀 방지)', () => {
    const exported = Object.keys(PublicApi).sort();
    expect(exported).toEqual([
      'SM2_CONSTANTS',
      'applySm2',
      'initialFromMark',
      'isAllCorrect',
      'isCorrect',
      'normalize',
      'ratingToQuality',
      'safeReview',
    ]);
  });
});
