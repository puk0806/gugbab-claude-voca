/**
 * 404 라우트.
 */
import { Link } from 'react-router-dom';
import { EmptyState } from '@/shared/components';

export function NotFound() {
  return (
    <EmptyState
      title="페이지를 찾을 수 없어요"
      description="존재하지 않거나 이동된 페이지일 수 있어요."
      action={<Link to="/">홈으로</Link>}
    />
  );
}
