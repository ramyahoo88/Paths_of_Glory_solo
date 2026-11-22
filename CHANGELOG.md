# Changelog

## v0.6 — 22 Nov 2026

* Events of priority **7–9** are urgent (played before anything else); the Plan's Event step now covers priorities 5–6. In paired tests this raised the Allied bot from 50% to 69% and the CP bot from 51% to 55%, and the war's milestones became far more historical (USA at war in 76% of games, Fall of the Tsar in 74%).
* Attack Search shortlist cut from five targets to **three** (no measurable loss, less work).
* Draw-phase discards: the lowest-priority combat cards go first; other cards are never discarded.
* Optional **difficulty handicap** via the starting VP (about six points of win rate per VP).
* Self-play balance now 57% Allies / 43% CP; Edge/Score calculations average about 2.5 per bot action round.

## v0.5 — 22 Nov 2026 (first published draft)

New design, replacing GPT's 1914 Tabletop Pilot approach (kept in `gpt_handoff/`).

* Full campaign, either side, card-driven: 18 Staff cards (front, Stance, Plan, Tie) plus printed priorities.
* Action round: forced play → MO last chance → urgent events → MO → Crisis → Rebuild (Allies only) → Staff card Plan → Fallback.
* Attack Search: three-target shortlist by CF difference, scored by Edge (expected hits) plus bonuses, attack if the Score meets the Stance. The Allied bot attacks with a margin one point higher.
* Moves ranked by a five-line value table: Capture, Fill, Siege, Forward, Entrench.
* Logistics triggers for RP and SR; card-by-card event priorities with situational notes.
* Advance after combat, guard rule, lexicographic retreat, SR and reinforcement placement.
* Companion web page, print-and-play PDFs, sample turns, simulation report.

### Development history (simulation-driven)

* v0.1–0.2: first harness on the Rally the Troops engine. Crisis SR removed. Advance after combat added.
* v0.3: Move value table and five-target shortlist; ordered (first-acceptable) selection rejected; Allied Stance +1.
* v0.4: distances use nation-only map links; Allied Rebuild step; Kept cards dropped (no measurable benefit).
* v0.5: fixes from an independent rules review — choices made lexicographic, the capture rule tightened, safe draw-phase discards, clearer wording throughout. Self-play balance 48% Allies / 52% CP.
