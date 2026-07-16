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
 *      — 진행률(coverage)에 따라 두 앵커 행렬을 선형 보간 (아래 참조)
 *   4. 부족분 fallback (큰 풀에서 채움)
 *   5. due slice + 신규 라운드로빈 interleave
 *
 * 진행률 적응 (coverage adaptation):
 *   coverage = 해당 (level, cardType)에서 한 번이라도 응답한 카드 비율 (0~1).
 *   진행 초반에는 due 카드(방금 배워 아는 카드)와 통과 카드가 세션을 점령해
 *   "아는 것만 자주 나오는" 문제가 생기므로:
 *   - 신규 비율: coverage 0 → 0.6 (due 선점 40%로 축소), coverage 1 → 입력 newCardRatio 로 수렴.
 *     입력값이 더 크면 입력값 유지 (테스트용 R=1 등).
 *   - word flashcard 가중치: coverage 0 → fresh 0.8 / 통과 카드 5%, coverage 1 → 현행 행렬.
 *   - recall·cloze(검증 mode) 행렬은 반대 mode 통과 우선이 본연의 목적이라 고정.
 *
 * 통과 카드 숨김 (coverage < 0.5, flashcard 학습 큐 한정):
 *   진행률 50% 미만에서는 flashcard 큐에서 통과(good) 카드를 완전히 제외한다 —
 *   due 는 틀린(again) 카드만 남기고, 신규 슬롯의 통과 클래스(reverse/both/same)는 비운다.
 *   숨겨진 카드는 SRS 스케줄에 그대로 남아 coverage 50% 도달 후 due 로 복귀.
 *   recall·cloze 검증 큐는 통과 카드 검증이 목적이므로 적용하지 않는다.
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

/** 선형 보간 — t=0 → low, t=1 → high. */
function lerp(low: number, high: number, t: number): number {
  return low + (high - low) * t;
}

/**
 * 진행률: 한 번이라도 응답한(progress row 존재) 카드 비율.
 * 단어장 마킹만 하고 학습 안 한 카드는 미응답으로 본다.
 */
function computeCoverage(
  contentIds: readonly string[],
  allProgressByCardId: ReadonlyMap<string, readonly SrsCard[]>,
): number {
  if (contentIds.length === 0) return 0;
  let answered = 0;
  for (const id of contentIds) {
    if ((allProgressByCardId.get(id)?.length ?? 0) > 0) answered += 1;
  }
  return answered / contentIds.length;
}

/** coverage 0에서의 신규 비율 상한 — due 선점을 40%까지 축소. */
const NEW_RATIO_AT_ZERO_COVERAGE = 0.6;

/** 이 진행률 미만이면 flashcard 학습 큐에서 통과(good) 카드를 숨긴다. */
const PASSED_HIDE_COVERAGE_THRESHOLD = 0.5;

/**
 * 진행률 기반 유효 신규 비율.
 * coverage 0 → 0.6, coverage 1 → baseRatio. 입력이 더 크면 입력 유지.
 */
function effectiveNewRatio(baseRatio: number, coverage: number): number {
  return Math.max(baseRatio, lerp(NEW_RATIO_AT_ZERO_COVERAGE, baseRatio, coverage));
}

function getWeights(cardType: CardType, studyMode: StudyMode, coverage: number): Weights {
  // word flashcard 큐 — 학습 mode. 미학습 위주.
  // word 에서 reverseModePassed (=recall good only) 는 "mastered (반쪽)" 라 가끔만.
  // bothPassed (둘 다 good) 는 "mastered (완전)" 라 더 드물게.
  // 진행 초반(coverage↓)엔 fresh 를 더 우대하고 통과 카드 재노출은 최소화.
  if (cardType === 'word' && studyMode === 'flashcard') {
    return {
      fresh: lerp(0.8, 0.6, coverage),
      unknownMarked: lerp(0.15, 0.25, coverage),
      reverseModePassed: lerp(0.04, 0.1, coverage),
      bothPassed: lerp(0.01, 0.05, coverage),
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

  // 반올림으로 쿼터 합이 newTarget 을 넘을 수 있으므로, 우선순위 높은 풀부터
  // 채우고 말미에 cap — 잘려나가는 건 가장 낮은 우선순위(bothPassed)부터.
  const quotas: ReadonlyArray<{ kind: NewCardClass; quota: number }> = [
    { kind: 'fresh', quota: Math.round(newTarget * weights.fresh) },
    { kind: 'unknownMarked', quota: Math.round(newTarget * weights.unknownMarked) },
    { kind: 'reverseModePassed', quota: Math.round(newTarget * weights.reverseModePassed) },
    { kind: 'sameModePassed', quota: Math.round(newTarget * weights.sameModePassed) },
    { kind: 'bothPassed', quota: Math.round(newTarget * weights.bothPassed) },
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

  return picked.slice(0, newTarget);
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
  const coverage = computeCoverage(contentIds, allProgressByCardId);

  // 진행률 50% 미만 + flashcard 학습 큐 → 통과(good) 카드 숨김
  const hidePassed = studyMode === 'flashcard' && coverage < PASSED_HIDE_COVERAGE_THRESHOLD;
  const visibleDue = hidePassed ? dueCards.filter((p) => p.lastRating !== 'good') : dueCards;

  const newRatio = effectiveNewRatio(newCardRatio, coverage);
  const dueCount = Math.min(visibleDue.length, Math.floor(sessionSize * (1 - newRatio)));
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

  // 통과 카드 숨김 — 신규 슬롯의 통과 클래스도 비운다 (fallback 유입 차단)
  if (hidePassed) {
    classed.set('bothPassed', []);
    classed.set('reverseModePassed', []);
    classed.set('sameModePassed', []);
  }

  const weights = getWeights(cardType, studyMode, coverage);
  const pickedNew = pickNew(classed, weights, Math.min(newTarget, newPool.length));
  const pickedDue = visibleDue.slice(0, dueCount).map((c) => c.cardId);

  return interleave(pickedDue, pickedNew);
}
