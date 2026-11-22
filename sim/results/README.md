# Seed-level results

Raw outputs behind the figures in [`../REPORT.md`](../REPORT.md), kept so the summary tables can be checked.

## v0.7.3 (`v0.7.3/`)

* `self_a`–`self_d.json`: strict self-play, 600 games, seeds 20001–20300 and 10001–10300.
* `naive_*.json` and `rnd_*.json`: 140 baseline games.
* `summary.md`: the output of `summarize.py` on this folder, including the run-health table.

Command for each self-play file (from `sim/`):

```sh
STRICT=1 node final_eval.js self 150 20001 > self_a.json   # self_b: 20151, self_c: 10001, self_d: 10151
```

* `paired_*.json`: paired tests against the **v0.7 reference bots**, 300 games each. The candidate bot plays one side and the reference plays the other, with the same seeds for every candidate.
  * The reference is the `sim/` folder at commit `bc8bef6`.
  * The file name gives the side and seed set: `ap6` = Allied bot, seeds 6001–6300; `cp7` = CP bot, seeds 7001–7300.
  * Suffixes are isolation runs with one change undone: `ep` = `{"eventPlan":false}`, `ec` = `{"eventChoices":false}`, `mv` = `{"legalGroups":false,"stepCap":false,"firstStepCheck":false}` (these three are undone together), `wia` = `{"warInAfrica":"vp"}`.
  * One-at-a-time ablations interact, so their differences are not additive.

```sh
git worktree add /tmp/ref bc8bef6 && cp -r engine /tmp/ref/   # the reference bot, with an engine beside it
cd sim && node ab.js ap 300 7001 /tmp/ref/sim '{"eventPlan":false}'
```

* `handicap.jsonl`: self-play with the starting VP moved in the CP bot's favour (`node vpshift.js <shift> 30001 30151`), 150 games per line.

## v0.7.4 (`v0.7.4/`)

* `self_a`–`self_d.json`: strict self-play, 600 games, seeds 1080000–1080599, a fresh range that includes the v0.7.3 re-audit's batch.
* `summary.md`: the `summarize.py` output with run health.
