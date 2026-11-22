# General Staff v0.7.5 verification

**22 November 2026 | Siege correction verified; per-game evidence verified. One Low provenance correction remains.**

Reviewed `ramyahoo88/Paths_of_Glory_solo`, branch `claude-bot`, production commit `cd648213326835fe32536688adc4755960137f46`, from a fresh clone. Its simulation code matches the reported test candidate `9c1326ebe290b9bc8ac90d3dff59a9955b5f0a8e` byte for byte across the bot, board, event policy, runners, engine hook and setup script. The pinned RTT engine c58b0b4 was fetched successfully. This is a focused verification of the two v0.7.4 follow-ups. Production code was not changed for the review.

## 1. Siege withdrawal: closed

The shipped Nancy regression passes in **13 decisions with no reset**: GE 6 leaves and the two German corps remain to besiege the intact level-2 French fort. Running the same fixture with the v0.7.4 bot reproduces **one reset** and fails the corrected expectation, as intended.

A further **38 independent controls** check departures from legal sieges at forts of levels 1, 2 and 3, keeping an army or the required corps, skipping a unit whose departure would break the siege, and rejecting a planned move when nobody can leave. The full previously affected campaign, seed **1080569**, now finishes with **zero resets**: Allied victory, turn 19, VP 0, 3,503 decisions. Its result and decision count match the new committed record. Both earlier resets are eliminated.

The implementation checks planned departures, the lead unit, additional movers and the emergency exit against the engine's `can_besiege`. The bot's rule is now printed in section 6 and the reference sheet. Rendered booklet page 6 and both columns of reference page 1 were inspected; the printed instructions agree with the implemented policy. The native authority remains [Living Rules 15.2.4](https://gmtwebsiteassets.s3.us-west-2.amazonaws.com/nnpg/PoG-DeluxeRules2022Final.pdf). The earlier inaccurate description of the Nancy problem is corrected in the response and report.

## 2. Per-game evidence: present and internally consistent

All twelve new paired files contain **300 attempted seed records each**, including explicit records for games that fail. Their candidate stamp is `9c1326e`; the reference stamp is `bc8bef6ceb8311425accab2bfe2f7a8411548f55`. Independent calculations reproduce the headline results:

| Candidate side and seeds | Wins / completed | Win rate |
|---|---|---|
| Allies, 6001-6300 | 270 / 300 | 90.0% |
| Allies, 7001-7300 | 276 / 300 | 92.0% |
| CP, 6001-6300 | 148 / 300 | 49.3% |
| CP, 7001-7300 | 176 / 300 | 58.7% |

The legal-group-only isolation files retain **40 failed games out of 300** as Allies and **74 out of 300** as CP. Every recorded failure says `stuck in choose_attackers`. The published 233/260 and 122/226 win counts apply to completed games; these experiments cannot provide an unbiased all-attempt strength estimate. Their failure counts support the report's conclusion that legal attack groups are required for reliable execution. The default headline runs have no such failures.

All seven handicap files contain **150 distinct per-game records each**, seeds 30001-30150, with no recorded errors or substitutions. At +5 VP, CP wins 63/150 (42.0%); at +6, CP wins 85/150 (56.7%). Interpolation gives about **+5.5 VP** for an even result on that sample. The average change over +0 to +6 is about seven percentage points per VP. These remain bot-versus-bot measurements.

Four paired records were independently replayed: seeds 7001 and 7002 with the candidate on each side. Every per-game field matches the archived record. Handicap shift +5, seed 30001, also matches in every recorded game field. These samples are additional checks, not full independent reruns of all paired/handicap games.

Injected failures confirm that both scripts retain failed seed records and increment their error count rather than silently dropping those attempts. The older v0.7.3 aggregates remain explicitly labelled as aggregates, with the correct candidate and reference setup documented.

### EV-01 - handicap outputs still omit the promised commit stamp

**Severity: Low. No effect on decisions or measured game outcomes.**

**Expected:** the update and results README say paired and handicap outputs identify the tested source commits. The README documents handicap source commit 9c1326e; a standalone result file should carry that identifier too.

**Exact reproduction:** from `sim`, run `node vpshift.js 5 30001 30002`. Inspect the resulting JSON keys, or inspect any committed `sim/results/v0.7.5/handicap_*.json`. There is no candidate, reference or bot-commit field. The independent replay and injected-failure check both reproduce the omission.

**Observed:** output contains only `shift`, `startVP`, `n`, `errors`, `ap`, `cp` and `games`. Per-game records are now present, but commit metadata is not. In contrast, all paired files have both commit stamps. The source at the declared test commit has the same omission.

**Source:** `sim/vpshift.js:25`; `sim/results/README.md:7` describes the broader metadata claim.

**Smallest proposed fix:** include the bot's commit in `vpshift.js` output, using the same Git lookup as `ab.js`; both sides use that bot in self-play. Correct the README until that field exists. A batch manifest can link the seven existing files and their hashes to the documented 9c1326e run, distinguishing declared historical provenance from metadata captured by the runner. No change to the game logic is required.

## 3. Evaluation and release checks

Independent aggregation of all **740 committed evaluation games** confirms:

- 740 completed games; no recorded exceptions or errors;
- zero rule-violation resets, generic fallback choices or forced Salonika transfers;
- 600 self-play games: **509 Allied wins and 91 CP wins** (84.8% / 15.2%);
- all 140 random/naive baseline games won by the tested bot.

A separate strict run of **48 additional seeds, 1080700-1080747**, finished with **45 Allied wins and 3 CP wins**, zero exceptions, zero generic fallback, zero forced Salonika transfers and zero rule-violation resets, across 152,603 decisions. The raw output is included.

The siege, nine event-choice, multinational and 28 companion regressions pass. An isolated Git-archive rebuild reproduces all **four shipped HTML files byte for byte**. The six card pages still hold all 18 complete faces and matching backs. Independent print-content comparisons pass for 36 Front Table cells, 110 event rows, 10 Objective rows and 19 expected-hit columns. Build hashes and runnable checks are in the evidence.

The PDF pages containing the changed siege rule were rendered and inspected. PDF regeneration, hosted Claude artifact parity, and a new real-browser/phone/accessibility pass were not performed in this verification.

## Verdict

**The siege follow-up and the missing per-game evidence are resolved. v0.7.5 is suitable for continued tabletop playtesting.** EV-01 is a nonblocking correction to handicap provenance metadata and its documentation. No new player-facing defect was confirmed in this focused review. The Allied advantage remains evident, and human playtests remain the next strength and workload check. No production edit, merge or public deployment was performed.
