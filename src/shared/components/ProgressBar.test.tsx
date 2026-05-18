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

  it('value 0 이면 fill width 도 0%', () => {
    render(<ProgressBar value={0} ariaLabel="t" />);
    const fill = screen.getByRole('progressbar').firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('0%');
  });

  it('value > 0 인데 percent 가 4 미만이면 최소 4% 가시화 (aria-valuenow 는 실제값 유지)', () => {
    // 5/899 = 0.0056 → 반올림 1% → 시각적으로 안 보임 → 4% 보정
    render(<ProgressBar value={5 / 899} ariaLabel="t" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '1'); // 의미는 1%
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('4%'); // 시각은 4%
  });

  it('value 가 4% 이상이면 보정 없이 그대로', () => {
    render(<ProgressBar value={0.1} ariaLabel="t" />);
    const fill = screen.getByRole('progressbar').firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('10%');
  });
});
