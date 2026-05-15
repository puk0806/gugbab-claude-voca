# Phase 7 · A2~C2 콘텐츠 확장 — Design Spec

> **작성일**: 2026-05-15
> **브랜치**: `feature/phase-7-content-a2-c2`
> **선행 Phase**: Phase 6 (PWA + Vercel 배포) 완료
> **참조**: Phase 5-1 A1 콘텐츠 확장 보고서 (`docs/research/2026-05-12-a1-content-curation.md`, `2026-05-13-a1-vocabulary-validation.md`)

---

## 0. Goal

A1만 있는 CEFR 콘텐츠를 **A2~C2 5단계로 확장**하여 모든 레벨에서 SRS 학습 가능 상태에 진입한다. 회화 실용성을 우선하되 격식체·관용 표현까지 포괄.

---

## 1. Scope · 수량

| Level | 단어 | 문장 |
|---|---:|---:|
| A1 (기존) | 649 | 250 |
| **A2** | **500** | **200** |
| **B1** | **500** | **200** |
| **B2** | **500** | **200** |
| **C1** | **400** | **150** |
| **C2** | **400** | **150** |
| **신규 합계** | **2,300** | **900** |
| **전체 합계** | **2,949** | **1,150** |

---

## 2. 자료 (A1 작업과 동일 4종 + 보조)

| 자료 | URL | 활용 |
|---|---|---|
| **NGSL-Spoken v1.2** (721 단어, 비대본 회화 90% 커버) | newgeneralservicelist.org | 회화 빈도 코어 |
| **Cambridge YLE Movers/Flyers (A1-A2) + EVP** | englishprofile.org | CEFR 레벨 라벨 |
| **Oxford 3000 by CEFR level** | oxfordlearnersdictionaries.com | 레벨 라벨 교차 (A1~B2) |
| **Oxford 5000 by CEFR level** | 동일 | B2~C1 추가 어휘 |
| **English Vocabulary Profile (EVP)** | englishprofile.org | A1~C2 전 레벨 라벨 + 의심 단어 정밀 검증 |
| (보조) **COCA Spoken Top 5000** | wordfrequency.info | 회화 빈도 보조 |
| (보조) **British Council LearnEnglish** | learnenglish.britishcouncil.org | 회화 시나리오 |

**검증 방식**: deep-researcher 위임 (4종 교차) — Phase 5-1과 동일 방법론.

---

## 3. 콘텐츠 룰

| 룰 | 적용 |
|---|---|
| **출처 답습 흔적 0** | `feedback_content_origin_concealment` 룰. 책 단원·인물 이름·번역 답습 금지. `Unit·DAY·쿨하게·간단하게·뜬금없이` 등 키워드 grep 0건 검증 |
| **학술·정부 자료만 출처 표기** | NGSL·Cambridge·Oxford·EVP·COCA·British Council·US State Department. *책·강좌·블로그·인물* 출처 표기 X |
| **회화 실용성 우선** | 격식체보다 일상 회화·실제 발화 빈도 상위. C1·C2도 일상 회화에서 쓰이는 격식·관용 표현 위주 (학술 어휘 X) |
| **cloze 정합성 100%** | 문장의 cloze 빈칸 단어는 *해당 레벨 단어장* 또는 *하위 레벨 단어장*에 lemma 형태로 존재해야 함 (활용형·기능어·불규칙 허용) |
| **secondaryKorean (다의어)** | A1과 동일 스키마. 회화 빈도 상위 2번째 의미 추가 (예: B1 `mean` → "의미하다" + "못된", B2 `run` → "달리다" + "운영하다") |
| **태그(tags)** | A1과 동일 자유 패턴 (greeting·family·food·routine·question 등). 신규 시나리오 태그 (예: airport·hotel·meeting·email) 자유 추가 |
| **partOfSpeech** | A1과 동일 — noun·verb·adjective·adverb·pronoun·preposition·conjunction·interjection·determiner·auxiliary |

---

## 4. 스키마 (A1과 동일, 변경 없음)

### WordEntry
```ts
{
  id: `w_${cefr}_${seq}`,          // 예: "w_a2_001"
  level: 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
  english: string,                  // lemma
  korean: string,                   // 회화 빈도 1순위 의미
  secondaryKorean?: string,         // 다의어 회화 빈도 2순위 의미 (옵셔널)
  partOfSpeech: PartOfSpeech,
  tags?: string[],                  // 자유 태그
}
```

### SentenceEntry
```ts
{
  id: `s_${cefr}_${seq}`,           // 예: "s_a2_001"
  level: 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
  english: string,                  // "I want to {go} home." (cloze 빈칸은 {} 표기)
  korean: string,
  cloze: string[],                  // 빈칸 정답 단어들 (해당 레벨 또는 하위 레벨 단어장 내)
  tags?: string[],
}
```

### ID 패턴
- 단어: `w_a2_001` ~ `w_a2_NNN`, `w_b1_001` ~, `w_b2_001` ~, `w_c1_001` ~, `w_c2_001` ~
- 문장: `s_a2_001` ~, `s_b1_001` ~, ...
- **ID 불변 원칙** — 추후 큐레이션 변경 시 제거 단어 ID는 영구 결번, 신규는 max(id) + 1

---

## 5. PR 단위

- **1 PR**: `feature/phase-7-content-a2-c2`
- **단, commit은 layer별 분리** — A1 작업 패턴 동일 (`feedback_workflow_rules` + `git.md` 룰)
- 모든 commit 완료 + 종합 검증 PASS 후 push 직전 사용자 보고

### 예상 commit 구성 (~13개)

| 순서 | 카테고리 | 내용 |
|---:|---|---|
| 1 | `[docs]` | 큐레이션 가이드 + 검증 방법론 (Phase 7 공통, deep-researcher 결과 포함) |
| 2 | `[code]` | A2 단어 500 + 문장 200 + manifest counts |
| 3 | `[docs]` | A2 검증 보고서 |
| 4 | `[code]` | B1 단어 500 + 문장 200 + manifest |
| 5 | `[docs]` | B1 검증 보고서 |
| 6 | `[code]` | B2 단어 500 + 문장 200 + manifest |
| 7 | `[docs]` | B2 검증 보고서 |
| 8 | `[code]` | C1 단어 400 + 문장 150 + manifest |
| 9 | `[docs]` | C1 검증 보고서 |
| 10 | `[code]` | C2 단어 400 + 문장 150 + manifest |
| 11 | `[docs]` | C2 검증 보고서 |
| 12 | `[code]` | 테스트 fixture 콘텐츠 카운트 sync (필요 시) |
| 13 | `[docs]` | README · CLAUDE.md 갱신 + 메모리 갱신 안내 |

---

## 6. 코드 영향

| 파일 | 변경 |
|---|---|
| `public/data/words/{a2,b1,b2,c1,c2}.json` | Create (5개, 빈 배열에서 시작) |
| `public/data/sentences/{a2,b1,b2,c1,c2}.json` | Create (5개) |
| `public/data/manifest.json` | Modify (counts 5개 레벨 갱신) |
| `src/__tests__/router-helpers.tsx` | Modify (MANIFEST_A1_ONLY → 다른 레벨 fixture 추가, 필요 시) |
| `e2e/visual/__screenshots__/*.png` | **변경 없음** — 라우트 UI 변화 0, 카운트 표시만 변경되며 home 화면 등 베이스라인 영향 없음 |
| `README.md` | Modify (콘텐츠 카운트 + 업데이트 로그) |
| `CLAUDE.md` | Modify (Phase 진행 표 + 콘텐츠 표) |

---

## 7. 검증 방법

### 큐레이션 단계 (각 레벨마다 반복)
1. deep-researcher 호출 → 해당 레벨 회화 빈도 + CEFR 라벨 4종 자료 교차
2. 의심 단어 보고서 (4/4·3/4·2/4·1/4·0/4 매칭 분포)
3. 의심 단어 교체 또는 유지 결정
4. 외국 회화 핵심 갭 발견 → 보강

### cloze 정합성 검증 (각 레벨마다)
- 스크립트 또는 grep으로 각 문장의 cloze 단어가 *해당 레벨 단어장* 또는 *하위 레벨 단어장*의 lemma·활용형에 존재 확인
- A2 cloze는 A1+A2 단어장 lemma 풀에서 선택 가능
- B1 cloze는 A1+A2+B1 lemma 풀
- ... (누적)
- **정답률 100%**

### 코드·테스트 검증
- `pnpm typecheck` PASS
- `pnpm lint` PASS
- `pnpm test` PASS (콘텐츠 로더가 신규 JSON 파싱 정상)
- `pnpm build` PASS (manifest 카운트와 실 콘텐츠 일치)
- 로컬 `pnpm preview` 또는 `pnpm dev`에서 각 레벨 라우트 진입 + 단어장·플래시카드 정상 동작 확인

### 출처 답습 검증 (수동 + grep)
- `grep -rE "Unit \|DAY 0\|쿨하게\|간단하게\|뜬금없이|딱 한 단어" public/data/ docs/research/2026-05-1*-*-content-*.md` → 0건
- 보고서 검토 시 *책·강좌·인물 이름 출처* 없음 확인

---

## 8. 보고서 (각 레벨별)

`docs/research/2026-05-1X-{level}-content-curation.md` 또는 `2026-05-1X-{level}-content-validation.md` 형식:

각 보고서 포함 항목:
- 검증 목적 + 방법론
- 4종 자료 교차 결과 (4/4·3/4·2/4·1/4·0/4 분포)
- 의심 단어 + 교체 결정 근거
- 외국 회화 핵심 갭 + 보강 단어
- 최종 단어/문장 카운트
- 시간 제약·한계 명시 (Phase 5-1 패턴)

---

## 9. Definition of Done

### 콘텐츠
- [ ] A2 단어 500 + 문장 200 JSON 작성
- [ ] B1 단어 500 + 문장 200 JSON 작성
- [ ] B2 단어 500 + 문장 200 JSON 작성
- [ ] C1 단어 400 + 문장 150 JSON 작성
- [ ] C2 단어 400 + 문장 150 JSON 작성
- [ ] cloze 정합성 100% (5개 레벨 모두)
- [ ] secondaryKorean 다의어 적용 (각 레벨 8개 내외)
- [ ] manifest.json counts 정확

### 보고서
- [ ] 5개 레벨 검증 보고서 작성
- [ ] 출처 답습 흔적 0 (grep 검증)

### 코드·테스트
- [ ] `pnpm typecheck` · `lint` · `test` · `build` 모두 PASS
- [ ] 테스트 fixture sync (필요 시)
- [ ] 로컬 `pnpm preview`에서 A2~C2 라우트 진입 + UI 동작 확인

### 문서·메모리
- [ ] README · CLAUDE.md 갱신
- [ ] 메모리 `project_gugbab_voca_progress.md` 갱신 (Phase 7 완료 · 콘텐츠 표 5단계)

### Git
- [ ] 13개 commit 분리 완료
- [ ] push 직전 사용자 종합 보고

---

## 10. 후속 Phase

| Phase | 내용 | 트리거 |
|---|---|---|
| 8 | P2 보강 (install prompt · Offline 배지 · 다크모드 · streak · 통계 · 콘텐츠 갱신 알림) | Phase 7 완료 + 사용자 사용 안정화 후 |
| 9 | 콘텐츠 audit·수정 (사용 후 피드백 기반 · 새로운 회화 갭 보강) | 실제 사용 후 |

---

## 11. 작업 흐름 (예상)

1. 본 spec commit (1 commit) — feature 브랜치 생성 + spec 박기
2. deep-researcher 호출 1회 (A2 큐레이션)
3. A2 단어·문장 JSON 작성 + cloze 정합성 검증 + manifest 갱신 → 2 commit ([code] + [docs] 보고서)
4. 같은 패턴으로 B1·B2·C1·C2 반복 → 8 commit
5. 테스트 fixture sync + README·CLAUDE 갱신 → 2 commit
6. 종합 검증 (typecheck/lint/test/build/preview)
7. 사용자 보고 → push

**예상 작업 시간**: 한 세션에 불가능. 2~3 세션 분할. 매 세션 중간에 commit으로 진행 상황 보존. 마지막 세션에서 push.

**중단 시 복구**: 메모리에 *현재 진행 레벨* 박아 다음 세션에서 이어서 진행.
