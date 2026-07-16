---
name: gugbab-voca 작업 워크플로우 룰
description: 브랜치·PR·시각화 테스트 등 코드 작업 시 따라야 할 절차 규칙
type: feedback
originSessionId: f9f87adf-ffa1-40cf-8402-13d5f552ca98
---
# 작업 워크플로우 룰

## 1. 브랜치 전략 — main 직접 커밋 금지

코드 작업은 항상 `main`에서 feature 브랜치를 따서 → 작업 → PR 형태로 머지한다.

**Why**: 2026-05-09 사용자 명시. 모든 변경 이력을 PR 단위로 남기고 리뷰 후 머지 흐름 유지하기 위함. 본 프로젝트가 1인용이라도 동일 룰 적용.

**How to apply**:
- 작업 시작 전 `git checkout -b feature/{phase-or-feature-name}` 로 브랜치 생성
- 브랜치 명명: `feature/phase-1-architecture`, `feature/srs-engine`, `feature/flashcard-ui` 등 의미 단위
- 커밋은 분리 원칙(`.claude/rules/git.md`) 준수 — `[code]`/`[docs]`/`[config]` 별로
- 작업 끝나면 `gh pr create` 로 PR → 사용자 확인 후 머지
- 메모리·verification.md 같은 `.claude/` 산출물도 동일 규칙 (예외 없음)

## 2. 시각화 테스트 — UI 산출물부터 적용

UI 컴포넌트가 등장하는 시점부터 `/Users/lf/Desktop/gugbab-workspace/01_gugbab-claude-package` (sibling 프로젝트)와 동일한 시각화 테스트 워크플로우를 적용한다.

**Why**: 2026-05-09 사용자 명시. UI 회귀를 PR 단위로 자동 검증하기 위함. sibling 프로젝트에서 GitHub Actions 시각 회귀 워크플로우를 11회 진화시켜 안정화한 경험이 있고, 동일 패턴을 본 프로젝트에도 가져올 의도.

**How to apply**:
- Phase 2(스캐폴딩) 또는 Phase 4(핵심 UI 등장) 진입 시 sibling의 VR 셋업을 참고:
  - Storybook (스토리 단위 회귀 대상)
  - Playwright 또는 Chromatic-like 시각 비교
  - GitHub Actions 워크플로우 (PR 트리거)
- sibling 프로젝트 구조 먼저 Read로 확인 후, 본 프로젝트 맥락에 맞게 적용
- VR 도입 PR은 `feature/visual-regression-setup` 단독으로 분리

## 3. PR 단위 — Phase 또는 layer 단위로 묶기 (2026-05-10 갱신)

**갱신 사유**: 사용자가 "PR 너무 자주 하는 것 같아 좀 더 작업하자"고 명시. 이전 룰("Phase별로 1개 이상 PR로 잘게 쪼개기")을 *완화*하여 PR 단위를 키운다.

**원칙**:
- 한 PR = *한 의미 단위* (Phase 전체 또는 layer 전체)
- 단, *layer 안에서 commit은 분리*해서 history 가독성 유지 (예: SRS / DB / utils 별 commit)
- 혼합 관심사(코드 + 환경 설정 + hook 수정 등)는 여전히 분리

**예시**:
- Phase 2 (순수 로직 레이어) = SRS + DB + utils + content + queue → **1 PR** (commit은 모듈별 분리)
- Phase 3 (UI + 라우트) = scaffolding + 라우트 + 학습 흐름 → **1 PR**
- 환경 변경 (Biome 도입 등) = 단독 PR
- Hot fix = 단독 PR

**가이드라인**:
- 한 PR이 +2000줄 넘으면 분리 검토
- layer 경계가 명확하면 layer 단위로 묶음
- 사용자가 "이번엔 작게" 요청하면 즉시 작은 단위로 전환
