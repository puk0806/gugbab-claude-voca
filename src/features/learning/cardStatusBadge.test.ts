import { describe, expect, it } from 'vitest';
import { getCardStatusBadge } from './cardStatusBadge';

describe('getCardStatusBadge', () => {
  it('known → 아는 카드 (초록 tone)', () => {
    expect(getCardStatusBadge('known')).toEqual({ label: '아는 카드', tone: 'known' });
  });

  it('mastered → 아는 카드 (초록 tone)', () => {
    expect(getCardStatusBadge('mastered')).toEqual({ label: '아는 카드', tone: 'known' });
  });

  it('unknown → 몰랐던 카드 (빨강 tone)', () => {
    expect(getCardStatusBadge('unknown')).toEqual({ label: '몰랐던 카드', tone: 'unknown' });
  });

  it('마킹 없음(신규) → null (배지 미표시)', () => {
    expect(getCardStatusBadge(undefined)).toBeNull();
    expect(getCardStatusBadge(null)).toBeNull();
  });
});
