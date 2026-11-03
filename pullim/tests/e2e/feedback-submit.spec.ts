import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
for (const failure of ['rejected', 'network'] as const) {
  test(`feedback ${failure} preserves draft and retries before thanking`, async ({ page }, testInfo) => {
    let attempts = 0;
    const bodies: unknown[] = [];
    let release: (() => void) | undefined;
    await page.route('https://feedback-test.invalid/**', async route => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
      }
      expect(new URL(route.request().url()).pathname).toBe('/rest/v1/feedback');
      bodies.push(route.request().postDataJSON());
      attempts++;
      if (attempts === 1) {
        if (failure === 'network') return route.abort('failed');
        return route.fulfill({ status: 403, json: { code: '42501', message: 'synthetic rejection' } });
      }
      await new Promise<void>(resolve => { release = resolve; });
      return route.fulfill({ status: 201, json: null });
    });
    await page.route('**/api/**', route => route.fulfill({ json: {} }));
    await page.goto('/result?theme=garden&type=quiet-strategist');
    await page.getByRole('button', { name: '★', exact: true }).nth(3).click();
    const message = page.getByPlaceholder('UI, 결과, 경험 뭐든 자유롭게...');
    await message.fill('합성 피드백 초안');
    await page.getByRole('button', { name: '익명으로 보내기', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: '피드백을 보내지 못했습니다.' })).toBeVisible();
    await expect(page.getByText('감사합니다!', { exact: true })).toHaveCount(0);
    await expect(message).toHaveValue('합성 피드백 초안');
    await expect(page.getByRole('button', { name: '익명으로 보내기', exact: true })).toBeEnabled();
    if (failure === 'rejected') await message.scrollIntoViewIfNeeded();
    if (failure === 'rejected') await page.screenshot({ path: testInfo.outputPath('feedback-failure.png') });
    await page.getByRole('button', { name: '익명으로 보내기', exact: true }).click();
    await expect.poll(() => attempts).toBe(2);
    await expect(page.getByRole('button', { name: '전송 중...', exact: true })).toBeDisabled();
    await expect(page.getByText('감사합니다!', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('alert').filter({ hasText: '피드백을 보내지 못했습니다.' })).toHaveCount(0);
    expect(bodies[0]).toMatchObject({ rating: 4, message: '합성 피드백 초안' });
    expect(bodies[1]).toEqual(bodies[0]);
    release!();
    await expect(page.getByText('감사합니다!', { exact: true })).toBeVisible();
    await expect(message).toHaveCount(0);
  });
}
