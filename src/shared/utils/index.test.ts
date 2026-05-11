import { describe, expect, it } from 'vitest';
import * as PublicApi from './index';

describe('shared/utils public API (barrel)', () => {
  it('clamp·shuffle·interleave 노출', () => {
    expect(typeof PublicApi.clamp).toBe('function');
    expect(typeof PublicApi.shuffle).toBe('function');
    expect(typeof PublicApi.interleave).toBe('function');
  });

  it('public API 심볼 명시 검증 (캡슐화 회귀 방지)', () => {
    expect(Object.keys(PublicApi).sort()).toEqual(['clamp', 'interleave', 'shuffle']);
  });
});
