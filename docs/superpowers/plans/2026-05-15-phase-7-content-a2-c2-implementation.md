# Phase 7 · A2~C2 콘텐츠 확장 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A1만 있는 콘텐츠를 A2~C2 5단계로 확장하여 신규 2,300단어 + 900문장을 추가한다.

**Architecture:** 각 레벨마다 deep-researcher 위임으로 회화 빈도 + CEFR 4종 자료 교차 검증 → 단어·문장 JSON 작성 → cloze 정합성 vitest test 자동 검증 → 검증 보고서. cloze 정합성 검증 유틸을 한 번 작성해 5레벨 모두 재사용 + 향후 콘텐츠 갱신에도 재사용.

**Tech Stack:** deep-researcher 에이전트 · vitest · TypeScript · JSON

**Spec:** [`docs/superpowers/specs/2026-05-15-phase-7-content-a2-c2-design.md`](../specs/2026-05-15-phase-7-content-a2-c2-design.md)

---

## File Structure

| 파일 | 변경 | 책임 |
|---|---|---|
| `public/data/words/a2.json` ~ `c2.json` | Create (5개) | 신규 레벨 단어 (각 400~500개) |
| `public/data/sentences/a2.json` ~ `c2.json` | Create (5개) | 신규 레벨 문장 (각 150~200개) |
| `public/data/manifest.json` | Modify | counts.words/sentences 5단계 갱신 |
| `src/content/__tests__/cloze-integrity.test.ts` | Create | cloze 정합성 자동 검증 (5단계 모두) |
| `src/content/__tests__/cloze-integrity-utils.ts` | Create | lemma 활용형·기능어 화이트리스트 helper |
| `src/__tests__/router-helpers.tsx` | Modify (필요 시) | test fixture 카운트 sync |
| `docs/research/2026-05-1X-{level}-content-curation.md` | Create (5개) | 각 레벨 큐레이션·검증 보고서 |
| `README.md` | Modify | 콘텐츠 카운트 + 업데이트 로그 |
| `CLAUDE.md` | Modify | Phase 진행 표 |

---

## Task 0: 사전 점검

**Files:** (없음 — 환경 확인)

- [ ] **Step 1: 현재 브랜치 + 환경 확인**

```bash
git status
git branch --show-current
```

Expected: `feature/phase-7-content-a2-c2`, working tree clean (spec commit 1개 박힘).

- [ ] **Step 2: baseline 검증**

```bash
pnpm typecheck && pnpm lint && pnpm test 2>&1 | tail -5
```

Expected: 모두 PASS. 신규 작업 시작 전 baseline 보존.

- [ ] **Step 3: A1 콘텐츠 스키마 재확인**

```bash
head -5 public/data/words/a1.json
head -5 public/data/sentences/a1.json
cat public/data/manifest.json
```

Expected: WordEntry / SentenceEntry / Manifest 구조 파악.

---

## Task 1: cloze 정합성 검증 유틸 + 테스트 (재사용 인프라)

**Files:**
- Create: `src/content/__tests__/cloze-integrity-utils.ts`
- Create: `src/content/__tests__/cloze-integrity.test.ts`

- [ ] **Step 1: 유틸 helper 작성**

`src/content/__tests__/cloze-integrity-utils.ts`:

```ts
/**
 * cloze 정합성 검증 유틸.
 *
 * 문장의 cloze 빈칸 정답이 *해당 레벨 또는 하위 레벨* 단어장의 lemma·활용형·기능어·불규칙
 * 형태로 존재하는지 확인한다.
 *
 * 규칙:
 * - lemma 완전 일치 (case-insensitive)
 * - 활용형 (단순 형태론): -s, -es, -ed, -ied, -ing, -ly
 * - 기능어 화이트리스트 (관사·전치사·대명사·조동사 등)
 * - 불규칙 동사 화이트리스트 (be·go·come·eat·drink·sleep·see·say·make·take·bring·think·get·have·do 등)
 */

// 기능어 화이트리스트 (CEFR 외, 항상 OK)
export const FUNCTION_WORDS: ReadonlySet<string> = new Set([
  // 관사
  'a', 'an', 'the',
  // be 동사
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  // do
  'do', 'does', 'did', 'done', 'doing',
  // have
  'have', 'has', 'had', 'having',
  // 조동사
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  // 대명사·소유격
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'this', 'that', 'these', 'those',
  // 전치사
  'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'about', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'over',
  'against', 'around', 'across', 'along', 'behind', 'beside', 'beyond', 'inside', 'outside',
  // 접속사
  'and', 'or', 'but', 'so', 'if', 'when', 'while', 'as', 'because', 'since',
  'although', 'though', 'unless', 'until', 'whether', 'than',
  // 의문사
  'what', 'who', 'whom', 'whose', 'which', 'where', 'when', 'why', 'how',
  // 부사·기타
  'not', "n't", 'there', 'here', 'yes', 'no',
]);

// 불규칙 활용 화이트리스트 (활용형 → lemma)
export const IRREGULAR_FORMS: Record<string, string> = {
  // be
  am: 'be', is: 'be', are: 'be', was: 'be', were: 'be', been: 'be',
  // 일반 동사
  went: 'go', gone: 'go',
  came: 'come',
  ate: 'eat', eaten: 'eat',
  drank: 'drink', drunk: 'drink',
  slept: 'sleep',
  saw: 'see', seen: 'see',
  said: 'say',
  made: 'make',
  took: 'take', taken: 'take',
  brought: 'bring',
  thought: 'think',
  got: 'get', gotten: 'get',
  had: 'have',
  did: 'do', done: 'do',
  knew: 'know', known: 'know',
  gave: 'give', given: 'give',
  found: 'find',
  told: 'tell',
  became: 'become', become: 'become',
  left: 'leave',
  felt: 'feel',
  put: 'put',
  meant: 'mean',
  kept: 'keep',
  let: 'let',
  began: 'begin', begun: 'begin',
  showed: 'show', shown: 'show',
  heard: 'hear',
  ran: 'run', run: 'run',
  read: 'read',
  spoke: 'speak', spoken: 'speak',
  wrote: 'write', written: 'write',
  bought: 'buy',
  caught: 'catch',
  sat: 'sit',
  stood: 'stand',
  understood: 'understand',
  spent: 'spend',
  sold: 'sell',
  paid: 'pay',
  built: 'build',
  sent: 'send',
};

/**
 * 활용형 → lemma 후보 추출 (단순 형태론).
 * 우선순위: 불규칙 > 기능어 > 활용형 규칙
 */
export function normalizeToLemma(word: string): string[] {
  const w = word.toLowerCase().replace(/[.,!?;:'"]/g, '');
  const candidates: string[] = [w];

  // 불규칙
  if (IRREGULAR_FORMS[w]) {
    candidates.push(IRREGULAR_FORMS[w]);
  }

  // 단순 형태론 (긴 접미사부터)
  if (w.endsWith('ies') && w.length > 4) {
    candidates.push(`${w.slice(0, -3)}y`); // tries → try
  }
  if (w.endsWith('ied') && w.length > 4) {
    candidates.push(`${w.slice(0, -3)}y`); // tried → try
  }
  if (w.endsWith('es') && w.length > 3) {
    candidates.push(w.slice(0, -2)); // goes → go
  }
  if (w.endsWith('ed') && w.length > 3) {
    candidates.push(w.slice(0, -2)); // walked → walk
    candidates.push(w.slice(0, -1)); // hoped → hope (e 추가)
    if (w[w.length - 3] === w[w.length - 4]) {
      candidates.push(w.slice(0, -3)); // stopped → stop (자음 중복)
    }
  }
  if (w.endsWith('ing') && w.length > 4) {
    candidates.push(w.slice(0, -3)); // walking → walk
    candidates.push(`${w.slice(0, -3)}e`); // hoping → hope
    if (w[w.length - 4] === w[w.length - 5]) {
      candidates.push(w.slice(0, -4)); // stopping → stop
    }
  }
  if (w.endsWith('ly') && w.length > 3) {
    candidates.push(w.slice(0, -2)); // quickly → quick
  }
  if (w.endsWith('s') && w.length > 2) {
    candidates.push(w.slice(0, -1)); // dogs → dog
  }
  if (w.endsWith("n't")) {
    candidates.push(w.slice(0, -3)); // don't → do
  }

  return candidates;
}

export function isClozeWordValid(
  clozeWord: string,
  lemmaPool: ReadonlySet<string>,
): boolean {
  const w = clozeWord.toLowerCase().replace(/[.,!?;:'"]/g, '');
  if (FUNCTION_WORDS.has(w)) return true;
  if (lemmaPool.has(w)) return true;

  const candidates = normalizeToLemma(w);
  return candidates.some((c) => lemmaPool.has(c));
}
```

- [ ] **Step 2: cloze 정합성 테스트 작성**

`src/content/__tests__/cloze-integrity.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SentenceEntry, WordEntry } from '@/shared/types';
import { isClozeWordValid } from './cloze-integrity-utils';

const ROOT = join(__dirname, '../../..');
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const;

function loadWords(level: string): WordEntry[] {
  try {
    const raw = readFileSync(
      join(ROOT, 'public/data/words', `${level}.json`),
      'utf-8',
    );
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function loadSentences(level: string): SentenceEntry[] {
  try {
    const raw = readFileSync(
      join(ROOT, 'public/data/sentences', `${level}.json`),
      'utf-8',
    );
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

describe('cloze 정합성 (누적 lemma 풀)', () => {
  // 누적 풀: A1 → A1+A2 → A1+A2+B1 → ...
  for (let i = 0; i < LEVELS.length; i++) {
    const currentLevel = LEVELS[i];
    const cumulativeLevels = LEVELS.slice(0, i + 1);

    describe(`${currentLevel.toUpperCase()}`, () => {
      const lemmaPool = new Set<string>();
      for (const lvl of cumulativeLevels) {
        for (const w of loadWords(lvl)) {
          lemmaPool.add(w.english.toLowerCase());
        }
      }
      const sentences = loadSentences(currentLevel);

      if (sentences.length === 0) {
        it.skip(`${currentLevel.toUpperCase()} 문장 없음 (큐레이션 전)`, () => {});
        return;
      }

      it(`모든 cloze 정답이 누적 lemma 풀에 존재 (${sentences.length}문장)`, () => {
        const failures: { id: string; cloze: string }[] = [];
        for (const s of sentences) {
          for (const clozeWord of s.cloze) {
            if (!isClozeWordValid(clozeWord, lemmaPool)) {
              failures.push({ id: s.id, cloze: clozeWord });
            }
          }
        }
        if (failures.length > 0) {
          const sample = failures.slice(0, 10);
          console.error(
            `${currentLevel} cloze 정합성 위반 ${failures.length}건. 샘플 10건:`,
            sample,
          );
        }
        expect(failures).toEqual([]);
      });
    });
  }
});
```

- [ ] **Step 3: 테스트 실행 — A1만 통과해야 (A2~C2는 skip)**

```bash
pnpm test src/content/__tests__/cloze-integrity.test.ts 2>&1 | tail -15
```

Expected:
- A1: PASS (이미 cloze 정합성 100%)
- A2~C2: skipped (콘텐츠 없음)

- [ ] **Step 4: Commit**

```bash
git add src/content/__tests__/cloze-integrity-utils.ts src/content/__tests__/cloze-integrity.test.ts
git commit -m "[code] Add: cloze 정합성 자동 검증 유틸 + 테스트

- src/content/__tests__/cloze-integrity-utils.ts: lemma 정규화 (활용형·기능어·불규칙 화이트리스트)
- src/content/__tests__/cloze-integrity.test.ts: 누적 lemma 풀 기반 자동 검증 (A1→A1+A2→... 누적)
- Phase 7 5개 레벨 큐레이션마다 자동 검증, 향후 콘텐츠 갱신에도 재사용
- A1 baseline PASS, A2~C2는 skip (콘텐츠 작성 후 자동 활성)"
```

---

## Task 2: A2 큐레이션 + 검증 + 보고서

**Files:**
- Create: `public/data/words/a2.json`
- Create: `public/data/sentences/a2.json`
- Modify: `public/data/manifest.json`
- Create: `docs/research/2026-05-15-a2-content-curation.md`

- [ ] **Step 1: deep-researcher 호출 — A2 큐레이션**

다음 prompt로 deep-researcher 에이전트 호출:

```
A2 단어 500개 + 문장 200개를 큐레이션해주세요.

자료 (4종 교차 검증):
- NGSL-Spoken v1.2 (newgeneralservicelist.org) — 회화 빈도
- Cambridge YLE Movers/Flyers + EVP — CEFR 라벨
- Oxford 3000 by CEFR (a2 라벨)
- English Vocabulary Profile (EVP) — A2 분류

스키마:
WordEntry = { id: "w_a2_NNN", level: "A2", english, korean, secondaryKorean?, partOfSpeech, tags? }
SentenceEntry = { id: "s_a2_NNN", level: "A2", english (cloze는 {} 표기), korean, cloze: string[], tags? }

룰:
- 회화 실용성 우선 (격식체보다 일상 회화·실제 발화 빈도 상위)
- 출처 답습 흔적 0 (Unit·DAY·책 단원명·인물 이름 금지) — feedback_content_origin_concealment 룰
- secondaryKorean은 다의어만 (회화 빈도 상위 2번째 의미)
- cloze 빈칸은 A1+A2 누적 단어장 lemma 풀에서 (활용형·기능어·불규칙 OK)
- partOfSpeech: noun/verb/adjective/adverb/pronoun/preposition/conjunction/interjection/determiner/auxiliary
- tags는 자유 (greeting·family·food·routine·question·airport·hotel 등)

산출물:
1. public/data/words/a2.json (JSON 배열, 500개)
2. public/data/sentences/a2.json (JSON 배열, 200개)
3. docs/research/2026-05-15-a2-content-curation.md (검증 보고서)
   - 4종 자료 교차 결과 (4/4·3/4·2/4·1/4·0/4 분포)
   - 의심 단어 + 교체 결정
   - 외국 회화 핵심 갭 + 보강
   - 시간 제약·한계 명시

회화 핵심 시나리오 (A2 수준):
- 식당 주문·결제 (확장)
- 길 묻기·교통 (대중교통·택시·기차)
- 쇼핑 (가격 흥정·교환·환불)
- 호텔 체크인·문의
- 일상 대화 (날씨·취미·주말 계획)
- 감정 표현 (기쁨·실망·놀람·고마움)
- 시간·약속 (will/going to 미래 표현)
- 비교 (more/most·~보다)
```

- [ ] **Step 2: 결과 파일 검증**

```bash
ls public/data/words/a2.json public/data/sentences/a2.json docs/research/2026-05-15-a2-content-curation.md
python3 -c "import json; print(len(json.load(open('public/data/words/a2.json'))))"
python3 -c "import json; print(len(json.load(open('public/data/sentences/a2.json'))))"
```

Expected: 단어 500개 / 문장 200개 / 보고서 1개.

- [ ] **Step 3: 출처 답습 grep 검증**

```bash
grep -rE "Unit |DAY 0|쿨하게|간단하게|뜬금없이|딱 한 단어" public/data/words/a2.json public/data/sentences/a2.json docs/research/2026-05-15-a2-content-curation.md
```

Expected: 0 매칭 (출처 답습 흔적 없음).

- [ ] **Step 4: manifest.json 갱신**

`public/data/manifest.json`:

```json
{
  "buildAt": "2026-05-15T00:00:00Z",
  "schemaVersion": 1,
  "counts": {
    "words": { "A1": 649, "A2": 500, "B1": 0, "B2": 0, "C1": 0, "C2": 0 },
    "sentences": { "A1": 250, "A2": 200, "B1": 0, "B2": 0, "C1": 0, "C2": 0 }
  }
}
```

- [ ] **Step 5: cloze 정합성 자동 검증**

```bash
pnpm test src/content/__tests__/cloze-integrity.test.ts 2>&1 | tail -10
```

Expected: A1·A2 PASS, 나머지 skip. 실패 시 cloze 단어 교체 또는 단어장에 lemma 추가 후 재실행.

- [ ] **Step 6: 전체 테스트 + 빌드 검증**

```bash
pnpm typecheck && pnpm lint && pnpm test 2>&1 | tail -5 && pnpm build 2>&1 | tail -10
```

Expected: 모두 PASS.

- [ ] **Step 7: Commit (코드 + 보고서, 2개 분리)**

```bash
git add public/data/words/a2.json public/data/sentences/a2.json public/data/manifest.json
git commit -m "[code] Add: A2 콘텐츠 500단어 + 200문장 + manifest 갱신

- 자료 교차: NGSL-Spoken · Cambridge YLE/EVP · Oxford 3000 (A2 라벨) · EVP
- 회화 핵심 시나리오: 식당·교통·쇼핑·호텔·일상·감정·시간·비교
- secondaryKorean 다의어 적용
- cloze 정합성 100% (A1+A2 누적 lemma 풀, 자동 테스트 통과)"

git add docs/research/2026-05-15-a2-content-curation.md
git commit -m "[docs] Add: A2 콘텐츠 큐레이션 + 4종 자료 교차 검증 보고서"
```

---

## Task 3: B1 큐레이션 + 검증 + 보고서

**Files:**
- Create: `public/data/words/b1.json`
- Create: `public/data/sentences/b1.json`
- Modify: `public/data/manifest.json`
- Create: `docs/research/2026-05-15-b1-content-curation.md`

- [ ] **Step 1: deep-researcher 호출 — B1 큐레이션**

```
B1 단어 500개 + 문장 200개를 큐레이션해주세요.

자료 (Task 2와 동일 4종):
- NGSL-Spoken v1.2
- Cambridge EVP (B1 라벨)
- Oxford 3000 by CEFR (B1 라벨)
- English Vocabulary Profile (EVP, B1)

스키마: w_b1_NNN / s_b1_NNN (level: "B1")

룰: Task 2와 동일 (출처 답습 0·secondaryKorean·cloze 누적 정합성 등)

cloze 빈칸: A1+A2+B1 누적 단어장 lemma 풀에서

B1 회화 시나리오:
- 의견·이유 (because·since·although·however)
- 미래 계획·예측 (might·could·probably·in case)
- 경험 (have ever / have never / used to / would)
- 사회·일·학교 토픽 (회의·발표·동료·과제·시험)
- 여행 (예약·체크인·관광·문제 해결)
- 추상 명사 (decision·opportunity·experience·problem·solution)
- 감정 + 이유 표현 (I'm worried because... / I'm glad that...)

산출물:
1. public/data/words/b1.json (500개)
2. public/data/sentences/b1.json (200개)
3. docs/research/2026-05-15-b1-content-curation.md
```

- [ ] **Step 2~6: Task 2와 동일 패턴**

- 결과 파일 검증
- 출처 답습 grep 0건 확인
- manifest.json `B1: 500 / 200` 갱신
- cloze 정합성 테스트 PASS (B1까지 누적)
- typecheck/lint/test/build PASS

- [ ] **Step 7: Commit (2개 분리)**

```bash
git add public/data/words/b1.json public/data/sentences/b1.json public/data/manifest.json
git commit -m "[code] Add: B1 콘텐츠 500단어 + 200문장 + manifest 갱신

- 자료 교차: NGSL-Spoken · Cambridge EVP (B1) · Oxford 3000 (B1) · EVP
- 회화 시나리오: 의견·이유·미래 계획·경험·일/학교·여행·추상 명사·감정+이유
- secondaryKorean 다의어 적용
- cloze 정합성 100% (A1+A2+B1 누적)"

git add docs/research/2026-05-15-b1-content-curation.md
git commit -m "[docs] Add: B1 콘텐츠 큐레이션 + 4종 자료 교차 검증 보고서"
```

---

## Task 4: B2 큐레이션 + 검증 + 보고서

**Files:**
- Create: `public/data/words/b2.json`
- Create: `public/data/sentences/b2.json`
- Modify: `public/data/manifest.json`
- Create: `docs/research/2026-05-15-b2-content-curation.md`

- [ ] **Step 1: deep-researcher 호출 — B2 큐레이션**

```
B2 단어 500개 + 문장 200개를 큐레이션해주세요.

자료:
- NGSL-Spoken v1.2 (회화 빈도)
- Oxford 5000 by CEFR (B2 라벨)
- English Vocabulary Profile (EVP, B2)
- (보조) COCA Spoken

스키마: w_b2_NNN / s_b2_NNN (level: "B2")

룰: 동일

cloze 빈칸: A1+A2+B1+B2 누적

B2 회화 시나리오:
- 의견 강화·논의 (in my opinion·I'd argue·from my perspective)
- 추측·확신도 (must be / can't be / might / probably / seem)
- 가정법 (if I were / I wish / I'd rather)
- 격식·비격식 비교 (회의 발언 vs 친구 대화)
- 복합 형용사 (well-known·time-consuming·user-friendly)
- 추상 명사 확장 (perspective·tendency·implication·distinction)
- 일·진로 (career·resume·negotiation·promotion·feedback)
- 사회 토픽 (environment·technology·culture·diversity)

산출물 동일.
```

- [ ] **Step 2~6: Task 2와 동일 패턴**

- [ ] **Step 7: Commit (2개 분리)**

```bash
git add public/data/words/b2.json public/data/sentences/b2.json public/data/manifest.json
git commit -m "[code] Add: B2 콘텐츠 500단어 + 200문장 + manifest 갱신

- 자료 교차: NGSL-Spoken · Oxford 5000 (B2) · EVP (B2) · COCA Spoken
- 회화 시나리오: 의견 강화·추측·가정법·격식체·복합 형용사·추상 명사·일/진로·사회 토픽
- cloze 정합성 100% (A1~B2 누적)"

git add docs/research/2026-05-15-b2-content-curation.md
git commit -m "[docs] Add: B2 콘텐츠 큐레이션 + 4종 자료 교차 검증 보고서"
```

---

## Task 5: C1 큐레이션 + 검증 + 보고서

**Files:**
- Create: `public/data/words/c1.json`
- Create: `public/data/sentences/c1.json`
- Modify: `public/data/manifest.json`
- Create: `docs/research/2026-05-15-c1-content-curation.md`

- [ ] **Step 1: deep-researcher 호출 — C1 큐레이션**

```
C1 단어 400개 + 문장 150개를 큐레이션해주세요.

자료:
- Oxford 5000 by CEFR (C1 라벨)
- English Vocabulary Profile (EVP, C1)
- NGSL-Spoken 상위 빈도 (회화 코어 보존)
- (보조) COCA Spoken / British Council 비즈니스 자료

스키마: w_c1_NNN / s_c1_NNN (level: "C1")

룰: 동일

cloze 빈칸: A1~C1 누적

C1 회화 시나리오 (격식·전문성):
- 격식 표현 (I would like to suggest / It would be advisable / I'm inclined to)
- 완곡어법 (somewhat·rather·perhaps·to some extent)
- 토론·발표 (overall·on balance·furthermore·moreover·nevertheless)
- 비즈니스 회화 (strategy·initiative·proposal·rationale·feasibility)
- 비유·관용 표현 (jump to conclusions·on the same page·a level playing field)
- 추상 동사 (acknowledge·undertake·implement·constitute·comprise)
- 학술/문화 (analyze·perspective·implication·controversy)

C1은 회화에서 *반드시 필요하지 않지만 들어두면 좋은* 격식·전문 어휘. 일상 회화 코어보다는 비즈니스·격식 상황 대비 위주.

산출물 동일.
```

- [ ] **Step 2~6: Task 2와 동일 패턴**

- [ ] **Step 7: Commit (2개 분리)**

```bash
git add public/data/words/c1.json public/data/sentences/c1.json public/data/manifest.json
git commit -m "[code] Add: C1 콘텐츠 400단어 + 150문장 + manifest 갱신

- 자료 교차: Oxford 5000 (C1) · EVP (C1) · NGSL-Spoken 상위 빈도 · COCA Spoken
- 회화 시나리오: 격식 표현·완곡어법·토론·비즈니스·비유 관용·추상 동사·학술
- cloze 정합성 100% (A1~C1 누적)"

git add docs/research/2026-05-15-c1-content-curation.md
git commit -m "[docs] Add: C1 콘텐츠 큐레이션 + 4종 자료 교차 검증 보고서"
```

---

## Task 6: C2 큐레이션 + 검증 + 보고서

**Files:**
- Create: `public/data/words/c2.json`
- Create: `public/data/sentences/c2.json`
- Modify: `public/data/manifest.json`
- Create: `docs/research/2026-05-15-c2-content-curation.md`

- [ ] **Step 1: deep-researcher 호출 — C2 큐레이션**

```
C2 단어 400개 + 문장 150개를 큐레이션해주세요.

자료:
- Oxford 5000 by CEFR (C2 라벨)
- English Vocabulary Profile (EVP, C2)
- 관용 표현 자료 (Cambridge Idioms / Oxford Idioms)

스키마: w_c2_NNN / s_c2_NNN (level: "C2")

룰: 동일

cloze 빈칸: A1~C2 누적 (전체 단어장)

C2 회화 시나리오:
- 고급 관용 표현 (spill the beans·hit the nail on the head·a piece of cake·once in a blue moon)
- 미묘한 뉘앙스 형용사 (meticulous·subtle·robust·intricate·elusive·nuanced)
- 고급 동사 (corroborate·exacerbate·alleviate·oscillate·deteriorate·culminate)
- 격식 부사 (henceforth·notwithstanding·albeit·thereby·conversely·subsequently)
- 강조·뉘앙스 (utterly·remarkably·distinctly·invariably·decidedly)
- 학술·전문 (paradigm·hypothesis·correlate·extrapolate·infer)
- 문학적·은유 표현

C2는 *원어민 수준* 어휘. 실제 회화에서 거의 안 쓰이지만 *읽기·듣기 이해*용으로 좋음. 학습 가치 = 어휘 인식 확장.

산출물 동일.
```

- [ ] **Step 2~6: Task 2와 동일 패턴**

- [ ] **Step 7: Commit (2개 분리)**

```bash
git add public/data/words/c2.json public/data/sentences/c2.json public/data/manifest.json
git commit -m "[code] Add: C2 콘텐츠 400단어 + 150문장 + manifest 갱신

- 자료 교차: Oxford 5000 (C2) · EVP (C2) · 관용 표현 자료
- 회화 시나리오: 고급 관용 표현·미묘한 뉘앙스·고급 동사·격식 부사·강조·학술·문학
- cloze 정합성 100% (A1~C2 전체 누적)"

git add docs/research/2026-05-15-c2-content-curation.md
git commit -m "[docs] Add: C2 콘텐츠 큐레이션 + 4종 자료 교차 검증 보고서"
```

---

## Task 7: 테스트 fixture sync + 종합 검증

**Files:**
- Modify (필요 시): `src/__tests__/router-helpers.tsx`

- [ ] **Step 1: 테스트 fixture 카운트 확인**

```bash
grep -n "MANIFEST_A1_ONLY\|A1.*649\|A1.*250" src/__tests__/router-helpers.tsx
```

- [ ] **Step 2: fixture 갱신 (필요 시)**

`MANIFEST_A1_ONLY` 또는 카운트가 manifest와 어긋나면 `MANIFEST_FULL`로 추가 또는 기존 sync:

```ts
export const MANIFEST_FULL = {
  buildAt: '2026-05-15T00:00:00Z',
  schemaVersion: 1,
  counts: {
    words: { A1: 649, A2: 500, B1: 500, B2: 500, C1: 400, C2: 400 },
    sentences: { A1: 250, A2: 200, B1: 200, B2: 200, C1: 150, C2: 150 },
  },
};
```

기존 fixture는 영향 받는 테스트 케이스에만 적용. *전수 sync 불필요*.

- [ ] **Step 3: 종합 검증**

```bash
pnpm typecheck && pnpm lint && pnpm test 2>&1 | tail -10 && pnpm build 2>&1 | tail -15
```

Expected: 모두 PASS.

- [ ] **Step 4: 로컬 preview에서 라우트 진입 확인**

```bash
pnpm build && pnpm preview &
# 브라우저에서 http://localhost:4173 접속
# A2·B1·B2·C1·C2 각 라우트 진입 + 단어장 표시 + 플래시카드 모드 정상 동작 확인
# 수동 검증 후 preview 서버 종료
```

- [ ] **Step 5: Commit (필요 시)**

```bash
git add src/__tests__/router-helpers.tsx
git commit -m "[code] Modify: 테스트 fixture 카운트 5단계 sync (A1~C2)"
```

(만약 fixture 수정 불필요면 skip)

---

## Task 8: README · CLAUDE.md 갱신

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: README 콘텐츠 카운트 갱신**

`README.md`의 "CEFR 6단계 (A1~C2) — A1 시드 649 단어 / 250 문장 완료" 라인을 다음으로:

```markdown
| 레벨 | CEFR 6단계 (A1~C2) — 전 레벨 콘텐츠 완료 (총 2,949 단어 / 1,150 문장) |
```

- [ ] **Step 2: README 업데이트 로그 추가**

```markdown
| 2026-05-15 | **Phase 7 A2~C2 콘텐츠 확장 완료**: 신규 2,300단어 + 900문장 (A2/B1/B2 각 500/200, C1/C2 각 400/150). 4종 자료(NGSL-Spoken·Cambridge EVP·Oxford 3000/5000·EVP) 교차 검증 + COCA Spoken 보조. cloze 정합성 자동 검증 유틸 추가(누적 lemma 풀, 활용형·기능어·불규칙 화이트리스트). 5개 레벨 검증 보고서 작성 |
```

- [ ] **Step 3: CLAUDE.md Phase 진행 표 갱신**

```markdown
| 6 | PWA + Vercel 배포 (vite-plugin-pwa · 아이콘 · vercel.json · 사용자 Vercel 가입) | ✅ 완료 (PR #10) |
| 7 | A2~C2 콘텐츠 확장 (신규 2,300단어 + 900문장 · cloze 정합성 자동 검증) | ✅ 완료 |
| 8 | P2 보강 (install prompt · Offline 배지 · 콘텐츠 갱신 알림 · 다크모드 · streak 등) | — |
```

- [ ] **Step 4: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "[docs] Modify: README · CLAUDE.md — Phase 7 A2~C2 콘텐츠 완료 반영

- 전 레벨 콘텐츠 완료 표기 (2,949 단어 / 1,150 문장)
- 업데이트 로그 2026-05-15
- Phase 진행 표 갱신 (Phase 6 PR #10 · Phase 7 ✅ · Phase 8 P2)"
```

---

## Task 9: 사용자 보고 + push

**Files:** (없음 — 보고 후 push)

- [ ] **Step 1: commit history 확인**

```bash
git log main..HEAD --oneline
```

Expected: 13개 내외 commit (Task 1~8).

- [ ] **Step 2: 변경 통계**

```bash
git diff main --stat | tail -20
```

- [ ] **Step 3: 사용자 보고 (메모리 룰 형식)**

```
## Phase 7 A2~C2 콘텐츠 확장 작업 완료 보고

### 변경 파일
- 추가: public/data/words/{a2,b1,b2,c1,c2}.json (5개, 총 2,300단어)
- 추가: public/data/sentences/{a2,b1,b2,c1,c2}.json (5개, 총 900문장)
- 수정: public/data/manifest.json (counts 5단계 갱신)
- 추가: src/content/__tests__/cloze-integrity-utils.ts · cloze-integrity.test.ts
- 추가: docs/research/2026-05-15-{a2,b1,b2,c1,c2}-content-curation.md (5개 보고서)
- 수정: README.md · CLAUDE.md · (필요 시) router-helpers.tsx

### 핵심 결정·결과
- 신규 2,300단어 + 900문장
- 4종 자료 교차 검증 (NGSL-Spoken · Cambridge EVP · Oxford 3000/5000 · EVP)
- cloze 정합성 100% (5개 레벨, 누적 lemma 풀 기반 자동 vitest test)
- 출처 답습 흔적 0 (grep 검증)
- secondaryKorean 다의어 적용

### 검증 결과
- pnpm typecheck PASS
- pnpm lint PASS
- pnpm test PASS (cloze 정합성 포함)
- pnpm build PASS
- pnpm preview 라우트 진입 OK

### 미해결·후속 항목
- (사용자) PR 생성 + diff 검토 + 머지
- (사용자) 머지 후 Vercel 자동 재배포 → 도메인에서 A2~C2 정상 표시 확인
- Phase 8 (P2 보강) 진입 대기

### 다음 액션 제안
- git push -u origin feature/phase-7-content-a2-c2
- PR 본문 초안 (별도 제공)

→ 사용자 승인 대기
```

- [ ] **Step 4: 사용자 OK 받은 후 push**

```bash
git push -u origin feature/phase-7-content-a2-c2
```

- [ ] **Step 5: PR 본문 초안 제공**

```
## Summary
- A2~C2 콘텐츠 확장 — 신규 2,300단어 + 900문장
- 4종 자료(NGSL-Spoken · Cambridge EVP · Oxford 3000/5000 · EVP) 교차 검증
- cloze 정합성 자동 검증 유틸 추가 (누적 lemma 풀)
- 5개 레벨 검증 보고서

## Test plan
- [x] pnpm typecheck · lint · test · build PASS
- [x] cloze 정합성 100% (자동 테스트)
- [x] 출처 답습 grep 0건
- [x] pnpm preview 라우트 진입 확인
- [ ] (머지 후) Vercel production 자동 재배포 → A2~C2 라우트 동작 확인

## 사용자 액션
- 머지 후 Vercel이 자동 재배포 → 1~2분 후 도메인 갱신
```

---

## Self-Review (작성 후 점검)

- ✅ **Spec coverage**: spec §1~§11 모두 task로 매핑
  - §1 수량 → Task 2~6
  - §2 자료 → 각 Task 1~6 prompt에 명시
  - §3 룰 → 각 Task 출처 답습 grep + secondaryKorean·cloze 정합성
  - §4 스키마 → Task 1 (cloze utils) + 각 Task의 deep-researcher prompt
  - §5 PR 단위 → Task 0~9 한 PR 안
  - §6 코드 영향 → Task 1 (cloze test) + Task 7 (fixture) + Task 8 (README/CLAUDE)
  - §7 검증 → 각 Task Step + Task 7 (종합)
  - §8 보고서 → 각 Task Step (5개)
  - §9 DoD → Task 9 보고
  - §10 후속 → Task 8 (CLAUDE 갱신)
  - §11 작업 흐름 → 전체 Task 순서
- ✅ **Placeholder 없음**: 모든 step에 실제 코드/명령/prompt inline
- ✅ **Type 일관성**: WordEntry/SentenceEntry/Manifest 스키마 일관, ID 패턴 일관
- ⚠ **모호성 1건**: deep-researcher가 *실제로 500단어를 한 번에 큐레이션 가능한가*는 출력 토큰 한계 의존. 만약 응답이 끊기면 *부분 출력 + 재호출*로 보강 필요. 각 Task Step 1에 명시.
- ⚠ **현실성 1건**: 한 세션에 다 못 끝남. Task 2 (A2) 완료 후 사용자 보고 + 다음 세션에서 Task 3~ 진행 가능하도록 진행 상황 commit으로 보존.
