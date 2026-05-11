import { describe, expect, it } from 'vitest';
import { clamp } from './clamp';

describe('clamp', () => {
  it('범위 내 값은 그대로 반환', () => {
    expect(clamp(0.7, 0.5, 1.5)).toBe(0.7);
    expect(clamp(20, 10, 50)).toBe(20);
  });

  it('min 미만 → min 반환', () => {
    expect(clamp(0.3, 0.5, 1.5)).toBe(0.5);
    expect(clamp(-5, 0, 100)).toBe(0);
  });

  it('max 초과 → max 반환', () => {
    expect(clamp(2.0, 0.5, 1.5)).toBe(1.5);
    expect(clamp(150, 0, 100)).toBe(100);
  });

  it('경계값(min, max) → 그대로', () => {
    expect(clamp(0.5, 0.5, 1.5)).toBe(0.5);
    expect(clamp(1.5, 0.5, 1.5)).toBe(1.5);
  });

  it('TTS rate 사용 케이스 (0.5~1.5)', () => {
    expect(clamp(0.1, 0.5, 1.5)).toBe(0.5);
    expect(clamp(2.5, 0.5, 1.5)).toBe(1.5);
    expect(clamp(1.0, 0.5, 1.5)).toBe(1.0);
  });
});
