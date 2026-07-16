---
name: gugbab-voca 주요 경로
description: PRD·스킬 명세·UI 패키지·작업 디렉토리 절대 경로
type: reference
originSessionId: f9f87adf-ffa1-40cf-8402-13d5f552ca98
---
# 주요 경로

## 본 프로젝트 (gugbab-voca 작업)

- 루트: `/Users/lf/Desktop/gugbab-workspace/02_gugbab-claude-voca`
- PRD: `docs/prd/gugbab-voca.md`
- 스킬 명세: `docs/prd/gugbab-voca-skills.md`
- 에이전트: `.claude/agents/{backend,devops,domain,education,frontend,meta,research,validation}/`
- 스킬: `.claude/skills/{frontend,devops,meta,...}/`
- 규칙: `.claude/rules/`
- CLAUDE.md: 프로젝트 루트

## 형제 프로젝트 (UI 패키지)

- 루트: `/Users/lf/Desktop/gugbab-workspace/01_gugbab-claude-package`
- 구조: pnpm 모노레포 (apps/storybook-mui, storybook-radix + packages/styled-mui, styled-radix, headless, hooks, tokens, utils, biome-config, commitlint-config, tsconfig)
- 사용 예정 패키지: `@gugbab/styled-mui` + `@gugbab/tokens` (npm 퍼블릭 배포 완료, 1.0.0)
- npm 스코프: `@gugbab` (주의: `@gugbab-ui` 아님)
- 사용자가 스킬 3종 신규 생성도 이 환경에서 진행 중일 가능성 큼
