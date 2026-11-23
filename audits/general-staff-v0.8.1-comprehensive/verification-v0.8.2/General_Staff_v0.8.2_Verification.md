# General Staff v0.8.2 — Audit Fix Verification

22 November 2026 · Codex · branch `claude-bot`

**The two Medium findings from the v0.8.1 audit are closed. Q01 is resolved consistently.** The original import and tie reproductions now produce the expected results, the four HTML outputs rebuild byte for byte, and the published result summaries reconcile with their per-seed records. Two new **Low** companion boundary issues remain; they do not reopen the bot-policy findings.

Reviewed head: **`50dd24589968c88dd115a3afa48d5da3e70f99b2`**. Playing-code commit: `dba0de2ff37d86f678fe506e9dee5dd2e88423dc`. The playing files are unchanged between that stamped evidence commit and the release head; the usability changes and regenerated materials followed in `6b5e527`. This is a targeted patch verification, building on the preceding comprehensive audit and its rules baseline.

## Closed findings and usability changes

| Item | Independent verification | Status |
|---|---|---|
| A01, Import Undo | Different side/commitment, old deck/card/tracker and original history restore together. Further Undos follow the recipient. Reload, two imports, intervening draws and tracker changes, old saves and failed writes checked. | Closed |
| A02, Forward | Real North/South cards choose Verdun/Nancy in the original equal-distance position; full-stack control still excludes Verdun. | Closed |
| A02, SR and RP | Original legal engine positions choose Berlin for North and Stuttgart for South; actions applied through the engine. | Closed |
| Additional losses/advance review | Cross-space loss tests pass. Four equal armies from Metz/Strasbourg compete for three advance places: the real handler selects the North/South groups correctly and advances exactly three. | Correct |
| Q01, Reserve Box | Actual SR handler prefers a Reserve Box corps to an equal map corps under both Ties. An affordable army still outranks a Reserve Box corps. Rules §7.2 and the reference agree. | Resolved |
| Combined round/draw | Round 5 to 6, exhausted-deck reshuffle and exact one-Undo restoration pass. See B01 for round 6. | Implemented; Low boundary issue |
| Manual turn and Clear attack | Changing the turn clears MO/RP; changing only the round keeps them. Clear attack restores the calculator's initial inputs. | Implemented |
| Print usability | Booklet says 0.8.2; event-table headers repeat on reference pages 5 and 7; reference remains seven pages. | Implemented |

All **56 shipped companion checks**, **11 tie checks**, and the multinational, event-choice, siege, movement and priority suites pass. The independent calculator test passes **13,080 cases** and ten complete Staff-deck cycles with reloads and Undo. The PDF checker and **23 independent PDF mutation controls** pass.

The targeted policy test adds a genuine multi-origin advance execution; the shipped tie suite's “advance order” coverage otherwise checks the helper comparator rather than exercising that advance handler. The independent execution passes, so this is a coverage observation, not a defect.

## Build and printed packet

A separate worktree at the audited head ran `node app/build_app.js` and `NO_PDF=1 node print/build.js`. All four generated HTML files match the release exactly.

| Output | Bytes | SHA-256 |
|---|---:|---|
| Companion | 35,902 | `99bec46fc6c838f4c67a0b95649e7ab074d250d930842c3cd5a6a667616b3c4b` |
| Rules HTML | 33,389 | `7e5fcd7c87d38ca10b6a036991bb87ddf3391415cd2dcbfa1e5c45343516b4f3` |
| Reference HTML | 29,470 | `d8364aac3ff8c0083420b9eb55eb36d1827483a00bd8c16f76758dca28578159` |
| Staff HTML | 15,418 | `ea8b514481f8051ac12588f4324a71fd75989aed7fd98e5b981ac48d835b181d` |

The shipped PDFs were rendered. The revised rules pages, both columns of reference page 1, reference page 2, continuation headers and all 18 card faces were visually checked. A geometry scan found no off-page text in any of the **24 pages**: 11 rules, 7 reference, 6 cards/backs. Table parity compares 36 front cells, 110 event rows, 10 objective rows and 19 expected-hit columns. The new Reserve Box wording is present in the actual reference PDF, not only its source HTML.

This environment has no Chrome runtime. The author's headless rendering and private claude.ai republication are not independently verified here. Script tests use the shipped HTML's actual callbacks with DOM/storage doubles; they do not establish mobile layout, accessibility or real-browser persistence. No Cloudflare check is applicable. The worksheet remains an optional physical-playtest task.

## Published results and direct replay

The four paired comparisons have 300 matching seeds each. Recounting gives:

| Bot and seeds | Before wins | v0.8.2 wins | Gained / lost | Exact paired p |
|---|---:|---:|---|---:|
| CP, 6001–6300 | 221 | 219 | 55 / 57 | 0.925 |
| CP, 7001–7300 | 221 | 211 | 58 / 68 | 0.423 |
| Allies, 6001–6300 | 276 | 283 | 23 / 16 | 0.337 |
| Allies, 7001–7300 | 281 | 285 | 17 / 13 | 0.585 |

These agree with the response. There is no statistically significant paired change at the usual 5% threshold. This does not prove equal strength. Self-play **439 Allied / 161 CP** is on a different seed range from v0.8.0's 414/186; that comparison is not paired.

The published **740-game health count** reconciles: no unfinished games, exceptions, errors, rule resets, bot supply breaches, abandoned moves, called-off attacks, Salonika safety transfers or fallback choices. The one random opponent supply step is correctly separate. The 150-game handicap cells recount to CP wins **45, 53, 60, 70, 81 and 93** for shifts 0 through 5, supporting the stated three-to-four VP crossover. All these result files identify clean playing-code commit `dba0de2` and the same pinned engine/hook as the prior audit.

I directly replayed **20 published stock games, seeds 1200000–1200019**. Their entire per-game output records match exactly, including decision counts, activity, milestones and health—not just winners. This involved **53,635 decisions**.

I also ran **60 fresh stock games, seeds 3500000–3500059**, with hidden-information guards, legal-offer checks, complete Staff-cycle checks, a VP ledger and movement-supply checks. All finished: **182,664 decisions**, no exceptions, rule resets, generic fallbacks or supply breaches. Outcomes were 50 Allied / 10 CP; this small health batch is not a new balance estimate or a replacement for the 600-game study. Total directly executed here: **80 games / 236,299 decisions**, plus the focused tests.

## New Low findings

### B01 — Next round + draw consumes a seventh card while still showing round 6

**Impact.** At the end of a turn, the new combined control can replace the current Staff card without advancing to a valid next action round. The displayed turn/round then conceals the extra draw, potentially changing the priorities used for reactions or turn-end decisions. Undo restores it exactly.

**Expected.** General Staff §3 draws one Staff card at the start of each of the six bot action rounds. A control labelled “Next round + draw” should stop when no next round remains in the current turn, or explicitly handle the turn transition. The ordinary Draw control remains available for deliberate corrections.

**Reproduction.** In a new session, draw for round 1, then press Next round + draw five times. It shows turn 1, round 6, six discarded cards. Press it once more. It still shows turn 1, round 6 but has **seven** discarded cards and a new current card. The button is enabled. Round 5 to 6 and single-Undo recovery are passing controls.

**Source.** `app/build_app.js:222`, shipped `app/General_Staff_Companion.html:191`: the round is clamped to 6 but `drawCard()` runs unconditionally.

**Smallest fix.** Disable the combined button at round 6 and guard its handler before taking a snapshot or drawing. Enable it again when Next turn resets the round to 1. Do not automatically skip the physical game's intervening phases. Test round 5, round 6, next-turn re-enabling, Undo and reload.

### B02 — Repeated imports make serialized Undo history grow exponentially

**Impact.** Repeated device transfers or repeated Import clicks can create megabytes of save/export data without adding game history. Eventually browser persistence can fail, leaving the latest changes only in memory. The existing “Not saved” warning appears; the precise real-browser storage limit was not measured here.

**Expected.** Preserving previous sessions should add a bounded or roughly linear amount of Undo data per import. It should not repeatedly escape every older JSON string. The ordinary 30-step history cap does not bound the depth of nested import sessions.

**Reproduction.** Start a recipient session and draw once. Export another ordinary one-draw session. Repeatedly import the same donor text without undoing. The deterministic callback test measures the saved session at **588 characters after one import**, **104,273 after ten**, **3,279,498 after fifteen**, and **6,556,463 after sixteen**. There is still only one top-level Undo entry; it recursively contains every earlier import as an escaped JSON string.

In a storage double with an explicit **5,242,880-character** cap, import 16 fails to persist and displays the existing warning. Reload reads the 15-import checkpoint. This is a synthetic quota reproduction, not a claim about a measured Chrome quota. One and two imports, full-session Undo and reload all work, which is why A01 remains closed.

**Source.** `app/build_app.js:240–242`, shipped HTML `:209–211`: `prev` includes `S.hist`, and the entire import step is JSON-stringified into another history string. Each later Import adds another escaping layer. Recursive history validation is at `app/build_app.js:146–156`.

**Smallest useful fix.** Store typed import checkpoints as structured objects, serializing the overall session once; continue accepting legacy string snapshots during load. Adapt validation/Undo to both forms. Keep a documented history bound that includes import checkpoints. Test 20 successive imports for roughly linear size, two successive Undos, old saved formats and reload. Avoid fixing size by silently breaking the newly restored two-import Undo behavior.

## Verdict and follow-up

**Close A01, A02 and Q01.** The reported fixes and result totals are verified. Address B01 and B02 in a small companion follow-up; they do not require a new bot-strength study. The bot-policy and printed-rule corrections are suitable for continued playtesting. No Medium or higher issue was confirmed in this targeted verification. Physical playtesting and an independently exercised live browser remain useful coverage gaps.

Evidence scripts and compact results accompany this report. The evidence ZIP also contains the fresh per-game records and replay outputs. Production files were not changed by this verification.
