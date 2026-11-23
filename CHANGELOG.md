# Changelog

## v0.8.0 — 22 Nov 2026

A stronger Central Powers bot. GPT's five CP recommendations and my own campaign-focus tests were each played against the v0.7.6 Allied bot on matched seeds (see the report, *v0.8.0*). Two changes helped and are adopted. The Allied bot is unchanged.

* **The West is always the CP bot's first front.** Front order is West, then the Staff card's front, then the fixed order. Printed in the rules (*Front order*), the reference sheet and the companion.
* **CP Stance thresholds are 0.75 higher:** Assault +0.75, Press +1.5, Hold +2.25 (Allies stay at +1, +1.75, +2.5). The CP bot makes fewer attacks (71 a game, was 86) and keeps its strength for the ones that count. Printed on the Staff cards, the rules' Stance table and the companion.
* **Not adopted** (each made the CP bot weaker or no stronger): a turn checklist of campaign fronts, East first until Russia falls, keeping home VP spaces garrisoned, a penalty for attacks with no positional stake, and two rebuild rules. They stay in `sim/bot.js` as switches that are off by default.
* Testing (commit `c8559da`, clean worktree, every file stamped):
  * the CP bot wins **74%** against the v0.7 reference on both seed sets (v0.7.6: 53% and 56%; seeds gained / lost 107 / 46 and 105 / 52);
  * strict self-play is **69% Allies / 31% CP** (v0.7.6: 85% / 15%);
  * no unfinished games, exceptions, resets, bot supply breaches or choices without a rule;
  * about **three VP** of handicap now evens a bot-versus-bot game (v0.7.6: five and a half).
* `summarize.py` now counts supply breaches only for General Staff's own moves. A random baseline player's steps out of supply are listed separately.
* Experiment files (per seed, with options) are in `sim/results/v0.8.0/experiments/`.

## v0.7.6 — 22 Nov 2026

Fixes for the comprehensive v0.7.5 audit (`audits/general-staff-v0.7.5-comprehensive/`). Response: [`audits/general-staff-v0.7.5-comprehensive/Response.md`](audits/general-staff-v0.7.5-comprehensive/Response.md).

* **No step out of supply (C01).** Every movement step, the safety exit and the first-step planning check now require the moving units to be in supply where they arrive. This is judged by the engine on a copy of the game, so a capture that opens a route counts. If no nearer step qualifies, the stack stops; on the first step, the move is dropped. Printed in §6.
* **Corps gather to besiege (C02).** The step capacity judges a fort on the whole group that will move, so two corps can enter a level-2 fort together. Moves are no longer planned through a space the same Operation activates for attack. The safety exit uses full step legality, and a pass-through is counted.
* **Brusilov Offensive (C03).** Cancel trench effects on the first eligible Russian attack. Printed in §9, the summary and the event list.
* **Tie and front order (C04).** Equal-CF attack origins use the Tie in planning and execution. Attrition, siege and entrenchment rolls go in front order, then the Tie. Remaining Move-list ties go by the destination's Tie. §9 now separates event-granted Operations from units an event lets attack outside a plan.
* **Companion.**
  * The commitment level is checked against an allowlist (C05).
  * New **Next round** and **Next turn** buttons: Next turn clears the MO and RP boxes, Undo restores the tracker, and the round is limited to 1–6.
  * **Export / Import** of a session through a text box, with the same validation as reload.
  * 40 regression checks.
* **Provenance (EV-01).** `sim/provenance.js` stamps every evaluation, paired and handicap output with the bot commit, an uncommitted-changes flag and the engine revision with the hook hash (`engine/VERSION.json`). The v0.7.5 files get a manifest of declared provenance with SHA-256s.
* **Supply-policy check.** `final_eval.js` checks every movement step for units left out of supply; the run-health table reports the count.
* New regressions: `sim/tests/movement.js` (C01, C02) and `sim/tests/priorities.js` (C03, C04), built on the audit's fixtures.
* Testing (commit `8f71855`, clean worktree, every file stamped):
  * Allied bot 92–94% and CP bot 53–56% against the v0.7 reference.
  * Strict self-play 85% / 15% on 600 new seeds, with **every run-health count zero**: no resets, no supply breaches, no generic choices.
  * About 5.5 VP evens a bot-versus-bot game.

## v0.7.5 — 22 Nov 2026

Follow-ups from the v0.7.4 verification (`audits/general-staff-v0.7.4/`). Response: [`audits/general-staff-v0.7.4/Response.md`](audits/general-staff-v0.7.4/Response.md).

* **Siege rule (15.2.4).** Units leaving a space where they besiege an enemy fort keep a legal besieging force behind: an army, or as many corps as the fort's level. A unit whose departure would leave less is skipped, and a move with no unit free to leave is dropped. This is printed in §6. `sim/tests/siege.js` replays the exact v0.7.4 position (seed 1080569) that caused the last resets.
* **Per-game evidence.** `ab.js` and `vpshift.js` record every seed, the candidate and reference commits, and any error game (none are dropped silently). The full evidence set was rerun from commit `9c1326e`: self-play, baselines, paired tests, isolation (now including legal groups alone) and the handicap table. It is in `sim/results/v0.7.5/`.
* Results:
  * Allied bot 90–92% and CP bot 49–59% against the v0.7 reference.
  * Strict self-play 85% / 15% with **0 rule-violation resets** in 740 games.
  * About 5.5 VP evens a bot-versus-bot game.
  * Without legal attack groups, 13–25% of games break off with harness errors.
* Corrected the earlier description of the reset cause: units moved out of a siege, not "an army too weak to besiege".

## v0.7.4 — 22 Nov 2026

Short corrective patch for the v0.7.3 re-audit (`audits/general-staff-v0.7.3/`). Response: [`audits/general-staff-v0.7.3/Response.md`](audits/general-staff-v0.7.3/Response.md).

* **Salonika (GS-06 addendum).** The Allied bot plays Salonika as an event only if at least one corps may go: a British or French corps in the Reserve Box, or in an Allied port space out of contact. Without one, the card is kept for another use. The play condition is printed in §9 and on the event list. The handler keeps its contact filter. A safety path, never reached in testing, is counted in run health.
* **Event Tie (GS-15).** War in Africa and Salonika take the latest front first, then the ordinary Tie within that front. Before, the reversed list also reversed the Tie.
* `sim/tests/event_choices.js` checks both events with both Ties, the Reserve Box control, the contact-only Salonika position and the re-audit's reached campaign (seed 1080055).
* Seed-level result files for v0.7.3 and v0.7.4 are now in `sim/results/`.
* Testing: 600 fresh strict self-play games (seeds 1080000–1080599) finished with no exceptions and no choice left to the engine's default. Allies won 85% and the CP 15%. There were 2 rule-violation resets, both in one game.

## v0.7.3 — 22 Nov 2026

Corrective patch for the comprehensive v0.7.2 audit (`audits/general-staff-v0.7.2-comprehensive/`). Response: [`audits/general-staff-v0.7.2-comprehensive/Response.md`](audits/general-staff-v0.7.2-comprehensive/Response.md).

* **Staff cards print whole (GS-09).** Six cards per Letter page, each face page followed by a page of backs. `print/check_print.py` checks that every face's top, Tie and card number are on one page.
* **Companion (GS-10 to GS-13).**
  * A rounds 5–6 MO attack below the Stance is shown as mandatory. An empty fort ignores leftover unit CF, and the unit-only fields are disabled.
  * Undo before a reshuffle restores the exact pre-draw state.
  * Saved sessions are validated. Damaged data is set aside with a visible notice, a damaged Undo step is skipped, and a failed save is reported.
  * New: a **New deck** button and a turn/round/MO tracker that shows which action-round steps apply.
  * `app/test_companion.cjs` covers all of this.
* **Legal attack groups (GS-14).** Attacking spaces are taken strongest first, skipping a space whose units could not legally join those already taken (the multinational rule and the like). The Score always uses that group. Before an attack is committed, the selected units are checked again.
* **Event choices (GS-06).** Named rules for Landwehr (use the whole effect), War in Africa (remove a British corps rather than give the VP), Salonika, entering neutral units, Withdrawal, trench-negating combat cards and Kerensky Offensive. They are in the rules (§9, *Event choices*) and the simulator.
* **Movement (GS-07).**
  * A stack moves no more units than its first step can take. A move with no legal first step is dropped at planning.
  * An abandoned move never resumes through the generic fallback.
  * An event-granted operation keeps the plan made for it. Before, its moves were lost and units moved by the generic fallback.
  * SR picks only units that have room at a destination, and movement respects the Brest-Litovsk stacking rule.
* **Event trench (GS-08).** Front order, then the Tie, as printed.
* **Run health** now separates choices with no bot rule from forced acknowledgements, and counts abandoned moves and called-off attacks.
* Testing. Following the printed procedure everywhere made both bots much stronger against the v0.7 reference bots: Allies 66–68% → **90–95%**, CP 32–45% → **49–56%** (paired, two seed sets). The biggest single gain is the event-granted Operation fix; each change was isolated in the report.
  * Strict self-play is now **Allies 84% / CP 16%**. About five VP of handicap evens a bot-versus-bot game.
  * Run health: 1 rule-violation reset in 740 games (v0.7.2: 67), no unfinished games or exceptions, no choice-bearing state without a bot rule.
  * Removing a British corps for War in Africa beat giving the VP by about two points on both seed sets.

## v0.7.2 — 22 Nov 2026

Fixes for the five findings of the independent v0.7.1 review (`audits/general-staff-v0.7.1/`). There is no new strategy. Response: [`audits/general-staff-v0.7.1/Response.md`](audits/general-staff-v0.7.1/Response.md).

* **MO credit (GS-01).** The MO bonus and the forced round-5 attack count only if the attackers actually chosen would satisfy the MO. At resolution the MO is checked again, and an attack that no longer meets it is judged like any other. Rules §4 and §5.4 now say this.
* **Calculator (GS-02).** In the Companion, a 0-CF defender still fires (Corps 0 column). A new box handles an empty fort.
* **One precision (GS-03).** Paper, Companion and simulator all use the Edge table's printed one-decimal values; a Score equal to the threshold meets it.
* **Evaluation honesty (GS-04).** Decision exceptions, engine-default sub-choices, rejected proposals, rule-violation resets and step-cap exits are recorded. `STRICT=1` stops a game at the first exception, and the summary prints a run-health table.
* **Setup (GS-05).** The tracked `engine` symlink is gone, and setup copes with a stale link.
* Tried and not adopted: taking an MO target's mandated-nation spaces first. It made no difference.
* Testing: paired tests against the v0.7 reference showed no change beyond noise. Allies 66–68% (v0.7.1: 66–67%); CP 32–45% (v0.7.1: 37–40%), with the two seed sets moving in opposite directions. Strict self-play over 600 games: **Allies 67% / CP 33%**, no exceptions and no unfinished games. Missed MOs fell slightly: Allies 3.4 → 3.1, CP 1.4 → 1.3 per game.

## v0.7.1 — 22 Nov 2026

Rules clarifications from a third independent review, and a test harness that now follows every printed move tie-break. No rule of play changed.

* Losses are chosen only among the allocations the rules allow (12.4). RP and SR plays respect the no-consecutive-play rules (9.3.3, 9.4.3) and Influenza; a forbidden play counts as a trigger not met.
* The Automatic Operation test counts the whole plan (attacks plus moves). The MO steps fire only when the *planned* attacks include an MO attack. Crisis fires on any planned Fill.
* At resolution, the Edge is worked out again and the planning bonuses are kept; an attack planned as an MO attack is never skipped. Leftover attacks come only from spaces activated for combat.
* Objectives count only for the front a space lies on. Distance counts connections (adjacent = 1). Missing steps ignore permanently eliminated units. Equal units in one space: you choose.
* Card ties for RP and SR (lower priority, then lower number); Move-list ties use the moving stack's front; each movement step uses the Tie between equally near spaces; rebuilt armies follow a fixed front order.
* Harness: the same tie-breaks are now coded. The Capture choice compared scores wrongly, so the printed "nearer the Objective" preference was often ignored; fixed. Fixed a map lookup that sent the CP Balkans list's Salonika entry to an off-map box, and event-granted operations that ignored the "attacks only" restriction after a rule-violation reset (one stuck game in 300). Added a safe exit for a stack with no legal step.
* Testing: following the printed Capture rule made the Allied bot about **seven points stronger** in paired tests on two seed sets (59–61% → 66–67%); the CP bot was unchanged. Self-play over 600 games: **Allies 68% / CP 32%** (v0.7 on the same seeds: 61% / 39%). No harness errors. All other v0.7.1 changes tested neutral.

## v0.7 — 22 Nov 2026

* Allied bot: a **Forward move with an army is worth 2.5** (CP bot: 1.5). The Allies now bring idle armies up to the line sooner. In paired tests on two seed sets this raised the Allied bot from 55% to 61% and from 54% to 64%; the same change hurt the CP bot, so it is Allied-only.
* Harness robustness: a stack never takes an overstacking step when no step toward its target exists. After a rule-violation reset, the bot finishes the action round with attacks only.
* Stress test: a greedy one-round look-ahead variant lost all 80 games against the plain procedure (see report).
* Self-play now 62% Allies / 38% CP (460 evaluation games, no harness errors); about six points of win rate per VP of handicap.

## v0.6 — 22 Nov 2026

* Events of priority **7–9** are urgent (played before anything else); the Plan's Event step now covers priorities 5–6. In paired tests this raised the Allied bot from 50% to 69% and the CP bot from 51% to 55%, and the war's milestones became far more historical (USA at war in 76% of games, Fall of the Tsar in 74%).
* Attack Search shortlist cut from five targets to **three** (no measurable loss, less work).
* Draw-phase discards: the combat cards with the lowest keep value go first (keep values now printed); other cards are never discarded.
* Wording aligned with the tested procedure after a second independent review (Crisis card choice, SR order, French Mutiny, event-granted attacks, combat cards as priority 0 for spending).
* Optional **difficulty handicap** via the starting VP (about six or seven points of win rate per VP).
* Self-play balance now 57% Allies / 43% CP; Edge/Score calculations average about 2.5 per bot action round.

## v0.5 — 22 Nov 2026 (first published draft)

New design, replacing GPT's 1914 Tabletop Pilot approach (kept in `gpt_handoff/`).

* Full campaign, either side, card-driven: 18 Staff cards (front, Stance, Plan, Tie) plus printed priorities.
* Action round: forced play → MO last chance → urgent events → MO → Crisis → Rebuild (Allies only) → Staff card Plan → Fallback.
* Attack Search: five-target shortlist by CF difference, scored by Edge (expected hits) plus bonuses, attack if the Score meets the Stance. The Allied bot attacks with a margin one point higher.
* Moves ranked by a five-line value table: Capture, Fill, Siege, Forward, Entrench.
* Logistics triggers for RP and SR; card-by-card event priorities with situational notes.
* Advance after combat, guard rule, lexicographic retreat, SR and reinforcement placement.
* Companion web page, print-and-play PDFs, sample turns, simulation report.

### Development history (simulation-driven)

* v0.1–0.2: first harness on the Rally the Troops engine. Crisis SR removed. Advance after combat added.
* v0.3: Move value table and five-target shortlist; ordered (first-acceptable) selection rejected; Allied Stance +1.
* v0.4: distances use nation-only map links; Allied Rebuild step; Kept cards dropped (no measurable benefit).
* v0.5: fixes from an independent rules review — choices made lexicographic, the capture rule tightened, safe draw-phase discards, clearer wording throughout. Self-play balance 48% Allies / 52% CP.
