import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SentenceEntry } from '@/content';
import { ClozePrompt } from './ClozePrompt';

const SENTENCE: SentenceEntry = {
  id: 's_a1_009',
  level: 'A1',
  english: 'I {go} to school every day.',
  korean: '저는 매일 학교에 가요.',
  cloze: ['go'],
};

const MULTI: SentenceEntry = {
  id: 's_a1_xxx',
  level: 'A1',
  english: 'I {go} to {school}.',
  korean: '나는 학교에 간다.',
  cloze: ['go', 'school'],
};

describe('<ClozePrompt>', () => {
  it('빈칸 1개 카드: 입력창 1개와 한국어 힌트가 렌더된다', () => {
    render(<ClozePrompt card={SENTENCE} onAnswer={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: '빈칸 1 입력' })).toBeInTheDocument();
    expect(screen.getByText('저는 매일 학교에 가요.')).toBeInTheDocument();
  });

  it('정답 입력 + 제출 시 onAnswer("good")', async () => {
    const onAnswer = vi.fn();
    render(<ClozePrompt card={SENTENCE} onAnswer={onAnswer} />);
    await userEvent.type(screen.getByRole('textbox', { name: '빈칸 1 입력' }), 'go');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    expect(onAnswer).toHaveBeenCalledWith('good');
  });

  it('오답 시 "정답 보기" 버튼 노출', async () => {
    render(<ClozePrompt card={SENTENCE} onAnswer={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox', { name: '빈칸 1 입력' }), 'went');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    expect(screen.getByRole('button', { name: '정답 보기' })).toBeInTheDocument();
  });

  it('빈칸 2개 카드: 입력창 2개 표시', () => {
    render(<ClozePrompt card={MULTI} onAnswer={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: '빈칸 1 입력' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '빈칸 2 입력' })).toBeInTheDocument();
  });

  it('빈칸 2개 모두 정답이면 good. 하나라도 비면 제출 비활성', async () => {
    const onAnswer = vi.fn();
    render(<ClozePrompt card={MULTI} onAnswer={onAnswer} />);
    expect(screen.getByRole('button', { name: '제출' })).toBeDisabled();

    await userEvent.type(screen.getByRole('textbox', { name: '빈칸 1 입력' }), 'go');
    expect(screen.getByRole('button', { name: '제출' })).toBeDisabled();

    await userEvent.type(screen.getByRole('textbox', { name: '빈칸 2 입력' }), 'school');
    expect(screen.getByRole('button', { name: '제출' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    expect(onAnswer).toHaveBeenCalledWith('good');
  });

  it('빈칸 2개 중 하나만 오답이면 again 처리', async () => {
    const onAnswer = vi.fn();
    render(<ClozePrompt card={MULTI} onAnswer={onAnswer} />);
    await userEvent.type(screen.getByRole('textbox', { name: '빈칸 1 입력' }), 'go');
    await userEvent.type(screen.getByRole('textbox', { name: '빈칸 2 입력' }), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    await userEvent.click(screen.getByRole('button', { name: '정답 보기' }));
    expect(onAnswer).toHaveBeenCalledWith('again');
  });
});
