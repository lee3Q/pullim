import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
test.setTimeout(30000);
for (const failure of ['none', 'get-id', 'set-id', 'set-profile', 'set-selections', 'existing-id'] as const) {
  test(`home discovery reaches result despite ${failure} storage failure and can retry`, async ({ page }, info) => {
    const errors: string[] = [];
    const saves: { userId: string; profile: unknown; selections: unknown[] }[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/api/**', route => {
      if (new URL(route.request().url()).pathname === '/api/discovery-selections') saves.push(route.request().postDataJSON());
      return route.fulfill({ json: {} });
    });
    await page.addInitScript(failure => {
      const get = Storage.prototype.getItem;
      const set = Storage.prototype.setItem;
      if (failure === 'existing-id') localStorage.setItem('pullim_user_id', 'synthetic-existing-id');
      const state = window as typeof window & { syntheticStorageRestored?: boolean };
      Storage.prototype.getItem = function (key) {
        if (!state.syntheticStorageRestored && failure === 'get-id' && key === 'pullim_user_id') throw new DOMException('synthetic denied', 'SecurityError');
        return get.call(this, key);
      };
      Storage.prototype.setItem = function (key, value) {
        const denied = ((failure === 'set-id' || failure === 'existing-id') && key === 'pullim_user_id') || (failure === 'set-profile' && key === 'pullim_user_profile') || (failure === 'set-selections' && key === 'pullim_discovery');
        if (!state.syntheticStorageRestored && denied) throw new DOMException('synthetic denied', 'QuotaExceededError');
        return set.call(this, key, value);
      };
    }, failure);
    await page.goto('/');
    await page.locator('button.rpg-panel-light:has-text("전략실")').first().click();
    await page.getByRole('button', { name: '🔮 먼저 파악해줘', exact: true }).click();
    await page.getByRole('button', { name: '출발', exact: true }).click();
    for (let n = 0; n < 10; n++) {
      const choices = page.locator('main button').filter({ has: page.locator('span.text-lg') });
      await choices.first().click();
      if (n < 9) await expect(page.locator('main')).toContainText(`${n + 2}/`);
    }
    await page.getByRole('button', { name: '여기서 시작하기', exact: true }).click();
    await expect(page.getByRole('button', { name: '대화 시작하기', exact: true })).toBeVisible();
    await expect(page.getByText('당신의 이야기를 읽고 있어요...', { exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
    if (failure !== 'none' && failure !== 'existing-id') {
      await expect(page.getByRole('alert').filter({ hasText: '이 기기 저장을 끝내지 못했습니다.' })).toBeVisible();
      expect(saves).toHaveLength(0);
      await page.getByRole('button', { name: '기기 저장 다시 시도', exact: true }).click();
      await expect(page.getByRole('alert').filter({ hasText: '이 기기 저장을 끝내지 못했습니다.' })).toBeVisible();
      expect(saves).toHaveLength(0);
      if (failure === 'get-id') await page.screenshot({ path: info.outputPath('discovery-storage-warning.png'), fullPage: true });
      await page.evaluate(() => { (window as typeof window & { syntheticStorageRestored?: boolean }).syntheticStorageRestored = true; });
      await page.getByRole('button', { name: '기기 저장 다시 시도', exact: true }).evaluate(button => {
        (button as HTMLButtonElement).click();
        (button as HTMLButtonElement).click();
        (button as HTMLButtonElement).click();
      });
      await expect(page.getByRole('button', { name: '기기 저장 다시 시도', exact: true })).toHaveCount(0);
    }
    await expect.poll(() => saves.length).toBe(1);
    const stored = await page.evaluate(() => ({ id: localStorage.getItem('pullim_user_id'), profile: JSON.parse(localStorage.getItem('pullim_user_profile')!), selections: JSON.parse(localStorage.getItem('pullim_discovery')!) }));
    expect(stored.id).toBeTruthy();
    if (failure === 'existing-id') expect(stored.id).toBe('synthetic-existing-id');
    expect(stored.id).toBe(saves[0].userId);
    expect(stored.profile.profile).toEqual(saves[0].profile);
    expect(stored.selections).toEqual(saves[0].selections);
    expect(stored.selections).toHaveLength(10);
    await page.getByRole('button', { name: '대화 시작하기', exact: true }).click();
    await expect(page).toHaveURL(/\/strategy\//);
    expect(errors).toEqual([]);
  });
}
