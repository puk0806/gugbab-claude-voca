import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetchByUrlSuffix, renderRoutes } from '@/__tests__/router-helpers';
import { upsertProgress } from '@/db';
import { resetDb } from '@/db/schema';
import { routes } from '@/router';

describe('Mode route (/level/:cefr/:cardType)', () => {
  beforeEach(async () => {
    await resetDb();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('단어(word)에서는 클로즈 모드가 비활성', async () => {
    mockFetchByUrlSuffix({});
    renderRoutes(routes, '/level/A1/word');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /A1 · 단어/ })).toBeInTheDocument();
    });
    // 클로즈는 sentence 전용이라 word 모드에서는 disabled
    const closeBtn = screen.getByRole('button', { name: /클로즈/ });
    expect(closeBtn).toBeDisabled();
  });

  it('문장(sentence)에서는 4가지 모드 모두 활성', async () => {
    mockFetchByUrlSuffix({});
    renderRoutes(routes, '/level/A1/sentence');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /A1 · 문장/ })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /플래시카드/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /리콜/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /클로즈/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /단어장/ })).toBeEnabled();
  });

  it('A1 word flashcard에 진도 1건 → 플래시카드 타일에 학습 카드 수', async () => {
    const now = Date.now();
    await upsertProgress({
      cardId: 'w_a1_001',
      studyMode: 'flashcard',
      cardType: 'word',
      level: 'A1',
      state: 'learning',
      repetitions: 1,
      easeFactor: 2.5,
      intervalDays: 1,
      dueAt: now + 86_400_000,
      lastReviewedAt: now,
      lapses: 0,
      lastRating: 'good',
    });
    mockFetchByUrlSuffix({});
    renderRoutes(routes, '/level/A1/word');
    await waitFor(() => screen.getByRole('heading', { name: /A1 · 단어/ }));
    const flashcardTile = screen.getByRole('button', { name: /플래시카드/ });
    expect(flashcardTile).toHaveTextContent(/학습 1/);
    // 다른 모드는 해당 모드 진도 0이라 라벨 미표시
    const recallTile = screen.getByRole('button', { name: /리콜/ });
    expect(recallTile).not.toHaveTextContent(/학습/);
  });
});
