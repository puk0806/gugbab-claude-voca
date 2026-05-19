/**
 * IntersectionObserver 기반 무한 스크롤 sentinel 훅.
 *
 * - 반환된 ref를 *리스트 끝의 빈 요소*에 부착
 * - sentinel이 viewport에 진입하면 `onLoadMore` 콜백 발화
 * - `disabled` true면 observer 미부착 (다 노출되면 끄기)
 * - `rootMargin`으로 prefetch 영역 조절 (기본 300px 앞에서 발화)
 *
 * 가상 스크롤(react-virtuoso)과 *직교 관심사* — 본 훅은 *언제 더 노출할지*만 책임,
 * *어떻게 DOM 렌더할지*는 virtuoso가 처리.
 */
import { useEffect, useRef } from 'react';

export interface InfiniteSentinelOptions {
  /** true면 observer 미부착 (모두 노출됐을 때) */
  readonly disabled?: boolean;
  /** viewport entry 기준 prefetch 영역 (default '300px') */
  readonly rootMargin?: string;
  /** observer root element (default null = viewport) */
  readonly root?: Element | null;
}

export function useInfiniteSentinel(onLoadMore: () => void, options: InfiniteSentinelOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onLoadMore);

  // stale closure 방지 — 최신 콜백을 ref로 추적
  useEffect(() => {
    callbackRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const target = ref.current;
    if (options.disabled || !target) return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          callbackRef.current();
        }
      },
      {
        root: options.root ?? null,
        rootMargin: options.rootMargin ?? '300px',
      },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [options.disabled, options.root, options.rootMargin]);

  return ref;
}
