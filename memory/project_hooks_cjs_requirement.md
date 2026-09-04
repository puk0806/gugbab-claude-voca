---
name: hooks-cjs-requirement
description: "이 레포 훅은 CJS인데 package.json \"type\":\"module\" — 해결책은 .claude/hooks/package.json {\"type\":\"commonjs\"} 마커. 마커 삭제 시 require 에러 재발"
metadata: 
  node_type: memory
  type: project
  originSessionId: 8281f544-c2c9-4738-aae8-3603498d353f
  modified: 2026-09-04T04:52:05.091Z
---

# 훅 모듈 해석 문제 — commonjs 마커로 해결 (2026-09-04 갱신)

이 레포(02_gugbab-claude-voca)의 루트 `package.json`에는 `"type": "module"`이 있어
`.claude/hooks/*.js`(CommonJS)가 ESM으로 해석되면 `require is not defined`로 전부 죽는다.

**경과**:
- 2026-07-16: 훅을 `.cjs` 확장자로 유지하는 방식으로 대응
- 2026-09-04: `00_gugbab-claude` sync가 훅 스위트를 `.js`(CJS 내용)로 전면 교체 → 에러 재발
  → **`.claude/hooks/package.json`에 `{"type":"commonjs"}` 마커 추가로 근본 해결**

**Why**: 공유 설정 레포 `00_gugbab-claude`에는 `type: module`이 없어 `.js`=CJS로 동작하지만,
이 레포에서는 가장 가까운 package.json의 type이 module이라 깨진다. 훅 디렉토리에 자체
package.json 마커를 두면 sync된 `.js` 파일을 건드리지 않고 CJS로 해석되며, 이후 sync에도 살아남는다.

**How to apply**:
- `.claude/hooks/package.json` (`{"type":"commonjs"}`) 을 삭제하지 말 것 — 삭제 시 훅 전멸
- 훅 스모크 테스트: `for f in .claude/hooks/*.js; do echo '{}' | node "$f" 2>&1 | grep -q ReferenceError && echo "❌ $f"; done`
- 더 이상 `.cjs` rename 불필요 — sync가 `.js`로 덮어도 마커가 흡수
- 관련: [[gugbab-voca 진행 상태]]
