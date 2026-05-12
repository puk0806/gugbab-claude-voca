import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
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
