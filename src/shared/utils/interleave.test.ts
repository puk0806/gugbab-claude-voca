import { describe, expect, it } from 'vitest';
import { interleave } from './interleave';

describe('interleave (1:1 라운드로빈)', () => {
  it('동일 길이 alternating', () => {
    expect(interleave(['a1', 'a2', 'a3'], ['b1', 'b2', 'b3'])).toEqual([
      'a1',
      'b1',
      'a2',
      'b2',
      'a3',
      'b3',
    ]);
  });

  it('a가 더 길면 남은 a를 뒤에 append', () => {
    expect(interleave(['a1', 'a2', 'a3', 'a4', 'a5'], ['b1', 'b2'])).toEqual([
      'a1',
      'b1',
      'a2',
      'b2',
      'a3',
      'a4',
      'a5',
    ]);
  });

  it('b가 더 길면 남은 b를 뒤에 append', () => {
    expect(interleave(['a1'], ['b1', 'b2', 'b3'])).toEqual(['a1', 'b1', 'b2', 'b3']);
  });

  it('한쪽이 빈 배열', () => {
    expect(interleave([], ['b1', 'b2'])).toEqual(['b1', 'b2']);
    expect(interleave(['a1', 'a2'], [])).toEqual(['a1', 'a2']);
  });

  it('둘 다 빈 배열 → 빈 배열', () => {
    expect(interleave([], [])).toEqual([]);
  });

  it('composeQueue 사용 케이스: due 14 + new 6', () => {
    const due = Array.from({ length: 14 }, (_, i) => `d${i}`);
    const news = Array.from({ length: 6 }, (_, i) => `n${i}`);
    const result = interleave(due, news);

    expect(result).toHaveLength(20);
    // 처음 12개는 d/n alternating, 이후 8개는 due만
    expect(result.slice(0, 12)).toEqual([
      'd0',
      'n0',
      'd1',
      'n1',
      'd2',
      'n2',
      'd3',
      'n3',
      'd4',
      'n4',
      'd5',
      'n5',
    ]);
    expect(result.slice(12)).toEqual(['d6', 'd7', 'd8', 'd9', 'd10', 'd11', 'd12', 'd13']);
  });
});
