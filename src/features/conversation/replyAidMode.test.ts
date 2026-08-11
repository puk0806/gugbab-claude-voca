import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_REPLY_AID_MODE } from './chatRequest';
import {
  loadReplyAidMode,
  REPLY_AID_MODE_LABELS,
  REPLY_AID_MODES,
  saveReplyAidMode,
} from './replyAidMode';

describe('replyAidMode 영속화', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('저장값이 없으면 기본값(both)을 반환한다', () => {
    expect(loadReplyAidMode()).toBe(DEFAULT_REPLY_AID_MODE);
    expect(DEFAULT_REPLY_AID_MODE).toBe('both');
  });

  it('save 후 load 하면 같은 모드를 돌려준다', () => {
    saveReplyAidMode('none');
    expect(loadReplyAidMode()).toBe('none');
    saveReplyAidMode('expressions');
    expect(loadReplyAidMode()).toBe('expressions');
  });

  it('오염된 저장값은 기본값으로 폴백한다', () => {
    localStorage.setItem('gugbab-voca:replyAidMode', 'garbage-value');
    expect(loadReplyAidMode()).toBe(DEFAULT_REPLY_AID_MODE);
  });

  it('localStorage 접근 불가 시에도 예외 없이 기본값을 반환한다', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    try {
      expect(loadReplyAidMode()).toBe(DEFAULT_REPLY_AID_MODE);
      expect(() => saveReplyAidMode('none')).not.toThrow();
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });

  it('모드 목록과 라벨이 1:1 로 대응한다', () => {
    expect(REPLY_AID_MODES).toEqual(['none', 'translation', 'expressions', 'both']);
    for (const mode of REPLY_AID_MODES) {
      expect(REPLY_AID_MODE_LABELS[mode]).toBeTruthy();
    }
  });
});
