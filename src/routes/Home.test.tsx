import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetContentCache } from '@/content';
import { MANIFEST_A1_ONLY, mockFetchByUrlSuffix, renderRoutes } from '@/__tests__/router-helpers';
import { routes } from '@/router';

describe('Home route (/)', () => {
  beforeEach(() => {
    resetContentCache();
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
});
