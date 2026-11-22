// Builds the printable Staff cards and reference sheets (HTML -> PDF via headless Chrome).
// usage: node print/build.js   (run from the repository root, after sim/setup_engine.sh)
"use strict"
const fs = require('fs'), path = require('path'), cp = require('child_process')
const root = path.resolve(__dirname, '..')
const { makeDeck, FRONT_TABLE, STANCE_MIN_EDGE } = require(path.join(root, 'sim/bot.js'))
const B = require(path.join(root, 'sim/board.js'))
const POLICY = require(path.join(root, 'research/event_policy.json'))
const EP = require(path.join(root, 'sim/events.js'))
const out = path.join(root, 'print/out'); fs.mkdirSync(out, { recursive: true })
const VERSION = process.env.GS_VERSION || '0.4'

const STANCE = { A: ['Assault', 'CP 0 · Allies +1'], P: ['Press', 'CP +0.75 · Allies +1.75'], H: ['Hold', 'CP +1.5 · Allies +2.5'] }
const PLAN = { O: ['Ops', 'Attack · Event · Logistics'], E: ['Event', 'Event · Attack · Logistics'], L: ['Logistics', 'Logistics · Attack · Event'] }
const FRONTNAME = { WEST: 'West', EAST: 'East', ITALY: 'Italy', BALKANS: 'Balkans', NEAREAST: 'Near East' }
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

const css = `
@page { size: letter; margin: 0.4in; }
body { font-family: 'DejaVu Sans', Arial, sans-serif; color: #1d1d1b; margin: 0; }
.sheet { display: grid; grid-template-columns: repeat(3, 2.5in); grid-auto-rows: 3.5in; gap: 0.08in; justify-content: center; page-break-after: always; }
.card { box-sizing: border-box; border: 1.5px solid #555; border-radius: 0.12in; padding: 0.12in; display: flex; flex-direction: column; background: #f6f1e4; position: relative; overflow: hidden; }
.card .hdr { font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase; color: #6b5a3a; display: flex; justify-content: space-between; border-bottom: 1px solid #b9a77f; padding-bottom: 3px; }
.num { margin: 0.12in auto 0.04in; width: 0.95in; height: 0.95in; border-radius: 50%; border: 3px solid #1d1d1b; display: flex; align-items: center; justify-content: center; font-size: 44pt; font-weight: bold; background: #fffdf6; }
.flabel { text-align: center; font-size: 7pt; color: #6b5a3a; text-transform: uppercase; letter-spacing: 0.1em; }
.row { margin-top: 0.08in; border-radius: 0.06in; padding: 0.05in 0.08in; }
.row .k { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; }
.row .v { font-size: 15pt; font-weight: bold; }
.row .s { font-size: 7.5pt; }
.st-A { background: #8c2d1e; color: #fff; } .st-P { background: #c47f17; color: #fff; } .st-H { background: #2f5d7c; color: #fff; }
.pl { background: #e4dcc6; }
.tie { margin-top: auto; text-align: center; font-size: 10pt; font-weight: bold; }
.cardno { position: absolute; bottom: 0.06in; right: 0.1in; font-size: 7pt; color: #6b5a3a; }
.back { background: repeating-linear-gradient(45deg, #3b3a36, #3b3a36 6px, #45443f 6px, #45443f 12px); color: #f6f1e4; align-items: center; justify-content: center; text-align: center; }
.back .t { font-size: 20pt; font-weight: bold; letter-spacing: 0.08em; } .back .u { font-size: 8pt; margin-top: 6px; }
h1 { font-size: 16pt; margin: 0 0 4px; } h2 { font-size: 11.5pt; margin: 10px 0 4px; border-bottom: 1.5px solid #333; } h3 { font-size: 10pt; margin: 8px 0 3px; }
table { border-collapse: collapse; width: 100%; font-size: 8pt; margin: 3px 0 6px; }
th, td { border: 1px solid #999; padding: 2px 4px; vertical-align: top; text-align: left; }
th { background: #e8e2d0; }
.ref { font-size: 8.5pt; line-height: 1.3; }
.two { columns: 2; column-gap: 0.25in; }
.small { font-size: 7.5pt; } .pb { page-break-before: always; }
ol, ul { margin: 2px 0 4px 16px; padding: 0; } li { margin: 1px 0; }
`

// ---------- Staff cards ----------
function cardHtml(c) {
  return `<div class="card">
  <div class="hdr"><span>General Staff</span><span>Staff card</span></div>
  <div class="num">${c.n}</div><div class="flabel">Front number</div>
  <div class="row st-${c.stance}"><div class="k">Stance</div><div class="v">${STANCE[c.stance][0]}</div><div class="s">Attack if Score &ge; ${STANCE[c.stance][1]}</div></div>
  <div class="row pl"><div class="k">Plan</div><div class="v">${PLAN[c.plan][0]}</div><div class="s">${PLAN[c.plan][1]}</div></div>
  <div class="tie">Tie: ${c.tie === 'N' ? '&#9650; North' : '&#9660; South'}</div>
  <div class="cardno">${c.id}/18 · v${VERSION}</div></div>`
}
const deck = makeDeck()
let cardsHtml = `<!doctype html><meta charset="utf-8"><style>${css}</style>`
for (let i = 0; i < deck.length; i += 9) cardsHtml += `<div class="sheet">${deck.slice(i, i + 9).map(cardHtml).join('')}</div>`
cardsHtml += `<div class="sheet">${Array(9).fill('<div class="card back"><div class="t">GENERAL<br>STAFF</div><div class="u">Paths of Glory solo bot</div></div>').join('')}</div>`
fs.writeFileSync(path.join(out, 'staff_cards.html'), cardsHtml)

// ---------- Reference sheets ----------
function frontTable(side) {
  const t = FRONT_TABLE[side]
  let h = `<table><tr><th>Staff number</th>${[1, 2, 3, 4, 5, 6].map(n => `<th>${n}</th>`).join('')}</tr>`
  for (const lvl of ['mobilization', 'limited', 'total']) h += `<tr><th>${lvl[0].toUpperCase() + lvl.slice(1)}${lvl === 'mobilization' ? '' : ' War'}</th>${t[lvl].map(f => `<td>${FRONTNAME[f]}</td>`).join('')}</tr>`
  return h + '</table>'
}
function objTable(side) {
  let h = '<table><tr><th>Front</th><th>Objective list (first space the bot does not control)</th></tr>'
  for (const f of B.FRONTS) h += `<tr><th>${FRONTNAME[f]}</th><td>${B.OBJ[side][f].map(i => esc(B.data.spaces[i].name)).join(' &rarr; ')}</td></tr>`
  return h + '</table>'
}
function edgeTables() {
  const R = require(path.join(root, 'engine/rules.js'))
  const a = B.expectedTable(R.__api.fire_table.army), c = B.expectedTable(R.__api.fire_table.corps)
  const an = ['1', '2', '3', '4', '5', '6&ndash;8', '9&ndash;11', '12&ndash;14', '15', '16+'], cn = ['0', '1', '2', '3', '4', '5', '6', '7', '8+']
  return `<table><tr><th>Army column</th>${an.map(x => `<th>${x}</th>`).join('')}</tr><tr><th>Expected hits</th>${a.map(x => `<td>${x.toFixed(1)}</td>`).join('')}</tr></table>
  <table><tr><th>Corps column</th>${cn.map(x => `<th>${x}</th>`).join('')}</tr><tr><th>Expected hits</th>${c.map(x => `<td>${x.toFixed(1)}</td>`).join('')}</tr></table>`
}
function eventTable(side) {
  const rows = POLICY.filter(e => e.side === side).sort((x, y) => x.num - y.num)
  let h = '<table><tr><th>#</th><th>Card</th><th>Pri</th><th>Notes</th></tr>'
  for (const e of rows) {
    const pr = EP.printedPriority(e.global)
    let note = EP.NOTE[e.global] || ''
    const d = B.data.cards[e.global]
    if (pr === 'CC') note = 'Combat card: held for combat.' + (d.ops ? '' : '')
    else if (d.reinfnation && +pr <= 5) note = (note ? note + ' ' : '') + '3 if an army reinforcement card of the same nation (priority 7+) is in hand.'
    h += `<tr><td>${e.num}</td><td>${esc(e.name)}</td><td>${pr}</td><td>${esc(note)}</td></tr>`
  }
  return h + '</table>'
}
const procedure = fs.readFileSync(path.join(root, 'print/summary.html'), 'utf8')
let ref = `<!doctype html><meta charset="utf-8"><style>${css}</style><div class="ref">
<h1>General Staff v${VERSION} &mdash; Reference</h1>${procedure}
<div class="pb"></div><h1>Fronts, Objectives and Edge</h1>
<h2>Front Table &mdash; Central Powers bot</h2>${frontTable('cp')}
<h2>Front Table &mdash; Allied bot</h2>${frontTable('ap')}
<p class="small">After the Staff card's front, check the others in this order: West, East, Italy, Balkans, Near East.</p>
<h2>Edge table</h2>${edgeTables()}
<p class="small">Use the columns after all shifts. Edge = bot's expected hits &minus; defender's expected hits. Score = Edge + bonuses (Objective +1; within 2 of the Objective +0.4; VP space +0.5; a defender out of supply +0.5; MO attack +1 / +2.5 / +6 in rounds 1&ndash;2 / 3&ndash;4 / 5&ndash;6; &minus;0.25 for each place the target's front is after the first in front order). Attack if Score &ge; Stance: Central Powers bot Assault 0, Press +0.75, Hold +1.5; Allied bot Assault +1, Press +1.75, Hold +2.5. From round 5 an MO attack is made at any Score.</p>
<h2>Objectives &mdash; Central Powers bot</h2>${objTable('cp')}
<h2>Objectives &mdash; Allied bot</h2>${objTable('ap')}
<div class="pb"></div><h1>Event priorities &mdash; Central Powers cards</h1>${eventTable('cp')}
<div class="pb"></div><h1>Event priorities &mdash; Allied cards</h1>${eventTable('ap')}
<p class="small">Play an event only when the rules allow it. Pri 8&ndash;9 urgent; 5&ndash;7 when the Plan reaches Event; 3&ndash;4 fallback only; 0 never; CC = combat card, held for combat. Cards of priority 7+ are never used for RP or SR.</p>
</div>`
fs.writeFileSync(path.join(out, 'reference.html'), ref)

function pdf(name) {
  const src = path.join(out, name + '.html'), dst = path.join(out, name + '.pdf')
  cp.execFileSync('google-chrome', ['--headless', '--no-sandbox', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${dst}`, 'file://' + src], { stdio: 'ignore' })
  return dst
}
if (!process.env.NO_PDF) { pdf('staff_cards'); pdf('reference') }
console.log('built', out)
