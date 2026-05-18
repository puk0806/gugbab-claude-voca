import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MANIFEST_A1_ONLY, mockFetchByUrlSuffix, renderRoutes } from '@/__tests__/router-helpers';
import { resetContentCache } from '@/content';
import { upsertProgress } from '@/db';
import { resetDb } from '@/db/schema';
import { routes } from '@/router';

describe('Home route (/)', () => {
  beforeEach(async () => {
    resetContentCache();
    await resetDb();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('레벨 선택 헤딩과 6개 레벨 버튼이 표시된다', async () => {
    mockFetchByUrlSuffix({ '/data/manifest.json': MANIFEST_A1_ONLY });
    renderRoutes(routes, '/');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /레벨을 선택하세요/ })).toBeInTheDocument();
    });
    expect(screen.getByLabelText('A1 레벨')).toBeInTheDocument();
    expect(screen.getByLabelText('C2 레벨 (콘텐츠 준비 중)')).toBeInTheDocument();
  });

  it('콘텐츠 0인 레벨은 "콘텐츠 준비 중"으로 5개 표시 (A2~C2)', async () => {
    mockFetchByUrlSuffix({ '/data/manifest.json': MANIFEST_A1_ONLY });
    renderRoutes(routes, '/');
    await waitFor(() => screen.getByRole('heading', { name: /레벨을 선택하세요/ }));
    expect(screen.getAllByText('콘텐츠 준비 중')).toHaveLength(5);
  });

  it('A1에 due progress 1건 있으면 due 배지 표시', async () => {
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
      dueAt: now - 1000,
      lastReviewedAt: now,
      lapses: 0,
      lastRating: 'good',
    });
    mockFetchByUrlSuffix({ '/data/manifest.json': MANIFEST_A1_ONLY });
    renderRoutes(routes, '/');
    await waitFor(() => screen.getByRole('heading', { name: /레벨을 선택하세요/ }));
    expect(screen.getByLabelText(/오늘 복습 1장/)).toBeInTheDocument();
  });
});
