// Build a Pages function while retaining the deployed Solo Table companions.
'use strict'
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict')
const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const baseline = read('deployment/baseline-worker.mjs')
const snapshot = JSON.parse(read('deployment/production_snapshot.json'))
assert.equal(crypto.createHash('sha256').update(baseline).digest('hex'), snapshot.workerSha256, 'The retained production Worker changed')
assert.equal((baseline.match(/export default \{/g) || []).length, 1)
const article = `      <article class="companion" aria-labelledby="paths-of-glory-title">
        <div class="companion-content">
          <p class="companion-type">General Staff · Either side</p>
          <h2 id="paths-of-glory-title">Paths of Glory</h2>
          <p>Play on your physical board while General Staff commands the opposing side. Draw Staff cards, calculate Edge and keep the bot's turn and round notes in the companion.</p>
          <p class="scenarios">Historical scenario · Full campaign · v1.0.0</p>
          <div class="actions">
            <a class="button button-primary" href="games/paths-of-glory/">Open companion</a>
            <a class="button button-secondary" href="downloads/paths-of-glory" download="General_Staff_Companion.html">Download offline app</a>
          </div>
          <p class="scenarios"><a href="games/paths-of-glory/General_Staff_Rules.pdf" download>Rules PDF</a> · <a href="games/paths-of-glory/General_Staff_Cards.pdf" download>Staff cards</a> · <a href="games/paths-of-glory/General_Staff_Reference.pdf" download>Reference sheets</a></p>
        </div>
      </article>
`
const homeBefore = read('deployment/baseline-home.html')
const marker = '    </section>\n\n    <section id="at-the-table"'
assert.equal(homeBefore.split(marker).length, 2, 'Catalog insertion point must be unique')
const home = homeBefore.replace(marker, article + marker)
const pdfs = Object.fromEntries([
  ['General_Staff_Rules.pdf', 'rules.pdf'],
  ['General_Staff_Cards.pdf', 'staff_cards.pdf'],
  ['General_Staff_Reference.pdf', 'reference.pdf'],
].map(([name, file]) => ['/games/paths-of-glory/' + name, fs.readFileSync(path.join(root, 'print/out', file)).toString('base64')]))
let wrapper = read('deployment/worker-template.mjs')
for (const [name, value] of Object.entries({ APP: read('app/General_Staff_Companion.html'), HOME: home, PDFS: pdfs })) {
  wrapper = wrapper.replace('/*__' + name + '__*/', JSON.stringify(value))
}
assert(!/\/\*__\w+__\*\//.test(wrapper))
const output = baseline.replace('export default {', 'const PREVIOUS = {') + '\n' + wrapper
fs.writeFileSync(path.join(__dirname, 'home.html'), home)
fs.writeFileSync(path.join(__dirname, 'pages-worker.mjs'), output)
console.log('Built Solo Table catalog and Pages function:', Buffer.byteLength(output), 'bytes')
