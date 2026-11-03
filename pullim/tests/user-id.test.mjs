import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getUserId } from '../src/lib/user-id.ts';
const key = 'pullim_user_id';
test('SSR has no identity and never touches storage', () => {
  delete globalThis.window;
  globalThis.localStorage = { getItem() { throw new Error('must not read'); } };
  assert.equal(getUserId(), '');
});
test('existing durable ID is reused without writes; new ID is persisted and stable', () => {
  globalThis.window = {};
  const data = new Map([[key,'synthetic-existing']]);
  let writes=0;
  globalThis.localStorage = {getItem:k=>data.get(k)??null,setItem:(k,v)=>{writes++;data.set(k,v);}};
  assert.equal(getUserId(),'synthetic-existing');
  assert.equal(writes,0);
  data.delete(key);
  const generated=getUserId();
  assert.ok(generated.length>0);
  assert.equal(data.get(key),generated);
  assert.equal(getUserId(),generated);
  assert.equal(writes,1);
});
test('denied read or write yields no made-up durable identity and retry recovers', () => {
  globalThis.window = {};
  globalThis.localStorage={getItem(){throw new Error('denied');}};
  assert.equal(getUserId(),'');
  globalThis.localStorage={getItem(){return null;},setItem(){throw new Error('quota');}};
  assert.equal(getUserId(),'');
  globalThis.localStorage={getItem(){return 'restored-id';}};
  assert.equal(getUserId(),'restored-id');
});
