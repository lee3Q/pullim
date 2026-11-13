import { test, expect, type Page } from '@playwright/test';

test.skip(process.env.PULLIM_AUTH_FIXTURE !== '1', 'Use playwright.session-save.config.ts with synthetic Supabase configuration');
const userA = '00000000-0000-4000-8000-000000000001';
const userB = '00000000-0000-4000-8000-000000000002';
const summary = '합성 계정 저장 테스트 요약';

async function fixture(page: Page, signedIn = true) {
  await page.route('**/api/**', route => route.fulfill({status:200,contentType:'application/json',body:'{}'}));
  await page.addInitScript(({userA,summary,signedIn})=>{
    const session={access_token:'synthetic-a',refresh_token:'synthetic-refresh',token_type:'bearer',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,user:{id:userA,email:'synthetic@example.invalid',aud:'authenticated',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'}};
    if(signedIn) localStorage.setItem('sb-127-auth-token',JSON.stringify(session));
    else localStorage.removeItem('sb-127-auth-token');
    const original=window.fetch;
    window.fetch=async(input,init)=>{
      if(String(input).startsWith('http://127.0.0.1:3999/')) return new Response(JSON.stringify({id:userA,aud:'authenticated',email:'synthetic@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'}),{headers:{'Content-Type':'application/json'}});
      if(String(input)==='/api/ultimate/listen' && String(init?.body).includes('[SESSION_SUMMARY_MODE]')){
        return new Response('data: '+JSON.stringify({text:summary})+'\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
      }
      return original(input,init);
    };
  },{userA,summary,signedIn});
}
async function finish(page: Page) {
  await page.goto('/adventure/synthetic-auth?mode=ladder');
  await page.getByRole('button',{name:/직접 말할게/}).click();
  await page.getByRole('textbox',{name:'편하게 말해봐...'}).fill('계정 저장을 위한 가상 고민');
  await page.getByRole('button',{name:'↑',exact:true}).click();
  await page.getByRole('button',{name:'오늘은 여기까지',exact:true}).click();
  await page.getByRole('button',{name:'닫기',exact:true}).click({timeout:10000});
  await expect(page.getByText(summary,{exact:true})).toBeVisible();
}

test('failed account save keeps summary and retry sends same operation once',async({page},info)=>{
  await fixture(page);
  const saves: {body:unknown;header:string|undefined}[]=[];
  let release: (()=>void)|undefined;
  await page.route('**/api/session-save',async route=>{
    saves.push({body:route.request().postDataJSON(),header:route.request().headers().authorization});
    if(saves.length===1) return route.fulfill({status:500,contentType:'application/json',body:'{"error":"synthetic rejection"}'});
    await new Promise<void>(r=>{release=r;});
    return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true,"storage":"supabase"}'});
  });
  await finish(page);
  await expect(page.getByRole('alert').filter({hasText:'계정에 요약이 저장됐는지'})).toContainText('계정에 요약이 저장됐는지 확인하지 못했습니다.');
  await page.screenshot({path:info.outputPath('account-save-failed.png'),fullPage:true});
  await page.getByRole('button',{name:'계정 저장 다시 시도',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('계정에 요약을 저장하고 있습니다.');
  await expect(page.getByRole('button',{name:'계정 저장 다시 시도',exact:true})).toHaveCount(0);
  await expect.poll(()=>Boolean(release)).toBe(true);
  release!();
  await expect(page.getByRole('status')).toHaveText('계정에 요약을 저장했습니다.');
  expect(saves).toHaveLength(2);expect(saves[1]).toEqual(saves[0]);
  expect(saves[0].header).toBe('Bearer synthetic-a');
  await expect(page.getByText(summary,{exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath('account-save-retried.png'),fullPage:true});
});

test('account switch blocks retry until original account is restored',async({page},info)=>{
  await fixture(page);
  let saves=0;
  await page.route('**/api/session-save',route=>{saves++;return route.fulfill({status:saves===1?500:200,contentType:'application/json',body:saves===1?'{}':'{"ok":true,"storage":"supabase"}'});});
  await finish(page);
  await expect(page.getByRole('alert').filter({hasText:'계정에 요약이 저장됐는지'})).toBeVisible();
  await page.evaluate(userB=>{const v=JSON.parse(localStorage.getItem('sb-127-auth-token')!);v.user.id=userB;v.access_token='synthetic-b';localStorage.setItem('sb-127-auth-token',JSON.stringify(v));},userB);
  await page.getByRole('button',{name:'계정 저장 다시 시도',exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:'계정에 요약이 저장됐는지'})).toBeVisible();expect(saves).toBe(1);
  await expect(page.getByText(summary,{exact:true})).toBeVisible();
  await page.evaluate(userA=>{const v=JSON.parse(localStorage.getItem('sb-127-auth-token')!);v.user.id=userA;v.access_token='synthetic-a';localStorage.setItem('sb-127-auth-token',JSON.stringify(v));},userA);
  await page.getByRole('button',{name:'계정 저장 다시 시도',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('계정에 요약을 저장했습니다.');expect(saves).toBe(2);
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:info.outputPath('account-save-desktop.png'),fullPage:true});
});

test('expired session cannot retry into an anonymous save',async({page})=>{
  await fixture(page);
  let saves=0;
  await page.route('**/api/session-save',route=>{saves++;return route.fulfill({status:401,contentType:'application/json',body:'{}'});});
  await finish(page);
  await expect(page.getByRole('alert').filter({hasText:'계정에 요약이 저장됐는지'})).toBeVisible();
  await page.evaluate(()=>localStorage.removeItem('sb-127-auth-token'));
  await page.getByRole('button',{name:'계정 저장 다시 시도',exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:'계정에 요약이 저장됐는지'})).toBeVisible();
  expect(saves).toBe(1);
  await expect(page.getByText(summary,{exact:true})).toBeVisible();
});

test('guest completion never claims account save or sends a record',async({page})=>{
  await fixture(page,false);
  let saves=0;
  await page.route('**/api/session-save',route=>{saves++;return route.fulfill({status:500,body:'{}'});});
  await finish(page);
  expect(saves).toBe(0);
  await expect(page.getByRole('button',{name:'계정 저장 다시 시도',exact:true})).toHaveCount(0);
  await expect(page.getByText('계정에 요약을 저장했습니다.',{exact:true})).toHaveCount(0);
});
