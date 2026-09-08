/**
 * 마이크 음성 인식 언어(MicLang) localStorage 영속화 + UI 라벨.
 *
 * Web Speech API 는 세션당 언어 1개(자동 감지 없음) — EN/한 토글로 전환한다.
 * 저장값이 없거나 오염됐으면 기본값('en-US')으로 폴백하고,
 * localStorage 접근 불가 환경에서도 예외 없이 동작한다.
 */

export type MicLang = 'en-US' | 'ko-KR';

const STORAGE_KEY = 'gugbab-voca:micLang';

export const MIC_LANGS: readonly MicLang[] = ['en-US', 'ko-KR'];

export const MIC_LANG_LABELS: Record<MicLang, string> = {
  'en-US': 'EN',
  'ko-KR': '한',
};

export const DEFAULT_MIC_LANG: MicLang = 'en-US';

function isMicLang(value: string | null): value is MicLang {
  return value !== null && (MIC_LANGS as readonly string[]).includes(value);
}

export function loadMicLang(): MicLang {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isMicLang(raw) ? raw : DEFAULT_MIC_LANG;
  } catch {
    return DEFAULT_MIC_LANG;
  }
}

export function saveMicLang(lang: MicLang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // 저장 실패 시 세션 내 상태로만 동작
  }
}
