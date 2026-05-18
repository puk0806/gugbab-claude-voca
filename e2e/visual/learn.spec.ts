/**
 * Learn 라우트 시각 회귀 spec.
 *
 * SRS 큐 합성은 두 가지 비결정 원인이 있다:
 *   1. `Math.random()` 기반 셔플 (신규 카드 풀)
 *   2. IndexedDB(Dexie) 진도 기반 due 카드 (이전 학습 상태)
 *
 * 본 spec은 두 원인을 모두 결정론적으로 만든다:
 *   - `page.addInitScript`로 `Math.random` 시드 고정 (xorshift32)
 *   - `indexedDB.deleteDatabase('gugbab')`으로 진도 초기화
 *
 * 따라서 매 실행마다 *동일한 첫 카드*가 표시되어 베이스라인 비교 가능.
 */
import { expect, type Page, test } from '@playwright/test';

/**
 * `page.addInitScript`로 주입할 시드 고정 + Dexie 초기화 스크립트.
 *
 * - Math.random을 xorshift32 의사난수로 교체 (seed=42)
 * - indexedDB.deleteDatabase('gugbab')로 이전 진도 제거
 */
const FIXTURE_SCRIPT = `
  (() => {
    // 1. Math.random 결정론 시드 (xorshift32)
    let state = 42;
    Math.random = () => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 4294967296;
    };

    // 2. IndexedDB 초기화 — 매 spec 실행 시 진도 제거
    try {
      const req = indexedDB.deleteDatabase('gugbab');
      req.onerror = () => {};
      req.onsuccess = () => {};
      req.onblocked = () => {};
    } catch {
      // ignore
    }
  })();
`;

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

async function applyFixture(page: Page): Promise<void> {
  await page.addInitScript(FIXTURE_SCRIPT);
}

test.describe('learn — visual regression (결정론 fixture)', () => {
  test.beforeEach(async ({ page }) => {
    await applyFixture(page);
  });

  test('learn-A1-word-flashcard', async ({ page }) => {
    await page.goto('/learn/A1/word/flashcard');
    await settle(page);
    // 플래시카드 첫 카드 영문이 표시될 때까지 대기 (loader + 첫 렌더)
    await page
      .locator('main')
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 });
    // 추가 안정화 — 폰트/이미지 로드 + 라우터 transition
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('learn-A1-word-flashcard.png', {
      fullPage: true,
    });
  });

  test('learn-A1-sentence-cloze', async ({ page }) => {
    await page.goto('/learn/A1/sentence/cloze');
    await settle(page);
    await page
      .locator('main')
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('learn-A1-sentence-cloze.png', {
      fullPage: true,
    });
  });
});
