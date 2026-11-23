'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const repo=path.resolve(process.argv[2]),dir=path.resolve(process.argv[3]||__dirname);
const R=require(repo+'/engine/rules.js'),D=require(repo+'/engine/data.js');
const read=f=>JSON.parse(fs.readFileSync(dir+'/'+f+'.json'));
const start=R.setup(1,'Historical',{no_supply_warnings:true}),ana=D.pieces.findIndex(p=>p.name==='BR ANAc');
// Independent reconstruction from final public board control, score-event and missed-MO records.
// Does not call the engine's scoring/victory functions. It is not an independent engine.
const control=(g,s)=>g.location[ana]===s&&!(D.spaces[s].fort&&D.spaces[s].faction==='cp'&&!g.forts.destroyed.includes(s))?0:(g.control[s>>5]>>>(s&31))&1;
const scoring=[];
for(const file of ['representative-trace-3410000','turnlimit-trace-3410001']){
 const g=read(file).final,spaces=D.spaces.map((s,i)=>s.vp?{space:s.name,delta:control(g,i)-control(start,i)}:null).filter(x=>x?.delta);
 const board=spaces.reduce((s,x)=>s+x.delta,0),events=g.score_events.reduce((s,x)=>s+x[1],0),missedMO=g.ap.missed_mo.length-g.cp.missed_mo.length;
 const automatic=/Automatic Victory/.test(g.victory);
 const endAdjustment=automatic?0:[43,47].filter(c=>!g.events.reinforcements.includes(c)).length-(g.events.fall_of_the_tsar?0:2);
 const total=10+board+events+missedMO+endAdjustment;assert.strictEqual(total,g.vp);
 const expected=automatic?(total<=0?'Allied Powers':'Central Powers'):(total>=(g.events.treaty_of_brest_litovsk?11:13)?'Central Powers':'Allied Powers');assert.strictEqual(g.result,expected);
 scoring.push({file,initial:10,spaces,board,events,missedMO,endAdjustment,total,result:g.result});
}
const boundaries=[];
for(const brest of [false,true])for(const vp of [10,11,12,13])for(const played of [false,true]){
 let g=R.setup(123,'Historical',{no_supply_warnings:true});g.turn=20;g.state='draw_cards_phase';g.active='Central Powers';g.cp.hand=[];g.discarded_ccs=[];g.vp=vp;
 g.events.fall_of_the_tsar=10;g.events.reinforcements=played?[43,47]:[];if(brest)g.events.treaty_of_brest_litovsk=19;
 const expectedVP=vp+(played?0:2),expected=expectedVP>=(brest?11:13)?'Central Powers':'Allied Powers';
 g=R.action(g,g.active,'done');assert.strictEqual(g.state,'game_over');assert.strictEqual(g.vp,expectedVP);assert.strictEqual(g.result,expected);
 boundaries.push({vp,brest,USarmiesPlayed:played,expectedVP,result:g.result});
}
// Historical no-Tsar adjustment can itself change the winner.
{let g=R.setup(123,'Historical',{no_supply_warnings:true});g.turn=20;g.state='draw_cards_phase';g.active='Central Powers';g.cp.hand=[];g.discarded_ccs=[];g.vp=14;g.events.reinforcements=[43,47];g=R.action(g,g.active,'done');assert.strictEqual(g.vp,12);assert.strictEqual(g.result,'Allied Powers');boundaries.push({noTsar:true,before:14,after:12,result:g.result});}
const files=['release-ap','pressure-ap','pressure-cp','preservation-ap','preservation-cp','exploitation-ap','exploitation-cp'];
// Automatic victory is checked at the War Status phase, not at the instant the VP boundary is reached.
for(const vp of [0,20]){
 let g=R.setup(3410002,'Historical',{no_supply_warnings:true});g.turn=3;g.state='action_phase';g.active='Central Powers';g.cp.hand=[];g.cp.mo='none';g.ap.mo='none';g.vp=vp;
 assert(R.view(g,g.active).actions.single_op);g=R.action(g,g.active,'single_op');assert.notEqual(g.state,'game_over');boundaries.push({kind:'no mid-round automatic ending',vp,state:g.state});
 const B=require(repo+'/sim/board.js'),fort=B.S('Ivangorod');g.location.fill(0);g.location[1]=fort;g.forts.besieged=[fort];g.sieges_to_roll=[fort];g.state='siege_phase';g.active='Central Powers';g.events.reinforcements=[43,47];delete g.events.fall_of_the_tsar;
 assert(R.view(g,g.active).actions.space.includes(fort));g=R.action(g,g.active,'space',fort);assert.equal(g.state,'game_over');assert.equal(g.vp,vp);assert.equal(g.result,vp===0?'Allied Powers':'Central Powers');boundaries.push({kind:'War Status automatic ending; no Historical end adjustment',vp,result:g.result});
}
const summary={batches:[],games:0,decisions:0,scoreLedgerChecks:0,errors:0,resets:0,unsafeSteps:0,fallback:{},states:{},endings:{}};
for(const file of files){const x=read(file),gs=x.games;summary.batches.push({file,policy:x.policy,side:x.side,n:gs.length,start:x.start,ap:gs.filter(g=>g.result==='Allied Powers').length,cp:gs.filter(g=>g.result==='Central Powers').length});
 for(const g of gs){summary.games++;summary.decisions+=g.steps;summary.errors+=!!g.error;summary.unsafeSteps+=g.supplyCases.length;assert.strictEqual(g.hiddenChecks,g.steps);assert(g.scoreChecks<=g.steps);summary.scoreLedgerChecks+=g.scoreChecks;const e=g.result+': '+g.victory.split(':')[0];summary.endings[e]=(summary.endings[e]||0)+1;
  for(const s of Object.values(g.stats)){summary.resets+=s.violations||0;for(const[k,v]of Object.entries(s.fallback))summary.fallback[k]=(summary.fallback[k]||0)+v;}for(const[k,v]of Object.entries(g.states))summary.states[k]=(summary.states[k]||0)+v;
 }
}
fs.writeFileSync(dir+'/scoring-and-summary.json',JSON.stringify({scoring,boundaries,summary},null,2));console.log(JSON.stringify({scoring:scoring.map(({file,total,result})=>({file,total,result})),boundaryCases:boundaries.length,...summary},null,2));
