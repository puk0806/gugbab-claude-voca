import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, resetDb } from '../schema';
import { SETTING_KEYS } from '../types';
import { clearSetting, getAllSettings, getSetting, setSetting } from './settingsRepo';

describe('settingsRepo', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await db.delete();
  });

  describe('getSetting (default fallback)', () => {
    it('미저장 ttsRate → default 1.0', async () => {
      expect(await getSetting<number>(SETTING_KEYS.TTS_RATE)).toBe(1.0);
    });

    it('미저장 sessionSize → default 20', async () => {
      expect(await getSetting<number>(SETTING_KEYS.SESSION_SIZE)).toBe(20);
    });

    it('미저장 ttsAutoPlay → default true', async () => {
      expect(await getSetting<boolean>(SETTING_KEYS.TTS_AUTO_PLAY)).toBe(true);
    });

    it('미저장 ttsVoiceURI → default null', async () => {
      expect(await getSetting<string | null>(SETTING_KEYS.TTS_VOICE_URI)).toBeNull();
    });
  });

  describe('setSetting + getSetting', () => {
    it('숫자 저장·조회', async () => {
      await setSetting(SETTING_KEYS.TTS_RATE, 0.8);
      expect(await getSetting<number>(SETTING_KEYS.TTS_RATE)).toBe(0.8);
    });

    it('문자열 저장·조회', async () => {
      await setSetting(SETTING_KEYS.TTS_VOICE_URI, 'en-US Daniel');
      expect(await getSetting<string>(SETTING_KEYS.TTS_VOICE_URI)).toBe('en-US Daniel');
    });

    it('동일 key 재저장 → update', async () => {
      await setSetting(SETTING_KEYS.SESSION_SIZE, 10);
      await setSetting(SETTING_KEYS.SESSION_SIZE, 30);
      expect(await getSetting<number>(SETTING_KEYS.SESSION_SIZE)).toBe(30);
      expect(await db.appSettings.count()).toBe(1);
    });
  });

  describe('clearSetting', () => {
    it('삭제 후 default 반환', async () => {
      await setSetting(SETTING_KEYS.TTS_RATE, 0.8);
      await clearSetting(SETTING_KEYS.TTS_RATE);
      expect(await getSetting<number>(SETTING_KEYS.TTS_RATE)).toBe(1.0);
    });
  });

  describe('getAllSettings', () => {
    it('모든 key를 default + 저장값 혼합으로 반환', async () => {
      await setSetting(SETTING_KEYS.TTS_RATE, 0.7);
      const all = await getAllSettings();
      expect(all[SETTING_KEYS.TTS_RATE]).toBe(0.7);
      expect(all[SETTING_KEYS.SESSION_SIZE]).toBe(20); // default
      expect(all[SETTING_KEYS.TTS_VOICE_URI]).toBeNull(); // default
    });
  });
});
