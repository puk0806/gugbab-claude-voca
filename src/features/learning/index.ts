/**
 * `src/features/learning/` public API.
 *
 * 학습 도메인 — 큐 합성·세션 라이프사이클·종료 요약.
 */
export type { ComposeQueueInput } from './composeQueue';
export { composeQueue } from './composeQueue';
export { SessionSummary, type SessionSummaryProps } from './SessionSummary';
export {
  type LearnSessionData,
  type UseLearnSessionResult,
  useLearnSession,
} from './useLearnSession';
