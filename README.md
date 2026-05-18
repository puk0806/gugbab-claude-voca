# gugbab-voca

영어 회화 단어·문장을 CEFR 6단계로 학습하는 1인용 웹/PWA 앱.

본인이 직접 큐레이션한 단어·문장을 SRS(간격 반복) 기반 플래시카드로 효율 학습하기 위한 미니멀 학습 도구. 음성평가·실시간 대화·로그인 없이 학습 핵심만 남긴 구성.

---

## 사전 조건

- **Node.js**: `>=20.19` (Vite 7 권장). 20.19 미만 사용 시 빌드 시 경고가 출력되며, 향후 Vite 8 진입 시 빌드 실패 가능
  - 업그레이드: `nvm install 20.19 && nvm use 20.19` 또는 `brew upgrade node`
- **pnpm**: `9.15.0` (`packageManager` 필드 기준)

---

## 핵심 결정

| 항목 | 결정 |
|---|---|
| 플랫폼 | 웹/PWA만 (모바일 네이티브 X) |
| 백엔드 | 없음. 정적 호스팅 (Vercel/Netlify) |
| 인증 | 없음. 단일 디바이스 로컬 사용 |
| 콘텐츠 추가 | Claude 큐레이션 후 정적 JSON 갱신 (단어 + 문장 + manifest) |
| 다의어 표시 | `secondaryKorean` 옵셔널 (회화 빈도 상위 2번째 의미) |
| 레벨 | CEFR 6단계 (A1~C2) — 전 레벨 완료 (총 2,987 단어 / 1,150 문장) |
| 인터랙션 | 플래시카드 뒤집기 + 자가체크 |
| SRS | SM-2 직접 구현 |
| 진도 저장 | IndexedDB (Dexie.js) |
| TTS | Web Speech API (`speechSynthesis`) |
| UI | `@gugbab-ui/styled-mui` (별도 npm 패키지) |

---

## 폴더 구조

```
.
├── CLAUDE.md                  # 프로젝트 지침
├── README.md
├── docs/
│   ├── prd/                   # 제품 명세
│   │   ├── gugbab-voca.md            # PRD 본문
│   │   └── gugbab-voca-skills.md     # 신규 스킬 명세 (외부 작업용)
│   ├── agents/                # 에이전트 보조 문서
│   └── skills/                # 스킬 verification 문서
└── .claude/
    ├── rules/                 # 코딩·작업 규칙
    ├── agents/                # 27개 에이전트
    └── skills/                # 48개 스킬
```

---

## 에이전트 (27개)

| 카테고리 | 에이전트 |
|---|---|
| `domain` (5) | `product-planner`, `ui-ux-designer`, `api-spec-designer`, `business-domain-analyst`, `codebase-domain-analyst` |
| `frontend` (2) | `frontend-architect`, `frontend-developer` |
| `backend` (1) | `build-error-resolver` (프론트 빌드 에러 처리 겸용) |
| `devops` (1) | `devops-engineer` |
| `meta` (6) | `agent-creator`, `skill-creator`, `skill-tester`, `freshness-auditor`, `planner`, `claude-code-guide` |
| `research` (6) | `deep-researcher`, `web-searcher`, `competitor-analyst`, `data-analyst`, `socratic-interviewer`, `research-reviewer` |
| `validation` (3) | `qa-engineer`, `fact-checker`, `source-validator` |

---

## 스킬 (48개)

| 카테고리 | 개수 | 주요 항목 |
|---|---|---|
| `frontend` | 43 | React/TypeScript/Vite 중심. 본 프로젝트 신규 도입: `web-speech-api-tts`, `srs-spaced-repetition`, `indexeddb-dexie` |
| `devops` | 3 | `docker-deployment`, `github-actions`, `github-actions-visual-regression` |
| `meta` | 2 | `continuous-learning`, `ralph-loop` |

frontend 주요 스킬 (gugbab-voca 직접 사용 후보):

- 빌드/배포: `vite-pwa-service-worker`, `vite-advanced-splitting`, `bundling-compiler`
- 학습 핵심: `web-speech-api-tts`, `srs-spaced-repetition`, `indexeddb-dexie`
- UI: `mui-v5`, `design-token-scss`, `accessibility`, `animation`
- 상태/데이터: `state-management`, `error-handling`, `api-integration`
- 테스트: `e2e-testing`, `testing`, `storybook-visual-testing`

---

## 워크플로우

### 개발

1. PRD 확인: `docs/prd/gugbab-voca.md`
2. 미결 사항 결정 (SRS 알고리즘, 콘텐츠 시드 정책)
3. `frontend-architect` 호출 → 아키텍처 설계
4. `frontend-developer` 호출 → 구현
5. `qa-engineer` → E2E 테스트

### 배포

- 정적 호스팅 (Vercel) — `vercel.json`으로 SPA fallback + 캐시 헤더 설정
- PWA: `vite-plugin-pwa` 기반 manifest + Service Worker (autoUpdate 전략)
- 사용자 1회 액션: Vercel 가입 + GitHub repo import (가이드: `docs/research/2026-05-15-vercel-deployment-guide.md`)
- 이후 `main` push → 자동 production 재배포, feature 브랜치 push → 자동 preview 도메인

### 콘텐츠 갱신

- Claude에 CEFR 가이드 + 회화 빈도 4종 자료(NGSL-Spoken·Cambridge A1 Movers·Oxford 3000 A1·EVP) 기반 단어·문장 생성 요청
- 산출물 3종 동시 갱신:
  - `public/data/words/{cefr}.json` — `WordEntry` (id·level·english·korean·secondaryKorean?·partOfSpeech·tags?)
  - `public/data/sentences/{cefr}.json` — `SentenceEntry` (cloze 정답은 단어장 어휘로 정합)
  - `public/data/manifest.json` — `counts.words[cefr]` / `counts.sentences[cefr]` 갱신
- ID 불변 원칙: 제거된 단어 ID는 영구 결번, 신규는 최대 ID + 1 부여 (SRS 진도 데이터 무결성)
- 큐레이션 가이드 + 검증 보고서: `docs/research/2026-05-12-a1-content-curation.md`, `docs/research/2026-05-13-a1-vocabulary-validation.md`

---

## 규칙 참조

| 상황 | 파일 |
|---|---|
| Git 커밋 컨벤션 | `.claude/rules/git.md` |
| 외부 정보 검증 | `.claude/rules/info-verification.md` |
| 에이전트 설계 | `.claude/rules/agent-design.md` |
| 스킬·에이전트 생성 절차 | `.claude/rules/creation-workflow.md` |
| README 업데이트 | `.claude/rules/readme-update.md` |
| 검증 정책 | `.claude/rules/verification-policy.md` |
| TypeScript/React | `.claude/rules/typescript.md` |

---

## 업데이트 로그

| 날짜 | 변경 내용 요약 |
|---|---|
| 2026-05-08 | gugbab-voca 정렬 정리: 스킬 74개·에이전트 14개·규칙 2개(rust/java) 제거. 신규 스킬 3종(`web-speech-api-tts`/`srs-spaced-repetition`/`indexeddb-dexie`) 도입. README 신규 작성 |
| 2026-05-13 | Phase 5-1 콘텐츠 확장 완료: A1 단어 80→648 / 문장 40→150. `WordEntry.secondaryKorean` 다의어 스키마 도입(8개 단어). deep-researcher 4종 자료(NGSL-Spoken·Cambridge A1 Movers·Oxford 3000 A1·EVP) 교차 검증 후 EVP B1 단어 3개 제거 + 외국 회화 핵심 갭(공항·호텔·돈·일상동사·connector) 25개 보강. 문장 cloze 정합성 100% 달성. `docs/research/` 큐레이션·검증 보고서 2종 추가 |
| 2026-05-14 | Phase 5-2 단어장 학습 대시보드 완료: 학습 점수 정렬·6단계 chip 필터·IntersectionObserver 무한 스크롤·react-virtuoso 가상화. A1 formulaic pattern 100문장 보강 (단어 649 / 문장 250) |
| 2026-05-15 | **Phase 6 PWA + Vercel 배포 완료**: vite-plugin-pwa(Workbox autoUpdate) 도입, manifest·SW·아이콘 자산 5종(Soft 3D Gummi 채택), index.html 메타 보강(favicon·apple-touch-icon·theme-color·OG), vercel.json(SPA fallback + 캐시 헤더). 사용자 Vercel 가입·repo import → 자동 배포 흐름. SW 등록 helper(pwa.ts) + 단위 테스트 + E2E 메타/manifest 검증 |
| 2026-05-16 | **Phase 7 A2~C2 콘텐츠 확장 완료**: 신규 2,338단어 + 900문장 (A2 518/200, B1 500/200, B2 502/200, C1 407/150, C2 411/150). 4종 자료(NGSL-Spoken·Cambridge EVP·Oxford 3000/5000·EVP) 교차 검증. cloze 정합성 자동 검증 vitest test 도입(누적 lemma 풀, 활용형·기능어·불규칙 화이트리스트 — 6/6 PASS). 5개 레벨 검증 보고서. 출처 답습 흔적 0건 |
| 2026-05-16 | **Phase 8-1 헤더 install prompt 버튼**: `useInstallPrompt` 훅(beforeinstallprompt + display-mode standalone + iOS Safari 감지). 환경별 분기 — Android Chrome·Desktop Chrome/Edge는 native install 다이얼로그, iOS Safari는 "공유 → 홈 화면에 추가" 4단계 안내 모달, 이미 설치된 standalone 모드는 자동 숨김. ESC·backdrop 클릭 모달 닫기. 단위 테스트 15/15 PASS (iOS·Android·Desktop·standalone·미지원 시나리오 모두) |
