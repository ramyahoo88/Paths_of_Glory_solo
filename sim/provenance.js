// Provenance stamp for result files: the bot's git commit, whether its sim/ folder had uncommitted changes, and the engine.
const path = require('path'), fs = require('fs'), cp = require('child_process')
function git(args, cwd) { try { return cp.execSync('git ' + args, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch (e) { return null } }
function stamp(dir) {
  dir = path.resolve(dir)
  const commit = git('rev-parse HEAD', dir)
  const dirty = commit === null ? null : git('status --porcelain -- .', dir) !== ''
  let engine = null
  try { engine = JSON.parse(fs.readFileSync(path.join(dir, '../engine/VERSION.json'), 'utf8')) } catch (e) {}
  return { dir, commit, dirty, engine }
}
module.exports = { stamp }
