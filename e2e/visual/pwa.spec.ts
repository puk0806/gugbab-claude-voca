/**
 * PWA 동작 E2E 검증.
 *
 * - manifest/meta 정적 검증: dev 서버(playwright.config.ts의 기본 webServer)로 충분.
 * - SW 등록 + offline 라우트 진입 검증: vite-plugin-pwa의 devOptions.enabled가 false이므로
 *   dev 서버에서는 SW가 등록되지 않는다. prod 빌드 + preview 환경에서만 검증되며 사용자가
 *   `pnpm build && pnpm preview` 후 DevTools Application 탭으로 수동 확인한다 (DoD §14 참조).
 *
 * 따라서 본 spec은 *정적 메타 + manifest 응답*까지만 검증하고, SW/offline은 test.skip 처리하여
 * 회귀가 명시되도록 한다.
 */
import { expect, test } from '@playwright/test';

test.describe('PWA 메타 + manifest 응답', () => {
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
});

test.describe.skip(
  'PWA SW 등록 + offline (prod build + preview 환경 전용)',
  () => {
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
