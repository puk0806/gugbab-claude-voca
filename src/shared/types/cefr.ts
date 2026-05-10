/**
 * CEFR (Common European Framework of Reference for Languages) 6단계.
 *
 * 본 프로젝트는 영어 학습용으로 사용한다.
 * 첫 출시는 A1만 활성, 나머지는 콘텐츠 누적 후 활성 (D2).
 */
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

export type CEFR = (typeof CEFR_LEVELS)[number]

export function isCefr(value: unknown): value is CEFR {
  return typeof value === 'string' && (CEFR_LEVELS as readonly string[]).includes(value)
}
