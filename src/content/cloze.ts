/**
 * 클로즈 마커 파싱·치환 (M2).
 *
 * 마커 형식: `{단어}` — english 필드에 직접 삽입.
 * 예: "I {go} to school every {day}."
 */

const MARKER_PATTERN = /\{([^{}]+)\}/g;

export interface ClozeParseResult {
  /** 마커 사이의 텍스트 조각. parts.length === markers.length + 1 */
  readonly parts: readonly string[];
  /** 마커 내 단어 (인덱스 기준). cloze 정답 배열과 동일 순서여야 함 */
  readonly markers: readonly string[];
}

/**
 * 영어 문장에서 클로즈 마커를 파싱.
 *
 * @example
 *   parseCloze('I {go} to {school}.')
 *   // { parts: ['I ', ' to ', '.'], markers: ['go', 'school'] }
 *
 *   parseCloze('No markers here.')
 *   // { parts: ['No markers here.'], markers: [] }
 */
export function parseCloze(english: string): ClozeParseResult {
  const parts: string[] = [];
  const markers: string[] = [];
  let lastIndex = 0;

  // RegExp.exec를 안전하게 반복
  const regex = new RegExp(MARKER_PATTERN.source, 'g');
  let match = regex.exec(english);
  while (match !== null) {
    parts.push(english.slice(lastIndex, match.index));
    markers.push(match[1] ?? '');
    lastIndex = match.index + match[0].length;
    match = regex.exec(english);
  }
  parts.push(english.slice(lastIndex));

  return { parts, markers };
}

/**
 * 마커를 실제 단어로 치환 (TTS 발화 / 플래시카드 표시 시).
 *
 * - replacements 미지정 → 마커 안의 단어 자체 사용
 * - replacements 지정 → 인덱스 순서대로 사용. 부족하면 마커로 폴백
 *
 * @example
 *   fillCloze('I {go}.') === 'I go.'
 *   fillCloze('I {go}.', ['walk']) === 'I walk.'
 */
export function fillCloze(english: string, replacements?: readonly string[]): string {
  const { parts, markers } = parseCloze(english);
  let result = parts[0] ?? '';
  for (let i = 0; i < markers.length; i++) {
    const replacement = replacements?.[i] ?? markers[i] ?? '';
    result += replacement;
    result += parts[i + 1] ?? '';
  }
  return result;
}

/**
 * 빈칸 표기 (학습 화면용) — 마커 자리를 빈 placeholder로.
 *
 * @example
 *   maskCloze('I {go} to {school}.') === 'I _____ to _____.'
 */
export function maskCloze(english: string, placeholder = '_____'): string {
  const { parts, markers } = parseCloze(english);
  return parts.reduce((acc, part, i) => {
    if (i === 0) return part;
    return `${acc}${placeholder}${part}`;
  }, '') || markers.length > 0
    ? parts.join(placeholder)
    : english;
}
