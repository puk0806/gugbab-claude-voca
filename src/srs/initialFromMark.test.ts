import { describe, expect, it } from 'vitest';
import { initialFromMark } from './initialFromMark';

describe('initialFromMark (M6: 마킹 → 초기 SRS)', () => {
  it('known → ef=3.0, intervalDays=6 (사용자가 안다고 했으므로 신뢰)', () => {
    expect(initialFromMark('known')).toEqual({
      easeFactor: 3.0,
      intervalDays: 6,
    });
  });

  it('unknown → ef=2.0, intervalDays=1 (자주 검증)', () => {
    expect(initialFromMark('unknown')).toEqual({
      easeFactor: 2.0,
      intervalDays: 1,
    });
  });

  it('null → ef=2.5, intervalDays=1 (SM-2 표준)', () => {
    expect(initialFromMark(null)).toEqual({
      easeFactor: 2.5,
      intervalDays: 1,
    });
  });

  it('known은 unknown·null 대비 더 긴 첫 interval', () => {
    expect(initialFromMark('known').intervalDays).toBeGreaterThan(
      initialFromMark('unknown').intervalDays,
    );
    expect(initialFromMark('known').intervalDays).toBeGreaterThan(
      initialFromMark(null).intervalDays,
    );
  });

  it('모든 EF는 SM-2 floor(1.3) 이상', () => {
    expect(initialFromMark('known').easeFactor).toBeGreaterThanOrEqual(1.3);
    expect(initialFromMark('unknown').easeFactor).toBeGreaterThanOrEqual(1.3);
    expect(initialFromMark(null).easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});
