'use strict';
// Executes the shipped HTML script with minimal DOM/storage doubles; NOT a browser test.
// Calculator oracle is transcribed from the rendered reference sheet, not generated from app data.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const repo=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]||__dirname);
const html=fs.readFileSync(repo+'/app/General_Staff_Companion.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1],KEY='gs-companion';
function boot(saved,failWrite=false){
 const nodes={};for(const m of html.matchAll(/\bid="([^"]+)"/g))nodes[m[1]]={value:'',checked:false,disabled:false,innerHTML:'',textContent:'',classList:{toggle(){}}};
 for(const m of html.matchAll(/<input\b([^>]+)>/g)){const id=m[1].match(/id="([^"]+)"/);if(id){nodes[id[1]].value=(m[1].match(/value="([^"]*)"/)||[])[1]||'';nodes[id[1]].checked=/\bchecked\b/.test(m[1]);}}
 for(const m of html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>\s*<option(?: value="([^"]*)")?[^>]*>([^<]+)/g))nodes[m[1]].value=m[2]??m[3];
 const tabs=['obj','front','ev'].map(t=>({dataset:{t},classList:{toggle(){}}}));const store=new Map();if(saved!=null)store.set(KEY,saved);
 let rnd=123456789;const crypto={getRandomValues(a){rnd=(Math.imul(1664525,rnd)+1013904223)>>>0;a[0]=rnd;return a;}};
 const context=vm.createContext({document:{getElementById:id=>nodes[id],querySelectorAll:()=>tabs},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>{if(failWrite)throw Error('QuotaExceededError');store.set(k,v);}},window:{crypto},crypto,Uint32Array,Math,JSON,Set,Number,Array});
 let error=null;try{vm.runInContext(script,context)}catch(e){error=e.message}return{nodes,store,error,run:s=>vm.runInContext(s,context),state:()=>JSON.parse(vm.runInContext('JSON.stringify(S)',context))};
}
const r={mode:'shipped script with DOM/storage doubles; no browser',calculatorCases:0,deckCycles:0,damagedLevel:[],tracker:null};
let a=boot();assert(!a.error);a.run("S.side='cp';S.cur=1;render()");
const tables={army:{cf:[1,2,3,4,5,6,9,12,15,16],hits:[1.2,2,2.5,3,3.5,4,4.7,5.3,5.8,6.3]},corps:{cf:[0,1,2,3,4,5,6,7,8],hits:[0.3,0.5,0.8,1.3,1.5,1.8,2,2.5,3]}};
function hit(cf,army,shift){const t=army?tables.army:tables.corps;let i=0;for(let j=0;j<t.cf.length;j++)if(t.cf[j]<=cf)i=j;return t.hits[Math.max(0,Math.min(t.hits.length-1,i+shift))];}
for(const units of [false,true])for(const aa of [false,true])for(const da of [false,true])for(const acf of [0,1,2,3,4,5,6,7,8,9,10,11,12,14,15,16,20])for(const dcf of [0,1,2,3,4,5,6,7,8,9,11,12,14,15,16,20])for(const tr of [0,1,2])for(const terr of [0,1]){
 const fort=2;for(const [k,v]of Object.entries({acf,dcf,fort,aarmy:aa,darmy:da,dunits:units,tr,terr,bobj:false,bnear:false,bvp:false,boos:false,bmo:0,bfront:0}))typeof v==='boolean'?a.nodes[k].checked=v:a.nodes[k].value=String(v);
 a.nodes.acf.oninput();const eh=hit(acf,aa,-terr-(units?tr:0)),dh=hit((units?dcf:0)+fort,units&&da,units&&tr>0?1:0),edge=Math.round((eh-dh)*10)/10;
 assert(a.nodes.edge.innerHTML.startsWith(`Bot ${eh.toFixed(1)} − defender ${dh.toFixed(1)} = Edge ${edge>=0?'+':''}${edge.toFixed(1)}`));r.calculatorCases++;
}
// Score and exact threshold comparisons, all sides and stances, and all three MO bonuses.
for(const side of ['cp','ap'])for(const card of [1,2,3])for(const mo of [0,1,2.5,6]){
 a.run(`S.side='${side}';S.cur=${card};render()`);for(const[k,v]of Object.entries({acf:9,dcf:12,fort:0,aarmy:true,darmy:true,dunits:true,tr:0,terr:0,bobj:false,bnear:true,bvp:true,boos:false,bmo:mo,bfront:-0.25}))typeof v==='boolean'?a.nodes[k].checked=v:a.nodes[k].value=String(v);
 a.nodes.acf.oninput();const score=0.05+mo,need=[0,.75,1.5][card-1]+(side==='ap'?1:.75);assert(a.nodes.edge.innerHTML.includes('Score +'+score.toFixed(2)));assert(a.nodes.edge.innerHTML.includes(score>=need||mo===6?'— attack':'— too weak'));r.calculatorCases++;
}
// Multiple complete cycles, reload after every draw, Undo after each reshuffle, and New deck/Undo.
a=boot();for(let cycle=0;cycle<10;cycle++){const drawn=[];for(let i=0;i<18;i++){const before=a.state();a.nodes.draw.onclick();drawn.push(a.state().cur);if(i===0&&cycle>0){a.nodes.undo.onclick();assert.deepStrictEqual({...a.state(),hist:[]},{...before,hist:[]});a.nodes.draw.onclick();drawn[0]=a.state().cur;}const saved=a.store.get(KEY);a=boot(saved);assert(!a.error);}assert.strictEqual(new Set(drawn).size,18);r.deckCycles++;}
const before=a.state();a.nodes.newdeck.onclick();a.nodes.undo.onclick();assert.deepStrictEqual({...a.state(),hist:[]},{...before,hist:[]});
// Property names inherited from Object.prototype must not be accepted as commitment levels.
for(const lvl of ['constructor','__proto__','toString']){const s={...before,lvl};const c=boot(JSON.stringify(s));assert(!c.error);assert.strictEqual(c.state().lvl,'mobilization');assert(!c.nodes.card.innerHTML.includes('undefined front'));assert(c.nodes.notice.textContent.includes('damaged'));r.damagedLevel.push({lvl,accepted:false,notice:c.nodes.notice.textContent});}
const invalid=boot(JSON.stringify({...before,lvl:'nonsense'}));assert(invalid.nodes.notice.textContent.includes('damaged'));
// Manual turn changes retain per-turn checkboxes; this is recorded as a workflow improvement.
a=boot();a.nodes.side.onchange({target:{value:'ap'}});for(const k of ['tmo','trp']){a.nodes[k].checked=true;a.nodes[k].onchange();}a.nodes.tturn.value='2';a.nodes.tturn.onchange();r.tracker={state:a.state().track,hint:a.nodes.thint.textContent};assert(!r.tracker.state.mo&&!r.tracker.state.rp);

fs.writeFileSync(out+'/calculator-cycles.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r,null,2));
