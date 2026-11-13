import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readSseData } from '../src/lib/session/sse-data.ts';
const encoder = new TextEncoder();
async function consume(parts) {
  const stream = new ReadableStream({start(controller){for(const part of parts)controller.enqueue(part);controller.close()}});
  const reader=stream.getReader();
  const result=[];
  for await(const data of readSseData(reader))result.push(data);
  assert.equal(stream.locked,false);
  return result;
}
test('JSON data and Korean UTF8 survive every two-chunk byte boundary',async()=>{
  const values=[JSON.stringify({text:'합성 요약입니다.'}),JSON.stringify({crisis:true,message:'합성 중지',policy:{riskState:'awaiting_confirmation'}}),'[DONE]'];
  const bytes=encoder.encode(values.map(v=>'data: '+v+'\n\n').join(''));
  for(let split=0;split<=bytes.length;split++)assert.deepEqual(await consume([bytes.slice(0,split),bytes.slice(split)]),values);
  assert.deepEqual(await consume([...bytes].map(b=>new Uint8Array([b]))),values);
});
test('CRLF and unrelated lines preserve supported data without inventing incomplete frames',async()=>{
  assert.deepEqual(await consume([encoder.encode(':comment\r\nevent: text\r\ndata: {"text":"ok"}\r\n\r\ndata: [DONE]\n\ndata: {"text":"unfinished"}')]),['{"text":"ok"}','[DONE]']);
  assert.deepEqual(await consume([]),[]);
});
test('reader errors propagate and release the lock',async()=>{
  const stream=new ReadableStream({pull(controller){controller.error(new Error('synthetic read failure'))}});
  await assert.rejects(async()=>{for await(const data of readSseData(stream.getReader()))void data},/synthetic read failure/);
  assert.equal(stream.locked,false);
});
