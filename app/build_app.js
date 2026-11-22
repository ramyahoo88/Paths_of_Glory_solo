// Builds the offline "General Staff Companion" (single HTML file) from the bot's tables.
// usage: node app/build_app.js   (from the repository root, after sim/setup_engine.sh)
"use strict"
const fs = require('fs'), path = require('path')
const root = path.resolve(__dirname, '..')
const { makeDeck, FRONT_TABLE, STANCE_MIN_EDGE } = require(path.join(root, 'sim/bot.js'))
const B = require(path.join(root, 'sim/board.js'))
const R = require(path.join(root, 'engine/rules.js'))
const POLICY = require(path.join(root, 'research/event_policy.json'))
const EP = require(path.join(root, 'sim/events.js'))
const VERSION = process.env.GS_VERSION || '0.7.5'

const FN = { WEST: 'West', EAST: 'East', ITALY: 'Italy', BALKANS: 'Balkans', NEAREAST: 'Near East' }
const objectives = {}
for (const side of ['cp', 'ap']) { objectives[side] = {}; for (const f of B.FRONTS) objectives[side][FN[f]] = B.OBJ[side][f].map(i => B.data.spaces[i].name) }
const frontTable = {}
for (const side of ['cp', 'ap']) { frontTable[side] = {}; for (const lvl in FRONT_TABLE[side]) frontTable[side][lvl] = FRONT_TABLE[side][lvl].map(f => FN[f]) }
const events = {}
for (const side of ['cp', 'ap']) events[side] = POLICY.filter(e => e.side === side).sort((a, b) => a.num - b.num).map(e => {
  const pri = EP.printedPriority(e.global), d = B.data.cards[e.global]
  let when = EP.NOTE[e.global] || ''
  if (pri === 'CC') when = 'Combat card: never an action-round event; counts as priority 0 for OPS/SR/RP; played in combat if still held.'
  else if (d.reinfnation && +pri <= 5) when = (when ? when + ' ' : '') + '3 if an army reinforcement card of the same nation (priority 7+) is in hand.'
  return { n: e.num, name: e.name, pri: pri === 'CC' ? 'CC ' + e.event_priority : pri, when, keep: EP.KEEP.has(e.global) }
})
const DATA = {
  version: VERSION, deck: makeDeck(), frontTable, objectives, events, stance: STANCE_MIN_EDGE,
  army: B.printedExpectedTable(R.__api.fire_table.army), corps: B.printedExpectedTable(R.__api.fire_table.corps),
  armyCols: R.__api.fire_table.army.map(c => c.factors), corpsCols: R.__api.fire_table.corps.map(c => c.factors),
}

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>General Staff Companion v${VERSION}</title>
<style>
:root { --ink:#1f1d19; --paper:#f4efe2; --card:#fffaf0; --line:#cbbd98; --muted:#6d6047; --A:#8c2d1e; --P:#b8741a; --H:#2f5d7c; --ok:#2e6b3a; --no:#8c2d1e; }
* { box-sizing: border-box; }
body { margin:0; font-family: Georgia, 'Times New Roman', serif; background: var(--paper); color: var(--ink); }
header { background:#2b2a26; color:#f4efe2; padding:10px 14px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
header h1 { font-size:18px; margin:0; letter-spacing:.06em; font-variant: small-caps; }
header .sp { flex:1 }
select, input, button { font: inherit; font-size:15px; }
button { background:#3b3a36; color:#f4efe2; border:0; border-radius:8px; padding:8px 12px; cursor:pointer; }
button.primary { background: var(--A); font-weight:bold; }
button:disabled, input:disabled, select:disabled { opacity:.4 }
main { max-width: 980px; margin: 0 auto; padding: 12px; display:grid; gap:12px; grid-template-columns: 1fr; }
@media (min-width: 860px) { main { grid-template-columns: 360px 1fr; } }
section { background: var(--card); border:1px solid var(--line); border-radius:12px; padding:12px; }
h2 { font-size:15px; margin:0 0 8px; text-transform:uppercase; letter-spacing:.08em; color: var(--muted); }
.staff { border-radius:14px; border:2px solid var(--ink); padding:12px; text-align:center; background:#f9f3e3; }
.staff .num { font-size:54px; font-weight:bold; line-height:1; }
.staff .front { font-size:22px; font-weight:bold; margin:4px 0 8px; }
.pill { display:inline-block; border-radius:8px; padding:6px 10px; color:#fff; font-weight:bold; margin:3px; }
.st-A { background: var(--A) } .st-P { background: var(--P) } .st-H { background: var(--H) }
.plan { background:#e4dcc6; color: var(--ink); }
.muted { color: var(--muted); font-size: 13px; }
ol { margin: 4px 0 0 20px; padding:0 } li { margin: 3px 0 }
.row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin:4px 0; }
.row label { min-width: 110px; }
.row input[type=number] { width: 70px; }
.res { font-size: 18px; font-weight: bold; margin-top:8px; }
.ok { color: var(--ok) } .no { color: var(--no) }
table { border-collapse: collapse; width:100%; font-size:13px; }
td, th { border-bottom:1px solid #e2d7bb; padding:4px; text-align:left; vertical-align: top; }
.tabs button { background:#e4dcc6; color: var(--ink); } .tabs button.on { background: var(--ink); color: #fff; }
.hidden { display:none }
</style></head><body>
<header><h1>General Staff Companion</h1><span class="muted" style="color:#cbbd98">v${VERSION} · Paths of Glory solo bot</span><span class="sp"></span>
<label>Bot side <select id="side"><option value="cp">Central Powers</option><option value="ap">Allies</option></select></label>
<label>Bot commitment <select id="lvl"><option value="mobilization">Mobilization</option><option value="limited">Limited War</option><option value="total">Total War</option></select></label>
</header>
<main>
<div style="display:grid; gap:12px; align-content:start">
<section><h2>Staff card</h2>
<div id="card" class="staff"><div class="muted">Draw a card at the start of each bot action round.</div></div>
<div class="row" style="margin-top:10px"><button class="primary" id="draw">Draw Staff card</button><button id="undo">Undo</button><button id="newdeck" title="Shuffle all 18 cards into a new deck (Undo can restore the old one)">New deck</button><span class="muted" id="deckinfo"></span></div>
<div id="notice" class="no" style="margin-top:6px"></div>
</section>
<section><h2>Action round</h2>
<div class="row"><label>Turn <input type="number" id="tturn" value="1" min="1" max="20"></label><label>Round <input type="number" id="tround" value="1" min="1" max="7"></label><label><input type="checkbox" id="tmo"> MO met this turn</label><label><input type="checkbox" id="trp"> RP card played this turn</label></div>
<div id="thint" class="muted" style="margin:4px 0 6px"></div>
<ol>
<li><b>Forced play</b> (Guns of August).</li>
<li><b>MO last chance</b>: rounds 5–6, MO unmet, MO attack exists.</li>
<li><b>Urgent event</b>: priority 7–9, legal now.</li>
<li><b>MO</b>: round 3+, MO attack in the Attack Search.</li>
<li><b>Crisis</b>: crisis space and the planned Operation includes a Fill (card: cheapest for the first move).</li>
<li><b>Rebuild</b> (Allies only): missing steps − RP held ≥ 6, no RP card yet this turn.</li>
<li><b>Plan</b> (see card).</li>
<li><b>Fallback</b>: event 3–4 → moves-only Ops → low-trigger RP/SR → 1-OP Automatic Operation.</li>
</ol></section>
</div>
<div style="display:grid; gap:12px; align-content:start">
<section><h2>Edge calculator</h2>
<div class="row"><label>Bot CF</label><input type="number" id="acf" value="8" min="0"><label><input type="checkbox" id="aarmy" checked> army attacking</label></div>
<div class="row"><label>Defender CF</label><input type="number" id="dcf" value="4" min="0"><label><input type="checkbox" id="darmy" checked> army defending</label><label>fort <input type="number" id="fort" value="0" min="0" max="3"></label><label><input type="checkbox" id="dunits" checked> units in the space (untick for an empty fort)</label></div>
<div class="row"><label>Terrain</label><select id="terr"><option value="0">clear/forest/desert</option><option value="1">mountain or swamp</option></select><label>Trench <select id="tr"><option>0</option><option>1</option><option>2</option></select></label></div>
<div class="row"><label>Bonuses</label>
<label><input type="checkbox" id="bobj"> Objective (+1)</label><label><input type="checkbox" id="bnear"> else within 2 of it (+0.4)</label><label><input type="checkbox" id="bvp"> VP (+0.5)</label><label><input type="checkbox" id="boos"> defender OOS (+0.5)</label></div>
<div class="row"><label title="Tick only when the units chosen for this attack would satisfy the bot's unmet MO">Attack meets an unmet MO</label><select id="bmo"><option value="0">no</option><option value="1">yes, rounds 1–2 (+1)</option><option value="2.5">yes, rounds 3–4 (+2.5)</option><option value="6">yes, rounds 5–6 (+6, mandatory)</option></select><label>Front position <select id="bfront"><option value="0">1st</option><option value="-0.25">2nd</option><option value="-0.5">3rd</option><option value="-0.75">4th</option><option value="-1">5th</option></select></label></div>
<div id="edge" class="res"></div></section>
<section><div class="row tabs"><button data-t="obj" class="on">Objectives</button><button data-t="front">Front Table</button><button data-t="ev">Event priorities</button></div>
<div id="t-obj"></div><div id="t-front" class="hidden"></div><div id="t-ev" class="hidden"><div class="row"><input id="evq" placeholder="card number or name" style="flex:1"></div><div id="evlist"></div></div>
</section>
</div>
</main>
<script>
const D = ${JSON.stringify(DATA)};
const S = { side: 'cp', lvl: 'mobilization', deck: [], discard: [], hist: [], cur: null, track: { turn: 1, round: 1, mo: false, rp: false } };
const $ = id => document.getElementById(id);
const FORMAT = 1, KEY = 'gs-companion';
let notices = [];
function note(msg) { if (!notices.includes(msg)) notices.push(msg); const n = $('notice'); if (n) n.textContent = notices.join(' ') }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(Object.assign({ v: FORMAT }, S))) }
  catch (e) { note('Not saved: this browser is not keeping the session (storage blocked or full). Draws will be lost if the page reloads.') }
}
// A deck state is valid when deck + discard hold each of the 18 cards exactly once and the current card (if any) is in the discard pile.
function validDeck(x) {
  if (!x || !Array.isArray(x.deck) || !Array.isArray(x.discard)) return false;
  const all = x.deck.concat(x.discard);
  if (all.length !== D.deck.length || !all.every(n => Number.isInteger(n) && cardById(n))) return false;
  if (new Set(all).size !== D.deck.length) return false;
  return x.cur === null || x.cur === undefined || x.discard.includes(x.cur);
}
// the round tracker is a convenience: bad values fall back to defaults instead of rejecting the session
function cleanTrack(t) {
  const n = (v, lo, hi, d) => Number.isInteger(v) && v >= lo && v <= hi ? v : d;
  t = t && typeof t === 'object' ? t : {};
  return { turn: n(t.turn, 1, 20, 1), round: n(t.round, 1, 7, 1), mo: t.mo === true, rp: t.rp === true };
}
function renderTrack() {
  const t = S.track; $('tturn').value = t.turn; $('tround').value = t.round; $('tmo').checked = t.mo; $('trp').checked = t.rp;
  const h = [];
  if (t.turn === 1 && t.round === 1 && S.side === 'cp') h.push('Turn 1 round 1: Guns of August is a forced play if held.');
  if (!t.mo && t.round >= 5) h.push('MO unmet in round ' + t.round + ': step 2 (MO last chance) applies; the first attack that meets the MO is made whatever its Score.');
  else if (!t.mo && t.round >= 3) h.push('MO unmet: step 4 (MO) applies from round 3.');
  if (S.side === 'ap') h.push(t.rp ? 'Rebuild: not this turn (an RP card was already played).' : 'Rebuild: check missing steps − RP held ≥ 6.');
  $('thint').textContent = h.join(' ');
}
function validSession(x) {
  if (!x || typeof x !== 'object' || !['cp', 'ap'].includes(x.side) || !D.frontTable.cp[x.lvl]) return false;
  if (!validDeck(x) || !Array.isArray(x.hist)) return false;
  return x.hist.every(h => { try { return typeof h === 'string' && validDeck(JSON.parse(h)) } catch (e) { return false } });
}
function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY) } catch (e) { note('This browser is not allowing saved sessions; the deck will not survive a reload.'); return }
  if (!raw) return;
  let x = null; try { x = JSON.parse(raw) } catch (e) {}
  if (validSession(x)) { S.side = x.side; S.lvl = x.lvl; S.deck = x.deck; S.discard = x.discard; S.hist = x.hist; S.cur = x.cur ?? null; S.track = cleanTrack(x.track); return }
  try { localStorage.setItem(KEY + '-rejected', raw) } catch (e) {}
  note('The saved session was damaged, so a new deck was started. The old data was kept in browser storage under "' + KEY + '-rejected".');
}
function shuffle(a) { const c = (window.crypto && crypto.getRandomValues) ? (n => { const u = new Uint32Array(1); crypto.getRandomValues(u); return u[0] % n }) : (n => Math.floor(Math.random() * n)); for (let i = a.length - 1; i > 0; i--) { const j = c(i + 1); [a[i], a[j]] = [a[j], a[i]] } return a }
function reset() { S.deck = shuffle(D.deck.map(c => c.id)); S.discard = []; S.hist = []; S.cur = null }
const ST = { A: 'Assault', P: 'Press', H: 'Hold' }, PL = { O: ['Ops', 'Attack → Event → Logistics'], E: ['Event', 'Event → Attack → Logistics'], L: ['Logistics', 'Logistics → Attack → Event'] };
const ORDER = ['West', 'East', 'Italy', 'Balkans', 'Near East'];
function cardById(id) { return D.deck.find(c => c.id === id) }
function render() {
  $('side').value = S.side; $('lvl').value = S.lvl;
  $('deckinfo').textContent = S.deck.length + ' in deck · ' + S.discard.length + ' discarded';
  $('undo').disabled = !S.hist.length;
  const c = S.cur ? cardById(S.cur) : null;
  if (c) {
    const front = D.frontTable[S.side][S.lvl][c.n - 1];
    const order = [front, ...ORDER.filter(f => f !== front)];
    $('card').innerHTML = '<div class="num">' + c.n + '</div><div class="front">' + front + ' front</div>' +
      '<span class="pill st-' + c.stance + '">' + ST[c.stance] + ' · Score ≥ ' + (D.stance[c.stance] + (S.side === 'ap' ? 1 : 0) >= 0 ? '+' : '') + (D.stance[c.stance] + (S.side === 'ap' ? 1 : 0)) + '</span>' +
      '<span class="pill plan">Plan: ' + PL[c.plan][0] + '</span><div class="muted" style="margin-top:6px">' + PL[c.plan][1] + '</div>' +
      '<div style="margin-top:6px"><b>Tie:</b> ' + (c.tie === 'N' ? '▲ North' : '▼ South') + '</div>' +
      '<div class="muted" style="margin-top:6px">Front order: ' + order.join(' → ') + '</div><div class="muted">Card ' + c.id + '/18</div>';
  } else $('card').innerHTML = '<div class="muted">Draw a card at the start of each bot action round.</div>';
  renderTrack(); renderEdge(); renderTabs(); save();
}
function col(cols, cf, sh) { let i = 1; while (i < cols.length && cols[i] <= cf) i++; i--; i += sh; return Math.max(0, Math.min(cols.length - 1, i)) }
function renderEdge() {
  const units = $('dunits').checked;
  // An empty fort defends with its fort value only: unit CF, the army box and trenches do not apply (their inputs are disabled).
  $('dcf').disabled = !units; $('darmy').disabled = !units; $('tr').disabled = !units;
  const acf = Math.max(0, +$('acf').value || 0), dcf = (units ? Math.max(0, +$('dcf').value || 0) : 0) + Math.max(0, +$('fort').value || 0);
  const aA = $('aarmy').checked, dA = $('darmy').checked, tr = +$('tr').value, terr = +$('terr').value;
  // A target always has defending units or a fort, so the defender always fires, even at 0 CF (the Corps table's 0 column).
  const ash = -terr - (units ? tr : 0), dsh = units && tr > 0 ? 1 : 0;
  const ac = col(aA ? D.armyCols : D.corpsCols, acf, ash), dc = col(dA && units ? D.armyCols : D.corpsCols, dcf, dsh);
  const eA = (aA ? D.army : D.corps)[ac], eD = (dA && units ? D.army : D.corps)[dc];
  const edge = Math.round((eA - eD) * 10) / 10;
  const bonus = ($('bobj').checked ? 1 : ($('bnear').checked ? 0.4 : 0)) + ($('bvp').checked ? 0.5 : 0) + ($('boos').checked ? 0.5 : 0) + (+$('bmo').value) + (+$('bfront').value);
  const score = edge + bonus;
  const c = S.cur ? cardById(S.cur) : null, need = c ? D.stance[c.stance] + (S.side === 'ap' ? 1 : 0) : null;
  const lateMO = +$('bmo').value === 6;
  const verdict = need === null ? '' : score >= need - 1e-9 ? '<span class="ok"> — attack (needs ' + need + ')</span>'
    : lateMO ? '<span class="ok"> — attack: last-chance MO. In rounds 5–6 the first attack that meets the unmet MO is made whatever its Score (Score needed otherwise: ' + need + ')</span>'
    : '<span class="no"> — too weak (needs ' + need + ')</span>';
  $('edge').innerHTML = 'Bot ' + eA.toFixed(1) + ' − defender ' + eD.toFixed(1) + ' = Edge ' + (edge >= 0 ? '+' : '') + edge.toFixed(1) + '<br>Score ' + (score >= 0 ? '+' : '') + score.toFixed(2) + verdict;
}
function renderTabs() {
  const o = D.objectives[S.side];
  $('t-obj').innerHTML = '<p class="muted">The Objective is the first space on the list the bot does not control.</p><table>' + Object.keys(o).map(f => '<tr><th>' + f + '</th><td>' + o[f].join(' → ') + '</td></tr>').join('') + '</table>';
  const ft = D.frontTable[S.side];
  $('t-front').innerHTML = '<table><tr><th>Staff number</th>' + [1,2,3,4,5,6].map(n => '<th>' + n + '</th>').join('') + '</tr>' + Object.keys(ft).map(l => '<tr><th>' + l + '</th>' + ft[l].map(f => '<td>' + f + '</td>').join('') + '</tr>').join('') + '</table>';
  const q = ($('evq').value || '').toLowerCase();
  $('evlist').innerHTML = '<table><tr><th>#</th><th>Card</th><th>Pri</th><th>Notes</th></tr>' + D.events[S.side].filter(e => !q || String(e.n) === q || e.name.toLowerCase().includes(q)).map(e => '<tr><td>' + e.n + '</td><td>' + e.name + '</td><td>' + e.pri + '</td><td>' + e.when + '</td></tr>').join('') + '</table><p class="muted">Play an event only when the rules allow it. Priority 7–9 urgent; 5–6 at the Event step of the Plan; 3–4 fallback; 0–2 never. CC n = combat card with keep value n.</p>';
}
function snapshot() { S.hist.push(JSON.stringify({ deck: S.deck, discard: S.discard, cur: S.cur })); if (S.hist.length > 30) S.hist.shift() }
// the snapshot is taken before any reshuffle, so Undo restores the exact state before the draw
$('draw').onclick = () => { snapshot(); if (!S.deck.length) { S.deck = shuffle(S.discard.slice()); S.discard = [] } S.cur = S.deck.pop(); S.discard.push(S.cur); render() };
$('undo').onclick = () => {
  while (S.hist.length) {
    let x = null; try { x = JSON.parse(S.hist.pop()) } catch (e) {}
    if (validDeck(x)) { S.deck = x.deck; S.discard = x.discard; S.cur = x.cur ?? null; break }
    note('A damaged Undo step was skipped.');
  }
  render();
};
$('newdeck').onclick = () => { snapshot(); S.deck = shuffle(D.deck.map(c => c.id)); S.discard = []; S.cur = null; render() };
$('side').onchange = e => { S.side = e.target.value; render() };
for (const id of ['tturn', 'tround', 'tmo', 'trp']) $(id).onchange = $(id).oninput = () => { S.track = cleanTrack({ turn: Math.round(+$('tturn').value), round: Math.round(+$('tround').value), mo: $('tmo').checked, rp: $('trp').checked }); render() };
$('lvl').onchange = e => { S.lvl = e.target.value; render() };
for (const id of ['acf','dcf','fort','aarmy','darmy','dunits','terr','tr','bobj','bnear','bvp','boos','bmo','bfront']) { $(id).oninput = renderEdge; $(id).onchange = renderEdge }
$('evq').oninput = renderTabs;
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b)); for (const t of ['obj','front','ev']) $('t-' + t).classList.toggle('hidden', t !== b.dataset.t) });
load(); if (!S.deck.length && !S.discard.length) reset(); render();
</script></body></html>`
// syntax check of the page script before writing
{ const i = html.indexOf('<script>'), j = html.lastIndexOf('</script>'); new Function(html.slice(i + 8, j)) }
const out = path.join(root, 'app/General_Staff_Companion.html')
fs.writeFileSync(out, html)
console.log('wrote', out, html.length, 'bytes')
