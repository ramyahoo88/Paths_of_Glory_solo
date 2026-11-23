# Response to the v0.8.1 comprehensive audit

The audit is by Codex ([report](General_Staff_v0.8.1_Comprehensive_Audit.md)). Both Medium findings and the design question are fixed in **v0.8.2**, and so are four of the five usability recommendations. The bot and Import fixes are commit `dba0de2`, which produced the evidence below. The usability changes, documentation and results followed in `6b5e527`.

## A01 — Medium: importing a session could not be fully undone — fixed

**Cause** (as reported). Undo steps held only the deck, the current card and the tracker. Import changed the side and commitment, and replaced the Undo history with the donor's history plus one recipient step.

**Fix.** An Import now leaves a single, typed Undo step, `{kind: 'import', session}`, which holds the whole session it replaced:

* side and commitment;
* deck, discard and current card;
* tracker;
* the session's own Undo history.

One Undo restores all of it, and further Undos walk the recipient's own history. The donor's history is not imported: after an Import, Undo means "cancel the Import". Ordinary Undo steps are unchanged, so older saved sessions still load. The session check accepts an import step only if the session inside it is valid. A damaged import step is skipped like any other damaged step.

**Tests** (`app/test_companion.cjs`, now 56 checks). Eleven new A01 checks:

* a different side and commitment come back with the deck, card, tracker and history;
* the restored card shows the CP threshold again (+2.25, not the Allied +2.5);
* two further Undos walk the recipient's history;
* Undo still works after a reload following an Import;
* two Imports in a row take two Undos;
* a damaged import step is skipped with a notice;
* an import whose history holds a damaged import step is rejected;
* an older saved session still loads and undoes.

The audit's `evidence/companion-expanded.cjs` asserts the old behaviour, so it now stops at its first A01 assertion, as intended. A copy with those assertions turned around passes:

* all 13,080 calculator cases and the ten deck cycles;
* Reproduction A gives CP and Mobilization after Undo, with the original card display;
* Reproduction B gives one draw after the second Undo.

## A02 — Medium: three simulator decisions ignored the Staff Tie — fixed

**Fix** (`sim/bot.js`):

* **Forward:** an equal weighted distance now uses the Tie against the current best (`frontLineTarget`).
* **Units:** a new `unitTie` compares equally ranked units by their spaces with the Tie. A unit off the map (Reserve Box) comes first (see Q01). Units in the same space or box are the operator's choice under §2; the simulator takes the lower piece number.
* **Where `unitTie` is used:** after the existing keys in the SR unit choice and the replacement unit choice, as the audit found. The suggested review of neighbouring cross-space unit sorts turned up two more places it now applies: losses (attacking units can be in several spaces) and the advance order. Every other unit sort chooses within one stack, or already ends in the Tie through front order (Landwehr, War in Africa, Salonika, the phase order).

`printedTies: false` keeps the old piece-number order for paired comparisons.

**Rules and reference.** The booklet already said that equal choices use the Tie (introduction and §1). It now says so at each place:

* Forward;
* SR (with Q01);
* the Losses, Advance and Replacement rows of §9.

The reference sheet's SR and Replacement lines say the same. The rules booklet is now marked 0.8.2, which also answers the version-label recommendation.

**Tests.** `sim/tests/ties.js` has 11 checks, using the audit's three fixtures (copied to `sim/tests/fixtures/`):

* Forward: card 3 (North) gives Verdun, card 6 (South) gives Nancy, and with Verdun full card 3 gives Nancy;
* SR and replacement: card 1 (North) gives Berlin, card 4 (South) gives Stuttgart, each applied through the engine;
* Q01: a Reserve Box unit comes before an equal map unit under either Tie;
* losses across spaces follow the Tie;
* the `printedTies: false` control keeps the old order.

## Q01 — SR ties with the Reserve Box — decided

Among equally ranked SR units, **a unit in the Reserve Box goes before a unit on the map**, then the Tie, then the operator's choice. A unit in reserve does nothing until it is redeployed, while a rear unit on the map at least holds its space. This also follows the order in which §7.2 names the two kinds of counted unit. The rule applies to both SR groups (crisis units, then counted units), each taking armies before corps. The rules say so in §7.2, and the reference sheet's SR line says "Reserve Box first, then Tie".

## Usability recommendations

| Recommendation | Done |
|---|---|
| One "Next round and draw" action with one Undo | **Yes:** a *Next round + draw* button. *Draw* stays for corrections. |
| Make manual turn editing distinct | **Yes:** typing a different turn now clears the MO and RP boxes, as *Next turn* does, and the turn box says so. Changing the round keeps them. |
| *Clear attack* and a visible MO reminder | **Yes:** *Clear attack* resets every calculator input, with a note that the MO and bonus boxes are not taken from the tracker. |
| Repeat event-table headers; identify the rules revision | **Yes:** the event tables repeat their header row on each printed page (reference pages 5 and 7), and the booklet shows its version. |
| Attack/move worksheet | **Not yet.** It needs a layout tested at the table; noted for a later version. |

Five companion checks cover the first three. The reference sheet is still seven pages. When page 1 first overflowed by one line, the print check caught it before release.

## Evidence for v0.8.2

All from a clean worktree of commit `dba0de2`, each file stamped, in [`sim/results/v0.8.2/`](../../sim/results/v0.8.2/). The paired runs play against the v0.7 reference at `bc8bef6`.

| Test | v0.8.0 / v0.8.1 | v0.8.2 |
|---|---|---|
| CP bot against the v0.7 reference, seeds 6001–6300 / 7001–7300 | 73.7% / 73.7% | 73.0% / 70.3% |
| Same seeds, games gained / lost (z) | — | 55 / 57 (−0.2); 58 / 68 (−0.9) |
| Allied bot against the v0.7 reference, same seed sets | 92.0% / 93.7% | 94.3% / 95.0% |
| Same seeds, games gained / lost (z) | — | 23 / 16 (1.1); 17 / 13 (0.7) |
| Strict self-play, 600 games | 69% / 31% (seeds 1100000–) | 73% / 27% (seeds 1200000–1200599) |
| Against random and naive opponents (140 games) | won all | won all |
| Handicap: VP that evens a bot game | about 3 | about 3½ |

The tie fixes change which units move, so few games replay identically: 29 of 600 CP paired games did. Neither bot's results moved significantly on the same seeds. The self-play split is on a fresh seed range. The audit's own 100-game stock batch found 71% / 29%.

**Run health, strict mode** (740 games): no unfinished games, exceptions, rule-violation resets, bot supply breaches, abandoned moves, called-off attacks, Salonika safety transfers or choices without a rule. One random baseline player's step out of supply is listed separately.

**Tests:** companion 56 checks; simulator ties 11; multinational, event choices, siege, movement and priorities all pass; the print check and its five negative controls pass.

# Response to the v0.8.2 verification

The verification ([General_Staff_v0.8.2_Verification.md](verification-v0.8.2/General_Staff_v0.8.2_Verification.md)) closed A01, A02 and Q01 and found two Low companion issues. Both are fixed in **v0.8.3**, a companion-only release; the bot and the printed rules are unchanged apart from the version number.

## B01 — Next round + draw drew a seventh card at round 6 — fixed

The button is disabled at round 6, and its handler returns before taking an Undo step or drawing. Its tooltip then says to use *Next turn*, then *Draw*. *Next turn*, or an Undo back to round 5, turns it on again; the state survives a reload. *Draw* stays available for corrections. Six new companion checks cover:

* rounds 1–5;
* round 6 turning the button off;
* a press at round 6 doing nothing;
* a reload at round 6;
* Undo back to round 5;
* *Next turn*.

## B02 — repeated Imports grew the saved Undo data exponentially — fixed

**Fix.** The session's own Undo steps stay JSON strings (save format 1 is unchanged). Inside an import checkpoint, the replaced session's steps are now stored as objects, so nothing is escaped twice and each Import adds about one session. At most **10** checkpoints are kept, one inside the next; an Import beyond that drops the oldest. This bound is documented in the code.

Checkpoints saved by v0.8.2, with string steps inside, are still read and undone, and the next Import stores them in the new form. A session's own top-level steps must still be strings.

**Measured** (the verification's repeated-Import case, saved characters):

* v0.8.2: 588 after one Import, 104,273 after ten, 6,556,463 after sixteen;
* v0.8.3: 552 after one Import, rising about 230 per Import to 2,613 after ten, then a steady 2,467 from the eleventh on.

Undo walks back through the ten kept Imports. Two Imports, a reload and two Undos still return to the original session.

**Tests.** `app/test_companion.cjs` has nine new B02 checks and now runs 71 checks.

**Auditor's script.** `verification-v0.8.2/verify-companion.cjs` asserts the old behaviour, so it now stops at its B01 assertion, as intended. A copy with the B01 and B02 assertions turned around runs to the end:

* B01 gives six draws and the button disabled;
* the repeated-Import sizes are as above;
* the 5,242,880-character storage double never fails;
* all its other checks pass.

## Real-browser coverage

`app/test_browser.py` is new. It drives the shipped page in headless Chrome through Playwright, with a real DOM, real `localStorage` and real reloads. It passes 11 checks:

* the round-6 stop, which survives a reload;
* *Next turn* turning the button on again;
* twelve Imports keeping the save under 3,500 characters;
* reload after Import;
* ten Undos using up the ten kept checkpoints;
* Import then Undo restoring the original session, side included;
* *Clear attack*;
* no page errors.

It needs Playwright and Chrome, so it is not part of the default test list.
