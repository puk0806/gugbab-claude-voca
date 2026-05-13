/**
 * 테스트용 라우터/fetch 헬퍼.
 *
 * 라우트 컴포넌트는 loader를 가지고 있어 단독 render가 어렵다.
 * 메모리 라우터 + fetch mock으로 통합 마운트를 도와준다.
 */
import { render, type RenderResult } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';
import type { RouteObject } from 'react-router-dom';

export const MANIFEST_A1_ONLY = {
  buildAt: '2026-05-13T00:00:00Z',
  schemaVersion: 1,
  counts: {
    words: { A1: 648, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 },
    sentences: { A1: 150, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 },
  },
};

export const WORDS_A1_FIXTURE = [
  {
    id: 'w_a1_001',
    level: 'A1',
    english: 'hello',
    korean: '안녕하세요',
    partOfSpeech: 'interjection',
  },
  {
    id: 'w_a1_002',
    level: 'A1',
    english: 'goodbye',
    korean: '안녕히 가세요',
    partOfSpeech: 'interjection',
  },
];

export const SENTENCES_A1_FIXTURE = [
  {
    id: 's_a1_001',
    level: 'A1',
    english: 'Hello, how {are} you?',
    korean: '안녕하세요, 어떻게 지내세요?',
    cloze: ['are'],
  },
];

export function mockFetchByUrlSuffix(map: Record<string, unknown>): void {
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

export function renderRoutes(
  routes: RouteObject[],
  initialPath: string,
): RenderResult {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  return render(<RouterProvider router={router} />);
}
