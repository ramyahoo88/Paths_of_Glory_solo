// Event priority policy, derived from research/event_policy.json (card-by-card table).
// Priority 0-9: 9 = play as soon as legal; >=8 urgent (checked before anything else);
// 5-7 played when the Directive's plan reaches "Event"; 3-4 only when nothing better; 0 never.
"use strict"
const data = require('../engine/data.js')
const POLICY = require('../research/event_policy.json')
const BY = {}
for (const e of POLICY) BY[e.global] = e

const C = {} // name -> global index
for (let i = 1; i < data.cards.length; i++) C[data.cards[i].name] = i

function ev(A, k) { return A.game.events[k] > 0 }

// Situational adjustments for cards whose value depends on the board (all open information).
const ADJUST = {
  // AP
  2: (b, A, p) => p, // Blockade
  12: (b, A, p) => A.game.turn >= 2 ? 7 : 0, // Entrench (AP)
  17: (b, A, p) => 8, // Italy
  16: (b, A, p) => (A.game.ap.commitment !== 'mobilization' ? 6 : 4), // Romania
  44: (b, A, p) => (A.game.war.bu ? 5 : 2), // Greece
  27: (b, A, p) => 0, // Great Retreat: reactive, keep as OPS
  45: (b, A, p) => 7, 46: (b, A, p) => 5,
  // CP
  71: (b, A, p) => A.game.turn >= 2 ? 6 : 0, // Entrench (CP)
  73: (b, A, p) => 3, // Race to the Sea
  75: (b, A, p) => 3, 94: (b, A, p) => 3, // SUD Army, 11th Army
  98: (b, A, p) => (ev(A, 'independent_air_force') ? 3 : 8), // Rathenau
  112: (b, A, p) => (A.game.ap.mo === 'fr' ? 8 : 6), // French Mutiny
  120: (b, A, p) => 0, // Lloyd George: keep as OPS
}

function priority(bot, A, c) {
  const e = BY[c]
  const d = data.cards[c]
  if (!e) return d.reinfnation ? 7 : (d.ws ? 5 : 3)
  if (e.class === 'combat_card') return 0
  let p = e.event_priority
  if (ADJUST[c]) p = ADJUST[c](bot, A, p)
  // two-corps reinforcement cards: lower if an army reinforcement of the same nation is in hand
  if (d.reinfnation && p <= 5) {
    const armyCard = A.game[bot.side].hand.some(h => h !== c && data.cards[h].reinfnation === d.reinfnation && BY[h] && BY[h].event_priority >= 7)
    if (armyCard) p = 3
  }
  return p
}

// Combat card use: play when the engine offers it and the fight matters.
function ccOk(bot, A, c, attacking) {
  const e = BY[c]
  if (!e) return true
  return (e.event_priority || 0) >= 4
}

// Cards held until their event becomes playable (never used for OPS, SR or RP) -- only while
// the event is close to playable.
const KEEP = new Set([12, 16, 17, 26, 33, 40, 43, 47, 52, 54, 55, 71, 93, 99, 101, 110, 117, 118, 119])
const KEEP_WHEN = {
  12: A => !(A.game.events.entrench > 0), 71: A => !(A.game.events.entrench > 0),
  16: A => true, 17: A => true, 99: A => true, // neutral entries: blocked only by another entry this turn
  26: A => !(A.game.events.zimmermann_telegram > 0),
  33: A => A.game.events.high_seas_fleet > 0,
  54: A => A.game.ap.ws + A.game.cp.ws >= 25,
  55: A => A.game.events.zimmermann_telegram > 0, 40: A => A.game.events.zimmermann_telegram > 0,
  43: A => A.game.events.zimmermann_telegram > 0, 47: A => A.game.events.zimmermann_telegram > 0,
  52: A => A.game.events.uboats_unleashed > 0,
  93: A => A.game.cp.ru_vp >= 2,
  117: A => A.game.events.tsar_takes_command > 0,
  118: A => A.game.events.fall_of_the_tsar > 0,
  110: A => A.game.events.bolshevik_revolution > 0,
  101: A => A.game.events.h_l_take_command > 0,
  119: A => true,
}
function keepNow(A, c) { return KEEP.has(c) && (!KEEP_WHEN[c] || KEEP_WHEN[c](A)) }

// Printed notes (match ADJUST and KEEP_WHEN above). Keys are global card indices.
const NOTE = {
  12: '0 on turn 1; 7 from turn 2 while no Entrench event has been played.',
  16: '4 while the Allies are at Mobilization, otherwise 6.',
  44: '5 if Bulgaria is at war, otherwise 2.', 27: 'Never as an event.',
  71: '0 on turn 1; 6 from turn 2 while no Entrench event has been played.',
  98: '3 once Independent Air Force has been played.', 112: '8 if the Allied MO this turn is France.', 120: 'Never as an event.',
}
// Printed priority (situational cards show their usual value; the note gives the rule).
function printedPriority(c) {
  const e = BY[c]; if (!e) return '?'
  if (e.class === 'combat_card') return 'CC'
  const fixed = { 12: 7, 16: 6, 17: 8, 44: 5, 27: 0, 45: 7, 46: 5, 71: 6, 73: 3, 75: 3, 94: 3, 98: 8, 112: 6, 120: 0 }
  return String(fixed[c] !== undefined ? fixed[c] : e.event_priority)
}

module.exports = { priority, ccOk, BY, C, KEEP, KEEP_WHEN, keepNow, NOTE, printedPriority }
