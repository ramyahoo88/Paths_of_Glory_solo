# Changelog

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
