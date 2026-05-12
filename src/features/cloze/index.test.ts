import { describe, expect, it } from 'vitest';
import * as barrel from './index';

describe('cloze barrel', () => {
  it('ClozePrompt가 export된다', () => {
    expect(typeof barrel.ClozePrompt).toBe('function');
  });
});
