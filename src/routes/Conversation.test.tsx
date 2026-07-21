import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UseConversationResult } from '@/features/conversation';

const sendMessage = vi.fn(async () => {});
const clearConversation = vi.fn(async () => {});

let hookResult: UseConversationResult;

function makeResult(overrides: Partial<UseConversationResult> = {}): UseConversationResult {
  return {
    ready: true,
    messages: [],
    streamingText: '',
    status: 'idle',
    sendMessage,
    clearConversation,
    ...overrides,
  };
}

vi.mock('@/features/conversation', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/conversation')>();
  return {
    ...original,
    useConversation: () => hookResult,
  };
});

import { Conversation } from './Conversation';

function renderConversation() {
  return render(
    <MemoryRouter>
      <Conversation />
    </MemoryRouter>,
  );
}

describe('<Conversation>', () => {
  beforeEach(() => {
    sendMessage.mockClear();
    clearConversation.mockClear();
    hookResult = makeResult();
  });

  it('빈 대화: 시작 안내와 입력창이 표시된다', () => {
    renderConversation();
    expect(screen.getByText(/영어로 인사해 보세요/)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '메시지 입력' })).toBeInTheDocument();
  });

  it('메시지 히스토리가 말풍선으로 렌더된다', () => {
    hookResult = makeResult({
      messages: [
        { id: 1, role: 'user', content: 'Hello!', createdAt: 1 },
        { id: 2, role: 'assistant', content: 'Hi! How are you?', createdAt: 2 },
      ],
    });
    renderConversation();
    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('Hi! How are you?')).toBeInTheDocument();
  });

  it('입력 후 전송 시 sendMessage 호출 + 입력창 비움', async () => {
    renderConversation();
    const input = screen.getByRole('textbox', { name: '메시지 입력' });
    await userEvent.type(input, 'Nice to meet you');
    await userEvent.click(screen.getByRole('button', { name: '전송' }));
    expect(sendMessage).toHaveBeenCalledWith('Nice to meet you');
    expect(input).toHaveValue('');
  });

  it('스트리밍 중: 진행 중 말풍선 표시 + 전송 비활성', () => {
    hookResult = makeResult({
      status: 'streaming',
      streamingText: 'Let me think',
      messages: [{ id: 1, role: 'user', content: 'Hey', createdAt: 1 }],
    });
    renderConversation();
    expect(screen.getByText('Let me think')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '전송' })).toBeDisabled();
  });

  it('에러 상태: 안내 문구가 표시된다', () => {
    hookResult = makeResult({ status: 'error' });
    renderConversation();
    expect(screen.getByText(/응답을 가져오지 못했어요/)).toBeInTheDocument();
  });

  it('새 대화 버튼 클릭 시 clearConversation 호출', async () => {
    hookResult = makeResult({
      messages: [{ id: 1, role: 'user', content: 'Hello!', createdAt: 1 }],
    });
    renderConversation();
    await userEvent.click(screen.getByRole('button', { name: '새 대화' }));
    expect(clearConversation).toHaveBeenCalledTimes(1);
  });
});
