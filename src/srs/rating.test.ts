import { describe, expect, it } from 'vitest';
import { ratingToQuality } from './rating';

describe('ratingToQuality (2-rating ↔ SM-2 6단계)', () => {
  it('good → 4 (보수적 매핑, EF 양극화 회피)', () => {
    expect(ratingToQuality('good')).toBe(4);
  });

  it('again → 1 (Q=0 대비 EF 감소 폭 적정)', () => {
    expect(ratingToQuality('again')).toBe(1);
  });

  it('두 rating 모두 SM-2 quality(0~5) 범위 내', () => {
    const goodQ = ratingToQuality('good');
    const againQ = ratingToQuality('again');
    expect(goodQ).toBeGreaterThanOrEqual(0);
    expect(goodQ).toBeLessThanOrEqual(5);
    expect(againQ).toBeGreaterThanOrEqual(0);
    expect(againQ).toBeLessThanOrEqual(5);
  });

  it('again < 3 (fail) AND good >= 3 (pass) — SM-2 fail/pass 경계 준수', () => {
    expect(ratingToQuality('again')).toBeLessThan(3);
    expect(ratingToQuality('good')).toBeGreaterThanOrEqual(3);
  });
});
