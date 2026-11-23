'use strict';
// Positive reproductions of existing behavior, plus opposite-outcome controls.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const repo=path.resolve(process.argv[2]||'.'),out=__dirname;
const R=require(repo+'/engine/rules.js'),B=require(repo+'/sim/board.js'),{Bot,makeDeck}=require(repo+'/sim/bot.js');
const read=n=>JSON.parse(fs.readFileSync(out+'/'+n+'.json'));
const results={forward:[],sr:[],replacements:[],captureControls:[],siegeControls:[]};
for(const tie of ['N','S']){
 const x=read('forward-tie'),g=x.game,b=new Bot('ap',x.seed);b.dir=makeDeck()[tie==='N'?2:5];
 R.__with(g,A=>{
  const origin=B.S('Bar le Duc'),obj=b.objectiveOf(A,'WEST');assert.equal(obj,B.S('Metz'));
  const candidates=['Verdun','Nancy'].map(name=>{const s=B.S(name);assert.equal(b.piecesAt(A,s,'ap').length,2);assert(b.isMine(A,s)&&b.adjEnemy(A,s));assert(A.can_end_move(s,b.piecesAt(A,origin,'ap')));return {name,weightedDistance:B.dist(origin,s)+.5*B.dist(s,obj),y:B.ycoord(s)};});
  assert.deepEqual(candidates.map(c=>c.weightedDistance),[1.5,1.5]);
  const expected=tie==='N'?'Verdun':'Nancy',actual=B.data.spaces[b.frontLineTarget(A,origin,'WEST',obj)].name;
  assert.equal(actual,'Verdun');const move=b.moveCandidates(A,b.frontsInOrder(A),new Set()).find(m=>m.from===origin&&m.kind==='forward');assert.equal(move.to,B.S(actual));assert(b.hasFirstStep(A,move));
  results.forward.push({tie,expected,actual,candidates});
  // Once Verdun is full, Nancy is chosen: the defect is the missing tie-break, not ignoring capacity.
  const p=B.data.pieces.findIndex((p,i)=>p.faction==='ap'&&p.nation==='fr'&&p.type==='corps'&&g.location[i]===A.AP_RESERVE_BOX);assert(p>0);g.location[p]=B.S('Verdun');b.invalidate();
  assert.equal(b.frontLineTarget(A,origin,'WEST',obj),B.S('Nancy'));
 });
}
// Capture's actual printed rule says nearer than the ORIGIN, not shortest of all candidate destinations.
// Neither Cherbourg nor Le Mans improves on Caen's distance to Paris; use Tie. This is NOT a defect.
for(const tie of ['N','S']){const x=read('capture-distance'),g=x.game,b=new Bot('ap',x.seed);b.dir=makeDeck()[tie==='N'?2:5];R.__with(g,A=>{const m=b.moveCandidates(A,b.frontsInOrder(A),new Set()).find(m=>m.from===B.S('Caen')&&m.kind==='capture');const actual=B.data.spaces[m.to].name;assert.equal(actual,tie==='N'?'Cherbourg':'Le Mans');assert(b.hasFirstStep(A,m));results.captureControls.push({tie,actual});});}
// Same printed tie-break also applies to equally ranked units in different spaces.
for(const [fixture,key,ids] of [['sr-tie','sr',[68,69]],['rp-tie','replacements',[1,2]]])for(const tie of ['N','S']){
 const x=read(fixture),g=x.game,b=new Bot('cp',x.seed);b.dir=makeDeck()[tie==='N'?0:3];const v=R.view(g,g.active);assert.deepEqual(v.actions.piece,ids);
 const a=b.decide(g,v),actual=B.data.spaces[g.location[a[1]]].name;assert.equal(actual,'Stuttgart');
 results[key].push({tie,staff:b.dir.id,expected:tie==='N'?'Berlin':'Stuttgart',actual,action:a});
 const next=R.action(g,g.active,...a);if(key==='sr')assert.equal(next.sr.unit,ids[0]);else {assert(!next.reduced.includes(ids[0]));assert(next.reduced.includes(ids[1]));}
}
// Previous corps-siege fix: two corps may enter the level-2 fort; one may not.
for(const count of [1,2]){const x=require(repo+'/sim/tests/fixtures/corps-siege.json'),g=structuredClone(x.game);if(count===1)g.location[69]=0;const b=new Bot('cp',88);b.dir=x.staff;const actual=R.__with(g,A=>b.moveCandidates(A,b.frontsInOrder(A),new Set()).some(m=>m.from===B.S('Mulhouse')&&m.to===B.S('Belfort')&&m.kind==='siege'));assert.equal(actual,count===2);g.move={pieces:[68],current:B.S('Mulhouse'),initial:B.S('Mulhouse')};const group=count===2?[68,69]:[68];b.invalidate();const groupCanEnter=R.__with(g,A=>b.legalSteps(A,{space:[B.S('Belfort')]},group).includes(B.S('Belfort')));assert.equal(groupCanEnter,count===2);results.siegeControls.push({count,candidate:actual,groupCanEnter});}
fs.writeFileSync(out+'/focused-policy-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
