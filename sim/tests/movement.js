// Movement regressions from the v0.7.5 comprehensive audit (C01 supply, C02 corps-only siege entry).
// usage: node sim/tests/movement.js
'use strict'
const path = require('path'), assert = require('assert/strict')
const root = path.resolve(__dirname, '../..')
const R = require(path.join(root, 'engine/rules.js')), B = require(path.join(root, 'sim/board.js'))
const { Bot, makeDeck, legal } = require(path.join(root, 'sim/bot.js'))
const copy = x => JSON.parse(JSON.stringify(x)), update = g => R.__with(g, A => A.update_supply())
const pass = []

// C01: SB 1 and a Serbian corps in Skopje, first step of a move toward Sofia (out of supply there; no Stop offered).
{
  const x = require('./fixtures/supply-1080907.json'), g = copy(x.game)
  const b = new Bot('ap', x.seed); b.dir = makeDeck()[0]; b.curMove = copy(x.move)
  const v = R.view(g, g.active), a = b.decide(g, v)
  assert(legal(v.actions, a)); assert(!v.actions.stop)
  assert.notDeepEqual(a, ['space', B.S('Sofia')], 'never step into Sofia, where the Serbian units would be out of supply')
  if (a[0] === 'space') {
    const next = R.action(g, g.active, ...a); update(next)
    assert(R.__with(next, A => g.move.pieces.every(p => A.is_unit_supplied(p))), 'any step taken keeps the units supplied')
  }
  pass.push('C01: Skopje stack does not enter Sofia out of supply (action ' + JSON.stringify(a) + (a[0] === 'space' ? ' ' + B.data.spaces[a[1]].name : '') + ')')
  // control: with a supply route opened through Strumitsa and Salonika, Sofia is a legal supplied step again
  const open = copy(x.game)
  for (const n of ['Strumitsa', 'Salonika']) { const s = B.S(n); open.control[s >> 5] &= ~(1 << (s & 31)); for (let p = 1; p < open.location.length; p++) if (open.location[p] === s && B.data.pieces[p] && B.data.pieces[p].faction === 'cp') open.location[p] = 0 }
  open.events.salonika = open.turn; update(open)
  const ok = R.__with(open, A => new Bot('ap', 1).prospectiveSupplied(A, open.move.pieces, B.S('Sofia')))
  assert(ok, 'control: with the route open, Sofia counts as supplied'); pass.push('C01 control: with a route through Strumitsa and Salonika, Sofia is supplied')
}
// C02: two GE corps in Mulhouse can besiege Belfort (fort 2) together; the bot must not send one corps alone.
{
  const x = require('./fixtures/corps-siege.json'); let g = copy(x.game)
  const b = new Bot('cp', 88); b.deck = [makeDeck().find(c => c.id === x.staff.id)]; b.discard = []
  let resets = 0, started = false
  for (let i = 0; i < 60; i++) {
    if (g.active !== 'Central Powers' || g.state === 'game_over') break
    if (g.state === 'action_phase' && started) break
    const v = R.view(g, g.active), a = b.decide(g, v); assert(legal(v.actions, a)); started = true
    if (a[0] === 'reset_phase') resets++
    g = R.action(g, g.active, ...a)
  }
  const belfort = B.S('Belfort'), there = [68, 69].filter(p => g.location[p] === belfort)
  assert.equal(resets, 0, 'no rule-violation reset')
  assert(there.length === 0 || there.length === 2, 'Mulhouse corps enter Belfort together or not at all')
  pass.push(`C02: no reset; corps in Belfort: ${there.length}${there.length ? (g.forts.besieged.includes(belfort) ? ' (besieged)' : '') : ''}`)
}
for (const p of pass) console.log('ok  ', p)
console.log(`PASS ${pass.length} movement checks`)
