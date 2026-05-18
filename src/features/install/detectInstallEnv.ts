/**
 * PWA install 환경 감지 순수 유틸.
 *
 * 두 함수 모두 *side effect 없음* — 호출 시점의 상태만 반환.
 * SSR/jsdom 환경에서 안전 (matchMedia 가드 포함).
 */

/**
 * 앱이 이미 install된 standalone 모드에서 실행 중인지 판정.
 *
 * - `display-mode: standalone` (PWA 표준 매체 쿼리)
 * - `navigator.standalone` (iOS Safari 비표준 속성)
 */
export function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches
  ) {
    return true;
  }
  const navAny = window.navigator as Navigator & { standalone?: boolean };
  return navAny.standalone === true;
}

/**
 * iOS Safari 환경 감지.
 *
 * iOS는 `beforeinstallprompt` 이벤트를 지원하지 않아 별도 안내 모달 필요.
 * iOS의 Chrome·Whale 등도 WebKit 기반이므로 동일하게 처리 (UA에 iPhone/iPad/iPod 포함).
 */
export function detectIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua);
}
