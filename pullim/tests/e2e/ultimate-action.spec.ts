declare global { interface Window { __originalSetItem: typeof Storage.prototype.setItem } }
import { test, expect } from '@playwright/test';
test.use({ serviceWorkers: 'block' });
test.setTimeout(45000);
test.beforeEach(async ({page}) => page.setDefaultTimeout(8000));
// UI contract only. Synthetic API replies do not certify live model or safety behavior.
for (const theme of ['garden', 'strategy', 'adventure', 'stargazer', 'apocalypse']) {
  test(`${theme}: approved action is saved once and visible after navigation`, async ({ page }, testInfo) => {
    let actionCalls = 0;
    let denyAction = theme === "garden";
    await page.route('**/api/ultimate/**', async route => {
      const endpoint = route.request().url().split('/').pop();
      if (endpoint === 'listen') return route.fulfill({ contentType: 'text/event-stream', body:
        'data: '+JSON.stringify({ text: '합성 고민을 정리했어요.', listenSummary: '작은 테스트 계획', listenComplete: true })+'\n\ndata: [DONE]\n\n' });
      const replies: Record<string, unknown> = {
        research: { skipped: true },
        analyze: { analyses: [{ crystal: '금화', model: 'test', observation: '합성 관찰', insight: '작게 시작', risk: '낮음', question: '시작할까요?', latencyMs: 1 }], disagreements: [] },
        judge: { passed: true, issues: [] },
        conclude: { conclusion: { situationSummary: '합성 테스트 계획을 선택합니다.', options: [{ direction: '오늘 작은 테스트 한 개 작성하기', risk: '시간', reward: '확인' }], keyCrossroad: '작게 시작', userTendency: '' } },
        action: { policy: { status: 'executed' } },
      };
      if (endpoint === 'action') {
        actionCalls++;
        if (denyAction) return route.fulfill({status:409,json:{policy:{status:'blocked'}}});
      }
      return route.fulfill({ json: replies[endpoint!] ?? {} });
    });
    // Existing synthetic profile: onboarding is tested separately, not bypassed in product code.
    await page.addInitScript(() => {
      const dim = {value:0, observations:0, lastUpdated:'2026-11-03T00:00:00Z'};
      const profile = {approachStyle:dim,riskTolerance:dim,copingStyle:dim,decisionSpeed:dim,selfAwareness:dim,
        avgResponseTimeMs:0,engagementTrend:0,recommendationAcceptRate:0.5,totalSessions:1,totalObservations:0,
        userName:'합성',speechStyle:'casual',selectedTheme:'adventure'};
      localStorage.setItem('pullim_user_id','synthetic-profile');
      localStorage.setItem('pullim_onboarding_done','true');
      localStorage.setItem('pullim_user_profile',JSON.stringify({profile,sessionCount:1,lastSessionAt:'2026-11-03',lastSatisfaction:null,completedSessions:0}));
    });
    await page.route('**/api/profile?**', route => route.fulfill({json:{}}));
    await page.goto(`/${theme}/synthetic-${theme}?ui=classic`, {waitUntil:"domcontentloaded", timeout:20000});
    await expect(page.getByRole('main').getByRole('button').first()).toBeVisible({ timeout: 20000 });
    await page.getByRole('main').getByRole('button').first().click();
    await expect(page.getByRole('button', {name: /금화|재무 전문가/}).first()).toBeVisible({timeout:20000});
    
    await page.getByRole('button', {name:/금화|재무 전문가/}).first().click();
    await page.getByRole('button', {name:/나침반|진로 코치/}).first().click();
    await page.getByRole('button', {name:/거울|행동경제학자/}).first().click();
    await page.getByRole('button', {name:'확인',exact:true}).click();
    await expect(page.getByRole('button', {name:/금화|작게|시작/}).first()).toBeVisible({timeout:15000});
    await page.getByRole('button', {name:/金|금화/}).last().click();
    await page.getByRole('button', {name:/맞아|확신|정리가/}).first().click();
    await expect(page.getByText('합성 테스트 계획을 선택합니다.')).toBeVisible({timeout:15000});
    await page.getByRole('button', {name:/오늘 작은 테스트 한 개 작성하기/}).click();
    if(theme === 'garden') {
      // Denied policy must never create local action records.
      await page.getByRole('button', {name:'내일',exact:true}).click();
      await expect(page.getByRole('main').getByRole('alert')).toContainText('선택을 확정');
      expect(await page.evaluate(() => localStorage.getItem('pullim_action_history_v1'))).toBeNull();
      denyAction = false;
      // Approval followed by local quota failure must keep input/retry, not done.
      await page.evaluate(() => { window.__originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = () => {throw new Error('synthetic quota');}; });
      await page.getByRole('button', {name:'내일',exact:true}).click();
      await expect(page.getByRole('main').getByRole('alert')).toContainText('선택을 확정');
      await expect(page.getByRole('link', {name:'내 기록 보기'})).toHaveCount(0);
      await page.evaluate(() => { Storage.prototype.setItem = window.__originalSetItem; });
    }
    await page.getByRole('button', {name:'내일',exact:true}).click();
    await expect(page.getByRole('link', {name:'내 기록 보기'})).toBeVisible();
    expect(actionCalls).toBe(theme === "garden" ? 2 : 1);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pullim_action_history_v1') || '[]'));
    expect(saved).toHaveLength(1);
    expect(saved[0].action).toBe('오늘 작은 테스트 한 개 작성하기');
    if(theme === 'garden') await page.screenshot({path:testInfo.outputPath('ultimate-done-mobile.png'),fullPage:true});
    await page.getByRole('link', {name:'내 기록 보기'}).click();
    await expect(page.getByText('오늘 작은 테스트 한 개 작성하기')).toBeVisible();
    await page.reload();
    await expect(page.getByText('오늘 작은 테스트 한 개 작성하기')).toBeVisible();
  });
}
