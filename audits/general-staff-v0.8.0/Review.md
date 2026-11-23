# General Staff v0.8.0 — independent review

**Reviewed 22 November 2026. Commit `569bdc7b3eb1768504cc2393147c05fcbc95b0e4`, branch `claude-bot`, `ramyahoo88/Paths_of_Glory_solo`.**

**Verdict: keep the two CP changes; correct and republish the printed reference before treating the release packet as complete.** One Medium defect is confirmed: reference page 2 still gives both superseded CP instructions. The released bot and companion implement the intended changes. This is a focused review of the v0.8.0 changes and evidence, not a new comprehensive audit of every base-game rule.

## Confirmed finding — Medium: reference page 2 preserves the old CP procedure

**Player impact.** A player following the second reference sheet can make attacks the released CP bot rejects and prioritize the East ahead of the West. This can undo the two changes responsible for the measured improvement. The same PDF contradicts itself: its first page is updated, its second is not.

**Expected behavior.** Rules section 2 puts West first for CP, followed by the Staff card's front and the remaining fixed order without duplicates. Rules section 5.4 gives these thresholds:

| Stance | Released CP threshold | Obsolete threshold on reference page 2 |
|---|---:|---:|
| Assault | +0.75 | 0 |
| Press | +1.50 | +0.75 |
| Hold | +2.25 | +1.50 |

Allied thresholds remain +1, +1.75 and +2.5.

**Reproduction and observed result.** Extract or visually inspect page 2 of `print/out/reference.pdf`. The paragraph after the Front Tables says to check the Staff card's front first, without the CP exception. The paragraph below the Edge tables gives the obsolete CP thresholds above. The rendered page and extracted text are included in this packet. A clean HTML rebuild reproduces both defects.

A concrete attack example is CP Assault, 4 CF on Army versus 3 CF on Army, clear terrain, no trenches and no Score bonuses: expected hits 3.0 versus 2.5 yield Score +0.50. Page 2 permits it; section 5.4 and the companion correctly reject it. For front order, CP Mobilization with Staff card 10 selects East in the Front Table: released order is West, East, Italy, Balkans, Near East, while the old reference instruction selects East first. The existing siege-order fixture verifies the resulting Nancy/Ivangorod choice.

**Source.** [print/build.js lines 111 and 113](https://github.com/ramyahoo88/Paths_of_Glory_solo/blob/569bdc7b3eb1768504cc2393147c05fcbc95b0e4/print/build.js#L111), copied to `print/out/reference.html` and printed in `print/out/reference.pdf` page 2.

**Smallest fix.** Update those two generator lines, rebuild `reference.html` and `reference.pdf`, and replace the distributed reference download. `proposed-reference-fix.patch` contains the source edit; it was not applied to the release during this review.

**Optional prevention.** Generate each threshold display from shared values and validate the extracted PDF text against the released rule table. The existing print check checks card completeness, so it can pass while this reference text is stale.

## Verified release and evidence

- A separate companion rebuild is byte-identical to the shipped HTML. SHA-256: `60a650af3c9c25da517f961c391491b0dd8fa399931f1a408e9b0e975775eafd`.
- Separate builds of `staff_cards.html`, `reference.html` and `rules.html` are also byte-identical. Byte equality demonstrates reproducibility; the reference defect reproduces too. PDF binary reproducibility was not claimed.
- All 40 companion regression checks and the five engine regression suites passed. Additional assertions verified all six side/stance thresholds, CP/AP front ordering and the +0.50 Assault rejection. All 18 Staff cards passed the print completeness check. The seed-2, two-turn worked example still regenerates exactly.
- Twenty strict self-play games, seeds 1100000–1100019, were independently rerun. Every recorded field equals the corresponding stored records, including scores, milestones, activity counters, step counts and health diagnostics.
- Recalculation of all 600 stored self-play games gives 186 CP wins and 414 Allied wins. CP win rate is 31.0%; its Wilson 95% interval is approximately 27.4–34.8%. CP attacks average 71.40 per game.
- The stored 740-game health suite has no unfinished games, decision exceptions, recorded violations, undo resets, called-off attacks, Salonika safety transfers or bot supply breaches. The two random-opponent supply breaches are correctly separated from bot policy failures. The two legal abandoned-plan exits are documented in the release report.
- All 60 stored Allied identity games match the v0.7.6 records exactly. These are existing-record comparisons, distinct from the 20 independent strict replays above.
- Against the old v0.7 reference, the CP wins are 221/300 on each seed set (73.7%), compared with 160/300 and 168/300 in v0.7.6. The reported paired gains/losses of 107/46 and 105/52 agree with the per-seed data.
- The six handicap files reproduce the reported progression: CP wins 46, 59, 68, 76, 83 and 94 out of 150 for starting VP shifts 0–5. A three-VP shift gives 50.7%, a coarse self-play calibration rather than a tested human difficulty rating.

The original CP confirmations also recompute exactly:

| Seeds | Old CP wins | New CP wins | Gained / lost | Reported z, recalculated |
|---|---:|---:|---:|---:|
| 8001–8300 | 48/300 (16.0%) | 90/300 (30.0%) | 76 / 34 | 4.00 |
| 9001–9300 | 46/300 (15.3%) | 96/300 (32.0%) | 82 / 32 | 4.68 |

These support a gain against the fixed Allied bot. They do not establish performance against people or other strong strategies. The experiment files disclose that their candidate scratch directories were not commit-stamped; the released evidence suite is clean and stamped. This review independently checked the released implementation and generated additional held-out comparisons, rather than certifying the exact uncommitted source of every rejected experiment.

## Independent confirmation on new seeds

The two additional A/B runs finished: **24/200 (12.0%)** CP wins with the old settings, and **63/200 (31.5%)** with West first and Stance +0.75, against the same v0.7.6 Allied bot on seeds 2200000–2200199. These seeds were absent from the reviewed repository's published results.

The paired gain is **19.5 percentage points**, with 50 wins gained and 11 lost. An approximate paired 95% interval for the gain is 12.3 to 26.7 points; the exact two-sided McNemar p-value is 4.589e-07. Both runs completed all 200 games, with zero recorded candidate decision exceptions. This is an A/B strength check using the repository's existing harness, separate from the stricter health replay. It does not establish performance against human players. The improvement therefore held up on an additional independent sample.

The full per-seed results, source/engine stamps, validation assertions and summary are included. Run `python3 summarize_fresh.py` from this packet to recompute them.

## Interpretation and next tabletop test

The two changes preserve the ordinary game rules and add little administration: a fixed first front and revised existing thresholds. Keep them. The highest-value next tabletop test is an Allied player deliberately pressing Russia and the Balkans while CP concentrates in the West.

Be precise about the Russia metric: 320/600 games reached **Fall of the Tsar** (53.3%); 109/600 reached **Treaty of Brest Litovsk** (18.2%). The 53% figure is not a Russian-surrender rate.

**Live deployment limitation.** The published page and downloadable files were not independently verified. Automatic approval review rejected listing Cloudflare accounts because it would expose private account metadata beyond this repository/PDF review. Public search did not identify a reliable companion URL. No Cloudflare settings or production files were changed.
