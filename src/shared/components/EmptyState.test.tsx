import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('<EmptyState>', () => {
  it('title이 렌더된다', () => {
    render(<EmptyState title="아무것도 없어요" />);
    expect(screen.getByText('아무것도 없어요')).toBeInTheDocument();
  });

  it('description이 있으면 함께 렌더', () => {
    render(<EmptyState title="t" description="자세한 설명" />);
    expect(screen.getByText('자세한 설명')).toBeInTheDocument();
  });

  it('action 노드가 렌더된다', () => {
    render(<EmptyState title="t" action={<button type="button">CTA</button>} />);
    expect(screen.getByRole('button', { name: 'CTA' })).toBeInTheDocument();
  });
});
