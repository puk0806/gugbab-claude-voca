import { describe, expect, it } from 'vitest';
import * as barrel from './index';

describe('shared/components barrel', () => {
  it('LevelCard, ProgressBar, EmptyState가 export된다', () => {
    expect(typeof barrel.LevelCard).toBe('function');
    expect(typeof barrel.ProgressBar).toBe('function');
    expect(typeof barrel.EmptyState).toBe('function');
  });
});
