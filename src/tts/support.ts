/**
 * Web Speech API 지원 여부 확인.
 *
 * 브라우저 환경 + speechSynthesis 객체 존재 + 함수 시그니처 모두 충족 시 true.
 */
export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.speechSynthesis.speak === 'function'
  );
}
