import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetchByUrlSuffix, renderRoutes, WORDS_A1_FIXTURE } from '@/__tests__/router-helpers';
import { resetContentCache } from '@/content';
import { resetDb } from '@/db/schema';
import { routes } from '@/router';

describe('Learn route (/learn/:cefr/:cardType/:studyMode)', () => {
  beforeEach(async () => {
    resetContentCache();
    await resetDb();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('진도가 없으면 신규 카드 큐로 학습 화면이 마운트된다', async () => {
    mockFetchByUrlSuffix({ '/data/words/a1.json': WORDS_A1_FIXTURE });
    renderRoutes(routes, '/learn/A1/word/flashcard');
    await waitFor(() => {
      // 플래시카드 컴포넌트 — 첫 카드의 영어 텍스트 표시
      expect(screen.getByText(/hello|goodbye/i)).toBeInTheDocument();
    });
  });

  it('잘못된 cardType은 NotFound로 폴백', async () => {
    mockFetchByUrlSuffix({});
    renderRoutes(routes, '/learn/A1/word/cloze'); // word + cloze 조합은 비활성
    await waitFor(() => {
      expect(screen.getByText(/문제가 발생했어요/)).toBeInTheDocument();
    });
  });
});
