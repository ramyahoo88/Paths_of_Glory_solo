// Self-play with the starting VP shifted (difficulty handicap study).
const R = require('../engine/rules.js')
const { Bot, fallback, ROLE } = require('./bot.js')
const shift = +process.argv[2], n0 = +process.argv[3], n1 = +process.argv[4]
let ap = 0, cp = 0, n = 0
for (let seed = n0; seed < n1; seed++) {
  let g = R.setup(seed, 'Historical', { no_supply_warnings: true })
  g.vp += shift
  const P = { [ROLE.ap]: new Bot('ap', seed), [ROLE.cp]: new Bot('cp', seed) }
  try {
    for (let i = 0; i < 60000 && g.state !== 'game_over'; i++) { const role = g.active; const v = R.view(g, role); const a = P[role].decide(g, v) || fallback(v.actions); g = R.action(g, role, a[0], a[1]); if (g.log.length > 400) g.log = g.log.slice(-100) }
  } catch (e) { continue }
  n++; if (g.result === 'Allied Powers') ap++; else if (g.result === 'Central Powers') cp++
}
console.log(JSON.stringify({ shift, n, ap: +(ap / n).toFixed(3), cp: +(cp / n).toFixed(3) }))
