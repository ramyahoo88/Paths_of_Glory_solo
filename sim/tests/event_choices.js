// Event-choice regressions (GS-06 Salonika addendum and GS-15 from the v0.7.3 re-audit).
// usage: node sim/tests/event_choices.js
'use strict'
const path = require('path'), assert = require('assert/strict')
const root = path.resolve(__dirname, '../..')
const R = require(path.join(root, 'engine/rules.js')), B = require(path.join(root, 'sim/board.js'))
const { Bot, ROLE, legal } = require(path.join(root, 'sim/bot.js'))
const bot = (tie = 'N') => { const b = new Bot('ap', 100); b.dir = { id: 3, n: 1, stance: 'H', plan: 'L', tie }; return b }
function base(state) { const g = R.setup(100, 'Historical', { no_supply_warnings: true }); g.location.fill(0); g.turn = 5; g.active = ROLE.ap; g.state = state; g.ap.commitment = 'limited'; g.war.tu = 2; g.salonika_sr_remaining = 3; g.war_in_africa_removed = 0; return g }
const pass = []

// GS-15: two corps out of contact on the same front (Port Said is north of Alexandria): the Staff card's Tie decides
for (const state of ['war_in_africa', 'salonika']) for (const tie of ['N', 'S']) {
  const g = base(state); g.location[156] = B.S('Port Said'); g.location[157] = B.S('Alexandria')
  const b = bot(tie), v = R.view(g, g.active), a = b.decide(g, v)
  const expected = tie === 'N' ? 156 : 157
  assert(legal(v.actions, a)); assert.deepEqual(a, ['piece', expected], `${state}, Tie ${tie}`)
  pass.push(`${state}, Tie ${tie}: ${B.data.spaces[g.location[expected]].name}`)
}
// the Reserve Box still comes first
for (const state of ['war_in_africa', 'salonika']) {
  const g = base(state); g.location[156] = B.S('Port Said'); g.location[157] = R.__api.AP_RESERVE_BOX
  assert.deepEqual(bot().decide(g, R.view(g, g.active)), ['piece', 157]); pass.push(`${state}: Reserve Box corps first`)
}
// GS-06 addendum: with only a corps in contact, Salonika is not played as an event
{
  const g = base('action_phase'); g.ap.hand = [30]; g.ap.actions = []; g.location[156] = B.S('Port Said'); g.location[68] = B.S('Sinai')
  const b = bot(), v = R.view(g, g.active), a = b.decide(g, v)
  assert(legal(v.actions, a)); assert.notDeepEqual(a, ['play_event', 30], 'Salonika must not be played with no corps the bot may send')
  pass.push('Salonika is not played when its only corps is in contact (action: ' + JSON.stringify(a) + ')')
  // control: the same corps out of contact makes the event eligible again
  const g2 = base('action_phase'); g2.ap.hand = [30]; g2.ap.actions = []; g2.location[156] = B.S('Port Said')
  const pr = R.__with(g2, A => require(path.join(root, 'sim/events.js')).priority(bot(), A, 30))
  assert(pr > 0); pass.push('control: with the corps out of contact, Salonika keeps its event priority (' + pr + ')')
}
// the re-audit's reached campaign (seed 1080055) now finishes with no Salonika fallback
{
  const seed = 1080055; let g = R.setup(seed, 'Historical', { no_supply_warnings: true }), steps = 0
  const P = { [ROLE.ap]: new Bot('ap', seed), [ROLE.cp]: new Bot('cp', seed) }
  while (g.state !== 'game_over' && steps < 60000) { const role = g.active, v = R.view(g, role), a = P[role].decide(g, v); assert(legal(v.actions, a)); g = R.action(g, role, ...a); steps++ }
  const fb = Object.assign({}, P[ROLE.ap].stats.fallback, P[ROLE.cp].stats.fallback)
  assert.equal(g.state, 'game_over'); assert(!Object.keys(fb).some(k => /salonika/.test(k)), JSON.stringify(fb)); assert(!P[ROLE.ap].stats.salonikaForced)
  pass.push(`seed ${seed} campaign: finished (${g.result}), no Salonika fallback or forced transfer`)
}
for (const p of pass) console.log('ok  ', p)
console.log(`PASS ${pass.length} event-choice checks`)
