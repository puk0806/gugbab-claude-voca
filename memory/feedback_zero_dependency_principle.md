---
name: 의존성 최소화 원칙 (lodash류 유틸 bloat 회피)
description: 대중적 표준 라이브러리는 OK·@gugbab/* OK·lodash류 유틸 bloat는 회피·애매하면 사용자에게 질문
type: feedback
originSessionId: f9f87adf-ffa1-40cf-8402-13d5f552ca98
---
# 의존성 정책

**핵심**: 대중적·표준화된 라이브러리는 자유 사용. **lodash류 유틸 bloat은 회피**. 본인 패키지(`@gugbab/*`)는 dep 카운트 예외. 애매하면 사용자에게 질문.

**Why**: 2026-05-10 사용자 명시 — "기본적으로 사용하거나 하는 것들은 써야지", "로다시 이런 쓸데없는 것"은 안 쓰고 싶다, "유틸 관련된 건 `01_gugbab-claude-package`(@gugbab/*)에서 가져다 써도 OK". 1인용 PWA지만 표준 생태계 도구는 효율적으로 활용.

**How to apply**:

## 1. ✅ 자유 사용 OK (대중적 표준)

| 카테고리 | 예시 | 이유 |
|---|---|---|
| 코어 런타임 | React 19, react-dom | 토론 X |
| 빌드 툴체인 | Vite, TypeScript 5.x | 토론 X |
| 라우팅 | React Router v6/v7 | 사실상 표준 |
| 클라이언트 상태 | Zustand | 작고 표준 |
| IndexedDB 래퍼 | Dexie 4.x | 사실상 표준 (raw IDB는 boilerplate 과다) |
| PWA 도구 | vite-plugin-pwa | 표준 |
| 폼 처리 | React Hook Form + Zod | 사실상 표준 (필요 시) |
| 날짜 | dayjs (또는 `@gugbab/utils`에 있으면 그쪽) | 가벼운 표준 |
| 본인 UI/유틸 | `@gugbab/styled-mui`·`@gugbab/tokens`·`@gugbab/hooks`·`@gugbab/utils` 등 | 본인 패키지, 자유 사용 |

## 2. ❌ 회피 (lodash류 유틸 bloat)

| 회피 대상 | 자체 또는 본인 패키지 활용 |
|---|---|
| lodash, ramda, underscore | 네이티브 ES + `@gugbab/utils` |
| moment | dayjs 또는 네이티브 Date |
| classnames(작은 dep지만 보통 자체 가능) | 네이티브 `[a, b].filter(Boolean).join(' ')` |
| 매우 작은 한 줄 유틸 패키지 (e.g. is-odd, left-pad류) | 자체 한 줄 |

## 3. ❓ 애매하면 → 사용자에게 질문

판단 기준이 모호한 경우(중간 크기 패키지·신생 라이브러리·기능 일부만 사용하는 큰 패키지) **반드시 사용자에게 묻고 결정**한다. 임의로 추가 X.

질문 형식 예시:
> "X 라이브러리(N KB, weekly DL Y) 도입 vs 자체 구현(약 N줄). 어느 쪽으로 갈까요?"

## 4. 본인 패키지(`@gugbab/*`) 활용

`/Users/lf/Desktop/gugbab-workspace/01_gugbab-claude-package` 에 publish된 6개 패키지 자유 사용:

- `@gugbab/styled-mui` — UI 컴포넌트
- `@gugbab/styled-radix` — Radix 기반 UI (필요 시)
- `@gugbab/headless` — headless 컴포넌트 베이스
- `@gugbab/hooks` — 공통 훅
- `@gugbab/tokens` — 디자인 토큰
- `@gugbab/utils` — 공통 유틸 (lodash 대체)

새 유틸 함수 필요 시 우선순위:
1. 네이티브 ES로 한 줄 처리 가능?
2. `@gugbab/utils`에 있는가? → 사용
3. 둘 다 X → 자체 구현 또는 (애매하면) 사용자에게 lib 도입 질문

## 5. SM-2는 자체 구현 (예외 사례 명시)

알고리즘 자체는 70줄 검증된 reference 코드 기준 자체 구현. SRS 라이브러리(ts-fsrs 등) 미도입. 콘텐츠 누적 후 FSRS 교체 검토는 별도.
