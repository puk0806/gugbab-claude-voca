/**
 * 대화 연습 세션 훅 — useSSEChat(@gugbab/hooks) + IndexedDB 히스토리.
 *
 * 책임:
 * - 마운트 시 chatMessage 테이블에서 히스토리 로드 (ready)
 * - sendMessage: user 메시지 반영 → relay 본문 조립 → SSE 전송 (DB 저장은 비동기 병행)
 * - 스트리밍 chunk 를 ref 로 누적, 완료 시 assistant 메시지를 *상태 먼저* 반영 후 저장
 *   (저장 대기 중 응답이 화면에서 사라지는 blink·탭 종료 유실 방지)
 * - 언마운트 중단 시에도 부분 응답을 보존 (onError 의 부분 보존 정책과 일관)
 * - clearConversation: "새 대화" — 스트림 abort 후 상태·DB 초기화 (유령 메시지 차단)
 *
 * 동시성 설계: messagesRef 가 동기적 단일 소스 — 콜백들이 compute-then-set 으로
 * 갱신해 stale closure 로 서로의 갱신을 덮어쓰는 문제를 차단한다.
 * relay 는 stateless — 히스토리의 영속 소스는 IndexedDB.
 */
import { type SSEChatStatus, useSSEChat } from '@gugbab/hooks';
import { useCallback, useEffect, useRef, useState } from 'react';
import { appendChatMessage, type ChatMessageRow, clearChatMessages, listChatMessages } from '@/db';
import { buildChatRequestBody, type ChatMessage, type ReplyAidMode } from './chatRequest';

export type ConversationStatus = SSEChatStatus;

export interface UseConversationResult {
  /** DB 히스토리 로드 완료 여부 */
  readonly ready: boolean;
  readonly messages: readonly ChatMessageRow[];
  /** 스트리밍 중인 assistant 응답 (미저장 상태) */
  readonly streamingText: string;
  readonly status: ConversationStatus;
  readonly sendMessage: (content: string, replyAidMode?: ReplyAidMode) => Promise<void>;
  readonly clearConversation: () => Promise<void>;
}

export function useConversation(): UseConversationResult {
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState<readonly ChatMessageRow[]>([]);
  // 동기적 단일 소스 — setState 클로저 경합 방지 (compute-then-set)
  const messagesRef = useRef<readonly ChatMessageRow[]>([]);
  const streamedRef = useRef('');
  // 언마운트 후 늦게 도착한 스트림 콜백 무효화 — effect 에서 재무장
  // (StrictMode dev 이중 마운트에서 cleanup 이 영구 차단을 남기지 않도록 ref 를 다시 세운다)
  const mountedRef = useRef(true);

  const commitAppend = useCallback((row: ChatMessageRow): void => {
    messagesRef.current = [...messagesRef.current, row];
    setMessages(messagesRef.current);
  }, []);

  /** 누적된 스트림 텍스트를 assistant 메시지로 확정 — 상태 먼저, DB 는 비동기. */
  const persistAssistant = useCallback((): void => {
    if (!mountedRef.current) return; // 언마운트 후 (부분 보존은 cleanup 이 담당)
    const content = streamedRef.current.trim();
    streamedRef.current = '';
    if (!content) return;
    const row: ChatMessageRow = { role: 'assistant', content, createdAt: Date.now() };
    commitAppend(row);
    void appendChatMessage(row);
  }, [commitAppend]);

  const { text, status, send, abort } = useSSEChat({
    url: '/api/chat',
    onChunk: (chunk) => {
      streamedRef.current += chunk;
    },
    onDone: persistAssistant,
    // 부분 응답이라도 있으면 보존 — 재전송 시 맥락 유지
    onError: persistAssistant,
  });

  useEffect(() => {
    let cancelled = false;
    mountedRef.current = true;
    void listChatMessages().then((rows) => {
      if (cancelled) return;
      messagesRef.current = rows;
      setMessages(rows);
      setReady(true);
    });
    return () => {
      cancelled = true;
      mountedRef.current = false;
      abort();
      // 언마운트로 스트림이 끊겨도 부분 응답 보존 (onError 정책과 동일)
      const partial = streamedRef.current.trim();
      streamedRef.current = '';
      if (partial) {
        void appendChatMessage({ role: 'assistant', content: partial, createdAt: Date.now() });
      }
    };
  }, [abort]);

  const sendMessage = useCallback(
    async (content: string, replyAidMode?: ReplyAidMode): Promise<void> => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const row: ChatMessageRow = { role: 'user', content: trimmed, createdAt: Date.now() };
      streamedRef.current = '';
      commitAppend(row);
      // DB 저장은 전송과 병행 — 첫 토큰 지연에 IndexedDB write 를 얹지 않는다
      const persisted = appendChatMessage(row);

      const history: ChatMessage[] = messagesRef.current.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      await Promise.all([send(buildChatRequestBody(history, replyAidMode)), persisted]);
    },
    [commitAppend, send],
  );

  const clearConversation = useCallback(async (): Promise<void> => {
    abort(); // 진행 중 스트림 중단 — abort 후에는 done/error 콜백이 오지 않는다
    streamedRef.current = '';
    // DB 삭제 완료 후 화면을 비운다 — 빈 화면 직후 새로고침해도 히스토리가 되살아나지 않게
    await clearChatMessages();
    messagesRef.current = [];
    setMessages([]);
  }, [abort]);

  return {
    ready,
    messages,
    streamingText: text,
    status,
    sendMessage,
    clearConversation,
  };
}
