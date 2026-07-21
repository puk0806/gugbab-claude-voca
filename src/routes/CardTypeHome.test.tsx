import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MANIFEST_A1_ONLY, mockFetchByUrlSuffix, renderRoutes } from '@/__tests__/router-helpers';
import { resetContentCache } from '@/content';
import { upsertProgress } from '@/db';
import { resetDb } from '@/db/schema';
import { routes } from '@/router';

describe('CardTypeHome route (/cards/:cardType)', () => {
  beforeEach(async () => {
    resetContentCache();
    await resetDb();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('단어: 난이도 선택 헤딩과 6개 레벨 카드가 표시된다', async () => {
    mockFetchByUrlSuffix({ '/data/manifest.json': MANIFEST_A1_ONLY });
    renderRoutes(routes, '/cards/word');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /단어 학습/ })).toBeInTheDocument();
    });
    expect(screen.getByLabelText('A1 레벨')).toBeInTheDocument();
    expect(screen.getByLabelText('C2 레벨 (콘텐츠 준비 중)')).toBeInTheDocument();
    // A1 단어 649개 노출
    expect(screen.getByText(/649개/)).toBeInTheDocument();
  });

  it('문장: 문장 카운트 기준으로 렌더된다', async () => {
    mockFetchByUrlSuffix({ '/data/manifest.json': MANIFEST_A1_ONLY });
    renderRoutes(routes, '/cards/sentence');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /문장 학습/ })).toBeInTheDocument();
    });
    expect(screen.getByText(/250개/)).toBeInTheDocument();
  });

  it('A1에 due progress 있으면 due 배지 표시', async () => {
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
    renderRoutes(routes, '/cards/word');
    await waitFor(() => screen.getByRole('heading', { name: /단어 학습/ }));
    expect(screen.getByLabelText(/오늘 복습 1장/)).toBeInTheDocument();
  });

  it('잘못된 cardType 은 에러 바운더리로 간다', async () => {
    mockFetchByUrlSuffix({ '/data/manifest.json': MANIFEST_A1_ONLY });
    renderRoutes(routes, '/cards/banana');
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /학습/ })).not.toBeInTheDocument();
    });
  });
});
