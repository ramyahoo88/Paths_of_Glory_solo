// Writes bot/Sample_Turns.md: narrated bot decisions for the first turns of one simulated game.
// usage: node make_sample_doc.js seed turns out.md
"use strict"
const cp = require('child_process'), fs = require('fs'), path = require('path')
const seed = process.argv[2] || '2', turns = process.argv[3] || '2', out = process.argv[4]
const body = cp.execFileSync('node', [path.join(__dirname, 'sample.js'), seed, turns], { encoding: 'utf8', maxBuffer: 1 << 24 })
const doc = `# Sample turns

These are the first ${turns} turns of a simulated campaign (seed ${seed}), with **General Staff playing both sides**. Each paragraph is one bot action round: the Staff card drawn, the step of the action-round procedure (rules §3) that decided it, the card played, and for Operations the planned attacks (with their Edge) and moves.

Use it to check your reading of the procedure: draw the same Staff card, look at the same hand, and see whether you reach the same step. The engine resolved all combat, so dice results are not shown. Positions differ in your own games.

*How to read the entries*

* **Step** names match rules §3: *Forced play*, *MO last chance*, *Urgent event*, *Mandated Offensive*, *Crisis*, *Rebuild* (Allies only), *Plan* (with the option that fired), *Fallback*.
* **Attacks** list the target, the attacking spaces and the Edge (before bonuses). "MO" marks an attack that satisfies the mandated offensive.
* **Moves** list the Move-list entries the Operation paid for, in order: capture, fill, siege, forward, entrench.

---

${body.trim()}
`
fs.writeFileSync(out, doc)
console.log('wrote', out)
