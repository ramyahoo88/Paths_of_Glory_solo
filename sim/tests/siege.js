// Siege-withdrawal regression (v0.7.4 verification follow-up; rules 15.2.4, §6).
// Position: seed 1080569, CP turn 9 round 6, captured from v0.7.4 just before it moved GE 6 and a corps out of
// besieged Nancy (French fort level 2), leaving one reduced corps, which forced a rule-violation reset.
// The bot must play the round without a reset, and any units left at Nancy must still be able to besiege it.
// usage: node sim/tests/siege.js [path/to/other/sim]   (an older sim folder shows the original failure)
'use strict'
const path = require('path'), assert = require('assert/strict')
const root = path.resolve(__dirname, '../..')
const simDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'sim')
const R = require(path.join(root, 'engine/rules.js')), B = require(path.join(root, 'sim/board.js'))
const { Bot, ROLE, legal, makeDeck } = require(path.join(simDir, 'bot.js'))
const fx = require('./fixtures/siege-1080569.json')
let g = structuredClone(fx.game)
const b = new Bot('cp', fx.seed); b.deck = [makeDeck().find(c => c.id === fx.staff.id)]; b.discard = []
const NANCY = B.S('Nancy')
let resets = 0, steps = 0, started = false
while (steps < 400) {
  if (g.active !== ROLE.cp) break
  if (g.state === 'action_phase' && started) break
  const v = R.view(g, g.active), a = b.decide(g, v)
  assert(legal(v.actions, a))
  if (a[0] === 'reset_phase') resets++
  started = true
  g = R.action(g, g.active, ...a); steps++
}
const left = []; for (let p = 1; p < B.data.pieces.length; p++) if (g.location[p] === NANCY && B.data.pieces[p].faction === 'cp') left.push(p)
const ok = left.length === 0 || R.__with(g, A => A.can_besiege(NANCY, left))
console.log(`round played in ${steps} decisions; resets ${resets}; CP units left at Nancy: ${left.map(p => B.data.pieces[p].name).join(', ') || 'none'}; besieging force ${ok ? 'legal' : 'too weak'}`)
assert.equal(resets, 0, 'no rule-violation reset'); assert(ok, 'units left at Nancy keep a legal siege')
console.log('PASS siege-withdrawal check')
