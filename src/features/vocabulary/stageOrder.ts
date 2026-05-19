import type { LearningStage } from './computeLearningScore';

/**
 * UI 표시 순서 — 학습 우선순위 점수 정렬 시각 기준.
 * 모름 → 복습필요 → 학습중 → 미학습 → 완료 → 안다 → 마스터
 */
export const STAGE_ORDER: readonly LearningStage[] = [
  'unknown',
  'review-due',
  'learning',
  'new',
  'completed',
  'known',
  'mastered',
];
