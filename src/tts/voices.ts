/**
 * Web Speech API voice 로딩 유틸.
 *
 * 브라우저별로 voice가 비동기 로딩(voiceschanged 이벤트) — 초기 빈 배열 케이스 다수 보고.
 *
 * - listVoices: 현재 즉시 사용 가능한 voice 배열
 * - pickEnglishVoice: 영어 voice 우선순위(en-US > en-GB > en-* > 첫 번째)
 */

export function listVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

export function pickEnglishVoice(
  voices: readonly SpeechSynthesisVoice[],
  preferredURI?: string | null,
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  if (preferredURI) {
    const preferred = voices.find((v) => v.voiceURI === preferredURI);
    if (preferred) return preferred;
  }

  const enUs = voices.find((v) => v.lang === 'en-US');
  if (enUs) return enUs;

  const enGb = voices.find((v) => v.lang === 'en-GB');
  if (enGb) return enGb;

  const en = voices.find((v) => v.lang.startsWith('en'));
  if (en) return en;

  return voices[0] ?? null;
}
