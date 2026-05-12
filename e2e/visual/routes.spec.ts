/**
 * 라우트 페이지 시각 회귀 spec.
 *
 * 한 라우트당 한 스크린샷. 새 라우트가 등장하면 본 파일에 추가하고
 * PR에 `accept-baseline` 라벨을 붙여 베이스라인을 등록한다.
 *
 * 베이스라인 PNG는 `e2e/visual/__screenshots__/routes.spec.ts/` 아래에
 * 자동 저장된다. Linux(CI)에서만 캡처/갱신하며 로컬 변경분은 commit 금지.
 */
import { expect, test } from '@playwright/test';

test.describe('routes — visual regression', () => {
  test('home: 루트 진입 화면', async ({ page }) => {
    await page.goto('/');
    // 메인 컨텐츠가 마운트될 때까지 짧게 대기 (애니메이션 차단됨)
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('home.png', { fullPage: true });
  });
});
