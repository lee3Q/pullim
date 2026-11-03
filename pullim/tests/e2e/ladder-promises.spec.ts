import {test,expect} from '@playwright/test';
const record={id:'synthetic-promise',createdAt:1,sessionTheme:'모험가',trigger:'테스트할 때',action:'작은 테스트 작성하기',status:'active'};
test.beforeEach(async({page})=>{
  await page.route('**/api/**', route=>route.fulfill({status:200,contentType:'application/json',body:'{}'}));
});
test('Ladder corrupt promise storage stays unchanged and retry recovers without crashing',async({page},testInfo)=>{
  await page.addInitScript(()=>localStorage.setItem('pullim_promises','{partial'));
  await page.goto('/adventure/synthetic?mode=ladder');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('약속 기록을 읽지 못했습니다.');
  expect(await page.evaluate(()=>localStorage.getItem('pullim_promises'))).toBe('{partial');
  await page.screenshot({path:testInfo.outputPath('promise-read-error.png'),fullPage:true});
  await page.evaluate(value=>localStorage.setItem('pullim_promises',JSON.stringify([value])),record);
  await page.getByRole('button',{name:'다시 시도',exact:true}).click();
  await expect(page.getByText('지난번 약속 기억해?')).toBeVisible();
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
});
test('Ladder failed confirmation keeps active promise and retries before showing success',async({page},testInfo)=>{
  await page.addInitScript(value=>localStorage.setItem('pullim_promises',JSON.stringify([value])),record);
  await page.goto('/adventure/synthetic?mode=ladder');
  await expect(page.getByText('지난번 약속 기억해?')).toBeVisible();
  await page.evaluate(()=>{const write=Storage.prototype.setItem; (window as any).restorePromiseWrite=()=>{Storage.prototype.setItem=write}; Storage.prototype.setItem=function(key,value){if(key==='pullim_promises')throw new Error('synthetic quota');return write.call(this,key,value)};});
  await page.getByRole('button',{name:'✓ 했어',exact:true}).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('약속 확인을 저장하지 못했습니다.');
  await expect(page.getByText('대단한데. 기억하고 지켜봤어.')).toHaveCount(0);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pullim_promises')!)[0].status)).toBe('active');
  await page.screenshot({path:testInfo.outputPath('promise-write-error.png'),fullPage:true});
  await page.evaluate(()=>(window as any).restorePromiseWrite());
  await page.getByRole('button',{name:'✓ 했어',exact:true}).click();
  await expect(page.getByText('대단한데. 기억하고 지켜봤어.')).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pullim_promises')!)[0].status)).toBe('completed');
});
test('Ladder can continue without changing corrupt promise storage',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('pullim_promises','{partial'));
  await page.goto('/adventure/synthetic?mode=ladder');
  await page.getByRole('button',{name:'약속 확인 없이 계속',exact:true}).click();
  await expect(page.getByText('오늘은 어떻게 시작할까?')).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('pullim_promises'))).toBe('{partial');
});
test('Ladder summary does not claim a promise was saved after quota failure and retry saves once',async({page},testInfo)=>{
  await page.route('**/api/ultimate/listen',route=>route.fulfill({status:200,contentType:'text/event-stream',body:'data: '+JSON.stringify({text:'[SUMMARY]합성 테스트 요약[/SUMMARY][WRAP_SUGGEST]'})+'\n\ndata: [DONE]\n\n'}));
  await page.goto('/adventure/synthetic?mode=ladder');
  await page.getByRole('button',{name:/직접 말할게/}).click();
  await page.getByRole('button',{name:'오늘은 여기까지',exact:true}).click();
  await page.getByRole('button',{name:'닫기',exact:true}).click({timeout:10000});
  await expect(page.getByRole('button',{name:'약속할게',exact:true})).toBeVisible();
  await page.evaluate(()=>{const write=Storage.prototype.setItem;(window as any).restorePromiseWrite=()=>{Storage.prototype.setItem=write};Storage.prototype.setItem=function(key,value){if(key==='pullim_promises')throw new Error('synthetic quota');return write.call(this,key,value)};});
  await page.getByRole('button',{name:'약속할게',exact:true}).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('약속을 저장하지 못했습니다.');
  await expect(page.getByText('기억해뒀어. 다음에 확인할게.')).toHaveCount(0);
  expect(await page.evaluate(()=>localStorage.getItem('pullim_promises'))).toBeNull();
  await page.screenshot({path:testInfo.outputPath('promise-summary-write-error.png'),fullPage:true});
  await page.evaluate(()=>(window as any).restorePromiseWrite());
  await page.getByRole('button',{name:'약속할게',exact:true}).click();
  await expect(page.getByText('기억해뒀어. 다음에 확인할게.')).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pullim_promises')!).length)).toBe(1);
});

test('Ladder failed skip does not advance, but explicit unsaved continuation is available',async({page})=>{
  await page.addInitScript(value=>localStorage.setItem('pullim_promises',JSON.stringify([value])),record);
  await page.goto('/adventure/synthetic?mode=ladder');
  await expect(page.getByText('지난번 약속 기억해?')).toBeVisible();
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('synthetic quota')};});
  await page.getByRole('button',{name:'나중에 얘기할게',exact:true}).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('약속 확인을 저장하지 못했습니다.');
  await expect(page.getByText('오늘은 어떻게 시작할까?')).toHaveCount(0);
  await page.getByRole('button',{name:'확인 저장 없이 계속',exact:true}).click();
  await expect(page.getByText('오늘은 어떻게 시작할까?')).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pullim_promises')!)[0].status)).toBe('active');
});
