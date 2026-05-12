import { describe, expect, it } from 'vitest';
import * as barrel from './index';

describe('routes barrel', () => {
  it('모든 라우트 컴포넌트와 loader가 export된다', () => {
    expect(typeof barrel.Home).toBe('function');
    expect(typeof barrel.homeLoader).toBe('function');
    expect(typeof barrel.Level).toBe('function');
    expect(typeof barrel.levelLoader).toBe('function');
    expect(typeof barrel.Mode).toBe('function');
    expect(typeof barrel.modeLoader).toBe('function');
    expect(typeof barrel.Learn).toBe('function');
    expect(typeof barrel.learnLoader).toBe('function');
    expect(typeof barrel.Vocabulary).toBe('function');
    expect(typeof barrel.vocabularyLoader).toBe('function');
    expect(typeof barrel.NotFound).toBe('function');
    expect(typeof barrel.Root).toBe('function');
    expect(typeof barrel.RouteError).toBe('function');
  });
});
