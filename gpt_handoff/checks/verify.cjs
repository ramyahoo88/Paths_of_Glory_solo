const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const { artifacts, buildHtml } = require("../build.cjs");

const root = path.join(__dirname, "..");
const expected = {
  tabletop: "be71ed3891cf9463b3299e9c1c5ce1429bf9016a91b811328b7990ff78e6ea9c",
  digital: "cabebc21dda97f82a368fcd5264d973d04ae665ab72c89faa8b849fb11338ddc"
};

for (const [mode, filename] of Object.entries(artifacts)) {
  const original = fs.readFileSync(path.join(root, "apps", filename));
  assert.equal(crypto.createHash("sha256").update(original).digest("hex"), expected[mode]);
  assert(original.equals(Buffer.from(buildHtml(mode))), mode + " rebuild differs");
  new vm.Script(original.toString().match(/<script>([\s\S]*?)<\/script>/)[1]);
}

const code = buildHtml("tabletop").match(/<script>([\s\S]*?)<\/script>/)[1];
function page(store = new Map()) {
  let handler;
  const nodes = Object.fromEntries(["workspace", "mission", "history"].map(name => [name, {
    innerHTML: "", hidden: false,
    querySelector: selector => selector.includes("input") ? { value: "6" } : { focus() {} }
  }]));
  const context = vm.createContext({
    document: {
      getElementById: name => nodes[name],
      addEventListener: (name, callback) => { assert.equal(name, "click"); handler = callback; }
    },
    localStorage: {
      getItem: key => store.get(key), setItem: (key, value) => store.set(key, value),
      removeItem: key => store.delete(key)
    },
    window: { confirm: () => true }
  });
  vm.runInContext(code, context);
  return {
    store, nodes,
    state: () => JSON.parse(vm.runInContext("JSON.stringify(state)", context)),
    click(action, value = "") {
      assert(["drill", "setup"].includes(action) ||
        nodes.workspace.innerHTML.includes(`data-action="${action}" data-value="${value}"`), action);
      handler({ target: { closest: () => ({ dataset: { action, value } }) } });
    }
  };
}

const drill = page();
drill.click("drill");
drill.click("offer", "move/1");
assert.equal(drill.state().probe, 0);
drill.click("skip");
assert.match(drill.nodes.workspace.innerHTML, /Villach/);
drill.click("offer", "move/1");
drill.click("done");
assert.equal(drill.state().log[0].checks, 2);
drill.click("leave-drill");
assert.equal(drill.state(), null);

for (const side of ["cp", "ap"]) {
  let app = page();
  app.click("start", side);
  let restored = false, launched = false;
  for (let step = 0; step < 250 && app.state().phase !== "finished"; step++) {
    const state = app.state();
    if (state.phase === "mandate") app.click("mandate");
    else if (state.phase === "board") app.click("begin");
    else if (state.phase === "probe") {
      if (!restored && state.round === 2) {
        app.click("offer", "move/2");
        const before = app.state();
        app = page(app.store);
        assert.deepEqual(app.state(), before);
        restored = true;
      } else app.click("skip");
    } else if (state.phase === "launch") {
      app = page(app.store);
      assert.equal(app.state().phase, "launch");
      app.click("launch");
      launched = true;
    } else if (state.phase === "rp") app.click("rp", "yes");
    else if (state.phase === "order") app.click("done");
    else if (state.phase === "turn-end") app.click(state.turn < 3 ? "next" : "finish");
    else assert.fail(state.phase);
    const now = app.state();
    const cards = [now.hand, now.deck, now.discard, now.removed].flat();
    assert.equal(cards.length, 14);
    assert.equal(new Set(cards).size, 14);
  }
  assert.equal(app.state().phase, "finished");
  assert.equal(app.state().log.length, 18);
  assert(restored);
  assert.equal(launched, side === "cp");
  assert(app.state().log.every(entry => entry.checks + entry.lookups <= 6));
}
console.log("Both original hashes, byte-identical rebuilds, script parsing, Cluj drill, both 18-action UI flows, reload, Fall search, and card conservation passed.");
console.log("UI verification used a simulated DOM. Full games and real browser rendering were outside this recovery check.");
