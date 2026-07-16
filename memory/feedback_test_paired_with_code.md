---
name: 코드는 테스트와 한 세트 (테스트 없는 코드 머지 금지)
description: 모든 코드 변경은 테스트와 함께 같은 PR/커밋에 묶음. 테스트 없는 소스는 머지 불가.
type: feedback
originSessionId: f9f87adf-ffa1-40cf-8402-13d5f552ca98
---
# 코드 = 테스트 한 세트 룰

**규칙**: 코드 변경(`.ts`·`.tsx` 함수·컴포넌트·로직)에는 *반드시* 같은 PR/같은 커밋에 단위 테스트가 함께 있어야 한다. **테스트 없는 코드는 머지 불가**.

**Why**: 2026-05-10 사용자 명시 — "테스트하지 않은 소스는 머지될 수 없어". TDD 또는 함께 작성 원칙. Phase 2 이후 모든 PR에 강제.

**How to apply**:

## 1. 적용 범위

| 변경 유형 | 테스트 필요 | 비고 |
|---|---|---|
| 비즈니스 로직 함수 (`src/srs/`·`src/db/repository/`·`src/features/*/`) | ✅ 필수 | 단위 테스트 |
| 순수 유틸 (`src/shared/utils/`) | ✅ 필수 | 단위 테스트 |
| React 컴포넌트 | ✅ 필수 | RTL 렌더 테스트 (최소 smoke + interaction) |
| 도메인 타입 (`src/shared/types/`) | ⚠ 권장 | 타입 체크 자체가 검증. 가능하면 type assertion 테스트 |
| 환경 설정 (`vite.config.ts`·`tsconfig`·`eslint.config.js`) | ❌ 불요 | `pnpm build`·`pnpm lint`로 검증 |
| placeholder·UI 셸 (`App.tsx` 첫 진입점) | ⚠ smoke | 렌더 깨지지 않는지만 |

## 2. 커밋 분리 원칙 (`git.md`와 결합)

- 같은 *코드 + 테스트*는 **분리하지 말 것** — 한 커밋에 묶음
- 환경 설정과 코드 변경은 분리 가능 (관심사 다름)
- 예시:
  - ✅ `[code] Add: SM-2 algorithm + unit tests` (sm2.ts + sm2.test.ts 한 커밋)
  - ❌ `[code] Add: SM-2 algorithm` 후 `[code] Add: SM-2 tests` (분리 — 첫 커밋이 머지되면 룰 위반)

## 3. PR 머지 전 체크

`gh pr create` 직전 다음을 확인:
- 변경된 모든 `.ts`·`.tsx` 파일에 대응 `*.test.ts` 또는 통합 테스트 존재
- `pnpm test` 100% PASS
- 새 코드의 테스트 커버리지 > 80% (가능하면 100%)

## 4. 예외 — 사용자 명시 승인 시만

다음 경우는 *사용자에게 명시 보고 후 승인* 받고 진행:
- 외부 API 의존이라 단위 테스트 작성이 비현실적 (Web Speech API 등) → mock 또는 manual smoke로 대체
- placeholder/스캐폴딩 (Phase 2-1 같은 환경 부트스트랩)

명시 보고 형식: "이 파일은 X 이유로 단위 테스트 작성 어려움. Y 방식으로 검증. 승인 부탁드립니다."

## 5. 안티패턴

- "테스트는 다음 PR에서" → 금지. 같은 PR에 포함
- "타입만 정의하니까 테스트 X" → 가능하면 type-level test 또는 사용처에서 검증
- "급해서 테스트 생략" → 금지. 급하면 사용자에게 예외 승인 요청
