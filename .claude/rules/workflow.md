# 작업 워크플로우 룰

코드·문서·설정 변경 시 따라야 할 절차 규칙. CLAUDE.md와 모든 에이전트가 이 파일을 기준으로 삼는다.

---

## 1. 브랜치 + PR

| 룰 | 내용 |
|---|---|
| main 직접 커밋 | **금지** (예외: 부트스트랩 initial commit, PR 머지 커밋) |
| 작업 브랜치 | `main`에서 `feature/{name}` 브랜치 생성 |
| 머지 방식 | `gh pr create` → 사용자 승인 → 머지 |

브랜치 명명 예시:
- `feature/phase-1-architecture`
- `feature/srs-engine`
- `feature/flashcard-ui`
- `feature/visual-regression-setup`
- `feature/setup-{topic}` — 메타·설정 변경

---

## 2. PR 단위

- Phase별로 1개 이상 PR로 분리
- 한 PR에 여러 관심사 섞기 금지 — 커밋 분리 원칙(`@.claude/rules/git.md`) 준수
- 머지 후 다음 PR 시작 (병렬 진행 X — 1인용 프로젝트 단순화)

---

## 3. 시각 회귀(VR) 테스트

`feature/visual-regression-setup` 단독 PR로 도입. 단일 앱 컨텍스트라 sibling 프로젝트(`01_gugbab-claude-package`)의 Storybook 빌드 단계는 생략하고 *라우트 페이지 직접 캡처* 방식으로 단순화.

**구성**:
- 도구: Playwright (`@playwright/test`) + Chromium
- spec 위치: `e2e/visual/*.spec.ts`
- 베이스라인: `e2e/visual/__screenshots__/` (CI Linux 환경 단일)
- 머지 후 archive: `e2e/visual/__diff_archive__/pr-N/` (시각 변화 history)
- 워크플로우 2개:
  - `.github/workflows/visual-regression.yml` — compare/accept 모드 + 인라인 이미지 코멘트
  - `.github/workflows/archive-vr-diffs.yml` — 머지 시 시각 변화 영구 보존

**머지 차단 흐름**:
1. PR 생성 → compare 모드 실행
2. 베이스라인 diff 또는 신규 라우트 → fail → PR 코멘트에 **expected/actual/diff PNG 표** 자동 표시
3. 사용자가 시각 검토 후 의도된 변경이면 **`accept-baseline`** 라벨 부여
4. accept 모드로 재실행 → `playwright test --update-snapshots` → 베이스라인 PNG commit + push to PR branch + status 직접 등록
5. 다음 compare 통과 → 머지 가능
6. 머지 후 `archive-vr-diffs` 가 시각 변화 PNG 를 main 의 `__diff_archive__/pr-N/` 으로 영구 보존

**핵심 룰**:
- 베이스라인은 **CI Linux 단일 환경** — 로컬 macOS 캡처본은 commit 금지
- 라벨은 **사용자가 PR 검토 후 직접 부여** — 자동 부트스트랩 없음 (의도된 변경 검증)
- 새 라우트 추가 시 `routes.spec.ts` 에 test 추가만 하고 PR push — 라벨 부여로 첫 베이스라인 등록

자세한 사용법은 `e2e/visual/README.md` 참고.

---

## 4. 부트스트랩 예외

리포에 commit이 하나도 없는 경우, main 직커밋으로 baseline을 만드는 것만 허용한다. 이후부터는 본 룰 정상 적용.

baseline 커밋도 분리 원칙(`@.claude/rules/git.md`)을 따른다 — 한 번에 모두 묶지 않고 `[config]`/`[skill]`/`[agent]`/`[docs]` 등으로 쪼갠다.

---

## 5. 메모리 vs 룰 차이

| 항목 | 위치 | 검증 대상 |
|---|---|---|
| 메모리 (`feedback_*.md` 등) | `~/.claude/projects/.../memory/` | 사용자 로컬, 세션 간 컨텍스트 유지 |
| 룰 (`.claude/rules/*.md`) | 리포 루트 | 모든 세션·다른 사람·미래 Claude가 따르는 강제 규칙 |

같은 내용이라도 **룰은 리포에 박아 강제력 확보, 메모리는 사용자별 컨텍스트 보강** 용도로 분리한다.
