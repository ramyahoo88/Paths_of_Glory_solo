// "General Staff" bot policy for Paths of Glory, executed against the Rally the Troops rules engine.
// Every decision here is meant to be reproducible at the table from the printed procedure:
// it uses only open board information, the bot's own hand, and the Directive card drawn.
"use strict"
const R = require('../engine/rules.js')
const B = require('./board.js')
const EP = require('./events.js')
const data = B.data

// Edge uses the printed one-decimal expected hits (rules §10.4), so paper, Companion and simulator agree.
const ARMY_EXP = B.printedExpectedTable(R.__api.fire_table.army)
const CORPS_EXP = B.printedExpectedTable(R.__api.fire_table.corps)
const EPS = 1e-9 // Score comparisons: a Score equal to the threshold meets it
const ARMY_EXACT = B.expectedTable(R.__api.fire_table.army), CORPS_EXACT = B.expectedTable(R.__api.fire_table.corps) // opts.exactHits (experiment only)
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
    this.opts = Object.assign({ edgeShift: side === 'ap' ? 1.0 : 0, flank: false, events: true, sr: true, rp: true, entrench: true, guard: true, moves: true, directive: true, moveMode: 'table', shortlist: 3, keep: false, urgentMin: 7, fwdArmyV: side === 'ap' ? 2.5 : 1.5, rpStep: side === 'ap' ? 6 : 0 }, opts)
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
    const legalKeys = Object.keys(view.actions || {}).filter(k => !['undo', 'propose_rollback', 'flag_supply_warnings'].includes(k) && view.actions[k] !== 0)
    if (!legalKeys.length && view.actions && view.actions.undo) {
      this.blocked = this.blocked || new Set(); if (this.lastSpace) this.blocked.add(this.lastSpace)
      this.stats.undos = (this.stats.undos || 0) + 1
      return ['undo']
    }
    if (h) res = R.__with(g, A => h.call(this, A, g, view.actions))
    if (!res || !legal(view.actions, res)) {
      if (res && !legal(view.actions, res)) { this.stats.fallback['illegal:' + st + ':' + res[0]] = (this.stats.fallback['illegal:' + st + ':' + res[0]] || 0) + 1 }
      else {
        const n = Object.entries(view.actions || {}).filter(([k, v]) => !['undo', 'propose_rollback', 'flag_supply_warnings', 'reset_phase'].includes(k) && v !== 0).reduce((t, [k, v]) => t + (Array.isArray(v) ? v.length : 1), 0)
        const k = (h ? 'nochoice:' : n > 1 ? 'nohandler:' : 'forced:') + st
        this.stats.fallback[k] = (this.stats.fallback[k] || 0) + 1
      }
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
  threatened(A, r, all) {
    const ed = this.enemyDist(A), out = []
    for (let t = 1; t < B.N; t++) {
      if (!all && !(data.spaces[t].vp || data.spaces[t].fort || data.spaces[t].capital)) continue
      if (!this.isMine(A, t) || this.piecesAt(A, t, this.side).length) continue
      if (this.enemyUnitsAt(A, t).length) continue
      if (this.opts.crisisScope === 'home' && data.spaces[t].faction !== this.side) continue
      if (this.opts.crisisScope === 'vp' && !data.spaces[t].vp && !data.spaces[t].capital) continue
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
    const AT = this.opts.exactHits ? ARMY_EXACT : ARMY_EXP, CT = this.opts.exactHits ? CORPS_EXACT : CORPS_EXP
    const eA = (aArmy ? AT : CT)[aCol]
    const eD = defs.length || fort ? (dArmy ? AT : CT)[dCol] : 0
    // defender steps available
    const dSteps = defs.reduce((a, p) => a + (A.is_unit_reduced(p) ? 1 : 2), 0) + (fort ? 1 : 0)
    return { edge: this.opts.exactHits ? eA - eD : Math.round((eA - eD) * 10) / 10, eA, eD, dSteps, acf, dcf }
  }

  // ======== Operation planning ========
  // Returns { attacks:[{target, spaces:[..], cost, score}], moves:[{from, to, cost, kind, score}], cost }
  planOps(A, budget, frontsLimit) {
    const plan = { attacks: [], moves: [], cost: 0 }
    const used = new Set()
    const fronts = this.frontsInOrder(A).slice(0, frontsLimit || this.opts.frontsLimit || 5)
    const mo = A.game[this.side].mo
    const roundNo = A.game[this.side].actions.length + 1
    let minEdge = this.minEdge()
    // --- crisis Fill moves first (Crisis step)
    if (this.fillFirst && this.opts.moves) {
      const ed = this.enemyDist(A)
      for (const m of this.moveCandidates(A, fronts, used)) {
        if (m.kind !== 'fill' || ed[m.to] !== 1 || used.has(m.from)) continue
        if (!this.hasFirstStep(A, m)) continue
        const k = A.cost_to_activate(m.from, 'move')
        if (plan.cost + k > budget) continue
        plan.moves.push(Object.assign({ cost: k }, m)); used.add(m.from); plan.cost += k
      }
      plan.fillCost = plan.cost
    }
    // --- attacks
    const cand = this.attackCandidates(A, fronts, mo, roundNo)
    let evals = 0
    for (const c of cand) {
      if (plan.cost >= budget) break
      const spaces = c.spaces.filter(s => !used.has(s))
      if (!spaces.length) continue
      if (evals >= (this.opts.maxChecks || 99)) break
      evals++
      // choose spaces to activate greedily by CF until budget; recompute
      let chosen = [], cost = 0
      let order = spaces
      if (c.mo && this.opts.moSpacesFirst) {
        // MO target: spaces holding units that can satisfy the MO come first, then strongest
        const sat = s => A.satisfies_mo(mo, this.attackersFrom(A, s, c.target), this.enemyUnitsAt(A, c.target), c.target) ? 0 : 1
        order = spaces.slice().sort((x, y) => sat(x) - sat(y))
      }
      // strongest first, skipping a space that no longer fits the OPS or whose units cannot legally join those already taken
      const costOf = taken => taken.reduce((t, x) => t + A.cost_to_activate(x, 'attack'), 0)
      const grp = this.legalGroup(A, order.map(x => ({ s: x, ps: this.attackersFrom(A, x, c.target) })), c.target,
        (x, taken) => plan.cost + costOf(taken) + A.cost_to_activate(x, 'attack') <= budget)
      cost = costOf(grp.spaces)
      chosen = grp.spaces
      if (!chosen.length) continue
      const ps = grp.ps
      if (!ps.length) continue
      const ev = this.evalAttack(A, ps, c.target)
      // MO credit only if the units actually chosen satisfy the MO (rules §5.4: Score again with only those units)
      const isMo = c.mo && (this.opts.moRecheck === false || A.satisfies_mo(mo, ps, this.enemyUnitsAt(A, c.target), c.target))
      const bonus = c.bonus - (c.mo && !isMo ? c.moBonus : 0)
      const score = ev.edge + bonus
      const forced = isMo && roundNo >= (this.opts.moForce || 5) && !plan.attacks.some(a => a.mo)
      if (score < minEdge - EPS && !forced) continue
      this.stats.checks++
      plan.attacks.push({ target: c.target, spaces: chosen, cost, score, edge: ev.edge, mo: isMo, moBonus: isMo ? c.moBonus : 0 })
      chosen.forEach(s => used.add(s)); plan.cost += cost
      if (plan.attacks.length >= (this.opts.maxAttacks || 3)) break
    }
    plan.evals = evals
    // --- moves with remaining budget
    if (this.opts.moves) {
      const mv = this.moveCandidates(A, fronts, used)
      for (const m of mv) {
        if (used.has(m.from)) continue
        if (!this.hasFirstStep(A, m)) continue
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

  // Builds the attacking group space by space, strongest first, skipping a space whose units cannot legally join the
  // units already taken (multinational rule 12.1.11.1, London rule, etc., as the engine enforces them) or that fails fits(s).
  // byspace: [{ s, ps }] already in strongest-first order. Returns { spaces, ps }.
  legalGroup(A, byspace, t, fits = () => true) {
    const spaces = [], ps = []
    for (const x of byspace) {
      if (!x.ps.length || !fits(x.s, spaces)) continue
      if (this.opts.legalGroups === false || A.get_attackable_spaces(ps.concat(x.ps)).includes(t)) { spaces.push(x.s); ps.push(...x.ps) }
    }
    return { spaces, ps }
  }
  // eligible pieces grouped by their space, strongest space first
  bySpace(A, pieces) {
    const m = new Map()
    for (const p of pieces) { const s = A.game.location[p]; if (!m.has(s)) m.set(s, []); m.get(s).push(p) }
    return [...m].map(([s, ps]) => ({ s, ps, cf: this.cf(A, ps) })).sort((a, b) => b.cf - a.cf || a.s - b.s)
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
        const group = this.legalGroup(A, spaces.map(x => ({ s: x.s, ps: this.attackersFrom(A, x.s, t) })), t)
        if (!group.ps.length) continue
        let isMo = false, moBonus = 0
        if (mo && mo !== 'none' && !(A.game.events.french_mutiny > 0 && mo === 'fr')) {
          if (A.satisfies_mo(mo, group.ps, defs, t)) { isMo = true; moBonus = roundNo >= 5 ? 6.0 : roundNo >= 3 ? 2.5 : 1.0; bonus += moBonus }
        }
        // enemy out of supply -> softer target
        if (defs.some(p => A.game.oos_pieces.includes(p))) bonus += 0.5
        // pre-evaluate with every space whose units can legally attack together
        const ev = this.evalAttack(A, group.ps, t)
        out.push({ target: t, spaces: spaces.map(x => x.s), bonus, moBonus, pre: ev.edge + bonus, mo: isMo, front: f })
      }
    }
    if (this.opts.targetMode === 'ordered' || this.opts.targetMode === 'grouped') {
      // Paper order: front order, then Objective, MO target, VP/fort space, other; then most CF adjacent; then tie-break.
      const moP = mo && mo !== 'none'
      for (const c of out) {
        const f = fronts.indexOf(c.front)
        const obj = this.objectiveOf(A, c.front)
        const grp = (c.target === obj ? 0 : (moP && c.mo) ? 1 : (data.spaces[c.target].vp || data.spaces[c.target].fort) ? 2 : 3)
        c.rank = this.opts.targetMode === 'grouped' ? (grp === 1 ? -1 : f * 10 + grp) : f * 10 + grp
        c.cfAdj = c.spaces.reduce((a, s) => a + this.cf(A, this.attackersFrom(A, s, c.target)), 0)
        // threshold modifiers instead of score bonuses
        c.bonus = (c.target === obj ? (this.opts.objBonus ?? 1.0) : 0) + (c.mo ? (roundNo >= 5 ? 6 : roundNo >= 3 ? 1.5 : 0.5) : 0)
      }
      out.sort((a, b) => a.rank - b.rank || b.cfAdj - a.cfAdj || this.tie(a.target, b.target))
      return out
    }
    if (this.opts.shortlist) {
      // Table-friendly shortlist: keep the K targets with the largest CF difference
      // (attacking CF minus defending CF incl. fort), plus the Objective and MO targets; then rank by score.
      for (const c of out) {
        const defs = this.enemyUnitsAt(A, c.target)
        const fort = A.has_undestroyed_fort(c.target, this.enemy) && A.is_controlled_by(c.target, this.enemy) ? (data.spaces[c.target].fort || 0) : 0
        const acf = c.spaces.reduce((a, s) => a + this.cf(A, this.attackersFrom(A, s, c.target)), 0)
        c.cfDiff = acf - this.cf(A, defs) - fort
        c.isObj = c.target === this.objectiveOf(A, c.front)
      }
      const ranked = out.slice().sort((a, b) => b.cfDiff - a.cfDiff || this.tie(a.target, b.target))
      const keep = new Set(ranked.slice(0, this.opts.shortlist))
      for (const c of out) if (c.isObj || c.mo) keep.add(c)
      const sl = out.filter(c => keep.has(c))
      sl.sort((a, b) => b.pre - a.pre || this.tie(a.target, b.target))
      return sl
    }
    out.sort((a, b) => b.pre - a.pre || this.tie(a.target, b.target))
    return out
  }

  tie(a, b) { // Staff card Tie: more northerly (smaller map y) or southerly space first
    const dir = this.dir ? this.dir.tie : 'N'
    const d = B.ycoord(a) - B.ycoord(b)
    return (dir === 'N' ? d : -d) || a - b
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
        if (A.has_undestroyed_fort(t, this.enemy) && (this.opts.captureBesieged === true ? !A.is_besieged(t) : true)) continue
        if (!A.is_space_at_war(t)) continue
        if (!A.can_end_move(t, ps)) continue
        let v = 1.5 + (data.spaces[t].vp ? 2 : 0) + (obj && B.dist(t, obj) < B.dist(s, obj) ? 0.5 : 0)
        // VP space first, then nearer the Objective, then the Tie
        if (this.opts.printedTies === false ? (!best || v > best.score) : (!best || v > best.v || (v === best.v && this.tie(t, best.to) < 0))) best = { from: s, to: t, kind: 'capture', score: v + frontBonus, v }
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
    // (7) MO approach: MO unmet and no MO attack possible -> nearest MO-nation stack moves next to a valid MO target
    if (this.moPrep) {
      const mo = A.game[this.side].mo
      const nat = mo === 'ah_it' ? 'ah' : mo
      const targets = []
      for (let t = 1; t < B.N; t++) {
        const defs = this.enemyUnitsAt(A, t); if (!defs.length) continue
        const rep = [...mySpaces.values()].flat().find(p => data.pieces[p].nation === nat)
        if (rep && A.satisfies_mo(mo, [rep], defs, t)) targets.push(t)
      }
      let best = null
      for (const [s, ps] of mySpaces) {
        if (used.has(s) || !ps.some(p => data.pieces[p].nation === nat)) continue
        if (targets.some(t => B.adj[s].includes(t))) continue // already in contact with an MO target
        for (const t of targets) {
          for (const x of B.adj[t]) {
            if (this.enemyUnitsAt(A, x).length || !A.is_space_at_war(x)) continue
            const dd = B.dist(s, x)
            if (dd <= 4 && (!best || dd < best.d)) best = { d: dd, from: s, to: x }
          }
        }
      }
      if (best) out.push({ from: best.from, to: best.to, kind: 'moApproach', score: 3 })
    }
    // (6) line gaps: my empty space adjacent to an enemy unit -> one unit from a nearby stack (opts.gaps)
    if (this.opts.gaps) {
      const ed = this.enemyDist(A)
      for (let t = 1; t < B.N; t++) {
        if (ed[t] !== 1 || !this.isMine(A, t) || this.piecesAt(A, t, me).length) continue
        if (data.spaces[t].vp || data.spaces[t].fort || data.spaces[t].capital) continue // handled by Fill
        if (!A.is_space_at_war(t)) continue
        let bestS = null, bd = 99
        for (const [s, ps] of mySpaces) { const d = B.dist(s, t); if (d <= 2 && d < bd && !used.has(s) && (ps.length > 1 || !this.adjEnemy(A, s))) { bd = d; bestS = s } }
        const nearVP = B.adj[t].some(x => this.isMine(A, x) && (data.spaces[x].vp || data.spaces[x].capital))
        if (bestS) out.push({ from: bestS, to: t, kind: 'gap', score: 1.5 + (nearVP ? 1 : 0) })
      }
    }
    const gaps = this.threatened(A, 2)
    if (this.opts.fillAll) for (const t of this.threatened(A, 1, true)) if (!gaps.includes(t) && fronts.indexOf(B.FRONT[t]) === 0) gaps.push(t)
    for (const t of gaps) {
      let bestS = null, bd = 99
      for (const [s, ps] of mySpaces) { const d = B.dist(s, t); if (d <= 3 && (d < bd || (this.opts.printedTies !== false && d === bd && bestS !== null && this.tie(s, bestS) < 0)) && !used.has(s) && (ps.length > 1 || !this.adjEnemy(A, s))) { bd = d; bestS = s } }
      const key = data.spaces[t].vp || data.spaces[t].fort || data.spaces[t].capital
      if (bestS) out.push({ from: bestS, to: t, kind: 'fill', score: (key ? 2.2 : 1.2) + (data.spaces[t].capital ? 1 : 0) + (this.enemyDist(A)[t] === 1 ? 0.8 : 0) })
    }
    if (this.opts.moveMode === 'table') {
      // Printed Move Value table: value desc, then front order, then Tie.
      const ed = this.enemyDist(A)
      const val = m => {
        if (m.kind === 'capture') return (data.spaces[m.to].vp ? 4 : (this.opts.captureV ?? 2))
        if (m.kind === 'fill') return ((data.spaces[m.to].vp || data.spaces[m.to].fort || data.spaces[m.to].capital) ? 2 : 1) + (ed[m.to] === 1 ? 1 : 0) + (data.spaces[m.to].capital ? 1 : 0)
        if (m.kind === 'siege') return 2 + (data.spaces[m.to].vp ? 1 : 0)
        if (m.kind === 'forward') return this.piecesAt(A, m.from, this.side).some(p => data.pieces[p].type === 'army') ? (this.opts.fwdArmyV ?? 1.5) : 1
        if (m.kind === 'entrench') return (this.dir && this.dir.stance === 'H') ? (this.opts.entrenchH ?? 1.5) : (this.opts.entrenchV ?? 0.5)
        if (m.kind === 'gap') return m.score
        if (m.kind === 'moApproach') return 3
        return 0
      }
      const fo = m => { const i = fronts.indexOf(B.FRONT[m.from]); return i < 0 ? 9 : i }
      for (const m of out) m.score = val(m)
      out.sort((a, b) => b.score - a.score || fo(a) - fo(b) || this.tie(a.from, b.from))
      return out
    }
    if (this.opts.moveMode === 'ordered' || (this.opts.targetMode === 'ordered' && this.opts.moveMode !== 'best')) {
      const rk = m => m.kind === 'fill' ? 0 : (m.kind === 'capture' && data.spaces[m.to].vp) ? 1 : m.kind === 'siege' ? 2 : m.kind === 'capture' ? 3 : m.kind === 'entrench' ? (this.dir && this.dir.stance === 'H' ? 1.5 : 4) : 5
      const fo = m => { const i = fronts.indexOf(B.FRONT[m.from]); return i < 0 ? 9 : i }
      out.sort((a, b) => rk(a) - rk(b) || fo(a) - fo(b) || this.tie(a.from, b.from))
      return out
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
    this.step = '?'
    const res = this._actionPhase(A, g, acts)
    { const k = 'step:' + this.step + (this.step.startsWith('Plan') ? ':' + res[0] : ''); this.stats[k] = (this.stats[k] || 0) + 1 }
    if (this.opts.trace) {
      const nm = c => data.cards[c] ? data.cards[c].name : ''
      const sn = s => data.spaces[s] ? data.spaces[s].name : s
      const t = { turn: A.game.turn, round: A.game[this.side].actions.length + 1, side: this.side, staff: this.dir, step: this.step, action: res[0], card: res[1] ? nm(res[1]) : '', mo: A.game[this.side].mo, vp: A.game.vp, hand: A.game[this.side].hand.map(c => nm(c) + ' [' + data.cards[c].ops + ']').join(', ') }
      if (this.plan && (res[0] === 'play_ops' || res[0] === 'single_op')) {
        t.attacks = this.plan.attacks.map(a => ({ target: sn(a.target), from: a.spaces.map(sn), edge: +(a.edge || 0).toFixed(2), mo: !!a.mo }))
        t.moves = this.plan.moves.map(m => ({ kind: m.kind, from: sn(m.from), to: sn(m.to) }))
      }
      this.trace = this.trace || []; this.trace.push(t)
    }
    return res
  }
  _actionPhase(A, g, acts) {
    this.stats.rounds++
    this.blocked = null; this.srCrisisOnly = false; this.fillFirst = false
    if (!this.violation) this.resets = 0
    this.noMove = !!this.violation; this.violation = false
    this.dir = this.draw()
    if (this.opts.fixedStance || this.opts.fixedPlan) this.dir = Object.assign({}, this.dir, this.opts.fixedStance ? { stance: this.opts.fixedStance } : {}, this.opts.fixedPlan ? { plan: this.opts.fixedPlan } : {})
    if (this.opts.planMap && this.opts.planMap[this.dir.plan]) this.dir = Object.assign({}, this.dir, { plan: this.opts.planMap[this.dir.plan] })
    const hand = this.handInfo(A)
    const evLegal = new Set(acts.play_event || [])
    const opsLegal = new Set(acts.play_ops || [])
    const roundNo = A.game[this.side].actions.length + 1
    // 0. forced
    if (evLegal.size && !opsLegal.size) { this.step = 'Forced play'; return this.useEvent([...evLegal][0]) }
    // 1. urgent events (priority >= opts.urgentMin, 7 in the release)
    const evs = hand.filter(h => evLegal.has(h.c) && h.pr >= 1).sort((a, b) => b.pr - a.pr || a.d.ops - b.d.ops || a.c - b.c)
    // MO last chance (rounds moLast+): before urgent events
    const moUnmet = A.game[this.side].mo && A.game[this.side].mo !== 'none' && !(A.game.events.french_mutiny > 0 && A.game[this.side].mo === 'fr')
    if (moUnmet && this.opts.moFirst !== false && roundNo >= (this.opts.moLast || 5) && opsLegal.size) {
      const p0 = this.planOps(A, Math.max(1, ...hand.filter(h => opsLegal.has(h.c) && !this.isKeep(A, h.c)).map(h => h.d.ops)))
      if (p0.attacks.some(a => a.mo)) { this.step = 'Mandated Offensive (last chance)'; return this.useOps(A, hand, opsLegal, p0, p0.attacks.reduce((a, x) => a + x.cost, 0)) }
    }
    if (this.opts.events && evs.length && evs[0].pr >= (this.opts.urgentMin ?? 8)) { this.step = 'Urgent event'; return this.useEvent(evs[0].c) }
    // budget available: max ops among non-urgent cards
    const opsCards = hand.filter(h => opsLegal.has(h.c) && !this.isKeep(A, h.c))
    const maxOps = Math.max(1, ...opsCards.map(h => h.d.ops))
    const savedMoves = this.opts.moves
    if (this.noMove) this.opts.moves = false
    const plan = this.planOps(A, maxOps)
    this.stats.evals = (this.stats.evals || 0) + plan.evals
    this.opts.moves = savedMoves
    const attackCost = plan.attacks.reduce((a, x) => a + x.cost, 0)
    const planValue = plan.attacks.reduce((a, x) => a + 1.5 + Math.max(0, x.score), 0) + plan.moves.reduce((a, x) => a + 0.4 * x.score, 0)
    // Mandated Offensive step: from round opts.moRound, an MO attack in the plan takes precedence
    const moPending = A.game[this.side].mo && A.game[this.side].mo !== 'none'
    if (moPending && roundNo >= (this.opts.moRound || 3) && plan.attacks.some(a => a.mo)) { this.step = 'Mandated Offensive'; return this.useOps(A, hand, opsLegal, plan, attackCost) }
    // Crisis step: an empty VP space of mine with an enemy unit adjacent -> fill it (move or SR)
    // MO preparation (opts.moPrep, rounds 1-4): no MO attack possible -> move MO-nation units into contact
    this.moPrep = false
    if (this.opts.moPrep && moPending && roundNo <= 4 && !plan.attacks.some(a => a.mo)) {
      this.moPrep = true
      const p2 = this.planOps(A, maxOps)
      if (p2.moves.some(m => m.kind === 'moApproach')) { this.step = 'MO preparation'; return this.useOps(A, hand, opsLegal, p2, 0) }
      this.moPrep = false
    }
    if (this.opts.crisis !== false) {
      const crisis = this.threatened(A, this.opts.crisisRange || 1)
      if (crisis.length) {
        this.step = 'Crisis'
        if (this.opts.crisisFill === 'first') {
          this.fillFirst = true
          const pc = this.planOps(A, maxOps)
          if (pc.moves.some(m => m.kind === 'fill')) return this.useOps(A, hand, opsLegal, pc, (pc.fillCost || 0) + pc.attacks.reduce((a, x) => a + x.cost, 0))
          this.fillFirst = false
        } else if (plan.moves.some(m => m.kind === 'fill')) return this.useOps(A, hand, opsLegal, plan, 0)
        let l = this.opts.crisisSR === true ? this.logistics(A, hand, acts, roundNo, false, true) : null
        if (!l && this.opts.crisisReserve && !this.noMove && acts.play_sr && acts.play_sr.length) {
          // only Reserve Box corps that can reach a crisis space
          const reserve = this.side === 'ap' ? A.AP_RESERVE_BOX : A.CP_RESERVE_BOX
          const thr = this.threatened(A, 1)
          const ok = []
          for (let p = 1; p < data.pieces.length; p++) if (data.pieces[p].faction === this.side && A.game.location[p] === reserve && this.srDests(A, p).some(d => thr.includes(d))) ok.push(p)
          if (ok.length) {
            const cards = hand.filter(h => acts.play_sr.includes(h.c) && h.pr < 7).sort((a, b) => a.pr - b.pr || a.d.sr - b.d.sr)
            if (cards.length) { this.srCrisisOnly = true; this.stats.sr++; this.stats.crisisSR = (this.stats.crisisSR || 0) + 1; l = ['play_sr', cards[0].c] }
          }
        }
        if (l) return l
      }
    }
    // Rebuild step (opts.rpStep): heavy losses -> one RP play per turn before the Plan
    if (this.opts.rpStep && acts.play_rps && acts.play_rps.length && !A.game[this.side].actions.some(x => x.type === 'rp')) {
      const need = this.rpNeed(A); let total = 0
      for (const t in need) total += Math.max(0, need[t] - (A.game.rp[t] || 0))
      if (total >= this.opts.rpStep) { const l = this.logistics(A, hand, Object.assign({}, acts, { play_sr: [] }), roundNo, false); if (l && l[0] === 'play_rps') { this.step = 'Rebuild'; return l } }
    }
    // Idle reserves: many units far from the enemy -> SR them now (opts.idleSR = SR-point trigger)
    if (this.opts.idleSR && this.opts.sr && !this.noMove && acts.play_sr && acts.play_sr.length) {
      const need = this.srCandidates(A).reduce((a, x) => a + x.cost, 0)
      if (need >= this.opts.idleSR) {
        const cards = hand.filter(h => acts.play_sr.includes(h.c) && h.pr < 7 && !this.isKeep(A, h.c)).sort((a, b) => Math.abs(a.d.sr - Math.min(need, 5)) - Math.abs(b.d.sr - Math.min(need, 5)) || a.pr - b.pr)
        if (cards.length) { this.step = 'Idle reserves'; this.stats.sr++; this.stats.cardUse[cards[0].c] = 'sr'; return ['play_sr', cards[0].c] }
      }
    }
    if (this.opts.gapStep) {
      const g = plan.moves.filter(m => m.kind === 'gap' || m.kind === 'fill')
      if (g.length >= this.opts.gapStep) { this.step = 'Line repair'; return this.useOps(A, hand, opsLegal, plan, 0) }
    }
    const order = this.dir.plan === 'E' ? ['event', 'ops', 'log'] : this.dir.plan === 'L' ? ['log', 'ops', 'event'] : ['ops', 'event', 'log']
    for (const step of order) {
      this.step = 'Plan ' + step
      if (step === 'event' && this.opts.events && evs.length && evs[0].pr >= (this.opts.evMin ?? 5)) return this.useEvent(evs[0].c)
      if (step === 'ops' && plan.attacks.length) return this.useOps(A, hand, opsLegal, plan, attackCost)
      if (step === 'log') {
        const l = this.logistics(A, hand, acts, roundNo)
        if (l) return l
      }
    }
    // weaker options: moves only, medium events, logistics
    this.step = 'Fallback'
    if (this.opts.events && evs.length && evs[0].pr >= 3) return this.useEvent(evs[0].c)
    if (plan.moves.some(m => ['fill', 'capture', 'siege'].includes(m.kind)) || plan.moves.length >= 2) return this.useOps(A, hand, opsLegal, plan, 0)
    const l2 = this.logistics(A, hand, acts, roundNo, true)
    if (l2) return l2
    this.stats.idle++
    // nothing useful: 1 OP automatic operation (entrench / move) or pass
    this.plan = this.planOps(A, 1)
    this.stats.single++
    return ['single_op']
  }

  useEvent(c) { this.stats.events++; this.stats.cardUse[c] = 'evt'; this.plan = null; return ['play_event', c] }

  // Key cards are held for their event and never spent on OPS, SR or RP.
  isKeep(A, c) {
    if (this.opts.keep === false) return false
    if (this.opts.keep === 'all') return EP.KEEP.has(c)
    if (this.opts.keep === 'chain') return EP.CHAIN.has(c) && EP.keepNow(A, c)
    return EP.keepNow(A, c)
  }

  useOps(A, hand, opsLegal, plan, attackCost) {
    const spend = hand.filter(h => opsLegal.has(h.c) && !this.isKeep(A, h.c))
    const need = attackCost > 0 ? attackCost : (plan.moves.length ? plan.moves[0].cost : 1)
    if (!spend.length || (need <= 1 && plan.attacks.length <= 1 && plan.cost <= 1)) { this.plan = plan; this.stats.single++; this.stats.ops++; return ['single_op'] }
    // choose card: lowest event priority among cards with ops >= need, then lowest ops
    const cands = spend.filter(h => h.d.ops >= need)
    let pick
    if (cands.length) pick = cands.sort((a, b) => (a.pr >= 6) - (b.pr >= 6) || a.d.ops - b.d.ops || a.pr - b.pr || a.c - b.c)[0]
    else pick = spend.sort((a, b) => b.d.ops - a.d.ops || a.pr - b.pr)[0]
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
      const thresh = weak ? (this.opts.rpMinWeak ?? 1.5) : (this.opts.rpMin ?? 3)
      const rpThisTurn = A.game[this.side].actions.some(x => x.type === 'rp')
      if (total >= thresh && !(this.opts.rpOnce && rpThisTurn) && A.game.turn >= (this.opts.logTurn || 1)) {
        let best = null
        for (const h of hand) {
          if (!acts.play_rps.includes(h.c) || h.pr >= 7 || this.isKeep(A, h.c)) continue
          let v = 0
          for (const k of Object.keys(h.d)) if (k.startsWith('rp')) { const t = k.slice(2) === 'a' ? 'allied' : k.slice(2); const n = need[t] || (t === 'allied' ? (need.be || 0) + (need.sb || 0) + (need.mn || 0) + (need.gr || 0) + (need.ro || 0) : 0); v += Math.min(h.d[k], n) }
          if (v >= (weak ? 1 : (this.opts.rpCard ?? 2)) && (!best || v > best.v || (v === best.v && (h.pr < best.pr || (h.pr === best.pr && h.c < best.c))))) best = { c: h.c, v, pr: h.pr }
        }
        if (best) { this.stats.rp++; this.stats.cardUse[best.c] = 'rp'; return ['play_rps', best.c] }
      }
    }
    // SR: units in reserve box or far from the front
    if (this.opts.sr && !this.noMove && acts.play_sr && acts.play_sr.length) {
      const sr = this.srCandidates(A)
      const need = sr.reduce((a, x) => a + x.cost, 0)
      if (sr.length && A.game.turn >= (this.opts.logTurn || 1) && (need >= (this.opts.srMin ?? 4) || (weak && need >= 1))) {
        const cards = hand.filter(h => acts.play_sr.includes(h.c) && h.pr < 7 && !this.isKeep(A, h.c)).sort((a, b) => Math.abs(a.d.sr - Math.min(need, 5)) - Math.abs(b.d.sr - Math.min(need, 5)) || a.pr - b.pr || a.c - b.c)
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
      if (this.opts.capRear && B.CAPITALS[this.side].includes(loc) && near > 1 && A.is_space_at_war(loc)) { out.push({ p, cost: pd.type === 'army' ? 4 : 1, why: 'capital' }); continue }
      if (near > 3 && A.is_space_at_war(loc)) out.push({ p, cost: pd.type === 'army' ? 4 : 1, why: 'rear' })
    }
    return out
  }

  // ================= operations execution =================
  s_activate_spaces(A, g, acts) {
    // an event-granted operation has no plan yet: keep the one made here, so the movement step can find its moves
    if (!this.plan && this.opts.eventPlan !== false) this.plan = { attacks: [], moves: [] }
    const plan = this.plan || { attacks: [], moves: [] }
    if (this.violation) { plan.moves = []; this._replanned = true } // after a rule-violation reset: attacks only
    const att = new Set(acts.activate_attack || []), mov = new Set(acts.activate_move || [])
    for (const a of plan.attacks) for (const s of a.spaces) if (att.has(s)) return ['activate_attack', s]
    for (const m of plan.moves) if (mov.has(m.from)) return ['activate_move', m.from]
    // leftover ops: replan with remaining budget, excluding already activated
    if (!this._replanned) {
      this._replanned = true
      const savedMoves = this.opts.moves
      if (this.noMove) this.opts.moves = false
      const extra = this.planOps(A, A.game.ops)
      this.opts.moves = savedMoves
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
      if (m.abandon) continue
      const p = pcs.find(p => A.game.location[p] === m.from)
      if (p !== undefined) { this.curMove = m; this.curMove.done = false; return ['piece', this.leadPiece(A, m, pcs.filter(q => A.game.location[q] === m.from))] }
    }
    if (acts.done) return ['done']
    if (acts.end_action) return ['end_action']
    // the engine still requires these units to move (their planned move was abandoned): take them one safe step
    const p = pcs.slice().sort((x, y) => A.get_piece_cf(x) - A.get_piece_cf(y))[0]
    const at = A.game.location[p]
    this.curMove = { kind: 'hold', from: at, to: at, abandon: true }
    this.stats.holdMoves = (this.stats.holdMoves || 0) + 1
    return ['piece', p]
  }

  leadPiece(A, m, ps) {
    if (m.kind === 'moApproach') { const mo = A.game[this.side].mo; const nat = mo === 'ah_it' ? 'ah' : mo; const q = ps.filter(p => data.pieces[p].nation === nat).sort((x, y) => A.get_piece_cf(y) - A.get_piece_cf(x)); if (q.length) return q[0] }
    if (m.kind === 'gap' && this.adjEnemy(A, m.from)) return ps.sort((x, y) => A.get_piece_cf(x) - A.get_piece_cf(y))[0]
    if (m.kind === 'entrench') { const a = ps.filter(p => data.pieces[p].type === 'army').sort((x, y) => A.get_piece_cf(y) - A.get_piece_cf(x)); if (a.length) return a[0] }
    return ps.sort((x, y) => A.get_piece_cf(y) - A.get_piece_cf(x))[0]
  }

  // Guard rule: when a stack leaves a space adjacent to enemy units, keep the weakest unit behind
  // unless the space is not mine or the move is a capture of a VP space.
  s_choose_pieces_to_move(A, g, acts) {
    const m = this.curMove
    if (!m) return acts.done ? ['done'] : acts.stop ? ['stop'] : null
    // an abandoned move never resumes: end the activation if the engine allows, else make the smallest safe step
    if (m.abandon) {
      if (acts.done) return ['done']
      if (acts.stop) return ['stop']
      const st = this.safeStep(A, acts, m.to)
      if (st) return st
      if (acts.entrench) return ['entrench'] // an entrenchment attempt keeps the units where they are
      if (acts.confirm_odd_entrench) return ['confirm_odd_entrench']
      // last resort: any space that does not overstack
      const room = (acts.space || []).filter(x => this.piecesAt(A, x, this.side).length + A.game.move.pieces.length <= 3 && !this.enemyUnitsAt(A, x).length)
      return room.length ? ['space', room.sort((a, b) => this.tie(a, b))[0]] : null
    }
    if (m.kind === 'entrench') { if (acts.entrench) { m.kind = 'done'; return ['entrench'] } if (acts.confirm_odd_entrench) { m.kind = 'done'; return ['confirm_odd_entrench'] } }
    const sel = A.game.move.pieces
    const here = A.game.move.initial
    const avail = acts.piece || []
    const total = this.piecesAt(A, here, this.side).length
    const guardNeeded = this.opts.guard && this.adjEnemy(A, here) && this.isMine(A, here) && !(m.kind === 'capture' && data.spaces[m.to].vp)
    const keep = guardNeeded ? 1 : 0
    if (m.kind === 'gap' && this.adjEnemy(A, here)) {
      if (sel.length === 0 && avail.length) return ['piece', avail.sort((x, y) => A.get_piece_cf(x) - A.get_piece_cf(y))[0]]
      if (sel.length > 1 && acts.stop) return ['stop']
      return this.stepToward(A, acts, m.to)
    }
    const cap = this.opts.stepCap === false ? 3 : Math.min(3, this.stepCapacity(A, acts, m.to))
    if (m.kind === 'moApproach') {
      const mo = A.game[this.side].mo; const nat = mo === 'ah_it' ? 'ah' : mo
      const more = avail.filter(p => data.pieces[p].nation === nat).sort((x, y) => A.get_piece_cf(y) - A.get_piece_cf(x))
      if (more.length && sel.length + 1 <= total - keep && sel.length < cap) return ['piece', more[0]]
      return this.stepToward(A, acts, m.to)
    }
    // add pieces (strongest first) while leaving `keep` behind and no more than the first step can take
    if (avail.length && sel.length + 1 <= total - keep && sel.length < cap) {
      const nxt = avail.sort((x, y) => A.get_piece_cf(y) - A.get_piece_cf(x))[0]
      return ['piece', nxt]
    }
    if (sel.length > total - keep && acts.stop) { return ['stop'] }
    const r = this.stepToward(A, acts, m.to)
    // no legal step for the stack (every adjacent space would overstack, etc.): put the units back and end the activation
    if (!r && sel.length && acts.undo) { m.abandon = true; this.stats.abandoned = (this.stats.abandoned || 0) + 1; return ['undo'] }
    return r
  }

  // Planning check (§6, "If no unit can take a step, drop the move"): some adjacent space nearer the destination
  // (or the destination itself) holds no enemy unit and has room for at least one more unit.
  hasFirstStep(A, m) {
    if (m.kind === 'entrench' || this.opts.firstStepCheck === false) return true
    const d0 = B.dist(m.from, m.to)
    const movers = this.piecesAt(A, m.from, this.side).filter(p => A.get_piece_mf(p) > 0 && !A.game.oos_pieces.includes(p))
    if (!movers.length) return false
    // any single mover with an engine-legal step that is nearer the destination and not full
    return movers.some(p => A.get_connected_spaces(m.from, data.pieces[p].nation).some(s =>
      (s === m.to || B.dist(s, m.to) < d0) && A.can_move_to(s, [p]) && A.can_end_move(s, [p]) && this.mayStackWith(A, [p], s) && this.piecesAt(A, s, this.side).length < 3))
  }
  // Legal next steps for the selected stack: no enemy units, may end its move there, not blocked, fort rule.
  legalSteps(A, acts) {
    const moving = A.game.move.pieces
    return (acts.space || []).filter(s => {
      if (this.enemyUnitsAt(A, s).length || !A.can_end_move(s, moving)) return false
      if (this.blocked && this.blocked.has(s)) return false
      if (A.has_undestroyed_fort(s, this.enemy) && !A.is_besieged(s)) {
        const armies = moving.some(p => data.pieces[p].type === 'army')
        if (!armies && moving.length < (data.spaces[s].fort || 0)) return false
      }
      if (!this.mayStackWith(A, moving, s)) return false
      return true
    })
  }
  // After Brest-Litovsk, Russian units may not stack with other Allied units
  mayStackWith(A, moving, s) {
    if (this.side !== 'ap' || !(A.game.events.treaty_of_brest_litovsk > 0)) return true
    const ru = p => data.pieces[p].nation === 'ru'
    const there = this.piecesAt(A, s, 'ap').filter(p => !moving.includes(p))
    const all = moving.concat(there)
    return all.every(ru) || !all.some(ru)
  }
  // How many units may move together: the most that fit (stacking limit 3) into a legal first step nearer the destination,
  // or into any legal step if none is nearer. Rules §6: never move more units than the first step can take.
  stepCapacity(A, acts, to) {
    const cur = A.game.move.current, steps = this.legalSteps(A, acts)
    const nearer = steps.filter(s => B.dist(s, to) < B.dist(cur, to))
    const pool = nearer.length ? nearer : steps
    return pool.reduce((m, s) => Math.max(m, 3 - this.piecesAt(A, s, this.side).length), 0)
  }
  // a legal step that does not overstack, nearest the destination (ties: the Tie); null if there is none
  safeStep(A, acts, to) {
    const moving = A.game.move.pieces
    const ok = this.legalSteps(A, acts).filter(s => this.piecesAt(A, s, this.side).length + moving.length <= 3)
    if (!ok.length) return null
    ok.sort((a, b) => B.dist(a, to) - B.dist(b, to) || this.tie(a, b))
    return ['space', ok[0]]
  }

  stepToward(A, acts, to) {
    const r = this._stepToward(A, acts, to)
    if (r && r[0] === 'space') this.lastSpace = r[1]
    return r
  }
  _stepToward(A, acts, to) {
    const sp = acts.space || []
    const cur = A.game.move.current
    if (!sp.length) return acts.stop ? ['stop'] : acts.done ? ['done'] : null
    if (cur === to) return acts.stop ? ['stop'] : null
    // stop rule: if we're on the front line (adjacent to enemy) and not capturing toward `to` adjacent, stop
    let best = null, bd = B.dist(cur, to)
    const moving = A.game.move.pieces
    const legal = new Set(this.legalSteps(A, acts))
    for (const s of sp) {
      if (!legal.has(s)) continue
      if (this.piecesAt(A, s, this.side).length + moving.length > 3) continue
      const d = B.dist(s, to)
      // don't end in an unsupplied space
      // nearest the destination; ties: the Staff card's Tie
      if (d < bd || (this.opts.stepTie !== false && d === bd && best !== null && this.tie(s, best) < 0)) { bd = d; best = s }
    }
    if (best === null) {
      if (acts.stop) return ['stop']
      // no step toward the target: take any safe step (no overstack, can end there), nearest the target
      return this.safeStep(A, acts, to)
    }
    if (!A.is_space_supplied(best, this.side) && acts.stop) return ['stop']
    return ['space', best]
  }

  s_move_stack(A, g, acts) {
    const m = this.curMove
    const cur = A.game.move.current
    const safe = () => { const sp = (acts.space || []).filter(x => A.can_end_move(x, A.game.move.pieces) && !this.enemyUnitsAt(A, x).length); return sp.length ? ['space', sp[0]] : null }
    if (!m) return acts.stop ? ['stop'] : safe()
    if (cur === m.to) return acts.stop ? ['stop'] : safe()
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
        // the legal group (strongest space first) among the units now able to attack this target
        const ps = this.legalGroup(A, this.bySpace(A, elig.filter(p => A.get_attackable_spaces([p]).includes(a.target))), a.target).ps
        if (!ps.length) { a.done = true; continue }
        a.group = ps
        const ev = this.evalAttack(A, ps, a.target)
        if (a.mo && this.opts.moRecheck !== false) {
          const mo = A.game[this.side].mo
          const still = mo && mo !== 'none' && A.satisfies_mo(mo, ps, this.enemyUnitsAt(A, a.target), a.target)
          if (!still) { a.score -= a.moBonus || 0; a.mo = false } // no longer an MO attack: judge it like any other
        }
        if (ev.edge + (a.score - a.edge) < this.minEdge() - 0.5 - EPS && !a.mo) { a.done = true; continue }
        this.curAttack = a
        return ['piece', ps[0]]
      }
      // opportunistic: any remaining eligible attackers with a good target
      let best = null
      for (const p of elig) for (const t of A.get_attackable_spaces([p])) {
        const ps = this.legalGroup(A, this.bySpace(A, elig.filter(q => A.get_attackable_spaces([q]).includes(t))), t).ps
        if (!ps.length) continue
        const ev = this.evalAttack(A, ps, t)
        if (ev.edge >= this.minEdge() - EPS && (!best || ev.edge > best.edge)) best = { target: t, edge: ev.edge, score: ev.edge, p: ps[0], group: ps }
      }
      if (best) { this.curAttack = best; plan.attacks.push(best); return ['piece', best.p] }
      return acts.confirm_pass_attack ? ['confirm_pass_attack'] : acts.pass ? ['pass'] : null
    }
    const a = this.curAttack
    const more = (acts.piece || []).filter(p => (!a.group || a.group.includes(p)) && A.get_attackable_spaces([...sel, p]).includes(a.target))
    if (more.length) return ['piece', more[0]]
    if ((acts.space || []).includes(a.target)) {
      // final check with the units actually selected: an ordinary attack more than 0.5 below the Stance is called off
      if (a.group && sel.length < a.group.length && !a.mo) {
        const ev = this.evalAttack(A, sel, a.target)
        if (ev.edge + ((a.score ?? ev.edge) - (a.edge ?? ev.edge)) < this.minEdge() - 0.5 - EPS && acts.undo) { a.done = true; this.stats.calledOff = (this.stats.calledOff || 0) + 1; return ['undo'] }
      }
      a.done = true; this.stats.attacks++; this.stats.edgeSum += a.edge || 0; return ['space', a.target]
    }
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
      if (this.opts.lossMode === 'flipFirst') return (red ? 20 : 0) + (pd.type === 'army' ? 10 : 2) + A.get_piece_cf(p) * 0.3
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
      // retreat: no overstack, bot-controlled, supplied, not in contact, nearest bot capital, most bot units, Tie
      const cap = B.CAPITALS[this.side]
      const moving = (A.game.attack && A.game.attack.retreating_pieces) ? A.game.attack.retreating_pieces.length : 1
      const key = x => [this.piecesAt(A, x, this.side).length + moving <= 3 ? 0 : 1, this.isMine(A, x) ? 0 : 1, A.is_space_supplied(x, this.side) ? 0 : 1, this.adjEnemy(A, x) ? 1 : 0, Math.min(...cap.map(c => B.dist(x, c))), -this.piecesAt(A, x, this.side).length]
      return ['space', sp.slice().sort((a, b) => lex(key(a), key(b)) || this.tie(a, b))[0]]
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
    const at = A.game.attack
    const t = at ? at.space : 0
    const sp = acts.space || []
    const ps = acts.piece || []
    const stance = this.dir ? this.dir.stance : 'P'
    const valuable = t && (data.spaces[t].vp || data.spaces[t].fort || B.OBJ[this.side][B.FRONT[t]].includes(t))
    const mode = this.opts.advance || 'std'
    const want = mode === 'never' ? false : mode === 'always' ? true : (valuable || stance !== 'H')
    if (!at) return fallback(acts)
    if (at.advance_length === 0 && at.advancing_pieces.length === 0) {
      if (!want) return acts.done ? ['done'] : fallback(acts)
    }
    if (at.advance_length === 0) {
      // select advancing pieces: strongest first, up to 3, keeping a guard in origins in contact with other enemy units
      const chosen = at.advancing_pieces
      const already = this.piecesAt(A, t, this.side).filter(p => !chosen.includes(p)).length
      if (chosen.length + already < 3) {
        const cand = ps.filter(p => !chosen.includes(p)).sort((a, b) => A.get_piece_cf(b) - A.get_piece_cf(a))
        for (const p of cand) {
          const org = A.game.location[p]
          const left = this.piecesAt(A, org, this.side).filter(q => q !== p && !chosen.includes(q))
          const otherContact = B.adj[org].some(x => x !== t && this.enemyUnitsAt(A, x).length > 0)
          if (this.opts.guard && left.length === 0 && otherContact && this.isMine(A, org)) continue
          return ['piece', p]
        }
      }
      if (chosen.length && sp.length) { this.stats.advances = (this.stats.advances || 0) + 1; return ['space', sp.includes(t) ? t : sp[0]] }
      return acts.done ? ['done'] : acts.stop ? ['stop'] : fallback(acts)
    }
    // already advanced one space: stop there
    return acts.stop ? ['stop'] : (ps.length ? ['piece', ps[0]] : fallback(acts))
  }

  // SR execution
  s_choose_sr_unit(A, g, acts) {
    const ps = acts.piece || []
    const pts = A.game.sr.pts
    if (!acts.confirm_end_sr && !acts.end_action && acts.reset_phase) { this.violation = true; this.stats.violations = (this.stats.violations || 0) + 1; return ['reset_phase'] }
    let cands = this.srCandidates(A, true).filter(x => ps.includes(x.p) && x.cost <= pts)
    if (this.srCrisisOnly) {
      const reserve = this.side === 'ap' ? A.AP_RESERVE_BOX : A.CP_RESERVE_BOX
      cands = cands.filter(x => A.game.location[x.p] === reserve)
      if (!cands.length) { this.srCrisisOnly = false; return acts.confirm_end_sr ? ['confirm_end_sr'] : acts.end_action ? ['end_action'] : null }
    }
    if (!cands.length) cands = this.srCandidates(A).filter(x => ps.includes(x.p) && x.cost <= pts && A.get_sr_destinations(x.p).length)
    // only units with a destination that will not overstack (stacking limit 3; boxes have no limit)
    cands = cands.filter(x => A.get_sr_destinations(x.p).some(d => d >= B.N || this.piecesAt(A, d, this.side).length < 3))
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
    const ed = this.enemyDist(A)
    // supplied; threatened (nearest enemy first); in contact on the earliest front; VP; Tie
    const fi = x => { const i = fronts.indexOf(B.FRONT[x]); return i < 0 ? 9 : i }
    const key = x => [x < B.N && !A.is_space_supplied(x, this.side) ? 1 : 0, thr.includes(x) ? 0 : 1, thr.includes(x) ? ed[x] : 0, this.adjEnemy(A, x) ? 0 : 1, this.adjEnemy(A, x) ? fi(x) : 0, data.spaces[x] && data.spaces[x].vp ? 0 : 1]
    return ['space', sp.slice().sort((a, b) => lex(key(a), key(b)) || this.tie(a, b))[0]]
  }

  s_replacement_phase(A, g, acts) {
    if ((acts.space || []).length) {
      // rebuild army: space nearest the directive front's line
      let sp = acts.space
      const roomy = sp.filter(s => s >= B.N || this.piecesAt(A, s, this.side).length < 3)
      if (roomy.length) sp = roomy
      const fronts = FRONT_ORDER[this.side]
      return ['space', sp.sort((a, b) => fronts.indexOf(B.FRONT[a]) - fronts.indexOf(B.FRONT[b]) || this.tie(a, b))[0]]
    }
    const ps = acts.piece || []
    if (ps.length) {
      const val = p => { const pd = data.pieces[p]; const onMap = A.game.location[p] < B.N; return (pd.type === 'army' ? 10 : 3) + (onMap && this.adjEnemy(A, A.game.location[p]) ? 3 : 0) + (onMap ? 1 : 0) }
      return ['piece', ps.sort((a, b) => val(b) - val(a))[0]]
    }
    return acts.confirm_end_rp ? ['confirm_end_rp'] : acts.end_rp ? ['end_rp'] : null
  }

  s_place_reinforcements(A, g, acts) {
    let sp = acts.space || []
    if (sp.length) {
      const roomy = sp.filter(s => s >= B.N || this.piecesAt(A, s, this.side).length < 3)
      if (roomy.length) sp = roomy
      const fronts = this.frontsInOrder(A)
      const ed = this.enemyDist(A)
      const fi = x => { const i = fronts.indexOf(B.FRONT[x]); return i < 0 ? 9 : i }
      const key = x => [fi(x), Math.min(ed[x] || 20, 20)]
      return ['space', sp.slice().sort((a, b) => lex(key(a), key(b)) || this.tie(a, b))[0]]
    }
    return acts.done ? ['done'] : acts.skip ? ['skip'] : null
  }

  s_draw_cards_phase(A, g, acts) {
    // discard combat cards only if hand would otherwise clog: keep at most 2
    const hand = A.game[this.side].hand
    const ccs = hand.filter(c => data.cards[c].cc)
    const offer = (acts.card || []).filter(c => data.cards[c].cc)
    const pri = c => (EP.BY[c] ? EP.BY[c].event_priority : 0)
    if (ccs.length > 2 && offer.length) return ['card', offer.slice().sort((a, b) => pri(a) - pri(b) || a - b)[0]]
    return ['done']
  }

  s_attrition_phase(A, g, acts) { return fallback(acts) }
  s_siege_phase(A, g, acts) { return fallback(acts) }
  s_trench_rolls(A, g, acts) { return fallback(acts) }
  s_confirm_mo(A, g, acts) { return ['next'] }
  s_confirm_move_violations(A, g, acts) {
    this.resets = (this.resets || 0) + 1
    if (this.resets > 25) throw new Error('unresolvable rule violation loop')
    this.violation = true; this.stats.violations = (this.stats.violations || 0) + 1; return ['reset_phase'] }
  s_end_operations(A, g, acts) { return ['end_action'] }
  s_confirm_event(A, g, acts) { return fallback(acts) }
  s_rps(A, g, acts) { return ['end_action'] }
  s_guns_of_august(A, g, acts) {
    // attack the space with the most VP/fort value: Liege first, then Sedan, else first
    const sp = acts.space || []
    for (const n of ['Liege', 'Sedan', 'Namur', 'Brussels']) { const s = B.byName[n]; if (sp.includes(s)) return ['space', s] }
    return sp.length ? ['space', sp[0]] : null
  }
  // spaces in front order (the Staff card's front first), then the Tie; spaces off the five fronts last
  byFrontThenTie(A, spaces) {
    const fo = this.frontsInOrder(A)
    const fi = x => { const i = fo.indexOf(B.FRONT[x]); return i < 0 ? 99 : i }
    return spaces.slice().sort((a, b) => fi(a) - fi(b) || this.tie(a, b))
  }
  // §9 Other choices: an event trench goes in front order, then the Tie
  s_place_event_trench(A, g, acts) {
    const sp = acts.space || []
    if (!sp.length) return acts.skip ? ['skip'] : null
    if (this.opts.trenchMode === 'contact') { const v = s => (this.adjEnemy(A, s) ? 3 : 0) + (data.spaces[s].vp ? 2 : 0); return ['space', sp.slice().sort((a, b) => v(b) - v(a))[0]] }
    return ['space', this.byFrontThenTie(A, sp)[0]]
  }

  // ---------- event choices (§9, Event choices) ----------
  // Landwehr: flip reduced German units in the Replacement Phase order (armies in contact, other armies, corps in contact, other corps)
  s_landwehr(A, g, acts) {
    if (this.opts.eventChoices === false) return null
    const ps = acts.piece || []
    if (!ps.length) return acts.end_action ? ['end_action'] : acts.pass ? ['pass'] : null
    const val = p => (data.pieces[p].type === 'army' ? 10 : 3) + (this.adjEnemy(A, A.game.location[p]) ? 3 : 0)
    const fo = this.byFrontThenTie(A, ps.map(p => A.game.location[p]))
    return ['piece', ps.slice().sort((x, y) => val(y) - val(x) || fo.indexOf(A.game.location[x]) - fo.indexOf(A.game.location[y]))[0]]
  }
  // War in Africa (bot is the Allies): remove a British corps rather than give the VP: Reserve Box first, then a corps out of contact, then any
  s_war_in_africa(A, g, acts) {
    if (this.opts.eventChoices === false) return null
    const ps = acts.piece || []
    if (!ps.length || this.opts.warInAfrica === 'vp') return acts.pass ? ['pass'] : acts.done ? ['done'] : null
    const rank = p => { const at = A.game.location[p]; return at === A.AP_RESERVE_BOX ? 0 : this.adjEnemy(A, at) ? 2 : 1 }
    const order = this.byFrontThenTie(A, ps.map(p => A.game.location[p])).reverse() // otherwise the space latest in front order
    return ['piece', ps.slice().sort((x, y) => rank(x) - rank(y) || order.indexOf(A.game.location[x]) - order.indexOf(A.game.location[y]))[0]]
  }
  s_war_in_africa_confirm(A, g, acts) { return acts.done ? ['done'] : null }
  // Salonika (bot is the Allies): send corps, up to the limit: Reserve Box first, then corps out of contact; never a corps in contact
  s_salonika(A, g, acts) {
    if (this.opts.eventChoices === false) return null
    const ps = (acts.piece || []).filter(p => A.game.location[p] === A.AP_RESERVE_BOX || !this.adjEnemy(A, A.game.location[p]))
    if (!ps.length) return acts.done ? ['done'] : null
    const order = this.byFrontThenTie(A, ps.map(p => A.game.location[p])).reverse()
    return ['piece', ps.slice().sort((x, y) => (A.game.location[x] === A.AP_RESERVE_BOX ? 0 : 1) - (A.game.location[y] === A.AP_RESERVE_BOX ? 0 : 1) || order.indexOf(A.game.location[x]) - order.indexOf(A.game.location[y]))[0]]
  }
  // Entering neutral units: each goes to an empty space of its nation next to enemy units first, then a VP space, then any; ties: the Tie
  s_place_new_neutral_units(A, g, acts) {
    if (this.opts.eventChoices === false) return null
    const sp = acts.space || []
    if (!sp.length) return acts.done ? ['done'] : null
    const rank = x => this.adjEnemy(A, x) ? 0 : data.spaces[x].vp ? 1 : 2
    return ['space', sp.slice().sort((a, b) => rank(a) - rank(b) || this.tie(a, b))[0]]
  }
  // Withdrawal (bot defending): negate the loss that eliminated a unit first, then the strongest unit's
  s_withdrawal_negate_step_loss(A, g, acts) {
    if (this.opts.eventChoices === false) return null
    const ps = acts.piece || []
    if (!ps.length) return acts.pass ? ['pass'] : null
    const gone = p => A.game.location[p] === A.game.attack.space ? 1 : 0
    return ['piece', ps.slice().sort((x, y) => gone(x) - gone(y) || A.get_piece_cf(y) - A.get_piece_cf(x) || x - y)[0]]
  }
  s_withdrawal_negate_step_loss_confirm(A, g, acts) { return acts.done ? ['done'] : null }
  // Trench-negating combat cards: play one when the bot would play a combat card in this attack
  s_negate_trench(A, g, acts) {
    for (const c of acts.card || []) if (EP.ccOk(this, A, c, true)) return ['card', c]
    return acts.next ? ['next'] : null
  }
  // Kerensky Offensive: use the +2 on the first Russian attack that can
  s_kerensky_offensive_option(A, g, acts) { if (this.opts.eventChoices === false) return null; return acts.use ? ['use'] : acts.pass ? ['pass'] : null }
}

// Lexicographic comparison of key arrays (smaller is better).
function lex(ka, kb) { for (let i = 0; i < ka.length; i++) { if (ka[i] !== kb[i]) return ka[i] - kb[i] } return 0 }

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
