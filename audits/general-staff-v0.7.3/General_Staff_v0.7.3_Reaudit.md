# General Staff v0.7.3 re-audit

**22 November 2026 | Verdict: hold audit closure for a short corrective patch.**

v0.7.3 corrects the original calculator, print, movement, attack-group, session-recovery and Undo reproductions. Eight of the nine findings can close. GS-06 remains partially open: a normal campaign reaches a Salonika choice that still goes through the generic fallback and contradicts the new printed rule. A separate Low issue reverses the Staff Tie for War in Africa and Salonika.

The release is a substantial improvement. All 120 fresh strict-mode campaigns finished, with no decision exceptions or rule-violation resets. The Allies won 106 (88.3%); the Central Powers won 14 (11.7%). This supports the reported Allied advantage. It does not independently establish the exact earlier-reference win rates or a human difficulty handicap.

## 1. Reviewed release and scope

Repository: `ramyahoo88/Paths_of_Glory_solo`, branch `claude-bot`. Reviewed production commit: `2d8abad3ea8e3bdd430635739a122c63af70ab9e`. The following line references are to that commit. This report adds review material only; production files and native game rules were not changed.

System: General Staff v0.7.3, Deluxe Historical full campaign, standard 110 strategy cards, no optional cards. The physical game remains required. Engine: Rally the Troops `c58b0b4a33e227faf73cbe561f3bede17087a142`, obtained by a successful fresh run of `sim/setup_engine.sh`. Runtime: Node v24.22.3 and Python 3.12.14.

Read the preceding comprehensive audit and v0.7.3 response, the complete production diff, current bot booklet, reference, Staff cards, companion builder and shipped page, event handlers, README and simulation report. Rendered and inspected all 23 supplied PDF pages: 10 booklet, 7 reference and 6 Staff-card pages. Both columns and every table column were included. The seed-2 two-turn worked example still rebuilds byte for byte.

Reconsulted GMT's [2022 Living Rules](https://gmtwebsiteassets.s3.us-west-2.amazonaws.com/nnpg/PoG-DeluxeRules2022Final.pdf), especially 12.1.10 and 12.1.11.1 for London and multinational combat, and 11.1.8 and 15.2.1 for fort entry. Also consulted the [2000 errata](https://www.gmtgames.com/nnpg/pog_errata.html) and [older Allied card manifest](https://s3-us-west-2.amazonaws.com/gmtwebsiteassets/nnpg/allied_cards.pdf). The older manifest's Salonika entry says transfer of up to three corps; it does not resolve all current-card/engine questions about a zero-transfer event. The recommended fix below avoids changing a native rule.

## 2. Release verification

A clean Git archive was extracted to a separate directory. Its builders ran against the pinned engine; all four rebuilt HTML files match the shipped files byte for byte.

| Artifact | SHA-256 |
|---|---|
| Companion HTML | `4b10d7eefb26bb81c573c15f8cea6cd727d8ddf4cf4c5920793224c146c18b96` |
| Rules HTML | `54cde0c05670af648aa2ab9729d28cec71999d97b8d0c1d6d983367966d247fe` |
| Reference HTML | `5baa09bf96a89b3fba594e6aa1f8da80ea73494aaafaf9a0a4dad6a01f1ff93a` |
| Staff-card HTML | `0bcff8d3eeb99a4fb8e6fef4e8ffb8610624cae521f1ce5c2a48fe9dbea5ee5b` |

The shipped PDFs were inspected directly. PDF regeneration was not repeated: this environment has no working local Chrome executable. HTML reproducibility and shipped-PDF inspection are separate results.

Both the repository print check and independent content comparisons pass: all 18 card IDs occur once; each face page contains six tops, Ties and footers; each following page contains six complete backs. The centered grids align for long-edge duplex. Reference comparisons cover 36 Front Table cells, 110 event rows, 10 Objective rows and 19 expected-hit columns.

## 3. Disposition of the nine findings

| ID | Status | Evidence |
|---|---|---|
| GS-09 | Closed | All six card pages inspected; 18 whole faces and matching backs. The fragmentation is gone. |
| GS-10 | Closed | Original below-Stance late-MO fixture now says last-chance MO; rounds 3-4 control remains too weak. |
| GS-11 | Closed | Empty fort 2 ignores leftover unit CF 0 or 12 and disables inactive inputs. Occupied defense returns when reticked. |
| GS-14 | Closed | Verdun/Nancy/Metz regression activates Nancy only: BR 1, Edge +1.2, Score +2.7, 1 OP. Common-stack control still combines legally. |
| GS-06 | Partial | Original Landwehr and War in Africa states now choose GE 7 and a Reserve Box corps. Named handlers exist. Salonika still has the reached exception below. |
| GS-07 | Closed | Seed 951000 no longer reproduces the abandoned-move overstack. First-step capacity and persistent event-operation plans are implemented. Fresh 120-game run has zero resets. |
| GS-08 | Closed | The preceding audit's exact trench snapshot, with Staff card 10, now follows front order and Tie. |
| GS-13 | Closed | Original invalid-side, duplicate-deck, malformed history/JSON and failed-write fixtures recover visibly. Valid reload remains intact. |
| GS-12 | Closed | Draw 19 then Undo restores exactly the state after draw 18, including the exhausted deck and full discard. |

All 28 repository companion checks pass. The independent arithmetic sweep passes 864 table/CF/terrain/trench combinations and its exception-injection and unfinished-game checks. The four earlier MO regression seeds, 931003, 932003, 933005 and 934000, finish with no false planned MO credit. Eight native-rule boundary groups pass, covering setup, scoring, automatic victory, exhausted reserves, loss allocation, supply and directional Ties. Seed 981000 also finishes with decision-time access to the opponent's hand, either strategy deck and engine RNG made fatal; no forbidden read occurs.

These focused checks do not exhaust the underlying rules engine or every event interaction.

## 4. Confirmed remaining findings

### GS-06 addendum - Salonika bypasses the printed contact restriction

**Severity: Medium.** This keeps the event-choice finding partially open.

**Player impact:** the simulator can pull a corps away from an enemy contact despite the printed instruction never to send a corps in contact. A person following the booklet would make a different decision. This is also a counterexample to treating zero generic decisions as a universal property of v0.7.3.

**Expected:** booklet section 9, Event choices, Salonika: Reserve Box first, then corps out of contact; never a corps in contact. Generic fallback must not override that policy.

**Reached reproduction:** fresh self-play seed **1080055**, Allied turn **16**, action round **5**, decision **2992** (zero-based), Staff card **12**, Hold/Ops/South. At the initial Salonika transfer, the only offered piece is **British corps 158 at Alexandria**, in contact with **TU SNc 126 in Libya**. The engine offers `piece: [158]` and Undo, with no Done yet. The evidence contains the full reached engine state and current Staff card in `salonika-reached-1080055.json`.

**Observed:** `s_salonika` filters out that corps, returns null, and `Bot.decide` records `nochoice:salonika` before fallback chooses `['piece',158]`. The corps transfers. A small isolated position, starting before event selection, reproduces the same path with a corps at Port Said and an enemy at Sinai. The event is selected normally; it is not necessary to force the handler directly.

**Source:** `sim/bot.js:1191` and `:1194` (no allowed piece and no Done); `sim/bot.js:74` (fallback); event selection at `sim/bot.js:520`. The pinned engine offers Done only after at least one transfer, in `engine/rules.js:9566`.

**Smallest proposed fix:** before selecting Salonika as an event, require at least one legal transfer candidate in the Reserve Box or out of contact. If none exists, continue the ordinary action-round procedure and retain the card for another use. Print that condition in section 9 so paper and code agree. Keep the handler's contact filter. Add the isolated and reached positions as regressions. This preserves the existing engine and the bot's printed restriction.

**Rules question, separate from the confirmed mismatch:** whether the current physical card permits playing Salonika with zero transfers should be checked against its current face before changing the engine's minimum-transfer behavior. The observed transfer is engine-legal; the defect is that it violates the bot's stated policy.

**Runnable evidence:** `GS_ROOT=/path/to/checkout node evidence/event-boundaries.cjs`. The script asserts the observed v0.7.3 defect and its controls, retains both positions, and completes the reached campaign.

### GS-15 - latest-front event choices reverse the Staff Tie

**Severity: Low.** New paper/code mismatch.

**Player impact:** two operators following the booklet and simulator can remove or redeploy different corps when the eligible units are on the same front. It changes the deterministic bot choice; no strength effect has been measured.

**Expected:** section 1 says equal choices use the current North/South Tie. Section 9 gives War in Africa and Salonika a preference for the latest front. Once the front ranks are equal, the ordinary Tie still applies.

**Exact reproduction:** two equal full British corps, **156 at Port Said** and **157 at Alexandria**, both out of contact on the Near East front; no eligible Reserve Box corps. Use a Staff card with Tie North. At either event choice, Port Said is north of Alexandria (map y 1534 versus 1560), so corps 156 is the printed choice.

**Observed:** the bot chooses corps **157 at Alexandria**. With Tie South it chooses **156 at Port Said**. The independent script reproduces all four event/Tie combinations. Reserve Box controls still work.

**Source:** `sim/bot.js:1186` and `:1195`. Calling `.reverse()` on `byFrontThenTie(...)` reverses both the front ordering and the within-front Tie.

**Smallest proposed fix:** sort latest front first while preserving the current Tie within that front. Reverse the front comparison only; do not reverse the completed ordered list. State the within-front Tie explicitly in the two event rows and add North/South controls.

**Evidence:** `event-boundaries.cjs` and `event-boundaries-results.json`.

## 5. Strength and balance evidence

Fresh strict evaluation used the unmodified released code:

```sh
cd sim
STRICT=1 node final_eval.js self 120 1080000 > fresh-self-120.json
```

| Measure | Independent result |
|---|---|
| Completed campaigns | 120 of 120 |
| Decisions | 374,567 |
| Allied / CP wins | 106 / 14, or 88.3% / 11.7% |
| Decision exceptions / unfinished games | 0 / 0 |
| Rule-violation resets | 0 |
| Choices passed to generic fallback | 1, the reached Salonika case |

The Allied share has an approximate 95% Wilson interval of 81-93%, compatible with the reported 84%. This is a fresh batch, not a rerun of Claude's 600 seeds. The exact reported 90-95% Allied and 49-56% CP results against v0.7, the 740-game health total, and the handicap table were not independently rerun. The repository contains their summary tables and scripts, but not those original seed-level result files.

The event-operation fix is real in the source: `s_activate_spaces` now stores the plan it builds, so subsequent movement can follow it. The published ablation labelled legal groups also disables step capacity and the first-step check together. Its 6-8 point difference measures that bundle; it does not isolate attack grouping alone. One-at-a-time ablations can also interact, so the reported gains should not be added as independent contributions.

The reported roughly five-VP bot-versus-bot correction is consistent with its published table (starting VP 15 gives 53%/47% on that batch). Treat 1-3 VP against a person as an initial playtest setting; these simulations do not establish human win rates. The marked Allied advantage remains a balance/tuning issue, rather than evidence that both bots are weak.

## 6. Companion, print and usability limits

The downloadable companion's functional checks pass. The supplied hosted artifact link opens a **Sign in to view this page** screen in the available browser, so hosted-file parity was not verified. A local real-browser, real-phone or accessibility pass was not performed in this re-audit. The companion tests use its actual script and small DOM/storage doubles.

The turn/round/MO/RP tracker, New deck, mandatory-MO verdict, disabled empty-fort fields and visible failed-save warning are present and tested. Export/import, a planning scratchpad and an offline rules/glossary remain optional next work, as the response acknowledges. Export/import is the most useful next recovery improvement; keyboard/accessibility checks and repeated print-table headers/page numbers would also help. Timed physical playtests remain the appropriate next strength and workload check.

## 7. Release verdict

**Hold audit closure for the Salonika correction and the event Tie fix.** The original print defect, calculator errors, illegal attack-group estimate, abandoned-move reproduction, damaged-session cases and reshuffle Undo are corrected. The new reached Salonika case and four directional event comparisons prevent a clean all-nine-closed verdict. After those small corrections, rerun these positions and the shipped regressions, then check fresh strict games for any remaining generic decisions. No production files were modified for this review.
