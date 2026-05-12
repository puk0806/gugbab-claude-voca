import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockFetchByUrlSuffix, renderRoutes } from '@/__tests__/router-helpers';
import { routes } from '@/router';

describe('Mode route (/level/:cefr/:cardType)', () => {
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
});
