import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listChatMessages } from '@/db';
import { resetDb } from '@/db/schema';
import { ENGLISH_TUTOR_SYSTEM_PROMPT } from './chatRequest';

/** useSSEChat 을 제어 가능한 fake 로 대체 — 스트리밍 자체는 패키지 책임. */
const sendMock = vi.fn<(body: unknown) => Promise<void>>(async () => {});
const abortMock = vi.fn();
let fakeStatus: 'idle' | 'streaming' | 'done' | 'error' = 'idle';
let capturedOnDone: (() => void) | undefined;
let capturedOnChunk: ((t: string) => void) | undefined;

vi.mock('@gugbab/hooks', () => ({
  useSSEChat: (options: { onDone?: () => void; onChunk?: (t: string) => void }) => {
    capturedOnDone = options.onDone;
    capturedOnChunk = options.onChunk;
    return { text: '', status: fakeStatus, send: sendMock, abort: abortMock };
  },
}));

import { useConversation } from './useConversation';

describe('useConversation', () => {
  beforeEach(async () => {
    await resetDb();
    sendMock.mockClear();
    abortMock.mockClear();
    fakeStatus = 'idle';
  });

  it('마운트 시 DB 히스토리를 로드한다', async () => {
    const { result } = renderHook(() => useConversation());
    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });
    expect(result.current.messages).toEqual([]);
  });

  it('sendMessage: user 메시지를 DB 에 저장하고 relay 본문으로 send 한다', async () => {
    const { result } = renderHook(() => useConversation());
    await waitFor(() => expect(result.current.ready).toBe(true));

    await act(async () => {
      await result.current.sendMessage('Hello there!');
    });

    // DB 저장
    const rows = await listChatMessages();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.role).toBe('user');
    expect(rows[0]?.content).toBe('Hello there!');

    // relay 본문
    expect(sendMock).toHaveBeenCalledTimes(1);
    const body = sendMock.mock.calls[0]?.[0] as {
      app: string;
      systemPrompt: string;
      messages: { role: string; content: string }[];
    };
    expect(body.app).toBe('english');
    expect(body.systemPrompt).toBe(ENGLISH_TUTOR_SYSTEM_PROMPT);
    expect(body.messages.at(-1)).toEqual({ role: 'user', content: 'Hello there!' });
  });

  it('스트리밍 완료(onDone) 시 assistant 응답을 DB 에 저장한다', async () => {
    const { result } = renderHook(() => useConversation());
    await waitFor(() => expect(result.current.ready).toBe(true));

    await act(async () => {
      await result.current.sendMessage('Hi!');
    });

    // 스트리밍 chunk 누적 후 완료 콜백
    await act(async () => {
      capturedOnChunk?.('Hi! How are you');
      capturedOnChunk?.(' today?');
      capturedOnDone?.();
    });

    await waitFor(async () => {
      const rows = await listChatMessages();
      expect(rows).toHaveLength(2);
      expect(rows[1]?.role).toBe('assistant');
      expect(rows[1]?.content).toBe('Hi! How are you today?');
    });
  });

  it('clearConversation: DB 와 로컬 상태를 비운다', async () => {
    const { result } = renderHook(() => useConversation());
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => {
      await result.current.sendMessage('Hello!');
    });
    await act(async () => {
      await result.current.clearConversation();
    });
    expect(result.current.messages).toEqual([]);
    expect(await listChatMessages()).toEqual([]);
  });

  it('빈 문자열은 전송하지 않는다', async () => {
    const { result } = renderHook(() => useConversation());
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => {
      await result.current.sendMessage('   ');
    });
    expect(sendMock).not.toHaveBeenCalled();
    expect(await listChatMessages()).toEqual([]);
  });
});
