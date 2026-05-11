import { afterEach, describe, expect, it, vi } from 'vitest';
import { shuffle } from './shuffle';

describe('shuffle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('길이 보존', () => {
    const input = [1, 2, 3, 4, 5];
    expect(shuffle(input)).toHaveLength(5);
  });

  it('원본 배열 mutate X (immutable)', () => {
    const input = [1, 2, 3, 4, 5];
    const snapshot = [...input];
    shuffle(input);
    expect(input).toEqual(snapshot);
  });

  it('요소 동일성 보존 (set 비교)', () => {
    const input = ['a', 'b', 'c', 'd', 'e'];
    const result = shuffle(input);
    expect(new Set(result)).toEqual(new Set(input));
  });

  it('빈 배열 → 빈 배열', () => {
    expect(shuffle([])).toEqual([]);
  });

  it('단일 요소 → 동일 배열', () => {
    expect(shuffle([42])).toEqual([42]);
  });

  it('Math.random mock 시 결정론 검증', () => {
    // Math.random을 항상 0 반환 → Fisher-Yates에서 j=0
    // i=2,j=0: swap [0]<->[2] → [3,2,1]
    // i=1,j=0: swap [0]<->[1] → [2,3,1]
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = shuffle([1, 2, 3]);
    expect(result).toEqual([2, 3, 1]);
  });
});
