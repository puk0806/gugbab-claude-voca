import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetContentCache } from '@/content';
import { upsertProgress } from '@/db';
import { resetDb } from '@/db/schema';
import { MANIFEST_A1_ONLY, mockFetchByUrlSuffix, renderRoutes } from '@/__tests__/router-helpers';
import { routes } from '@/router';

describe('Level route (/level/:cefr)', () => {
  beforeEach(async () => {
    resetContentCache();
    await resetDb();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('A1 진입 시 단어/문장 타일 모두 활성', async () => {
    mockFetchByUrlSuffix({ '/data/manifest.json': MANIFEST_A1_ONLY });
    renderRoutes(routes, '/level/A1');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /A1 레벨/ })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /단어 학습/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /문장 학습/ })).toBeEnabled();
  });

  it('콘텐츠 0인 레벨은 두 타일 모두 disabled', async () => {
    mockFetchByUrlSuffix({ '/data/manifest.json': MANIFEST_A1_ONLY });
    renderRoutes(routes, '/level/B1');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /B1 레벨/ })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /단어 학습/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /문장 학습/ })).toBeDisabled();
  });

  it('A1 word에 progress 1건 → 단어 타일에 학습 카드 수 라벨', async () => {
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
    mockFetchByUrlSuffix({ '/data/manifest.json': MANIFEST_A1_ONLY });
    renderRoutes(routes, '/level/A1');
    await waitFor(() => screen.getByRole('heading', { name: /A1 레벨/ }));
    const wordTile = screen.getByRole('button', { name: /단어 학습/ });
    expect(wordTile).toHaveTextContent(/학습 1\s*\/\s*649/);
  });
});
