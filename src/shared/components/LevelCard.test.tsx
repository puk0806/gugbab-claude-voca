import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LevelCard } from './LevelCard';

describe('<LevelCard>', () => {
  it('레벨 텍스트와 subtitle을 렌더한다', () => {
    render(
      <LevelCard
        level="A1"
        subtitle="기초 일상"
        totalCount={120}
        learnedCount={30}
        dueCount={5}
      />,
    );
    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.getByText('기초 일상')).toBeInTheDocument();
  });

  it('disabled=true이면 "콘텐츠 준비 중"이 표시되고 클릭이 무시된다', async () => {
    const handle = vi.fn();
    render(
      <LevelCard
        level="A2"
        subtitle=""
        totalCount={0}
        learnedCount={0}
        dueCount={0}
        disabled
        onClick={handle}
      />,
    );
    expect(screen.getByText(/콘텐츠 준비 중/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button'));
    expect(handle).not.toHaveBeenCalled();
  });

  it('dueCount > 0이면 due 배지 표시', () => {
    render(
      <LevelCard
        level="A1"
        subtitle=""
        totalCount={10}
        learnedCount={2}
        dueCount={7}
      />,
    );
    expect(screen.getByLabelText(/오늘 복습 7장/)).toBeInTheDocument();
  });

  it('활성 상태에서 onClick 호출된다', async () => {
    const handle = vi.fn();
    render(
      <LevelCard
        level="A1"
        subtitle=""
        totalCount={10}
        learnedCount={0}
        dueCount={0}
        onClick={handle}
      />,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(handle).toHaveBeenCalledTimes(1);
  });
});
