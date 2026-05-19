/**
 * 학습 응답 → 단어장 mark 결정 순수 함수.
 *
 * 단어/문장 비대칭 의도:
 * - word: recall good 한 번 통과 = mastered (검증 mode 자체가 어려워 한 번 통과로 졸업 인정).
 * - sentence: flashcard + cloze 둘 다 good 이어야 mastered (양쪽 모두 검증으로 필요).
 *
 * 규칙:
 *   any again            → 'unknown'
 *   word recall good     → 'mastered' (이전 mark 무관)
 *   word flashcard good  → recall.lastRating === 'good' 이면 'mastered', 아니면 'known'
 *   sentence flashcard good → cloze.lastRating === 'good' 이면 'mastered', 아니면 'known'
 *   sentence cloze good     → flashcard.lastRating === 'good' 이면 'mastered', 아니면 'known'
 *
 * React·Dexie 의존 0의 순수 함수.
 */
import type { CardType, SrsRating, StudyMode, UserMark } from '@/shared/types';
import type { SrsCard } from '@/srs/types';

export interface DetermineMarkInput {
  readonly cardType: CardType;
  readonly studyMode: StudyMode;
  readonly rating: SrsRating;
  /** 같은 cardId 의 *다른 mode* progress 목록. 현재 답한 mode 는 포함 X. */
  readonly otherModeProgress: readonly SrsCard[];
}

function findLastRating(progress: readonly SrsCard[], mode: StudyMode): 'good' | 'again' | null {
  return progress.find((p) => p.studyMode === mode)?.lastRating ?? null;
}

export function determineMark(input: DetermineMarkInput): Exclude<UserMark, null> {
  const { cardType, studyMode, rating, otherModeProgress } = input;

  if (rating === 'again') return 'unknown';

  // word — recall 한 mode 통과로 mastered
  if (cardType === 'word') {
    if (studyMode === 'recall') return 'mastered';
    // studyMode === 'flashcard'
    const recallGood = findLastRating(otherModeProgress, 'recall') === 'good';
    return recallGood ? 'mastered' : 'known';
  }

  // sentence — 두 mode 모두 통과해야 mastered
  // (cardType === 'sentence')
  if (studyMode === 'flashcard') {
    const clozeGood = findLastRating(otherModeProgress, 'cloze') === 'good';
    return clozeGood ? 'mastered' : 'known';
  }
  // studyMode === 'cloze' (sentence 의 검증 mode)
  const flashcardGood = findLastRating(otherModeProgress, 'flashcard') === 'good';
  return flashcardGood ? 'mastered' : 'known';
}
