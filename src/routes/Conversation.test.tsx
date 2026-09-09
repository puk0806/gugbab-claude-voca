import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    lang: string;
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
    localStorage.clear();
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
  it('언어 토글: 기본 EN(en-US), 클릭 시 한(ko-KR)으로 전환·저장되고 인식 lang 에 반영된다', async () => {
    Reflect.set(window, 'SpeechRecognition', MockRecognition);
    try {
      renderConversation();
      const langBtn = await screen.findByRole('button', { name: '음성 인식 언어 전환' });
      expect(langBtn).toHaveTextContent('EN');

      // 기본 언어로 시작 → en-US
      await userEvent.click(screen.getByRole('button', { name: '음성 입력' }));
      expect(lastRec?.lang).toBe('en-US');
      await userEvent.click(screen.getByRole('button', { name: '음성 입력 중지' }));

      // 토글 → 한국어 저장 + 다음 세션 ko-KR
      await userEvent.click(langBtn);
      expect(langBtn).toHaveTextContent('한');
      expect(localStorage.getItem('gugbab-voca:micLang')).toBe('ko-KR');
      await userEvent.click(screen.getByRole('button', { name: '음성 입력' }));
      expect(lastRec?.lang).toBe('ko-KR');
    } finally {
      Reflect.deleteProperty(window, 'SpeechRecognition');
    }
  });

  it('청취 중 언어 토글 시 진행 세션을 abort 하고 시작 라벨로 복귀한다', async () => {
    Reflect.set(window, 'SpeechRecognition', MockRecognition);
    try {
      renderConversation();
      await userEvent.click(await screen.findByRole('button', { name: '음성 입력' }));
      const active = lastRec;
      await userEvent.click(screen.getByRole('button', { name: '음성 인식 언어 전환' }));
      expect(active?.abort).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: '음성 입력' })).toBeInTheDocument();
    } finally {
      Reflect.deleteProperty(window, 'SpeechRecognition');
    }
  });

  it('저장된 마이크 언어(ko-KR)를 초기값으로 복원한다', async () => {
    localStorage.setItem('gugbab-voca:micLang', 'ko-KR');
    Reflect.set(window, 'SpeechRecognition', MockRecognition);
    try {
      renderConversation();
      const langBtn = await screen.findByRole('button', { name: '음성 인식 언어 전환' });
      expect(langBtn).toHaveTextContent('한');
    } finally {
      Reflect.deleteProperty(window, 'SpeechRecognition');
    }
  });
  it('언어 전환 후 이전 세션의 늦은 콜백은 입력·힌트를 오염시키지 않는다', async () => {
    Reflect.set(window, 'SpeechRecognition', MockRecognition);
    try {
      renderConversation();
      await userEvent.click(await screen.findByRole('button', { name: '음성 입력' }));
      const staleRec = lastRec;

      // 청취 중 언어 토글 → 이전 세션 abort, 새(ko-KR) 세션 시작
      await userEvent.click(screen.getByRole('button', { name: '음성 인식 언어 전환' }));
      await userEvent.click(screen.getByRole('button', { name: '음성 입력' }));
      expect(lastRec).not.toBe(staleRec);

      // 이전 인스턴스의 지연 final/onend 발화 — 무시되어야 한다
      staleRec?.onresult?.({
        results: { length: 1, 0: { isFinal: true, 0: { transcript: 'stale text' } } },
        resultIndex: 0,
      });
      staleRec?.onend?.();
      expect(screen.getByRole('textbox', { name: '메시지 입력' })).toHaveValue('');
      // 새 세션은 계속 청취 중 (stale onend 가 listening 을 뒤집지 않음)
      expect(screen.getByRole('button', { name: '음성 입력 중지' })).toBeInTheDocument();

      // 새 세션 결과는 정상 반영
      lastRec?.onresult?.({
        results: { length: 1, 0: { isFinal: true, 0: { transcript: '안녕하세요' } } },
        resultIndex: 0,
      });
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: '메시지 입력' })).toHaveValue('안녕하세요');
      });
    } finally {
      Reflect.deleteProperty(window, 'SpeechRecognition');
    }
  });

  it('언어 토글 시 이전 언어의 에러 배너를 숨긴다 (새 세션 에러는 다시 표시)', async () => {
    Reflect.set(window, 'SpeechRecognition', MockRecognition);
    try {
      renderConversation();
      await userEvent.click(await screen.findByRole('button', { name: '음성 입력' }));
      lastRec?.onerror?.({ error: 'no-speech' });
      lastRec?.onend?.();
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('음성이 감지되지 않았습니다');
      });

      // 언어 토글 → 이전 에러 배너 숨김
      await userEvent.click(screen.getByRole('button', { name: '음성 인식 언어 전환' }));
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });

      // 새 세션에서 다시 에러 → 다시 표시
      await userEvent.click(screen.getByRole('button', { name: '음성 입력' }));
      lastRec?.onerror?.({ error: 'network' });
      lastRec?.onend?.();
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('네트워크 오류');
      });
    } finally {
      Reflect.deleteProperty(window, 'SpeechRecognition');
    }
  });

  it('스트리밍 중에는 언어 토글 버튼이 비활성화된다', async () => {
    Reflect.set(window, 'SpeechRecognition', MockRecognition);
    try {
      hookResult = makeResult({ status: 'streaming', streamingText: '...' });
      renderConversation();
      const langBtn = await screen.findByRole('button', { name: '음성 인식 언어 전환' });
      expect(langBtn).toBeDisabled();
    } finally {
      Reflect.deleteProperty(window, 'SpeechRecognition');
    }
  });
});
describe('<Conversation> 스피커(TTS)', () => {
  const speakMock = vi.fn();
  const cancelMock = vi.fn();

  beforeEach(() => {
    speakMock.mockClear();
    cancelMock.mockClear();
    localStorage.clear();
    hookResult = makeResult();
    Reflect.set(window, 'speechSynthesis', {
      speak: speakMock,
      cancel: cancelMock,
      getVoices: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
    });
    Reflect.set(
      window,
      'SpeechSynthesisUtterance',
      class {
        text: string;
        lang = '';
        rate = 1;
        constructor(text: string) {
          this.text = text;
        }
        addEventListener() {}
      },
    );
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'speechSynthesis');
    Reflect.deleteProperty(window, 'SpeechSynthesisUtterance');
  });

  function lastSpokenText(): string {
    const utter = speakMock.mock.calls.at(-1)?.[0] as { text: string } | undefined;
    return utter?.text ?? '';
  }

  it('assistant 말풍선에 🔊 버튼이 있고, 클릭 시 영어 부분만 발화한다', async () => {
    hookResult = makeResult({
      messages: [
        { id: 1, role: 'user', content: 'Hi', createdAt: 1 },
        {
          id: 2,
          role: 'assistant',
          content:
            'Nice to meet you!\n\n(만나서 반가워요!)\n\n📌 핵심 표현\n- nice to meet you — 만나서 반갑다',
          createdAt: 2,
        },
      ],
    });
    renderConversation();
    const btn = await screen.findByRole('button', { name: '영어 대답 듣기' });
    await userEvent.click(btn);
    expect(lastSpokenText()).toBe('Nice to meet you!');
  });

  it('자동 읽기 ON(기본): 새 assistant 메시지가 오면 영어 부분을 자동 발화한다', async () => {
    const { rerender } = renderConversation();
    hookResult = makeResult({
      messages: [
        { id: 1, role: 'user', content: 'Hi', createdAt: 1 },
        { id: 2, role: 'assistant', content: 'Hello there!\n\n(안녕하세요!)', createdAt: 2 },
      ],
    });
    rerender(
      <MemoryRouter>
        <Conversation />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(lastSpokenText()).toBe('Hello there!');
    });
    // 같은 메시지 재렌더에 중복 발화하지 않는다
    const count = speakMock.mock.calls.length;
    rerender(
      <MemoryRouter>
        <Conversation />
      </MemoryRouter>,
    );
    expect(speakMock.mock.calls.length).toBe(count);
  });

  it('자동 읽기 토글 OFF 시 새 답변을 발화하지 않고, 설정이 저장된다', async () => {
    const { rerender } = renderConversation();
    const toggle = await screen.findByRole('switch', { name: '답변 자동 읽기' });
    await userEvent.click(toggle);
    expect(localStorage.getItem('gugbab-voca:autoSpeak')).toBe('off');

    hookResult = makeResult({
      messages: [
        { id: 1, role: 'user', content: 'Hi', createdAt: 1 },
        { id: 2, role: 'assistant', content: 'Quiet reply.', createdAt: 2 },
      ],
    });
    rerender(
      <MemoryRouter>
        <Conversation />
      </MemoryRouter>,
    );
    expect(speakMock).not.toHaveBeenCalled();
  });

  it('저장된 OFF 설정을 초기값으로 복원한다', async () => {
    localStorage.setItem('gugbab-voca:autoSpeak', 'off');
    renderConversation();
    const toggle = await screen.findByRole('switch', { name: '답변 자동 읽기' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('마이크 시작 시 진행 중이던 발화를 정지한다 (재인식 루프 차단)', async () => {
    class MockRecognition {
      lang = '';
      continuous = false;
      interimResults = true;
      onresult = null;
      onend = null;
      onerror = null;
      start = vi.fn();
      stop = vi.fn();
      abort = vi.fn();
    }
    Reflect.set(window, 'SpeechRecognition', MockRecognition);
    try {
      renderConversation();
      cancelMock.mockClear();
      await userEvent.click(await screen.findByRole('button', { name: '음성 입력' }));
      expect(cancelMock).toHaveBeenCalled();
    } finally {
      Reflect.deleteProperty(window, 'SpeechRecognition');
    }
  });
  it('마운트 시 로드된 과거 히스토리의 마지막 답변은 자동 발화하지 않는다', async () => {
    // 실제 useConversation 의 하이드레이션과 동일하게 ready=false → true + 히스토리 동시 반영
    hookResult = makeResult({ ready: false });
    const { rerender } = renderConversation();
    hookResult = makeResult({
      ready: true,
      messages: [
        { id: 1, role: 'user', content: 'Hi', createdAt: 1 },
        { id: 2, role: 'assistant', content: 'Old reply from yesterday.', createdAt: 2 },
      ],
    });
    rerender(
      <MemoryRouter>
        <Conversation />
      </MemoryRouter>,
    );
    await screen.findByText('Old reply from yesterday.');
    expect(speakMock).not.toHaveBeenCalled();

    // 이후 새로 도착한 답변은 읽는다
    hookResult = makeResult({
      ready: true,
      messages: [
        { id: 1, role: 'user', content: 'Hi', createdAt: 1 },
        { id: 2, role: 'assistant', content: 'Old reply from yesterday.', createdAt: 2 },
        { id: 3, role: 'user', content: 'More', createdAt: 3 },
        { id: 4, role: 'assistant', content: 'Fresh reply!', createdAt: 4 },
      ],
    });
    rerender(
      <MemoryRouter>
        <Conversation />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(lastSpokenText()).toBe('Fresh reply!');
    });
  });

  it('재생 중 다른 말풍선 🔊 클릭 시 그 답변으로 전환 재생, 같은 말풍선은 정지한다', async () => {
    hookResult = makeResult({
      messages: [
        { id: 1, role: 'assistant', content: 'First answer.', createdAt: 1 },
        { id: 2, role: 'assistant', content: 'Second answer.', createdAt: 2 },
      ],
    });
    renderConversation();
    const buttons = await screen.findAllByRole('button', { name: '영어 대답 듣기' });

    // 첫 말풍선 재생 시작 (mock 이 end 이벤트를 안 쏘므로 speaking 유지)
    await userEvent.click(buttons[0] as HTMLElement);
    expect(lastSpokenText()).toBe('First answer.');

    // 다른 말풍선 클릭 → 정지가 아니라 전환 재생
    await userEvent.click(buttons[1] as HTMLElement);
    expect(lastSpokenText()).toBe('Second answer.');

    // 같은 말풍선 재클릭 → 정지 (speak 추가 호출 없음)
    const calls = speakMock.mock.calls.length;
    await userEvent.click(buttons[1] as HTMLElement);
    expect(cancelMock).toHaveBeenCalled();
    expect(speakMock.mock.calls.length).toBe(calls);
  });
});
