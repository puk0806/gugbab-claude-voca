import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressBar } from './ProgressBar';

describe('<ProgressBar>', () => {
  it('0~1 값을 0~100으로 매핑한다', () => {
    render(<ProgressBar value={0.6} ariaLabel="진도" />);
    const bar = screen.getByRole('progressbar', { name: '진도' });
    expect(bar).toHaveAttribute('aria-valuenow', '60');
  });

  it('음수 값은 0으로 clamp', () => {
    render(<ProgressBar value={-0.5} ariaLabel="t" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('1 초과 값은 100으로 clamp', () => {
    render(<ProgressBar value={2} ariaLabel="t" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});
