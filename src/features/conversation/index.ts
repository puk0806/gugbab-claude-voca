/**
 * `src/features/conversation/` public API.
 *
 * 영어 회화 연습 — relay(app=english) SSE 채팅 + IndexedDB 히스토리.
 */
export type { ChatMessage, ChatRequestBody, ReplyAidMode } from './chatRequest';
export {
  buildChatRequestBody,
  buildEnglishTutorSystemPrompt,
  DEFAULT_REPLY_AID_MODE,
  MAX_HISTORY,
} from './chatRequest';
export {
  loadReplyAidMode,
  REPLY_AID_MODE_LABELS,
  REPLY_AID_MODES,
  saveReplyAidMode,
} from './replyAidMode';
export type { MicError, SpeechRecognizer } from './speech';
export { createRecognizer, isRecognitionSupported } from './speech';
export type { ConversationStatus, UseConversationResult } from './useConversation';
export { useConversation } from './useConversation';
