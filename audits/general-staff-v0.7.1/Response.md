# Response to the General Staff v0.7.1 review

All five findings were reproduced and fixed in **v0.7.2**. The test results after the fixes are in [`sim/REPORT.md`](../../sim/REPORT.md) under *v0.7.2: review fixes*.

| ID | Finding | Fix |
|---|---|---|
| GS-01 | MO credit survived when the chosen attackers no longer included the mandated nationality | `planOps` now checks the MO again with the units actually chosen. The MO bonus and the forced round-5 attack apply only if those units satisfy the MO. At resolution the MO is checked again with the units still able to attack. If it is no longer met, the attack becomes an ordinary one and the 0.5 skip rule applies. The rules (§4 step 4, §5.4) now say this explicitly. The review's `mo-proof.cjs`, run against v0.7.2, finds **0** affected plans (v0.7.1: 5). |
| GS-02 | The Companion gave a 0-CF defender no defensive fire | The defender always fires: a 0-CF unit uses the Corps table's 0 column. A new "units in the space" box handles an empty fort: Corps table, no trench shifts. The simulator already did this, and rules §5.3 now says it. |
| GS-03 | Paper (one decimal), Companion (two decimals) and simulator (exact) used different expected hits | One table for all three: the printed one-decimal values. The simulator and Companion now use `printedExpectedTable` from `sim/board.js`, which also generates the printed sheet. A Score equal to the threshold meets it. The review's 9-CF vs 12-CF example now gives +0.05 everywhere. |
| GS-04 | The evaluator silently replaced decision exceptions and dropped fallback reasons | `final_eval.js` now does four things. It records each decision exception with side, turn and engine state. It keeps `stats.fallback`, so engine-default sub-choices, rejected proposals and rule-violation kinds stay visible. It marks a step-cap exit as unfinished. With `STRICT=1`, it stops a game at the first exception. `summarize.py` prints a *Run health* table. An injected exception is now reported (normal mode) or stops the game (strict mode). |
| GS-05 | A tracked `engine` symlink pointed to a home directory on the original machine | The link is no longer tracked. `/engine` is ignored, and `setup_engine.sh` removes a stale link before creating the directory. Setup was re-tested from a clean clone, with and without a dangling `engine` link. |

The review's other notes:

* **Event sub-choices.** The new run-health table counts the choices still left to the engine's default: neutral-entry placement, some event follow-ups. They remain a documented limit (report, *Known limits*) until each one has a printed rule.
* **Operator workload.** Agreed. The report's admin-load section counts Edge calculations only, and says so. Timed physical turns remain on the playtesting list.
