// Writes bot/Sample_Turns.md: narrated bot decisions for a worked example.
// usage: node make_sample_doc.js seed turns out.md
"use strict"
const cp = require('child_process'), fs = require('fs'), path = require('path')
const seed = process.argv[2] || '2', turns = process.argv[3] || '2', out = process.argv[4]
const body = cp.execFileSync('node', [path.join(__dirname, 'sample.js'), seed, turns], { encoding: 'utf8', maxBuffer: 1 << 24 })
const doc = `# Sample turns

These worked examples cover the first ${turns} turns of a campaign, with **General Staff commanding each side**. Each paragraph is one bot action round: the Staff card drawn, the step of the action-round procedure (rules §3) that decided it, the card played, and for Operations the planned attacks (with their Edge) and moves.

Use these examples to check your reading of the procedure: with the same hand (shown, with each card's OPS value in brackets) and the same Staff card, see whether you reach the same step. Only the bot's decisions are shown; combat dice results are omitted. Positions differ in your own games.

*How to read the entries*

* **Step** names match rules §3: *Forced play*, *MO: last chance*, *Urgent event*, *MO*, *Crisis*, *Rebuild* (Allies only), *Plan* (with the option that fired), *Fallback*.
* **Attacks** list the target, the attacking spaces and the Edge (before bonuses). "MO" marks an attack that satisfies the mandated offensive.
* **Moves** list the Move-list entries the Operation paid for, in the order planned (highest Move value first).

---

${body.trim()}
`
fs.writeFileSync(out, doc)
console.log('wrote', out)
