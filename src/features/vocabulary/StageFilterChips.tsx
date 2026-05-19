import type { LearningStage } from './computeLearningScore';
import { STAGE_META } from './computeLearningScore';
import styles from './StageFilterChips.module.css';
import { STAGE_ORDER } from './stageOrder';

export interface StageFilterChipsProps {
  readonly stageFilter: LearningStage | 'all';
  readonly stageCounts: Readonly<Record<LearningStage, number>>;
  readonly totalCount: number;
  readonly onChange: (next: LearningStage | 'all') => void;
}

/**
 * 학습 단계 필터 chip 헤더.
 *
 * 7개 단계(STAGE_ORDER: unknown · review-due · learning · new · completed · known · mastered)
 * + 전체 1개 = 8개 tab. 각 chip에 단계별 카운트 표시.
 */
export function StageFilterChips({
  stageFilter,
  stageCounts,
  totalCount,
  onChange,
}: StageFilterChipsProps) {
  return (
    <div className={styles.stageChips} role="tablist" aria-label="학습 단계 필터">
      <button
        type="button"
        role="tab"
        aria-selected={stageFilter === 'all'}
        className={`${styles.stageChip} ${stageFilter === 'all' ? styles.active : ''}`}
        onClick={() => onChange('all')}
      >
        전체 <span className={styles.chipCount}>{totalCount}</span>
      </button>
      {STAGE_ORDER.map((stage) => (
        <button
          key={stage}
          type="button"
          role="tab"
          aria-selected={stageFilter === stage}
          className={`${styles.stageChip} ${styles[`chip-${stage}`] ?? ''} ${
            stageFilter === stage ? styles.active : ''
          }`}
          onClick={() => onChange(stage)}
        >
          <span className={`${styles.dot} ${styles[`dot-${stage}`] ?? ''}`} />
          {STAGE_META[stage].label}
          <span className={styles.chipCount}>{stageCounts[stage]}</span>
        </button>
      ))}
    </div>
  );
}
