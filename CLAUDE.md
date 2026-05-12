# CLAUDE.md — gugbab-voca

영어 회화 단어·문장을 CEFR 6단계로 학습하는 1인용 PWA. SRS(SM-2) 기반 플래시카드 + Web Speech TTS, 백엔드·인증 없이 IndexedDB(Dexie)로 진도 영속화.

> 자세한 PRD: [`docs/prd/gugbab-voca.md`](./docs/prd/gugbab-voca.md)

---

## 세션 시작 체크리스트

새 세션은 다음 순서로 컨텍스트를 잡는다.

1. **메모리 인덱스** 확인 — `~/.claude/projects/-Users-lf-Desktop-gugbab-workspace-02-gugbab-claude-voca/memory/MEMORY.md`
2. **진행 상태** — 메모리의 `project_gugbab_voca_progress.md`
3. **현재 브랜치·PR 상태** — `git status` / `gh pr list`
4. **현재 Phase** — 아래 표 참조

---

## 진행 단계

| Phase | 내용 | 상태 |
|---|---|---|
| 0 | 미결 결정 (SRS·콘텐츠 시드) | ✅ 완료 — SM-2 / Claude 생성 시드 |
| 1 | 아키텍처 설계 (`frontend-architect`) | ✅ 완료 — `docs/architecture/gugbab-voca-architecture.md` |
| 2 | 스캐폴딩 + 순수 로직 (Vite·Biome·Vitest / SRS·DB·콘텐츠 로더·큐) | ✅ 완료 (PR #4·#5) |
| 3 | 시각 회귀(VR) 인프라 — Playwright + GH Actions 라벨 기반 베이스라인 승인 | ⏳ 진행 중 |
| 4 | 핵심 UI (라우팅·4모드 학습·단어장) + A1 콘텐츠 시드 — VR 첫 베이스라인 등록 | — |
| 5 | 보강 UI (세션 종료 요약·통계·설정·P1) | — |
| 6 | PWA + Vercel 배포 | — |
| 7 | P2 보강 (export/import·다크모드 등) | — |

Phase 진입·완료 시 이 표를 업데이트한다.

---

## 핵심 산출물·경로

| 항목 | 경로 |
|---|---|
| PRD | [`docs/prd/gugbab-voca.md`](./docs/prd/gugbab-voca.md) |
| 스킬 명세 | [`docs/prd/gugbab-voca-skills.md`](./docs/prd/gugbab-voca-skills.md) |
| 에이전트·스킬·훅 카탈로그 | [`README.md`](./README.md) |
| 형제 프로젝트 (UI 패키지·VR 참고) | `/Users/lf/Desktop/gugbab-workspace/01_gugbab-claude-package` |

UI 패키지 npm 퍼블릭 배포 완료 — `@gugbab-ui/styled-mui` + `@gugbab-ui/tokens` 설치 가능.

---

## 작업 룰 요약 (필수)

| 룰 | 요지 | 상세 |
|---|---|---|
| 브랜치 | `main` 직접 커밋 금지. `feature/{name}` → PR로만 머지 | @.claude/rules/workflow.md |
| 시각 회귀(VR) | UI 산출물부터 sibling 프로젝트 패턴 미러링 | @.claude/rules/workflow.md |
| 커밋 분리 | `[config]`·`[skill]`·`[agent]`·`[code]`·`[docs]` 별도 | @.claude/rules/git.md |
| 외부 정보 검증 | 공식 문서 1순위·교차 검증 필수 | @.claude/rules/info-verification.md |
| 스킬 검증 | content test PASS / 실사용 카테고리는 PENDING_TEST 유지 | @.claude/rules/verification-policy.md |

---

## 금지 사항

- 요청 범위 밖의 코드 수정 금지
- API 키·토큰·비밀번호 파일 직접 작성 금지
- 검증되지 않은 외부 소스 그대로 복붙 금지
- `verification.md`·`SKILL.md` Bash(sed/awk 등)로 수정 금지 — 반드시 Write/Edit 도구
- `PENDING_TEST → APPROVED` 일괄 전환 금지 — 스킬별 개별 검증 필수
- main 브랜치 직접 커밋 금지 (부트스트랩 baseline 외)

---

## 컨텍스트 관리

- 무관한 작업 사이 `/clear`로 초기화
- 같은 실수 2회 반복 시 `/clear` 후 더 구체적 프롬프트로 재시작
- 다파일 조사는 서브에이전트(Explore·general-purpose) 위임

---

## 상황별 규칙 참조

| 상황 | 참조 파일 |
|---|---|
| 작업 워크플로우 (브랜치·PR·VR) | @.claude/rules/workflow.md |
| Git 커밋 컨벤션 | @.claude/rules/git.md |
| 외부 정보 조사·검증 | @.claude/rules/info-verification.md |
| 에이전트 설계·작성 | @.claude/rules/agent-design.md |
| 스킬·에이전트 생성 절차 | @.claude/rules/creation-workflow.md |
| 검증 정책·APPROVED 전환 | @.claude/rules/verification-policy.md |
| TypeScript / React 코딩 규칙 | @.claude/rules/typescript.md |
| README 업데이트 | @.claude/rules/readme-update.md |
