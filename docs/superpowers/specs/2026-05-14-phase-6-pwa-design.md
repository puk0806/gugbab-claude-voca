# Phase 6 · PWA 설정 — Design Spec

> **작성일**: 2026-05-14
> **브랜치**: `feature/phase-6-pwa-deployment`
> **선행 PR**: #9 (Phase 5-2 단어장 대시보드 완료)
> **시각 기획서**: [`docs/design/phase-6-pwa-spec.html`](../../design/phase-6-pwa-spec.html)
> **시각 자료(아이콘 시안)**: [`docs/design/logo-drafts/`](../../design/logo-drafts/)

---

## 0. Goal

CEFR 영어 회화 단어·문장 학습 PWA가 **퍼블릭 도메인에서 동작 + 홈 화면 install + 오프라인 동작 가능 상태**로 진입한다. 머지 = 실제 사용 가능.

---

## 1. Scope · PR 구성

| 항목 | Phase 6 | 후속 Phase |
|---|:---:|:---:|
| vite-plugin-pwa + Service Worker | ✅ | — |
| 아이콘 자산 · manifest · meta | ✅ | — |
| `vercel.json` (SPA fallback · 캐시 헤더) | ✅ | — |
| **사용자 Vercel 가입 · GitHub repo import** | ✅ (사용자 액션) | — |
| Preview 도메인 + Production 도메인 동작 확인 | ✅ | — |
| Lighthouse PWA 90+ 검증 (manual) | ✅ | — |
| 실기기 install 시연 (선택) | ⚠ 사용자 자율 | — |
| install prompt UI · Offline 헤더 배지 | ❌ | P2 |
| 콘텐츠 갱신 알림 (PRD #6) | ❌ | P2 |
| 커스텀 도메인 (gugbab-voca.com 등) | ❌ | 추후 옵션 |

**PR 단위**: 1 PR (`feature/phase-6-pwa-deployment`), layer별 commit 분리.

---

## 1.5 사용자 액션 (Claude가 못하는 부분)

| 단계 | 시점 | 사용자가 할 일 |
|---|---|---|
| 1 | PR push 후 | https://vercel.com 가입 (GitHub OAuth, 5분) |
| 2 | 가입 직후 | New Project → `puk0806/02_gugbab-claude-voca` import |
| 3 | Import 화면 | Framework `Vite` 자동 감지 확인 / Build `pnpm build` / Output `dist` |
| 4 | Settings | Environment variables 없음 (skip) |
| 5 | Deploy 클릭 | `*.vercel.app` 도메인 자동 발급 (예: `gugbab-voca.vercel.app`) |
| 6 | 이후 | main에 push할 때마다 자동 production 재배포, PR push는 자동 preview 도메인 |

**Vercel CLI 토큰 인증은 사용자 본인 환경에서만 가능 → Claude는 가입·import·deploy를 대신 수행할 수 없음.**

---

## 2. 로고 · 아이콘

**채택 시안**: Soft 3D Gummi (사용자 선택, "무난"). 마스터 SVG → assets-generator로 PNG 일괄 생성.

### 자산 목록

| 자산 | 경로 | 생성 방식 |
|---|---|---|
| 마스터 SVG | `public/icon.svg` | 채택 시안 이동 (`docs/design/logo-drafts/logo-3-soft-3d-gummi.svg` → `public/icon.svg`) |
| 192/512 PWA PNG | `public/pwa-192x192.png`, `public/pwa-512x512.png` | `@vite-pwa/assets-generator` 자동 |
| maskable 512 | `public/pwa-512x512-maskable.png` | 동 |
| apple-touch-icon | `public/apple-touch-icon.png` (180) | 동 |
| favicon SVG | `public/favicon.svg` | SVG 우선 (모던 브라우저) |
| favicon ICO | `public/favicon.ico` (32) | 구 브라우저 fallback |

### 생성 시점 (Q3 결정)

**B 채택 — 1회 실행 후 PNG 커밋**. 사유:
- CI 빌드 시간 단축 (assets-generator는 sharp 의존 → native binding 실행 비용)
- 시안 변경 빈도 낮음 (배포 전 1회, 추후 P2 다크모드 대응 시 재실행)
- 결과 PNG는 `public/`에 commit되어 git history에 영구 보존

실행 방법:
```sh
pnpm dlx @vite-pwa/assets-generator --preset minimal-2023 public/icon.svg
# 또는 package.json scripts에 추가:
# "generate-pwa-assets": "pwa-assets-generator --preset minimal-2023 public/icon.svg"
```

---

## 3. 컬러 토큰

@gugbab/tokens accent와 일치.

| 용도 | 값 |
|---|---|
| `theme_color` (manifest, meta theme-color) | `#1976d2` |
| `background_color` (manifest splash) | `#ffffff` |
| 보조 (아이콘 그라데이션 등) | `#9c27b0` (accent2) |

---

## 4. Service Worker

| 항목 | 결정 | 근거 |
|---|---|---|
| 도구 | `vite-plugin-pwa` (Workbox 기반) | 사실상 표준, Vite 공식 권장 |
| 갱신 전략 | `registerType: 'autoUpdate'` | 1인용, prompt UI 불필요 |
| skipWaiting | `true` | 새 SW 즉시 활성 |
| clientsClaim | `true` | 모든 탭 즉시 제어 |
| precache 범위 | 빌드 산출물(JS·CSS·HTML) + `public/data/**` | 전체 오프라인 |
| runtime cache | 없음 | 외부 의존 0 (system-ui · 백엔드 없음) |

### vite.config.ts 추가 (요약)

```ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        // 6절 참조
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        globDirectory: 'dist',
        // public/data/**는 build 시 dist/data/**로 복사됨
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
```

### SW 라이프사이클

1. **첫 방문** → install: 빌드 산출물 + 콘텐츠 JSON precache (백그라운드)
2. **두 번째 방문부터** → cache-first: 즉시 렌더 (네트워크 X)
3. **새 배포 감지** → 새 SW 백그라운드 다운 → 다음 페이지 진입 시 자동 적용 (skipWaiting)
4. **네트워크 끊김** → 모든 화면 그대로 동작

---

## 5. PWA Manifest

`vite-plugin-pwa`가 `dist/manifest.webmanifest` 자동 생성.

```json
{
  "name": "gugbab-voca",
  "short_name": "gugbab",
  "description": "CEFR 영어 회화 단어·문장 학습",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1976d2",
  "background_color": "#ffffff",
  "lang": "ko",
  "icons": [
    { "src": "/pwa-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/pwa-512x512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/pwa-512x512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

---

## 6. index.html 메타 보강

현재 3줄 → 11줄로 확장.

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#1976d2" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="gugbab" />
<meta property="og:title" content="gugbab-voca" />
<meta property="og:description" content="CEFR 영어 회화 단어·문장 학습 PWA" />
<meta property="og:type" content="website" />
```

`<link rel="manifest">`는 vite-plugin-pwa의 `injectRegister: 'auto'` 옵션으로 자동 주입 가능. 명시 작성 권장(검증 용이).

---

## 7. Offline UX

첫 진입 후엔 모든 화면 정상 동작.

| 화면 | 오프라인 동작 |
|---|---|
| Home · Level · Mode | ✅ 정상 (라우트 cache) |
| Learn 4 모드 | ✅ 정상 (콘텐츠 JSON precache + IndexedDB 진도) |
| Vocabulary 단어장 | ✅ 정상 |
| TTS (Web Speech API) | ⚠ 브라우저별 차이 — iOS Safari 시스템 음성은 오프라인 OK, Android Chrome 일부 네트워크 의존 |

**Q1 결정 (Offline 헤더 배지)**: B 채택 — **생략**. Phase 6 최소 범위 유지. P2에서 install prompt와 함께 묶음.

**Q2 결정 (install prompt UI)**: B 채택 — **P2로 미룸**. 사용자가 브라우저 메뉴로 직접 install.

---

## 8. 콘텐츠 cache 전략

`vite-plugin-pwa`가 빌드 시 자동 hash 기반 cache key 생성 → 콘텐츠 JSON 변경 시 자동 무효화. 추가 코드 0.

| 자산 | 변경 빈도 | cache 동작 |
|---|---|---|
| JS·CSS bundle | 매 빌드 | filename hash → 자동 무효화 |
| `dist/data/words/*.json` | 콘텐츠 갱신 시 | workbox precache manifest hash → 자동 무효화 |
| `dist/data/sentences/*.json` | 동 | 동 |
| `public/data/manifest.json` `buildAt` | 매 빌드 | 디버그 표시용 유지 (현재처럼) |

---

## 9. 라우터 · 404

| 항목 | 상태 |
|---|---|
| `ErrorBoundary` (RouteError) | ✅ 이미 구현 (`src/routes/RouteError.tsx`) |
| `NotFound` 라우트 (`path: '*'`) | ✅ 이미 구현 (`src/routes/NotFound.tsx`) |
| 404 smoke 테스트 | ❌ 추가 (RTL `createMemoryRouter` + 잘못된 경로 진입) |

`vite-plugin-pwa`의 `navigateFallback: '/index.html'`로 SPA 새로고침 404 방지 (Vercel 배포 시에도 정합 — `vercel.json`은 Phase 6.5).

---

## 10. 테스트 계획

**룰**: 코드 = 테스트 한 세트 (`feedback_test_paired_with_code`).

| 대상 | 도구 | 케이스 |
|---|---|---|
| manifest 빌드 산출물 | vitest | `dist/manifest.webmanifest` JSON 파싱 + 필수 필드(name·icons·start_url·display) 검증 |
| SW 등록 코드 | vitest | `workbox-window` 등록 함수 호출 검증 (mock) |
| 아이콘 자산 존재 | vitest (build 후처리 spec) | `dist/pwa-{192,512}*.png`, `dist/apple-touch-icon.png`, `dist/favicon.{svg,ico}` 존재 확인 |
| 404 smoke | vitest (RTL) | 잘못된 라우트 진입 시 NotFound 렌더 |
| PWA E2E | Playwright | `e2e/pwa.spec.ts` — manifest 로드 + SW 활성 + offline 모드 라우트 진입 가능 |

### E2E 스펙 (`e2e/pwa.spec.ts`) 개요

```ts
test('PWA manifest 로드 + SW 등록 + offline 라우트 진입', async ({ page, context }) => {
  await page.goto('/');
  // 1. manifest link 존재
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
  // 2. SW 등록 (workbox-window가 register 호출)
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 5000 });
  // 3. offline 모드 → 라우트 진입 가능
  await context.setOffline(true);
  await page.goto('/level/A1');
  await expect(page.locator('main')).toBeVisible();
});
```

---

## 11. 빌드 영향 추정

| 항목 | 현재 | Phase 6 후 |
|---|---|---|
| JS bundle (gzip) | ~156 kB | ~158 kB (+workbox-window ~2 kB) |
| SW 파일 | — | ~6 kB (별도) |
| 첫 LCP | 현재 동일 | 영향 0 (SW 비동기 등록) |
| 두 번째 방문 이후 | 네트워크 의존 | **cache-first → 즉시 렌더** |

---

## 12. 의존성 추가

모두 devDep. 런타임 dep 증가 ~2 kB (workbox-window only).

| 패키지 | 버전 (목표) | 역할 |
|---|---|---|
| `vite-plugin-pwa` | `^0.21.x` | SW 생성·manifest·workbox 통합 |
| `@vite-pwa/assets-generator` | `^0.2.x` | SVG → PNG 아이콘 일괄 생성 (1회 실행) |
| `workbox-window` | (peer) | 클라이언트 SW 등록 (runtime ~2 kB) |

> ※ `vite-plugin-pwa` 최신 안정 버전·`registerType` 옵션은 구현 시점에 공식 문서로 재확인 필요 (`info-verification.md` 룰).

---

## 13. 커밋 분리 (한 PR 내)

`workflow.md` + `git.md` 룰. layer별 commit으로 history 가독성 유지.

| 순서 | 카테고리 | 내용 |
|---|---|---|
| 1 | `[config]` | vite-plugin-pwa · @vite-pwa/assets-generator devDep 추가 + package.json scripts |
| 2 | `[code]` | `public/icon.svg` 마스터 + PNG 자산 생성 결과 (assets-generator 1회 실행 후 결과 commit) |
| 3 | `[code]` | `vite.config.ts` VitePWA 플러그인 + manifest 설정 |
| 4 | `[code]` | `index.html` 메타 보강 |
| 5 | `[code]` | SW 등록 동작 검증 단위 테스트 (`injectRegister: 'auto'`로 자동 주입되므로 별도 등록 코드 추가 없음, workbox-window mock으로 호출 검증만) |
| 6 | `[code]` | E2E PWA spec (`e2e/pwa.spec.ts`) |
| 7 | `[config]` | `vercel.json` 추가 (SPA fallback · 캐시 헤더) |
| 8 | `[docs]` | README · CLAUDE.md Phase 6 완료 반영 + 사용자 Vercel 가입 가이드 + `project_gugbab_voca_progress` 메모리 갱신 |

### vercel.json 내용 (commit 7)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/manifest.webmanifest",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    },
    {
      "source": "/sw.js",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    },
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

> ※ vite-plugin-pwa 출력 SW 파일명은 구현 시점 확인 (`sw.js` 또는 `service-worker.js`). vercel.json 헤더 source 경로 일치 필요.

---

## 14. Definition of Done

### 로컬 검증 (Claude 수행)
- [ ] `pnpm build` 성공 + `dist/manifest.webmanifest` 생성됨
- [ ] `pnpm preview` 후 DevTools Application 탭에서 SW 활성 + manifest 로드 확인
- [ ] 오프라인 모드(DevTools Network throttle: Offline)에서 모든 라우트 진입 가능
- [ ] `pnpm test` 100% PASS (신규 단위 테스트 4종 포함)
- [ ] `pnpm test:visual` 통과 (기존 VR 베이스라인 변경 없음)
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] 8개 commit 분리 완료 + push

### 배포 검증 (사용자 수행)
- [ ] Vercel 가입 + repo import 완료
- [ ] PR push 시 Vercel preview 도메인 자동 생성 확인
- [ ] preview 도메인에서 PWA 동작 확인 (manifest 로드 · install 가능 · 오프라인 동작)
- [ ] Lighthouse PWA 점수 90+ 확인 (PR preview 도메인)
- [ ] PR 머지 → production `*.vercel.app` 자동 배포 + 동작 확인
- [ ] (선택) 실기기 — iOS Safari "홈 화면에 추가" / Android Chrome "앱 설치" 시연

---

## 15. 후속 Phase 분기

| Phase | 내용 | 트리거 |
|---|---|---|
| 7 | P2 보강 (install prompt UI · Offline 배지 · 콘텐츠 갱신 알림 · 다크모드 · streak 등) | Phase 6 배포 안정화 후 |
| 8 | A2~C2 콘텐츠 시드 (배포 후 점진) | P2 일부 + 사용 안정화 |
| 옵션 | 커스텀 도메인 (예: `gugbab-voca.com`) | 사용자 도메인 보유 시 |
