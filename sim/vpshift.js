// Self-play with the starting VP shifted (difficulty handicap study).
// usage: node vpshift.js shift firstSeed endSeed   (endSeed exclusive). Prints the aggregate and one record per seed.
// A decision exception or a step-cap exit is recorded as an error game, never silently dropped.
const R = require('../engine/rules.js')
const { Bot, fallback, ROLE } = require('./bot.js')
const shift = +process.argv[2], n0 = +process.argv[3], n1 = +process.argv[4]
let ap = 0, cp = 0, n = 0, errors = 0
const games = []
for (let seed = n0; seed < n1; seed++) {
  let g = R.setup(seed, 'Historical', { no_supply_warnings: true }), substituted = 0
  g.vp += shift
  const P = { [ROLE.ap]: new Bot('ap', seed), [ROLE.cp]: new Bot('cp', seed) }
  try {
    for (let i = 0; i < 60000 && g.state !== 'game_over'; i++) {
      const role = g.active, v = R.view(g, role)
      let a = P[role].decide(g, v)
      if (!a) { a = fallback(v.actions); substituted++ }
      g = R.action(g, role, a[0], a[1]); if (g.log.length > 400) g.log = g.log.slice(-100)
    }
    if (g.state !== 'game_over') throw new Error('unfinished: step cap reached')
  } catch (e) { errors++; games.push({ seed, error: e.message }); continue }
  n++; if (g.result === 'Allied Powers') ap++; else if (g.result === 'Central Powers') cp++
  games.push({ seed, result: g.result, victory: g.victory, turn: g.turn, vp: g.vp, substituted })
}
console.log(JSON.stringify({ shift, startVP: 10 + shift, n, errors, ap: +(ap / n).toFixed(3), cp: +(cp / n).toFixed(3), bot: require('./provenance.js').stamp(__dirname), games }))
