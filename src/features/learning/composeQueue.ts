/**
 * 학습 큐 합성 — due 카드 + 신규 카드 + 마킹 가중치(M5).
 *
 * 알고리즘 (아키텍처 §5.5):
 *   1. 진도 분류 (due / new)
 *   2. 신규 풀 마킹 분리 (unknown / unmarked / known)
 *   3. 정원 계산 (dueCount = min(|D|, floor(N*(1-R))))
 *   4. 마킹별 가중치 분배 (70 / 25 / 5)
 *   5. 부족분 채움 (channel fallback: unknown → unmarked → known)
 *   6. due 정렬 (dueAt 오름차순) + slice(dueCount)
 *   7. 라운드로빈 인터리빙 (단조로움 회피)
 *
 * 본 함수는 React 의존 0의 순수 함수.
 */
import { interleave, shuffle } from '@/shared/utils';
import type { SrsCard } from '@/srs/types';

export interface ComposeQueueInput {
  /** (cardType, level, studyMode) 조건의 모든 진도 row */
  readonly progress: readonly SrsCard[];
  /** (cardType, level) 조건의 모든 콘텐츠 id */
  readonly contentIds: readonly string[];
  /** 카드별 사용자 마킹 (M5). key = cardId */
  readonly marks: ReadonlyMap<string, 'known' | 'unknown'>;
  /** 세션당 카드 수 (N). default 20 */
  readonly sessionSize: number;
  /** 신규 카드 비율 (R), 0~1. default 0.3 */
  readonly newCardRatio: number;
  /** 현재 시각 (epoch ms) */
  readonly now: number;
}

const UNKNOWN_RATIO = 0.7;
const UNMARKED_RATIO = 0.25;
// known은 잔여 (보통 0.05)

interface PartitionedProgress {
  readonly dueCards: readonly SrsCard[];
  readonly newPool: readonly string[];
}

/**
 * 진도 + 콘텐츠를 due / new로 분류.
 * - due: state !== 'new' AND dueAt <= now (dueAt 오름차순 정렬)
 * - newPool: progress 미존재 OR state === 'new'
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

interface NewPoolByMark {
  readonly unknown: readonly string[];
  readonly unmarked: readonly string[];
  readonly known: readonly string[];
}

function partitionNewByMark(
  newPool: readonly string[],
  marks: ReadonlyMap<string, 'known' | 'unknown'>,
): NewPoolByMark {
  const unknown: string[] = [];
  const unmarked: string[] = [];
  const known: string[] = [];
  for (const id of newPool) {
    const mark = marks.get(id);
    if (mark === 'unknown') unknown.push(id);
    else if (mark === 'known') known.push(id);
    else unmarked.push(id);
  }
  return { unknown, unmarked, known };
}

/**
 * 마킹 가중치 70/25/5 적용 + channel fallback으로 newTarget 채우기.
 */
function pickNew(byMark: NewPoolByMark, newTarget: number): string[] {
  if (newTarget <= 0) return [];

  const qUnknown = Math.round(newTarget * UNKNOWN_RATIO);
  const qUnmarked = Math.round(newTarget * UNMARKED_RATIO);
  const qKnown = newTarget - qUnknown - qUnmarked;

  const picked: string[] = [
    ...shuffle(byMark.unknown).slice(0, qUnknown),
    ...shuffle(byMark.unmarked).slice(0, qUnmarked),
    ...shuffle(byMark.known).slice(0, Math.max(0, qKnown)),
  ];

  // channel fallback: unknown 부족 → unmarked → known 순으로 보충
  if (picked.length < newTarget) {
    const used = new Set(picked);
    const fallbackPool = [...byMark.unmarked, ...byMark.known, ...byMark.unknown].filter(
      (id) => !used.has(id),
    );
    const need = newTarget - picked.length;
    picked.push(...shuffle(fallbackPool).slice(0, need));
  }

  return picked;
}

export function composeQueue(input: ComposeQueueInput): string[] {
  const { progress, contentIds, marks, sessionSize, newCardRatio, now } = input;

  const { dueCards, newPool } = partitionByState(progress, contentIds, now);
  const dueCount = Math.min(dueCards.length, Math.floor(sessionSize * (1 - newCardRatio)));
  const newTarget = sessionSize - dueCount;

  const byMark = partitionNewByMark(newPool, marks);
  const pickedNew = pickNew(byMark, Math.min(newTarget, newPool.length));
  const pickedDue = dueCards.slice(0, dueCount).map((c) => c.cardId);

  return interleave(pickedDue, pickedNew);
}
