# CLAUDE.md — gugbab-voca

영어 회화 단어·문장을 CEFR 6단계로 학습하는 1인용 PWA. SRS(SM-2) 기반 플래시카드 + Web Speech TTS, 백엔드·인증 없이 IndexedDB(Dexie)로 진도 영속화.

> PRD·아키텍처·리서치 등 산출물 문서는 2026-07-21 공유 레포로 이관되어 이 레포에 없다.
>
> 하네스(공통 규칙·훅·에이전트·스킬)는 `gugbab-claude` 래퍼가 제공한다. 레포에 `.claude/` 를 두지 않는다.

---

## 세션 시작 체크리스트

1. **현재 브랜치·PR 상태** — `git status` / `gh pr list`
2. **현재 Phase** — 아래 표 참조

---

## 진행 단계

| Phase | 내용 | 상태 |
|---|---|---|
| 0 | 미결 결정 (SRS·콘텐츠 시드) | ✅ 완료 — SM-2 / Claude 생성 시드 |
| 1 | 아키텍처 설계 | ✅ 완료 |
| 2 | 스캐폴딩 + 순수 로직 (Vite·Biome·Vitest / SRS·DB·콘텐츠 로더·큐) | ✅ 완료 (PR #4·#5) |
| 3 | 시각 회귀(VR) 인프라 — Playwright + GH Actions 라벨 기반 베이스라인 승인 | ✅ 완료 (PR #6) |
| 4 | 핵심 UI (라우팅·4모드 학습·단어장) + A1 콘텐츠 시드 — VR 첫 베이스라인 등록 | ✅ 완료 (PR #7) |
| 5-1 | A1 콘텐츠 확장 (단어 80→648 / 문장 40→150) + 다의어 `secondaryKorean` 스키마 + 교차 검증 | ✅ 완료 (PR #8) |
| 5-2 | 단어장 학습 대시보드 (학습 점수 정렬·6단계 chip 필터·무한 스크롤·virtuoso 가상화) + A1 formulaic pattern 100문장 보강 (649/250) | ✅ 완료 (PR #9) |
| 5-3 | 보강 UI (세션 종료 요약·통계·설정) | 건너뜀 — P2로 |
| 6 | PWA + Vercel 배포 (vite-plugin-pwa · 아이콘 · vercel.json · 사용자 Vercel 가입) | ✅ 완료 (PR #10) |
| 7 | A2~C2 콘텐츠 확장 (신규 2,338단어 + 900문장 · cloze 정합성 자동 검증 vitest test) | ✅ 완료 (PR #11) |
| 8-1 | P2 — 헤더 install prompt 버튼 (iOS Safari 안내 모달 · Android/Desktop native prompt · standalone 자동 숨김) | ✅ 완료 (`feature/phase-8-install-prompt`) |
| 8-2 | P2 — Offline 배지 · 콘텐츠 갱신 알림 · 다크모드 · streak · 통계 · 설정 등 | — |

Phase 진입·완료 시 이 표를 업데이트한다.

---

## 핵심 경로

| 항목 | 경로 |
|---|---|
| 콘텐츠 데이터 | `public/data/words/{cefr}.json` · `public/data/sentences/{cefr}.json` · `public/data/manifest.json` |
| 형제 프로젝트 (UI 패키지·VR 참고) | `/Users/lf/Desktop/gugbab-workspace/01_gugbab-claude-package` |

UI 패키지 npm 퍼블릭 배포 완료 — `@gugbab-ui/styled-mui` + `@gugbab-ui/tokens` 설치 가능.

---

## 작업 룰 (프로젝트 전용)

- **브랜치**: `main` 직접 커밋 금지. `feature/{name}` → PR로만 머지 (main ruleset: `ci`·`visual-regression` 필수)
- **시각 회귀(VR)**: UI 산출물부터 sibling 프로젝트 패턴 미러링. 시각 차이는 `accept-baseline` 라벨로 승인
- **커밋 분리**: `[config]`·`[code]`·`[docs]`·`[memory]` 등 관심사별 별도 커밋

---

## 검증

```bash
pnpm exec biome ci . && pnpm typecheck && pnpm test && pnpm build
```
