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

const SENTENCE2: SentenceEntry = {
  id: 's_a1_010',
  level: 'A1',
  english: 'She is a {teacher}.',
  korean: '그녀는 선생님이에요.',
  cloze: ['teacher'],
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

  it('정답 입력 + 제출 시 "정답입니다!" 피드백 + "다음 카드" 버튼, onAnswer 즉시 호출 X', async () => {
    const onAnswer = vi.fn();
    render(<ClozePrompt card={SENTENCE} onAnswer={onAnswer} />);
    await userEvent.type(screen.getByRole('textbox', { name: '빈칸 1 입력' }), 'go');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    expect(screen.getByText('정답입니다!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 카드' })).toBeInTheDocument();
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('정답 후 "다음 카드" 클릭 시 onAnswer("good")', async () => {
    const onAnswer = vi.fn();
    render(<ClozePrompt card={SENTENCE} onAnswer={onAnswer} />);
    await userEvent.type(screen.getByRole('textbox', { name: '빈칸 1 입력' }), 'go');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    await userEvent.click(screen.getByRole('button', { name: '다음 카드' }));
    expect(onAnswer).toHaveBeenCalledWith('good');
  });

  it('오답 시 "틀렸어요" 피드백 + "다시 시도"/"정답 보기" 노출, onAnswer 호출 X', async () => {
    const onAnswer = vi.fn();
    render(<ClozePrompt card={SENTENCE} onAnswer={onAnswer} />);
    await userEvent.type(screen.getByRole('textbox', { name: '빈칸 1 입력' }), 'went');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    expect(screen.getByText(/틀렸어요/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '정답 보기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('"정답 보기" 클릭 시 정답 노출, onAnswer 즉시 호출 X (advance 방지)', async () => {
    const onAnswer = vi.fn();
    render(<ClozePrompt card={SENTENCE} onAnswer={onAnswer} />);
    await userEvent.type(screen.getByRole('textbox', { name: '빈칸 1 입력' }), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    await userEvent.click(screen.getByRole('button', { name: '정답 보기' }));
    // 정답 텍스트 노출 — '정답:' 영역 안에 'go' 있어야
    const revealBlock = screen.getByRole('status', { name: '' });
    expect(revealBlock).toHaveTextContent('go');
    expect(screen.getByRole('button', { name: '다음 카드' })).toBeInTheDocument();
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('정답 보기 후 "다음 카드" → onAnswer("again")', async () => {
    const onAnswer = vi.fn();
    render(<ClozePrompt card={SENTENCE} onAnswer={onAnswer} />);
    await userEvent.type(screen.getByRole('textbox', { name: '빈칸 1 입력' }), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    await userEvent.click(screen.getByRole('button', { name: '정답 보기' }));
    await userEvent.click(screen.getByRole('button', { name: '다음 카드' }));
    expect(onAnswer).toHaveBeenCalledWith('again');
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
    await userEvent.click(screen.getByRole('button', { name: '다음 카드' }));
    expect(onAnswer).toHaveBeenCalledWith('good');
  });

  it('빈칸 2개 중 하나만 오답 → 정답 보기 → 다음 카드 시 again', async () => {
    const onAnswer = vi.fn();
    render(<ClozePrompt card={MULTI} onAnswer={onAnswer} />);
    await userEvent.type(screen.getByRole('textbox', { name: '빈칸 1 입력' }), 'go');
    await userEvent.type(screen.getByRole('textbox', { name: '빈칸 2 입력' }), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    await userEvent.click(screen.getByRole('button', { name: '정답 보기' }));
    await userEvent.click(screen.getByRole('button', { name: '다음 카드' }));
    expect(onAnswer).toHaveBeenCalledWith('again');
  });

  it('3회 연속 오답 시 자동 reveal (onAnswer 호출 X)', async () => {
    const onAnswer = vi.fn();
    render(<ClozePrompt card={SENTENCE} onAnswer={onAnswer} />);
    for (let i = 0; i < 3; i++) {
      const input = screen.getByRole('textbox', { name: '빈칸 1 입력' });
      await userEvent.clear(input);
      await userEvent.type(input, `wrong${i}`);
      await userEvent.click(screen.getByRole('button', { name: '제출' }));
      if (i < 2) {
        await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
      }
    }
    // 3회째 자동 reveal — 정답 노출 + "다음 카드" 노출
    expect(screen.getByRole('button', { name: '다음 카드' })).toBeInTheDocument();
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('회귀: card prop 변경 시 reveal·submitted state 자동 reset', async () => {
    const onAnswer = vi.fn();
    const { rerender } = render(<ClozePrompt card={SENTENCE} onAnswer={onAnswer} />);
    // 1번째 카드에서 reveal까지
    await userEvent.type(screen.getByRole('textbox', { name: '빈칸 1 입력' }), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: '제출' }));
    await userEvent.click(screen.getByRole('button', { name: '정답 보기' }));
    expect(screen.getByRole('button', { name: '다음 카드' })).toBeInTheDocument();

    // 2번째 카드로 prop 변경
    rerender(<ClozePrompt card={SENTENCE2} onAnswer={onAnswer} />);

    // 새 카드: 한국어 갱신 + reveal 사라짐 + 입력 활성
    expect(screen.getByText('그녀는 선생님이에요.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '빈칸 1 입력' })).not.toBeDisabled();
    expect(screen.queryByRole('button', { name: '다음 카드' })).not.toBeInTheDocument();
  });
});
