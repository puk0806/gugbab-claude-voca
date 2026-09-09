/**
 * `/conversation` — 영어 회화 연습 (relay app=english SSE 채팅).
 *
 * - 히스토리·전송·스트리밍은 useConversation 훅이 담당
 * - 마이크(영어 STT)는 @gugbab/hooks 공통 훅 useSpeechRecognition 사용
 *   (상태 관리·stale 콜백 가드·언마운트 abort 는 훅 내장 — 앱은 메시지 문구만 정의)
 * - 스트리밍 중 assistant 말풍선은 실시간 텍스트로 표시, 완료 시 저장분으로 대체
 * - 말풍선 목록은 memo 컴포넌트로 분리 — 입력 키스트로크·스트림 chunk 재렌더에서 제외
 * - "새 대화" 로 히스토리 초기화
 */
import { type MicError, useSpeak, useSpeechRecognition } from '@gugbab/hooks';
import { memo, useEffect, useRef, useState } from 'react';
import type { ChatMessageRow } from '@/db';
import {
  DEFAULT_MIC_LANG,
  extractSpokenEnglish,
  loadMicLang,
  loadReplyAidMode,
  MIC_LANG_LABELS,
  type MicLang,
  REPLY_AID_MODE_LABELS,
  REPLY_AID_MODES,
  type ReplyAidMode,
  saveMicLang,
  saveReplyAidMode,
  useConversation,
} from '@/features/conversation';
import { EmptyState } from '@/shared/components';
import styles from './Conversation.module.css';

const AUTO_SPEAK_KEY = 'gugbab-voca:autoSpeak';

const MIC_ERROR_MESSAGES: Record<MicError, string> = {
  'not-allowed': '마이크 권한이 필요합니다. 브라우저 설정에서 허용해주세요.',
  'no-speech': '음성이 감지되지 않았습니다. 다시 시도해주세요.',
  network: '네트워크 오류로 음성 인식에 실패했습니다.',
  unknown: '음성 인식에 실패했습니다. 다시 시도해주세요.',
};

interface MessageListProps {
  readonly messages: readonly ChatMessageRow[];
  /** assistant 말풍선 스피커 버튼 — 미지원(TTS 불가) 시 undefined */
  readonly onSpeak?: ((content: string) => void) | undefined;
}

const MessageList = memo(function MessageList({ messages, onSpeak }: MessageListProps) {
  return (
    <>
      {messages.map((m) => (
        <div
          key={m.id ?? m.createdAt}
          className={`${styles.bubble} ${m.role === 'user' ? styles.user : styles.assistant}`}
        >
          {m.content}
          {m.role === 'assistant' && onSpeak && extractSpokenEnglish(m.content) && (
            <button
              type="button"
              className={styles.speakButton}
              onClick={() => onSpeak(m.content)}
              aria-label="영어 대답 듣기"
            >
              🔊
            </button>
          )}
        </div>
      ))}
    </>
  );
});

export function Conversation() {
  const { ready, messages, streamingText, status, sendMessage, clearConversation } =
    useConversation();
  const [input, setInput] = useState('');
  // 답변 부가 정보(해석·핵심표현) 모드 — 라디오 선택, localStorage 영속
  const [replyAidMode, setReplyAidMode] = useState<ReplyAidMode>(() => loadReplyAidMode());
  // 마이크 인식 언어 (EN/한 토글) — Web Speech API 는 세션당 언어 1개, localStorage 영속
  const [micLang, setMicLang] = useState<MicLang>(() => loadMicLang());
  // 언어 토글로 dismiss 한 에러 배너 숨김 — start() 가 error 를 null 로 리셋하면 해제
  const [micErrorDismissed, setMicErrorDismissed] = useState(false);
  // 답변 자동 읽기 (대화하듯 듣기) — localStorage 영속
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTO_SPEAK_KEY) !== 'off';
    } catch {
      return true;
    }
  });
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollPendingRef = useRef(false);

  const streaming = status === 'streaming';

  // 마이크(영어 STT) — 공통 훅. final 결과만 입력에 이어붙인다 (interim 은 힌트 표시 전용)
  const {
    supported: micAvailable,
    listening,
    interimText,
    error: micError,
    toggle: toggleMic,
    abort: abortMic,
  } = useSpeechRecognition({
    lang: micLang,
    onFinal: (transcript) => {
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    },
  });

  // 스피커(TTS) — 영어 대답 부분만 재생
  const { speak, stop: stopSpeak, speaking, supported: ttsSupported } = useSpeak({ lang: 'en-US' });
  // 현재 재생 중인 원본 콘텐츠 — 다른 말풍선 🔊 클릭 시 "정지"가 아닌 "전환" 판정용
  const speakingContentRef = useRef<string | null>(null);

  const speakReply = (content: string): void => {
    const english = extractSpokenEnglish(content);
    if (!english) return;
    speakingContentRef.current = content;
    speak(english);
  };

  const handleBubbleSpeak = (content: string): void => {
    if (speaking && speakingContentRef.current === content) {
      stopSpeak(); // 같은 말풍선 재클릭 = 정지
      return;
    }
    speakReply(content); // 다른 말풍선 = 전환 (speak 이 내부에서 cancel)
  };

  // 전송(스트리밍 시작)되면 진행 중이던 인식·발화를 즉시 중단
  // — 늦은 STT 결과가 입력을 다시 채우거나, 직전 TTS 가 새 답변과 겹치는 것 방지
  useEffect(() => {
    if (!streaming) return;
    abortMic();
    stopSpeak();
  }, [streaming, abortMic, stopSpeak]);

  // 답변 완료(마지막 assistant 메시지 추가) 시 자동 읽기 — 대화하듯 듣기.
  // 마운트 시 IndexedDB 에서 로드된 과거 히스토리는 읽지 않는다(hydration 시드).
  const lastMessage = messages.at(-1);
  const spokenIdRef = useRef<number | string | null>(null);
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!ready) return;
    if (!hydratedRef.current) {
      // 히스토리 로드 직후 첫 실행 — 마지막 답변을 "이미 읽은 것"으로 시드만 하고 발화 없음
      hydratedRef.current = true;
      if (lastMessage?.role === 'assistant') {
        spokenIdRef.current = lastMessage.id ?? lastMessage.createdAt;
      }
      return;
    }
    if (!autoSpeak || !ttsSupported) return;
    if (!lastMessage || lastMessage.role !== 'assistant') return;
    const id = lastMessage.id ?? lastMessage.createdAt;
    if (spokenIdRef.current === id) return; // 재렌더 중복 발화 방지
    spokenIdRef.current = id;
    const english = extractSpokenEnglish(lastMessage.content);
    if (english) {
      speakingContentRef.current = lastMessage.content;
      speak(english);
    }
  }, [ready, autoSpeak, ttsSupported, lastMessage, speak]);

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
    void sendMessage(content, replyAidMode);
  };

  const handleModeChange = (mode: ReplyAidMode): void => {
    setReplyAidMode(mode);
    saveReplyAidMode(mode);
  };

  const handleMicLangToggle = (): void => {
    // 진행 중 세션은 이전 언어로 인식되므로 즉시 파기 후 전환
    if (listening) abortMic();
    // 이전 언어에서 난 에러 배너는 오해 소지 — 전환 시 숨긴다 (새 에러 발생 시 다시 표시)
    setMicErrorDismissed(true);
    const next: MicLang = micLang === DEFAULT_MIC_LANG ? 'ko-KR' : DEFAULT_MIC_LANG;
    setMicLang(next);
    saveMicLang(next);
  };

  // start() 는 error 를 null 로 리셋 — 그 시점에 dismiss 도 해제되어 새 에러는 다시 보인다
  if (!micError && micErrorDismissed) setMicErrorDismissed(false);
  const micErrorMessage = micError && !micErrorDismissed ? MIC_ERROR_MESSAGES[micError] : '';

  return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <span className={styles.title}>대화 연습</span>
        {messages.length > 0 && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => {
              stopSpeak();
              void clearConversation();
            }}
          >
            새 대화
          </button>
        )}
      </div>

      <div className={styles.settingsRow}>
        <div className={styles.modeRow} role="radiogroup" aria-label="답변 부가 정보">
          {REPLY_AID_MODES.map((mode) => (
            <label
              key={mode}
              className={`${styles.modeOption} ${mode === replyAidMode ? styles.modeOptionActive : ''}`}
            >
              <input
                type="radio"
                name="replyAidMode"
                value={mode}
                checked={mode === replyAidMode}
                onChange={() => handleModeChange(mode)}
                className={styles.modeInput}
              />
              {REPLY_AID_MODE_LABELS[mode]}
            </label>
          ))}
        </div>
        {ttsSupported && (
          <button
            type="button"
            className={`${styles.modeOption} ${autoSpeak ? styles.modeOptionActive : ''}`}
            role="switch"
            aria-checked={autoSpeak}
            aria-label="답변 자동 읽기"
            onClick={() => {
              const next = !autoSpeak;
              setAutoSpeak(next);
              if (!next && speaking) stopSpeak();
              try {
                localStorage.setItem(AUTO_SPEAK_KEY, next ? 'on' : 'off');
              } catch {
                // 저장 실패 시 세션 내 상태로만 동작
              }
            }}
          >
            {autoSpeak ? '🔊 자동' : '🔇 자동'}
          </button>
        )}
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && !streaming && (
          <p className={styles.hint}>
            영어로 인사해 보세요! 어색한 표현은 AI 튜터가 바로잡아 줍니다.
          </p>
        )}
        <MessageList messages={messages} onSpeak={ttsSupported ? handleBubbleSpeak : undefined} />
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

      {(interimText || micErrorMessage) && (
        <div className={styles.micHint}>
          {interimText && (
            <span className={styles.interim} aria-live="polite">
              {interimText}
            </span>
          )}
          {micErrorMessage && (
            <span className={styles.micErrorText} role="alert">
              {micErrorMessage}
            </span>
          )}
        </div>
      )}

      <div className={styles.inputRow}>
        {micAvailable && (
          <button
            type="button"
            className={styles.micLangButton}
            onClick={handleMicLangToggle}
            disabled={streaming}
            aria-label="음성 인식 언어 전환"
            title={
              micLang === 'en-US' ? '영어 인식 중 — 한국어로 전환' : '한국어 인식 중 — 영어로 전환'
            }
          >
            {MIC_LANG_LABELS[micLang]}
          </button>
        )}
        {micAvailable && (
          <button
            type="button"
            className={`${styles.micButton} ${listening ? styles.micButtonActive : ''}`}
            onClick={() => {
              // 스피커 소리를 마이크가 재인식하는 루프 차단
              if (!listening) stopSpeak();
              toggleMic();
            }}
            disabled={streaming}
            aria-label={listening ? '음성 입력 중지' : '음성 입력'}
          >
            {listening ? '■' : '🎤'}
          </button>
        )}
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
