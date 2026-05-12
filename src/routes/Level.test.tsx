import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetContentCache } from '@/content';
import { MANIFEST_A1_ONLY, mockFetchByUrlSuffix, renderRoutes } from '@/__tests__/router-helpers';
import { routes } from '@/router';

describe('Level route (/level/:cefr)', () => {
  beforeEach(() => {
    resetContentCache();
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
});
