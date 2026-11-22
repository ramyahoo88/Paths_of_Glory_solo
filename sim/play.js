// Runs a game between two policies on the Rally the Troops engine.
"use strict"
const R = require('../engine/rules.js')
const { Bot, fallback, ROLE } = require('./bot.js')

function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 } }

class RandomPlayer {
  constructor(side, seed) { this.side = side; this.r = rng(seed * 31 + 7); this.stats = {} }
  decide(g, view) {
    const L = []
    for (const [a, x] of Object.entries(view.actions || {})) { if (['undo', 'propose_rollback', 'flag_supply_warnings', 'reset_phase'].includes(a) || x === 0) continue; if (Array.isArray(x)) x.forEach(y => L.push([a, y])); else L.push([a]) }
    if (!L.length) return fallback(view.actions)
    return L[Math.floor(this.r() * L.length)]
  }
}

function roleOf(g) { return g.active === 'ap' ? ROLE.ap : g.active === 'cp' ? ROLE.cp : g.active }

function playGame(seed, mkAP, mkCP, opts = {}) {
  let g = R.setup(seed, 'Historical', { no_supply_warnings: true })
  const players = { [ROLE.ap]: mkAP('ap', seed), [ROLE.cp]: mkCP('cp', seed) }
  let steps = 0, stuck = 0, lastKey = ''
  const vpTrack = []
  let lastTurn = 0
  while (g.state !== 'game_over' && steps < (opts.maxSteps || 60000)) {
    const role = roleOf(g)
    const pl = players[role]
    if (!pl) throw new Error('No player for ' + role + ' state ' + g.state)
    const view = R.view(g, role)
    if (!view.actions) throw new Error('No actions for ' + role + ' in ' + g.state)
    let a
    try { a = pl.decide(g, view) } catch (e) { if (opts.debug) console.error('decide error', g.state, e.stack); a = fallback(view.actions); pl.stats.errors = (pl.stats.errors || 0) + 1; (pl.stats.errorKinds = pl.stats.errorKinds || {})[g.state + ':' + e.message.slice(0, 60)] = 1 }
    if (!a) a = fallback(view.actions)
    if (!a) throw new Error('No legal action in ' + g.state)
    if (a[0] === 'undo') { stuck++ }
    try { g = R.action(g, role, a[0], a[1]) } catch (e) {
      if (opts.debug) console.error('action error', g.state, a, e.message)
      const fb = fallback(view.actions)
      g = R.action(g, role, fb[0], fb[1])
    }
    if (g.log && g.log.length > 400) g.log = g.log.slice(-200)
    if (g.turn !== lastTurn) { vpTrack.push(g.vp); lastTurn = g.turn }
    steps++
    if (stuck > 50) throw new Error('stuck in ' + g.state)
  }
  return { seed, result: g.result, victory: g.victory, turn: g.turn, vp: g.vp, steps, vpTrack, g, stats: { ap: players[ROLE.ap].stats, cp: players[ROLE.cp].stats } }
}

module.exports = { playGame, RandomPlayer, Bot }

if (require.main === module) {
  const n = +(process.argv[2] || 4), start = +(process.argv[3] || 1)
  const kind = process.argv[4] || 'bot-bot'
  const mk = k => k === 'rnd' ? ((s, seed) => new RandomPlayer(s, seed)) : ((s, seed) => new Bot(s, seed))
  const [ka, kc] = kind.split('-').map(x => x === 'bot' ? 'bot' : 'rnd')
  const res = { ap: 0, cp: 0 }
  const t0 = Date.now()
  for (let seed = start; seed < start + n; seed++) {
    const r = playGame(seed, mk(ka), mk(kc), { debug: process.env.DEBUG })
    res[r.result === 'Allied Powers' ? 'ap' : r.result === 'Central Powers' ? 'cp' : 'draw'] = (res[r.result === 'Allied Powers' ? 'ap' : r.result === 'Central Powers' ? 'cp' : 'draw'] || 0) + 1
    console.log(seed, r.result, '|', r.victory, '| turn', r.turn, 'vp', r.vp, 'steps', r.steps, 'vp/turn', r.vpTrack.join(','))
    if (process.env.STATS) console.log(JSON.stringify(r.stats))
  }
  console.log(res, ((Date.now() - t0) / n / 1000).toFixed(1) + 's/game')
}
