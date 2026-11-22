// GS-14 regression (from the v0.7.2 comprehensive audit's multinational-proof.cjs).
// Reduced FR 1 in Verdun, full BR 1 in Nancy, GE corps in intact Metz (fort 3). Each army can attack Metz alone;
// together they cannot (no common space holds both nations, rule 12.1.11.1). The plan must not pay for both, must
// score the group it will really use, and any attack it makes must meet the resolution cutoff.
'use strict'
const path = require('path'), assert = require('assert')
const root = path.resolve(__dirname, '../..')
const R = require(path.join(root, 'engine/rules.js')), B = require(path.join(root, 'sim/board.js')), { Bot } = require(path.join(root, 'sim/bot.js'))
function position(joined) {
  const g = R.setup(987654, 'Historical', { no_supply_warnings: true }); g.location.fill(0); g.reduced = [32]; g.cp.trenches = []; g.ap.mo = 'none'; g.ap.actions = []; g.turn = 3; g.active = 'Allied Powers'; g.state = 'action_phase'
  g.location[32] = B.S('Verdun'); g.location[42] = B.S(joined ? 'Verdun' : 'Nancy'); g.location[68] = B.S('Metz'); g.ap.hand = [4]
  R.__with(g, A => A.update_supply()); return g
}
const bot = () => { const b = new Bot('ap', 987654); b.dir = { id: 3, n: 1, stance: 'H', plan: 'L', tie: 'N' }; return b }
const Metz = B.S('Metz')

let g = position(false), b = bot()
assert.deepEqual(R.__with(g, A => A.get_attackable_spaces([32, 42])), [], 'fixture: the two armies cannot attack together')
b.plan = R.__with(g, A => b.planOps(A, 2))
const att = b.plan.attacks.find(a => a.target === Metz)
if (att) {
  assert.equal(att.spaces.length, 1, 'the plan activates only one of the two incompatible spaces')
  const solo = R.__with(g, A => b.evalAttack(A, att.spaces.flatMap(s => b.attackersFrom(A, s, Metz)), Metz))
  assert.equal(att.edge, solo.edge, 'the planned Edge is the Edge of the group that can really attack')
  assert(att.score >= b.minEdge() - 1e-9, 'a planned attack meets the Stance')
}
console.log('plan:', JSON.stringify(b.plan.attacks.map(a => ({ target: B.data.spaces[a.target].name, spaces: a.spaces.map(s => B.data.spaces[s].name), edge: a.edge, score: a.score }))), 'cost', b.plan.cost)
// play it out: any attack actually made must meet the resolution cutoff
g = R.action(g, g.active, 'play_ops', 4)
for (let i = 0; i < 40 && g.state !== 'game_over'; i++) {
  if (g.active !== 'Allied Powers') break
  const v = R.view(g, g.active), a = b.decide(g, v)
  if (g.state === 'choose_attackers' && a[0] === 'space') {
    const ev = R.__with(g, A => b.evalAttack(A, g.attack.pieces, a[1]))
    const pl = b.curAttack, score = ev.edge + (pl.score - pl.edge)
    console.log('attack:', B.data.spaces[a[1]].name, 'with', g.attack.pieces.map(p => B.data.pieces[p].name), 'edge', ev.edge, 'score', score)
    assert(score >= b.minEdge() - 0.5 - 1e-9, 'an executed attack meets the resolution cutoff')
  }
  if (g.state === 'action_phase' && i > 0) break
  g = R.action(g, g.active, ...a)
}
// control: with both armies in Verdun the combined attack is legal and both are used
const n = position(true), b2 = bot()
assert(R.__with(n, A => A.get_attackable_spaces([32, 42])).includes(Metz))
const p2 = R.__with(n, A => b2.planOps(A, 2)), a2 = p2.attacks.find(a => a.target === Metz)
assert(a2, 'control: the common-stack attack is planned')
console.log('control plan:', JSON.stringify({ spaces: a2.spaces.map(s => B.data.spaces[s].name), edge: a2.edge, score: a2.score }))
console.log('PASS GS-14 multinational checks')
