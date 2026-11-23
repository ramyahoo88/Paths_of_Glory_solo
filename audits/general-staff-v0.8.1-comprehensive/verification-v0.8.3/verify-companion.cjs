'use strict';
// Executes the shipped HTML script with minimal DOM/storage doubles; NOT a browser test.
// Calculator oracle is transcribed from the rendered reference sheet, not generated from app data.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const repo=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]||__dirname);
const html=fs.readFileSync(repo+'/app/General_Staff_Companion.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1],KEY='gs-companion';
function boot(saved,failWrite=false,maxChars=Infinity,pageScript=script){
 const nodes={};for(const m of html.matchAll(/\bid="([^"]+)"/g))nodes[m[1]]={value:'',checked:false,disabled:false,innerHTML:'',textContent:'',classList:{toggle(){}}};
 for(const m of html.matchAll(/<input\b([^>]+)>/g)){const id=m[1].match(/id="([^"]+)"/);if(id){nodes[id[1]].value=(m[1].match(/value="([^"]*)"/)||[])[1]||'';nodes[id[1]].checked=/\bchecked\b/.test(m[1]);}}
 for(const m of html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>\s*<option(?: value="([^"]*)")?[^>]*>([^<]+)/g))nodes[m[1]].value=m[2]??m[3];
 const tabs=['obj','front','ev'].map(t=>({dataset:{t},classList:{toggle(){}}}));const store=new Map();if(saved!=null)store.set(KEY,saved);
 let rnd=123456789;const crypto={getRandomValues(a){rnd=(Math.imul(1664525,rnd)+1013904223)>>>0;a[0]=rnd;return a;}};
 const context=vm.createContext({document:{getElementById:id=>nodes[id],querySelectorAll:()=>tabs},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>{if(failWrite||v.length>maxChars)throw Error('QuotaExceededError');store.set(k,v);}},window:{crypto},crypto,Uint32Array,Math,JSON,Set,Number,Array});
 let error=null;try{vm.runInContext(pageScript,context)}catch(e){error=e.message}return{nodes,store,error,run:s=>vm.runInContext(s,context),state:()=>JSON.parse(vm.runInContext('JSON.stringify(S)',context))};
}
const result={mode:'shipped script callbacks with DOM/storage doubles; no browser',checks:[],boundaries:{}};
const same=(a,b)=>assert.deepStrictEqual(a,b);
const exp=b=>{b.nodes.export.onclick();return b.nodes.iotext.value;};
const imp=(a,b)=>{a.nodes.iotext.value=exp(b);a.nodes.import.onclick();assert(a.nodes.ioinfo.textContent.startsWith('Imported'));};
const restored=b=>boot(b.store.get(KEY));
let recipient=boot(),donor=boot();recipient.nodes.draw.onclick();const first=recipient.state();recipient.nodes.draw.onclick();const prior=recipient.state();
donor.nodes.side.onchange({target:{value:'ap'}});donor.nodes.lvl.onchange({target:{value:'total'}});for(let i=0;i<4;i++)donor.nodes.draw.onclick();
imp(recipient,donor);recipient=restored(recipient);recipient.nodes.undo.onclick();same(recipient.state(),prior);recipient.nodes.undo.onclick();same(recipient.state(),first);result.checks.push('A01 original two reproductions now corrected, including reload');
// A new draw after an import undoes first, then the import, then the recipient's older draw.
recipient=boot();recipient.nodes.draw.onclick();const r1=recipient.state();imp(recipient,donor);const imported=recipient.state();recipient.nodes.draw.onclick();recipient.nodes.undo.onclick();same(recipient.state(),imported);recipient.nodes.undo.onclick();same(recipient.state(),r1);recipient.nodes.undo.onclick();assert.equal(recipient.state().cur,null);result.checks.push('ordinary draws interleaved with Import preserve coherent Undo');
// Two imports with a tracker change between them: Undo restores both complete contexts.
recipient=boot();recipient.nodes.draw.onclick();const original=recipient.state();imp(recipient,donor);recipient.nodes.nextturn.onclick();const middle=recipient.state();let third=boot();third.nodes.lvl.onchange({target:{value:'limited'}});third.nodes.draw.onclick();imp(recipient,third);recipient=restored(recipient);recipient.nodes.undo.onclick();same(recipient.state(),middle);recipient.nodes.undo.onclick();recipient.nodes.undo.onclick();same(recipient.state(),original);result.checks.push('two Imports, tracker action and reload preserve every prior session');
// Round-5 to round-6, exhausted-deck combined control, and its exact Undo.
recipient=boot();for(let i=0;i<18;i++)recipient.nodes.draw.onclick();recipient.nodes.tround.value='5';recipient.nodes.tround.onchange();const last=recipient.state();recipient.nodes.nextdraw.onclick();assert.equal(recipient.state().track.round,6);assert.equal(recipient.state().deck.length,17);recipient.nodes.undo.onclick();same(recipient.state(),last);result.checks.push('Next round + draw reshuffle and one-step Undo');
// B01: round 6 disables the combined control and its callback has no effect, including on history.
recipient=boot();for(let i=0;i<6;i++){if(i===0)recipient.nodes.draw.onclick();else recipient.nodes.nextdraw.onclick();}const six=recipient.state();assert.equal(six.track.round,6);assert.equal(six.discard.length,6);const disabled=recipient.nodes.nextdraw.disabled;recipient.nodes.nextdraw.onclick();const seven=recipient.state();assert.equal(seven.track.round,6);assert.equal(seven.discard.length,6);assert(disabled);same(seven,six);recipient.nodes.undo.onclick();assert.equal(recipient.state().track.round,5);assert(!recipient.nodes.nextdraw.disabled);result.boundaries.round6={turn:seven.track.turn,round:seven.track.round,drawsBefore:six.discard.length,drawsAfter:seven.discard.length,buttonDisabled:disabled,undoToRound5:true};
// Repeated imports without any new draw: measure serialized history growth, stopping before excessive allocation.
recipient=boot();recipient.nodes.draw.onclick();donor=boot();donor.nodes.draw.onclick();const sizes=[];
for(let i=1;i<=18;i++){imp(recipient,donor);const raw=recipient.store.get(KEY);sizes.push({imports:i,characters:raw.length});if(raw.length>5*1024*1024)break;}
result.boundaries.repeatedImports=sizes;
// Explicit synthetic quota: this proves the growth can trip persistence; it is not a real-browser quota measurement.
let limited=boot(null,false,5*1024*1024);limited.nodes.draw.onclick();let failedAt=null;for(let i=1;i<=16;i++){imp(limited,donor);if(limited.nodes.notice.textContent.includes('Not saved')){failedAt=i;break;}}assert.equal(failedAt,null);const currentBytes=JSON.stringify(limited.state()).length;const persisted=limited.store.get(KEY);assert(persisted.length<10000);assert.equal(currentBytes+6,persisted.length);const loaded=boot(persisted);assert.equal(loaded.error,null);result.boundaries.syntheticQuota={maxCharacters:5*1024*1024,failedAtImport:failedAt,currentCharacters:currentBytes,persistedCharacters:persisted.length,notice:limited.nodes.notice.textContent};
// A failed storage write is visible, and the last in-memory Import can still be undone.
const fail=boot(null,true);fail.nodes.draw.onclick();const preFail=fail.state();imp(fail,donor);assert(fail.nodes.notice.textContent.includes('Not saved'));fail.nodes.undo.onclick();same(fail.state(),preFail);result.checks.push('storage failure remains visible and Import Undo still works in memory');
// Test the exact ten-checkpoint boundary using distinguishable sessions and reload before every Undo.
const publicState=x=>({side:x.side,lvl:x.lvl,deck:x.deck,discard:x.discard,cur:x.cur,track:x.track});
recipient=boot();recipient.nodes.draw.onclick();const stages=[recipient.state()];
for(let i=1;i<=25;i++){
 donor=boot();donor.nodes.side.onchange({target:{value:i%2?'ap':'cp'}});donor.nodes.lvl.onchange({target:{value:['mobilization','limited','total'][i%3]}});donor.nodes.tturn.value=String(1+i%20);donor.nodes.tturn.onchange();for(let j=0;j<1+i%12;j++)donor.nodes.draw.onclick();
 imp(recipient,donor);recipient.nodes.nextdraw.onclick(); // Interleave ordinary actions with imports, with each Import.
 stages.push(recipient.state());
}
let importUndos=0;
while(recipient.state().hist.length){
 recipient=restored(recipient);assert(!recipient.error);const h=JSON.parse(recipient.state().hist.at(-1));
 if(h.kind==='import'){
  recipient.nodes.undo.onclick();importUndos++;same(publicState(recipient.state()),publicState(stages[25-importUndos]));
 }else recipient.nodes.undo.onclick();
 assert(importUndos<=10);
}
assert.equal(importUndos,10);result.checks.push('25 varied imports plus ordinary actions; exactly ten import Undos, correct older sessions, reload at each step');
// Produce real v0.8.2 saves with its script, then migrate them into the current script.
const oldHtml=require('child_process').execFileSync('git',['show','657e6bb:app/General_Staff_Companion.html'],{cwd:repo,encoding:'utf8'}),oldScript=oldHtml.match(/<script>([\s\S]*?)<\/script>/)[1];
const legacyResults=[];
for(const count of [1,2,10,12,16]){
 let old=boot(null,false,Infinity,oldScript),oldDonor=boot(null,false,Infinity,oldScript);old.nodes.draw.onclick();const orig=old.state();oldDonor.nodes.side.onchange({target:{value:'ap'}});oldDonor.nodes.lvl.onchange({target:{value:'total'}});oldDonor.nodes.draw.onclick();
 for(let i=0;i<count;i++)imp(old,oldDonor);
 const saved=old.store.get(KEY);let loaded=boot(saved);assert.equal(loaded.error,null);assert(!loaded.nodes.notice.textContent.includes('damaged'));
 for(let i=0;i<count;i++){loaded=restored(loaded);loaded.nodes.undo.onclick();}same(loaded.state(),orig);
 // A new Import normalizes and caps the old chain; immediate Undo restores the active old session's context.
 loaded=boot(saved);const preMigration=publicState(loaded.state());imp(loaded,oldDonor);const normalizedSize=loaded.store.get(KEY).length;assert(normalizedSize<12000);loaded=restored(loaded);loaded.nodes.undo.onclick();same(publicState(loaded.state()),preMigration);
 legacyResults.push({oldImports:count,legacyCharacters:saved.length,normalizedCharacters:normalizedSize,allLegacyUndosPreserved:true});
}
result.legacyMigration=legacyResults;
// Ordinary pre-import Undo history survives ten checkpoints; only older imports are discarded.
recipient=boot();for(let i=0;i<5;i++)recipient.nodes.draw.onclick();const five=recipient.state();donor=boot();donor.nodes.draw.onclick();for(let i=0;i<10;i++)imp(recipient,donor);recipient=restored(recipient);for(let i=0;i<10;i++)recipient.nodes.undo.onclick();same(recipient.state(),five);for(let i=0;i<5;i++)recipient.nodes.undo.onclick();assert.equal(recipient.state().cur,null);result.checks.push('five original draws remain undoable after ten Imports');
fs.writeFileSync(out+'/companion-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
