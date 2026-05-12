/**
 * 홈 화면 CEFR 레벨 카드.
 *
 * - disabled: 콘텐츠 0개인 레벨은 비활성 ("콘텐츠 준비 중")
 * - dueCount: 오늘 due 카드 수 배지
 * - totalCount / learnedCount: 진도 비율
 */
import { clsx } from 'clsx';
import type { CEFR } from '@/shared/types';
import { ProgressBar } from './ProgressBar';
import styles from './LevelCard.module.css';

interface LevelCardProps {
  readonly level: CEFR;
  readonly subtitle: string;
  readonly totalCount: number;
  readonly learnedCount: number;
  readonly dueCount: number;
  readonly disabled?: boolean;
  readonly onClick?: () => void;
}

export function LevelCard({
  level,
  subtitle,
  totalCount,
  learnedCount,
  dueCount,
  disabled = false,
  onClick,
}: LevelCardProps) {
  const ratio = totalCount > 0 ? learnedCount / totalCount : 0;
  return (
    <button
      type="button"
      className={clsx(styles.card, disabled && styles.disabled)}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={`${level} 레벨${disabled ? ' (콘텐츠 준비 중)' : ''}`}
    >
      <div className={styles.level}>{level}</div>
      <div className={styles.subtitle}>{subtitle}</div>
      {disabled ? (
        <div className={styles.placeholder}>콘텐츠 준비 중</div>
      ) : (
        <div className={styles.metrics}>
          <div className={styles.progress}>
            <ProgressBar value={ratio} ariaLabel={`${level} 진도`} />
          </div>
          {dueCount > 0 && (
            <span className={styles.dueBadge} role="img" aria-label={`오늘 복습 ${dueCount}장`}>
              due {dueCount}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
