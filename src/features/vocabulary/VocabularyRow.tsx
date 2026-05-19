import type { SentenceEntry, WordEntry } from '@/content';
import type { CardType, StudyMode } from '@/shared/types';
import { STAGE_META } from './computeLearningScore';
import type { ScoredCard } from './useVocabularyCards';
import styles from './VocabularyRow.module.css';

export interface VocabularyRowProps {
  readonly item: ScoredCard;
  readonly cardType: CardType;
  readonly getDisplayEnglish: (card: WordEntry | SentenceEntry, cardType: CardType) => string;
  readonly getDisplayKorean: (card: WordEntry | SentenceEntry, cardType: CardType) => string;
  readonly onToggle: (cardId: string, next: 'known' | 'unknown') => void;
}

const MODE_LABEL: Record<StudyMode, string> = {
  flashcard: 'FC',
  recall: 'RC',
  cloze: 'CL',
};

/**
 * cardType 별 노출 mode (배지 표시 순서):
 *   word: flashcard + recall
 *   sentence: flashcard + cloze
 */
const MODES_BY_CARD_TYPE: Record<CardType, readonly StudyMode[]> = {
  word: ['flashcard', 'recall'],
  sentence: ['flashcard', 'cloze'],
};

/**
 * 단어장 1행 카드.
 *
 * - 좌측: 학습 단계 dot
 * - 중앙: 영문 + 한국어 + 학습 횟수 메타 + mode 통과 배지
 * - 우측: 모름/안다 토글 버튼
 *
 * mode 배지: cardType 별로 사용 mode 만 표시. ✓ = lastRating='good', ✗ = 그 외/미학습.
 */
export function VocabularyRow({
  item,
  cardType,
  getDisplayEnglish,
  getDisplayKorean,
  onToggle,
}: VocabularyRowProps) {
  const { card, mark, stage, reps, passedByMode } = item;
  const english = getDisplayEnglish(card, cardType);
  const korean = getDisplayKorean(card, cardType);
  const stageLabel = STAGE_META[stage].label;
  const modes = MODES_BY_CARD_TYPE[cardType];

  return (
    <li className={styles.item} data-testid={`vocab-row-${card.id}`}>
      <span
        role="img"
        className={`${styles.dot} ${styles[`dot-${stage}`] ?? ''}`}
        aria-label={`학습 단계: ${stageLabel}`}
        title={stageLabel}
      />
      <div className={styles.itemMain}>
        <span className={styles.itemEnglish}>{english}</span>
        <span className={styles.itemKorean}>{korean}</span>
        <ul className={styles.modeBadges} aria-label="mode 통과 여부">
          {modes.map((mode) => {
            const passed = passedByMode[mode] === true;
            return (
              <li
                key={mode}
                className={`${styles.modeBadge} ${passed ? styles.modeBadgePassed : styles.modeBadgeMissed}`}
                title={`${MODE_LABEL[mode]} ${passed ? '통과' : '미통과'}`}
              >
                {MODE_LABEL[mode]} {passed ? '✓' : '✗'}
              </li>
            );
          })}
        </ul>
        {reps > 0 && <span className={styles.itemMeta}>학습 {reps}회</span>}
      </div>
      <div className={styles.markToggle}>
        <button
          type="button"
          className={`${styles.markBtn} ${styles.unknown} ${
            mark === 'unknown' ? styles.active : ''
          }`}
          onClick={() => onToggle(card.id, 'unknown')}
          aria-pressed={mark === 'unknown'}
          aria-label={`${english} 모름 표시`}
          data-testid={`mark-unknown-${card.id}`}
        >
          모름
        </button>
        <button
          type="button"
          className={`${styles.markBtn} ${styles.known} ${mark === 'known' ? styles.active : ''}`}
          onClick={() => onToggle(card.id, 'known')}
          aria-pressed={mark === 'known' || mark === 'mastered'}
          aria-label={`${english} 안다 표시`}
          data-testid={`mark-known-${card.id}`}
        >
          {mark === 'mastered' ? '마스터 ⭐' : '안다'}
        </button>
      </div>
    </li>
  );
}
