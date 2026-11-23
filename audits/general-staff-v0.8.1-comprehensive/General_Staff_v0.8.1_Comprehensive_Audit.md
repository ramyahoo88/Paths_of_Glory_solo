# General Staff v0.8.1 — Comprehensive Audit

22 November 2026 · Paths of Glory solo system · Codex

**Verdict: make a small corrective release before treating v0.8.1 as complete.** The release rebuilds exactly, the printed packet is intact, and the previous reference-sheet and per-card checker fixes remain closed. This audit confirms **two Medium findings**: incomplete Undo after importing a companion session, and missing Staff tie-breaks in three simulator decisions. No High or Critical finding was confirmed. The system remains suitable for labelled playtesting, with the limitations below.

The audit ran **240 fresh games and 680,057 decisions**. All finished without decision exceptions, illegal-choice fallbacks, rule-violation resets, or bot movement out of supply. A separate 100-game stock batch produced **71 Allied wins / 29 CP wins**, consistent with the published 69/31 split. These clean health checks do not detect every difference between the simulator and the printed bot; finding A02 demonstrates that distinction.

Only audit documents, fixtures and evidence were added. The production bot, companion, rules and release files were not modified.

## 1. Release and rules baseline

Repository: `ramyahoo88/Paths_of_Glory_solo`; branch: `claude-bot`; audited head: **`1973dd811d4aa8e6ed45a668d96a4245b425a329`**. This is v0.8.1, including the per-card checker change `04a4734`. The only difference in `sim/bot.js` from the v0.8.0 release commit `569bdc7` is a comment explaining CP front order. The v0.8.0 playing behavior remains in force.

The declared scenario is **Deluxe Historical, full campaign, standard 110 strategy cards, no optional cards**. General Staff's booklet, reference sheets and 18 Staff cards establish the bot's policy. GMT's current product page links the **August 2022 Deluxe Living Rules**, although the link is labelled June 2023, and the 2022 War Status/VP player aid. Those are the native-game baseline. The older provisional-rule page is historical background, not an override of the current linked rules. No additional agreed variant was supplied; tests use no VP handicap.

Primary sources consulted:

- [GMT product and living-rules links](https://www.gmtgames.com/p-1182-paths-of-glory-deluxe-edition-3rd-printing.aspx).
- [Deluxe Living Rules, August 2022](https://gmtwebsiteassets.s3.us-west-2.amazonaws.com/nnpg/PoG-DeluxeRules2022Final.pdf): Historical setup and victory, card use, movement, multinational combat, losses, retreat/advance, SR, supply and replacements. Relevant original layouts and both columns were inspected, including the combat examples.
- [War Status and Victory Point player aid](https://gmtwebsiteassets.s3.us-west-2.amazonaws.com/nnpg/POG_PAC_WarStatus_2022.pdf): both pages inspected.
- [Older provisional changes](https://www.gmtgames.com/nnpg/pog_rule_change.html), cross-checked against the current baseline.

The simulation engine is Rally the Troops Paths of Glory at **`c58b0b4a33e227faf73cbe561f3bede17087a142`**, with this repository's documented hook. Runtime: Node **24.22.3**, Python **3.12.14**. The companion is an aid for the physical game, not a complete game engine. Older applications under `gpt_handoff/` are separate products and outside this audit. There is no Cloudflare deployment to verify. The private claude.ai companion was not accessible; no claim of live/private-page identity is made.

## 2. Confirmed findings

### A01 — Medium: importing a session cannot be fully undone

**Player impact.** Cancelling an accidental import can leave the original deck using the other side's thresholds, front table and event list. Continuing to Undo can then jump into the donor session's history instead of returning through the original session. This occurs through normal controls; it does not require a damaged save.

**Expected behavior.** Undoing Import should restore the recipient session coherently: deck, current card, tracker, side, commitment and its previous Undo chain. The interface explicitly offers Undo back to the previous deck and tracker, and the restored deck must be interpreted using its original bot context.

**Reproduction A: wrong side and commitment.**

1. Start a CP/Mobilization session and draw a Staff card.
2. In another session, choose Allies/Total War, draw, and Export.
3. Import that text into the first session, then press Undo.
4. The old card, deck and tracker return, but the controls still say Allies/Total War.

The deterministic harness draws card **9**, Hold. Before the import its threshold is **CP +2.25**; after Undo it is **Allies +2.5**. The unchanged old card now gives a different attack decision for scores between those thresholds. A same-side, same-commitment import is the passing control.

**Reproduction B: wrong Undo history.** Start a recipient session with two draws and a donor with four. Import the donor; Undo once returns to the recipient's two draws. Undo again should return to its first draw. Instead it enters the donor's three-draw state. The failure also occurs when both sessions use the same side and commitment.

**Cause/source.** `app/build_app.js:210` snapshots only deck, discard, current card and tracker. The Undo handler at **line 216** restores only those fields. Import at **line 229** changes side/commitment and replaces the previous history with the donor's history plus just one recipient snapshot. The shipped equivalents are `app/General_Staff_Companion.html:179`, **185**, and **198**.

**Smallest useful fix.** Make the import rollback record contain the recipient's complete session, including its previous history, and recognize that record in Undo. Restore side and commitment along with the deck and tracker. Keep old ordinary deck snapshots loadable. A typed import snapshot avoids recursively storing a full history on every ordinary draw. Rebuild the companion; add assertions for different-context import, two successive Undos, reload after import, and a second import.

**Evidence.** `evidence/companion-expanded.cjs` invokes the actual shipped script's control callbacks with DOM/storage doubles. `companion-expanded-results.json` records both reproductions and the passing control. These are script/control tests, not a live-browser test. The script asserts the current defective behavior so that the evidence is reproducible; a passing reproduction is not a fix.

### A02 — Medium: three simulator decisions ignore the printed Staff Tie

**Player impact.** A paper operator and the simulator can move or rebuild different units from the same position and Staff card. The choices remain legal in Paths of Glory, but the resulting board positions differ, weakening exact claims that the simulations execute the printed bot. No changed winner or size of balance effect is claimed.

**Expected rule.** General Staff's introduction (`bot/General_Staff_Rules.md:7`) uses the Staff Tie for equal choices. §1 defines North/South; §2's operator-choice exception applies to equally ranked units **in the same space**, not different spaces. The specific priorities in §6, §7.2 and §9 still come first.

| Case | Small setup and expected choice | Observed result |
|---|---|---|
| Forward destination | Allied rear stack in Bar le Duc; Metz is the West Objective. Verdun and Nancy each hold two Allied units and are in contact. Both have weighted distance 1.5. Actual Staff card 6 is Hold/South, so choose Nancy. | Chooses Verdun. Card 3, Hold/North, correctly chooses Verdun. |
| SR unit | One GE corps in Stuttgart and one in Berlin; no enemies nearby, both supplied and eligible; 1 SR point remains. Staff card 1 is North, so choose Berlin. | Chooses Stuttgart, the lower piece ID. Card 4/South correctly chooses Stuttgart. |
| Replacement unit | Reduced GE 1 in Stuttgart and reduced GE 2 in Berlin; both supplied, neither in contact; 1 GE RP remains. Staff card 1/North should repair Berlin. | Repairs Stuttgart. Card 4/South correctly repairs Stuttgart. |

**Exact reproduction.** Run `focused-policy.cjs` against the pinned checkout. The full engine states are `forward-tie.json`, `sr-tie.json` and `rp-tie.json`. The Forward fixture starts from Historical unit placements with turn/active side set for the isolated decision; the other two deliberately isolate the named units. They are focused synthetic positions, not claimed naturally occurring seed positions. Fixture seeds identify deterministic setup. In the Forward control, filling Verdun to three units makes the simulator select Nancy, confirming that capacity works and the missing tie-break is the issue. SR and RP tests check the engine's actual legal offers and apply the selected action.

For Forward, both distances are `1 + 0.5 × 1 = 1.5`; Verdun is north of Nancy. The main failing case uses the real South Staff card 6, and the North control uses real card 3. Both put West first at Allied Mobilization, so the front is unchanged.

**Cause/source.**

- **`sim/bot.js:518`** updates the Forward target only for a strictly smaller weighted distance; equal distances retain the first numeric map ID.
- **`sim/bot.js:1153`** sorts SR candidates by cost alone, retaining piece order among equal costs.
- **`sim/bot.js:1183`** sorts replacement candidates by the priority value alone, again retaining piece order.

**Smallest useful fix.** Add `this.tie(candidateSpace, currentBest)` for equal Forward distances. Add the Staff Tie on unit locations after the existing SR and replacement ranking keys, retaining a deterministic identity choice for equal units in the same space. Define off-map SR ties explicitly before extending this to Reserve Box comparisons; see Q01. Add North/South and changed-priority controls. Review neighboring cross-space unit sorts for the same omission, without changing their primary priorities.

This is a new adjacent-case finding. The earlier attack-origin and siege-roll tie fixes pass; their closure is not reversed. The printed rules and cards do not require a balance change to resolve A02. After changing the simulator, use matched seeds and fresh confirmation before updating any published win-rate claim.

## 3. Release build and printed materials

A separate worktree at the exact audited commit rebuilt the companion with `node app/build_app.js` and the printable HTML with `NO_PDF=1 node print/build.js`. **All four outputs are byte-identical** to the shipped files.

| Artifact | Bytes | Result |
|---|---:|---|
| Companion HTML | 33,820 | Identical |
| Rules HTML | 33,143 | Identical |
| Reference HTML | 29,398 | Identical |
| Staff-card HTML | 15,418 | Identical |

Companion SHA-256: **`e76f9c646277ebc60c9bdd3278509d3e77f2f47ce7be920d42eb393e9e7f5393`**. All other hashes and source hashes are in `build.json` and `source-manifest.json`.

I rendered and read **all 24 shipped PDF pages**: 11 rules pages, 7 reference pages and 6 Staff-card pages. This included both columns of reference page 1, every table column, all 18 card faces and the three back pages. No clipped or off-page text block was found. The card faces and backs remain six per Letter page, with the intended alternating duplex arrangement. This was a screen inspection, not a physical printer alignment test.

Parity checks compared **36 front-table cells, 110 event-priority rows, 10 objective rows and 19 expected-hit columns** between the reference HTML and companion data; they agree. The full printed bot procedure was checked against the policy code, producing A02. The packet's event priorities are bot design choices; this comparison is not an independent verification of every official strategy-card event implementation.

The reference page-2 CP thresholds are **+0.75 / +1.5 / +2.25**, and the West-first statement is present. `print/check_print.py` passes. The independent PyMuPDF verifier passes **23 controls**: current files; the old reference with exactly two stale page-2 lines; deletion on each of the 18 cards; a stale threshold; a wrong Stance; and a duplicate threshold. The original `print/test_check_print.py` requires Chrome, which is absent here, so its HTML-to-PDF mutation route was not run. The broader independent PDF mutations were run directly on PDF copies.

## 4. Games, boundaries and hidden information

### Fresh campaign coverage

The stock batch uses seeds **3400000–3400099**. Seven matched 20-game batches use **3410000–3410019**, changing one side's policy at a time. That makes 240 game configurations. Two of those games were also replayed with full traces; they are not counted again.

| Policy changed from stock | Allied wins | CP wins |
|---|---:|---:|
| Neither side, separate stock batch (100) | 71 | 29 |
| Neither side, matched baseline (20) | 14 | 6 |
| Allied pressure policy (20) | 16 | 4 |
| CP pressure policy (20) | 17 | 3 |
| Allied preservation policy (20) | 7 | 13 |
| CP preservation policy (20) | 19 | 1 |
| Allied exploitation policy (20) | 12 | 8 |
| CP exploitation policy (20) | 15 | 5 |

Pressure fixes the experimental policy to Assault/Ops. Preservation uses Hold/Logistics and earlier RP spending. Exploitation uses Assault/Ops, removes the attack shortlist limit, prepares MOs, fills line gaps and increases empty-space capture value. These are purposeful automated stress policies, not independent human players. They share the engine and much of the bot's implementation. The 20-game cells are too small to establish strategy rankings, and no tuning recommendation is made from them. No promising policy change is adopted or claimed confirmed.

The separate stock batch is a fresh check of the released behavior, not a new old-versus-new comparison. Its CP result is 29%, with a roughly **21%–39% Wilson 95% interval**. The preceding v0.8.0 audit's matched 200-seed improvement result remains relevant because gameplay code has not changed; this audit does not count that old evidence as newly run games or as proof of strength against humans.

All **680,057** decisions completed without an exception or illegal-choice fallback. The 140-game audit harness additionally checked each action against the engine's offered actions, every complete 18-card Staff cycle for uniqueness, and **389,930 VP-log transitions**. Its guard prevented policy reads of the opponent's hand, either strategy draw pile and engine RNG state at every decision. These fields were non-enumerable during the decision so the supply helper's board clone omitted them; the engine received the original fields again before applying the action. This tests hidden-information independence on the exercised paths, not a formal proof of all branches.

There were zero rule-violation resets, zero generic choice fallbacks and zero bot movement supply breaches in all batches. The guarded runs exercised **41 decision-state types**, including Withdrawal, neutral entry, replacements, retreat cancellation, overstack-related retreat elimination, event trenches, Salonika, Kerensky and Brusilov. They reached automatic victories, turn-limit endings and armistices for both sides. Merely exercising a state does not independently validate every rule inside that state.

### Representative play and scoring

Seed **3410001** was replayed from Historical setup through turn 20: **3,113 decisions**, final Allied victory at **VP 1**. I followed its opening through the printed event priorities, default pre-draw stance, combat-card policy, losses, retreat and advance. Examples checked against the tables:

- CP opens with forced Guns of August, regardless of Staff Plan.
- The first battle is 15 attacking CF against 3 defending CF. The recorded dice produce 4 and 3 loss numbers. Withdrawal restores the French army's lost step and requires its retreat; the reduced German army does not advance.
- Blockade wins the Allied urgent-event tie over Rape of Belgium by lower card number; CP then plays Reichstag Truce. The VP changes reconcile with the public events and capture.
- The Allied round-4 offensive satisfies its MO. The trace retains the attacking units, dice, losses and resulting advances for checking the later decisions.

The other full trace, seed **3410000**, reaches a CP automatic victory on turn 15, **VP 21**, after **2,517 decisions**. For both traces, final VP was independently reconstructed from initial VP, final space control, recorded scoring events, missed MOs and applicable Historical adjustments, without calling the engine's victory function:

| Component | Seed 3410000 | Seed 3410001 |
|---|---:|---:|
| Initial VP | 10 | 10 |
| Net controlled VP spaces | +16 | −2 |
| Scoring events | −5 | −8 |
| Net missed MO adjustment | 0 | +1 |
| Historical end adjustment | 0 | 0 |
| Reconstructed final VP | **21** | **1** |

The event ledger is taken from engine state and checked against the trace; this is an independent total and winner calculation, not an independently written implementation of every scoring event.

**21 focused scoring controls pass**, covering the 12/13 normal threshold, 10/11 Brest-Litovsk threshold, Historical draw handling, unplayed US army events, the no-Tsar adjustment changing the winner, and both automatic-victory boundaries. The automatic tests distinguish reaching the VP boundary during an action from checking it at War Status, and confirm that automatic victories do not receive the ordinary end adjustment.

### Previous fixes and nearby controls

The shipped companion's **40 tests**, including **108 card/side/commitment displays**, pass. Its expanded audit checks **13,080 calculator cases**, ten complete deck cycles with reload after every draw, reshuffle Undo and new-deck Undo. The current thresholds, occupied 0-CF defence, empty-fort inputs, exact equality and last-chance MO behavior pass. The expanded tests reproduce A01 separately.

The multinational, event-choice, siege, movement and priority regressions pass. In particular: an illegal mixed-nationality group is excluded; the Serbian supply-loss fixture stops the unsafe move while the opened-route control permits it; two corps can be gathered for a level-2 fort while one cannot; besiegers retain a legal force; Brusilov is used once when eligible; and the prior attack-origin and siege-order ties behave correctly. The damaged commitment names `constructor`, `__proto__` and `toString` are rejected with a recovery notice.

One suspected capture-priority mismatch was rejected after rereading the rendered rule. The rule prefers a destination nearer the Objective **than the origin is**, then uses Tie; it does not require the globally closest destination among all adjacent spaces. The passing North/South fixture is retained as a useful control, not a finding.

## 5. Usability and tabletop workload

These are optional improvements, not confirmed rules defects. No human timing or physical playtest was performed.

| Priority | Recommendation | Evidence and benefit |
|---|---|---|
| First | Add a one-page attack/move worksheet or optional calculator shortlist | The paper procedure requires recurring CF comparisons, front/objective lookups, distance checks and bonus arithmetic. A reusable target/CF/Edge/bonus/OPS grid would preserve the paper bot while reducing repeated transcription. |
| First | Offer a single “Next round and draw” action with one Undo | The current separate Next round and Draw controls can drift apart. A full 20-turn game has 100 within-turn transitions between bot rounds; a combined action could remove 100 button presses. Keep standalone Draw available for corrections. |
| Next | Make manual turn editing distinct from advancing the turn | Next turn correctly clears MO/RP flags; typing a different turn retains them. Label the latter as a correction, or give explicit reset behavior, so a stale “MO met” flag does not silently hide reminders. |
| Next | Add “Clear attack” and a visible reminder that the MO calculator setting is independent | Bonuses and MO selection persist when advancing the tracker or drawing. A reset control and clear status reduce carrying the previous attack's bonuses into the next calculation. Do not infer that every attack meets the MO. |
| Later | Repeat event-table headers and identify the bot rules revision separately from packet version | Reference pages 5 and 7 continue tables without their own headers. The booklet says 0.8.0 while the packet/app says 0.8.1, which is consistent with unchanged rules but can look stale. An explicit “rules unchanged from 0.8.0” note would help. |

The 20 stock matched games averaged **1.25 planning passes, 20.26 Edge evaluations and 51.60 move-list entries per Allied action-round decision**; CP averaged **1.29, 21.06 and 49.75**. These are instrumented simulator calls, including repeated work and discarded candidates. They are not counts of mandatory human lookups or estimates of minutes. A paper operator can cache unchanged information. Nevertheless, the counts identify where a worksheet and clearer workflow are likely to help more than cosmetic changes.

### Q01 — Design clarification: SR ties involving the Reserve Box

§7.2 puts Reserve Box units and distant map units in the same later SR group, with armies before corps. The global North/South Tie has no defined geographic meaning for an off-map Reserve Box versus a map space. Decide whether Reserve Box units come first, last, or are an operator choice when all stated priorities tie. Document the choice before applying the A02 unit-location comparator to off-map candidates. This is a paper-policy ambiguity, not a claim of an illegal action or a proposed balance improvement already tested.

## 6. Limits, priorities and final verdict

**Directly tested:** separate rebuild and hashes; every shipped PDF page; all bot cards; printed/companion tables; shipped script callbacks and storage doubles; 240 fresh campaigns; two full traces; independent final score totals; focused movement, scoring, hidden-information and recovery checks.

**Not directly tested:** the private claude.ai publication; a live browser interaction, mobile layout or accessibility tree; physical printer alignment; a human tabletop session; every official strategy-card implementation; a separate native-game rules engine. The cloud browser rejected the local file URL under its security policy, and an installed Chrome runtime was unavailable. No browser-rendering or live deployment claim is inferred from script tests. PDFs were inspected from their shipped rendered pages. New PDF generation was not verified byte for byte; HTML generation was.

**Fix order:** A01's import rollback first; A02's three confirmed tie-break omissions next, with Q01 clarified for off-map SR choices. Re-run the focused tests, current regressions and matched/fresh simulation checks appropriate to the tie changes. Keep all existing reference/checker fixes. Then consider the worksheet and round/draw workflow improvements, and conduct physical playtests—especially attempts to punish the CP bot's reduced attention to the East.

**Release verdict:** v0.8.1 has reproducible builds, intact printables and strong regression evidence, but two confirmed consistency defects remain. A small patch is warranted before calling the audit closed. The evidence supports continued playtesting and the earlier CP improvement; it does not establish human-level balance or exact paper/simulator identity until A02 is corrected.
