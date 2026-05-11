/**
 * SM-2 알고리즘 (Wozniak 1990) — 외부 의존 0의 순수 함수.
 *
 * 갱신 흐름:
 *   - q < 3 (fail): repetitions=0, interval=1, state=relearning, lapses+1
 *   - q >= 3 (pass):
 *       repetitions=0 → interval=1, state=learning
 *       repetitions=1 → interval=6, state=review
 *       repetitions>=2 → interval=round(interval × ef), state=review
 *   - EF 갱신: ef + (0.1 - (5-q)(0.08 + (5-q)*0.02)). floor 1.3 강제.
 *
 * 본 함수는 카드를 immutable 복사로 반환. 호출자가 저장.
 */
import type { SrsRating, SrsState } from '@/shared/types';
import type { Quality, SrsCard } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const EF_MIN = 1.3;
const EF_INITIAL = 2.5;

export const SM2_CONSTANTS = {
  MS_PER_DAY,
  EF_MIN,
  EF_INITIAL,
} as const;

function nextEaseFactor(prevEf: number, q: Quality): number {
  const ef = prevEf + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return ef < EF_MIN ? EF_MIN : ef;
}

function nextIntervalDays(prevInterval: number, repetitions: number, ef: number): number {
  if (repetitions === 0) return 1;
  if (repetitions === 1) return 6;
  return Math.round(prevInterval * ef);
}

function nextState(repetitions: number, isPass: boolean): SrsState {
  if (!isPass) return 'relearning';
  if (repetitions === 1) return 'learning';
  return 'review';
}

export function applySm2(card: SrsCard, q: Quality, now: number): SrsCard {
  const isPass = q >= 3;
  const ef = nextEaseFactor(card.easeFactor, q);

  const repetitions = isPass ? card.repetitions + 1 : 0;
  const intervalDays = isPass ? nextIntervalDays(card.intervalDays, card.repetitions, ef) : 1;
  const dueAt = now + intervalDays * MS_PER_DAY;
  const lapses = isPass ? card.lapses : card.lapses + 1;
  const state = nextState(repetitions, isPass);
  const lastRating: SrsRating = isPass ? 'good' : 'again';

  return {
    ...card,
    repetitions,
    easeFactor: ef,
    intervalDays,
    dueAt,
    lastReviewedAt: now,
    lapses,
    state,
    lastRating,
  };
}
