import { describe, expect, it } from 'vitest';
import * as barrel from './index';

describe('recall barrel', () => {
  it('RecallPrompt가 export된다', () => {
    expect(typeof barrel.RecallPrompt).toBe('function');
  });
});
