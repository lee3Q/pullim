import { test, expect } from '@playwright/test';
test.use({ serviceWorkers: 'block' });
test.setTimeout(30000);
for (const failure of ['get', 'set', 'onboarding'] as const) {
  test(`onboarding remains available when ${failure} storage access is denied`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    let profileReads = 0;
    await page.route('**/api/**', route => {
      if (new URL(route.request().url()).pathname === '/api/profile') profileReads++;
      return route.fulfill({ json: {} });
    });
    await page.addInitScript(({ failure }) => {
      const get = Storage.prototype.getItem;
      if (failure === 'onboarding') localStorage.setItem('pullim_user_id', 'synthetic-existing');
      Storage.prototype.getItem = function (key) {
        if ((failure === 'get' && key === 'pullim_user_id') || (failure === 'onboarding' && key === 'pullim_onboarding_done')) throw new DOMException('synthetic denied', 'SecurityError');
        return get.call(this, key);
      };
      if (failure === 'set') Storage.prototype.setItem = () => { throw new DOMException('synthetic denied', 'QuotaExceededError'); };
    }, { failure });
    await page.goto('/adventure/synthetic-storage?ui=classic', { waitUntil: 'domcontentloaded' });
    await expect(page.getByPlaceholder('이름 입력')).toBeVisible();
    await page.getByPlaceholder('이름 입력').fill('합성');
    await page.getByRole('button', { name: '확인', exact: true }).click();
    await expect(page.getByRole('button', { name: '반말', exact: true })).toBeVisible();
    expect(errors).toEqual([]);
    if (failure === 'onboarding') expect(profileReads).toBeGreaterThan(0);
    else expect(profileReads).toBe(0);
    if (failure === 'get') await page.screenshot({ path: testInfo.outputPath('onboarding-without-storage.png'), fullPage: true });
  });
}
