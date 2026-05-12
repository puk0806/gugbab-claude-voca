/**
 * 라우트 페이지 시각 회귀 spec.
 *
 * 한 라우트당 한 스크린샷. 새 라우트가 등장하면 본 파일에 추가하고
 * PR에 `accept-baseline` 라벨을 붙여 베이스라인을 등록한다.
 *
 * 베이스라인 PNG는 `e2e/visual/__screenshots__/routes.spec.ts/` 아래에
 * 자동 저장된다. Linux(CI)에서만 캡처/갱신하며 로컬 변경분은 commit 금지.
 *
 * 학습 화면(`/learn/...`)은 SRS 큐 합성이 비결정적이라 본 spec에서 제외.
 * 추후 결정론적 fixture seed 도입 후 별도 spec 파일에 추가한다.
 */
import { expect, type Page, test } from '@playwright/test';

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

test.describe('routes — visual regression', () => {
  test('home', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expect(page).toHaveScreenshot('home.png', { fullPage: true });
  });

  test('level-A1', async ({ page }) => {
    await page.goto('/level/A1');
    await settle(page);
    await expect(page).toHaveScreenshot('level-A1.png', { fullPage: true });
  });

  test('level-A1-word-mode', async ({ page }) => {
    await page.goto('/level/A1/word');
    await settle(page);
    await expect(page).toHaveScreenshot('level-A1-word-mode.png', { fullPage: true });
  });

  test('level-A1-sentence-mode', async ({ page }) => {
    await page.goto('/level/A1/sentence');
    await settle(page);
    await expect(page).toHaveScreenshot('level-A1-sentence-mode.png', { fullPage: true });
  });

  test('vocabulary-A1-word', async ({ page }) => {
    await page.goto('/vocabulary/A1/word');
    await settle(page);
    // 단어장은 Dexie 로드 + 검색박스 표시까지 대기
    await page.getByRole('searchbox').waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('vocabulary-A1-word.png', { fullPage: true });
  });

  test('vocabulary-A1-sentence', async ({ page }) => {
    await page.goto('/vocabulary/A1/sentence');
    await settle(page);
    await page.getByRole('searchbox').waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('vocabulary-A1-sentence.png', { fullPage: true });
  });
});
