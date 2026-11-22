// Regression tests for the General Staff Companion page script (no browser: small DOM and storage doubles).
// Adapted from the v0.7.2 comprehensive audit's app-state-checks.cjs, with the corrected behaviour asserted.
// usage: node app/test_companion.cjs
'use strict'
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert')
const html = fs.readFileSync(path.join(__dirname, 'General_Staff_Companion.html'), 'utf8')
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]
const KEY = 'gs-companion'

function boot(saved, failWrite = false) {
  const nodes = {}
  for (const m of html.matchAll(/\bid="([^"]+)"/g)) nodes[m[1]] = { value: '', checked: false, disabled: false, innerHTML: '', textContent: '', classList: { toggle() {} } }
  for (const m of html.matchAll(/<input\b([^>]+)>/g)) { const id = m[1].match(/id="([^"]+)"/); if (id) { nodes[id[1]].value = (m[1].match(/value="([^"]*)"/) || [])[1] || ''; nodes[id[1]].checked = /\bchecked\b/.test(m[1]) } }
  for (const m of html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>\s*<option(?: value="([^"]*)")?[^>]*>([^<]+)/g)) nodes[m[1]].value = m[2] ?? m[3]
  const tabs = ['obj', 'front', 'ev'].map(t => ({ dataset: { t }, classList: { toggle() {} } }))
  const store = new Map(); if (saved != null) store.set(KEY, saved)
  let rnd = 123456789
  const crypto = { getRandomValues(a) { rnd = (Math.imul(1664525, rnd) + 1013904223) >>> 0; a[0] = rnd; return a } }
  const localStorage = { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => { if (failWrite) throw Error('QuotaExceededError'); store.set(k, v) } }
  const context = vm.createContext({ document: { getElementById: id => nodes[id], querySelectorAll: () => tabs }, localStorage, window: { crypto }, crypto, Uint32Array, Math, JSON, Set, Number, Array })
  let error = null; try { vm.runInContext(script, context) } catch (e) { error = e.message }
  return { nodes, store, error, run: s => vm.runInContext(s, context), state: () => JSON.parse(vm.runInContext('JSON.stringify(S)', context)) }
}
const pass = []
const ok = (cond, label) => { assert(cond, label); pass.push(label) }

// deck cycle, reshuffle Undo (GS-12), reload
let a = boot(); ok(a.error === null && a.state().deck.length === 18 && a.state().cur === null, 'clean first launch')
for (let i = 0; i < 18; i++) a.nodes.draw.onclick()
let s = a.state(); ok(new Set(s.discard).size === 18 && s.deck.length === 0, 'one cycle draws every card once')
const before = JSON.stringify(s); a.nodes.draw.onclick(); ok(a.state().deck.length === 17 && a.state().discard.length === 1, 'the 19th draw reshuffles')
a.nodes.undo.onclick(); ok(JSON.stringify(a.state()) === before, 'GS-12: Undo after a reshuffle restores the exact pre-draw state (0 in deck, 18 discarded)')
a = boot(before); ok(JSON.stringify(a.state()) === before, 'a valid saved session reloads unchanged')
for (let i = 0; i < 18; i++) a.nodes.undo.onclick(); ok(a.state().cur === null && a.state().deck.length === 18, 'Undo of 18 draws restores the start')
a.nodes.newdeck.onclick(); ok(a.state().deck.length === 18 && a.state().discard.length === 0, 'New deck shuffles all 18'); a.nodes.undo.onclick(); ok(a.state().deck.length === 18, 'Undo restores the deck before New deck')

// displays
a = boot(); let n = 0
for (const side of ['ap', 'cp']) for (const lvl of ['mobilization', 'limited', 'total']) for (let id = 1; id <= 18; id++) {
  a.run(`S.side=${JSON.stringify(side)};S.lvl=${JSON.stringify(lvl)};S.cur=${id};render()`)
  assert(!a.nodes.card.innerHTML.includes('undefined') && a.nodes.card.innerHTML.includes(`Card ${id}/18`)); n++
}
ok(n === 108, '108 side/commitment/card displays are complete')

// calculator
function inputs(values) { for (const [k, v] of Object.entries(values)) { if (typeof v === 'boolean') a.nodes[k].checked = v; else a.nodes[k].value = String(v); a.nodes[k].oninput?.() } }
a.run("S.side='ap';S.cur=1;render()")
inputs({ acf: 0, aarmy: false, dcf: 16, darmy: true, dunits: true, fort: 0, terr: 0, tr: 2, bmo: 6, bfront: 0, bobj: false, bnear: false, bvp: false, boos: false })
ok(a.nodes.edge.innerHTML.includes('last-chance MO') && a.nodes.edge.innerHTML.includes('Score +0.00'), 'GS-10: a rounds 5-6 MO attack below the Stance is shown as mandatory, with its Score')
inputs({ bmo: 2.5 }); ok(a.nodes.edge.innerHTML.includes('too weak'), 'GS-10 control: a rounds 3-4 MO attack below the Stance stays too weak')
a.run("S.side='cp';S.cur=3;render()")
inputs({ acf: 8, aarmy: true, dcf: 0, darmy: true, dunits: false, fort: 2, terr: 0, tr: 2, bmo: 0 }); const empty0 = a.nodes.edge.innerHTML
inputs({ dcf: 12 }); const empty12 = a.nodes.edge.innerHTML
ok(empty0 === empty12 && empty12.includes('defender 0.8') && empty12.includes('— attack'), 'GS-11: an empty fort ignores leftover unit CF (fort 2 on Corps = 0.8)')
ok(a.nodes.dcf.disabled && a.nodes.darmy.disabled && a.nodes.tr.disabled, 'GS-11: unit-only inputs are disabled for an empty fort')
inputs({ dunits: true }); ok(!a.nodes.dcf.disabled && a.nodes.edge.innerHTML.includes('defender 5.8'), 'ticking units again restores the defence (12 CF + fort 2 = 14 on Army, one column right for the trench: 5.8)')
inputs({ dcf: 0, fort: 0, darmy: false, tr: 0 }); ok(a.nodes.edge.innerHTML.includes('defender 0.3'), 'GS-02: an occupied 0-CF defence fires on Corps 0')
inputs({ acf: 9, aarmy: true, dcf: 12, darmy: true, fort: 0, tr: 0, terr: 0, bfront: -0.25, bobj: false, bnear: true, bvp: true, bmo: 0 })
ok(a.nodes.edge.innerHTML.includes('Score +0.05'), 'GS-03: 9 vs 12 armies with +0.4 +0.5 -0.25 gives Score +0.05')

// saved-session validation (GS-13)
const bad = { side: 'invalid-side', lvl: 'mobilization', deck: [1, 2], discard: [3], hist: [], cur: 3 }
let c = boot(JSON.stringify(bad))
ok(c.error === null && c.state().deck.length === 18 && c.state().side === 'cp', 'GS-13: an invalid side is rejected and a new deck starts')
ok(c.nodes.notice.textContent.includes('damaged') && c.store.get(KEY + '-rejected') === JSON.stringify(bad), 'GS-13: the rejection is shown and the old data kept')
c = boot(JSON.stringify({ side: 'cp', lvl: 'mobilization', deck: Array(18).fill(1), discard: [], hist: [], cur: null }))
c.nodes.draw.onclick(); c.nodes.draw.onclick(); ok(new Set(c.state().discard).size === 2, 'GS-13: a deck of duplicate cards is rejected')
c = boot(JSON.stringify({ side: 'cp', lvl: 'mobilization', deck: [1], discard: [2], hist: ['invalid JSON'], cur: 2 }))
ok(c.error === null && c.state().deck.length === 18, 'GS-13: damaged history is rejected at load')
c = boot(); c.nodes.draw.onclick(); c.run("S.hist.push('invalid JSON')"); let err = null; try { c.nodes.undo.onclick() } catch (e) { err = e }
ok(err === null && c.state().cur === null && c.nodes.notice.textContent.includes('skipped'), 'GS-13: a damaged Undo step is skipped with a notice')
c = boot('{'); ok(c.error === null && c.state().deck.length === 18 && c.nodes.notice.textContent.includes('damaged'), 'GS-13: malformed JSON starts a new deck with a notice')
c = boot(null, true); c.nodes.draw.onclick(); ok(c.error === null && c.nodes.notice.textContent.includes('Not saved'), 'GS-13: a failed save is shown')

// round tracker
c = boot(); c.nodes.tround.value = '5'; c.nodes.tround.onchange(); ok(c.nodes.thint.textContent.includes('MO last chance') && c.state().track.round === 5, 'tracker: round 5 with the MO unmet shows the last-chance step')
c.nodes.tmo.checked = true; c.nodes.tmo.onchange(); ok(!c.nodes.thint.textContent.includes('MO last chance'), 'tracker: MO met hides the MO steps')
c = boot(JSON.stringify(Object.assign(JSON.parse(before), { track: { turn: 'x', round: 99 } }))); ok(c.error === null && c.state().track.round === 1 && c.state().discard.length === 18, 'tracker: bad tracker values fall back to defaults without losing the deck')

// C05: inherited-property commitment names are rejected (control: an ordinary bad string)
for (const lvl of ['constructor', '__proto__', 'toString', 'nonsense']) {
  const bad = Object.assign(JSON.parse(before), { lvl })
  const c5 = boot(JSON.stringify(bad))
  ok(c5.error === null && c5.state().lvl === 'mobilization' && c5.nodes.notice.textContent.includes('damaged') && !c5.nodes.card.innerHTML.includes('undefined'), `C05: commitment "${lvl}" is rejected with a notice`)
}
// Next round / Next turn, with Undo
c = boot(); c.nodes.tmo.checked = true; c.nodes.tmo.onchange(); c.nodes.trp.checked = true; c.nodes.trp.onchange()
for (let i = 0; i < 7; i++) c.nodes.nextround.onclick()
ok(c.state().track.round === 6, 'Next round stops at round 6')
c.nodes.nextturn.onclick(); let t = c.state().track
ok(t.turn === 2 && t.round === 1 && !t.mo && !t.rp, 'Next turn: turn 2, round 1, MO and RP boxes cleared')
c.nodes.undo.onclick(); t = c.state().track
ok(t.turn === 1 && t.round === 6 && t.mo && t.rp, 'Undo restores the tracker from before Next turn')
c.nodes.draw.onclick(); c.nodes.nextround.onclick(); c.nodes.undo.onclick(); ok(c.state().cur !== null && c.state().track.round === 6, 'Undo of Next round keeps the drawn card')
// export / import
c = boot(); for (let i = 0; i < 5; i++) c.nodes.draw.onclick(); c.nodes.export.onclick()
const text = c.nodes.iotext.value, exported = c.state()
let d2 = boot(); d2.nodes.iotext.value = text; d2.nodes.import.onclick()
ok(JSON.stringify(d2.state().discard) === JSON.stringify(exported.discard) && d2.state().cur === exported.cur && d2.nodes.ioinfo.textContent.startsWith('Imported'), 'export then import moves the deck, current card and tracker')
d2.nodes.undo.onclick(); ok(d2.state().discard.length === 0, 'Undo after Import returns to the previous deck')
const d3 = boot(); const pre = JSON.stringify(d3.state()); d3.nodes.iotext.value = text.replace('"discard":[', '"discard":[1,1,'); d3.nodes.import.onclick()
ok(JSON.stringify(d3.state()) === pre && d3.nodes.ioinfo.textContent.includes('rejected'), 'a damaged import is rejected and changes nothing')
d3.nodes.iotext.value = '{not json'; d3.nodes.import.onclick(); ok(d3.nodes.ioinfo.textContent.includes('rejected'), 'malformed import text is rejected')

// search
c = boot(); c.nodes.evq.value = '55'; c.nodes.evq.oninput(); ok(c.nodes.evlist.innerHTML.includes('Lloyd George'), 'card-number search')
c.nodes.side.onchange({ target: { value: 'ap' } }); ok(c.nodes.evlist.innerHTML.includes('Over There'), 'side switch changes the event list')

for (const p of pass) console.log('ok  ', p)
console.log(`PASS ${pass.length} checks`)
