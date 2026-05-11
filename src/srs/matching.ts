/**
 * 리콜·클로즈 모드 입력 매칭 정책 (M3) — 관대 매칭.
 *
 *   - 대소문자 무시 (Apple ≅ apple)
 *   - 앞뒤 공백 trim
 *   - 기본 구두점 (.,?!;:'") 제거
 *   - 오타는 오답 (Levenshtein 미적용 — 학습 효과 우선)
 *
 * 외부 의존 0의 순수 함수. 어떤 상태도 보유하지 않음.
 */

const PUNCTUATION_PATTERN = /[.,?!;:'"]/g;

export function normalize(input: string): string {
  return input.trim().toLowerCase().replace(PUNCTUATION_PATTERN, '');
}

export function isCorrect(input: string, expected: string): boolean {
  return normalize(input) === normalize(expected);
}

/**
 * 클로즈 모드 다중 빈칸 매칭.
 *
 * - 길이 불일치 → false (의도되지 않은 입력 차단)
 * - 모든 빈칸 정답 → true
 * - 하나라도 오답 → false (전체 again)
 * - 빈 배열은 true (모든 '0개의 입력'이 정답이라는 vacuous truth는 사용 안 됨;
 *   호출자가 빈칸 1개 이상을 보장)
 */
export function isAllCorrect(inputs: readonly string[], expecteds: readonly string[]): boolean {
  if (inputs.length !== expecteds.length) return false;
  return inputs.every((value, index) => {
    const expected = expecteds[index];
    if (expected === undefined) return false;
    return isCorrect(value, expected);
  });
}
