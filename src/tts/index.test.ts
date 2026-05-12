import { describe, expect, it } from 'vitest';
import * as tts from './index';

describe('tts barrel', () => {
  it('주요 API가 모두 export된다', () => {
    expect(typeof tts.useSpeak).toBe('function');
    expect(typeof tts.isSpeechSynthesisSupported).toBe('function');
    expect(typeof tts.listVoices).toBe('function');
    expect(typeof tts.pickEnglishVoice).toBe('function');
  });
});
