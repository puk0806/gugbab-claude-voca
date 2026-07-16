---
name: gugbab-voca 프로젝트 개요
description: 영어 회화 단어·문장 학습 PWA. 본인 1인용. 학습 모드 4종(플래시카드/리콜/클로즈/단어장) + 단어장 마킹.
type: project
originSessionId: f9f87adf-ffa1-40cf-8402-13d5f552ca98
---
# gugbab-voca

영어 회화 단어·문장을 CEFR 6단계로 학습하는 1인용 웹/PWA 앱.

**Why**: 본인이 직접 큐레이션한 단어·문장을 SRS 기반으로 *플래시카드 + 리콜 입력 + 클로즈* 다중 모드 학습하기 위함. 시중 앱 대비 음성평가·실시간 대화·로그인을 빼고 학습 핵심만 남긴 미니멀 버전.

**How to apply**: 모든 신규 결정/코드는 PRD(`docs/prd/gugbab-voca.md`)와 아래 확정 사항을 기준으로 판단.

## 확정된 기술 결정

### 플랫폼·인프라
| 항목 | 결정 |
|---|---|
| 플랫폼 | 웹/PWA만. 모바일 네이티브 X |
| 인증·계정 | 없음. 단일 디바이스 로컬 사용 |
| 백엔드 | 없음. 정적 호스팅(Vercel) |
| 배포 | 퍼블릭 |
| 레벨 | CEFR 6단계 (A1·A2·B1·B2·C1·C2). 첫 출시 = A1만 |
| 콘텐츠 | Claude로 CEFR 기반 직접 생성. JSON에 클로즈 빈칸 위치 명시 (`{english, cloze:["go"]}`) |

### 학습 모드 (M1~M6 결정)
| 모드 | 콘텐츠 | 동작 |
|---|---|---|
| 플래시카드 | 단어·문장 | 영어 → 뒤집기 → 한국어. 자가체크 알았음/모르겠음 |
| 리콜 (한→영) | 단어·문장 | 한국어 표시 → 영어 입력. 자동채점. 오답 시 정답보기 |
| 클로즈 (빈칸) | 문장만 | 영어 빈칸 채우기 (JSON에 위치 명시) → 단어 입력. 자동채점·정답보기 |
| 단어장 | 단어·문장 | 학습 X·조회 only. 전체 리스트 + 학습 상태(X/중/마스터) + 검색 + 마킹(known/unknown) |

### SRS·학습 정책
| 항목 | 결정 |
|---|---|
| SRS 알고리즘 | SM-2 직접 구현 (70줄, 라이브러리 X) |
| SRS 통합 | 카드 + 모드별 분리 — 복합 PK `[cardId+mode]` (M1) |
| 입력 매칭 | 관대 — `trim().toLowerCase()` + 구두점 무시 (M3) |
| 단어장 마킹 | `userMark: 'known'\|'unknown'\|null` (M5·M6) |
| 마킹 가중치 | 신규 풀에서 unknown 70% / unmarked 25% / known 5% (M5) |
| 마킹 → SRS 초기값 | known 마킹 카드 첫 학습: EF 3.0·interval 6일 / unknown: EF 2.0·interval 1일 (M6) |

### UI·기술
| 항목 | 결정 |
|---|---|
| 진도 저장 | IndexedDB (Dexie 4.x) |
| 코어 스택 | React 19 + Vite + TS strict + RR v7 Data Mode + Zustand + vite-plugin-pwa |
| TTS | Web Speech API (`speechSynthesis`) — 듣기만, 발음평가·STT 없음 |
| UI | @gugbab/styled-mui + @gugbab/tokens (npm 퍼블릭, peer: react>=18) |
| 의존성 정책 | lodash류 회피·`@gugbab/*` 자유 사용·표준 lib OK |
| 테스트 | vitest + RTL (Playwright 보류) |

## 명시적 비범위

음성 인식, 발음 평가, 실시간 대화/챗봇, 콘텐츠 입력 UI, 회원가입, 다중 사용자, 백엔드 서버, 모바일 네이티브, 결제, 푸시 알림. FSRS는 Phase 7 후보.

## 핵심 산출물

- PRD: `docs/prd/gugbab-voca.md`
- 스킬 명세: `docs/prd/gugbab-voca-skills.md`
- 아키텍처: `docs/architecture/gugbab-voca-architecture.md`
- UX 기획서: `docs/design/gugbab-voca-ux-design.md`
- 시나리오 시각화: `docs/design/scenarios.html`
- 작성 시작일: 2026-05-07
