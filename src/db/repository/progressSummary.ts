/**
 * progress 행 배열을 cardId 단위 집계 통계로 변환하는 순수 함수.
 *
 * - learned: cardId 단위 dedup, progress 1개 이상.
 * - completed: 모든 모드가 review state + dueAt > now (졸업).
 * - due: 어떤 모드든 state !== 'new' && dueAt <= now (오늘 복습).
 *
 * React·Dexie 의존 0.
 */
import type { SrsCard } from '@/srs/types';

export interface ProgressSummary {
  readonly total: number;
  readonly learned: number;
  readonly completed: number;
  readonly due: number;
}

export interface SummarizeInput {
  readonly totalContent: number;
  readonly progress: readonly SrsCard[];
  readonly now: number;
}

export function summarizeProgress(input: SummarizeInput): ProgressSummary {
  const { totalContent, progress, now } = input;

  const byCard = new Map<string, SrsCard[]>();
  for (const p of progress) {
    const arr = byCard.get(p.cardId) ?? [];
    arr.push(p);
    byCard.set(p.cardId, arr);
  }

  let learned = 0;
  let completed = 0;
  let due = 0;

  for (const rows of byCard.values()) {
    learned += 1;
    const isCompleted = rows.every((p) => p.state === 'review' && p.dueAt > now);
    if (isCompleted) completed += 1;
    const hasDue = rows.some((p) => p.state !== 'new' && p.dueAt <= now);
    if (hasDue) due += 1;
  }

  return { total: totalContent, learned, completed, due };
}
