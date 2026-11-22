// "General Staff" bot policy for Paths of Glory, executed against the Rally the Troops rules engine.
// Every decision here is meant to be reproducible at the table from the printed procedure:
// it uses only open board information, the bot's own hand, and the Directive card drawn.
"use strict"
const R = require('../engine/rules.js')
const B = require('./board.js')
const EP = require('./events.js')
const data = B.data

const ARMY_EXP = B.expectedTable(R.__api.fire_table.army)
const CORPS_EXP = B.expectedTable(R.__api.fire_table.corps)
const ROLE = { ap: 'Allied Powers', cp: 'Central Powers' }

// ---------------- Directive deck ----------------
// 18 cards: front number 1-6 x stance (A=Assault, P=Press, H=Hold); plan E/O/L spread across them.
const STANCES = ['A', 'P', 'H']
const PLANS = ['O', 'E', 'L']
function makeDeck() {
  const deck = []
  let k = 0
  for (let n = 1; n <= 6; n++) for (let s = 0; s < 3; s++) { deck.push({ id: deck.length + 1, n, stance: STANCES[s], plan: PLANS[(s + n) % 3], tie: (k++ % 2) ? 'S' : 'N' }) }
  return deck
}

// Front tables: directive number (1-6) -> front, by side and War Commitment level.
const FRONT_TABLE = {
  cp: {
    mobilization: ['WEST', 'WEST', 'WEST', 'EAST', 'EAST', 'BALKANS'],
    limited: ['WEST', 'EAST', 'EAST', 'EAST', 'BALKANS', 'NEAREAST'],
    total: ['WEST', 'WEST', 'EAST', 'EAST', 'ITALY', 'BALKANS'],
  },
  ap: {
    mobilization: ['WEST', 'WEST', 'EAST', 'EAST', 'EAST', 'BALKANS'],
    limited: ['WEST', 'WEST', 'EAST', 'EAST', 'ITALY', 'NEAREAST'],
    total: ['WEST', 'WEST', 'WEST', 'EAST', 'ITALY', 'NEAREAST'],
  },
}
// Priority order of fronts after the directive front (per side).
const FRONT_ORDER = { cp: ['WEST', 'EAST', 'ITALY', 'BALKANS', 'NEAREAST'], ap: ['WEST', 'EAST', 'ITALY', 'BALKANS', 'NEAREAST'] }
const STANCE_MIN_EDGE = { A: 0.0, P: 0.75, H: 1.5 }

function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 } }

class Bot {
  constructor(side, seed, opts = {}) {
    this.side = side; this.enemy = side === 'ap' ? 'cp' : 'ap'
    this.role = ROLE[side]
    this.opts = Object.assign({ edgeShift: 0, flank: false, events: true, sr: true, rp: true, entrench: true, guard: true, moves: true, directive: true }, opts)
    this.r = rng(seed * 7919 + (side === 'ap' ? 13 : 29))
    this.deck = makeDeck(); this.shuffle(); this.discard = []
    this.dir = null; this.plan = null
    this.stats = { rounds: 0, events: 0, ops: 0, sr: 0, rp: 0, single: 0, attacks: 0, moves: 0, idle: 0, fallback: {}, cardUse: {}, edgeSum: 0, checks: 0 }
  }
  shuffle() { for (let i = this.deck.length - 1; i > 0; i--) { const j = Math.floor(this.r() * (i + 1)); [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]] } }
  draw() { if (!this.deck.length) { this.deck = this.discard; this.discard = []; this.shuffle() } const c = this.deck.pop(); this.discard.push(c); return c }

  // ---------- main entry ----------
  decide(g, view) {
    const st = g.state
    const h = this['s_' + st]
    if ((st === 'confirm_move_violations' || st === 'choose_sr_unit') && view.violations && view.violations.length) { for (const v of view.violations) { const k = 'viol:' + st + ':' + v.rule + ':' + (this.curMove ? this.curMove.kind : '-'); this.stats.fallback[k] = (this.stats.fallback[k] || 0) + 1 } }
    let res
    this._occ = null; this._edist = null
    if (h) res = R.__with(g, A => h.call(this, A, g, view.actions))
    if (!res || !legal(view.actions, res)) {
      if (res && !legal(view.actions, res)) { this.stats.fallback['illegal:' + st + ':' + res[0]] = (this.stats.fallback['illegal:' + st + ':' + res[0]] || 0) + 1 }
      else if (!h) this.stats.fallback[st] = (this.stats.fallback[st] || 0) + 1
      res = fallback(view.actions)
    }
    return res
  }

  // ================= helpers =================
  me(A) { return this.side }
  occ(A) {
    if (this._occ) return this._occ
    const o = { ap: [], cp: [] }
    for (let i = 0; i < 400; i++) { o.ap.push([]); o.cp.push([]) }
    const loc = A.game.location
    for (let p = 1; p < data.pieces.length; p++) { const s = loc[p]; if (s) o[data.pieces[p].faction][s].push(p) }
    return (this._occ = o)
  }
  // My empty VP/fort spaces with an enemy unit within `r` spaces (closest first).
  threatened(A, r) {
    const ed = this.enemyDist(A), out = []
    for (let t = 1; t < B.N; t++) {
      if (!(data.spaces[t].vp || data.spaces[t].fort || data.spaces[t].capital)) continue
      if (!this.isMine(A, t) || this.piecesAt(A, t, this.side).length) continue
      if (ed[t] <= r) out.push(t)
    }
    return out.sort((a, b) => ed[a] - ed[b] || (data.spaces[b].capital ? 1 : 0) - (data.spaces[a].capital ? 1 : 0))
  }
  // SR feasibility outside an SR action: evaluate with a temporary SR record.
  srDests(A, p) {
    const g = A.game, had = !!g.sr
    if (!had) g.sr = { pts: 99, done: [], unit: 0 }
    let out = []
    try { if (A.can_sr(p)) out = A.get_sr_destinations(p) } finally { if (!had) delete g.sr }
    return out
  }
  invalidate() { this._occ = null; this._edist = null }
  piecesAt(A, s, side) { return this.occ(A)[side][s] || [] }
  // distance from each space to the nearest enemy-occupied space (multi-source BFS)
  enemyDist(A) {
    if (this._edist) return this._edist
    const d = new Array(B.N).fill(99), q = []
    for (let t = 1; t < B.N; t++) if (this.enemyUnitsAt(A, t).length) { d[t] = 0; q.push(t) }
    while (q.length) { const x = q.shift(); for (const y of B.adj[x]) if (d[y] === 99) { d[y] = d[x] + 1; q.push(y) } }
    return (this._edist = d)
  }
  cf(A, ps) { return ps.reduce((a, p) => a + A.get_piece_cf(p), 0) }
  commitment(A) { return A.game[this.side].commitment }
  isMine(A, s) { return A.is_controlled_by(s, this.side) }
  enemyUnitsAt(A, s) { return this.piecesAt(A, s, this.enemy) }
  adjEnemy(A, s) { if (!s || s >= B.N) return false; return B.adj[s].some(t => this.enemyUnitsAt(A, t).length > 0) }
  objectiveOf(A, front) {
    for (const s of B.OBJ[this.side][front]) if (!this.isMine(A, s)) return s
    return null
  }
  frontsInOrder(A) {
    const out = []
    if (this.opts.directive && this.dir) {
      const tbl = FRONT_TABLE[this.side][this.commitment(A)]
      out.push(tbl[this.dir.n - 1])
    }
    for (const f of FRONT_ORDER[this.side]) if (!out.includes(f)) out.push(f)
    return out
  }
  minEdge() { return STANCE_MIN_EDGE[this.dir ? this.dir.stance : 'P'] + this.opts.edgeShift }

  // Expected-hits evaluation of attacking space t with pieces ps (attacker = bot).
  evalAttack(A, ps, t) {
    const defs = this.enemyUnitsAt(A, t)
    let acf = this.cf(A, ps)
    const aArmy = ps.some(p => data.pieces[p].type === 'army')
    let dcf = this.cf(A, defs)
    const dArmy = defs.some(p => data.pieces[p].type === 'army')
    const fort = A.has_undestroyed_fort(t, this.enemy) && A.is_controlled_by(t, this.enemy) ? (data.spaces[t].fort || 0) : 0
    dcf += fort
    let ash = 0, dsh = 0
    const terr = data.spaces[t].terrain
    if (terr === 'mountain' || terr === 'swamp') ash--
    if (defs.length) {
      const tr = A.get_trench_level(t, this.enemy)
      if (tr === 2) { ash -= 2; dsh += 1 } else if (tr === 1) { ash -= 1; dsh += 1 }
    }
    const aTbl = aArmy ? R.__api.fire_table.army : R.__api.fire_table.corps
    const dTbl = (dArmy) ? R.__api.fire_table.army : R.__api.fire_table.corps
    const aCol = colIndex(aTbl, acf, ash), dCol = colIndex(dTbl, dcf, dsh)
    const eA = (aArmy ? ARMY_EXP : CORPS_EXP)[aCol]
    const eD = defs.length || fort ? (dArmy ? ARMY_EXP : CORPS_EXP)[dCol] : 0
    // defender steps available
    const dSteps = defs.reduce((a, p) => a + (A.is_unit_reduced(p) ? 1 : 2), 0) + (fort ? 1 : 0)
    return { edge: eA - eD, eA, eD, dSteps, acf, dcf }
  }

  // ======== Operation planning ========
  // Returns { attacks:[{target, spaces:[..], cost, score}], moves:[{from, to, cost, kind, score}], cost }
  planOps(A, budget, frontsLimit) {
    const plan = { attacks: [], moves: [], cost: 0 }
    const used = new Set()
    const fronts = this.frontsInOrder(A).slice(0, frontsLimit || 5)
    const mo = A.game[this.side].mo
    const roundNo = A.game[this.side].actions.length + 1
    let minEdge = this.minEdge()
    // --- attacks
    const cand = this.attackCandidates(A, fronts, mo, roundNo)
    for (const c of cand) {
      if (plan.cost >= budget) break
      const spaces = c.spaces.filter(s => !used.has(s))
      if (!spaces.length) continue
      // choose spaces to activate greedily by CF until budget; recompute
      let chosen = [], cost = 0
      for (const s of spaces) { const k = A.cost_to_activate(s, 'attack'); if (plan.cost + cost + k <= budget) { chosen.push(s); cost += k } }
      if (!chosen.length) continue
      const ps = chosen.flatMap(s => this.attackersFrom(A, s, c.target))
      if (!ps.length) continue
      const ev = this.evalAttack(A, ps, c.target)
      const score = ev.edge + c.bonus
      if (score < minEdge) continue
      this.stats.checks++
      plan.attacks.push({ target: c.target, spaces: chosen, cost, score, edge: ev.edge, mo: c.mo })
      chosen.forEach(s => used.add(s)); plan.cost += cost
      if (plan.attacks.length >= 3) break
    }
    // --- moves with remaining budget
    if (this.opts.moves) {
      const mv = this.moveCandidates(A, fronts, used)
      for (const m of mv) {
        if (used.has(m.from)) continue
        const k = A.cost_to_activate(m.from, 'move')
        if (plan.cost + k > budget) continue
        plan.moves.push(Object.assign({ cost: k }, m)); used.add(m.from); plan.cost += k
      }
    }
    return plan
  }

  attackersFrom(A, s, t) {
    return this.piecesAt(A, s, this.side).filter(p => !A.game.oos_pieces.includes(p) && A.get_attackable_spaces([p]).includes(t) && A.is_unit_supplied(p))
  }

  attackCandidates(A, fronts, mo, roundNo) {
    const out = []
    const seen = new Set()
    for (let fi = 0; fi < fronts.length; fi++) {
      const f = fronts[fi]
      const obj = this.objectiveOf(A, f)
      // targets: enemy-occupied spaces or enemy-held unbesieged forts on this front adjacent to my supplied units
      for (let t = 1; t < B.N; t++) {
        if (B.FRONT[t] !== f || seen.has(t)) continue
        const defs = this.enemyUnitsAt(A, t)
        const fortT = A.has_undestroyed_fort(t, this.enemy) && A.is_controlled_by(t, this.enemy) && !A.is_besieged(t)
        if (!defs.length && !fortT) continue
        const spaces = []
        for (const s of B.adj[t]) {
          if (!A.is_space_at_war(s) && !this.piecesAt(A, s, this.side).length) continue
          const ap = this.attackersFrom(A, s, t)
          if (ap.length && can_activate_attack(A, s)) spaces.push({ s, cf: this.cf(A, ap) })
        }
        if (!spaces.length) continue
        seen.add(t)
        spaces.sort((a, b) => b.cf - a.cf)
        let bonus = 0
        if (t === obj) bonus += 1.0
        else if (obj && B.dist(t, obj) <= 2) bonus += 0.4
        if (data.spaces[t].vp) bonus += 0.5
        if (fi > 0) bonus -= 0.25 * fi // later fronts slightly less attractive
        let isMo = false
        if (mo && mo !== 'none' && !(A.game.events.french_mutiny > 0 && mo === 'fr')) {
          const allAtt = spaces.flatMap(x => this.attackersFrom(A, x.s, t))
          if (A.satisfies_mo(mo, allAtt, defs, t)) { isMo = true; bonus += roundNo >= 5 ? 6.0 : roundNo >= 3 ? 2.5 : 1.0 }
        }
        // enemy out of supply -> softer target
        if (defs.some(p => A.game.oos_pieces.includes(p))) bonus += 0.5
        // pre-evaluate with all spaces
        const ps = spaces.flatMap(x => this.attackersFrom(A, x.s, t))
        const ev = this.evalAttack(A, ps, t)
        out.push({ target: t, spaces: spaces.map(x => x.s), bonus, pre: ev.edge + bonus, mo: isMo, front: f })
      }
    }
    out.sort((a, b) => b.pre - a.pre || this.tie(a.target, b.target))
    return out
  }

  tie(a, b) { // N/S tie-break via map y (approximated by space index ordering of GPT coords is not available) -> use name order
    const dir = this.dir ? this.dir.tie : 'N'
    return dir === 'N' ? a - b : b - a
  }

  moveCandidates(A, fronts, used) {
    const out = []
    const me = this.side
    // spaces with my movable units
    const mySpaces = new Map()
    for (let p = 1; p < data.pieces.length; p++) {
      if (data.pieces[p].faction !== me) continue
      const s = A.game.location[p]
      if (!s || s >= B.N) continue
      if (!A.is_space_at_war(s)) continue
      if (A.get_piece_mf(p) <= 0) continue
      if (!mySpaces.has(s)) mySpaces.set(s, [])
      mySpaces.get(s).push(p)
    }
    for (const [s, ps] of mySpaces) {
      if (used.has(s)) continue
      const f = B.FRONT[s]
      const fi = fronts.indexOf(f)
      const frontBonus = fi < 0 ? 0 : (fronts.length - fi) * 0.1
      const obj = this.objectiveOf(A, f)
      const contact = this.adjEnemy(A, s)
      // (1) capture: adjacent empty enemy-controlled space (no enemy units, no undestroyed enemy fort)
      let best = null
      for (const t of B.adj[s]) {
        if (A.is_controlled_by(t, me)) continue
        if (this.enemyUnitsAt(A, t).length) continue
        if (A.has_undestroyed_fort(t, this.enemy) && !A.is_besieged(t)) continue
        if (!A.is_space_at_war(t)) continue
        let v = 1.5 + (data.spaces[t].vp ? 2 : 0) + (obj && B.dist(t, obj) < B.dist(s, obj) ? 0.5 : 0)
        if (!best || v > best.score) best = { from: s, to: t, kind: 'capture', score: v + frontBonus }
      }
      if (best) out.push(best)
      // (2) siege: adjacent enemy fort without units -> move in to besiege
      for (const t of B.adj[s]) {
        if (A.has_undestroyed_fort(t, this.enemy) && !A.is_besieged(t) && !this.enemyUnitsAt(A, t).length && A.is_space_at_war(t) &&
            (ps.some(p => data.pieces[p].type === 'army') || Math.min(ps.length, 3) - (this.adjEnemy(A, s) ? 1 : 0) >= (data.spaces[t].fort || 0))) {
          out.push({ from: s, to: t, kind: 'siege', score: 2.0 + (data.spaces[t].vp ? 1 : 0) + frontBonus })
        }
      }
      // (3) reinforce: rear stack (not in contact) moves toward the front objective / front line
      if (!contact && fi >= 0) {
        const target = this.frontLineTarget(A, s, f, obj)
        if (target && B.dist(s, target) >= 1) out.push({ from: s, to: target, kind: 'forward', score: 0.8 + frontBonus + (ps.some(p => data.pieces[p].type === 'army') ? 0.3 : 0) })
      }
      // (4) entrench: army in contact, no trench, entrench event in play
      if (this.opts.entrench && contact && A.game.events.entrench > 0 && A.get_trench_level(s, me) < 2 && ps.some(p => data.pieces[p].type === 'army') && this.isMine(A, s)) {
        out.push({ from: s, to: s, kind: 'entrench', score: (this.dir && this.dir.stance === 'H' ? 1.4 : 0.6) + (data.spaces[s].vp ? 0.3 : 0) - A.get_trench_level(s, me) * 0.3 })
      }
    }
    // (5) gap filling: my empty VP/fort space with an enemy unit within 2 spaces -> nearest stack moves in
    for (const t of this.threatened(A, 2)) {
      let bestS = null, bd = 99
      for (const [s, ps] of mySpaces) { const d = B.dist(s, t); if (d <= 3 && d < bd && !used.has(s) && (ps.length > 1 || !this.adjEnemy(A, s))) { bd = d; bestS = s } }
      if (bestS) out.push({ from: bestS, to: t, kind: 'fill', score: 2.2 + (data.spaces[t].capital ? 1 : 0) + (this.enemyDist(A)[t] === 1 ? 0.8 : 0) })
    }
    out.sort((a, b) => b.score - a.score)
    return out
  }

  frontLineTarget(A, s, f, obj) {
    // nearest space on the same front that is mine, adjacent to an enemy unit, ideally toward the objective
    let best = null, bd = 99
    for (let t = 1; t < B.N; t++) {
      if (B.FRONT[t] !== f || !this.isMine(A, t)) continue
      if (!this.adjEnemy(A, t)) continue
      if (this.piecesAt(A, t, this.side).length >= 3) continue
      const d = B.dist(s, t) + (obj ? 0.5 * B.dist(t, obj) : 0)
      if (d < bd) { bd = d; best = t }
    }
    if (!best && obj) best = obj
    return best
  }

  // ================= card choice =================
  handInfo(A) {
    return A.game[this.side].hand.map(c => ({ c, d: data.cards[c], pr: EP.priority(this, A, c) }))
  }

  s_action_phase(A, g, acts) {
    this.stats.rounds++
    this.noMove = !!this.violation; this.violation = false
    this.dir = this.draw()
    const hand = this.handInfo(A)
    const evLegal = new Set(acts.play_event || [])
    const opsLegal = new Set(acts.play_ops || [])
    const roundNo = A.game[this.side].actions.length + 1
    // 0. forced
    if (evLegal.size && !opsLegal.size) return this.useEvent([...evLegal][0])
    // 1. urgent events (priority >= 8)
    const evs = hand.filter(h => evLegal.has(h.c) && h.pr >= 1).sort((a, b) => b.pr - a.pr || a.d.ops - b.d.ops)
    if (this.opts.events && evs.length && evs[0].pr >= 8) return this.useEvent(evs[0].c)
    // budget available: max ops among non-urgent cards
    const opsCards = hand.filter(h => opsLegal.has(h.c))
    const maxOps = Math.max(1, ...opsCards.map(h => h.d.ops))
    const savedMoves = this.opts.moves
    if (this.noMove) this.opts.moves = false
    const plan = this.planOps(A, maxOps)
    this.opts.moves = savedMoves
    const attackCost = plan.attacks.reduce((a, x) => a + x.cost, 0)
    const planValue = plan.attacks.reduce((a, x) => a + 1.5 + Math.max(0, x.score), 0) + plan.moves.reduce((a, x) => a + 0.4 * x.score, 0)
    // Mandated Offensive step: from round opts.moRound, an MO attack in the plan takes precedence
    const moPending = A.game[this.side].mo && A.game[this.side].mo !== 'none'
    if (moPending && roundNo >= (this.opts.moRound || 3) && plan.attacks.some(a => a.mo)) return this.useOps(A, hand, opsLegal, plan, attackCost)
    // Crisis step: an empty VP space of mine with an enemy unit adjacent -> fill it (move or SR)
    if (this.opts.crisis !== false) {
      const crisis = this.threatened(A, 1)
      if (crisis.length) {
        if (plan.moves.some(m => m.kind === 'fill')) return this.useOps(A, hand, opsLegal, plan, 0)
        const l = this.logistics(A, hand, acts, roundNo, false, true)
        if (l) return l
      }
    }
    const order = this.dir.plan === 'E' ? ['event', 'ops', 'log'] : this.dir.plan === 'L' ? ['log', 'ops', 'event'] : ['ops', 'event', 'log']
    for (const step of order) {
      if (step === 'event' && this.opts.events && evs.length && evs[0].pr >= 5) return this.useEvent(evs[0].c)
      if (step === 'ops' && plan.attacks.length) return this.useOps(A, hand, opsLegal, plan, attackCost)
      if (step === 'log') {
        const l = this.logistics(A, hand, acts, roundNo)
        if (l) return l
      }
    }
    // weaker options: moves only, medium events, logistics
    if (this.opts.events && evs.length && evs[0].pr >= 3) return this.useEvent(evs[0].c)
    if (plan.moves.length && planValue >= 0.6) return this.useOps(A, hand, opsLegal, plan, 0)
    const l2 = this.logistics(A, hand, acts, roundNo, true)
    if (l2) return l2
    this.stats.idle++
    // nothing useful: 1 OP automatic operation (entrench / move) or pass
    this.plan = this.planOps(A, 1)
    this.stats.single++
    return ['single_op']
  }

  useEvent(c) { this.stats.events++; this.stats.cardUse[c] = 'evt'; this.plan = null; return ['play_event', c] }

  useOps(A, hand, opsLegal, plan, attackCost) {
    const need = Math.max(1, attackCost || plan.cost)
    if (need <= 1 && plan.attacks.length <= 1 && (plan.cost <= 1)) { this.plan = plan; this.stats.single++; this.stats.ops++; return ['single_op'] }
    // choose card: lowest event priority among cards with ops >= need, then lowest ops
    const cands = hand.filter(h => opsLegal.has(h.c) && h.d.ops >= need)
    let pick
    if (cands.length) pick = cands.sort((a, b) => (a.pr >= 6) - (b.pr >= 6) || a.d.ops - b.d.ops || a.pr - b.pr)[0]
    else pick = hand.filter(h => opsLegal.has(h.c)).sort((a, b) => b.d.ops - a.d.ops)[0]
    if (!pick) { this.plan = plan; return ['single_op'] }
    // re-plan with the actual budget so leftover OPS are used
    const savedMoves = this.opts.moves
    if (this.noMove) this.opts.moves = false
    this.plan = this.planOps(A, pick.d.ops)
    this.opts.moves = savedMoves
    this.stats.ops++
    this.stats.cardUse[pick.c] = 'ops'
    return ['play_ops', pick.c]
  }

  rpNeed(A) {
    // count steps missing per RP type among my units (reduced on map, eliminated)
    const need = {}
    for (let p = 1; p < data.pieces.length; p++) {
      const pd = data.pieces[p]; if (pd.faction !== this.side) continue
      const loc = A.game.location[p]
      const t = pd.rptype || pd.nation
      if (loc === (this.side === 'ap' ? A.AP_ELIMINATED_BOX : A.CP_ELIMINATED_BOX)) need[t] = (need[t] || 0) + (pd.type === 'army' ? 2 : 1)
      else if (loc && loc < B.N && A.is_unit_reduced(p)) need[t] = (need[t] || 0) + (pd.type === 'army' ? 1 : 0.5)
    }
    return need
  }

  logistics(A, hand, acts, roundNo, weak, crisisOnly) {
    if (crisisOnly) {
      if (!this.opts.sr || this.noMove || !acts.play_sr || !acts.play_sr.length) return null
      const sr = this.srCandidates(A, true)
      if (!sr.length) return null
      const cards = hand.filter(h => acts.play_sr.includes(h.c) && h.pr < 7).sort((a, b) => a.pr - b.pr || a.d.sr - b.d.sr)
      if (cards.length) { this.stats.sr++; this.stats.crisisSR = (this.stats.crisisSR || 0) + 1; this.stats.cardUse[cards[0].c] = 'sr'; return ['play_sr', cards[0].c] }
      return null
    }
    // RP: play the card giving most useful RP if need is substantial
    if (this.opts.rp && acts.play_rps && acts.play_rps.length) {
      const need = this.rpNeed(A)
      const have = A.game.rp
      let total = 0
      for (const t in need) total += Math.max(0, need[t] - (have[t] || 0) - (t !== 'ge' && t !== 'ah' && t !== 'fr' && t !== 'br' && t !== 'ru' && t !== 'it' && t !== 'us' && t !== 'tu' && t !== 'bu' ? 0 : 0))
      const thresh = weak ? 1.5 : 3
      if (total >= thresh) {
        let best = null
        for (const h of hand) {
          if (!acts.play_rps.includes(h.c) || h.pr >= 7) continue
          let v = 0
          for (const k of Object.keys(h.d)) if (k.startsWith('rp')) { const t = k.slice(2) === 'a' ? 'allied' : k.slice(2); const n = need[t] || (t === 'allied' ? (need.be || 0) + (need.sb || 0) + (need.mn || 0) + (need.gr || 0) + (need.ro || 0) : 0); v += Math.min(h.d[k], n) }
          if (v >= (weak ? 1 : 2) && (!best || v > best.v || (v === best.v && h.pr < best.pr))) best = { c: h.c, v, pr: h.pr }
        }
        if (best) { this.stats.rp++; this.stats.cardUse[best.c] = 'rp'; return ['play_rps', best.c] }
      }
    }
    // SR: units in reserve box or far from the front
    if (this.opts.sr && !this.noMove && acts.play_sr && acts.play_sr.length) {
      const sr = this.srCandidates(A)
      const need = sr.reduce((a, x) => a + x.cost, 0)
      if (sr.length && (need >= 4 || (weak && need >= 1))) {
        const cards = hand.filter(h => acts.play_sr.includes(h.c) && h.pr < 7).sort((a, b) => Math.abs(a.d.sr - Math.min(need, 5)) - Math.abs(b.d.sr - Math.min(need, 5)) || a.pr - b.pr)
        if (cards.length) { this.stats.sr++; this.stats.cardUse[cards[0].c] = 'sr'; return ['play_sr', cards[0].c] }
      }
    }
    return null
  }

  srCandidates(A, crisis) {
    const out = []
    if (crisis) {
      const thr = this.threatened(A, 1)
      if (!thr.length) return out
      for (let p = 1; p < data.pieces.length; p++) {
        const pd = data.pieces[p]; if (pd.faction !== this.side) continue
        const loc = A.game.location[p]
        if (!loc || loc === A.PERM_ELIMINATED_BOX || loc === A.AP_ELIMINATED_BOX || loc === A.CP_ELIMINATED_BOX) continue
        if (loc < B.N && (this.adjEnemy(A, loc) || this.piecesAt(A, loc, this.side).length < 2 && this.enemyDist(A)[loc] <= 2)) continue
        const dests = this.srDests(A, p)
        if (dests.some(d => thr.includes(d))) out.push({ p, cost: pd.type === 'army' ? 4 : 1, why: 'crisis' })
      }
      return out
    }
    const reserve = this.side === 'ap' ? A.AP_RESERVE_BOX : A.CP_RESERVE_BOX
    for (let p = 1; p < data.pieces.length; p++) {
      const pd = data.pieces[p]; if (pd.faction !== this.side) continue
      const loc = A.game.location[p]
      if (loc === reserve) { out.push({ p, cost: pd.type === 'army' ? 4 : 1, why: 'reserve' }); continue }
      if (!loc || loc >= B.N) continue
      // far from any enemy unit (distance > 3) -> move up
      const near = this.enemyDist(A)[loc]
      if (near > 3 && A.is_space_at_war(loc)) out.push({ p, cost: pd.type === 'army' ? 4 : 1, why: 'rear' })
    }
    return out
  }

  // ================= operations execution =================
  s_activate_spaces(A, g, acts) {
    const plan = this.plan || { attacks: [], moves: [] }
    const att = new Set(acts.activate_attack || []), mov = new Set(acts.activate_move || [])
    for (const a of plan.attacks) for (const s of a.spaces) if (att.has(s)) return ['activate_attack', s]
    for (const m of plan.moves) if (mov.has(m.from)) return ['activate_move', m.from]
    // leftover ops: replan with remaining budget, excluding already activated
    if (!this._replanned) {
      this._replanned = true
      const extra = this.planOps(A, A.game.ops)
      const activated = new Set([...A.game.activated.move, ...A.game.activated.attack])
      extra.attacks = extra.attacks.filter(x => x.spaces.every(s => !activated.has(s)))
      extra.moves = extra.moves.filter(x => !activated.has(x.from))
      plan.attacks.push(...extra.attacks); plan.moves.push(...extra.moves)
      for (const a of extra.attacks) for (const s of a.spaces) if (att.has(s)) return ['activate_attack', s]
      for (const m of extra.moves) if (mov.has(m.from)) return ['activate_move', m.from]
    }
    this._replanned = false
    return ['skip']
  }

  s_choose_move_space(A, g, acts) {
    this._replanned = false
    const pcs = acts.piece || []
    if (!pcs.length) return acts.done ? ['done'] : ['end_action']
    // pick the first piece of a planned move space; entrench spaces first
    const plan = this.plan || { moves: [] }
    for (const m of plan.moves) {
      const p = pcs.find(p => A.game.location[p] === m.from)
      if (p !== undefined) { this.curMove = m; this.curMove.done = false; return ['piece', this.leadPiece(A, m, pcs.filter(q => A.game.location[q] === m.from))] }
    }
    return acts.done ? ['done'] : acts.end_action ? ['end_action'] : null
  }

  leadPiece(A, m, ps) {
    if (m.kind === 'entrench') { const a = ps.filter(p => data.pieces[p].type === 'army').sort((x, y) => A.get_piece_cf(y) - A.get_piece_cf(x)); if (a.length) return a[0] }
    return ps.sort((x, y) => A.get_piece_cf(y) - A.get_piece_cf(x))[0]
  }

  // Guard rule: when a stack leaves a space adjacent to enemy units, keep the weakest unit behind
  // unless the space is not mine or the move is a capture of a VP space.
  s_choose_pieces_to_move(A, g, acts) {
    const m = this.curMove
    if (!m) return acts.done ? ['done'] : acts.stop ? ['stop'] : null
    if (m.kind === 'entrench') { if (acts.entrench) { m.kind = 'done'; return ['entrench'] } if (acts.confirm_odd_entrench) { m.kind = 'done'; return ['confirm_odd_entrench'] } }
    const sel = A.game.move.pieces
    const here = A.game.move.initial
    const avail = acts.piece || []
    const total = this.piecesAt(A, here, this.side).length
    const guardNeeded = this.opts.guard && this.adjEnemy(A, here) && this.isMine(A, here) && !(m.kind === 'capture' && data.spaces[m.to].vp)
    const keep = guardNeeded ? 1 : 0
    // add pieces (strongest first) while leaving `keep` behind and respecting stacking at destination
    if (avail.length && sel.length + 1 <= total - keep && sel.length < 3) {
      const nxt = avail.sort((x, y) => A.get_piece_cf(y) - A.get_piece_cf(x))[0]
      return ['piece', nxt]
    }
    if (sel.length > total - keep && acts.stop) { return ['stop'] }
    return this.stepToward(A, acts, m.to)
  }

  stepToward(A, acts, to) {
    const sp = acts.space || []
    const cur = A.game.move.current
    if (!sp.length) return acts.stop ? ['stop'] : acts.done ? ['done'] : null
    if (cur === to) return acts.stop ? ['stop'] : null
    // stop rule: if we're on the front line (adjacent to enemy) and not capturing toward `to` adjacent, stop
    let best = null, bd = B.dist(cur, to)
    const moving = A.game.move.pieces
    for (const s of sp) {
      if (this.enemyUnitsAt(A, s).length) continue
      if (this.piecesAt(A, s, this.side).length + moving.length > 3) continue
      if (A.has_undestroyed_fort(s, this.enemy) && !A.is_besieged(s)) {
        const armies = moving.some(p => data.pieces[p].type === 'army')
        if (!armies && moving.length < (data.spaces[s].fort || 0)) continue
      }
      const d = B.dist(s, to)
      // don't end in an unsupplied space
      if (d < bd || (d === bd && best === null && false)) { bd = d; best = s }
    }
    if (best === null) return acts.stop ? ['stop'] : null
    if (!A.is_space_supplied(best, this.side) && acts.stop) return ['stop']
    return ['space', best]
  }

  s_move_stack(A, g, acts) {
    const m = this.curMove
    const cur = A.game.move.current
    if (!m) return acts.stop ? ['stop'] : null
    if (cur === m.to) return acts.stop ? ['stop'] : null
    // forward moves stop when reaching a space adjacent to enemy units
    if (m.kind === 'forward' && this.adjEnemy(A, cur)) return acts.stop ? ['stop'] : null
    return this.stepToward(A, acts, m.to)
  }

  s_choose_attackers(A, g, acts) {
    const plan = this.plan || { attacks: [] }
    const sel = A.game.attack.pieces
    const elig = A.game.eligible_attackers
    if (sel.length === 0) {
      // pick next planned target still attackable
      for (const a of plan.attacks) {
        if (a.done) continue
        const ps = elig.filter(p => A.get_attackable_spaces([p]).includes(a.target))
        if (!ps.length) { a.done = true; continue }
        const ev = this.evalAttack(A, ps, a.target)
        if (ev.edge + (a.score - a.edge) < this.minEdge() - 0.5 && !a.mo) { a.done = true; continue }
        this.curAttack = a
        return ['piece', ps[0]]
      }
      // opportunistic: any remaining eligible attackers with a good target
      let best = null
      for (const p of elig) for (const t of A.get_attackable_spaces([p])) {
        const ps = elig.filter(q => A.get_attackable_spaces([q]).includes(t))
        const ev = this.evalAttack(A, ps, t)
        if (ev.edge >= this.minEdge() && (!best || ev.edge > best.edge)) best = { target: t, edge: ev.edge, score: ev.edge, p: ps[0] }
      }
      if (best) { this.curAttack = best; plan.attacks.push(best); return ['piece', best.p] }
      return acts.confirm_pass_attack ? ['confirm_pass_attack'] : acts.pass ? ['pass'] : null
    }
    const a = this.curAttack
    const more = (acts.piece || []).filter(p => A.get_attackable_spaces([...sel, p]).includes(a.target))
    if (more.length) return ['piece', more[0]]
    if ((acts.space || []).includes(a.target)) { a.done = true; this.stats.attacks++; this.stats.edgeSum += a.edge || 0; return ['space', a.target] }
    a.done = true
    return ['no_attack']
  }

  s_confirm_attack(A, g, acts) { return acts.attack ? ['attack'] : acts.confirm_mutiny_attack ? ['confirm_mutiny_attack'] : null }
  s_choose_flank_attack(A, g, acts) { if (acts.card && acts.card.length) return ['card', acts.card[0]]; return this.opts.flank && acts.flank ? ['flank'] : acts.pass ? ['pass'] : ['done'] }
  s_attacker_combat_cards(A, g, acts) { return this.combatCards(A, acts, true) }
  s_defender_combat_cards(A, g, acts) { return this.combatCards(A, acts, false) }
  combatCards(A, acts, attacking) {
    const cs = (acts.card || [])
    // play any usable combat card already in play (free) first, then from hand if the fight matters
    for (const c of cs) if (A.game.combat_cards.includes(c)) return ['card', c]
    const t = A.game.attack.space
    const important = data.spaces[t].vp || data.spaces[t].fort || A.get_trench_level(t, attacking ? this.enemy : this.side) > 0 || attacking
    if (important) for (const c of cs) if (EP.ccOk(this, A, c, attacking)) return ['card', c]
    return ['done']
  }

  // Losses: lose the least valuable step each time.
  lossChoice(A, acts) {
    const ps = acts.piece || []
    if (!ps.length) return acts.done ? ['done'] : null
    const val = p => {
      const pd = data.pieces[p]
      const red = A.is_unit_reduced(p)
      // cost of taking a step: corps cheap, armies expensive; eliminating a unit costs more
      return (pd.type === 'army' ? 10 : 2) + (red ? (pd.type === 'army' ? 8 : 1) : 0) + A.get_piece_cf(p) * 0.3
    }
    return ['piece', ps.sort((a, b) => val(a) - val(b))[0]]
  }
  s_apply_defender_losses(A, g, acts) { if (acts.space && !(acts.piece || []).length) return ['space', acts.space[0]]; return this.lossChoice(A, acts) }
  s_apply_attacker_losses(A, g, acts) { return this.lossChoice(A, acts) }
  s_eliminate_retreated_units(A, g, acts) { return this.lossChoice(A, acts) }

  s_defender_retreat(A, g, acts) {
    const sp = acts.space || []
    if (sp.length) {
      // retreat toward my capital/supply: prefer mine, supplied, fewer enemy neighbours
      const cap = B.CAPITALS[this.side]
      const score = s => (this.isMine(A, s) ? 2 : 0) + (A.is_space_supplied(s, this.side) ? 2 : -3) - (this.adjEnemy(A, s) ? 0.5 : 0) - 0.1 * Math.min(...cap.map(c => B.dist(s, c))) + this.piecesAt(A, s, this.side).length * 0.3
      return ['space', sp.sort((a, b) => score(b) - score(a))[0]]
    }
    if ((acts.piece || []).length) return ['piece', acts.piece[0]]
    return acts.done ? ['done'] : acts.eliminate ? ['eliminate'] : null
  }
  s_cancel_retreat(A, g, acts) {
    // cancel retreat (extra step) to hold VP, fort or trench spaces when a full-strength unit can absorb it
    const t = A.game.attack ? A.game.attack.space : 0
    const hold = t && (data.spaces[t].vp || data.spaces[t].capital)
    if (hold && (acts.piece || []).length) {
      const ps = acts.piece.filter(p => !A.is_unit_reduced(p))
      if (ps.length) return ['piece', ps.sort((a, b) => A.get_piece_cf(a) - A.get_piece_cf(b))[0]]
    }
    return acts.retreat ? ['retreat'] : null
  }
  s_cancel_retreat_confirm(A, g, acts) { return ['done'] }

  s_attacker_advance(A, g, acts) {
    const t = A.game.attack ? A.game.attack.space : 0
    const sp = acts.space || []
    const ps = acts.piece || []
    const stance = this.dir ? this.dir.stance : 'P'
    const valuable = t && (data.spaces[t].vp || data.spaces[t].fort || B.OBJ[this.side][B.FRONT[t]].includes(t))
    if (!this._adv) this._adv = { n: 0 }
    if (sp.length && (valuable || stance === 'A')) {
      // advance into the vacated battle space, staying in supply
      const tgt = sp.includes(t) ? t : sp[0]
      if (A.is_space_supplied(tgt, this.side)) return ['space', tgt]
    }
    if (ps.length && (valuable || stance === 'A') && A.game.move && A.game.move.pieces && A.game.move.pieces.length < 2) return ['piece', ps[0]]
    return acts.done ? ['done'] : acts.stop ? ['stop'] : null
  }

  // SR execution
  s_choose_sr_unit(A, g, acts) {
    const ps = acts.piece || []
    const pts = A.game.sr.pts
    if (!acts.confirm_end_sr && !acts.end_action && acts.reset_phase) { this.violation = true; this.stats.violations = (this.stats.violations || 0) + 1; return ['reset_phase'] }
    let cands = this.srCandidates(A, true).filter(x => ps.includes(x.p) && x.cost <= pts)
    if (!cands.length) cands = this.srCandidates(A).filter(x => ps.includes(x.p) && x.cost <= pts && A.get_sr_destinations(x.p).length)
    // armies first if affordable
    cands.sort((a, b) => b.cost - a.cost)
    if (cands.length) { this.srUnit = cands[0].p; return ['piece', cands[0].p] }
    return acts.confirm_end_sr ? ['confirm_end_sr'] : acts.end_action ? ['end_action'] : null
  }
  s_choose_sr_destination(A, g, acts) {
    let sp = acts.space || []
    if (!sp.length) return null
    const ok = sp.filter(s => s >= B.N || this.piecesAt(A, s, this.side).length < 3)
    if (ok.length) sp = ok
    const fronts = this.frontsInOrder(A)
    const thr = this.threatened(A, 2)
    const score = s => {
      const f = B.FRONT[s]; const fi = fronts.indexOf(f)
      let v = (fi < 0 ? 0 : (5 - fi))
      if (thr.includes(s)) v += 8 - this.enemyDist(A)[s] * 2
      if (this.adjEnemy(A, s)) v += 3
      if (this.piecesAt(A, s, this.side).length >= 3) v -= 10
      if (data.spaces[s].vp) v += 1
      if (!A.is_space_supplied(s, this.side)) v -= 5
      return v
    }
    return ['space', sp.sort((a, b) => score(b) - score(a))[0]]
  }

  s_replacement_phase(A, g, acts) {
    if ((acts.space || []).length) {
      // rebuild army: space nearest the directive front's line
      const sp = acts.space
      const fronts = FRONT_ORDER[this.side]
      return ['space', sp.sort((a, b) => fronts.indexOf(B.FRONT[a]) - fronts.indexOf(B.FRONT[b]))[0]]
    }
    const ps = acts.piece || []
    if (ps.length) {
      const val = p => { const pd = data.pieces[p]; const onMap = A.game.location[p] < B.N; return (pd.type === 'army' ? 10 : 3) + (onMap && this.adjEnemy(A, A.game.location[p]) ? 3 : 0) + (onMap ? 1 : 0) }
      return ['piece', ps.sort((a, b) => val(b) - val(a))[0]]
    }
    return acts.confirm_end_rp ? ['confirm_end_rp'] : acts.end_rp ? ['end_rp'] : null
  }

  s_place_reinforcements(A, g, acts) {
    const sp = acts.space || []
    if (sp.length) {
      const fronts = this.frontsInOrder(A)
      const ed = this.enemyDist(A)
      const score = s => -fronts.indexOf(B.FRONT[s]) * 2 - Math.min(ed[s] || 20, 20) * 0.5
      return ['space', sp.sort((a, b) => score(b) - score(a))[0]]
    }
    return acts.done ? ['done'] : acts.skip ? ['skip'] : null
  }

  s_draw_cards_phase(A, g, acts) {
    // discard combat cards only if hand would otherwise clog: keep at most 2
    const hand = A.game[this.side].hand
    const ccs = hand.filter(c => data.cards[c].cc)
    if (ccs.length > 2 && (acts.card || []).length) return ['card', acts.card[0]]
    return ['done']
  }

  s_attrition_phase(A, g, acts) { return fallback(acts) }
  s_siege_phase(A, g, acts) { return fallback(acts) }
  s_trench_rolls(A, g, acts) { return fallback(acts) }
  s_confirm_mo(A, g, acts) { return ['next'] }
  s_confirm_move_violations(A, g, acts) { this.violation = true; this.stats.violations = (this.stats.violations || 0) + 1; return ['reset_phase'] }
  s_end_operations(A, g, acts) { return ['end_action'] }
  s_confirm_event(A, g, acts) { return fallback(acts) }
  s_rps(A, g, acts) { return ['end_action'] }
  s_guns_of_august(A, g, acts) {
    // attack the space with the most VP/fort value: Liege first, then Sedan, else first
    const sp = acts.space || []
    for (const n of ['Liege', 'Sedan', 'Namur', 'Brussels']) { const s = B.byName[n]; if (sp.includes(s)) return ['space', s] }
    return sp.length ? ['space', sp[0]] : null
  }
  s_place_event_trench(A, g, acts) {
    const sp = acts.space || []
    if (!sp.length) return ['skip']
    const v = s => (this.adjEnemy(A, s) ? 3 : 0) + (data.spaces[s].vp ? 2 : 0)
    return ['space', sp.sort((a, b) => v(b) - v(a))[0]]
  }
}

function colIndex(tbl, cf, shifts) {
  let col = 1
  while (col < tbl.length && tbl[col].factors <= cf) col++
  col--
  col += shifts
  return Math.min(Math.max(col, 0), tbl.length - 1)
}

function can_activate_attack(A, s) {
  // a space can be activated for combat if it has my unit able to attack (engine-equivalent check is done when activating)
  return true
}

function legal(acts, res) {
  if (!acts || !res) return false
  const v = acts[res[0]]
  if (v === undefined || v === 0) return false
  if (Array.isArray(v)) return v.includes(res[1])
  return res[1] === undefined
}

const PREF = ['next', 'done', 'end_action', 'pass', 'skip', 'stop', 'confirm_end_sr', 'confirm_end_rp', 'end_rp', 'confirm_pass_attack', 'retreat', 'attack', 'confirm_mutiny_attack']
function fallback(acts) {
  for (const k of PREF) if (acts[k] === 1 || acts[k] === true) return [k]
  for (const [k, v] of Object.entries(acts)) {
    if (['undo', 'propose_rollback', 'flag_supply_warnings', 'reset_phase'].includes(k) || v === 0) continue
    if (Array.isArray(v)) { if (v.length) return [k, v[0]] } else return [k]
  }
  if (acts.reset_phase) return ['reset_phase']
  if (acts.undo) return ['undo']
  return null
}

module.exports = { Bot, fallback, legal, makeDeck, FRONT_TABLE, STANCE_MIN_EDGE, ROLE }
