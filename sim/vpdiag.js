const R = require('../engine/rules.js')
const { Bot, fallback, ROLE } = require('./bot.js')
const causes = {}
const n=+process.argv[2]||10
for(let seed=1;seed<=n;seed++){
  let g = R.setup(seed,'Historical',{no_supply_warnings:true})
  const P={[ROLE.ap]:new Bot('ap',seed),[ROLE.cp]:new Bot('cp',seed)}
  let li=0
  for(let i=0;i<60000&&g.state!=='game_over';i++){
    const role=g.active; const v=R.view(g,role); const a=P[role].decide(g,v)||fallback(v.actions)
    g=R.action(g,role,a[0],a[1])
    for(;li<g.log.length;li++){ const L=String(g.log[li]); const m=L.match(/([+-]\d) VP[ -]*(.*)/); if(m){ let k=m[2].replace(/ captured/,'').replace(/\(.*\)/,'').trim(); k=k.replace(/^-+ */,''); const key=(m[1][0]==='+'?'CP+ ':'AP- ')+k; causes[key]=(causes[key]||0)+ +m[1] } }
  }
  console.log(seed, g.victory, g.turn, g.vp)
}
console.log(Object.entries(causes).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,45).map(([k,v])=>k+': '+v).join('\n'))
