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
// STRICT=1: stop a game at the first unexpected decision exception instead of substituting the engine's first legal action.
const STRICT = process.env.STRICT === '1'
const MAX_STEPS = 60000
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
  const exceptions = [] // every decision exception, with where it happened
  const supplyBreaches = [] // movement steps that left moving units out of supply
  try {
    while (g.state !== 'game_over' && steps < MAX_STEPS) {
      const role = g.active
      const v = R.view(g, role)
      let a
      try { a = P[role].decide(g, v) } catch (e) {
        if (/unresolvable/.test(e.message) || STRICT) throw e
        exceptions.push({ side: role === ROLE.ap ? 'ap' : 'cp', turn: g.turn, state: g.state, message: e.message })
        a = null
      }
      if (!a) a = fallback(v.actions)
      const moving = (g.state === 'choose_pieces_to_move' || g.state === 'move_stack') && a[0] === 'space' && g.move ? g.move.pieces.slice() : null
      g = R.action(g, role, a[0], a[1])
      // supply-policy check (rules §6): after each movement step, are the moving units in supply? (judged on a copy)
      if (moving && moving.length) {
        const c = structuredClone(g)
        const out = R.__with(c, A => { A.update_supply(); return moving.filter(p => !A.is_unit_supplied(p)) })
        if (out.length) supplyBreaches.push({ side: role === ROLE.ap ? 'ap' : 'cp', turn: g.turn, space: g.location[moving[0]], pieces: out })
      }
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
  } catch (e) { err = e.message + (STRICT ? ' [' + g.state + ', turn ' + g.turn + ']' : '') }
  if (!err && g.state !== 'game_over') err = 'unfinished: step cap reached'
  const st = s => P[ROLE[s]].stats || {}
  games.push({
    seed, result: g.result || null, victory: g.victory || null, turn: g.turn, vp: g.vp, err, complete: !err && g.state === 'game_over', exceptions, supplyBreaches, steps, vpByTurn, milestones,
    missedMO: { ap: (g.ap.missed_mo || []).length, cp: (g.cp.missed_mo || []).length },
    stats: { ap: pick(st('ap')), cp: pick(st('cp')) },
  })
}
function pick(s) {
  const o = {}
  for (const k of Object.keys(s)) if (k.startsWith('step:')) o[k] = s[k]
  for (const k of ['rounds', 'events', 'ops', 'sr', 'rp', 'single', 'attacks', 'advances', 'evals', 'violations', 'undos', 'abandoned', 'holdMoves', 'passThrough', 'calledOff', 'salonikaForced', 'supplyStops', 'errors', 'edgeSum', 'idle']) if (s[k] !== undefined) o[k] = s[k]
  // fallback reasons: engine states with no bot handler (engine default taken), rejected bot proposals, rule-violation kinds
  o.fallback = Object.assign({}, s.fallback || {})
  o.steps = s.steps
  return o
}
console.log(JSON.stringify({ job, pairing, n, start, bot: require('./provenance.js').stamp(__dirname), games }))
