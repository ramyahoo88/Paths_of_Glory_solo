# Response to the v0.7.3 re-audit

Both remaining issues were reproduced and fixed in **v0.7.4**. The eight closed findings were left alone, and no native Paths of Glory rule or engine behaviour was changed.

| ID | Finding | Fix | Check |
|---|---|---|---|
| GS-06 addendum | Salonika transferred a corps in contact through the generic fallback | Followed the proposed fix. The Allied bot plays Salonika as an event only if at least one corps may go: a British or French corps (not the BEF or a minor British corps) in the Reserve Box, or in an Allied port space out of contact. Otherwise its event priority is 0 and the round continues normally. The condition uses the engine's own `is_port`, `is_bef_unit`, `is_minor_british_nation` and `is_fully_stacked`, now exposed by the harness hook. The handler keeps its contact filter. A deterministic safety path covers an unreachable no-candidate state (the corps whose space keeps the most other units). It is counted in run health and was never used. The condition is printed in §9 and on the event list. | `sim/tests/event_choices.js`: with the only corps at Port Said in contact with Sinai, the bot does not play Salonika (it takes the Automatic Operation). The control, with the same corps out of contact, keeps priority 6. The re-audit's seed 1080055 campaign finishes with no Salonika fallback or forced transfer. |
| GS-15 | War in Africa and Salonika reversed the Tie within a front | A new `byLatestFrontThenTie` sorts the latest front first and applies the ordinary Tie within a front, instead of reversing the whole ordered list. Both §9 rows now say "on the same front, use the Tie". | Port Said / Alexandria with Tie North chooses Port Said (156) and with Tie South Alexandria (157), for both events. The Reserve Box still comes first for both. |

**Fresh strict run.** Seeds 1080000–1080599, which include the re-audit's 1080000–1080119:

* 600 of 600 games finished, with 0 exceptions;
* 0 choices left to the engine's default;
* 0 Salonika safety-path transfers;
* 2 rule-violation resets, both in one game (units moved out of a siege left too small a besieging force; fixed in v0.7.5);
* Allies won 85%, the CP 15%.

The seed-level files are in `sim/results/v0.7.4/`.

**Result files.** The re-audit noted that the v0.7.3 seed-level files were not in the repository. They are now in `sim/results/v0.7.3/`:

* the 600 self-play games and 140 baseline games behind the run-health table;
* every paired and isolation run against the v0.7 reference (commit `bc8bef6`);
* the handicap runs.

`sim/results/README.md` gives the commands. The report now says that the legal-group ablation also undoes step capacity and the first-step check, and that one-at-a-time ablations are not additive.

**Rules question (Salonika with zero transfers).** Not changed. The bot now never reaches that situation, so it does not depend on the answer.
