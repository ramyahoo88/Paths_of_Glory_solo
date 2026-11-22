// Final evaluation runs for the simulation report.
// usage: node final_eval.js <job> <n> <start> > out.json
//   jobs: self | rnd-ap | rnd-cp | naive-ap | naive-cp
"use strict"
const R = require('../engine/rules.js')
const { Bot, fallback, ROLE } = require('./bot.js')
const { RandomPlayer } = require('./play.js')
const data = require('../engine/data.js')

const NAIVE = { events: false, maxAttacks: 1, sr: false, crisis: false, advance: 'never', gaps: false, shortlist: 0, moves: false }
const job = process.argv[2], n = +process.argv[3], start = +process.argv[4]
const mk = {
  bot: (side, seed) => new Bot(side, seed, {}),
  rnd: (side, seed) => new RandomPlayer(side, seed),
  naive: (side, seed) => new Bot(side, seed, NAIVE),
}
const pairing = { self: ['bot', 'bot'], 'rnd-ap': ['bot', 'rnd'], 'rnd-cp': ['rnd', 'bot'], 'naive-ap': ['bot', 'naive'], 'naive-cp': ['naive', 'bot'] }[job]

const games = []
for (let seed = start; seed < start + n; seed++) {
  let g = R.setup(seed, 'Historical', { no_supply_warnings: true })
  const P = { [ROLE.ap]: mk[pairing[0]]('ap', seed), [ROLE.cp]: mk[pairing[1]]('cp', seed) }
  const vpByTurn = [], milestones = {}
  let turn = 1, steps = 0, err = null
  try {
    while (g.state !== 'game_over' && steps < 60000) {
      const role = g.active
      const v = R.view(g, role)
      let a
      try { a = P[role].decide(g, v) } catch (e) { if (/unresolvable/.test(e.message)) throw e; a = null }
      if (!a) a = fallback(v.actions)
      g = R.action(g, role, a[0], a[1])
      if (g.log.length > 400) g.log = g.log.slice(-100)
      steps++
      if (g.turn !== turn) { vpByTurn.push(g.vp); turn = g.turn }
      const w = g.war
      for (const k of ['it', 'bu', 'ro', 'gr', 'us', 'tu']) if (w[k] && !milestones[k]) milestones[k] = w[k]
      if (g.ap.commitment === 'limited' && !milestones.apLimited) milestones.apLimited = g.turn
      if (g.ap.commitment === 'total' && !milestones.apTotal) milestones.apTotal = g.turn
      if (g.cp.commitment === 'limited' && !milestones.cpLimited) milestones.cpLimited = g.turn
      if (g.cp.commitment === 'total' && !milestones.cpTotal) milestones.cpTotal = g.turn
      for (const k of ['tsar_takes_command', 'fall_of_the_tsar', 'bolshevik_revolution', 'treaty_of_brest_litovsk']) if (g.events[k] && !milestones[k]) milestones[k] = g.events[k]
    }
  } catch (e) { err = e.message }
  const st = s => P[ROLE[s]].stats || {}
  games.push({
    seed, result: g.result || null, victory: g.victory || null, turn: g.turn, vp: g.vp, err, steps, vpByTurn, milestones,
    missedMO: { ap: (g.ap.missed_mo || []).length, cp: (g.cp.missed_mo || []).length },
    stats: { ap: pick(st('ap')), cp: pick(st('cp')) },
  })
}
function pick(s) { const o = {}; for (const k of Object.keys(s)) if (k.startsWith('step:')) o[k] = s[k]; for (const k of ['rounds', 'events', 'ops', 'sr', 'rp', 'single', 'attacks', 'advances', 'evals', 'violations', 'errors', 'edgeSum', 'idle']) if (s[k] !== undefined) o[k] = s[k]; o.steps = s.steps; return o }
console.log(JSON.stringify({ job, pairing, n, start, games }))
