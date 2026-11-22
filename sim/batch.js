// usage: node batch.js N start apKind cpKind [optsJSON-ap] [optsJSON-cp]
const { playGame, RandomPlayer, Bot } = require('./play.js')
const [n, start] = [+process.argv[2] || 20, +process.argv[3] || 1]
const ka = process.argv[4] || 'bot', kc = process.argv[5] || 'bot'
const oa = JSON.parse(process.argv[6] || '{}'), oc = JSON.parse(process.argv[7] || '{}')
const mk = (k, o) => k === 'rnd' ? ((s, seed) => new RandomPlayer(s, seed)) : ((s, seed) => new Bot(s, seed, o))
const tally = { ap: 0, cp: 0 }, how = {}, vps = [], turns = []
const agg = { ap: {}, cp: {} }
for (let seed = start; seed < start + n; seed++) {
  let r
  try { r = playGame(seed, mk(ka, oa), mk(kc, oc)) } catch (e) { console.log('seed', seed, 'ERR', e.message); continue }
  const w = r.result === 'Allied Powers' ? 'ap' : r.result === 'Central Powers' ? 'cp' : 'draw'
  tally[w] = (tally[w] || 0) + 1
  const k = w + ':' + (r.victory || '').split(':')[0]; how[k] = (how[k] || 0) + 1
  vps.push(r.vp); turns.push(r.turn)
  for (const side of ['ap', 'cp']) for (const [kk, v] of Object.entries(r.stats[side])) if (typeof v === 'number') agg[side][kk] = (agg[side][kk] || 0) + v
  if (process.env.V) console.log(seed, w, r.victory, 'T' + r.turn, 'VP' + r.vp, r.vpTrack.join(','))
}
const N = vps.length
console.log(JSON.stringify({ ka, kc, oa, oc, n: N, tally, how, meanVP: (vps.reduce((a, b) => a + b, 0) / N).toFixed(2), meanTurn: (turns.reduce((a, b) => a + b, 0) / N).toFixed(1) }))
for (const side of ['ap', 'cp']) if (Object.keys(agg[side]).length) console.log(side, Object.entries(agg[side]).map(([k, v]) => k + '=' + (v / N).toFixed(1)).join(' '))
