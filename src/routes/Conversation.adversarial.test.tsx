/**
 * 대화 화면 적대적 사용자 시나리오 — mocked useConversation 기반 UI 방어 검증.
 * (relay mock e2e 는 e2e/visual/conversation.spec.ts)
 */
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

describe('<Conversation> 적대적 시나리오', () => {
  beforeEach(() => {
    sendMessage.mockClear();
    clearConversation.mockClear();
    hookResult = makeResult();
  });

  it('메시지의 HTML/script 콘텐츠는 텍스트로만 렌더된다 (XSS 차단)', () => {
    const hostile = '<img src=x onerror=alert(1)><script>alert(2)</script>';
    hookResult = makeResult({
      messages: [{ id: 1, role: 'assistant', content: hostile, createdAt: 1 }],
    });
    const { container } = renderConversation();
    expect(screen.getByText(hostile)).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
  });

  it('스트리밍 텍스트도 텍스트로만 렌더된다', () => {
    hookResult = makeResult({ status: 'streaming', streamingText: '<svg onload=alert(1)>' });
    const { container } = renderConversation();
    expect(screen.getByText('<svg onload=alert(1)>')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
  });

  it('전송 연타: 첫 클릭 후 입력이 비워져 두 번째 클릭은 무시된다', async () => {
    renderConversation();
    await userEvent.type(screen.getByRole('textbox', { name: '메시지 입력' }), 'double!');
    const button = screen.getByRole('button', { name: '전송' });
    await userEvent.click(button);
    await userEvent.click(button);
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it('스트리밍 중에는 Enter 로도 전송되지 않는다', async () => {
    hookResult = makeResult({ status: 'streaming', streamingText: '...' });
    renderConversation();
    const input = screen.getByRole('textbox', { name: '메시지 입력' });
    await userEvent.type(input, 'interrupt{Enter}');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('공백만 입력하면 전송 버튼이 비활성이고 Enter 도 무시된다', async () => {
    renderConversation();
    const input = screen.getByRole('textbox', { name: '메시지 입력' });
    await userEvent.type(input, '   {Enter}');
    expect(sendMessage).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '전송' })).toBeDisabled();
  });

  it('거대 입력(10k자)도 그대로 전송을 시도한다 (앞단 크래시 없음)', async () => {
    renderConversation();
    const big = 'a'.repeat(10_000);
    const input = screen.getByRole('textbox', { name: '메시지 입력' });
    // userEvent.type 은 10k 키 입력이라 느림 — paste 로 주입
    await userEvent.click(input);
    await userEvent.paste(big);
    await userEvent.click(screen.getByRole('button', { name: '전송' }));
    expect(sendMessage).toHaveBeenCalledWith(big, 'both');
  });
});
