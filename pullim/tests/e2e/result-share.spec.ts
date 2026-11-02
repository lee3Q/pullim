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
