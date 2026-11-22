// per-turn VP and captures for one game (self-play)
const R = require('../engine/rules.js')
const { Bot, fallback, ROLE } = require('./bot.js')
const seed=+process.argv[2]
let g = R.setup(seed,'Historical',{no_supply_warnings:true})
const P={[ROLE.ap]:new Bot('ap',seed,{trace:true}),[ROLE.cp]:new Bot('cp',seed,{trace:true})}
let li=0, turn=1, caps=[]
for(let i=0;i<60000&&g.state!=='game_over';i++){
  const role=g.active; const v=R.view(g,role); const a=P[role].decide(g,v)||fallback(v.actions)
  g=R.action(g,role,a[0],a[1])
  for(;li<g.log.length;li++){ const L=String(g.log[li]); const m=L.match(/([+-]1) VP s(\d+) captured/); if(m) caps.push(m[1]+require('../engine/data.js').spaces[+m[2]].name) }
  if(g.turn!==turn){ console.log('T'+turn,'VP',g.vp,caps.join(' ')); caps=[]; turn=g.turn }
}
console.log('END',g.victory,g.turn,g.vp)
