// Priority regressions from the v0.7.5 comprehensive audit (C03 Brusilov, C04 Tie/front order).
// usage: node sim/tests/priorities.js
'use strict'
const path = require('path'), assert = require('assert/strict')
const root = path.resolve(__dirname, '../..')
const R = require(path.join(root, 'engine/rules.js')), B = require(path.join(root, 'sim/board.js'))
const { Bot, makeDeck, legal } = require(path.join(root, 'sim/bot.js'))
const copy = x => JSON.parse(JSON.stringify(x))
const pass = []

// C04a: equal-CF attack origins (GE 1 in Metz, GE 2 in Strasbourg, both 5 CF) against Nancy: Tie North -> Metz, South -> Strasbourg
{
  const x = require('./fixtures/attack-tie.json')
  for (const [tie, want] of [['N', 'Metz'], ['S', 'Strasbourg']]) {
    const g = copy(x.game), b = new Bot('cp', 88, { edgeShift: 0 }); b.dir = Object.assign({}, x.staff, { tie }) // v0.7.6 thresholds: this checks the Tie, not the Stance
    const plan = R.__with(g, A => b.planOps(A, x.budget || 1))
    const a = plan.attacks.find(t => t.target === B.S('Nancy')); assert(a, 'Nancy attack planned')
    assert.deepEqual(a.spaces.map(s => B.data.spaces[s].name), [want], `Tie ${tie}`)
    pass.push(`C04 attack origin, Tie ${tie}: ${want}`)
  }
}
// C04b: siege rolls in front order, then the Tie (Staff card 10 puts East first: Ivangorod before Nancy)
{
  const x = require('./fixtures/siege-order.json'), g = copy(x.game)
  const b = new Bot('cp', 88, { campaign: null }); b.dir = x.staff // the Staff card alone sets the first front here
  const v = R.view(g, g.active), a = b.decide(g, v)
  assert(legal(v.actions, a)); assert.deepEqual(a, ['space', B.S('Ivangorod')])
  pass.push('C04 siege rolls: Ivangorod (East, first in front order) before Nancy')
  const g3 = copy(x.game), b3 = new Bot('cp', 88); b3.dir = x.staff // v0.8 release: the CP bot puts the West first
  assert.deepEqual(b3.decide(g3, R.view(g3, g3.active)), ['space', B.S('Nancy')]); pass.push('v0.8 CP bot: West first, so Nancy rolls before Ivangorod even with Staff card 10')
  const g2 = copy(x.game), b2 = new Bot('cp', 88, { campaign: null }); b2.dir = makeDeck().find(c => c.id === 3) // front 1: West first
  const a2 = b2.decide(g2, R.view(g2, g2.active)); const fo = R.__with(g2, A => b2.frontsInOrder(A))
  const first = fo.indexOf('WEST') < fo.indexOf('EAST') ? 'Nancy' : 'Ivangorod'
  assert.deepEqual(a2, ['space', B.S(first)]); pass.push(`C04 siege rolls control: Staff card 3 (${fo[0]} first) rolls ${first} first`)
}
// C03: Brusilov Offensive trench cancellation is used when offered
{
  const x = require('./fixtures/brusilov-trace.json'), g = copy(x.game)
  const b = new Bot('ap', x.seed); b.dir = x.staff
  const v = R.view(g, g.active); assert.equal(g.state, 'brusilov_offensive_option')
  const a = b.decide(g, v); assert.deepEqual(a, ['use'])
  const next = R.action(g, g.active, ...a); assert.equal(next.attack.trenches_canceled, true)
  assert(!Object.keys(b.stats.fallback).length, 'no generic fallback')
  assert.equal(next.action_state.brusilov_available, undefined, 'the cancellation is used up for this action')
  pass.push('C03 Brusilov: trench effects cancelled on the first eligible attack, and not offered again')
}
for (const p of pass) console.log('ok  ', p)
console.log(`PASS ${pass.length} priority checks`)
