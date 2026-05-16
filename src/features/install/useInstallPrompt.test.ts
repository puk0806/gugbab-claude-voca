import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BeforeInstallPromptEvent } from './useInstallPrompt';
import { useInstallPrompt } from './useInstallPrompt';

interface MockNavigator extends Partial<Navigator> {
  standalone?: boolean;
}

function setUserAgent(ua: string): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: ua,
    configurable: true,
  });
}

function setStandalone(value: boolean): void {
  Object.defineProperty(window.navigator, 'standalone', {
    value,
    configurable: true,
    writable: true,
  });
}

function mockMatchMedia(standalone: boolean): void {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(display-mode: standalone)' ? standalone : false,
    media: query,
    onchange: null,
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
      listeners.add(cb);
    },
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
      listeners.delete(cb);
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as typeof window.matchMedia;
}

function createBeforeInstallPromptEvent(): BeforeInstallPromptEvent {
  const event = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
  event.prompt = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(event, 'userChoice', {
    value: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    configurable: true,
  });
  return event;
}

describe('useInstallPrompt', () => {
  const originalUserAgent = window.navigator.userAgent;
  const originalMatchMedia = window.matchMedia;
  const originalStandalone = (window.navigator as MockNavigator).standalone;

  beforeEach(() => {
    mockMatchMedia(false);
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64)');
    setStandalone(false);
  });

  afterEach(() => {
    setUserAgent(originalUserAgent);
    window.matchMedia = originalMatchMedia;
    if (originalStandalone === undefined) {
      delete (window.navigator as MockNavigator).standalone;
    } else {
      setStandalone(originalStandalone);
    }
    vi.restoreAllMocks();
  });

  it('display-mode standalone이면 mode = "installed", canInstall = false', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.mode).toBe('installed');
    expect(result.current.canInstall).toBe(false);
  });

  it('iOS Safari (UA: iPhone)에서는 mode = "ios-guide", canInstall = true', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    );
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.mode).toBe('ios-guide');
    expect(result.current.canInstall).toBe(true);
  });

  it('iOS Safari + navigator.standalone=true (홈에서 실행)이면 mode = "installed"', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    );
    setStandalone(true);
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.mode).toBe('installed');
  });

  it('Chrome/Edge desktop (beforeinstallprompt 이벤트 발생) → mode = "native"', async () => {
    setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0',
    );
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.mode).toBe('unsupported');

    const event = createBeforeInstallPromptEvent();
    await act(async () => {
      window.dispatchEvent(event);
    });

    expect(result.current.mode).toBe('native');
    expect(result.current.canInstall).toBe(true);
  });

  it('Android Chrome (beforeinstallprompt 이벤트) → mode = "native"', async () => {
    setUserAgent(
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0',
    );
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.mode).toBe('unsupported');

    await act(async () => {
      window.dispatchEvent(createBeforeInstallPromptEvent());
    });

    expect(result.current.mode).toBe('native');
  });

  it('미지원 브라우저 (UA: Linux desktop · iOS X · 이벤트 X) → mode = "unsupported"', () => {
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36');
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.mode).toBe('unsupported');
    expect(result.current.canInstall).toBe(false);
  });

  it('promptInstall() → native 모드에서 deferred.prompt() 호출 + outcome 반환', async () => {
    setUserAgent(
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0',
    );
    const { result } = renderHook(() => useInstallPrompt());
    const event = createBeforeInstallPromptEvent();
    await act(async () => {
      window.dispatchEvent(event);
    });

    let outcome: { outcome: 'accepted' | 'dismissed' } | null = null;
    await act(async () => {
      outcome = await result.current.promptInstall();
    });

    expect(event.prompt).toHaveBeenCalledOnce();
    expect(outcome).toEqual({ outcome: 'accepted' });
    // promptInstall 후 deferred 소진 → mode 복귀
    expect(result.current.mode).toBe('unsupported');
  });

  it('promptInstall() → ios-guide 모드에서는 null 반환 (caller가 모달 처리)', async () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    );
    const { result } = renderHook(() => useInstallPrompt());
    let outcome: { outcome: 'accepted' | 'dismissed' } | null = { outcome: 'accepted' };
    await act(async () => {
      outcome = await result.current.promptInstall();
    });
    expect(outcome).toBeNull();
  });

  it('appinstalled 이벤트 발생 시 → mode = "installed"로 전환', async () => {
    setUserAgent(
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0',
    );
    const { result } = renderHook(() => useInstallPrompt());
    await act(async () => {
      window.dispatchEvent(createBeforeInstallPromptEvent());
    });
    expect(result.current.mode).toBe('native');

    await act(async () => {
      window.dispatchEvent(new Event('appinstalled'));
    });
    expect(result.current.mode).toBe('installed');
  });
});
