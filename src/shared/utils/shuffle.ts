/**
 * Fisher-Yates 셔플 — 원본 배열 보존, 새 배열 반환.
 *
 * 결정론이 필요한 테스트는 외부에서 Math.random을 spy/mock.
 * 본 함수 자체는 부수효과 없이 순수.
 */
export function shuffle<T>(input: readonly T[]): T[] {
  const result = [...input];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = result[i];
    const swap = result[j];
    if (tmp !== undefined && swap !== undefined) {
      result[i] = swap;
      result[j] = tmp;
    }
  }
  return result;
}
