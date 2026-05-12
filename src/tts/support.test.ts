import { afterEach, describe, expect, it, vi } from 'vitest';
import { isSpeechSynthesisSupported } from './support';

describe('isSpeechSynthesisSupported', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('window.speechSynthesis 존재 + speak 함수 가능하면 true', () => {
    vi.stubGlobal('window', {
      speechSynthesis: { speak: () => undefined },
    });
    expect(isSpeechSynthesisSupported()).toBe(true);
  });

  it('window.speechSynthesis 미존재 시 false', () => {
    vi.stubGlobal('window', {});
    expect(isSpeechSynthesisSupported()).toBe(false);
  });

  it('speechSynthesis.speak가 함수가 아니면 false', () => {
    vi.stubGlobal('window', { speechSynthesis: { speak: 'not-a-function' } });
    expect(isSpeechSynthesisSupported()).toBe(false);
  });
});
