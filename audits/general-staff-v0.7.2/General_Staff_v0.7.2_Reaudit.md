# General Staff v0.7.2 re-audit

Reviewed `ramyahoo88/Paths_of_Glory_solo`, branch `claude-bot`, commit `87e7b3911e507713b57ed2fce1763e11200eee8e`, on 22 November 2026. This is an independent recheck of GS-01 through GS-05 and a focused investigation of the remaining event defaults and movement resets. The engine is Rally the Troops Paths of Glory at the repository's pinned revision `c58b0b4`, with the supplied hook.

**Verdict.** The five original findings are resolved within the checks below. Retain those fixes. Before treating simulation results as a test of the complete printed bot, implement the remaining event decisions, align the event-trench handler with the booklet, and stop abandoned movement from re-entering the generic fallback. These changes concern bot decisions and simulation fidelity. They require no change to the native game rules.

## Original findings

| ID | Result | Independent evidence |
| --- | --- | --- |
| GS-01, mandate credit | Pass | Replaying all four affected seeds finds zero selected plans with invalid MO credit, down from five. Twenty-four fresh campaigns also contain no flagged planning mismatch. Source inspection confirms the selected-force check and resolution check. |
| GS-02, zero-CF defender | Pass | The original Allied Hold example displays Edge +2.2 and rejects the attack. The empty-fort option uses the Corps table and ignores trench effects, including when the defender-army checkbox remains selected. |
| GS-03, arithmetic precision | Pass | Simulator, companion and print builder use the same one-decimal expected-hit function. The original 9-CF versus 12-CF example displays Score +0.05 and accepts the attack. The companion passed 864 table, CF, terrain and trench combinations against the printed-table calculation. Threshold equality is accepted. |
| GS-04, evaluation reporting | Pass | An injected decision exception is recorded in ordinary mode. Strict mode stops with the exception and state/turn in the error. A forced step-cap exit is marked incomplete. The evaluator retains fallback and repair counters. |
| GS-05, engine link | Pass within stated scope | The reviewed Git tree no longer tracks `engine`. The setup script replaces a dangling engine link and creates a regular directory. Isolated local-cache fixtures passed with an absent directory and a dangling link, each run twice. A fresh network clone was not repeated. |

Thirteen source inputs used by this review were checked against their Git blob hashes in the reviewed tree. Rebuilding the companion produced a byte-identical file, SHA-256 `fb16bccdcd2d46c383e456552dab4468d04db8d61303fd0696738cebebd574de`. The calculator fixture executes that committed page's JavaScript with a simulated DOM. It is not a visual browser test. Generated PDF rendering and the hosted Claude artifact were not checked.

## Fresh campaign check

I ran 24 fresh, full Historical campaigns using the shipped bot on both sides. The review loop stops on an exception, checks every returned action against the engine's offered actions, and requires game over before the 60,000-step cap. It does not substitute a decision after an exception.

Seeds are 951000–951005, 952000–952005, 953000–953005 and 954000–954005.

| Diagnostic | Result |
| --- | --- |
| Completed campaigns | 24 of 24 |
| Uncaught decision exceptions or unoffered actions | 0 |
| MO flags failing the selected-force check | 0 |
| Allied / Central Powers wins | 18 / 6 |
| Movement-violation resets | 1, in seed 951000 |
| Decisions without a named state handler | 392 |
| Of those, decisions with multiple offered options | 255 |
| Of those, single-option acknowledgements | 137 |

The 18/24 Allied result is a diagnostic sample, with an approximate 95% Wilson interval of 55%–88%. It cannot establish a change from Claude's reported 67% in 600 games. I did not rerun those 600 games or the approximately 30,000 development games. Opposite movements in two seed sets do not by themselves prove that a change is noise. A strength comparison needs paired outcomes, uncertainty, and a separate confirmation sample after the remaining fidelity fixes.

The defaults break down as follows. Administrative actions such as Undo and Reset are excluded from the offered-option count. These counts identify dispatch through the generic bot fallback, rather than an engine strategy implementing the printed priorities.

| Unhandled state | Multiple-option calls | Single-option calls |
| --- | --- | --- |
| `landwehr` | 24 | 0 |
| `war_in_africa` | 24 | 24 |
| `war_in_africa_confirm` | 0 | 24 |
| `place_new_neutral_units` | 164 | 41 |
| `negate_trench` | 7 | 0 |
| `salonika` | 36 | 0 |
| `withdrawal_negate_step_loss` | 0 | 24 |
| `withdrawal_negate_step_loss_confirm` | 0 | 24 |
| **Total** | **255** | **137** |

## Remaining findings

### GS-06 — consequential event choices use the generic fallback

**Medium, known coverage limit with newly reproduced consequences.** The fallback in `sim/bot.js` prefers `next`, `done`, `end_action`, then `pass` before selecting a unit or space. It does not apply the booklet's front order and Tie. Some of the reported defaults are strategic choices, rather than placement details or forced confirmations.

At seed 951000, CP turn 1, Landwehr offers reduced GE 7 at Mulhouse and German corps at Bremen and Oppeln. The bot returns `pass`, immediately ends the event, and restores no unit. All 24 campaigns contain a multiple-option Landwehr fallback. The first example in every campaign is `pass`. The event's free restoration is being discarded by dispatch behavior.

At the same seed, Allied turn 3, War in Africa offers full British corps at Basra, Cairo and in reserve. The fallback returns `pass`, increasing VP by one in the CP's favor. That may be a defensible strategic choice in some positions. The issue is that the simulator always reaches it through the generic preference list, with no explicit printed policy governing the corps-versus-VP decision.

Implement named handlers for Landwehr, War in Africa, entering neutrals, Salonika and Negate Trench. For choices between legal units or spaces, implement the booklet's stated priorities. Where those priorities do not decide whether to spend a resource or accept a consequence, add a short explicit rule to the booklet and companion reference. A suggested Landwehr rule is to restore eligible units in front order, then Tie, until no further restoration is allowed. Choose and document a deliberate War in Africa policy before measuring it.

Retain separate counters for forced acknowledgements and choices with alternatives. Strict exception mode does not detect missing handlers.

### GS-07 — abandoned movement re-enters fallback and overstacking

**Medium, previously disclosed movement limit with a specific failure path.** Seed 951000, Allied turn 9, round 5, plans a forward move from Reval to Riga. Reval has RU 7, RU 8 and RU 12. Riga already has a Russian corps.

The bot selects all three armies, finds no acceptable step, marks the move abandoned and returns Undo. After Undo, `s_choose_move_space` has no usable planned move and returns no decision. The generic fallback selects an army anyway. The abandoned-move branch in `s_choose_pieces_to_move` also returns no decision when Done/Stop is unavailable, so fallback adds the other armies and selects Riga. Four units then occupy Riga. The engine flags overstacking, and `s_confirm_move_violations` resets the round.

This trace shows why choosing from the engine's offered action list does not prove the completed movement is rules-compliant. The engine permits some movement choices provisionally and validates the result later.

Make abandoning an activation terminal for the movement planner. Select a different valid planned move or exit safely, without allowing fallback to resurrect the abandoned one. Check destination capacity before selecting the moving group. If a rejected group could fit with fewer units, use the strongest legal subset under the printed stack procedure. Keep repair counts visible even after this reproduction passes.

The saved state and the 12 preceding actions are included. This one observed reset is not an estimate of the repair rate in larger runs.

### GS-08 — event-trench handler contradicts the printed selection order

**Medium, confirmed paper/code mismatch.** Booklet §9, Other choices, explicitly includes event trenches and says to use front order, then Tie. `s_place_event_trench` instead scores enemy contact at +3 and VP status at +2, then selects the first tied engine space. It uses neither printed priority.

At seed 951000, Allied turn 2, the Staff card has number 4 and Tie South. Its front order begins East, then West. Eligible Eastern Front spaces include Ivangorod, Kovno, Lublin, Kharkov and Dubno. The printed ordering selects Dubno. The simulator places the trench at Cambrai on the Western Front. This is a custom-handler mismatch, so it is absent from the missing-handler count above.

Use front order and Tie in this handler. Alternatively, deliberately amend the printed rule to match a tested alternative. The present review recommends implementing the existing printed rule, which adds no operator procedure.

## Recommended next work

1. Keep the five v0.7.2 fixes and the new reporting.
2. Implement and document the consequential event decisions, including unit placement. Align event-trench selection with the booklet.
3. Fix the abandoned-movement path and replay the Riga trace before running another broad evaluation.
4. Add a fidelity gate that reports unexpected missing handlers, rejected proposals, repairs and paper-priority mismatches separately from exceptions. Maintain an explicit allowlist for single-choice confirmations.
5. Compare the corrected policy on matched seeds, then use fresh confirmation seeds. Report both outcomes and how much behavior changed. Keep the 67%/33% result labelled as self-play of the tested executable policy.

Human playtesting can proceed alongside this work. Record actual time per bot round, map searches and arithmetic, uncertainty about a choice, exposed gaps and mistimed events. Bot self-play and wins against random or one-attack opponents do not establish difficulty against an experienced player. No additional VP handicap adjustment is justified by this small review sample.

## Reproduction

Extract the evidence archive with the structure below. Clone the source into a sibling directory named `source-v072`, check out the full reviewed commit, and run its engine setup. The engine is an external dependency and is excluded from the archive.

```text
review/
  source-v072/       # source checkout at 87e7b3911e507713b57ed2fce1763e11200eee8e
  evidence-v072/     # scripts and recorded evidence in this archive
```

```sh
git clone --branch claude-bot https://github.com/ramyahoo88/Paths_of_Glory_solo source-v072
git -C source-v072 checkout 87e7b3911e507713b57ed2fce1763e11200eee8e
sh source-v072/sim/setup_engine.sh
node evidence-v072/mo-proof.cjs
node evidence-v072/fix-checks.cjs
python evidence-v072/setup-proof.py
node evidence-v072/replay-audit.cjs 6 951000
node evidence-v072/replay-audit.cjs 6 952000
node evidence-v072/replay-audit.cjs 6 953000
node evidence-v072/replay-audit.cjs 6 954000
node evidence-v072/event-proof.cjs
```

`fix-checks.cjs` loads the included committed companion snapshot. Its exception and step-cap injections are confined to an in-memory evaluator fixture. `setup-proof.py` uses an isolated pre-existing git cache tagged locally as `c58b0b4`. It tests filesystem handling and repeatability, not network fetching or revision provenance. Review wrappers record plans and choices while leaving the production decision policy unchanged.

The JSON evidence records the seeds, outcomes, counts, calculator examples, injected errors and concrete event/movement traces. `source-provenance.json` lists the reviewed source hashes. `SHA256SUMS` covers the report and evidence files in the archive.

Sources are the reviewed [General Staff commit](https://github.com/ramyahoo88/Paths_of_Glory_solo/tree/87e7b3911e507713b57ed2fce1763e11200eee8e), its [response to the original review](https://github.com/ramyahoo88/Paths_of_Glory_solo/blob/87e7b3911e507713b57ed2fce1763e11200eee8e/audits/general-staff-v0.7.1/Response.md), and the pinned [Rally the Troops engine](https://github.com/rally-the-troops/paths-of-glory/tree/c58b0b4). The original audit remains available alongside Claude's response.
