/**
 * 학습 카드 상태 배지 판정 — 세션 화면에서 카드 출처를 색으로 구분.
 *
 * - known/mastered → "아는 카드" (초록): 이미 통과했거나 안다고 마킹한 카드
 * - unknown → "몰랐던 카드" (빨강): 전에 틀려서 다시 나온 카드
 * - 마킹 없음 → null: 완전 신규 카드 (배지 미표시)
 *
 * mark 는 세션 loader 스냅샷 기준 — 답변마다 determineMark 로 갱신되지만
 * 배지는 "이 카드가 왜 나왔는가"를 설명하므로 세션 시작 시점 값을 쓴다.
 */
import type { UserMark } from '@/shared/types';

export interface CardStatusBadge {
  readonly label: string;
  readonly tone: 'known' | 'unknown';
}

export function getCardStatusBadge(mark: UserMark | undefined): CardStatusBadge | null {
  if (mark === 'known' || mark === 'mastered') {
    return { label: '아는 카드', tone: 'known' };
  }
  if (mark === 'unknown') {
    return { label: '몰랐던 카드', tone: 'unknown' };
  }
  return null;
}
