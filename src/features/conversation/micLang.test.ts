import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_MIC_LANG, loadMicLang, MIC_LANG_LABELS, MIC_LANGS, saveMicLang } from './micLang';

describe('micLang 영속화', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('저장값이 없으면 기본값(en-US)을 반환한다', () => {
    expect(loadMicLang()).toBe(DEFAULT_MIC_LANG);
    expect(DEFAULT_MIC_LANG).toBe('en-US');
  });

  it('save 후 load 하면 같은 언어를 돌려준다', () => {
    saveMicLang('ko-KR');
    expect(loadMicLang()).toBe('ko-KR');
    saveMicLang('en-US');
    expect(loadMicLang()).toBe('en-US');
  });

  it('오염된 저장값은 기본값으로 폴백한다', () => {
    localStorage.setItem('gugbab-voca:micLang', 'fr-FR');
    expect(loadMicLang()).toBe(DEFAULT_MIC_LANG);
  });

  it('localStorage 접근 불가 시에도 예외 없이 기본값을 반환한다', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    try {
      expect(loadMicLang()).toBe(DEFAULT_MIC_LANG);
      expect(() => saveMicLang('ko-KR')).not.toThrow();
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });

  it('언어 목록과 라벨이 1:1 로 대응한다', () => {
    expect(MIC_LANGS).toEqual(['en-US', 'ko-KR']);
    for (const lang of MIC_LANGS) {
      expect(MIC_LANG_LABELS[lang]).toBeTruthy();
    }
  });
});
