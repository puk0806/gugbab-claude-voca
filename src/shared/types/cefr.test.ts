import { describe, expect, it } from 'vitest';
import { type CEFR, CEFR_LEVELS, isCefr } from './cefr';

describe('CEFR 도메인 타입', () => {
  it('CEFR_LEVELS는 6단계 (A1~C2)를 정확한 순서로 가진다', () => {
    expect(CEFR_LEVELS).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  });

  it('CEFR_LEVELS는 readonly 6개 요소를 가진다', () => {
    expect(CEFR_LEVELS.length).toBe(6);
  });

  describe('isCefr', () => {
    it('유효한 CEFR 레벨에 true를 반환한다', () => {
      expect(isCefr('A1')).toBe(true);
      expect(isCefr('B2')).toBe(true);
      expect(isCefr('C2')).toBe(true);
    });

    it('유효하지 않은 문자열에 false를 반환한다', () => {
      expect(isCefr('a1')).toBe(false); // 대소문자 구분
      expect(isCefr('D1')).toBe(false);
      expect(isCefr('')).toBe(false);
    });

    it('문자열이 아닌 값에 false를 반환한다', () => {
      expect(isCefr(1)).toBe(false);
      expect(isCefr(null)).toBe(false);
      expect(isCefr(undefined)).toBe(false);
      expect(isCefr({})).toBe(false);
      expect(isCefr([])).toBe(false);
    });

    it('타입 가드로 동작하여 narrowing이 가능하다', () => {
      const value: unknown = 'A1';
      if (isCefr(value)) {
        // 컴파일 타임에 CEFR로 narrowing되어야 함
        const cefr: CEFR = value;
        expect(cefr).toBe('A1');
      } else {
        // narrowing 실패 시 도달 불가
        expect.fail('isCefr returned false for valid input');
      }
    });
  });
});
