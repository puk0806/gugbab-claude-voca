import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { WordEntry } from '@/content';
import { RecallPrompt } from './RecallPrompt';

const WORD: WordEntry = {
  id: 'w_a1_050',
  level: 'A1',
  english: 'apple',
  korean: '사과',
  partOfSpeech: 'noun',
};

describe('<RecallPrompt>', () => {
  it('한국어 프롬프트와 입력창이 렌더된다', () => {
    render(<RecallPrompt card={WORD} cardType="word" onAnswer={vi.fn()} />);
    expect(screen.getByText('사과')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '영어 입력' })).toBeInTheDocument();
  });

  it('정답 입력 + 제출 시 onAnswer("good") 호출 (관대 매칭)', async () => {
    const onAnswer = vi.fn();
    render(<RecallPrompt card={WORD} cardType="word" onAnswer={onAnswer} />);
    const input = screen.getByRole('textbox', { name: '영어 입력' });
    await userEvent.type(input, 'Apple.');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    expect(onAnswer).toHaveBeenCalledWith('good');
  });

  it('오답 입력 시 "정답 보기" 버튼이 노출된다', async () => {
    render(<RecallPrompt card={WORD} cardType="word" onAnswer={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox', { name: '영어 입력' }), 'appel');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    expect(screen.getByRole('button', { name: '정답 보기' })).toBeInTheDocument();
  });

  it('"정답 보기" 클릭 시 정답이 노출되고 onAnswer("again") 호출', async () => {
    const onAnswer = vi.fn();
    render(<RecallPrompt card={WORD} cardType="word" onAnswer={onAnswer} />);
    await userEvent.type(screen.getByRole('textbox', { name: '영어 입력' }), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    await userEvent.click(screen.getByRole('button', { name: '정답 보기' }));
    expect(onAnswer).toHaveBeenCalledWith('again');
    expect(screen.getByText('apple')).toBeInTheDocument();
  });

  it('Enter 키로도 제출 가능', async () => {
    const onAnswer = vi.fn();
    render(<RecallPrompt card={WORD} cardType="word" onAnswer={onAnswer} />);
    const input = screen.getByRole('textbox', { name: '영어 입력' });
    await userEvent.type(input, 'apple{Enter}');
    expect(onAnswer).toHaveBeenCalledWith('good');
  });

  it('빈 입력은 제출 비활성', () => {
    render(<RecallPrompt card={WORD} cardType="word" onAnswer={vi.fn()} />);
    expect(screen.getByRole('button', { name: '제출' })).toBeDisabled();
  });
});
