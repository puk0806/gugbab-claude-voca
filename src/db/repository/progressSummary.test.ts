import { describe, expect, it } from 'vitest';
import type { SrsCard } from '@/srs/types';
import { summarizeProgress } from './progressSummary';

function mkCard(
  cardId: string,
  studyMode: 'flashcard' | 'recall' | 'cloze',
  state: SrsCard['state'],
  dueAt: number,
): SrsCard {
  return {
    cardId,
    studyMode,
    cardType: 'word',
    level: 'A1',
    state,
    repetitions: 1,
    easeFactor: 2.5,
    intervalDays: 1,
    dueAt,
    lastReviewedAt: 0,
    lapses: 0,
    lastRating: 'good',
  };
}

describe('summarizeProgress', () => {
  const now = 1_000_000_000_000;

  it('progress 0개 → 모두 0', () => {
    expect(summarizeProgress({ totalContent: 100, progress: [], now })).toEqual({
      total: 100,
      learned: 0,
      completed: 0,
      due: 0,
    });
  });

  it('learned = cardId 단위 dedup', () => {
    const progress = [
      mkCard('c1', 'flashcard', 'learning', now + 1000),
      mkCard('c1', 'recall', 'learning', now + 1000),
      mkCard('c2', 'flashcard', 'learning', now + 1000),
    ];
    const r = summarizeProgress({ totalContent: 100, progress, now });
    expect(r.learned).toBe(2);
  });

  it('due = state !== "new" AND dueAt <= now (cardId dedup)', () => {
    const progress = [
      mkCard('c1', 'flashcard', 'review', now - 1000),
      mkCard('c1', 'recall', 'review', now + 1000),
      mkCard('c2', 'flashcard', 'learning', now - 1000),
      mkCard('c3', 'flashcard', 'new', now - 1000),
    ];
    const r = summarizeProgress({ totalContent: 100, progress, now });
    expect(r.due).toBe(2);
  });

  it('completed = 모든 모드가 review state + dueAt > now', () => {
    const progress = [
      mkCard('c1', 'flashcard', 'review', now + 1000),
      mkCard('c1', 'recall', 'review', now + 1000),
      mkCard('c2', 'flashcard', 'review', now + 1000),
      mkCard('c2', 'recall', 'learning', now + 1000),
    ];
    const r = summarizeProgress({ totalContent: 100, progress, now });
    expect(r.completed).toBe(1);
  });

  it('learned >= completed (포함 관계)', () => {
    const progress = [
      mkCard('c1', 'flashcard', 'review', now + 1000),
      mkCard('c2', 'flashcard', 'learning', now + 1000),
    ];
    const r = summarizeProgress({ totalContent: 10, progress, now });
    expect(r.learned).toBe(2);
    expect(r.completed).toBe(1);
  });
});
