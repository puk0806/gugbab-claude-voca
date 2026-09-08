/**
 * `src/features/conversation/` public API.
 *
 * 영어 회화 연습 — relay(app=english) SSE 채팅 + IndexedDB 히스토리.
 * 마이크(STT)는 @gugbab/hooks 공통 모듈(useSpeechRecognition)을 직접 사용한다.
 */
export type { ChatMessage, ChatRequestBody, ReplyAidMode } from './chatRequest';
export {
  buildChatRequestBody,
  buildEnglishTutorSystemPrompt,
  DEFAULT_REPLY_AID_MODE,
  MAX_HISTORY,
} from './chatRequest';
export type { MicLang } from './micLang';
export {
  DEFAULT_MIC_LANG,
  loadMicLang,
  MIC_LANG_LABELS,
  MIC_LANGS,
  saveMicLang,
} from './micLang';
export {
  loadReplyAidMode,
  REPLY_AID_MODE_LABELS,
  REPLY_AID_MODES,
  saveReplyAidMode,
} from './replyAidMode';
export { extractSpokenEnglish } from './spokenReply';
export type { ConversationStatus, UseConversationResult } from './useConversation';
export { useConversation } from './useConversation';
