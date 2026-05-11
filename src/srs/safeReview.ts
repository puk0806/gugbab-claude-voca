/**
 * SM-2 review의 안전 래퍼 — 시계 변경 방어.
 *
 * 사용자가 시스템 시계를 과거로 변경한 경우 (now < lastReviewedAt)
 * 알고리즘이 음수 시간을 보거나 dueAt이 과거로 돌아가는 사고를 막는다.
 *
 * - now < lastReviewedAt → safeNow = lastReviewedAt + 1000 (1초 후로 보정)
 * - 그 외엔 now 그대로
 *
 * 단조 증가 보장:
 *   - EF floor 1.3 (sm2.applySm2 내부)
 *   - 연속 good rating 시 dueAt이 단조 증가 (단위 테스트로 검증)
 */

import { ratingToQuality } from './rating';
import { applySm2 } from './sm2';
import type { SrsCard, SrsInput, SrsResult } from './types';

const CLOCK_SKEW_FALLBACK_MS = 1000;

function clampNow(now: number, lastReviewedAt: number): number {
  return now < lastReviewedAt ? lastReviewedAt + CLOCK_SKEW_FALLBACK_MS : now;
}

export function safeReview(card: SrsCard, input: SrsInput): SrsResult {
  const safeNow = clampNow(input.now, card.lastReviewedAt);
  const q = ratingToQuality(input.rating);
  const updated = applySm2(card, q, safeNow);

  return {
    card: updated,
    nextDueAt: updated.dueAt,
  };
}
