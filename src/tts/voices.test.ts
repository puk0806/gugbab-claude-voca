import { afterEach, describe, expect, it, vi } from 'vitest';
import { listVoices, pickEnglishVoice } from './voices';

const VOICES: Array<Partial<SpeechSynthesisVoice>> = [
  { voiceURI: 'v1', lang: 'ko-KR' },
  { voiceURI: 'v2', lang: 'en-GB' },
  { voiceURI: 'v3', lang: 'en-US' },
  { voiceURI: 'v4', lang: 'en-AU' },
];

describe('pickEnglishVoice', () => {
  it('빈 배열이면 null', () => {
    expect(pickEnglishVoice([])).toBeNull();
  });

  it('en-US가 있으면 en-US 선택', () => {
    const v = pickEnglishVoice(VOICES as SpeechSynthesisVoice[]);
    expect(v?.voiceURI).toBe('v3');
  });

  it('en-US 없으면 en-GB 선택', () => {
    const subset = VOICES.filter((v) => v.lang !== 'en-US') as SpeechSynthesisVoice[];
    expect(pickEnglishVoice(subset)?.voiceURI).toBe('v2');
  });

  it('en-* 없으면 첫 번째 voice 반환', () => {
    const subset = [{ voiceURI: 'k1', lang: 'ko-KR' }] as SpeechSynthesisVoice[];
    expect(pickEnglishVoice(subset)?.voiceURI).toBe('k1');
  });

  it('preferredURI가 있으면 우선 사용', () => {
    const v = pickEnglishVoice(VOICES as SpeechSynthesisVoice[], 'v4');
    expect(v?.voiceURI).toBe('v4');
  });

  it('preferredURI가 미존재면 fallback 우선순위 적용', () => {
    const v = pickEnglishVoice(VOICES as SpeechSynthesisVoice[], 'missing');
    expect(v?.voiceURI).toBe('v3');
  });
});

describe('listVoices', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('window.speechSynthesis가 없으면 빈 배열', () => {
    vi.stubGlobal('window', {});
    expect(listVoices()).toEqual([]);
  });

  it('window.speechSynthesis.getVoices()를 호출하여 반환', () => {
    const fakeVoices = [{ voiceURI: 'a', lang: 'en-US' }];
    vi.stubGlobal('window', {
      speechSynthesis: { getVoices: () => fakeVoices },
    });
    expect(listVoices()).toEqual(fakeVoices);
  });
});
