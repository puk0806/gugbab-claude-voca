/**
 * 두 배열을 1:1 alternating 라운드로빈으로 섞음.
 * 한쪽이 먼저 소진되면 나머지를 그대로 append.
 *
 * composeQueue에서 due+new 섞기에 사용 — 단조로움 회피 목적.
 *
 * @example
 *   interleave(['d1','d2','d3'], ['n1','n2'])
 *   // ['d1','n1','d2','n2','d3']
 */
export function interleave<T>(a: readonly T[], b: readonly T[]): T[] {
  const result: T[] = [];
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < a.length) {
      const value = a[i];
      if (value !== undefined) result.push(value);
    }
    if (i < b.length) {
      const value = b[i];
      if (value !== undefined) result.push(value);
    }
  }
  return result;
}
