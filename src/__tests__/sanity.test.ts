import { describe, expect, it } from 'vitest';

describe('sanity', () => {
  it('vitest 환경이 정상 작동한다', () => {
    expect(1 + 1).toBe(2);
  });

  it('async/await 패턴이 정상 작동한다', async () => {
    const value = await Promise.resolve(42);
    expect(value).toBe(42);
  });

  it('jsdom 환경이 정상 작동한다 (window 객체 접근 가능)', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });
});
