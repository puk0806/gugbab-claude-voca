import { describe, expect, it } from 'vitest';
import { SETTING_DEFAULTS, SETTING_KEYS } from './types';

describe('db types — 설정 카탈로그', () => {
  it('모든 SETTING_KEYS 에 default 값이 정의되어 있다', () => {
    for (const key of Object.values(SETTING_KEYS)) {
      expect(SETTING_DEFAULTS).toHaveProperty(key);
    }
  });

  it('세션 기본값은 큐 로직 기본값과 일치한다 (size 20 · ratio 0.3)', () => {
    expect(SETTING_DEFAULTS[SETTING_KEYS.SESSION_SIZE]).toBe(20);
    expect(SETTING_DEFAULTS[SETTING_KEYS.NEW_CARD_RATIO]).toBe(0.3);
  });
});
