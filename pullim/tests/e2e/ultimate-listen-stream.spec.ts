import { test, expect } from '@playwright/test';
// Transport/UI contract only: synthetic chunks do not test live model or safety classification.
test.use({ serviceWorkers: 'block' });
test.setTimeout(45000);
for (const theme of ['garden', 'strategy', 'adventure', 'stargazer', 'apocalypse']) {
  for (const crisis of [false, true]) {
    test(`${theme}: byte-split listen preserves ${crisis ? 'crisis notice' : 'Korean response'}`, async ({ page }, testInfo) => {
      await page.route('**/api/**', route => route.fulfill({ json: {} }));
      await page.addInitScript(({ crisis }) => {

      const dim = {value:0, observations:0, lastUpdated:'2026-11-03T00:00:00Z'};
      const profile = {approachStyle:dim,riskTolerance:dim,copingStyle:dim,decisionSpeed:dim,selfAwareness:dim,
        avgResponseTimeMs:0,engagementTrend:0,recommendationAcceptRate:0.5,totalSessions:1,totalObservations:0,
        userName:'합성',speechStyle:'casual',selectedTheme:'adventure'};
      localStorage.setItem('pullim_user_id','synthetic-profile');
      localStorage.setItem('pullim_onboarding_done','true');
      localStorage.setItem('pullim_user_profile',JSON.stringify({profile,sessionCount:1,lastSessionAt:'2026-11-03',lastSatisfaction:null,completedSessions:0}));
        const original = window.fetch;
        window.fetch = async (input, init) => {
          if (String(input) === '/api/ultimate/listen') {
            const payload = crisis
              ? { crisis: true, text: '합성 분할 중지 안내', hotlines: [{ name: '합성 상담', number: '109' }], policy: { riskState: 'awaiting_confirmation' } }
              : { text: '합성 분할 응답을 정확히 보존합니다.' };
            const bytes = new TextEncoder().encode('data: ' + JSON.stringify(payload) + '\r\n\r\ndata: [DONE]\r\n\r\n');
            let offset = 0;
            return new Response(new ReadableStream({ pull(controller) {
              if (offset < bytes.length) controller.enqueue(bytes.slice(offset, ++offset));
              else controller.close();
            } }), { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
          }
          return original(input, init);
        };
      }, { crisis });
      await page.goto(`/${theme}/synthetic-stream?ui=classic`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('main').getByRole('button').first().click();
      await expect(page.getByText(crisis ? '합성 분할 중지 안내' : '합성 분할 응답을 정확히 보존합니다.', { exact: true })).toBeVisible({ timeout: 10000 });
      if (crisis) {
        await expect(page.getByRole('button', { name: '닫기', exact: true })).toBeEnabled();
      } else {
        await expect(page.getByRole('button', { name: /직접 말하기|직접 입력/, exact: true })).toBeEnabled();
      }
      if (theme === 'garden') await page.screenshot({ path: testInfo.outputPath(crisis ? 'listen-crisis.png' : 'listen-korean.png'), fullPage: true });
    });
  }
}
