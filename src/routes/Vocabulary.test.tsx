import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetchByUrlSuffix, renderRoutes, WORDS_A1_FIXTURE } from '@/__tests__/router-helpers';
import { resetContentCache } from '@/content';
import { resetDb } from '@/db/schema';
import { routes } from '@/router';

// react-virtuoso는 jsdom의 ResizeObserver/Intersection을 못 잡아 0px 렌더링.
// 테스트에서는 *모든 item을 일괄 평면 렌더* 하는 mock으로 대체.
vi.mock('react-virtuoso', () => ({
  Virtuoso: ({
    data,
    itemContent,
  }: {
    readonly data: readonly unknown[];
    readonly itemContent: (idx: number, item: unknown) => React.ReactNode;
  }) => (
    <div data-testid="virtuoso-mock">
      {data.map((item, idx) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: test mock
        <div key={idx}>{itemContent(idx, item)}</div>
      ))}
    </div>
  ),
}));

describe('Vocabulary route (/vocabulary/:cefr/:cardType)', () => {
  beforeEach(async () => {
    resetContentCache();
    await resetDb();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('단어 리스트와 검색 박스, 단계 필터 chip이 렌더된다', async () => {
    mockFetchByUrlSuffix({ '/data/words/a1.json': WORDS_A1_FIXTURE });
    renderRoutes(routes, '/vocabulary/A1/word');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /A1 단어장/ })).toBeInTheDocument();
    });
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('goodbye')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();

    // 단계 필터 chip 8개 (전체 + 7단계 with mastered)
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(8);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true'); // 전체 기본 선택
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

    await userEvent.click(screen.getByTestId('mark-known-w_a1_001'));
    // 정렬 변경으로 노드가 재마운트되므로 매번 testid로 재조회
    await waitFor(() => {
      expect(screen.getByTestId('mark-known-w_a1_001')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('단계 chip 클릭 시 필터링 적용', async () => {
    mockFetchByUrlSuffix({ '/data/words/a1.json': WORDS_A1_FIXTURE });
    renderRoutes(routes, '/vocabulary/A1/word');
    await waitFor(() => screen.getByText('hello'));

    // 초기 상태에서는 fixture 2개 모두 미학습이라 "미학습" chip 클릭 시 둘 다 보임
    const newChip = screen.getByRole('tab', { name: /미학습/ });
    await userEvent.click(newChip);
    expect(newChip).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('goodbye')).toBeInTheDocument();

    // "모름" chip 클릭 시 0개 (마크 없음)
    const unknownChip = screen.getByRole('tab', { name: /모름/ });
    await userEvent.click(unknownChip);
    expect(screen.queryByText('hello')).not.toBeInTheDocument();
  });

  it('"모름" 마크 후 모름 chip 필터링으로 해당 카드만 표시', async () => {
    mockFetchByUrlSuffix({ '/data/words/a1.json': WORDS_A1_FIXTURE });
    renderRoutes(routes, '/vocabulary/A1/word');
    await waitFor(() => screen.getByText('hello'));

    await userEvent.click(screen.getByTestId('mark-unknown-w_a1_001'));

    await userEvent.click(screen.getByRole('tab', { name: /모름/ }));
    await waitFor(() => {
      expect(screen.getByText('hello')).toBeInTheDocument();
      expect(screen.queryByText('goodbye')).not.toBeInTheDocument();
    });
  });
});
