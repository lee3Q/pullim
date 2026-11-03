import {test,expect} from '@playwright/test';
for(const crisis of [false,true]){
  test(`summary preserves byte-split ${crisis?'crisis notice':'Korean text'}`,async({page},testInfo)=>{
    await page.route('**/api/**',route=>route.fulfill({status:200,contentType:'application/json',body:'{}'}));
    await page.addInitScript(({crisis})=>{
      const original=window.fetch;
      window.fetch=async(input,init)=>{
        if(String(input)==='/api/ultimate/listen' && String(init?.body).includes('[SESSION_SUMMARY_MODE]')){
          const payload=crisis?{crisis:true,message:'합성 중지 안내',policy:{riskState:'awaiting_confirmation'}}:{text:'네트워크 분할에도 남는 합성 요약'};
          const bytes=new TextEncoder().encode('data: '+JSON.stringify(payload)+'\n\ndata: [DONE]\n\n');let offset=0;
          return new Response(new ReadableStream({pull(controller){if(offset<bytes.length)controller.enqueue(bytes.slice(offset,++offset));else controller.close()}}),{status:200,headers:{'Content-Type':'text/event-stream'}});
        }
        return original(input,init);
      };
    },{crisis});
    await page.goto('/adventure/synthetic?mode=ladder');
    await page.getByRole('button',{name:/직접 말할게/}).click();
    const input=page.getByRole('textbox',{name:'편하게 말해봐...'});
    await input.fill('합성 테스트 고민');
    await page.getByRole('button',{name:'↑',exact:true}).click();
    await expect(page.getByRole('button',{name:'오늘은 여기까지',exact:true})).toBeEnabled();
    await page.getByRole('button',{name:'오늘은 여기까지',exact:true}).click();
    if(crisis){
      await expect(page.getByText('합성 중지 안내')).toBeVisible();
      await expect(page.getByRole('button',{name:'약속할게',exact:true})).toHaveCount(0);
      await page.screenshot({path:testInfo.outputPath('summary-crisis.png'),fullPage:true});
      await page.getByRole('button',{name:'닫기',exact:true}).click();
      await expect(page.getByText('합성 중지 안내')).toHaveCount(0);
      await expect(page.getByRole('button',{name:'오늘은 여기까지',exact:true})).toBeEnabled();
      await expect(input).toBeEnabled();
    }else{
      await page.getByRole('button',{name:'닫기',exact:true}).click({timeout:10000});
      await expect(page.getByText('네트워크 분할에도 남는 합성 요약')).toBeVisible();
      await expect(page.getByText('오늘 이야기를 나눴어.')).toHaveCount(0);
      await page.screenshot({path:testInfo.outputPath('summary-split-text.png'),fullPage:true});
    }
  });
}
