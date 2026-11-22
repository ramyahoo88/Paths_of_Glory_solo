const R = require('../engine/rules.js')
const { Bot, fallback, ROLE } = require('./bot.js')
const n0=+process.argv[2], n1=+process.argv[3]
const miss = { ap: {}, cp: {} }; let games = 0, apw = 0
for (let seed = n0; seed < n1; seed++) {
  let g = R.setup(seed, 'Historical', { no_supply_warnings: true })
  const P = { [ROLE.ap]: new Bot('ap', seed), [ROLE.cp]: new Bot('cp', seed) }
  let lastMo = { ap: null, cp: null }, lastLen = { ap: 0, cp: 0 }
  for (let i = 0; i < 60000 && g.state !== 'game_over'; i++) {
    for (const s of ['ap', 'cp']) if (g[s].mo && g[s].mo !== 'none') lastMo[s] = g[s].mo
    const role = g.active; const v = R.view(g, role)
    const a = P[role].decide(g, v) || fallback(v.actions)
    g = R.action(g, role, a[0], a[1])
    for (const s of ['ap', 'cp']) if (g[s].missed_mo.length > lastLen[s]) { lastLen[s] = g[s].missed_mo.length; miss[s][lastMo[s]] = (miss[s][lastMo[s]] || 0) + 1 }
  }
  games++; if (g.result === 'Allied Powers') apw++
}
console.log('games', games, 'AP wins', apw, 'missed MO by nation', JSON.stringify(miss))
