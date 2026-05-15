import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerServiceWorker } from './pwa';

describe('registerServiceWorker', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it('개발 모드(DEV)에서는 SW 등록을 skip하고 정상 종료한다', async () => {
    vi.stubEnv('DEV', true);
    await expect(registerServiceWorker()).resolves.toBeUndefined();
  });

  it('navigator.serviceWorker가 없으면 silent skip한다', async () => {
    vi.stubEnv('DEV', false);
    Object.defineProperty(globalThis, 'navigator', {
      value: {} as Navigator,
      configurable: true,
      writable: true,
    });
    await expect(registerServiceWorker()).resolves.toBeUndefined();
  });

  it('serviceWorker 지원 환경에서는 registerSW(virtual:pwa-register)를 호출한다', async () => {
    vi.stubEnv('DEV', false);
    Object.defineProperty(globalThis, 'navigator', {
      value: { serviceWorker: {} as ServiceWorkerContainer } as Navigator,
      configurable: true,
      writable: true,
    });
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // virtual:pwa-register는 vitest alias로 src/__mocks__/pwa-register.ts에 매핑됨.
    // mock의 registerSW는 부작용 없이 noop이지만, import 자체는 성공해야 한다.
    await expect(registerServiceWorker()).resolves.toBeUndefined();
    // 정상 경로에서는 catch에 진입하지 않으므로 warn 호출되지 않아야 함.
    expect(warn).not.toHaveBeenCalled();
    // mock registerSW가 onRegisteredSW 콜백을 트리거하지 않으므로 info도 없음.
    expect(info).not.toHaveBeenCalled();
  });
});
