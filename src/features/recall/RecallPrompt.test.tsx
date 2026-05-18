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

const WORD2: WordEntry = {
  id: 'w_a1_051',
  level: 'A1',
  english: 'banana',
  korean: '바나나',
  partOfSpeech: 'noun',
};

describe('<RecallPrompt>', () => {
  it('한국어 프롬프트와 입력창이 렌더된다', () => {
    render(<RecallPrompt card={WORD} cardType="word" onAnswer={vi.fn()} />);
    expect(screen.getByText('사과')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '영어 입력' })).toBeInTheDocument();
  });

  it('정답 입력 + 제출 시 "정답입니다!" 피드백 + "다음 카드" 버튼 노출, onAnswer 즉시 호출 X', async () => {
    const onAnswer = vi.fn();
    render(<RecallPrompt card={WORD} cardType="word" onAnswer={onAnswer} />);
    await userEvent.type(screen.getByRole('textbox', { name: '영어 입력' }), 'Apple.');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    expect(screen.getByText('정답입니다!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 카드' })).toBeInTheDocument();
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('정답 후 "다음 카드" 클릭 시 onAnswer("good") 호출', async () => {
    const onAnswer = vi.fn();
    render(<RecallPrompt card={WORD} cardType="word" onAnswer={onAnswer} />);
    await userEvent.type(screen.getByRole('textbox', { name: '영어 입력' }), 'apple');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    await userEvent.click(screen.getByRole('button', { name: '다음 카드' }));
    expect(onAnswer).toHaveBeenCalledWith('good');
  });

  it('오답 입력 시 "틀렸어요" 피드백 + "다시 시도"/"정답 보기" 버튼 노출, onAnswer 호출 X', async () => {
    const onAnswer = vi.fn();
    render(<RecallPrompt card={WORD} cardType="word" onAnswer={onAnswer} />);
    await userEvent.type(screen.getByRole('textbox', { name: '영어 입력' }), 'appel');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    expect(screen.getByText(/틀렸어요/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '정답 보기' })).toBeInTheDocument();
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('"정답 보기" 클릭 시 정답 노출 + "다음 카드" 버튼, onAnswer 즉시 호출 X (advance 방지)', async () => {
    const onAnswer = vi.fn();
    render(<RecallPrompt card={WORD} cardType="word" onAnswer={onAnswer} />);
    await userEvent.type(screen.getByRole('textbox', { name: '영어 입력' }), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    await userEvent.click(screen.getByRole('button', { name: '정답 보기' }));
    // 정답이 노출되어야 함
    expect(screen.getByText('apple')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 카드' })).toBeInTheDocument();
    // onAnswer 는 아직 호출되면 안 됨 — 부모가 advance 하면 정답을 못 봄
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('정답 보기 후 "다음 카드" 클릭 시 onAnswer("again") 호출', async () => {
    const onAnswer = vi.fn();
    render(<RecallPrompt card={WORD} cardType="word" onAnswer={onAnswer} />);
    await userEvent.type(screen.getByRole('textbox', { name: '영어 입력' }), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    await userEvent.click(screen.getByRole('button', { name: '정답 보기' }));
    await userEvent.click(screen.getByRole('button', { name: '다음 카드' }));
    expect(onAnswer).toHaveBeenCalledWith('again');
  });

  it('"다시 시도" 클릭 시 입력 reset, onAnswer 호출 X', async () => {
    const onAnswer = vi.fn();
    render(<RecallPrompt card={WORD} cardType="word" onAnswer={onAnswer} />);
    await userEvent.type(screen.getByRole('textbox', { name: '영어 입력' }), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    const input = screen.getByRole('textbox', { name: '영어 입력' });
    expect(input).toHaveValue('');
    expect(input).not.toBeDisabled();
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('Enter 키 제출도 동일 흐름 (정답 → 피드백 표시, advance X)', async () => {
    const onAnswer = vi.fn();
    render(<RecallPrompt card={WORD} cardType="word" onAnswer={onAnswer} />);
    await userEvent.type(screen.getByRole('textbox', { name: '영어 입력' }), 'apple{Enter}');
    expect(screen.getByText('정답입니다!')).toBeInTheDocument();
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('빈 입력은 제출 비활성', () => {
    render(<RecallPrompt card={WORD} cardType="word" onAnswer={vi.fn()} />);
    expect(screen.getByRole('button', { name: '제출' })).toBeDisabled();
  });

  it('3회 연속 오답 시 자동으로 정답 노출 (onAnswer 호출 X)', async () => {
    const onAnswer = vi.fn();
    render(<RecallPrompt card={WORD} cardType="word" onAnswer={onAnswer} />);
    for (let i = 0; i < 3; i++) {
      const input = screen.getByRole('textbox', { name: '영어 입력' });
      await userEvent.clear(input);
      await userEvent.type(input, `wrong${i}`);
      await userEvent.click(screen.getByRole('button', { name: '제출' }));
      if (i < 2) {
        await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
      }
    }
    // 3회째 오답 후 자동 reveal — 정답이 보여야 하고 "다음 카드" 가 있어야 함
    expect(screen.getByText('apple')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 카드' })).toBeInTheDocument();
    // 아직 onAnswer 호출은 X
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('회귀: card prop 변경 시 reveal·submitted state 자동 reset', async () => {
    const onAnswer = vi.fn();
    const { rerender } = render(<RecallPrompt card={WORD} cardType="word" onAnswer={onAnswer} />);
    // 1번째 카드에서 reveal까지
    await userEvent.type(screen.getByRole('textbox', { name: '영어 입력' }), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    await userEvent.click(screen.getByRole('button', { name: '정답 보기' }));
    expect(screen.getByText('apple')).toBeInTheDocument();

    // 2번째 카드로 prop 변경
    rerender(<RecallPrompt card={WORD2} cardType="word" onAnswer={onAnswer} />);

    // 새 카드: 한국어 프롬프트 갱신 + reveal 사라짐 + 입력 활성
    expect(screen.getByText('바나나')).toBeInTheDocument();
    expect(screen.queryByText('apple')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '영어 입력' })).not.toBeDisabled();
    expect(screen.queryByRole('button', { name: '다음 카드' })).not.toBeInTheDocument();
  });
});
