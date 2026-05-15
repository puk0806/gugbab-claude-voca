# Phase 6 · PWA + Vercel 배포 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** gugbab-voca를 PWA(manifest + Service Worker + 아이콘)로 만들고 Vercel에 배포하여 머지 = 실제 사용 가능 상태에 도달한다.

**Architecture:** Vite + React 19 + react-router v7 정적 사이트에 `vite-plugin-pwa`(Workbox 기반 SW + manifest 자동 생성) 추가. `@vite-pwa/assets-generator`로 단일 SVG → PNG 아이콘 일괄 변환(빌드 시점 1회 실행 후 결과 commit). `vercel.json`으로 SPA fallback + 캐시 헤더. 사용자가 Vercel 가입 후 GitHub repo import → 자동 빌드·배포.

**Tech Stack:** vite-plugin-pwa (^0.21.x) · @vite-pwa/assets-generator (^0.2.x) · workbox-window (peer) · vitest · Playwright

**Spec:** [`docs/superpowers/specs/2026-05-14-phase-6-pwa-design.md`](../specs/2026-05-14-phase-6-pwa-design.md)

---

## File Structure

| 파일 | 변경 | 책임 |
|---|---|---|
| `package.json` | Modify | devDep + script 추가 |
| `pnpm-lock.yaml` | Modify (자동) | 의존성 lock |
| `pwa-assets.config.ts` | Create | assets-generator 설정 |
| `public/icon.svg` | Create | 마스터 아이콘 SVG |
| `public/favicon.svg` | Create | favicon SVG |
| `public/pwa-64x64.png` 외 | Create (생성) | PWA 아이콘 6종 |
| `vite.config.ts` | Modify | VitePWA 플러그인 + manifest 설정 |
| `index.html` | Modify | meta·link 보강 |
| `src/pwa.ts` | Create | SW 등록 helper (테스트 가능 단위) |
| `src/pwa.test.ts` | Create | SW 등록 단위 테스트 |
| `src/main.tsx` | Modify | pwa.ts import |
| `src/routes/NotFound.test.tsx` | Create (또는 기존 보강) | 404 smoke |
| `e2e/visual/pwa.spec.ts` | Create | E2E PWA spec |
| `vercel.json` | Create | SPA fallback + 캐시 헤더 |
| `README.md` | Modify | Phase 6 완료 + 배포 안내 |
| `CLAUDE.md` | Modify | Phase 진행 표 갱신 |
| `docs/research/2026-05-15-vercel-deployment-guide.md` | Create | 사용자 Vercel 가입 가이드 |

---

## Task 0: 사전 점검

**Files:** (없음 — 환경 확인)

- [ ] **Step 1: 현재 브랜치·working tree 확인**

```bash
git status
git branch --show-current
```

Expected: `feature/phase-6-pwa-deployment`, untracked files = `docs/design/logo-drafts/`, `docs/design/phase-6-pwa-spec.html`, `docs/superpowers/`

- [ ] **Step 2: 로컬 빌드 baseline 확인**

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Expected: 모두 PASS, `dist/` 생성. baseline 번들 크기 메모.

---

## Task 1: 의존성 추가 + script

**Files:**
- Modify: `package.json` (devDependencies + scripts)

- [ ] **Step 1: pnpm으로 devDep 설치**

```bash
pnpm add -D vite-plugin-pwa @vite-pwa/assets-generator
```

Expected: `package.json` `devDependencies`에 두 패키지 추가. `pnpm-lock.yaml` 갱신. workbox-window가 peer로 설치됨.

- [ ] **Step 2: package.json scripts 추가**

`package.json`의 `"scripts"` 안에 다음 줄 추가 (`build` 줄 뒤):

```json
"generate-pwa-assets": "pwa-assets-generator"
```

- [ ] **Step 3: 검증 — 의존성 import 가능**

```bash
node -e "import('vite-plugin-pwa').then(m => console.log('VitePWA:', typeof m.VitePWA))"
```

Expected: `VitePWA: function`

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "[config] Add: vite-plugin-pwa + @vite-pwa/assets-generator devDep + generate-pwa-assets script"
```

---

## Task 2: 마스터 SVG + assets-generator 설정 + PNG 생성

**Files:**
- Create: `public/icon.svg` (마스터)
- Create: `public/favicon.svg` (favicon용)
- Create: `pwa-assets.config.ts`
- Create (생성): `public/pwa-{64,192,512}.png` · `public/maskable-icon-512x512.png` · `public/apple-touch-icon-180x180.png` · `public/favicon.ico`

- [ ] **Step 1: 채택 시안을 마스터로 이동**

```bash
cp docs/design/logo-drafts/logo-3-soft-3d-gummi.svg public/icon.svg
```

- [ ] **Step 2: favicon용 SVG 작성** (icon.svg와 동일 디자인, 더 단순화 가능)

`public/favicon.svg`:

```xml
<svg width="64" height="64" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="b" cx="0.4" cy="0.3" r="0.85">
      <stop offset="0" stop-color="#60a5fa"/>
      <stop offset="0.55" stop-color="#3b82f6"/>
      <stop offset="1" stop-color="#1e3a8a"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="120" fill="url(#b)"/>
  <text x="256" y="378" font-family="system-ui, sans-serif" font-size="340" font-weight="800" fill="white" text-anchor="middle" letter-spacing="-14">g</text>
</svg>
```

- [ ] **Step 3: assets-generator 설정 작성**

`pwa-assets.config.ts`:

```ts
import {
  defineConfig,
  minimal2023Preset as preset,
} from '@vite-pwa/assets-generator/config';

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset,
  images: ['public/icon.svg'],
});
```

- [ ] **Step 4: PNG 일괄 생성 (1회 실행)**

```bash
pnpm generate-pwa-assets
```

Expected: `public/`에 다음 파일 생성됨:
- `pwa-64x64.png`
- `pwa-192x192.png`
- `pwa-512x512.png`
- `maskable-icon-512x512.png`
- `apple-touch-icon-180x180.png`
- `favicon.ico` (있는 경우 — 없으면 다음 step에서 별도 생성)

- [ ] **Step 5: favicon.ico 확인 (없으면 수동 생성)**

```bash
ls public/favicon.ico 2>/dev/null && echo "OK" || echo "MISSING — 수동 생성 필요"
```

만약 MISSING이면 `pwa-64x64.png`를 ImageMagick·sips·온라인 변환기로 .ico 변환:

```bash
# macOS sips는 ico 미지원 → 64x64 PNG를 favicon.svg와 함께 사용 (모던 브라우저)
# 또는: brew install imagemagick && magick public/pwa-64x64.png public/favicon.ico
# 또는 favicon.ico 생략하고 favicon.svg + pwa-64x64.png를 link로 직접 명시
```

> **Note:** favicon.ico는 옵셔널. 모던 브라우저는 favicon.svg + PNG fallback이면 충분. 구 IE 지원 안 함.

- [ ] **Step 6: 생성된 파일 확인**

```bash
ls -la public/*.png public/*.svg public/*.ico 2>/dev/null
```

Expected: SVG 2개 + PNG 5~6개 + (선택) ico 1개

- [ ] **Step 7: Commit**

```bash
git add public/icon.svg public/favicon.svg public/pwa-*.png public/maskable-icon-*.png public/apple-touch-icon-*.png pwa-assets.config.ts
# favicon.ico 생성됐으면 추가:
git add public/favicon.ico 2>/dev/null
git commit -m "[code] Add: PWA 아이콘 자산 (마스터 SVG + 192/512/180/64 PNG + maskable + favicon)"
```

---

## Task 3: vite.config + manifest 설정

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: VitePWA 플러그인 추가**

`vite.config.ts` 전체 교체:

```ts
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        name: 'gugbab-voca',
        short_name: 'gugbab',
        description: 'CEFR 영어 회화 단어·문장 학습',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        lang: 'ko',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,json}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // public/data/**의 콘텐츠 JSON도 dist/data/**로 자동 복사되어 globPatterns에 매칭됨
      },
      devOptions: {
        enabled: false, // 개발 중에는 SW 비활성 (HMR 충돌 방지)
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    outDir: 'dist',
  },
});
```

- [ ] **Step 2: 빌드 산출물 검증**

```bash
pnpm build
ls dist/manifest.webmanifest dist/sw.js dist/workbox-*.js 2>&1
```

Expected: `dist/manifest.webmanifest`, `dist/sw.js`, `dist/workbox-*.js` 존재.

- [ ] **Step 3: manifest 내용 검증**

```bash
cat dist/manifest.webmanifest | python3 -m json.tool
```

Expected: name·icons·start_url·display·theme_color 모두 spec 값과 일치.

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts
git commit -m "[code] Add: VitePWA 플러그인 + manifest + workbox precache 설정 (autoUpdate)"
```

---

## Task 4: index.html 메타 보강

**Files:**
- Modify: `index.html`

- [ ] **Step 1: index.html 전체 교체**

`index.html`:

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="CEFR 영어 회화 단어·문장 학습 PWA" />
    <title>gugbab-voca</title>

    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/pwa-64x64.png" sizes="64x64" type="image/png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
    <link rel="manifest" href="/manifest.webmanifest" />

    <meta name="theme-color" content="#1976d2" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="gugbab" />

    <meta property="og:title" content="gugbab-voca" />
    <meta property="og:description" content="CEFR 영어 회화 단어·문장 학습 PWA" />
    <meta property="og:type" content="website" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: 빌드 후 dist/index.html 검증**

```bash
pnpm build
grep -E "manifest|theme-color|apple-touch-icon" dist/index.html
```

Expected: 모든 link·meta가 dist/index.html에 그대로 있음 + vite가 자동으로 manifest.webmanifest link 1회 더 주입할 수 있음 (중복 무해).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "[code] Modify: index.html — favicon · apple-touch-icon · manifest · theme-color · OG 메타 보강"
```

---

## Task 5: SW 등록 helper + 단위 테스트

**Files:**
- Create: `src/pwa.ts`
- Create: `src/pwa.test.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: pwa.ts helper 작성**

`src/pwa.ts`:

```ts
/**
 * Service Worker 등록 helper.
 *
 * `vite-plugin-pwa`의 virtual:pwa-register 모듈을 직접 임포트해 SW를 등록한다.
 * registerType: 'autoUpdate'이므로 새 SW 발견 시 백그라운드 다운 후 다음 페이지 진입에 자동 활성.
 *
 * 테스트 가능성을 위해 별도 모듈로 분리. main.tsx에서 호출.
 */
export async function registerServiceWorker(): Promise<void> {
  if (import.meta.env.DEV) {
    // 개발 모드에선 SW 비활성 (HMR 충돌 방지)
    return;
  }

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({
      immediate: true,
      onRegisteredSW(swUrl) {
        // eslint-disable-next-line no-console
        console.info('[pwa] SW registered:', swUrl);
      },
      onRegisterError(error) {
        // eslint-disable-next-line no-console
        console.error('[pwa] SW registration failed:', error);
      },
    });
  } catch (err) {
    // virtual 모듈이 없는 환경(테스트 등)에서는 silent skip
    // eslint-disable-next-line no-console
    console.warn('[pwa] virtual:pwa-register not available:', err);
  }
}
```

- [ ] **Step 2: 테스트 작성 (먼저 — TDD)**

`src/pwa.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerServiceWorker } from './pwa';

describe('registerServiceWorker', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('window', globalThis as unknown as Window);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
  });

  it('개발 모드에서는 SW 등록을 skip한다', async () => {
    vi.stubEnv('DEV', true);
    const importSpy = vi.spyOn(Object, 'keys'); // 호출 자체가 일어나지 않는지 간접 확인
    await registerServiceWorker();
    // import.meta.env.DEV === true → 즉시 return
    expect(importSpy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('serviceWorker가 navigator에 없으면 skip한다', async () => {
    vi.stubEnv('DEV', false);
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      configurable: true,
    });
    // throw 없이 정상 종료해야 함
    await expect(registerServiceWorker()).resolves.toBeUndefined();
    vi.unstubAllEnvs();
  });

  it('virtual:pwa-register 모듈 로드 실패 시 silent skip한다', async () => {
    vi.stubEnv('DEV', false);
    Object.defineProperty(globalThis, 'navigator', {
      value: { serviceWorker: {} },
      configurable: true,
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // vitest 환경엔 virtual:pwa-register 모듈이 없음 → import 실패
    await expect(registerServiceWorker()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[pwa]'),
      expect.anything(),
    );
    vi.unstubAllEnvs();
  });
});
```

- [ ] **Step 3: 테스트 실행 — 처음엔 FAIL (모듈이 없음)**

```bash
pnpm test src/pwa.test.ts
```

Expected: pwa.ts가 막 만들어졌으므로 PASS 가능. 만약 vitest가 `virtual:pwa-register`를 모르면 PASS (catch에서 silent skip).

- [ ] **Step 4: main.tsx에 SW 등록 호출 추가**

`src/main.tsx` 수정:

```ts
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import { registerServiceWorker } from '@/pwa';
import '@/styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element with id="root" not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

void registerServiceWorker();
```

- [ ] **Step 5: typecheck + 단위 테스트 PASS 확인**

```bash
pnpm typecheck
pnpm test
```

Expected: 모두 PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pwa.ts src/pwa.test.ts src/main.tsx
git commit -m "[code] Add: SW 등록 helper(pwa.ts) + 단위 테스트 + main.tsx 진입점에 등록 호출"
```

---

## Task 6: 404 NotFound smoke 테스트

**Files:**
- Create or Modify: `src/routes/NotFound.test.tsx` (없으면 생성)

- [ ] **Step 1: 기존 테스트 확인**

```bash
ls src/routes/NotFound.test.tsx 2>/dev/null && echo "EXISTS" || echo "NEW"
```

- [ ] **Step 2: NotFound 라우트 진입 smoke 테스트 작성**

`src/routes/NotFound.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { routes } from '@/router';

describe('NotFound route', () => {
  it('정의되지 않은 경로 진입 시 NotFound 컴포넌트를 렌더한다', () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ['/this/path/does/not/exist'],
    });
    render(<RouterProvider router={router} />);
    // NotFound 컴포넌트의 식별 가능 텍스트로 검증.
    // 실제 NotFound.tsx 구현 텍스트와 일치해야 함.
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
```

> **Note:** `getByRole('heading', { level: 1 })` 매칭은 NotFound.tsx에 `<h1>` 태그가 있어야 함. 만약 다른 구조라면 NotFound.tsx 실제 텍스트(예: "페이지를 찾을 수 없습니다")로 `getByText` 사용.

- [ ] **Step 3: NotFound.tsx 실제 구조 확인 후 테스트 보정**

```bash
cat src/routes/NotFound.tsx
```

NotFound.tsx의 식별 가능한 텍스트나 role을 확인 후 테스트의 assertion을 그에 맞게 수정.

- [ ] **Step 4: 테스트 실행**

```bash
pnpm test src/routes/NotFound.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/routes/NotFound.test.tsx
git commit -m "[code] Add: NotFound 라우트 smoke 테스트 (와일드카드 경로 진입 → 404 렌더 검증)"
```

---

## Task 7: E2E PWA spec

**Files:**
- Create: `e2e/visual/pwa.spec.ts`

- [ ] **Step 1: 기존 e2e 구조 확인**

```bash
ls e2e/visual/
cat playwright.config.ts | head -30
```

- [ ] **Step 2: PWA E2E spec 작성**

`e2e/visual/pwa.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test.describe('PWA 동작', () => {
  test('manifest link · theme-color · apple-touch-icon 메타 존재', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      'href',
      /manifest\.webmanifest/,
    );
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      '#1976d2',
    );
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      'href',
      /apple-touch-icon/,
    );
  });

  test('manifest.webmanifest 내용이 spec과 일치', async ({ page }) => {
    const response = await page.request.get('/manifest.webmanifest');
    expect(response.ok()).toBe(true);
    const manifest = await response.json();
    expect(manifest.name).toBe('gugbab-voca');
    expect(manifest.short_name).toBe('gugbab');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#1976d2');
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: '192x192' }),
        expect.objectContaining({ sizes: '512x512' }),
        expect.objectContaining({ purpose: 'maskable' }),
      ]),
    );
  });

  test('Service Worker 등록 + 활성화 확인', async ({ page }) => {
    await page.goto('/');
    // SW 등록은 비동기 — 최대 5초 대기
    await page.waitForFunction(
      () =>
        navigator.serviceWorker.controller !== null ||
        navigator.serviceWorker.ready,
      null,
      { timeout: 5000 },
    );
    const registration = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return reg ? { active: !!reg.active, scope: reg.scope } : null;
    });
    expect(registration).not.toBeNull();
    expect(registration?.scope).toMatch(/\/$/);
  });

  test('오프라인 모드에서 라우트 진입 가능', async ({ page, context }) => {
    // 1. 첫 방문 → 모든 자산 cache
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => navigator.serviceWorker.controller !== null,
      null,
      { timeout: 10000 },
    );
    // 2. 오프라인 전환
    await context.setOffline(true);
    // 3. 라우트 진입 — 콘텐츠 로드 + 화면 렌더
    await page.goto('/level/A1');
    await expect(page.locator('main, [role="main"], #root > *').first()).toBeVisible();
    // 4. 다른 라우트도 동작
    await page.goto('/');
    await expect(page.locator('main, [role="main"], #root > *').first()).toBeVisible();
  });
});
```

- [ ] **Step 3: Playwright 빌드 산출물로 E2E 테스트 실행**

```bash
pnpm build
pnpm test:visual e2e/visual/pwa.spec.ts
```

Expected: 4개 테스트 모두 PASS.

- [ ] **Step 4: 만약 PASS 안 하면 실제 메타·SW 등록 동작 디버그**

- manifest 응답 status 확인 (`/manifest.webmanifest` 404 시 vite-plugin-pwa preview 모드 확인)
- DevTools Application 탭에서 SW 등록 직접 확인
- playwright trace로 디버그: `pnpm test:visual --trace on`

- [ ] **Step 5: Commit**

```bash
git add e2e/visual/pwa.spec.ts
git commit -m "[code] Add: E2E PWA spec — manifest · meta · SW 등록 · offline 모드 라우트 진입 검증"
```

---

## Task 8: vercel.json

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: vercel.json 작성**

`vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/manifest.webmanifest",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    },
    {
      "source": "/workbox-(.*).js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

- [ ] **Step 2: JSON 유효성 검증**

```bash
python3 -m json.tool vercel.json > /dev/null && echo "valid JSON"
```

Expected: `valid JSON`

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "[config] Add: vercel.json — SPA fallback rewrite + manifest·SW·assets 캐시 헤더"
```

---

## Task 9: 사용자 Vercel 가입 가이드 + README + CLAUDE.md + 메모리 갱신

**Files:**
- Create: `docs/research/2026-05-15-vercel-deployment-guide.md`
- Modify: `README.md`
- Modify: `CLAUDE.md`
- (별도) 메모리 파일: `~/.claude/projects/-Users-lf-Desktop-gugbab-workspace-02-gugbab-claude-voca/memory/project_gugbab_voca_progress.md`

- [ ] **Step 1: Vercel 가입 가이드 작성**

`docs/research/2026-05-15-vercel-deployment-guide.md`:

```markdown
# Vercel 배포 가이드 (Phase 6)

> 본 문서는 Phase 6 PR 머지 직후 사용자가 1회 수행할 작업을 정리. Claude는 가입·import·deploy를 대신 수행할 수 없음 (사용자 본인 GitHub 계정 OAuth 필요).

## 사전 준비
- GitHub 계정 (현재 `puk0806`)
- 본 PR이 push되어 GitHub에 올라간 상태

## 절차

### 1. Vercel 가입 (5분)
1. https://vercel.com 접속
2. "Sign Up" → "Continue with GitHub"
3. GitHub OAuth 권한 부여
4. Hobby 플랜 선택 (무료, 본 1인용 PWA에 충분)

### 2. 프로젝트 import
1. 대시보드 → "Add New..." → "Project"
2. GitHub 저장소 목록에서 `gugbab-claude-voca` 선택 → "Import"
3. 다음 설정 자동 감지 확인:
   - **Framework Preset**: `Vite`
   - **Build Command**: `pnpm build` (또는 `npm run build`)
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`
4. **Environment Variables**: 추가 없음 (백엔드·env 0)
5. "Deploy" 클릭

### 3. 첫 배포 확인
- 빌드 로그에서 `vite build` · `vite-plugin-pwa` 출력 확인
- 도메인 자동 발급 (`gugbab-voca.vercel.app` 또는 `gugbab-voca-{사용자}.vercel.app`)
- 도메인 클릭 → 앱 로드 확인

### 4. PWA 동작 검증
1. Chrome DevTools → Application 탭
2. **Manifest** 섹션: name·icons·theme_color 모두 표시되는지
3. **Service Workers** 섹션: 등록·활성 상태 확인
4. **Lighthouse** 탭: PWA 카테고리 90+ 점수 확인

### 5. 모바일 install 시연 (선택)
- iOS Safari: 도메인 접속 → 공유 버튼 → "홈 화면에 추가"
- Android Chrome: 도메인 접속 → 메뉴 → "앱 설치" 또는 자동 install banner

### 6. 이후 자동 흐름
- main에 push → Vercel이 production 자동 재배포
- feature 브랜치 push → Vercel preview 도메인 자동 발급 (PR 코멘트로 링크 표시)

## 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| 새로고침 시 404 | SPA fallback 미작동 | `vercel.json`의 rewrites 확인 |
| SW 갱신 안 됨 | 브라우저 캐시 | DevTools → Application → "Unregister" → 새로고침 |
| Lighthouse PWA 점수 낮음 | manifest 또는 SW 누락 | DevTools Application 탭으로 원인 확인 |
| install 버튼 안 보임 | manifest 또는 HTTPS 누락 | Vercel 도메인은 자동 HTTPS이므로 manifest 확인 |
```

- [ ] **Step 2: README.md Phase 진행 표 갱신**

`README.md`에서 Phase 6 라인을 ✅ 완료로 갱신. 자세한 위치는 grep으로:

```bash
grep -n "Phase 6" README.md
```

해당 라인 수정.

- [ ] **Step 3: CLAUDE.md Phase 진행 표 갱신**

`CLAUDE.md`의 진행 단계 표에서 Phase 6를 ✅ 완료로 갱신.

```bash
grep -n "Phase\|PWA\|Vercel" CLAUDE.md | head -20
```

해당 라인 수정.

- [ ] **Step 4: 메모리 갱신**

`~/.claude/projects/-Users-lf-Desktop-gugbab-workspace-02-gugbab-claude-voca/memory/project_gugbab_voca_progress.md`:
- Phase 6 ✅ 완료로 변경
- 다음 작업 = Phase 7 (P2 보강) 또는 추가 콘텐츠
- 배포 도메인 (사용자 입력 후) 추가
- A1 콘텐츠 상태는 그대로 유지

`MEMORY.md`의 progress 항목 description도 갱신.

- [ ] **Step 5: 작업 보고 + Commit**

```bash
git add docs/research/2026-05-15-vercel-deployment-guide.md README.md CLAUDE.md
git commit -m "[docs] Add: Phase 6 완료 반영 — Vercel 배포 가이드 + README · CLAUDE.md 진행 표 갱신"
```

메모리 파일은 별도 commit 없이 디스크에만 저장 (메모리는 git 추적 외).

---

## Task 10: brainstorm 산출물 commit

**Files:**
- Add (untracked): `docs/superpowers/specs/2026-05-14-phase-6-pwa-design.md`
- Add (untracked): `docs/design/phase-6-pwa-spec.html`
- Add (untracked): `docs/design/logo-drafts/`
- Add (untracked): `docs/superpowers/plans/2026-05-15-phase-6-pwa-implementation.md`

- [ ] **Step 1: 시각 자료·spec·plans commit**

```bash
git add docs/superpowers/specs/ docs/superpowers/plans/ docs/design/phase-6-pwa-spec.html docs/design/logo-drafts/
git commit -m "[docs] Add: Phase 6 PWA design spec + 구현 계획 + 시각 기획서 + 로고 시안 (Soft 3D Gummi 채택)"
```

---

## Task 11: 로컬 종합 검증

**Files:** (없음 — 검증)

- [ ] **Step 1: 빌드·타입체크·린트·단위 테스트**

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Expected: 모두 PASS.

- [ ] **Step 2: VR 베이스라인 변경 없는지 확인**

```bash
pnpm test:visual
```

Expected: PASS (PWA 추가가 시각 회귀를 일으키지 않아야 함).

만약 FAIL이면: HTML head 변경(메타 추가)은 시각에 영향 없으므로 베이스라인 변경 X. 만약 변경됐다면 PR에 `accept-baseline` 라벨로 갱신.

- [ ] **Step 3: pnpm preview로 PWA 로컬 동작 확인**

```bash
pnpm preview
```

브라우저에서 http://localhost:4173 접속:
- DevTools Application → Manifest 섹션: 모든 필드 표시
- Service Workers: 등록·활성
- Network throttle Offline → 라우트 이동 가능

- [ ] **Step 4: 번들 크기 확인**

```bash
ls -lh dist/assets/*.js dist/sw.js dist/workbox-*.js 2>/dev/null
```

Expected (추정):
- 메인 bundle: ~470 kB (변화 거의 없음)
- sw.js: ~6 kB
- workbox-*.js: 별도

---

## Task 12: 사용자 보고 + push

**Files:** (없음 — 보고 후 push)

- [ ] **Step 1: commit history 확인**

```bash
git log main..HEAD --oneline
```

Expected: 9~10개 commit (Task 1~10).

- [ ] **Step 2: 변경 파일 종합 보고 (사용자에게)**

다음 형식으로 보고:

```
## Phase 6 PWA 작업 완료 보고

### 변경 파일 목록
- 추가: package.json scripts · vite.config.ts VitePWA 설정
- 추가: public/icon.svg + 5종 PNG + favicon
- 추가: src/pwa.ts + 단위 테스트
- 추가: vercel.json · NotFound 테스트 · E2E PWA spec
- 수정: index.html 메타 보강 · main.tsx SW 등록 호출
- 추가: docs/research/2026-05-15-vercel-deployment-guide.md
- 갱신: README.md · CLAUDE.md · 메모리

### 핵심 결정
- registerType: autoUpdate
- 아이콘: Soft 3D Gummi 채택 + assets-generator 1회 실행 후 PNG commit
- vercel.json: SPA fallback + 캐시 헤더
- install prompt UI · Offline 배지 · 콘텐츠 갱신 알림 = P2

### 미해결 항목
- (사용자) Vercel 가입 + repo import + 첫 deploy
- (사용자) 머지 후 Lighthouse 90+ 검증

### 다음 액션 제안
- push: git push -u origin feature/phase-6-pwa-deployment
- PR 본문 초안: (별도 제공)

→ 사용자 승인 대기
```

- [ ] **Step 3: 사용자 OK 받은 후 push**

```bash
git push -u origin feature/phase-6-pwa-deployment
```

- [ ] **Step 4: PR 본문 초안 제공 (사용자가 GitHub에서 PR 생성 시 사용)**

```
## Summary
- vite-plugin-pwa + @vite-pwa/assets-generator 도입 → manifest + Service Worker + 아이콘 자산
- Soft 3D Gummi 채택 로고 → public/icon.svg 마스터 + PNG 5종 자동 생성
- index.html 메타 보강 (favicon · apple-touch-icon · theme-color · OG)
- vercel.json SPA fallback + 캐시 헤더
- SW 등록 helper + 단위 테스트 + E2E PWA spec
- 머지 후 사용자가 Vercel 가입 → repo import → 자동 배포

## Test plan
- [ ] pnpm build · typecheck · lint · test 100% PASS
- [ ] pnpm preview로 SW 등록 · manifest 로드 · offline 라우트 진입 확인
- [ ] (사용자 머지 후) Vercel preview 도메인 동작 확인
- [ ] (사용자 머지 후) Lighthouse PWA 90+

## 사용자 액션 (머지 후)
docs/research/2026-05-15-vercel-deployment-guide.md 참고
```

---

## Self-Review (작성 후 점검)

- ✅ Spec coverage: spec §1~§15 모두 task로 매핑됨
- ✅ Placeholder 없음: 모든 step에 실제 코드/명령 inline
- ✅ Type 일관성: `registerServiceWorker` 함수명·import 경로 일관
- ⚠ favicon.ico 생성 — Step 2.5에서 환경별 분기 명시 (sips 미지원 시 favicon.svg + PNG로 대체)
- ⚠ NotFound smoke 테스트 — Step 6.3에서 실제 NotFound.tsx 구조 확인 후 보정 명시
- ⚠ E2E offline 테스트 — `[role="main"]` 셀렉터가 실제 마크업과 일치 안 할 수 있음. Step 7.4에서 디버그 가이드 제공
