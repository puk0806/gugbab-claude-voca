import { render, screen } from '@testing-library/react';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Root, RouteError } from './Root';

describe('<Root>', () => {
  it('루트 경로에서 헤더 "gugbab-voca"가 표시된다', () => {
    const router = createMemoryRouter(
      [{ path: '/', Component: Root, children: [{ index: true, element: <div>홈</div> }] }],
      { initialEntries: ['/'] },
    );
    render(<RouterProvider router={router} />);
    expect(screen.getAllByText('gugbab-voca').length).toBeGreaterThan(0);
  });

  it('서브 경로에서 뒤로 가기 버튼이 표시된다', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          Component: Root,
          children: [{ path: 'level/A1', element: <div>레벨</div> }],
        },
      ],
      { initialEntries: ['/level/A1'] },
    );
    render(<RouterProvider router={router} />);
    expect(screen.getByRole('button', { name: /뒤로 가기/ })).toBeInTheDocument();
  });
});

describe('<RouteError>', () => {
  it('에러 화면을 렌더한다', () => {
    render(
      <MemoryRouter>
        <RouteError />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /문제가 발생했어요/ })).toBeInTheDocument();
  });
});
