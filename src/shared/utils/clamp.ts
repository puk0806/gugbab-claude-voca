/**
 * 값을 [min, max] 범위로 제한.
 *
 * @example
 *   clamp(0.7, 0.5, 1.5) === 0.7
 *   clamp(0.3, 0.5, 1.5) === 0.5
 *   clamp(2.0, 0.5, 1.5) === 1.5
 */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
