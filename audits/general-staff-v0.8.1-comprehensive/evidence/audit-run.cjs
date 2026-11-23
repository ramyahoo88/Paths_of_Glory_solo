'use strict';
// Run in an audit directory: node audit-run.cjs REPO POLICY SIDE N START OUTPUT [trace]
const fs=require('fs'),path=require('path'),assert=require('assert');
const [repoArg,policy,side,nArg,startArg,outArg,traceArg]=process.argv.slice(2);
const repo=path.resolve(repoArg),out=path.resolve(outArg),n=+nArg,start=+startArg;
const R=require(repo+'/engine/rules.js'),B=require(repo+'/sim/board.js');
const {Bot,ROLE}=require(repo+'/sim/bot.js');
const options={
 release:{},
 pressure:{fixedStance:'A',fixedPlan:'O'},
 preservation:{fixedStance:'H',fixedPlan:'L',rpStep:3,rpMin:1.5,rpCard:1},
 exploitation:{fixedStance:'A',fixedPlan:'O',shortlist:0,moPrep:true,gaps:true,captureV:3},
};
assert(options[policy]);
const all=[];let firstUnsafe=null;
const legal=(acts,a)=>a&&Object.hasOwn(acts,a[0])&&acts[a[0]]!==0&&(Array.isArray(acts[a[0]])?acts[a[0]].includes(a[1]):a[1]===undefined);
for(let seed=start;seed<start+n;seed++){
 let g=R.setup(seed,'Historical',{no_supply_warnings:true});
 const P={ap:new Bot('ap',seed,{...(side==='ap'?options[policy]:{}),trace:!!traceArg}),cp:new Bot('cp',seed,{...(side==='cp'?options[policy]:{}),trace:!!traceArg})};
 const states={},trace=[],roundWork=[],supplyCases=[],phaseTransitions=[],deckCycles={ap:[],cp:[]};
 let steps=0,error=null,hiddenChecks=0,scoreChecks=0;
 for(const p of Object.values(P)){
  const origPlan=p.planOps,origEval=p.evalAttack,origMove=p.moveCandidates;
  p.work={plans:0,edges:0,moveLists:0,moveEntries:0};
  p.planOps=function(...args){this.work.plans++;return origPlan.apply(this,args)};
  p.evalAttack=function(...args){this.work.edges++;return origEval.apply(this,args)};
  p.moveCandidates=function(...args){const a=origMove.apply(this,args);this.work.moveLists++;this.work.moveEntries+=a.length;return a};
 }
 try {
  while(g.state!=='game_over'&&steps<60000){
   const active=g.active===ROLE.ap?'ap':'cp',enemy=active==='ap'?'cp':'ap',bot=P[active];
   const v=R.view(g,g.active),state=g.state,turn=g.turn,phase=g.phase;
   states[state]=(states[state]||0)+1;
   const workBefore={...bot.work};
   // Non-enumerable guards also redact secrets from the supply helper’s structuredClone.
   // Test that actual decisions cannot inspect the opponent's private hand/deck or engine RNG state.
   const saved=[];
   for(const [obj,key] of [[g[enemy],'hand'],[g.ap,'deck'],[g.cp,'deck'],[g,'seed']]){
    const desc=Object.getOwnPropertyDescriptor(obj,key);if(!desc)continue;
    saved.push([obj,key,desc]);Object.defineProperty(obj,key,{configurable:true,enumerable:false,get(){throw Error('Hidden information read: '+enemy+'.'+key)}});
   }
   let a;try{a=bot.decide(g,v);hiddenChecks++}finally{for(const [obj,key,desc]of saved)Object.defineProperty(obj,key,desc)}
   if(traceArg&&state==='brusilov_offensive_option')fs.writeFileSync(out.replace(/\.json$/,'-fixture.json'),JSON.stringify({seed,step:steps,game:g,staff:bot.dir,action:a,actions:v.actions},null,2));
   assert(legal(v.actions,a),'illegal decision '+state+' '+JSON.stringify(a));
   if(state==='action_phase'){
    const work=Object.fromEntries(Object.keys(workBefore).map(k=>[k,bot.work[k]-workBefore[k]]));
    roundWork.push({turn,side:active,round:g[active].actions.length+1,staff:bot.dir.id,step:bot.step,action:a,...work});
    deckCycles[active].push(bot.dir.id);
   }
   const moving=(a[0]==='space'&&['choose_pieces_to_move','move_stack'].includes(state))?[...g.move.pieces]:[];
   const supplyBefore=moving.length?R.__with(g,A=>A.is_space_supplied(a[1],active)):null;
   const before=(traceArg||moving.length&&!supplyBefore)?JSON.parse(JSON.stringify(g)):null;
   const vpBefore=g.vp,logsBefore=g.log.length;
   g=R.action(g,g.active,a[0],a[1]);steps++;
   // Independent VP ledger: every actual VP change must equal the explicit +/- VP entries added to the log.
   const added=g.log.slice(logsBefore);
   if(!['undo','reset_phase'].includes(a[0])){
    let delta=0;for(const line of added){const m=String(line).match(/([+-]\d+) VP\b/);if(m)delta+=+m[1]}
    assert.strictEqual(g.vp-vpBefore,delta,'VP ledger at '+state+' '+JSON.stringify(added));scoreChecks++;
   }
   if(moving.length){
    const actual=R.__with(g,A=>{A.update_supply();return moving.filter(p=>!A.is_unit_supplied(p))});
    if(actual.length){const c={seed,step:steps-1,turn,side:active,state,from:before?.move.current,to:a[1],pieces:moving,unsupplied:actual,move:bot.curMove,supplyBefore};supplyCases.push(c);if(!firstUnsafe&&before){firstUnsafe={...c,game:before};fs.writeFileSync(out.replace(/\.json$/,'-unsafe.json'),JSON.stringify(firstUnsafe))}}
   }
   if(traceArg)trace.push({i:steps-1,turn,side:active,state,action:a,actionName:a[0]+(a[0]==='space'?' '+B.data.spaces[a[1]]?.name:a[0]==='piece'?' '+B.data.pieces[a[1]]?.name:''),newState:g.state,vp:g.vp,log:added});
   if(phase!==g.phase)phaseTransitions.push({turn:g.turn,phase:g.phase,vp:g.vp,state:g.state});
   if(g.log.length>600&&!traceArg)g.log=g.log.slice(-200);
  }
  assert.strictEqual(g.state,'game_over');
  for(const ids of Object.values(deckCycles))for(let i=0;i+18<=ids.length;i+=18)assert.strictEqual(new Set(ids.slice(i,i+18)).size,18);
 }catch(e){error=e.stack}
 const rec={seed,policy,side,result:g.result||null,victory:g.victory||null,turn:g.turn,vp:g.vp,steps,error,hiddenChecks,scoreChecks,states,supplyCases,roundWork,stats:{ap:P.ap.stats,cp:P.cp.stats},missedMO:{ap:g.ap.missed_mo?.length,cp:g.cp.missed_mo?.length},phaseTransitions};
 all.push(rec);
 if(traceArg){fs.writeFileSync(out.replace(/\.json$/,`-trace-${seed}.json`),JSON.stringify({seed,actions:trace,rounds:{ap:P.ap.trace,cp:P.cp.trace},final:g},null,2))}
 if(error){console.error(seed,error.split('\n')[0]);}
}
fs.writeFileSync(out,JSON.stringify({repository:repo,commit:require('child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),engine:'c58b0b4a33e227faf73cbe561f3bede17087a142',policy,side,n,start,games:all},null,2));
console.log(JSON.stringify({policy,side,n,start,ap:all.filter(g=>g.result===ROLE.ap).length,cp:all.filter(g=>g.result===ROLE.cp).length,errors:all.filter(g=>g.error).length,steps:all.reduce((s,g)=>s+g.steps,0),supplyCases:all.reduce((s,g)=>s+g.supplyCases.length,0)}));
