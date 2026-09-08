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

/** 답변 부가 정보(한국어 해석·핵심 표현) 노출 모드 — 대화 화면 상단 라디오에서 선택. */
export type ReplyAidMode = 'none' | 'translation' | 'expressions' | 'both';

export const DEFAULT_REPLY_AID_MODE: ReplyAidMode = 'both';

const CORE_TUTOR_PROMPT = [
  'You are a friendly English conversation partner and tutor for a Korean learner.',
  'Keep replies short and natural — 2 to 4 sentences of casual spoken English.',
  "If the learner's message contains unnatural or incorrect English, start your reply",
  'with one line: "✏️ <corrected sentence>" followed by a very short Korean note on why.',
  'Then continue the conversation naturally and end with a follow-up question.',
  'If their English is fine, just continue the conversation — no correction line.',
  "If the learner's message is written mainly in Korean, treat it as asking how to say",
  'that in English: start your reply with one line: \'🗣️ "<natural English expression>"\'',
  'followed by a very short Korean note, then encourage them to try saying it themselves',
  'and continue the conversation in English with a follow-up question.',
  'When that Korean-input rule applies, skip the correction rule entirely —',
  'never output both a "✏️" line and a "🗣️" line in the same reply.',
  'Never switch the English conversation itself to Korean.',
] as const;

const TRANSLATION_BLOCK = [
  'the full Korean translation of your English reply,',
  'wrapped in parentheses like "(한국어 해석)"',
].join(' ');

const EXPRESSIONS_BLOCK = [
  'a line "📌 핵심 표현" followed by 2 to 4 bullet lines,',
  'each formatted "- <expression> — <Korean meaning>",',
  'picking the most useful words or phrases from your reply',
].join(' ');

/** 모드에 따라 한국어 해석·핵심 표현 블록 지시를 붙인 systemPrompt 를 조립한다. */
export function buildEnglishTutorSystemPrompt(mode: ReplyAidMode = DEFAULT_REPLY_AID_MODE): string {
  const withTranslation = mode === 'translation' || mode === 'both';
  const withExpressions = mode === 'expressions' || mode === 'both';
  const parts: string[] = [...CORE_TUTOR_PROMPT];

  if (withTranslation && withExpressions) {
    parts.push(
      'After the English reply, always append two Korean study blocks:',
      `(1) after one blank line, ${TRANSLATION_BLOCK}.`,
      `(2) after another blank line, ${EXPRESSIONS_BLOCK}.`,
    );
  } else if (withTranslation) {
    parts.push(
      `After the English reply, after one blank line, always append ${TRANSLATION_BLOCK}.`,
    );
  } else if (withExpressions) {
    parts.push(
      `After the English reply, after one blank line, always append ${EXPRESSIONS_BLOCK}.`,
    );
  }

  const koreanAllowed = [
    'the correction and how-to-say-it notes',
    ...(withTranslation ? ['the translation block'] : []),
    ...(withExpressions ? ['the expression meanings'] : []),
  ];
  const allowedPhrase =
    koreanAllowed.length === 1
      ? koreanAllowed[0]
      : koreanAllowed.length === 2
        ? koreanAllowed.join(' and ')
        : `${koreanAllowed.slice(0, -1).join(', ')}, and ${koreanAllowed.at(-1)}`;
  parts.push(`Only ${allowedPhrase} may use Korean.`);

  return parts.join(' ');
}

/**
 * 대화 히스토리 → relay 요청 본문.
 * 최근 MAX_HISTORY 개로 절단 후, 선두가 user 가 될 때까지 앞쪽 메시지를 제거한다.
 */
export function buildChatRequestBody(
  messages: readonly ChatMessage[],
  mode: ReplyAidMode = DEFAULT_REPLY_AID_MODE,
): ChatRequestBody {
  const recent = messages.slice(-MAX_HISTORY);
  const firstUserIdx = recent.findIndex((m) => m.role === 'user');
  const aligned = firstUserIdx <= 0 ? recent : recent.slice(firstUserIdx);
  return {
    app: 'english',
    systemPrompt: buildEnglishTutorSystemPrompt(mode),
    messages: aligned,
  };
}
