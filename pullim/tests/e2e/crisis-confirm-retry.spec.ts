import { test, expect } from '@playwright/test';
test.use({ serviceWorkers: 'block' });
test.setTimeout(30000);
for (const failure of ['network', 'http', 'json', 'held'] as const) {
  test(`safety confirmation ${failure} failure stays open, explains retry, and never unlocks early`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    let attempts = 0;
    let release: (() => void) | undefined;
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/ultimate/listen') return route.fulfill({ contentType: 'text/event-stream', body:
        'data: '+JSON.stringify({ crisis: true, text: '합성 확인 대기', policy: { riskState: 'awaiting_confirmation' } })+'\n\ndata: [DONE]\n\n' });
      if (path === '/api/ultimate/confirm-safety') {
        attempts++;
        if (attempts === 1) {
          if (failure === 'network') return route.abort('failed');
          if (failure === 'http') return route.fulfill({status:503,json:{}});
          if (failure === 'json') return route.fulfill({contentType:'application/json',body:'{broken'});
          return route.fulfill({json:{policy:{riskState:'awaiting_confirmation'}}});
        }
        await new Promise<void>(resolve => { release = resolve; });
        return route.fulfill({json:{policy:{riskState:'open'}}});
      }
      return route.fulfill({json:{}});
    });
    await page.goto('/garden/synthetic-retry?ui=classic', {waitUntil:'domcontentloaded'});
    await page.getByRole('main').getByRole('button').first().click();
    await expect(page.getByText('합성 확인 대기', {exact:true})).toBeVisible();
    const confirm = page.getByRole('button', {name:'지금은 안전합니다',exact:true});
    await confirm.click();
    await expect(page.getByRole('alert').filter({hasText:'확인을 완료하지 못했습니다.'})).toContainText('확인을 완료하지 못했습니다. 다시 시도해 주세요.');
    await expect(confirm).toBeEnabled();
    await expect(page.getByText('합성 확인 대기', {exact:true})).toBeVisible();
    await expect(page.getByRole('link', {name:'109 전화하기'})).toHaveAttribute('href','tel:109');
    if (failure === 'network') await page.screenshot({path:testInfo.outputPath('confirm-retry-error.png'),fullPage:true});
    await confirm.click();
    await expect(confirm).toBeDisabled();
    await expect(page.getByRole('alert').filter({hasText:'확인을 완료하지 못했습니다.'})).toHaveCount(0);
    await expect.poll(()=>attempts).toBe(2);
    expect(errors).toEqual([]);
    release!();
    await expect(page.getByText('합성 확인 대기', {exact:true})).toHaveCount(0);
    expect(attempts).toBe(2);
  });
}
