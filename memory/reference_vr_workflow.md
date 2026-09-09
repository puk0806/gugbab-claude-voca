---
name: gugbab-voca VR 워크플로우 운영 정보
description: GitHub Actions visual-regression 동작 방식·라벨·ruleset·main 보호 룰 — sibling 패턴 미러링
type: reference
originSessionId: 9def3888-1fed-4fe5-be6c-d2ca92140670
modified: 2026-09-08T01:33:49.133Z
---
# VR 워크플로우 운영 정보

> **2026-09-08 오차 설정 교훈**: `maxDiffPixelRatio: 0.01`(1%)은 여백 많은 풀페이지에서
> 라디오 그룹 추가 같은 실제 UI 변화(~7,200px≈0.7%)까지 흡수해 PR #26~#28 동안 감지 실패.
> `maxDiffPixels: 500` 절대값으로 교체 (compare는 CI Linux↔Linux 결정적이라 좁게 잡아도 안전).
> 새 UI 추가 PR인데 VR이 "no diff 통과"면 이 설정부터 의심할 것.

**Why**: PR 시각 검증 흐름을 매번 떠올리지 않고 즉시 참조하기 위함. sibling 프로젝트(`01_gugbab-claude-package`) 패턴을 본 프로젝트에 맞게 단순화한 형태.

**How to apply**: VR 관련 PR/라벨/문제 해결 시 본 메모리 확인. CI 결과 해석·라벨 운영·트러블슈팅에 사용.

## 워크플로우 2개

| 파일 | 역할 | 트리거 |
|---|---|---|
| `.github/workflows/visual-regression.yml` | compare/accept 듀얼 모드 | `pull_request[opened/synchronize/reopened/labeled]` + `push: main` |
| `.github/workflows/archive-vr-diffs.yml` | 머지 시 시각 변화 PNG 영구 보존 | `pull_request[closed]` + `merged == true` |

## visual-regression.yml 흐름

### compare 모드 (기본)
1. PR push → CI 실행
2. baseline 있고 diff 없음 → ✅ PASS
3. baseline 있고 diff 있음 → ❌ FAIL + PR 코멘트에 expected/actual/diff 표
4. baseline 미존재 (신규 라우트) → ❌ FAIL + 신규 actual PNG 표 (자동 부트스트랩 안 함 — 사용자 라벨 부여 의도)

### accept 모드 (`accept-baseline` 라벨 부여 시)
1. `playwright test --update-snapshots` 실행
2. 새 baseline PNG 6개 `e2e/visual/__screenshots__/`에 저장
3. PR 브랜치에 `[ci] Modify: accepted baseline via accept-baseline label` commit + push
4. `gh api POST .../statuses`로 새 SHA에 `visual-regression: success` 직접 등록 (GITHUB_TOKEN push가 워크플로우를 재트리거 못 하므로 필요)
5. PR에 ✅ Baseline Accepted 코멘트 (`vrt-status` 태그)
6. `mergeStateStatus: BLOCKED → CLEAN` 전환 → 머지 가능

## 라벨

| 이름 | 색상 | description |
|---|---|---|
| `accept-baseline` | `#a6dd34` (연두) | 시각 변경을 의도된 baseline 갱신으로 수락 |

sibling의 `baseline-update`, `visual-regression` 라벨은 본 프로젝트 미사용 (수동 `visual-regression-baseline.yml` 워크플로우 생략).

## 보호 룰

### main 브랜치 protection
```json
{
  "required_status_checks": { "strict": true, "contexts": ["visual-regression"] },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

### vrt-snapshots/** ruleset (id 16283173)
```json
{
  "name": "Protect vrt-snapshots branches",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/vrt-snapshots/**"] } },
  "rules": [{ "type": "deletion" }]
}
```

**주의**: `non_fast_forward` 룰은 *제외*해야 함. 워크플로우가 `git push -f` 로 PR마다 같은 브랜치를 갱신하므로 추가하면 push 실패.

## 시각 자료 영구 보존 (이중 백업)

| 레이어 | 위치 | PR 시점 보존 |
|---|---|---|
| 1차 | `vrt-snapshots/pr-N` 브랜치 (ruleset 보호) | PR 코멘트 인라인 이미지가 이 브랜치 raw URL 참조 — *PR 머지 후에도* 그대로 표시 |
| 2차 | main `__diff_archive__/pr-N/` (archive 워크플로우가 머지 시 복사) | main 보호로 영구 — 시각 변화 history 추적용 |

→ 미래 다른 PR이 baseline을 갱신해도 이전 PR 시점의 시각 자료는 항상 살아 있음.

## 알려진 한계

- **collect step 중복**: `test-results/` + `__screenshots__/` 두 디렉토리 모두에서 PNG 수집 → PR 코멘트에 라우트가 2배 표시(예: 6개 → 12개). 기능 무해 (baseline은 정확히 6개 등록). 워크플로우 정리 PR 후보.
- **Learn 라우트 VR 누락**: SRS 큐 비결정성 (Math.random + Dexie progress 의존). 결정론적 fixture seed 도입 후 별도 spec 파일에 추가 가능.

## 트러블슈팅 빠른 참조

| 증상 | 원인 | 해결 |
|---|---|---|
| `mergeStateStatus: UNSTABLE`인데 머지 버튼 활성 | branch protection 미적용 | `gh api PUT .../branches/main/protection` |
| 워크플로우가 vrt-snapshots push 실패 | `non_fast_forward` 룰 적용됨 | ruleset에서 해당 룰 제거 |
| GITHUB_TOKEN push 후 CI 재트리거 안 됨 → PR이 영원히 fail 상태 | GitHub 보안 정책 (bot push는 워크플로우 트리거 X) | 워크플로우 안에서 `gh api POST .../statuses`로 직접 등록 |
| `compare` step 통과한 줄 알았는데 fail | 마지막 `Propagate compare failure` step이 exit 1 — 신규 baseline 후보 발견 시 의도적 fail | 정상. 사용자가 시각 검토 후 `accept-baseline` 라벨 부여 |
