import { describe, expect, it } from 'vitest';
import * as PublicApi from './index';

describe('features/learning public API (barrel)', () => {
  it('composeQueue 노출', () => {
    expect(typeof PublicApi.composeQueue).toBe('function');
  });

  it('public API 심볼 명시 검증', () => {
    expect(Object.keys(PublicApi).sort()).toEqual(['composeQueue']);
  });
});
