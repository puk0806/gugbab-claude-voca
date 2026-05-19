/**
 * 학습 큐 합성 — due 카드 + 신규 카드 + cardType/mode 비대칭 가중치.
 *
 * 알고리즘 (재설계):
 *   1. 진도 분류 (due / new)
 *   2. 신규 풀을 5단계로 분류 (반대 mode 통과 여부 + mark 조합):
 *      - mastered: 둘 다 통과 (cardType 비대칭 기준)
 *      - reverseModePassed: 반대 mode 만 통과
 *      - sameModePassed: 같은 mode 만 통과 (이미 한 mode 라 같은 큐엔 적게)
 *      - unknownMarked: mark === 'unknown'
 *      - fresh: 미학습 (null mark)
 *   3. cardType + studyMode 별 가중치 매트릭스 (PRD §학습 흐름 참조)
 *   4. 부족분 fallback (큰 풀에서 채움)
 *   5. due slice + 신규 라운드로빈 interleave
 *
 * 본 함수는 React 의존 0의 순수 함수.
 */

import type { CardType, StudyMode } from '@/shared/types';
import { interleave, shuffle } from '@/shared/utils';
import type { SrsCard } from '@/srs/types';

export interface ComposeQueueInput {
  /** (cardType, level, studyMode) 조건의 모든 진도 row */
  readonly progress: readonly SrsCard[];
  /** (cardType, level) 조건의 모든 콘텐츠 id */
  readonly contentIds: readonly string[];
  /** (cardType, level) 조건의 *모든 mode* progress (mark·반대 mode 통과 판정용) */
  readonly allProgressByCardId: ReadonlyMap<string, readonly SrsCard[]>;
  /** 현재 학습 cardType */
  readonly cardType: CardType;
  /** 현재 학습 mode */
  readonly studyMode: StudyMode;
  /** 세션당 카드 수 (N). default 20 */
  readonly sessionSize: number;
  /** 신규 카드 비율 (R), 0~1. default 0.3 */
  readonly newCardRatio: number;
  /** 현재 시각 (epoch ms) */
  readonly now: number;
}

/**
 * 신규 풀의 카드 분류 — *mode 통과 패턴* 만 본다 (cardType 의 mastered 라벨링과 별개):
 * - fresh: 아무 mode 도 답한 적 없음
 * - unknownMarked: 어떤 mode 든 마지막 응답이 'again' (좌절 카드)
 * - reverseModePassed: 반대 mode 만 good (현재 mode 미통과)
 * - sameModePassed: 같은 mode 만 good (반대 mode 미통과 — 이 큐에선 의미 적음)
 * - bothPassed: 양쪽 mode 모두 good
 *
 * "mastered" 라벨은 cardType 비대칭 규칙 (word: recall good 단독 / sentence: 둘 다) 으로 별도 결정.
 * 큐 가중치는 위 5단계 패턴으로 분기 — word 의 reverseModePassed (recall good only) 가
 * "mastered (반쪽)" 의미를 갖고, bothPassed 가 "mastered (완전)" 의미.
 */
type NewCardClass =
  | 'bothPassed'
  | 'reverseModePassed'
  | 'sameModePassed'
  | 'unknownMarked'
  | 'fresh';

/** cardType 별로 *반대 mode* 가 무엇인지. */
function getReverseMode(cardType: CardType, currentMode: StudyMode): StudyMode | null {
  if (cardType === 'word') {
    return currentMode === 'flashcard' ? 'recall' : currentMode === 'recall' ? 'flashcard' : null;
  }
  // sentence — flashcard ↔ cloze 만 유효 (recall 은 미지원)
  return currentMode === 'flashcard' ? 'cloze' : currentMode === 'cloze' ? 'flashcard' : null;
}

function classifyCard(
  cardId: string,
  cardType: CardType,
  currentMode: StudyMode,
  allProgress: ReadonlyMap<string, readonly SrsCard[]>,
): NewCardClass {
  const modeProgress = allProgress.get(cardId) ?? [];
  if (modeProgress.length === 0) return 'fresh';

  const hasAgain = modeProgress.some((p) => p.lastRating === 'again');
  if (hasAgain) return 'unknownMarked';

  const reverseMode = getReverseMode(cardType, currentMode);
  const samePassed = modeProgress.some(
    (p) => p.studyMode === currentMode && p.lastRating === 'good',
  );
  const reversePassed =
    reverseMode !== null &&
    modeProgress.some((p) => p.studyMode === reverseMode && p.lastRating === 'good');

  if (samePassed && reversePassed) return 'bothPassed';
  if (reversePassed) return 'reverseModePassed';
  if (samePassed) return 'sameModePassed';
  return 'fresh';
}

/** 가중치 행렬 — 각 (cardType, studyMode) 별 5단계 비율 (합 = 1). */
interface Weights {
  readonly bothPassed: number;
  readonly reverseModePassed: number;
  readonly sameModePassed: number;
  readonly unknownMarked: number;
  readonly fresh: number;
}

function getWeights(cardType: CardType, studyMode: StudyMode): Weights {
  // word flashcard 큐 — 학습 mode. 미학습 위주.
  // word 에서 reverseModePassed (=recall good only) 는 "mastered (반쪽)" 라 가끔만 (10%).
  // bothPassed (둘 다 good) 는 "mastered (완전)" 라 더 드물게 (5%).
  if (cardType === 'word' && studyMode === 'flashcard') {
    return {
      fresh: 0.6,
      unknownMarked: 0.25,
      reverseModePassed: 0.1,
      bothPassed: 0.05,
      sameModePassed: 0,
    };
  }
  // word recall 큐 — 검증 mode. flashcard 통과 카드 우선 (recall 검증 유도).
  if (cardType === 'word' && studyMode === 'recall') {
    return {
      reverseModePassed: 0.7,
      fresh: 0.25,
      unknownMarked: 0.04,
      bothPassed: 0.01,
      sameModePassed: 0,
    };
  }
  // sentence — 양방향 모두 *반대 mode 통과 카드 우선* (대칭 검증 유도).
  return {
    reverseModePassed: 0.7,
    fresh: 0.25,
    unknownMarked: 0.04,
    bothPassed: 0.01,
    sameModePassed: 0,
  };
}

interface PartitionedProgress {
  readonly dueCards: readonly SrsCard[];
  readonly newPool: readonly string[];
}

/**
 * 진도 + 콘텐츠를 due / new로 분류.
 * - due: state !== 'new' AND dueAt <= now (dueAt 오름차순 정렬)
 * - newPool: 같은 mode progress 미존재 OR state === 'new'
 */
function partitionByState(
  progress: readonly SrsCard[],
  contentIds: readonly string[],
  now: number,
): PartitionedProgress {
  const dueCards = [...progress]
    .filter((p) => p.state !== 'new' && p.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt);

  const progressByCardId = new Map<string, SrsCard>();
  for (const p of progress) progressByCardId.set(p.cardId, p);

  const newPool = contentIds.filter((id) => {
    const p = progressByCardId.get(id);
    return p === undefined || p.state === 'new';
  });

  return { dueCards, newPool };
}

/**
 * 가중치 적용해 newTarget 채움. 부족 시 다른 풀 fallback.
 */
function pickNew(
  classed: ReadonlyMap<NewCardClass, readonly string[]>,
  weights: Weights,
  newTarget: number,
): string[] {
  if (newTarget <= 0) return [];

  const quotas: ReadonlyArray<{ kind: NewCardClass; quota: number }> = [
    { kind: 'bothPassed', quota: Math.round(newTarget * weights.bothPassed) },
    { kind: 'reverseModePassed', quota: Math.round(newTarget * weights.reverseModePassed) },
    { kind: 'sameModePassed', quota: Math.round(newTarget * weights.sameModePassed) },
    { kind: 'unknownMarked', quota: Math.round(newTarget * weights.unknownMarked) },
    { kind: 'fresh', quota: Math.round(newTarget * weights.fresh) },
  ];

  const picked: string[] = [];
  const used = new Set<string>();
  for (const { kind, quota } of quotas) {
    if (quota <= 0) continue;
    const pool = classed.get(kind) ?? [];
    const candidates = shuffle(pool).slice(0, quota);
    for (const id of candidates) {
      if (!used.has(id)) {
        picked.push(id);
        used.add(id);
      }
    }
  }

  // 부족분 fallback — 모든 풀에서 미사용 카드 가져옴 (큰 풀 우선)
  if (picked.length < newTarget) {
    const fallbackOrder: readonly NewCardClass[] = [
      'fresh',
      'unknownMarked',
      'reverseModePassed',
      'sameModePassed',
      'bothPassed',
    ];
    const fallbackPool: string[] = [];
    for (const kind of fallbackOrder) {
      fallbackPool.push(...(classed.get(kind) ?? []).filter((id) => !used.has(id)));
    }
    const need = newTarget - picked.length;
    picked.push(...shuffle(fallbackPool).slice(0, need));
  }

  return picked;
}

export function composeQueue(input: ComposeQueueInput): string[] {
  const {
    progress,
    contentIds,
    allProgressByCardId,
    cardType,
    studyMode,
    sessionSize,
    newCardRatio,
    now,
  } = input;

  const { dueCards, newPool } = partitionByState(progress, contentIds, now);
  const dueCount = Math.min(dueCards.length, Math.floor(sessionSize * (1 - newCardRatio)));
  const newTarget = sessionSize - dueCount;

  // newPool 을 5단계로 분류
  const classed = new Map<NewCardClass, string[]>([
    ['bothPassed', []],
    ['reverseModePassed', []],
    ['sameModePassed', []],
    ['unknownMarked', []],
    ['fresh', []],
  ]);
  for (const id of newPool) {
    const kind = classifyCard(id, cardType, studyMode, allProgressByCardId);
    (classed.get(kind) as string[]).push(id);
  }

  const weights = getWeights(cardType, studyMode);
  const pickedNew = pickNew(classed, weights, Math.min(newTarget, newPool.length));
  const pickedDue = dueCards.slice(0, dueCount).map((c) => c.cardId);

  return interleave(pickedDue, pickedNew);
}
