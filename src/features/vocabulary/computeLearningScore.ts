/**
 * 단어장 학습 우선순위 점수 + 단계 분류.
 *
 * - 점수 낮을수록 *학습 필요* → 단어장 상단 노출.
 * - 점수 높을수록 *잘 외움* → 단어장 하단 노출.
 *
 * 입력:
 *   - cardId 단위 mark (known / unknown / mastered / null)
 *   - 같은 cardId의 *모든 studyMode* SRS progress (flashcard·recall·cloze)
 *   - 현재 시각 now (epoch ms)
 *
 * 정책:
 *   - mark가 강한 신호 (사용자가 직접 표시): mastered +100 / known +50 / unknown -50
 *   - 그 외엔 SRS 상태 합산:
 *     - 어떤 mode든 dueAt ≤ now (복습 필요): -20 / mode
 *     - 어떤 mode든 learning/relearning: -10 / mode
 *     - review state AND dueAt > now (잘 외운 모드): +10 / mode
 *     - repetitions 합산 * 2
 *
 * 단계 분류 (worst-of-all-modes):
 *   - 🔴 unknown — mark === 'unknown'
 *   - 🟠 review-due — 어떤 mode든 review state AND dueAt ≤ now
 *   - 🟡 learning — 어떤 mode든 learning/relearning state (그리고 review-due 아님)
 *   - ⚪ new — progress 없음 또는 모든 mode가 state === 'new'
 *   - 🔵 completed — 모든 mode가 review state AND dueAt > now
 *   - 🟢 known — mark === 'known' (한 mode 만 통과 — 검증·학습 mode 중 하나)
 *   - ⭐ mastered — mark === 'mastered' (cardType 비대칭 졸업 조건 충족)
 *
 * mark가 'mastered'이면 SRS 무관 ⭐, 'known' 🟢, 'unknown' 🔴 (사용자 의도 우선).
 *
 * 본 모듈은 React·Dexie 의존 0의 순수 함수.
 */
import type { SrsCard } from '@/srs/types';

export type LearningStage =
  | 'unknown'
  | 'review-due'
  | 'learning'
  | 'new'
  | 'completed'
  | 'known'
  | 'mastered';

export interface LearningScoreInput {
  readonly mark: 'known' | 'unknown' | 'mastered' | null;
  /** 같은 cardId의 모든 studyMode progress row */
  readonly progressByMode: readonly SrsCard[];
  /** 현재 시각 (epoch ms) */
  readonly now: number;
}

export interface LearningScoreResult {
  readonly score: number;
  readonly stage: LearningStage;
}

export function computeLearningScore(input: LearningScoreInput): LearningScoreResult {
  const { mark, progressByMode, now } = input;

  if (mark === 'unknown') {
    return { score: -50, stage: 'unknown' };
  }
  if (mark === 'mastered') {
    return { score: 100, stage: 'mastered' };
  }
  if (mark === 'known') {
    return { score: 50, stage: 'known' };
  }

  if (progressByMode.length === 0) {
    return { score: 0, stage: 'new' };
  }

  let score = 0;
  let hasReviewDue = false;
  let hasLearning = false;
  let allReviewNotDue = true;
  let allNew = true;

  for (const p of progressByMode) {
    score += p.repetitions * 2;

    if (p.state !== 'new') allNew = false;

    if (p.state === 'review' && p.dueAt <= now) {
      hasReviewDue = true;
      score -= 20;
      allReviewNotDue = false;
    } else if (p.state === 'learning' || p.state === 'relearning') {
      hasLearning = true;
      score -= 10;
      allReviewNotDue = false;
    } else if (p.state === 'review' && p.dueAt > now) {
      score += 10;
    } else {
      // state === 'new'
      allReviewNotDue = false;
    }
  }

  let stage: LearningStage;
  if (hasReviewDue) {
    stage = 'review-due';
  } else if (hasLearning) {
    stage = 'learning';
  } else if (allNew) {
    stage = 'new';
  } else if (allReviewNotDue) {
    stage = 'completed';
  } else {
    stage = 'learning';
  }

  return { score, stage };
}

/**
 * 단계별 표시 정보 (UI 무관 순수 메타).
 */
export const STAGE_META: Readonly<
  Record<LearningStage, { readonly label: string; readonly priority: number }>
> = {
  unknown: { label: '모름', priority: 0 },
  'review-due': { label: '복습 필요', priority: 1 },
  learning: { label: '학습 중', priority: 2 },
  new: { label: '미학습', priority: 3 },
  completed: { label: '완료', priority: 4 },
  known: { label: '안다', priority: 5 },
  mastered: { label: '마스터', priority: 6 },
};
