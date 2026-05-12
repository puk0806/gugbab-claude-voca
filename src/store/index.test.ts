import { describe, expect, it } from 'vitest';
import * as barrel from './index';

describe('store barrel', () => {
  it('useSessionStore가 export된다', () => {
    expect(barrel.useSessionStore).toBeDefined();
    expect(typeof barrel.useSessionStore).toBe('function');
  });
});
