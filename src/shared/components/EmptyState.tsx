/**
 * 빈 상태/콘텐츠 없음/세션 종료 안내용 placeholder.
 */
import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.root} role="status">
      <div className={styles.title}>{title}</div>
      {description && <div className={styles.description}>{description}</div>}
      {action}
    </div>
  );
}
