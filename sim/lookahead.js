// A stronger test opponent: General Staff plus a one-round lookahead at each action phase.
// For each candidate first action it plays out the rest of its own action round and the opponent's
// next round with General Staff policies (dice re-seeded so the future is unknown), scores the
// position, and picks the best. Used only to stress-test the bot; it is not part of the rules.
"use strict"
const R = require('../engine/rules.js')
const { Bot, fallback, ROLE } = require('./bot.js')
const data = require('../engine/data.js')

function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 } }

function clone(g) {
  const u = g.undo, l = g.log
  g.undo = []; g.log = []
  const c = JSON.parse(JSON.stringify(g))
  g.undo = u; g.log = l
  return c
}

function material(g, side) {
  let m = 0
  for (let p = 1; p < data.pieces.length; p++) {
    const pd = data.pieces[p]; if (pd.faction !== side) continue
    const loc = g.location[p]
    if (!loc || loc === 284 || loc === 285 || loc === 360) continue
    const red = g.reduced.includes(p)
    m += (pd.type === 'army' ? 2 : 1) * (red ? 1 : 2)
  }
  return m
}

function evaluate(g, side) {
  const enemy = side === 'ap' ? 'cp' : 'ap'
  if (g.state === 'game_over') return g.result === ROLE[side] ? 1000 : -1000
  const vp = side === 'cp' ? g.vp : -g.vp
  return vp * 1.0 + 0.12 * (material(g, side) - material(g, enemy)) + 0.15 * (g[side].ws - g[enemy].ws) + 0.1 * Object.entries(g.rp).reduce((a, [k, v]) => a + ((['fr', 'br', 'ru', 'it', 'us', 'allied'].includes(k) ? 'ap' : 'cp') === side ? v : -v), 0)
}

class LookaheadPlayer {
  constructor(side, seed, opts = {}) {
    this.side = side; this.seed = seed
    this.gs = new Bot(side, seed, opts.botOpts || {})
    this.stats = this.gs.stats
    this.r = rng(seed * 977 + 3)
    this.rollouts = opts.rollouts || 2
    this.maxCand = opts.maxCand || 10
    this.la = { decisions: 0, deviations: 0 }
  }
  candidates(g, view) {
    const acts = view.actions || {}
    const out = []
    const add = a => { if (!out.some(x => x[0] === a[0] && x[1] === a[1])) out.push(a) }
    for (const c of acts.play_event || []) add(['play_event', c])
    const opsCards = (acts.play_ops || []).slice().sort((a, b) => data.cards[b].ops - data.cards[a].ops)
    for (const c of opsCards.slice(0, 4)) add(['play_ops', c])
    if ((acts.play_rps || []).length) add(['play_rps', acts.play_rps[0]])
    if ((acts.play_sr || []).length) add(['play_sr', acts.play_sr[0]])
    if (acts.single_op) add(['single_op'])
    return out.slice(0, this.maxCand)
  }
  rollout(g0, first) {
    let g = clone(g0)
    g.seed = Math.floor(this.r() * 2147483646) + 1
    const role = ROLE[this.side]
    const bots = { [ROLE.ap]: new Bot('ap', g.seed, this.side === 'ap' ? this.gs.opts : {}), [ROLE.cp]: new Bot('cp', g.seed, this.side === 'cp' ? this.gs.opts : {}) }
    try {
      g = R.action(g, role, first[0], first[1])
      // continue until our next action phase (own round + opponent's round), or the turn ends
      let phases = 0, steps = 0
      while (g.state !== 'game_over' && steps < 600) {
        if (g.state === 'action_phase') { phases++; if (phases >= 2) break }
        const r = g.active; const v = R.view(g, r)
        const a = bots[r].decide(g, v) || fallback(v.actions)
        g = R.action(g, r, a[0], a[1]); steps++
        if (g.state === 'draw_cards_phase' || g.state === 'attrition_phase') break
      }
    } catch (e) { return -999 }
    return evaluate(g, this.side)
  }
  decide(g, view) {
    if (g.state !== 'action_phase') return this.gs.decide(g, view)
    // the bot's own choice (draws its Staff card and makes its plan)
    const base = this.gs.decide(g, view)
    const cands = this.candidates(g, view)
    if (!cands.some(c => c[0] === base[0] && c[1] === base[1])) cands.unshift(base)
    let best = base, bestV = -Infinity
    for (const c of cands) {
      let v = 0
      for (let i = 0; i < this.rollouts; i++) v += this.rollout(g, c)
      v /= this.rollouts
      if (c === base || (c[0] === base[0] && c[1] === base[1])) v += 0.05 // tie goes to the bot's own choice
      if (v > bestV) { bestV = v; best = c }
    }
    this.la.decisions++
    if (best[0] !== base[0] || best[1] !== base[1]) { this.la.deviations++; this.gs.plan = null }
    return best
  }
}

module.exports = { LookaheadPlayer }

if (require.main === module) {
  // usage: node lookahead.js <laSide ap|cp> n start
  const { playGame } = require('./play.js')
  const laSide = process.argv[2], n = +process.argv[3], start = +process.argv[4]
  let laWins = 0, cnt = 0, dev = 0, dec = 0
  for (let seed = start; seed < start + n; seed++) {
    const mkLA = (s, sd) => new LookaheadPlayer(s, sd)
    const mkGS = (s, sd) => new Bot(s, sd)
    let r
    const holder = {}
    try { r = laSide === 'ap' ? playGame(seed, (s, sd) => (holder.la = mkLA(s, sd)), mkGS) : playGame(seed, mkGS, (s, sd) => (holder.la = mkLA(s, sd))) } catch (e) { continue }
    cnt++; if (r.result === ROLE[laSide]) laWins++
    dev += holder.la.la.deviations; dec += holder.la.la.decisions
    console.log(seed, r.result, r.victory, 'T' + r.turn, 'VP' + r.vp, 'dev', holder.la.la.deviations + '/' + holder.la.la.decisions)
  }
  console.log(JSON.stringify({ laSide, n: cnt, laWinRate: +(laWins / cnt).toFixed(3), deviationRate: +(dev / dec).toFixed(3) }))
}
