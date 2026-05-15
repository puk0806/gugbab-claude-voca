/**
 * PWA 동작 E2E 검증.
 *
 * 환경 분기:
 * - dev 서버(playwright.config.ts의 기본 webServer = `pnpm dev`)에서 검증 가능:
 *   index.html에 *우리가 직접 작성한* 정적 link/meta 존재 여부.
 * - prod 빌드 + preview 환경에서만 검증 가능 (test.describe.skip):
 *   /manifest.webmanifest 응답·SW 등록·offline 라우트 진입.
 *
 * 이유: vite-plugin-pwa의 `devOptions.enabled: false`로 설정되어 dev 서버에서는
 *   - manifest.webmanifest 미제공 (SPA fallback으로 index.html 응답)
 *   - SW 미등록 (HMR 충돌 방지)
 *
 * skip된 케이스는 머지 후 사용자가 Vercel 배포 + DevTools Application 탭으로 수동 검증
 * (DoD §14 + docs/research/2026-05-15-vercel-deployment-guide.md §4 참조).
 */
import { expect, test } from '@playwright/test';

test.describe('PWA 메타 (dev/prod 공통)', () => {
  test('index.html에 PWA 관련 link/meta가 모두 존재', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      'href',
      /manifest\.webmanifest/,
    );
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      'href',
      /apple-touch-icon-180x180\.png/,
    );
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      '#1976d2',
    );
    await expect(
      page.locator('meta[name="apple-mobile-web-app-capable"]'),
    ).toHaveAttribute('content', 'yes');
    await expect(
      page.locator('meta[name="apple-mobile-web-app-title"]'),
    ).toHaveAttribute('content', 'gugbab');
  });
});

test.describe.skip(
  'PWA manifest + SW + offline (prod build + preview 환경 전용)',
  () => {
    test('manifest.webmanifest 응답 + 필수 필드', async ({ page }) => {
      const response = await page.request.get('/manifest.webmanifest');
      expect(response.ok()).toBe(true);
      const manifest = await response.json();
      expect(manifest.name).toBe('gugbab-voca');
      expect(manifest.short_name).toBe('gugbab');
      expect(manifest.display).toBe('standalone');
      expect(manifest.theme_color).toBe('#1976d2');
      expect(manifest.background_color).toBe('#ffffff');
      expect(manifest.start_url).toBe('/');
      expect(manifest.icons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ sizes: '192x192' }),
          expect.objectContaining({ sizes: '512x512' }),
          expect.objectContaining({ purpose: 'maskable' }),
        ]),
      );
    });

    test('Service Worker 등록 + 활성화', async ({ page }) => {
      await page.goto('/');
      await page.waitForFunction(
        () => navigator.serviceWorker.controller !== null,
        null,
        { timeout: 10_000 },
      );
      const registration = await page.evaluate(async () => {
        const reg = await navigator.serviceWorker.getRegistration();
        return reg ? { active: !!reg.active, scope: reg.scope } : null;
      });
      expect(registration).not.toBeNull();
      expect(registration?.scope).toMatch(/\/$/);
    });

    test('오프라인 모드에서 라우트 진입 가능', async ({ page, context }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(
        () => navigator.serviceWorker.controller !== null,
        null,
        { timeout: 10_000 },
      );
      await context.setOffline(true);
      await page.goto('/level/A1');
      await expect(page.locator('#root > *').first()).toBeVisible();
    });
  },
);
