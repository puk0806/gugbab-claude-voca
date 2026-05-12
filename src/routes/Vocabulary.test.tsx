import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetContentCache } from '@/content';
import { resetDb } from '@/db/schema';
import {
  mockFetchByUrlSuffix,
  renderRoutes,
  WORDS_A1_FIXTURE,
} from '@/__tests__/router-helpers';
import { routes } from '@/router';

describe('Vocabulary route (/vocabulary/:cefr/:cardType)', () => {
  beforeEach(async () => {
    resetContentCache();
    await resetDb();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('단어 리스트와 검색 박스가 렌더된다', async () => {
    mockFetchByUrlSuffix({ '/data/words/a1.json': WORDS_A1_FIXTURE });
    renderRoutes(routes, '/vocabulary/A1/word');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /A1 단어장/ })).toBeInTheDocument();
    });
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('goodbye')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('검색으로 리스트 필터링', async () => {
    mockFetchByUrlSuffix({ '/data/words/a1.json': WORDS_A1_FIXTURE });
    renderRoutes(routes, '/vocabulary/A1/word');
    await waitFor(() => screen.getByText('hello'));

    await userEvent.type(screen.getByRole('searchbox'), 'good');
    await waitFor(() => {
      expect(screen.queryByText('hello')).not.toBeInTheDocument();
    });
    expect(screen.getByText('goodbye')).toBeInTheDocument();
  });

  it('"안다" 토글 시 active 상태로 전환', async () => {
    mockFetchByUrlSuffix({ '/data/words/a1.json': WORDS_A1_FIXTURE });
    renderRoutes(routes, '/vocabulary/A1/word');
    await waitFor(() => screen.getByText('hello'));

    const btn = screen.getByTestId('mark-known-w_a1_001');
    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });
});
