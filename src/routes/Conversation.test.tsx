import { render, screen, waitFor } from '@testing-library/react';
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
    localStorage.clear();
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

  it('입력 후 전송 시 sendMessage 호출(기본 모드 both) + 입력창 비움', async () => {
    renderConversation();
    const input = screen.getByRole('textbox', { name: '메시지 입력' });
    await userEvent.type(input, 'Nice to meet you');
    await userEvent.click(screen.getByRole('button', { name: '전송' }));
    expect(sendMessage).toHaveBeenCalledWith('Nice to meet you', 'both');
    expect(input).toHaveValue('');
  });

  it('부가 정보 라디오: 4개 옵션이 있고 기본값은 "둘 다"', () => {
    renderConversation();
    const group = screen.getByRole('radiogroup', { name: '답변 부가 정보' });
    expect(group).toBeInTheDocument();
    for (const label of ['영어만', '해석', '핵심표현', '둘 다']) {
      expect(screen.getByRole('radio', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole('radio', { name: '둘 다' })).toBeChecked();
  });

  it('라디오 변경 시 선택 모드로 전송하고 localStorage 에 저장한다', async () => {
    renderConversation();
    await userEvent.click(screen.getByRole('radio', { name: '영어만' }));
    expect(screen.getByRole('radio', { name: '영어만' })).toBeChecked();
    expect(localStorage.getItem('gugbab-voca:replyAidMode')).toBe('none');

    const input = screen.getByRole('textbox', { name: '메시지 입력' });
    await userEvent.type(input, 'Hello');
    await userEvent.click(screen.getByRole('button', { name: '전송' }));
    expect(sendMessage).toHaveBeenCalledWith('Hello', 'none');
  });

  it('저장된 모드가 있으면 초기 선택값으로 복원한다', () => {
    localStorage.setItem('gugbab-voca:replyAidMode', 'translation');
    renderConversation();
    expect(screen.getByRole('radio', { name: '해석' })).toBeChecked();
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

describe('<Conversation> 마이크 입력', () => {
  type OnResult = (event: {
    results: Record<number | string, unknown>;
    resultIndex?: number;
  }) => void;

  let lastRec: {
    onresult: OnResult | null;
    onend: (() => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    abort: ReturnType<typeof vi.fn>;
  } | null = null;
  const startMock = vi.fn();

  class MockRecognition {
    lang = '';
    continuous = true;
    interimResults = false;
    onresult: OnResult | null = null;
    onend: (() => void) | null = null;
    onerror: ((event: { error: string }) => void) | null = null;
    start = startMock;
    stop = vi.fn();
    abort = vi.fn();
    constructor() {
      lastRec = this;
    }
  }

  beforeEach(() => {
    hookResult = makeResult();
    startMock.mockClear();
    lastRec = null;
  });

  it('음성 인식 미지원 환경(jsdom 기본)에서는 마이크 버튼이 없다', () => {
    renderConversation();
    expect(screen.queryByRole('button', { name: '음성 입력' })).not.toBeInTheDocument();
  });

  it('지원 환경: 마이크 시작 → final 결과가 입력창에 반영된다', async () => {
    Reflect.set(window, 'SpeechRecognition', MockRecognition);
    try {
      renderConversation();
      const micBtn = await screen.findByRole('button', { name: '음성 입력' });
      await userEvent.click(micBtn);
      expect(startMock).toHaveBeenCalledTimes(1);
      // listening 상태 — 중지 라벨로 전환
      expect(screen.getByRole('button', { name: '음성 입력 중지' })).toBeInTheDocument();

      // final 인식 결과 수신
      lastRec?.onresult?.({
        results: { length: 1, 0: { isFinal: true, 0: { transcript: 'How are you' } } },
        resultIndex: 0,
      });
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: '메시지 입력' })).toHaveValue('How are you');
      });
    } finally {
      Reflect.deleteProperty(window, 'SpeechRecognition');
    }
  });

  it('interim 결과는 입력창이 아닌 힌트 영역에 표시된다', async () => {
    Reflect.set(window, 'SpeechRecognition', MockRecognition);
    try {
      renderConversation();
      await userEvent.click(await screen.findByRole('button', { name: '음성 입력' }));
      lastRec?.onresult?.({
        results: { length: 1, 0: { isFinal: false, 0: { transcript: 'hello th' } } },
        resultIndex: 0,
      });
      await waitFor(() => {
        expect(screen.getByText('hello th')).toBeInTheDocument();
      });
      expect(screen.getByRole('textbox', { name: '메시지 입력' })).toHaveValue('');
    } finally {
      Reflect.deleteProperty(window, 'SpeechRecognition');
    }
  });
  it('스트리밍 시작 시 진행 중이던 음성 인식을 abort 한다', async () => {
    Reflect.set(window, 'SpeechRecognition', MockRecognition);
    try {
      const { rerender } = renderConversation();
      await userEvent.click(await screen.findByRole('button', { name: '음성 입력' }));
      expect(screen.getByRole('button', { name: '음성 입력 중지' })).toBeInTheDocument();

      // interim 힌트가 떠 있는 상태에서 스트리밍 진입
      lastRec?.onresult?.({
        results: { length: 1, 0: { isFinal: false, 0: { transcript: 'hello th' } } },
        resultIndex: 0,
      });
      await waitFor(() => {
        expect(screen.getByText('hello th')).toBeInTheDocument();
      });

      // 전송으로 스트리밍 상태 진입 — mic 는 즉시 중단되고 UI 상태도 해제되어야 한다
      hookResult = makeResult({ status: 'streaming', streamingText: '...' });
      rerender(
        <MemoryRouter>
          <Conversation />
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(lastRec?.abort).toHaveBeenCalled();
      });
      // listening 해제(시작 라벨 복귀) + interim 힌트 제거 — abort 가 UI 상태를 동기 클리어
      expect(screen.getByRole('button', { name: '음성 입력' })).toBeInTheDocument();
      expect(screen.queryByText('hello th')).not.toBeInTheDocument();
    } finally {
      Reflect.deleteProperty(window, 'SpeechRecognition');
    }
  });

  it('인식 에러는 정규화된 한국어 안내 문구로 표시된다', async () => {
    Reflect.set(window, 'SpeechRecognition', MockRecognition);
    try {
      renderConversation();
      await userEvent.click(await screen.findByRole('button', { name: '음성 입력' }));
      lastRec?.onerror?.({ error: 'not-allowed' });
      lastRec?.onend?.();
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('마이크 권한이 필요합니다');
      });
      // 에러 후 listening 해제 — 버튼이 시작 라벨로 복귀
      expect(screen.getByRole('button', { name: '음성 입력' })).toBeInTheDocument();
    } finally {
      Reflect.deleteProperty(window, 'SpeechRecognition');
    }
  });

  it('한 이벤트에 final+interim 이 배치로 오면 final 은 입력, interim 은 힌트로 반영된다', async () => {
    Reflect.set(window, 'SpeechRecognition', MockRecognition);
    try {
      renderConversation();
      await userEvent.click(await screen.findByRole('button', { name: '음성 입력' }));
      lastRec?.onresult?.({
        results: {
          length: 2,
          0: { isFinal: true, 0: { transcript: 'How are you' } },
          1: { isFinal: false, 0: { transcript: 'doing' } },
        },
        resultIndex: 0,
      });
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: '메시지 입력' })).toHaveValue('How are you');
      });
      expect(screen.getByText('doing')).toBeInTheDocument();
    } finally {
      Reflect.deleteProperty(window, 'SpeechRecognition');
    }
  });
});
