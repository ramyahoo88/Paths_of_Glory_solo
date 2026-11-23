import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from './pages-worker.mjs';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root));
const calls=[];
const env={ASSETS:{fetch:async request=>{calls.push(request.url);return new Response('Existing static asset');}}};
const call=(path,method='GET')=>worker.fetch(new Request('https://solo-table.pages.dev'+path,{method}),env,{});
const pdfs=[['General_Staff_Rules.pdf','rules.pdf'],['General_Staff_Cards.pdf','staff_cards.pdf'],['General_Staff_Reference.pdf','reference.pdf']];

test('Hosted and offline app match the shipped HTML and retain its three direct downloads',async()=>{
 const expected=read('app/General_Staff_Companion.html').toString();
 for(const path of ['/games/paths-of-glory/','/games/paths-of-glory/index.html','/games/paths-of-glory/General_Staff_Companion.html','/downloads/paths-of-glory']){
  const response=await call(path);assert.equal(response.status,200);assert.equal(await response.text(),expected);
  if(path.includes('Companion.html')||path.startsWith('/downloads/'))assert.match(response.headers.get('Content-Disposition'),/attachment; filename="General_Staff_Companion.html"/);
 }
 for(const [name] of pdfs)assert.ok(expected.includes('https://solo-table.pages.dev/games/paths-of-glory/'+name));
 assert.ok(!expected.includes('github.com'));
});

test('All PDF routes return the shipped bytes as real downloads, with matching HEAD responses',async()=>{
 for(const [name,source] of pdfs){
  const path='/games/paths-of-glory/'+name;
  const response=await call(path);assert.equal(response.status,200);
  assert.equal(response.headers.get('Content-Type'),'application/pdf');
  assert.equal(response.headers.get('Content-Disposition'),'attachment; filename="'+name+'"');
  const expected=read('print/out/'+source);assert.deepEqual(Buffer.from(await response.arrayBuffer()),expected);
  const head=await call(path,'HEAD');assert.equal(head.status,200);assert.equal(await head.text(),'');
  assert.equal(head.headers.get('Content-Length'),String(expected.length));
  assert.equal(head.headers.get('Content-Type'),'application/pdf');
  assert.equal(head.headers.get('Content-Disposition'),response.headers.get('Content-Disposition'));
 }
 assert.equal((await call('/games/paths-of-glory/missing.pdf')).status,404);
 assert.equal((await call('/games/paths-of-glory/','POST')).status,405);
 assert.equal((await call('/games/paths-of-glory')).status,308);
});

test('The catalog adds one General Staff entry while retaining every other companion',async()=>{
 const before=read('deployment/baseline-home.html').toString();
 const home=await (await call('/')).text();
 assert.equal(home,read('deployment/home.html').toString());
 for(const article of before.matchAll(/<article\b[\s\S]*?<\/article>/g))assert.ok(home.includes(article[0]),'An existing companion changed');
 assert.equal((home.match(/id="paths-of-glory-title"/g)||[]).length,1);
 assert.equal((home.match(/<article\b/g)||[]).length,(before.match(/<article\b/g)||[]).length+1);
 for(const [name] of pdfs)assert.ok(home.includes('games/paths-of-glory/'+name));
});

test('The prior function and static routes still serve other companions',async()=>{
 const force136=await call('/games/force136/');assert.equal(force136.status,200);assert.ok((await force136.text()).includes('Force 136'));
 const oldPDF=await call('/games/force136/Force_136_Rules.pdf');assert.equal(oldPDF.headers.get('Content-Type'),'application/pdf');assert.ok((await oldPDF.arrayBuffer()).byteLength>1000);
 const before=calls.length;assert.equal(await (await call('/games/pendragon/')).text(),'Existing static asset');assert.equal(calls.length,before+1);
 const routes=JSON.parse(read('deployment/routes.json'));
 for(const path of ['/games/force136/*','/downloads/force136','/games/paths-of-glory/*','/downloads/paths-of-glory'])assert.ok(routes.include.includes(path));
});
