/**
 * `src/features/conversation/` public API.
 *
 * 영어 회화 연습 — relay(app=english) SSE 채팅 + IndexedDB 히스토리.
 */
export type { ChatMessage, ChatRequestBody } from './chatRequest';
export { buildChatRequestBody, ENGLISH_TUTOR_SYSTEM_PROMPT, MAX_HISTORY } from './chatRequest';
export type { ConversationStatus, UseConversationResult } from './useConversation';
export { useConversation } from './useConversation';
