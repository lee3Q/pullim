import { test, expect } from '@playwright/test';

test('web sharing uses bounded wording and normalized result URL', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => {
      (window as unknown as { capturedShare: ShareData }).capturedShare = data;
    } });
  });
  await page.goto('/result?theme=bogus&type=quiet-strategist');
  await page.getByRole('button', { name: '친구에게 공유' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { capturedShare?: ShareData }).capturedShare)).toBeTruthy();
  const data = await page.evaluate(() => (window as unknown as { capturedShare: ShareData }).capturedShare);
  expect(data.title).toContain('실험적 유형 요약');
  expect(data.title).not.toMatch(/유형이래|undefined/);
  expect(data.text).toContain('진단이나 검증된 성격 평가, 행동 예측을 제공하지 않습니다.');
  const url = new URL(data.url!);
  expect(url.origin).toBe(new URL(page.url()).origin);
  expect(url.pathname).toBe('/result');
  expect(url.searchParams.get('theme')).toBe('adventure');
  expect(url.searchParams.get('type')).toBe('quiet-strategist');
  expect(errors).toEqual([]);
});

for (const mode of ['denied', 'missing']) {
  test(`copy failure is visible and a successful retry clears it: ${mode}`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(mode => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: mode === 'missing' ? undefined : {
        writeText: async () => { throw new Error('synthetic permission denied'); },
      } });
    }, mode);
    await page.goto('/result?theme=garden&type=quiet-strategist');
    await page.getByRole('button', { name: '링크 복사' }).click();
    await expect(page.locator('p[role=alert]')).toContainText('링크를 복사하지 못했습니다.');
    await expect(page.getByRole('button', { name: '복사됨!' })).toHaveCount(0);
    await page.locator('p[role=alert]').scrollIntoViewIfNeeded();
    if (mode === 'denied') await page.screenshot({path: testInfo.outputPath('copy-denied.png')});
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (value: string) => { (window as unknown as { copiedValue: string }).copiedValue = value; },
    } }));
    await page.getByRole('button', { name: '링크 복사' }).click();
    await expect(page.getByRole('button', { name: '복사됨!' })).toBeVisible();
    await expect(page.locator('p[role=alert]')).toHaveCount(0);
    const copied = await page.evaluate(() => (window as unknown as { copiedValue: string }).copiedValue);
    expect(new URL(copied).searchParams.get('theme')).toBe('garden');
    expect(errors).toEqual([]);
  });
}
