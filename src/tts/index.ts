/**
 * `src/tts/` public API.
 *
 * Web Speech API 추상화. 외부 모듈은 본 barrel만 import.
 */
export { isSpeechSynthesisSupported } from './support';
export type { UseSpeakOptions, UseSpeakReturn } from './useSpeak';
export { useSpeak } from './useSpeak';
export { listVoices, pickEnglishVoice } from './voices';
