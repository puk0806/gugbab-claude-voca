# gugbab-voca

영어 회화 단어·문장을 CEFR 6단계로 학습하는 1인용 웹/PWA 앱.

본인이 직접 큐레이션한 단어·문장을 SRS(간격 반복) 기반 플래시카드로 효율 학습하기 위한 미니멀 학습 도구. 음성평가·실시간 대화·로그인 없이 학습 핵심만 남긴 구성.

---

## 핵심 결정

| 항목 | 결정 |
|---|---|
| 플랫폼 | 웹/PWA만 (모바일 네이티브 X) |
| 백엔드 | 없음. 정적 호스팅 (Vercel/Netlify) |
| 인증 | 없음. 단일 디바이스 로컬 사용 |
| 콘텐츠 추가 | Claude로 정적 JSON 갱신 |
| 레벨 | CEFR 6단계 (A1~C2) |
| 인터랙션 | 플래시카드 뒤집기 + 자가체크 |
| SRS | 도입 (알고리즘 미결: SM-2 vs FSRS) |
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

- 정적 호스팅 (Vercel 또는 Netlify) — `devops-engineer` 호출
- PWA 매니페스트 + Service Worker (`vite-pwa-service-worker` 스킬 참조)

### 콘텐츠 갱신

- Claude에 CEFR 가이드 기반 단어·문장 JSON 생성 요청
- `public/content/{level}.json` 갱신 후 빌드·배포

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
