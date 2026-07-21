import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('대화·단어·문장 3개 타일이 표시된다', async () => {
    mockFetchByUrlSuffix({ '/data/manifest.json': MANIFEST_A1_ONLY });
    renderRoutes(routes, '/');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /무엇을 연습할까요/ })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /대화 연습/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /단어 학습/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /문장 학습/ })).toBeInTheDocument();
  });

  it('단어 타일에 전체 단어 수와 학습 수가 표시된다', async () => {
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
      dueAt: now + 1000,
      lastReviewedAt: now,
      lapses: 0,
      lastRating: 'good',
    });
    mockFetchByUrlSuffix({ '/data/manifest.json': MANIFEST_A1_ONLY });
    renderRoutes(routes, '/');
    await waitFor(() => screen.getByRole('button', { name: /단어 학습/ }));
    const wordTile = screen.getByRole('button', { name: /단어 학습/ });
    expect(wordTile).toHaveTextContent('649개');
    expect(wordTile).toHaveTextContent('학습 1');
  });

  it('due 카드가 있으면 단어 타일에 due 배지가 표시된다', async () => {
    const now = Date.now();
    await upsertProgress({
      cardId: 'w_a1_002',
      studyMode: 'flashcard',
      cardType: 'word',
      level: 'A1',
      state: 'review',
      repetitions: 1,
      easeFactor: 2.5,
      intervalDays: 1,
      dueAt: now - 1000,
      lastReviewedAt: now - 86_400_000,
      lapses: 0,
      lastRating: 'good',
    });
    mockFetchByUrlSuffix({ '/data/manifest.json': MANIFEST_A1_ONLY });
    renderRoutes(routes, '/');
    await waitFor(() => screen.getByRole('button', { name: /단어 학습/ }));
    expect(screen.getByRole('button', { name: /단어 학습/ })).toHaveTextContent('due 1');
  });

  it('단어 타일 클릭 시 난이도 선택 화면으로 이동한다', async () => {
    mockFetchByUrlSuffix({ '/data/manifest.json': MANIFEST_A1_ONLY });
    renderRoutes(routes, '/');
    await waitFor(() => screen.getByRole('button', { name: /단어 학습/ }));
    await userEvent.click(screen.getByRole('button', { name: /단어 학습/ }));
    await waitFor(() => {
      expect(screen.getByText(/난이도를 선택하세요/)).toBeInTheDocument();
    });
  });

  it('대화 타일 클릭 시 대화 화면으로 이동한다', async () => {
    mockFetchByUrlSuffix({ '/data/manifest.json': MANIFEST_A1_ONLY });
    renderRoutes(routes, '/');
    await waitFor(() => screen.getByRole('button', { name: /대화 연습/ }));
    await userEvent.click(screen.getByRole('button', { name: /대화 연습/ }));
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: '메시지 입력' })).toBeInTheDocument();
    });
  });
});
