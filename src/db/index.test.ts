/**
 * Barrel public API 회귀 테스트.
 */
import { describe, expect, it } from 'vitest';
import * as PublicApi from './index';

describe('db public API (barrel)', () => {
  it('schema·db 인스턴스 노출', () => {
    expect(PublicApi.db).toBeDefined();
    expect(PublicApi.GugbabVocaDB).toBeDefined();
  });

  it('SETTING_KEYS·SETTING_DEFAULTS 노출', () => {
    expect(PublicApi.SETTING_KEYS).toBeDefined();
    expect(PublicApi.SETTING_DEFAULTS).toBeDefined();
  });

  it('progressRepo 함수 노출', () => {
    expect(typeof PublicApi.getProgress).toBe('function');
    expect(typeof PublicApi.upsertProgress).toBe('function');
    expect(typeof PublicApi.getDueCards).toBe('function');
    expect(typeof PublicApi.getNewProgress).toBe('function');
    expect(typeof PublicApi.countDue).toBe('function');
    expect(typeof PublicApi.getAllProgressByCardId).toBe('function');
  });

  it('markRepo 함수 노출', () => {
    expect(typeof PublicApi.getMark).toBe('function');
    expect(typeof PublicApi.setMark).toBe('function');
    expect(typeof PublicApi.clearMark).toBe('function');
    expect(typeof PublicApi.listMarksByLevel).toBe('function');
    expect(typeof PublicApi.countMarksByLevel).toBe('function');
  });

  it('settingsRepo 함수 노출', () => {
    expect(typeof PublicApi.getSetting).toBe('function');
    expect(typeof PublicApi.setSetting).toBe('function');
    expect(typeof PublicApi.getAllSettings).toBe('function');
    expect(typeof PublicApi.clearSetting).toBe('function');
  });

  it('sessionLogRepo 함수 노출', () => {
    expect(typeof PublicApi.createSession).toBe('function');
    expect(typeof PublicApi.endSession).toBe('function');
    expect(typeof PublicApi.listRecent).toBe('function');
    expect(typeof PublicApi.getSession).toBe('function');
  });

  it('persistence 함수 노출', () => {
    expect(typeof PublicApi.requestPersistentStorage).toBe('function');
    expect(typeof PublicApi.isPersistent).toBe('function');
    expect(typeof PublicApi.getStorageEstimate).toBe('function');
  });
});
