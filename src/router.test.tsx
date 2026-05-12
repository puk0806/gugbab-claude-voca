import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetContentCache } from '@/content';
import { routes } from './router';

const MANIFEST_FIXTURE = {
  buildAt: '2026-05-11T00:00:00Z',
  schemaVersion: 1,
  counts: {
    words: { A1: 80, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 },
    sentences: { A1: 40, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 },
  },
};

function mockFetch(map: Record<string, unknown>): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo) => {
      const url = typeof input === 'string' ? input : input.url;
      const key = Object.keys(map).find((k) => url.endsWith(k));
      if (key) {
        return {
          ok: true,
          status: 200,
          json: async () => map[key],
        } as Response;
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response;
    }),
  );
}

describe('router definition', () => {
  beforeEach(() => {
    resetContentCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('루트 경로 / 가 정의되어 있다', () => {
    expect(routes[0]?.path).toBe('/');
  });

  it('주요 라우트가 모두 정의되어 있다', () => {
    const children = routes[0]?.children ?? [];
    const paths = children.map((c) =>
      c.index ? 'index' : c.path === '*' ? 'catchall' : c.path,
    );
    expect(paths).toContain('level/:cefr');
    expect(paths).toContain('level/:cefr/:cardType');
    expect(paths).toContain('learn/:cefr/:cardType/:studyMode');
    expect(paths).toContain('vocabulary/:cefr/:cardType');
    expect(paths).toContain('catchall');
  });

  it('홈 경로 마운트 시 레벨 선택 헤딩이 표시된다', async () => {
    mockFetch({ '/data/manifest.json': MANIFEST_FIXTURE });
    const router = createMemoryRouter(routes, { initialEntries: ['/'] });
    render(<RouterProvider router={router} />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /레벨을 선택하세요/ })).toBeInTheDocument();
    });
  });

  it('알 수 없는 경로는 NotFound로 매칭된다', async () => {
    mockFetch({});
    const router = createMemoryRouter(routes, { initialEntries: ['/totally-not-a-route'] });
    render(<RouterProvider router={router} />);
    await waitFor(() => {
      expect(screen.getByText(/페이지를 찾을 수 없어요/)).toBeInTheDocument();
    });
  });
});
