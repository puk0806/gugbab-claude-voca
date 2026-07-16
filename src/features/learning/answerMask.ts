/**
 * 정답 글자수 마스크 helper — Recall·Cloze 공용.
 *
 * 공백은 그대로 두고 글자만 `_` 로 마스킹. 힌트를 누를 때마다
 * 앞에서부터 revealedCount 글자씩 노출한다 (다의어·철자 추측 도움).
 */

/**
 * 정답 글자수 마스크 생성. 공백은 그대로, 글자는 revealedCount 이내면 노출.
 */
export function buildMask(expected: string, revealedCount: number): string {
  let result = '';
  let letterIndex = 0;
  for (const ch of expected) {
    if (ch === ' ') {
      result += ' ';
    } else {
      result += letterIndex < revealedCount ? ch : '_';
      letterIndex += 1;
    }
  }
  return result;
}

/** 마스킹 대상 글자 수 (공백 제외). */
export function countLetters(expected: string): number {
  let n = 0;
  for (const ch of expected) {
    if (ch !== ' ') n += 1;
  }
  return n;
}
