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

UI 컴포넌트가 등장하는 시점(Phase 4 또는 Phase 2 후반부)부터 시각 회귀 테스트 적용한다.

**참고 패턴**: 형제 프로젝트 `/Users/lf/Desktop/gugbab-workspace/01_gugbab-claude-package`

해당 프로젝트는 GitHub Actions 시각 회귀 워크플로우를 11회 진화로 안정화한 사례. 본 프로젝트도 동일 패턴을 단순화해 미러링한다.

**도입 절차**:
1. sibling 프로젝트의 VR 셋업(Storybook + Playwright/Chromatic-like + GH Actions) Read로 구조 파악
2. 본 프로젝트(단일 패키지·1인용) 맥락에 맞게 축소
3. `feature/visual-regression-setup` 단독 PR로 도입
4. 이후 모든 UI 변경 PR에서 자동 VR 트리거

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
