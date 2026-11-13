import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPromise, getActivePromises, checkPromise, getPromiseHistory } from '../src/lib/session/promise-store.ts';
const key = 'pullim_promises';
const record = {id:'synthetic',createdAt:1,sessionTheme:'모험가',trigger:'test trigger',action:'test action',status:'active'};
function memory(raw) {
  const data = new Map(raw === undefined ? [] : [[key,raw]]);
  globalThis.localStorage = {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  return data;
}
test('missing promises are empty; create and check persist across reads without changing other keys', () => {
  const data = memory(); data.set('pullim_action_history_v1','untouched');
  assert.deepEqual(getActivePromises(),[]);
  const saved = createPromise('trigger','action','모험가');
  assert.deepEqual(getActivePromises(),[saved]);
  checkPromise(saved.id,'completed','reflection');
  assert.deepEqual(getActivePromises(),[]);
  assert.equal(getPromiseHistory()[0].reflection,'reflection');
  assert.equal(getPromiseHistory()[0].status,'completed');
  assert.equal(data.get('pullim_action_history_v1'),'untouched');
});
test('corrupt or invalid existing records cannot be replaced by create or check', () => {
  for(const raw of ['', '{partial','null','{}','[null]','[{}]', JSON.stringify([record,record]),
    JSON.stringify([{...record,status:'unknown'}]),JSON.stringify([{...record,checkedAt:'bad'}])]) {
    const data=memory(raw);
    assert.throws(()=>getActivePromises());
    assert.throws(()=>createPromise('t','a','모험가'));
    assert.throws(()=>checkPromise(record.id,'completed'));
    assert.equal(data.get(key),raw);
  }
});
test('read and write failures propagate without a success result or changing data; retry works', () => {
  const raw=JSON.stringify([record]); const data=memory(raw);
  const original=localStorage;
  globalThis.localStorage={...original,getItem(){throw new Error('permission')}};
  assert.throws(()=>getActivePromises(),/permission/);
  assert.throws(()=>createPromise('t','a','모험가'),/permission/);
  globalThis.localStorage={...original,setItem(){throw new Error('quota')}};
  assert.throws(()=>createPromise('t','a','모험가'),/quota/);
  assert.throws(()=>checkPromise(record.id,'completed'),/quota/);
  assert.equal(data.get(key),raw);
  globalThis.localStorage=original;
  checkPromise(record.id,'completed');
  assert.equal(getPromiseHistory()[0].status,'completed');
});
test('checking a removed promise fails without rewriting remaining records', () => {
  const raw=JSON.stringify([record]);const data=memory(raw);
  assert.throws(()=>checkPromise('removed','completed'));
  assert.equal(data.get(key),raw);
});
