# Visual Regression — Diff Archive

`archive-vr-diffs.yml` 워크플로우가 PR 머지 시점에 `vrt-snapshots/pr-N` 브랜치의 PNG 를 본 디렉토리(`pr-N/`)로 영구 archive 한다.

## 목적

- 시각 변화의 **history 추적** — "PR #N 에서 어떻게 디자인이 바뀌었나" 회고 자료
- PR 코멘트 인라인 이미지의 raw URL 소스(`vrt-snapshots/**`)가 삭제돼도 main 에 PNG 자체가 백업됨

## 구조

```
pr-N/
├── home/
│   ├── expected.png     이전 baseline (변경 없는 PR 은 미생성)
│   ├── actual.png       PR 의 새 캡처
│   └── diff.png         두 이미지 차이 시각화
└── learn-flashcard/
    └── actual.png       신규 라우트는 actual 만
```

> 본 디렉토리는 자동 관리된다. 수동 편집 금지.
