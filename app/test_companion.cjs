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

// A01 (v0.8.1 audit): Undo of an Import restores the whole recipient session, and its own Undo history
{
  const exportOf = b => { b.nodes.export.onclick(); return b.nodes.iotext.value }
  // recipient: CP, Mobilization, two draws; donor: Allies, Total War, four draws
  const r = boot(); r.nodes.side.onchange({ target: { value: 'cp' } }); r.nodes.lvl.onchange({ target: { value: 'mobilization' } })
  r.nodes.draw.onclick(); const r1 = JSON.stringify(r.state()); r.nodes.draw.onclick(); r.nodes.nextround.onclick(); const r2 = JSON.stringify(r.state())
  const dn = boot(); dn.nodes.side.onchange({ target: { value: 'ap' } }); dn.nodes.lvl.onchange({ target: { value: 'total' } })
  for (let i = 0; i < 4; i++) dn.nodes.draw.onclick()
  const dt = exportOf(dn)
  r.nodes.iotext.value = dt; r.nodes.import.onclick()
  ok(r.state().side === 'ap' && r.state().lvl === 'total' && r.state().hist.length === 1, 'A01: Import takes the donor side and commitment, with one Undo step back')
  r.nodes.undo.onclick()
  ok(JSON.stringify(r.state()) === r2 && r.nodes.side.value === 'cp' && r.nodes.lvl.value === 'mobilization', 'A01: one Undo restores the recipient exactly: deck, card, tracker, side, commitment and history')
  r.nodes.undo.onclick(); r.nodes.undo.onclick()
  ok(JSON.stringify(r.state()) === r1, "A01: further Undos walk the recipient's own history, not the donor's")
  // the restored card is shown with the recipient's (CP) threshold, not the donor's (Allied) one
  const st = r.run('cardById(S.cur).stance'), cpT = r.run(`D.stance['${st}'] + SHIFT.cp`), apT = r.run(`D.stance['${st}'] + SHIFT.ap`)
  ok(r.nodes.card.innerHTML.includes('Score ≥ +' + cpT) && !r.nodes.card.innerHTML.includes('Score ≥ +' + apT + '<'), `A01: after Undo the card shows the CP threshold (+${cpT}, not the Allied +${apT})`)
  // reload after an import, then Undo
  const q = boot(); q.nodes.draw.onclick(); const q1 = JSON.stringify(q.state()); q.nodes.iotext.value = dt; q.nodes.import.onclick()
  const saved = q.store.get(KEY), q2 = boot(saved)
  ok(q2.error === null && q2.state().side === 'ap' && q2.state().hist.length === 1, 'A01: an imported session with its Undo step survives a reload')
  q2.nodes.undo.onclick(); ok(JSON.stringify(q2.state()) === q1, 'A01: Undo after reload still restores the pre-import session')
  // two imports in a row: two Undos return to the original
  const w = boot(); w.nodes.draw.onclick(); const w0 = JSON.stringify(w.state())
  w.nodes.iotext.value = dt; w.nodes.import.onclick(); const w1 = JSON.stringify(w.state())
  w.nodes.iotext.value = text; w.nodes.import.onclick()
  w.nodes.undo.onclick(); ok(JSON.stringify(w.state()) === w1, 'A01: after a second Import, Undo returns to the first imported session')
  w.nodes.undo.onclick(); ok(JSON.stringify(w.state()) === w0, 'A01: a second Undo returns to the original session')
  // an import step that is damaged is skipped like any other damaged step, and a damaged nested session is rejected on import
  const z = boot(); z.nodes.draw.onclick(); z.nodes.draw.onclick(); z.run(`S.hist.push(JSON.stringify({ kind: 'import', session: { side: 'cp', lvl: 'nope', deck: [], discard: [], hist: [] } }))`)
  z.nodes.undo.onclick(); ok(z.state().discard.length === 1 && z.nodes.notice.textContent.includes('damaged Undo step'), 'A01: a damaged import step is skipped with a notice')
  const bad = JSON.parse(exportOf(w)); bad.hist = [JSON.stringify({ kind: 'import', session: { side: 'xx' } })]
  const y = boot(); const yPre = JSON.stringify(y.state()); y.nodes.iotext.value = JSON.stringify(bad); y.nodes.import.onclick()
  ok(JSON.stringify(y.state()) === yPre && y.nodes.ioinfo.textContent.includes('rejected'), 'A01: an import whose history holds a damaged import step is rejected')
  // an older saved session (ordinary steps only) still loads and undoes
  const old = JSON.parse(r1); const o = boot(JSON.stringify(Object.assign({ v: 1 }, old))); o.nodes.draw.onclick(); o.nodes.undo.onclick()
  ok(JSON.stringify(o.state()) === r1, 'A01: an older saved session with ordinary steps still loads and undoes')
}

// v0.8.1 audit usability: Next round + draw (one Undo), a typed turn change clears the per-turn boxes, Clear attack
{
  const u = boot(); u.nodes.draw.onclick(); const u0 = JSON.stringify(u.state())
  u.nodes.nextdraw.onclick(); const s1 = u.state()
  ok(s1.track.round === 2 && s1.discard.length === 2 && s1.cur !== JSON.parse(u0).cur, 'Next round + draw advances the round and draws')
  u.nodes.undo.onclick(); ok(JSON.stringify(u.state()) === u0, 'one Undo undoes Next round + draw')
  for (const k of ['tmo', 'trp']) { u.nodes[k].checked = true; u.nodes[k].onchange() }
  u.nodes.tround.value = '4'; u.nodes.tround.onchange(); ok(u.state().track.mo && u.state().track.rp, 'changing the round keeps the MO and RP boxes')
  u.nodes.tturn.value = '3'; u.nodes.tturn.onchange(); ok(u.state().track.turn === 3 && !u.state().track.mo && !u.state().track.rp && u.state().track.round === 4, 'typing a different turn clears the MO and RP boxes (round kept)')
  for (const [k, v] of Object.entries({ acf: 3, dcf: 9, fort: 2, terr: 1, tr: 2, bmo: 6 })) { u.nodes[k].value = String(v) }
  for (const k of ['bobj', 'bvp', 'boos']) u.nodes[k].checked = true; u.nodes.dunits.checked = false; u.nodes.acf.oninput()
  const dirty = u.nodes.edge.innerHTML; u.nodes.clearatk.onclick()
  ok(u.nodes.acf.value === '8' && u.nodes.dcf.value === '4' && u.nodes.bmo.value === '0' && !u.nodes.bobj.checked && u.nodes.dunits.checked && u.nodes.edge.innerHTML !== dirty, 'Clear attack restores every calculator input')
}

// v0.8.2 verification B01: Next round + draw stops at round 6
{
  const u = boot(); u.nodes.draw.onclick()
  for (let i = 0; i < 4; i++) u.nodes.nextdraw.onclick()
  const r5 = JSON.stringify(u.state()); ok(u.state().track.round === 5 && !u.nodes.nextdraw.disabled, 'B01: rounds 1-5 drawn, the button is still on')
  u.nodes.nextdraw.onclick(); const r6 = JSON.stringify(u.state())
  ok(u.state().track.round === 6 && u.state().discard.length === 6 && u.nodes.nextdraw.disabled, 'B01: round 6 drawn, then the button is off')
  u.nodes.nextdraw.onclick(); ok(JSON.stringify(u.state()) === r6, 'B01: pressed at round 6 it draws nothing and takes no Undo step')
  const re = boot(u.store.get(KEY)); ok(re.nodes.nextdraw.disabled && JSON.stringify(re.state()) === r6, 'B01: still off after a reload at round 6')
  u.nodes.undo.onclick(); ok(JSON.stringify(u.state()) === r5 && !u.nodes.nextdraw.disabled, 'B01: Undo from round 6 returns to round 5 and turns it back on')
  u.nodes.nextdraw.onclick(); u.nodes.nextturn.onclick(); ok(u.state().track.round === 1 && !u.nodes.nextdraw.disabled, 'B01: Next turn turns it back on')
}

// v0.8.2 verification B02: repeated Imports add about one session each, and the checkpoints are bounded
{
  const dn = boot(); dn.nodes.draw.onclick(); dn.nodes.export.onclick(); const donor = dn.nodes.iotext.value
  const w = boot(); w.nodes.draw.onclick(); const w0 = JSON.stringify(w.state())
  const sizes = [], states = [w0]
  for (let i = 0; i < 20; i++) { w.nodes.iotext.value = donor; w.nodes.import.onclick(); sizes.push(w.store.get(KEY).length); states.push(JSON.stringify(w.state())) }
  const steps = sizes.slice(1).map((v, i) => v - sizes[i])
  ok(sizes[9] < 6000 && Math.max(...steps.slice(0, 9)) - Math.min(...steps.slice(0, 9)) < 50, `B02: ten Imports grow the save about evenly (${sizes[0]} to ${sizes[9]} characters)`)
  ok(sizes[19] === sizes[10] && sizes[19] < 6000, `B02: from the ${11}th Import on the save stops growing (${sizes[19]} characters): at most 10 checkpoints are kept`)
  // Undo walks back through the 10 kept Imports, then stops on the oldest kept session
  for (let i = 0; i < 10; i++) w.nodes.undo.onclick()
  ok(JSON.stringify(Object.assign(w.state(), { hist: [] })) === JSON.stringify(Object.assign(JSON.parse(states[10]), { hist: [] })) && w.state().hist.length === 0, 'B02: ten Undos return through the ten kept Imports')
  // two Imports, reload, two Undos
  const v = boot(); v.nodes.draw.onclick(); const v0 = JSON.stringify(v.state())
  v.nodes.iotext.value = donor; v.nodes.import.onclick(); const v1 = JSON.stringify(v.state()); v.nodes.iotext.value = text; v.nodes.import.onclick()
  const v2 = boot(v.store.get(KEY)); v2.nodes.undo.onclick(); ok(JSON.stringify(v2.state()) === v1, 'B02: after a reload, Undo returns to the first imported session')
  v2.nodes.undo.onclick(); ok(JSON.stringify(v2.state()) === v0, 'B02: and a second Undo to the original session')
  // a checkpoint in the v0.8.2 format (steps inside as strings) still loads, undoes, and is normalised by the next Import
  const inner = JSON.parse(v0), legacy = JSON.parse(v0) // v0.8.2 saved a checkpoint's own steps as strings, as inner.hist is here
  legacy.hist = [JSON.stringify({ kind: 'import', session: inner })]
  const lg = boot(JSON.stringify(Object.assign({ v: 1 }, legacy))); ok(lg.error === null && lg.state().hist.length === 1 && !lg.nodes.notice.textContent.includes('damaged'), 'B02: a v0.8.2 checkpoint loads')
  lg.nodes.iotext.value = donor; lg.nodes.import.onclick(); const nested = JSON.parse(lg.state().hist[0]).session.hist
  ok(nested.every(h => typeof h === 'object'), 'B02: the next Import stores the old steps as objects')
  lg.nodes.undo.onclick(); lg.nodes.undo.onclick(); ok(JSON.stringify(lg.state()) === JSON.stringify(inner), 'B02: Undo still walks through the v0.8.2 checkpoint to the session inside it')
  // a hand-made session with object steps at the top level is rejected
  const bad = JSON.parse(v0); bad.hist = [{ deck: bad.deck, discard: bad.discard, cur: bad.cur }]
  const y = boot(); const yPre = JSON.stringify(y.state()); y.nodes.iotext.value = JSON.stringify(bad); y.nodes.import.onclick(); ok(JSON.stringify(y.state()) === yPre, "B02: a session's own steps must be strings")
}

// search
c = boot(); c.nodes.evq.value = '55'; c.nodes.evq.oninput(); ok(c.nodes.evlist.innerHTML.includes('Lloyd George'), 'card-number search')
c.nodes.side.onchange({ target: { value: 'ap' } }); ok(c.nodes.evlist.innerHTML.includes('Over There'), 'side switch changes the event list')

for (const p of pass) console.log('ok  ', p)
console.log(`PASS ${pass.length} checks`)
