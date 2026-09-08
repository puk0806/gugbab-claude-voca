/**
 * assistant 답변에서 스피커로 읽을 영어 대답 부분만 추출.
 *
 * systemPrompt 형식 기준으로 제거하는 것:
 * - ✏️ 교정 라인 / 🗣️ 표현 안내 라인 (한국어 노트 포함)
 * - "(한국어 해석)" 블록, "📌 핵심 표현" 헤더와 불릿
 * - 그 외 한글이 포함된 모든 라인 (형식 이탈 방어)
 *
 * 형식이 어긋나도 안전하도록 라인 단위 한글 검사로 방어한다 — 영어 대답은
 * 프롬프트상 순수 영어이므로 한글 포함 라인은 전부 학습 보조 텍스트다.
 */

const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;
const AID_MARKER_RE = /[✏🗣📌]/u;

export function extractSpokenEnglish(content: string): string {
  const lines = content.split('\n');
  const kept: string[] = [];
  let inExpressionsBlock = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.includes('📌')) {
      inExpressionsBlock = true;
      continue;
    }
    // 핵심 표현 블록의 불릿은 헤더 유실 시에도 한글 검사로 걸러진다
    if (inExpressionsBlock && line.startsWith('-')) continue;
    inExpressionsBlock = false;
    if (AID_MARKER_RE.test(line)) continue;
    if (HANGUL_RE.test(line)) continue;
    kept.push(line);
  }

  return kept.join(' ').trim();
}
