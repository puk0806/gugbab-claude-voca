/**
 * 0~1 사이 비율을 시각화하는 가로 진행률 바.
 */
import { clamp } from '@/shared/utils';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  /** 0~1 사이 값. 범위 밖은 clamp. */
  readonly value: number;
  readonly ariaLabel?: string;
}

export function ProgressBar({ value, ariaLabel }: ProgressBarProps) {
  const clamped = clamp(value, 0, 1);
  const percent = Math.round(clamped * 100);
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={ariaLabel}
    >
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  );
}
