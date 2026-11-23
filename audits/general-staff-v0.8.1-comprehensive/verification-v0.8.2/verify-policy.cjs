'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const repo=path.resolve(process.argv[2]||'.'),out=__dirname;
const R=require(repo+'/engine/rules.js'),B=require(repo+'/sim/board.js'),{Bot,makeDeck,legal}=require(repo+'/sim/bot.js');
const result={originalCases:[],reserve:[],advance:[],primaryRanking:[]};
for(const [fixture,key,wants] of [['forward-tie','Forward',['Verdun','Nancy']],['sr-tie','SR',['Berlin','Stuttgart']],['rp-tie','replacement',['Berlin','Stuttgart']]])for(let i=0;i<2;i++){
 const x=require(repo+'/sim/tests/fixtures/'+fixture+'.json'),g=structuredClone(x.game),b=new Bot(key==='Forward'?'ap':'cp',x.seed);b.dir=makeDeck()[(key==='Forward'?[3,6]:[1,4])[i]-1];let actual;
 if(key==='Forward')actual=R.__with(g,A=>B.data.spaces[b.frontLineTarget(A,B.S('Bar le Duc'),'WEST',b.objectiveOf(A,'WEST'))].name);
 else {const v=R.view(g,g.active),a=b.decide(g,v);assert(legal(v.actions,a));actual=B.data.spaces[g.location[a[1]]].name;const next=R.action(g,g.active,...a);if(key==='SR')assert.equal(next.sr.unit,a[1]);else assert(!next.reduced.includes(a[1]));}
 assert.equal(actual,wants[i]);result.originalCases.push({key,staff:b.dir.id,actual});
}
// Reserve-first is exercised through the real handler and engine offers, not just the helper comparator.
for(const id of [1,4]){
 const x=require(repo+'/sim/tests/fixtures/sr-tie.json'),g=structuredClone(x.game),b=new Bot('cp',x.seed);b.dir=makeDeck()[id-1];R.__with(g,A=>{g.location[69]=A.CP_RESERVE_BOX;A.update_supply();});const v=R.view(g,g.active),a=b.decide(g,v);assert(legal(v.actions,a));assert.equal(a[1],69);assert.equal(R.action(g,g.active,...a).sr.unit,69);result.reserve.push({staff:id,piece:69});
}
// Higher primary rank still wins: an affordable army on the map precedes a corps in reserve.
{
 const x=require(repo+'/sim/tests/fixtures/sr-tie.json'),g=structuredClone(x.game),b=new Bot('cp',1);b.dir=makeDeck()[0];g.location[68]=0;g.location[1]=B.S('Berlin');g.sr.pts=4;R.__with(g,A=>{g.location[69]=A.CP_RESERVE_BOX;A.update_supply();});const v=R.view(g,g.active),a=b.decide(g,v);assert(legal(v.actions,a));assert.equal(a[1],1);result.primaryRanking.push('SR army before Reserve Box corps');
}
// Four equal-strength advancing armies compete for three spaces. Execute the actual handler and engine actions.
for(const id of [1,4]){
 let g=R.setup(3500000,'Historical',{no_supply_warnings:true});g.location.fill(0);g.reduced=[];g.active='Central Powers';g.state='attacker_advance';g.turn=3;g.location[1]=g.location[3]=B.S('Metz');g.location[2]=g.location[4]=B.S('Strasbourg');g.forts.destroyed.push(B.S('Nancy'));g.attack={space:B.S('Nancy'),attacker:'cp',defender:'ap',pieces:[1,2,3,4],to_advance:[1,2,3,4],advancing_pieces:[],advance_length:0,retreat_length:1};R.__with(g,A=>A.update_supply());
 const b=new Bot('cp',1);b.dir=makeDeck()[id-1];const selected=[];
 for(let k=0;k<4;k++){const v=R.view(g,g.active),a=b.decide(g,v);assert(legal(v.actions,a));if(a[0]==='piece')selected.push(a[1]);g=R.action(g,g.active,...a);if(a[0]==='space')break;}
 assert.deepEqual(selected,id===1?[1,3,2]:[2,4,1]);assert.equal([1,2,3,4].filter(p=>g.location[p]===B.S('Nancy')).length,3);result.advance.push({staff:id,selected,stayed:g.attack.to_advance});
}
fs.writeFileSync(out+'/policy-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
