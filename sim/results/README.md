# Seed-level results

Raw outputs behind the figures in [`../REPORT.md`](../REPORT.md), kept so the summary tables can be checked.

## v0.7.6 (`v0.7.6/`), run-time provenance

Every file was produced from a clean worktree of commit **`8f71855`** (the v0.7.6 code). The paired runs play against the v0.7 reference at **`bc8bef6`**. Every output carries a run-time stamp from `sim/provenance.js`: bot commit, an uncommitted-changes flag (false for all of these) and the engine revision with the hook hash. Every file also has one record per seed. Self-play records include `supplyBreaches`, the movement steps that left the moving units out of supply.

* `self_a`–`self_d.json`: strict self-play, 600 games, seeds 1090000–1090599 (a range not used before).
* `naive_*.json` and `rnd_*.json`: 140 baseline games.
* `paired_ap6`, `paired_cp6`, `paired_ap7` and `paired_cp7.json`: the Allied or CP bot against the v0.7 reference, seeds 6001–6300 and 7001–7300.
* `handicap_<shift>.json`: self-play with the starting VP at 10 + shift, seeds 30001–30150.
* `summary.md`: the `summarize.py` output.

## v0.7.5 (`v0.7.5/`), complete per-game records

Every file in this folder was produced from a clean worktree of commit **`9c1326e`** (the v0.7.5 code). The reference bots for paired runs are the `sim/` folder at commit **`bc8bef6`** (v0.7). Every file has **one record per seed** under `games`. Only the `paired_*.json` files carry run-time commit stamps. For the others the provenance is declared, not captured: see [`v0.7.5/MANIFEST.md`](v0.7.5/MANIFEST.md), which also lists SHA-256s.

* `self_a`–`self_d.json`: strict self-play, 600 games, seeds 1080000–1080599.
* `naive_*.json` and `rnd_*.json`: 140 baseline games.
* `paired_ap6`, `paired_cp6`, `paired_ap7` and `paired_cp7.json`: the Allied or CP bot against the v0.7 reference, seeds 6001–6300 and 7001–7300.
* Isolation runs, seeds 7001–7300, each with one switch off:
  * `_ep`: `{"eventPlan":false}`;
  * `_ec`: `{"eventChoices":false}`;
  * `_lg`: `{"legalGroups":false}`, legal attack groups alone;
  * `_wia`: `{"warInAfrica":"vp"}`, which also has a 6001 run.
* `handicap_<shift>.json`: self-play with the starting VP at 10 + shift (the CP bot's favour), seeds 30001–30150.
* `summary.md`: the `summarize.py` output for the self-play and baseline files.

To reproduce, from the repository root:

```sh
git worktree add /tmp/cand 9c1326e && cp -r engine /tmp/cand/engine
git worktree add /tmp/ref bc8bef6 && rm -f /tmp/ref/engine && cp -r engine /tmp/ref/engine   # bc8bef6 tracked an engine link
cd /tmp/cand/sim
STRICT=1 node final_eval.js self 150 1080000 > self_a.json
node ab.js ap 300 7001 /tmp/ref/sim '{"eventPlan":false}' > paired_ap7_ep.json
node vpshift.js 5 30001 30151 > handicap_5.json
```

## v0.7.3 (`v0.7.3/`)

* `self_a`–`self_d.json`: strict self-play, 600 games, seeds 20001–20300 and 10001–10300.
* `naive_*.json` and `rnd_*.json`: 140 baseline games.
* `summary.md`: the output of `summarize.py` on this folder, including the run-health table.

Command for each self-play file (from `sim/`):

```sh
STRICT=1 node final_eval.js self 150 20001 > self_a.json   # self_b: 20151, self_c: 10001, self_d: 10151
```

* `paired_*.json`: **aggregates only** (no per-seed records; the scripts did not save them then). These are paired tests against the **v0.7 reference bots**, 300 games each. To reproduce them, the candidate must be the v0.7.3 code, commit **`2d8abad`**; the current code gives the v0.7.5 results instead. The candidate bot plays one side and the reference plays the other, with the same seeds for every candidate.
  * The reference is the `sim/` folder at commit `bc8bef6`.
  * The file name gives the side and seed set: `ap6` = Allied bot, seeds 6001–6300; `cp7` = CP bot, seeds 7001–7300.
  * Suffixes are isolation runs with one change undone: `ep` = `{"eventPlan":false}`, `ec` = `{"eventChoices":false}`, `mv` = `{"legalGroups":false,"stepCap":false,"firstStepCheck":false}` (these three are undone together), `wia` = `{"warInAfrica":"vp"}`.
  * One-at-a-time ablations interact, so their differences are not additive.

```sh
git worktree add /tmp/cand 2d8abad && cp -r engine /tmp/cand/engine      # the v0.7.3 candidate
git worktree add /tmp/ref bc8bef6 && rm -f /tmp/ref/engine && cp -r engine /tmp/ref/engine
cd /tmp/cand/sim && node ab.js ap 300 7001 /tmp/ref/sim '{"eventPlan":false}'
```

* `handicap.jsonl` (aggregates only): self-play with the starting VP moved in the CP bot's favour (`node vpshift.js <shift> 30001 30151`), 150 games per line.

## v0.7.4 (`v0.7.4/`)

* `self_a`–`self_d.json`: strict self-play, 600 games, seeds 1080000–1080599, a fresh range that includes the v0.7.3 re-audit's batch.
* `summary.md`: the `summarize.py` output with run health.
