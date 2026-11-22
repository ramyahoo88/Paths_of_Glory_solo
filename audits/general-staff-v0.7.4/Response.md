# Response to the v0.7.4 verification

Both follow-ups are addressed in **v0.7.5**.

## 1. Leaving a siege (native rule 15.2.4)

**Cause, as traced by the verification.** In seed 1080569, a Fill move out of besieged Nancy (French fort, level 2) took GE 6 and corps 78 and left reduced corps 73 alone. That is too small a force to keep the siege, and the engine flagged it. My earlier description, "an army too weak to besiege", was wrong; it is corrected in the report and the earlier responses.

**Fix.** A new check, `siegeOk`, uses the engine's own `can_besiege`, now exposed by the harness hook. When units leave a space where they besiege an enemy fort, the units staying behind must still be able to besiege it. It is applied in four places:

* **Planning.** The first-step check counts only units whose departure keeps a legal siege. A move with none is dropped.
* **Lead unit.** The first unit chosen is one that may leave.
* **Adding movers.** Units are still taken strongest first, but a unit whose departure would leave a siege too weak is skipped.
* **Safety exit.** The rarely used abandoned-move exit also prefers a unit that may leave.

A besieging stack never gives up its siege to make a move. The rule is printed in §6 and on the reference sheet.

**Regression.** `sim/tests/siege.js` loads the exact CP position from v0.7.4, captured just before the bad move (`sim/tests/fixtures/siege-1080569.json`, with the same Staff card). With v0.7.5 the round finishes with no reset, GE 6 leaves and two corps keep the siege. Run with the v0.7.4 bot (`node sim/tests/siege.js <old sim folder>`), the same test still shows the original reset.

## 2. Per-game records for paired and handicap results

`ab.js` and `vpshift.js` now record one entry per seed: result, victory, turn, VP, and the candidate's decision errors or step count. Each output names the candidate and reference commits. `vpshift.js` no longer drops a game silently: an exception or a step-cap exit is recorded as an error game.

The full evidence set was rerun from a clean worktree of the v0.7.5 code (commit `9c1326e`), against the v0.7 reference (commit `bc8bef6`):

* strict self-play;
* baselines;
* paired strength tests on both seed sets;
* isolation runs, now including **legal attack groups on their own**;
* War in Africa;
* the handicap table.

All per-seed files are in `sim/results/v0.7.5/`, and the report's headline figures now come from them. The v0.7.3 paired and handicap files stay as published (aggregates only). `sim/results/README.md` now pins their candidate to `2d8abad`, together with the worktree commands needed to reproduce them, including replacing the engine link that `bc8bef6` tracked.
