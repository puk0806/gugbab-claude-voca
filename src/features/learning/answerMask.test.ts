import { describe, expect, it } from 'vitest';
import { buildMask, countLetters } from './answerMask';

describe('buildMask', () => {
  it('공백은 유지하고 글자는 _ 로 마스킹한다', () => {
    expect(buildMask('good morning', 0)).toBe('____ _______');
  });

  it('revealedCount 만큼 앞에서부터 글자를 노출한다', () => {
    expect(buildMask('apple', 2)).toBe('ap___');
  });

  it('공백을 건너뛰고 글자 기준으로 노출한다', () => {
    expect(buildMask('go on', 3)).toBe('go o_');
  });

  it('revealedCount 가 글자 수 이상이면 전부 노출된다', () => {
    expect(buildMask('hi', 5)).toBe('hi');
  });
});

describe('countLetters', () => {
  it('공백 제외 글자 수를 센다', () => {
    expect(countLetters('good morning')).toBe(11);
    expect(countLetters('a')).toBe(1);
    expect(countLetters('')).toBe(0);
  });
});
