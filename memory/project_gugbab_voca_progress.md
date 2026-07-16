---
name: gugbab-voca 진행 상태
description: 2026-05-16 기준 Phase 0~7 완료(전 레벨 콘텐츠 + Vercel 배포), 다음=Phase 8 P2 보강
type: project
originSessionId: 9def3888-1fed-4fe5-be6c-d2ca92140670
---
# 진행 상태 (2026-05-16 기준)

**Why**: 다음 세션이 이 메모리부터 읽고 정확히 이어서 진행하기 위함.

**How to apply**: 세션 시작 시 이 메모리부터 확인. 다음 작업 = Phase 8 (P2 보강).

## Phase 진행 표

| Phase | 내용 | 상태 | PR |
|---|---|---|---|
| 0 | 미결 결정 (SRS·콘텐츠 시드) | ✅ 완료 | — |
| 1 | 아키텍처 설계 | ✅ 완료 | #2 |
| 2-1 | 부트스트랩 (Vite + Biome + Vitest) | ✅ 완료 | #4 |
| 2-2 | 순수 로직 (SRS·DB·콘텐츠 로더·큐) | ✅ 완료 | #5 |
| 3 | 시각 회귀(VR) 인프라 | ✅ 완료 | #6 |
| 4 | 핵심 UI (라우팅·4모드 학습·단어장) + A1 초기 시드 | ✅ 완료 | #7 |
| 5-1 | A1 콘텐츠 확장 (단어 80→600 → 보강 후 649 / 문장 40→250) + 다의어 `secondaryKorean` | ✅ 완료 | #8 |
| 5-2 | 단어장 학습 대시보드 (학습 점수·6단계 chip·무한 스크롤·virtuoso 가상화) | ✅ 완료 | #9 |
| 5-3 | 보강 UI (세션 종료 요약·통계·설정) | 건너뜀 | — |
| 6 | PWA + Vercel 배포 (vite-plugin-pwa · 아이콘 · vercel.json + 사용자 Vercel 가입·import) | ✅ 완료 | #10 |
| 7 | A2~C2 콘텐츠 확장 (신규 2,338단어 + 900문장 · cloze 정합성 자동 vitest test · 5개 검증 보고서) | ✅ 완료 (PR #11 추정) |
| 8-1 | **헤더 install prompt 버튼** (useInstallPrompt 훅 · iOS Safari 4단계 안내 모달 · Android/Desktop native prompt · standalone 자동 숨김 · 15/15 단위 테스트) | ✅ 완료 (PR #12 추정) |
| 8-2 | P2 후속 (Offline 배지 · 콘텐츠 갱신 알림 toast · 다크모드 · streak · 통계 · 세션 종료 요약 · 설정) | ⏳ **다음 작업 후보** |
| 버그픽스 | **PWA 핀치 줌 차단** (`src/preventZoom.ts` gesture 이벤트 차단 + `touch-action: pan-x pan-y`) — iOS는 user-scalable=no 무시·manipulation은 핀치 허용이 원인 | ✅ 2026-07-16 (`fix/pwa-pinch-zoom-and-hooks-cjs`, PR #22) |
| 개선 | **추천 큐 진행률 적응** (`composeQueue.ts`) — ① coverage(응답 카드 비율) 기반 신규 비율 0.6→0.3 lerp + word flashcard 가중치 앵커 보간 ② **coverage<50% flashcard 큐에서 통과(good) 카드 완전 숨김** (due·신규 모두, 틀린 카드는 유지, recall/cloze 검증 큐는 예외). 사용자 피드백: "진행률 낮은데 아는 카드만 나온다" | ✅ 2026-07-16 (`feature/adaptive-queue-coverage`) |
| 9 | 콘텐츠 audit·수정 (사용 후 피드백 기반) | — |

## 콘텐츠 최종 상태 (2026-05-16)

| Level | 단어 | 문장 |
|---|---:|---:|
| A1 | 649 | 250 |
| A2 | 518 | 200 |
| B1 | 500 | 200 |
| B2 | 502 | 200 |
| C1 | 407 | 150 |
| C2 | 411 | 150 |
| **합계** | **2,987** | **1,150** |

### cloze 정합성
- **100% (1,150/1,150)** — `src/content/__tests__/cloze-integrity.test.ts` 6/6 PASS
- 누적 lemma 풀 기반 (A2는 A1+A2, B1은 A1+A2+B1, ...)
- 활용형(s/es/ed/ied/ing/ly/er/est)·기능어·불규칙 화이트리스트 적용

### secondaryKorean 다의어
- A1 8개 + A2 18 + B1 19 + B2 13 + C1 14 + C2 12 = **84건**

### 검증 자료 (Phase 5-1·7 공통)
- NGSL-Spoken v1.2 (newgeneralservicelist.org)
- Cambridge YLE Movers/Flyers + EVP (englishprofile.org)
- Oxford 3000/5000 by CEFR level
- English Vocabulary Profile (EVP)
- (보조) COCA Spoken · British Council

### 검증 보고서
- `docs/research/2026-05-12-a1-content-curation.md`
- `docs/research/2026-05-13-a1-vocabulary-validation.md`
- `docs/research/2026-05-15-{a2,b1}-content-curation.md`
- `docs/research/2026-05-16-{b2,c1,c2}-content-curation.md`

## 배포

- **Production**: https://gugbab-claude-voca.vercel.app
- Vercel Hobby 플랜 (무료)
- main push → 자동 production 재배포 (1~2분)
- feature/* push → 자동 preview 도메인 발급 (PR 코멘트로 링크)
- 별도 GitHub Actions 배포 워크플로우 없음 (Vercel GitHub App만 사용)

## Phase 7에서 추가된 신규 모듈

- `src/content/__tests__/cloze-integrity-utils.ts` — lemma 정규화 helper (FUNCTION_WORDS 80여개 · IRREGULAR_FORMS 60여개 · 활용형 규칙)
- `src/content/__tests__/cloze-integrity.test.ts` — 누적 lemma 풀 기반 자동 회귀 검증

## 콘텐츠 출처 룰 (재확인)

- **책·강좌·블로그·인물 이름 출처 표기 0** (사용자 룰 — `feedback_content_origin_concealment`)
- 학술·정부 자료(NGSL/Cambridge/Oxford/EVP/COCA/British Council/US State Department)만 출처
- corpus linguistics 톤
- Unit·DAY·책 단원명 grep 0건 검증

## 알려진 기술 부채

| 항목 | 영향 | 우선순위 |
|---|---|---|
| `visual-regression.yml` collect step 중복 수집 → PR 코멘트 라우트 2배 표시 | 코멘트 가독성↓ | 중 |
| Learn 라우트 VR 누락 (SRS 큐 비결정성) | 시각 검증 사각지대 | 중 |
| Node 20.17 (Vite 7은 20.19+ 권장) | 로컬 빌드 경고만 (Vercel은 자동 20.x) | 낮 |
| jsdom IntersectionObserver/virtuoso 가상화 미지원 → 테스트 mock 의존 | E2E로 보강 후보 | 중 |
| router-helpers의 MANIFEST_A1_ONLY fixture는 A1만 — 다른 레벨 통합 테스트 시 별도 fixture 필요 | 신규 통합 테스트 작성 시 | 낮 |

## Phase 8 (P2 보강) 진입 시 예상 작업

### UX 보강
- install prompt UI (`beforeinstallprompt` 이벤트 활용)
- Offline 헤더 배지 (`useOnline` 훅)
- 콘텐츠 갱신 알림 UI (PRD #6 — 신규 SW 감지 시 toast)
- 다크모드 (`@gugbab/styled-mui` 토큰 자동 적용 확인)
- streak (연속 학습일 표시 — `feedback_xxx` 같은 일일 진도 store)
- 세션 종료 요약 (Phase 5-3 건너뛴 것)
- 통계 화면 (학습량·정답률·레벨별 진척도)
- 설정 화면 (TTS 속도·자동 뒤집기 등)

### 새 브랜치 예상
`feature/phase-8-p2-enhancements` (main 기준 분기)

## 다음 세션 시작 시 사용자 발화 가이드

- **"Phase 8 P2 보강 시작"**
- **"install prompt UI 추가"**
- **"다크모드 적용"**
- **"통계 화면 만들기"**
- 또는 **"이전 작업 이어서"**

세션 시작 hook이 이 메모리부터 자동 로드 → Phase 8 진입 준비된 상태로 시작.
