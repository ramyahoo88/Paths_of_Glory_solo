// Writes a narrated trace of the bot's action rounds (both sides) for the first turns of one game.
// usage: node sample.js seed turns 'optsAP' 'optsCP' > sample.md
"use strict"
const R = require('../engine/rules.js')
const { Bot, fallback, ROLE } = require('./bot.js')
const seed = +(process.argv[2] || 7), turns = +(process.argv[3] || 2)
const oa = Object.assign(JSON.parse(process.argv[4] || '{}'), { trace: true })
const oc = Object.assign(JSON.parse(process.argv[5] || '{}'), { trace: true })
let g = R.setup(seed, 'Historical', { no_supply_warnings: true })
const P = { [ROLE.ap]: new Bot('ap', seed, oa), [ROLE.cp]: new Bot('cp', seed, oc) }
const log = []
let li = 0, lastTraceLen = { ap: 0, cp: 0 }
const out = []
const ST = { A: 'Assault', P: 'Press', H: 'Hold' }, PL = { O: 'Ops', E: 'Event', L: 'Logistics' }
while (g.state !== 'game_over' && g.turn <= turns) {
  const role = g.active
  const v = R.view(g, role)
  const a = P[role].decide(g, v) || fallback(v.actions)
  g = R.action(g, role, a[0], a[1])
  for (const side of ['cp', 'ap']) {
    const b = P[ROLE[side]]
    const tr = b.trace || []
    while (lastTraceLen[side] < tr.length) {
      const t = tr[lastTraceLen[side]++]
      const who = side === 'cp' ? 'Central Powers bot' : 'Allied bot'
      let line = `**Turn ${t.turn}, ${who}, round ${t.round}.** Staff card ${t.staff.id}: front ${t.staff.n}, ${ST[t.staff.stance]}, plan ${PL[t.staff.plan]}, tie ${t.staff.tie === 'N' ? 'North' : 'South'}. Step: *${t.step}*. `
      if (t.action === 'play_event') line += `Plays **${t.card}** as an Event.`
      else if (t.action === 'play_ops') line += `Plays **${t.card}** for Operations.`
      else if (t.action === 'single_op') line += `Takes the 1-OP Automatic Operation.`
      else if (t.action === 'play_sr') line += `Plays **${t.card}** for SR.`
      else if (t.action === 'play_rps') line += `Plays **${t.card}** for RP.`
      if (t.attacks && t.attacks.length) line += ' Attacks: ' + t.attacks.map(x => `${x.target} from ${x.from.join(' + ')} (Edge ${x.edge >= 0 ? '+' : ''}${x.edge}${x.mo ? ', MO' : ''})`).join('; ') + '.'
      if (t.moves && t.moves.length) line += ' Moves: ' + t.moves.map(m => `${m.kind} ${m.from}${m.from !== m.to ? ' → ' + m.to : ''}`).join('; ') + '.'
      out.push(line)
    }
  }
}
console.log(out.join('\n\n'))
