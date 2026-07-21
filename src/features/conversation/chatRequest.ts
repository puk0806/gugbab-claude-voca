/**
 * relay `/api/chat` 요청 본문 조립 (app=english).
 *
 * relay 의 english 타입은 서버측 스킬 주입이 없고 앱이 보내는 systemPrompt 가
 * 톤·응답 포맷을 결정한다. RELAY_SECRET 은 여기 없음 — 서버리스 함수(api/chat.ts)
 * 또는 vite dev proxy 가 X-Relay-Secret 헤더를 붙인다.
 *
 * relay 스키마 제약: messages 는 1개 이상 + 첫/마지막 메시지가 user 여야 한다.
 */

export interface ChatMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

export interface ChatRequestBody {
  readonly app: 'english';
  readonly systemPrompt: string;
  readonly messages: readonly ChatMessage[];
}

/** relay 로 보내는 최대 히스토리 수 — 토큰·지연 억제. */
export const MAX_HISTORY = 20;

export const ENGLISH_TUTOR_SYSTEM_PROMPT = [
  'You are a friendly English conversation partner and tutor for a Korean learner.',
  'Keep replies short and natural — 2 to 4 sentences of casual spoken English.',
  "If the learner's message contains unnatural or incorrect English, start your reply",
  'with one line: "✏️ <corrected sentence>" followed by a very short Korean note on why.',
  'Then continue the conversation naturally and end with a follow-up question.',
  'If their English is fine, just continue the conversation — no correction line.',
  'Never switch the conversation itself to Korean; only correction notes may use Korean.',
].join(' ');

/**
 * 대화 히스토리 → relay 요청 본문.
 * 최근 MAX_HISTORY 개로 절단 후, 선두가 user 가 될 때까지 앞쪽 메시지를 제거한다.
 */
export function buildChatRequestBody(messages: readonly ChatMessage[]): ChatRequestBody {
  const recent = messages.slice(-MAX_HISTORY);
  const firstUserIdx = recent.findIndex((m) => m.role === 'user');
  const aligned = firstUserIdx <= 0 ? recent : recent.slice(firstUserIdx);
  return {
    app: 'english',
    systemPrompt: ENGLISH_TUTOR_SYSTEM_PROMPT,
    messages: aligned,
  };
}
