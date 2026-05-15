import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { routes } from '@/router';
import { NotFound } from './NotFound';

describe('<NotFound>', () => {
  it('"페이지를 찾을 수 없어요" 안내를 렌더한다', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );
    expect(screen.getByText(/페이지를 찾을 수 없어요/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '홈으로' })).toBeInTheDocument();
  });
});

describe('NotFound route 등록', () => {
  it('router의 와일드카드(*) 라우트가 NotFound 컴포넌트로 매핑되어 있다', () => {
    const rootRoute = routes[0];
    expect(rootRoute).toBeDefined();
    const wildcard = rootRoute?.children?.find((r) => r.path === '*');
    expect(wildcard).toBeDefined();
    expect(wildcard?.Component).toBe(NotFound);
  });
});
