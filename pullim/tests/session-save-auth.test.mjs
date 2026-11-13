import assert from 'node:assert/strict';
import { test } from 'node:test';
import http from 'node:http';
import { getSessionSaveAccess } from '../src/lib/supabase/session-save-auth.ts';
import { saveCompletedSession } from '../src/lib/supabase/session-save-client.ts';

const a = '00000000-0000-4000-8000-000000000001';
const b = '00000000-0000-4000-8000-000000000002';

test('session-save request authentication uses verified identity and isolated clients', async t => {
  const before = {url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY};
  const requests=[];
  const server=http.createServer((req,res)=>{
    const token=req.headers.authorization;
    requests.push({path:req.url,token});
    if(req.url==='/auth/v1/user'){
      if(token==='Bearer synthetic-expired') {res.writeHead(401,{'content-type':'application/json'});res.end(JSON.stringify({message:'expired',code:'bad_jwt'}));return;}
      if(token==='Bearer synthetic-outage') {res.writeHead(503,{'content-type':'application/json'});res.end(JSON.stringify({message:'outage'}));return;}
      const id=token==='Bearer synthetic-user-b'?b:a;
      res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({id,aud:'authenticated',email:'synthetic@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'}));return;
    }
    res.writeHead(201,{'content-type':'application/json'});res.end('{}');
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  process.env.NEXT_PUBLIC_SUPABASE_URL=`http://127.0.0.1:${server.address().port}`;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='synthetic-anon-key';
  try{
    await t.test('missing/malformed bearer fails closed without remote request',async()=>{
      for(const header of [null,'Basic synthetic','Bearer ','Bearer a b']){
        const value=await getSessionSaveAccess(header,a);assert.equal(value.kind,'error');assert.equal(value.status,401);
      }
      assert.equal(requests.length,0);
    });
    await t.test('body identity mismatch rejected after server verification',async()=>{
      const value=await getSessionSaveAccess('Bearer synthetic-user-a',b);assert.equal(value.status,403);
    });
    await t.test('expired auth is401 and an auth service outage is503',async()=>{
      assert.equal((await getSessionSaveAccess('Bearer synthetic-expired',a)).status,401);
      assert.equal((await getSessionSaveAccess('Bearer synthetic-outage',a)).status,503);
    });
    await t.test('concurrent accounts do not share identity or downstream authorization',async()=>{
      const [one,two]=await Promise.all([getSessionSaveAccess('Bearer synthetic-user-a',a),getSessionSaveAccess('Bearer synthetic-user-b',b)]);
      assert.equal(one.kind,'authenticated');assert.equal(two.kind,'authenticated');assert.notEqual(one.client,two.client);
      assert.equal(one.userId,a);assert.equal(two.userId,b);
      await Promise.all([one.client.from('sessions').insert({user_id:one.userId}),two.client.from('sessions').insert({user_id:two.userId})]);
      const inserts=requests.filter(r=>r.path==='/rest/v1/sessions');
      assert.deepEqual(inserts.map(r=>r.token).sort(),['Bearer synthetic-user-a','Bearer synthetic-user-b']);
    });
    await t.test('unconfigured demo retains local-only result',async()=>{
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      assert.deepEqual(await getSessionSaveAccess(null,a),{kind:'local'});
    });
  }finally{
    await new Promise(r=>server.close(r));
    if(before.url===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=before.url;
    if(before.key===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=before.key;
  }
});

test('session-save browser helper preserves account and fixed retry payload',async t=>{
  const payload={id:'00000000-0000-4000-8000-000000000003',session_id:'synthetic',theme:'모험가',summary:'가상 요약',turn_count:1,cheat_count:0,messages_count:2,entry_mode:'concern',created_at:'2026-11-13T00:00:00.000Z'};
  let session={user:{id:a},access_token:'synthetic-user-a'};
  let sessionError=null;
  const client={auth:{getSession:async()=>({data:{session},error:sessionError})}};
  const calls=[];
  let reply=()=>new Response(JSON.stringify({ok:true,storage:'supabase'}),{status:200});
  const send=async(path,options)=>{calls.push({path,options});return reply();};
  await t.test('confirmed remote result succeeds and token is only in request header',async()=>{
    assert.equal(await saveCompletedSession(client,a,payload,send),true);
    assert.equal(calls[0].options.headers.Authorization,'Bearer synthetic-user-a');
    assert.equal(JSON.parse(calls[0].options.body).user_id,a);
    assert.equal(calls[0].options.body.includes('synthetic-user-a'),false);
  });
  await t.test('500, network loss, bad JSON, and local-only result are not remote success',async()=>{
    for(const response of [()=>new Response('{}',{status:500}),()=>{throw Error('network')},()=>new Response('not JSON'),()=>new Response(JSON.stringify({ok:true,storage:'local'}))]){
      reply=response;assert.equal(await saveCompletedSession(client,a,payload,send),false);
    }
  });
  await t.test('retry uses same id/body; changed account or expired session causes no send',async()=>{
    reply=()=>new Response(JSON.stringify({ok:true,storage:'supabase'}));
    assert.equal(await saveCompletedSession(client,a,payload,send),true);
    assert.equal(calls.at(-1).options.body,calls[0].options.body);
    const count=calls.length;
    session={user:{id:b},access_token:'synthetic-user-b'};
    assert.equal(await saveCompletedSession(client,a,payload,send),false);
    session=null;assert.equal(await saveCompletedSession(client,a,payload,send),false);
    sessionError=Error('expired');assert.equal(await saveCompletedSession(client,a,payload,send),false);
    assert.equal(calls.length,count);assert.equal(await saveCompletedSession(null,a,payload,send),false);
  });
});
