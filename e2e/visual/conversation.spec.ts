/**
 * 대화 연습 기능 e2e — relay 를 page.route 로 mock (실 relay 불필요).
 *
 * 스크린샷 없음(기능 검증 전용) — VR 베이스라인과 무관하게 모든 환경에서 실행.
 * 적대적 사용자 시나리오 포함: XSS 성 응답 콘텐츠, relay 장애, 새로고침 영속성.
 */
import { expect, type Page, test } from '@playwright/test';

const SSE_HEADERS = { 'content-type': 'text/event-stream; charset=utf-8' };

function sseBody(events: ReadonlyArray<Record<string, unknown>>): string {
  return events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('');
}

async function mockRelay(page: Page, events: ReadonlyArray<Record<string, unknown>>) {
  await page.route('**/api/chat', async (route) => {
    await route.fulfill({ status: 200, headers: SSE_HEADERS, body: sseBody(events) });
  });
}

async function send(page: Page, text: string) {
  await page.getByRole('textbox', { name: '메시지 입력' }).fill(text);
  await page.getByRole('button', { name: '전송' }).click();
}

test.describe('conversation — 기능 (relay mock)', () => {
  test('정상 스트리밍: 응답이 말풍선으로 표시되고 완료 후 유지된다', async ({ page }) => {
    await mockRelay(page, [
      { type: 'chunk', text: 'Hello! ' },
      { type: 'chunk', text: 'How are you today?' },
      { type: 'done' },
    ]);
    await page.goto('/conversation');
    await send(page, 'Hi');
    await expect(page.getByText('Hello! How are you today?')).toBeVisible();
    // user 말풍선도 유지
    await expect(page.getByText('Hi', { exact: true })).toBeVisible();
  });

  test('적대적 응답: HTML/script 가 텍스트로만 렌더된다 (XSS 차단)', async ({ page }) => {
    const hostile =
      '<img src=x onerror="document.title=\'pwned\'"> <script>document.title="pwned"</script> try this';
    await mockRelay(page, [{ type: 'chunk', text: hostile }, { type: 'done' }]);
    await page.goto('/conversation');
    await send(page, 'hack me');
    // 원문 그대로 텍스트 노출, 마크업으로 주입되지 않음
    await expect(page.getByText(/try this/)).toBeVisible();
    expect(await page.locator('img[src="x"]').count()).toBe(0);
    expect(await page.title()).not.toBe('pwned');
  });

  test('적대적 입력: 사용자가 보낸 HTML 도 텍스트로만 렌더된다', async ({ page }) => {
    await mockRelay(page, [{ type: 'chunk', text: 'ok' }, { type: 'done' }]);
    await page.goto('/conversation');
    await send(page, '<b onmouseover=alert(1)>bold</b>');
    await expect(page.getByText('<b onmouseover=alert(1)>bold</b>')).toBeVisible();
    expect(await page.locator('.messages b, [class*="bubble"] b').count()).toBe(0);
  });

  test('relay 장애(HTTP 500): 에러 안내가 표시되고 입력은 다시 가능하다', async ({ page }) => {
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({ status: 500, body: 'boom' });
    });
    await page.goto('/conversation');
    await send(page, 'Hello');
    await expect(page.getByText(/응답을 가져오지 못했어요/)).toBeVisible();
    await expect(page.getByRole('textbox', { name: '메시지 입력' })).toBeEnabled();
  });

  test('SSE error 이벤트(서버리스 프록시 장애 형식)도 에러 처리된다', async ({ page }) => {
    await mockRelay(page, [{ type: 'error', message: '릴레이 서버 오류가 발생했어요' }]);
    await page.goto('/conversation');
    await send(page, 'Hello');
    await expect(page.getByText(/응답을 가져오지 못했어요/)).toBeVisible();
  });

  test('새로고침 후에도 대화 히스토리가 유지된다 (IndexedDB 영속)', async ({ page }) => {
    await mockRelay(page, [{ type: 'chunk', text: 'Nice to meet you!' }, { type: 'done' }]);
    await page.goto('/conversation');
    await send(page, 'Hello there');
    await expect(page.getByText('Nice to meet you!')).toBeVisible();

    await page.reload();
    await expect(page.getByText('Hello there')).toBeVisible();
    await expect(page.getByText('Nice to meet you!')).toBeVisible();
  });

  test('새 대화 버튼: 히스토리가 초기화되고 새로고침 후에도 비어 있다', async ({ page }) => {
    await mockRelay(page, [{ type: 'chunk', text: 'reply' }, { type: 'done' }]);
    await page.goto('/conversation');
    await send(page, 'first message');
    await expect(page.getByText('reply')).toBeVisible();

    await page.getByRole('button', { name: '새 대화' }).click();
    await expect(page.getByText(/영어로 인사해 보세요/)).toBeVisible();

    await page.reload();
    await expect(page.getByText(/영어로 인사해 보세요/)).toBeVisible();
    await expect(page.getByText('first message')).not.toBeVisible();
  });
});
