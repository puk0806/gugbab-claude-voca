import { afterEach, describe, expect, it, vi } from 'vitest';
import { getStorageEstimate, isPersistent, requestPersistentStorage } from './persistence';

describe('persistence (navigator.storage 추상화)', () => {
  const originalStorage = navigator.storage;

  afterEach(() => {
    Object.defineProperty(navigator, 'storage', {
      value: originalStorage,
      writable: true,
      configurable: true,
    });
  });

  describe('requestPersistentStorage', () => {
    it('navigator.storage 미지원 시 false', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(await requestPersistentStorage()).toBe(false);
    });

    it('persist() 성공 시 true 반환', async () => {
      const persist = vi.fn().mockResolvedValue(true);
      Object.defineProperty(navigator, 'storage', {
        value: { persist },
        writable: true,
        configurable: true,
      });
      expect(await requestPersistentStorage()).toBe(true);
      expect(persist).toHaveBeenCalledOnce();
    });

    it('persist() 거부 시 false 반환', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: { persist: vi.fn().mockResolvedValue(false) },
        writable: true,
        configurable: true,
      });
      expect(await requestPersistentStorage()).toBe(false);
    });

    it('persist() 예외 시 false (사용자에게 노출 X)', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: { persist: vi.fn().mockRejectedValue(new Error('denied')) },
        writable: true,
        configurable: true,
      });
      expect(await requestPersistentStorage()).toBe(false);
    });
  });

  describe('isPersistent', () => {
    it('미지원 시 false', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(await isPersistent()).toBe(false);
    });

    it('persisted() 결과 그대로 반환', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: { persisted: vi.fn().mockResolvedValue(true) },
        writable: true,
        configurable: true,
      });
      expect(await isPersistent()).toBe(true);
    });
  });

  describe('getStorageEstimate', () => {
    it('미지원 시 null', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(await getStorageEstimate()).toBeNull();
    });

    it('estimate() 결과 그대로 반환', async () => {
      const estimate = { quota: 1000000, usage: 500000 };
      Object.defineProperty(navigator, 'storage', {
        value: { estimate: vi.fn().mockResolvedValue(estimate) },
        writable: true,
        configurable: true,
      });
      expect(await getStorageEstimate()).toEqual(estimate);
    });
  });
});
