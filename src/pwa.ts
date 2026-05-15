/**
 * Service Worker 등록 helper.
 *
 * vite-plugin-pwa의 virtual:pwa-register 모듈을 동적 임포트해 SW를 등록한다.
 * registerType: 'autoUpdate'이므로 새 SW 발견 시 백그라운드 다운 후 다음 페이지 진입에 자동 활성.
 *
 * 테스트 가능성을 위해 별도 모듈로 분리. main.tsx에서 호출.
 */
export async function registerServiceWorker(): Promise<void> {
  if (import.meta.env.DEV) {
    return;
  }

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({
      immediate: true,
      onRegisteredSW(swUrl) {
        console.info('[pwa] SW registered:', swUrl);
      },
      onRegisterError(error) {
        console.error('[pwa] SW registration failed:', error);
      },
    });
  } catch (err) {
    console.warn('[pwa] virtual:pwa-register not available:', err);
  }
}
