---
name: hooks-cjs-requirement
description: "이 레포 훅은 반드시 .cjs — package.json \"type\":\"module\" 때문. 00_gugbab-claude에서 훅 sync 시 .js로 덮이면 재발"
metadata: 
  node_type: memory
  type: project
  originSessionId: 8281f544-c2c9-4738-aae8-3603498d353f
---

# 훅 파일은 반드시 `.cjs` (2026-07-16)

이 레포(02_gugbab-claude-voca)의 `package.json`에는 `"type": "module"`이 있어
`.claude/hooks/*.js`(CommonJS)는 ESM으로 해석돼 `require is not defined`로 전부 죽는다.

**Why**: 훅 스위트는 공유 설정 레포 `00_gugbab-claude`에서 복사되는데, 거기는
`type: module`이 없어 `.js`로도 동작한다. 이 레포로 sync하면 `.cjs` 파일들이
`.js`로 덮여 같은 에러가 재발한다 (2026-07 재발, 과거 커밋 23f5d20에서도 동일 수정).

**How to apply**:
- 훅 sync/추가 시 `.cjs` 확장자 + `settings.json` 경로도 `.cjs`인지 확인
- 재발 시 일괄 rename: `for f in .claude/hooks/*.js; do mv "$f" "${f%.js}.cjs"; done` + settings.json sed
- 근본 해결은 `00_gugbab-claude` 원본 훅을 `.cjs`로 통일하는 것 (2026-07-16 기준 미수행)
- 관련 룰: `.claude/rules/memory-sync.md`의 `.cjs` 주의 문구, [[gugbab-voca 진행 상태]]
