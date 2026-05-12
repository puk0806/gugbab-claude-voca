import { describe, expect, it } from 'vitest';
import * as barrel from './index';

describe('flashcard barrel', () => {
  it('Flashcard 컴포넌트가 export된다', () => {
    expect(typeof barrel.Flashcard).toBe('function');
  });
});
