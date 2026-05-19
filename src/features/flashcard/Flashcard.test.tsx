import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { WordEntry } from '@/content';
import { Flashcard } from './Flashcard';

const WORD: WordEntry = {
  id: 'w_a1_001',
  level: 'A1',
  english: 'hello',
  korean: '안녕하세요',
  partOfSpeech: 'interjection',
};

describe('<Flashcard>', () => {
  it('초기에는 앞면(영어)이 표시되고 한국어는 숨겨진다', () => {
    render(<Flashcard card={WORD} cardType="word" onAnswer={vi.fn()} />);
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.queryByText('안녕하세요')).not.toBeInTheDocument();
  });

  it('"뒤집기" 버튼 클릭 시 뒷면(한국어)이 표시된다', async () => {
    render(<Flashcard card={WORD} cardType="word" onAnswer={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: '뒤집기' }));
    expect(screen.getByText('안녕하세요')).toBeInTheDocument();
  });

  it('뒤집은 후 "알았음" 클릭 시 onAnswer("good") 호출', async () => {
    const onAnswer = vi.fn();
    render(<Flashcard card={WORD} cardType="word" onAnswer={onAnswer} />);
    await userEvent.click(screen.getByRole('button', { name: '뒤집기' }));
    await userEvent.click(screen.getByRole('button', { name: '알았음' }));
    expect(onAnswer).toHaveBeenCalledWith('good');
  });

  it('뒤집은 후 "모르겠음" 클릭 시 onAnswer("again") 호출', async () => {
    const onAnswer = vi.fn();
    render(<Flashcard card={WORD} cardType="word" onAnswer={onAnswer} />);
    await userEvent.click(screen.getByRole('button', { name: '뒤집기' }));
    await userEvent.click(screen.getByRole('button', { name: '모르겠음' }));
    expect(onAnswer).toHaveBeenCalledWith('again');
  });

  it('cardType=word 시 품사가 표시된다', () => {
    render(<Flashcard card={WORD} cardType="word" onAnswer={vi.fn()} />);
    expect(screen.getByText('interjection')).toBeInTheDocument();
  });

  it('카드 id 변경 시 자동 reset (뒤집기 → 새 카드는 다시 앞면)', async () => {
    const { rerender } = render(<Flashcard card={WORD} cardType="word" onAnswer={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: '뒤집기' }));
    expect(screen.getByText('안녕하세요')).toBeInTheDocument();
    const NEXT: WordEntry = { ...WORD, id: 'w_a1_002', english: 'goodbye' };
    rerender(<Flashcard card={NEXT} cardType="word" onAnswer={vi.fn()} />);
    expect(screen.getByText('goodbye')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '알았음' })).not.toBeInTheDocument();
  });

  it('onSpeak prop이 있으면 스피커 버튼이 노출되고 호출된다', async () => {
    const onSpeak = vi.fn();
    render(
      <Flashcard card={WORD} cardType="word" onAnswer={vi.fn()} onSpeak={onSpeak} ttsSupported />,
    );
    await userEvent.click(screen.getByRole('button', { name: '영어 발음 듣기' }));
    expect(onSpeak).toHaveBeenCalledWith('hello');
  });
});
