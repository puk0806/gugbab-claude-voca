/**
 * 루트 레이아웃 — 헤더 + main outlet.
 *
 * 모든 라우트가 본 레이아웃 안에 렌더링.
 * errorElement는 RouteError.
 */
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import styles from './Root.module.css';

export function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        {isHome ? (
          <span className={styles.title}>gugbab-voca</span>
        ) : (
          <button
            type="button"
            className={styles.back}
            onClick={() => navigate(-1)}
            aria-label="뒤로 가기"
          >
            ← 뒤로
          </button>
        )}
        <Link to="/" className={styles.title} aria-label="홈으로">
          {isHome ? '' : 'gugbab-voca'}
        </Link>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export function RouteError() {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link to="/" className={styles.title}>
          gugbab-voca
        </Link>
      </header>
      <main className={styles.main}>
        <div className={styles.error}>
          <h2>문제가 발생했어요</h2>
          <p>새로고침하거나 홈으로 돌아가 주세요.</p>
          <Link to="/">홈으로</Link>
        </div>
      </main>
    </div>
  );
}
