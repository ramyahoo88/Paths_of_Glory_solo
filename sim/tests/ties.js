// Staff Tie regressions from the v0.8.1 comprehensive audit (A02, Q01): Forward destination, SR unit, replacement unit,
// losses and advance order, each with North and South controls. Fixtures are the audit's focused positions.
// usage: node sim/tests/ties.js
'use strict'
const path = require('path'), assert = require('assert/strict')
const root = path.resolve(__dirname, '../..')
const R = require(path.join(root, 'engine/rules.js')), B = require(path.join(root, 'sim/board.js'))
const { Bot, makeDeck, legal } = require(path.join(root, 'sim/bot.js'))
const copy = x => JSON.parse(JSON.stringify(x))
const deck = makeDeck(), card = id => deck[id - 1]
const name = s => B.data.spaces[s].name
const pass = []

// A02 Forward: Allied stack in Bar le Duc; Verdun and Nancy (two Allied units each, in contact) are both 1 + 0.5 x 1 = 1.5 from it
// via Metz, the West Objective. Staff card 3 (North) -> Verdun; card 6 (South) -> Nancy. With Verdun full, Nancy whatever the Tie.
{
  const x = require('./fixtures/forward-tie.json')
  for (const [id, want] of [[3, 'Verdun'], [6, 'Nancy']]) {
    const g = copy(x.game), b = new Bot('ap', x.seed); b.dir = card(id)
    R.__with(g, A => {
      const from = B.S('Bar le Duc'), obj = b.objectiveOf(A, 'WEST')
      assert.equal(obj, B.S('Metz'))
      assert.equal(name(b.frontLineTarget(A, from, 'WEST', obj)), want, `Forward, card ${id}`)
      const m = b.moveCandidates(A, b.frontsInOrder(A), new Set()).find(m => m.from === from && m.kind === 'forward')
      assert.equal(name(m.to), want); assert(b.hasFirstStep(A, m))
    })
    pass.push(`A02 Forward, card ${id} (Tie ${card(id).tie}): ${want}`)
  }
  const g = copy(x.game), b = new Bot('ap', x.seed); b.dir = card(3)
  R.__with(g, A => {
    const p = B.data.pieces.findIndex((p, i) => p.faction === 'ap' && p.nation === 'fr' && p.type === 'corps' && g.location[i] === A.AP_RESERVE_BOX)
    g.location[p] = B.S('Verdun'); b.invalidate()
    assert.equal(name(b.frontLineTarget(A, B.S('Bar le Duc'), 'WEST', b.objectiveOf(A, 'WEST'))), 'Nancy')
  })
  pass.push('A02 Forward control: with Verdun full, card 3 (North) moves toward Nancy')
}

// A02 SR and replacement unit: GE units in Stuttgart and Berlin, equally ranked. Card 1 (North) -> Berlin; card 4 (South) -> Stuttgart.
for (const [fx, what, ids] of [['sr-tie', 'SR unit', [68, 69]], ['rp-tie', 'replacement', [1, 2]]]) {
  const x = require(`./fixtures/${fx}.json`)
  for (const [id, want] of [[1, 'Berlin'], [4, 'Stuttgart']]) {
    const g = copy(x.game), b = new Bot('cp', x.seed); b.dir = card(id)
    const v = R.view(g, g.active); assert.deepEqual(v.actions.piece, ids)
    const a = b.decide(g, v); assert(legal(v.actions, a))
    assert.equal(name(g.location[a[1]]), want, `${what}, card ${id}`)
    const next = R.action(g, g.active, ...a)
    if (fx === 'sr-tie') assert.equal(next.sr.unit, a[1]); else assert(!next.reduced.includes(a[1]))
    pass.push(`A02 ${what}, card ${id} (Tie ${card(id).tie}): ${want}`)
  }
}

// Q01: among equally ranked SR units, one in the Reserve Box comes before one on the map, whatever the Tie
{
  const x = require('./fixtures/sr-tie.json')
  for (const id of [1, 4]) {
    const g = copy(x.game), b = new Bot('cp', x.seed); b.dir = card(id)
    const res = R.__with(g, A => { g.location[69] = A.CP_RESERVE_BOX; return b.srCandidates(A).filter(c => [68, 69].includes(c.p)).sort((p, q) => b.unitTie(A, p.p, q.p))[0].p })
    assert.equal(res, 69, `Reserve Box first, card ${id}`)
  }
  pass.push('Q01 SR: a unit in the Reserve Box before an equal unit on the map (cards 1 and 4)')
}

// Losses and advance order across spaces use the same unit Tie: the two reduced GE armies of rp-tie (Stuttgart, Berlin)
{
  const x = require('./fixtures/rp-tie.json')
  for (const [id, want] of [[1, 'Berlin'], [4, 'Stuttgart']]) {
    const g = copy(x.game), b = new Bot('cp', x.seed); b.dir = card(id)
    R.__with(g, A => {
      assert.equal(A.get_piece_cf(1), A.get_piece_cf(2))
      const a = b.lossChoice(A, { piece: [1, 2] }); assert.equal(name(g.location[a[1]]), want, `loss, card ${id}`)
      assert.equal(name(g.location[[1, 2].sort((p, q) => b.unitTie(A, p, q))[0]]), want)
    })
    pass.push(`A02 review, losses across spaces, card ${id}: step from ${want}`)
  }
}

// Switch: printedTies false keeps the old piece-number order (for paired comparisons)
{
  const x = require('./fixtures/rp-tie.json'), g = copy(x.game), b = new Bot('cp', x.seed, { printedTies: false }); b.dir = card(1)
  const a = b.decide(g, R.view(g, g.active)); assert.equal(name(g.location[a[1]]), 'Stuttgart')
  pass.push('printedTies: false keeps the pre-v0.8.2 order (Stuttgart, lower piece number)')
}

for (const p of pass) console.log('ok  ', p)
console.log(`PASS ${pass.length} checks`)
