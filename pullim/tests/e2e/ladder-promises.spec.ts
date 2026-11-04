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

const older={...record,id:'older',createdAt:1,trigger:'아침에',action:'오래된 약속 물 마시기'};
const newer={...record,id:'newer',createdAt:2,trigger:'저녁에',action:'최근 약속 책 읽기'};
test('multiple active promises can be selected without writing, keeping newest default',async({page},testInfo)=>{
  await page.addInitScript(values=>localStorage.setItem('pullim_promises',JSON.stringify(values)),[older,newer]);
  await page.goto('/adventure/synthetic?mode=ladder');
  const choice=page.getByLabel('확인할 약속',{exact:true});
  await expect(choice).toHaveValue('newer');
  const before=await page.evaluate(()=>localStorage.getItem('pullim_promises'));
  await choice.selectOption('older');
  await expect(page.getByText('→ 오래된 약속 물 마시기',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('pullim_promises'))).toBe(before);
  await page.screenshot({path:testInfo.outputPath('older-promise-selected.png'),fullPage:true});
  await page.getByRole('button',{name:'✓ 했어',exact:true}).click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('pullim_promises')!));
  expect(saved[0].status).toBe('completed');expect(saved[1]).toEqual(newer);
  await expect(page.getByText('대단한데. 기억하고 지켜봤어.')).toBeVisible();
  await expect(choice).toHaveCount(0);
});
test('selected older promise write failure keeps both active and retry updates only selection',async({page})=>{
  await page.addInitScript(values=>localStorage.setItem('pullim_promises',JSON.stringify(values)),[older,newer]);
  await page.goto('/adventure/synthetic?mode=ladder');
  await page.getByLabel('확인할 약속',{exact:true}).selectOption('older');
  await page.evaluate(()=>{const original=Storage.prototype.setItem;(window as any).restoreWrite=()=>{Storage.prototype.setItem=original};Storage.prototype.setItem=function(k,v){if(k==='pullim_promises')throw new Error('synthetic quota');return original.call(this,k,v)};});
  await page.getByRole('button',{name:'못했어',exact:true}).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('약속 확인을 저장하지 못했습니다.');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pullim_promises')!)) ).toEqual([older,newer]);
  await expect(page.getByLabel('확인할 약속',{exact:true})).toHaveValue('older');
  await page.evaluate(()=>(window as any).restoreWrite());
  await page.getByRole('button',{name:'못했어',exact:true}).click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('pullim_promises')!));
  expect(saved[0].status).toBe('failed');expect(saved[1]).toEqual(newer);
});
test('completed promises are not choices and a single active promise needs no selector',async({page})=>{
  await page.addInitScript(values=>localStorage.setItem('pullim_promises',JSON.stringify(values)),[{...older,status:'completed'},newer]);
  await page.goto('/adventure/synthetic?mode=ladder');
  await expect(page.getByText('지난번 약속 기억해?')).toBeVisible();
  await expect(page.getByLabel('확인할 약속',{exact:true})).toHaveCount(0);
  await expect(page.getByText('→ 최근 약속 책 읽기',{exact:true})).toBeVisible();
});
test('later applies only to selected older promise without changing other records',async({page})=>{
  await page.addInitScript(values=>localStorage.setItem('pullim_promises',JSON.stringify(values)),[older,newer]);
  await page.goto('/adventure/synthetic?mode=ladder');
  await page.getByLabel('확인할 약속',{exact:true}).selectOption('older');
  await page.getByRole('button',{name:'나중에 얘기할게',exact:true}).click();
  await expect(page.getByText('오늘은 어떻게 시작할까?')).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('pullim_promises')!));
  expect(saved[0].status).toBe('skipped');expect(saved[1]).toEqual(newer);
});
test('selection can change after failed write without recording either promise',async({page})=>{
  await page.addInitScript(values=>localStorage.setItem('pullim_promises',JSON.stringify(values)),[older,newer]);
  await page.goto('/adventure/synthetic?mode=ladder');
  await page.getByLabel('확인할 약속',{exact:true}).selectOption('older');
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('synthetic quota')};});
  await page.getByRole('button',{name:'✓ 했어',exact:true}).click();
  await expect(page.getByRole('main').getByRole('alert')).toBeVisible();
  await page.getByLabel('확인할 약속',{exact:true}).selectOption('newer');
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
  await expect(page.getByText('→ 최근 약속 책 읽기',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pullim_promises')!))).toEqual([older,newer]);
});
