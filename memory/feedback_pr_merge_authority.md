---
name: PR 생성·머지 권한은 사용자에게 있음
description: Claude는 commit + push까지만. PR 생성·머지는 모두 사용자가 직접 (diff 확인 후)
type: feedback
originSessionId: f9f87adf-ffa1-40cf-8402-13d5f552ca98
---
# PR 생성·머지 권한 = 사용자

**갱신 (2026-05-10)**: PR 생성도 사용자 직접. 이전엔 PR 생성까지 Claude가 했으나, 사용자가 GitHub에서 diff 직접 확인 후 PR 만드는 방식 채택.

Claude는 **commit + push까지만** 수행한다. **PR 생성·머지는 모두 사용자가 직접** 한다.

**Why**: 2026-05-10 사용자 명시 ("내가 diff 확인하게 pr은 생성하지마 내가 직접 생성할게"). GitHub UI에서 변경 사항 시각적으로 검토한 뒤 PR 본문·제목을 본인이 결정하기 위함.

**How to apply**:
- 작업 완료 → commit 분리 → `git push -u origin <branch>` 까지만 수행
- `gh pr create`·`gh pr merge` **둘 다 사용하지 말 것**
- push 후: GitHub URL 안내 + PR 본문 초안 메시지로 제공 (사용자가 복사해서 사용 가능하게)
- "PR 생성해도 될까요?" 같은 물음 불필요 — 사용자가 본인 흐름대로 진행
- 머지 알림 받으면: 로컬 main 동기화(`git checkout main && git pull`), 머지된 feature 브랜치 삭제, 다음 작업으로 이동

## PR 본문 초안 제공 형식

push 완료 후 사용자에게 다음 형식으로 PR 작성에 도움될 정보 제공:

```
## PR 생성 안내

브랜치: feature/xxx
GitHub: https://github.com/.../pull/new/feature/xxx

### PR 제목 초안
[type] 한 줄 요약

### PR 본문 초안 (복사해서 사용)
## Summary
...
## Test plan
- [ ] ...
```
