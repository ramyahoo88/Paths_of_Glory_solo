// A/B: candidate (this harness, opts) on side X vs reference snapshot on the other side.
// usage: node ab.js side N start refDir 'optsJSON' ['refOptsJSON']
// Prints one JSON object: the aggregate and, under "games", one record per seed.
const path = require('path')
const { playGame } = require('./play.js')
const { Bot } = require('./bot.js')
const side = process.argv[2], n = +process.argv[3], start = +process.argv[4]
const refDir = path.resolve(process.argv[5])
const RefBot = require(path.resolve(refDir, 'bot.js')).Bot
const opts = JSON.parse(process.argv[6] || '{}'), ropts = JSON.parse(process.argv[7] || '{}')
const { stamp } = require('./provenance.js')
const mkC = (s, seed) => new Bot(s, seed, opts), mkR = (s, seed) => new RefBot(s, seed, ropts)
let win = 0, vp = 0, cnt = 0, errs = 0, how = {}
const games = []
for (let seed = start; seed < start + n; seed++) {
  let r
  try { r = side === 'ap' ? playGame(seed, mkC, mkR) : playGame(seed, mkR, mkC) } catch (e) { errs++; games.push({ seed, error: e.message }); continue }
  const w = r.result === (side === 'ap' ? 'Allied Powers' : 'Central Powers')
  win += w ? 1 : 0; vp += r.vp; cnt++
  const ce = r.stats[side].errors || 0
  errs += ce
  const k = (w ? 'W:' : 'L:') + (r.victory || '').split(':')[0]; how[k] = (how[k] || 0) + 1
  games.push({ seed, result: r.result, victory: r.victory, turn: r.turn, vp: r.vp, candidateWin: w, candidateDecisionErrors: ce, steps: r.steps })
}
console.log(JSON.stringify({ side, opts, refOpts: ropts, n: cnt, winRate: +(win / cnt).toFixed(3), meanVP: +(vp / cnt).toFixed(2), errs, how,
  candidate: stamp(__dirname), reference: stamp(refDir), games }))
