import type { SentenceEntry, WordEntry } from '@/content';
import type { CardType } from '@/shared/types';
import { STAGE_META } from './computeLearningScore';
import type { ScoredCard } from './useVocabularyCards';
import styles from './VocabularyRow.module.css';

export interface VocabularyRowProps {
  readonly item: ScoredCard;
  readonly cardType: CardType;
  readonly getDisplayEnglish: (
    card: WordEntry | SentenceEntry,
    cardType: CardType,
  ) => string;
  readonly getDisplayKorean: (
    card: WordEntry | SentenceEntry,
    cardType: CardType,
  ) => string;
  readonly onToggle: (cardId: string, next: 'known' | 'unknown') => void;
}

/**
 * 단어장 1행 카드.
 *
 * - 좌측: 학습 단계 dot
 * - 중앙: 영문 + 한국어 + 학습 횟수 메타
 * - 우측: 모름/안다 토글 버튼
 */
export function VocabularyRow({
  item,
  cardType,
  getDisplayEnglish,
  getDisplayKorean,
  onToggle,
}: VocabularyRowProps) {
  const { card, mark, stage, reps } = item;
  const english = getDisplayEnglish(card, cardType);
  const korean = getDisplayKorean(card, cardType);
  const stageLabel = STAGE_META[stage].label;

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
          className={`${styles.markBtn} ${styles.known} ${
            mark === 'known' ? styles.active : ''
          }`}
          onClick={() => onToggle(card.id, 'known')}
          aria-pressed={mark === 'known'}
          aria-label={`${english} 안다 표시`}
          data-testid={`mark-known-${card.id}`}
        >
          안다
        </button>
      </div>
    </li>
  );
}
