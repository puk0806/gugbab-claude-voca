/**
 * `/conversation` — 영어 회화 연습 (relay app=english SSE 채팅).
 *
 * - 히스토리·전송·스트리밍은 useConversation 훅이 담당
 * - 스트리밍 중 assistant 말풍선은 실시간 텍스트로 표시, 완료 시 저장분으로 대체
 * - 말풍선 목록은 memo 컴포넌트로 분리 — 입력 키스트로크·스트림 chunk 재렌더에서 제외
 * - "새 대화" 로 히스토리 초기화
 */
import { memo, useEffect, useRef, useState } from 'react';
import type { ChatMessageRow } from '@/db';
import { useConversation } from '@/features/conversation';
import { EmptyState } from '@/shared/components';
import styles from './Conversation.module.css';

interface MessageListProps {
  readonly messages: readonly ChatMessageRow[];
}

const MessageList = memo(function MessageList({ messages }: MessageListProps) {
  return (
    <>
      {messages.map((m) => (
        <div
          key={m.id ?? m.createdAt}
          className={`${styles.bubble} ${m.role === 'user' ? styles.user : styles.assistant}`}
        >
          {m.content}
        </div>
      ))}
    </>
  );
});

export function Conversation() {
  const { ready, messages, streamingText, status, sendMessage, clearConversation } =
    useConversation();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollPendingRef = useRef(false);

  const streaming = status === 'streaming';

  // 새 메시지·스트리밍 진행 시 맨 아래로 스크롤 — chunk 마다가 아닌 frame 당 1회
  // biome-ignore lint/correctness/useExhaustiveDependencies: 메시지 수·스트림 텍스트 변화가 스크롤 트리거
  useEffect(() => {
    if (scrollPendingRef.current) return;
    scrollPendingRef.current = true;
    requestAnimationFrame(() => {
      scrollPendingRef.current = false;
      // jsdom 미구현 대비 옵셔널 호출
      bottomRef.current?.scrollIntoView?.({ block: 'end' });
    });
  }, [messages.length, streamingText]);

  if (!ready) {
    return <EmptyState title="대화를 불러오는 중..." />;
  }

  const handleSend = (): void => {
    const content = input.trim();
    if (!content || streaming) return;
    setInput('');
    void sendMessage(content);
  };

  return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <span className={styles.title}>대화 연습</span>
        {messages.length > 0 && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => void clearConversation()}
          >
            새 대화
          </button>
        )}
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && !streaming && (
          <p className={styles.hint}>
            영어로 인사해 보세요! 어색한 표현은 AI 튜터가 바로잡아 줍니다.
          </p>
        )}
        <MessageList messages={messages} />
        {streaming && (
          <div className={`${styles.bubble} ${styles.assistant}`}>
            {streamingText || <span className={styles.typing}>…</span>}
          </div>
        )}
        {status === 'error' && (
          <div className={styles.error} role="status">
            응답을 가져오지 못했어요. 잠시 후 다시 보내 보세요.
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputRow}>
        <input
          type="text"
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // IME 조합 확정 Enter(한글 입력)는 전송으로 취급하지 않는다
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSend();
          }}
          placeholder="영어로 입력하세요"
          aria-label="메시지 입력"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          type="button"
          className={styles.sendButton}
          onClick={handleSend}
          disabled={streaming || !input.trim()}
        >
          전송
        </button>
      </div>
    </div>
  );
}
