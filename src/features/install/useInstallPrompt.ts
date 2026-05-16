import { useCallback, useEffect, useState } from 'react';

/**
 * PWA install prompt 훅.
 *
 * 환경별 동작:
 * - Chrome/Edge desktop · Android Chrome: `beforeinstallprompt` 이벤트 캐치 →
 *   `mode = 'native'`. promptInstall()로 네이티브 다이얼로그 호출.
 * - iOS Safari: `beforeinstallprompt` 미지원 → userAgent로 iOS Safari 감지 시
 *   `mode = 'ios-guide'`. promptInstall()은 caller가 안내 모달을 띄우는 신호로 사용.
 * - 이미 install된 상태 (`display-mode: standalone` 또는 iOS `navigator.standalone`):
 *   `mode = 'installed'`. 버튼 노출 안 함.
 * - 기타 (지원 X 브라우저): `mode = 'unsupported'`.
 */

export type InstallMode = 'native' | 'ios-guide' | 'installed' | 'unsupported';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface UseInstallPromptResult {
  readonly mode: InstallMode;
  readonly canInstall: boolean;
  readonly promptInstall: () => Promise<{ outcome: 'accepted' | 'dismissed' } | null>;
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches
  ) {
    return true;
  }
  // iOS Safari: navigator.standalone (non-standard)
  const navAny = window.navigator as Navigator & { standalone?: boolean };
  return navAny.standalone === true;
}

function detectIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  // iOS Chrome·FF 등은 WebKit 기반이지만 install prompt 동일하게 미지원
  // → iOS 자체를 감지하면 ios-guide 처리
  return isIOS;
}

export function useInstallPrompt(): UseInstallPromptResult {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(() => detectStandalone());
  const [iosFallback, setIosFallback] = useState<boolean>(() => detectIOSSafari());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    const standaloneMql =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(display-mode: standalone)')
        : null;
    const handleStandaloneChange = (e: MediaQueryListEvent) => {
      if (e.matches) setInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    standaloneMql?.addEventListener('change', handleStandaloneChange);

    // 마운트 시 한 번 더 동기화 (SSR·테스트 환경 대비)
    setInstalled(detectStandalone());
    setIosFallback(detectIOSSafari());

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneMql?.removeEventListener('change', handleStandaloneChange);
    };
  }, []);

  const mode: InstallMode = installed
    ? 'installed'
    : deferred
      ? 'native'
      : iosFallback
        ? 'ios-guide'
        : 'unsupported';

  const promptInstall = useCallback(async () => {
    if (mode === 'native' && deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      return { outcome: choice.outcome };
    }
    // ios-guide / installed / unsupported는 caller가 처리
    return null;
  }, [mode, deferred]);

  return {
    mode,
    canInstall: mode === 'native' || mode === 'ios-guide',
    promptInstall,
  };
}
