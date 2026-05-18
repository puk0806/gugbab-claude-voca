import { Link } from 'react-router-dom';
import styles from './SessionSummary.module.css';

export interface SessionSummaryProps {
  readonly cardsSeen: number;
  readonly goodCount: number;
  readonly againCount: number;
  readonly onRestart: () => void;
}

/**
 * 학습 세션 종료 후 요약 화면.
 *
 * - 본 카드 / 알았음 / 모르겠음 3개 메트릭 표시
 * - 카드 0개 진입 케이스 분기
 * - 홈으로 / 한 세션 더 하기 액션
 */
export function SessionSummary({
  cardsSeen,
  goodCount,
  againCount,
  onRestart,
}: SessionSummaryProps) {
  return (
    <div className={styles.summary}>
      <div className={styles.summaryTitle}>
        {cardsSeen === 0 ? '오늘 학습할 카드가 없어요' : '세션 완료!'}
      </div>
      <div className={styles.summaryMetrics}>
        <div className={styles.metric}>
          <div className={styles.metricValue}>{cardsSeen}</div>
          <div className={styles.metricLabel}>본 카드</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricValue}>{goodCount}</div>
          <div className={styles.metricLabel}>알았음</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricValue}>{againCount}</div>
          <div className={styles.metricLabel}>모르겠음</div>
        </div>
      </div>
      <div className={styles.summaryActions}>
        <Link to="/" className={styles.summaryAction}>
          홈으로
        </Link>
        {cardsSeen > 0 && (
          <button
            type="button"
            className={`${styles.summaryAction} ${styles.primary}`}
            onClick={onRestart}
          >
            한 세션 더 하기
          </button>
        )}
      </div>
    </div>
  );
}
