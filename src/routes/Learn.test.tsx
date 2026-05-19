import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetchByUrlSuffix, renderRoutes, WORDS_A1_FIXTURE } from '@/__tests__/router-helpers';
import { resetContentCache } from '@/content';
import { getMark, setMark } from '@/db';
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

  it('flashcard 알았음 → 단어장 mark=known 자동 갱신', async () => {
    mockFetchByUrlSuffix({ '/data/words/a1.json': WORDS_A1_FIXTURE });
    renderRoutes(routes, '/learn/A1/word/flashcard');
    await waitFor(() => screen.getByText(/hello|goodbye/i));

    // 어떤 카드든 답하면 그 cardId 의 mark 가 known 으로 박힘
    await userEvent.click(screen.getByRole('button', { name: '뒤집기', exact: true }));
    await userEvent.click(screen.getByRole('button', { name: '알았음', exact: true }));

    // 두 fixture 중 하나의 mark 가 known
    await waitFor(async () => {
      const m1 = await getMark('w_a1_001');
      const m2 = await getMark('w_a1_002');
      expect([m1, m2]).toContain('known');
    });
  });

  it('flashcard 모르겠음 → 단어장 mark=unknown 자동 갱신', async () => {
    mockFetchByUrlSuffix({ '/data/words/a1.json': WORDS_A1_FIXTURE });
    renderRoutes(routes, '/learn/A1/word/flashcard');
    await waitFor(() => screen.getByText(/hello|goodbye/i));

    await userEvent.click(screen.getByRole('button', { name: '뒤집기', exact: true }));
    await userEvent.click(screen.getByRole('button', { name: '모르겠음', exact: true }));

    await waitFor(async () => {
      const m1 = await getMark('w_a1_001');
      const m2 = await getMark('w_a1_002');
      expect([m1, m2]).toContain('unknown');
    });
  });

  it('기존 mark=known 인 카드에 모르겠음 → mark=unknown 으로 덮어씀', async () => {
    await setMark('w_a1_001', 'word', 'A1', 'known', Date.now());
    expect(await getMark('w_a1_001')).toBe('known');

    mockFetchByUrlSuffix({ '/data/words/a1.json': WORDS_A1_FIXTURE });
    renderRoutes(routes, '/learn/A1/word/flashcard');
    await waitFor(() => screen.getByText(/hello|goodbye/i));

    // 카드 답할 때까지 다음 카드로 넘기지 못하므로 — 첫 카드가 known 으로 마킹된 w_a1_001 이 아닐 수
    // 있다는 점을 감안해 두 카드 모두 답해보고 검증.
    for (let i = 0; i < 2; i++) {
      const flipBtn = screen.queryByRole('button', { name: '뒤집기', exact: true });
      const noBtn = screen.queryByRole('button', { name: '모르겠음', exact: true });
      if (flipBtn) await userEvent.click(flipBtn);
      const noBtn2 = screen.queryByRole('button', { name: '모르겠음', exact: true });
      if (noBtn2 ?? noBtn) await userEvent.click((noBtn2 ?? noBtn) as HTMLElement);
    }

    // 두 카드 모두 모르겠음 답변 후 w_a1_001 도 unknown 으로 덮어쓰여야 함
    await waitFor(async () => {
      expect(await getMark('w_a1_001')).toBe('unknown');
    });
  });
});
