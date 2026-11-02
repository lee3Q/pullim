import { test, expect } from '@playwright/test';

test('metadata describes an experimental reflection tool without blocking zoom', async ({ page }) => {
  await page.goto('/history');
  await expect(page).toHaveTitle('풀림 - 고민 정리와 작은 행동');
  const description = '고민의 사실과 가정을 나누고, 선택지를 살펴본 뒤 작은 행동을 직접 고르는 실험 도구입니다. 진단이나 행동 예측을 제공하지 않습니다.';
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
    await expect(page.locator(selector)).toHaveAttribute('content', description);
  }
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
    await expect(page.locator(selector)).toHaveAttribute('content', '풀림 - 고민 정리와 작은 행동');
  }
  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(viewport).toContain('width=device-width');
  expect(viewport).toContain('initial-scale=1');
  expect(viewport).not.toMatch(/user-scalable\s*=\s*(?:no|0|false)|maximum-scale\s*=\s*1(?:\s|,|$)/i);
});

for (const query of ['', '?type=unknown', '?type=quiet-strategist&theme=garden']) {
  test(`result metadata keeps claims bounded: ${query || 'missing type'}`, async ({ page }) => {
    await page.goto(`/result${query}`);
    const title = await page.title();
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(title).not.toMatch(/3분|유형이래|undefined/);
    expect(description).toContain('실험');
    expect(description).toContain('진단이나');
    expect(description).toContain('행동 예측을 제공하지 않습니다.');
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
      await expect(page.locator(selector)).toHaveAttribute('content', title);
    }
    for (const selector of ['meta[property="og:description"]', 'meta[name="twitter:description"]']) {
      await expect(page.locator(selector)).toHaveAttribute('content', description!);
    }
  });
}
