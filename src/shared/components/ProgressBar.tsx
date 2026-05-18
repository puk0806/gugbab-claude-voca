/**
 * 0~1 사이 비율을 시각화하는 가로 진행률 바.
 *
 * 가시성 보장: value > 0 인데 반올림 percent 가 너무 작으면(< MIN_VISIBLE_PERCENT)
 * fill 너비를 최소 가시값으로 보정한다. aria-valuenow 는 실제 값을 그대로 노출 —
 * 시각 보정과 의미 보존을 분리.
 */
import { clamp } from '@/shared/utils';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  /** 0~1 사이 값. 범위 밖은 clamp. */
  readonly value: number;
  readonly ariaLabel?: string;
}

const MIN_VISIBLE_PERCENT = 4;

export function ProgressBar({ value, ariaLabel }: ProgressBarProps) {
  const clamped = clamp(value, 0, 1);
  const percent = Math.round(clamped * 100);
  const fillPercent = clamped > 0 && percent < MIN_VISIBLE_PERCENT ? MIN_VISIBLE_PERCENT : percent;
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={ariaLabel}
    >
      <div className={styles.fill} style={{ width: `${fillPercent}%` }} />
    </div>
  );
}
