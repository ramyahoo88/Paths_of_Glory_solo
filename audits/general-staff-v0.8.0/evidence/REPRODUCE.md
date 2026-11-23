# Reproduce the v0.8.0 review

Reviewed release: `569bdc7b3eb1768504cc2393147c05fcbc95b0e4` on `ramyahoo88/Paths_of_Glory_solo`, branch `claude-bot`.
Bot code: `c8559da042c4498c8cb01ad53d324f7804bfbabb`.
Reference opponent: `62a7746f34271e9e362db04b0a3dd0f9c4798aa4` (v0.7.6 Allied bot).
Engine: `c58b0b4a33e227faf73cbe561f3bede17087a142` with the repository's read-only hook.

## Setup and existing checks

```sh
git clone --branch claude-bot https://github.com/ramyahoo88/Paths_of_Glory_solo.git pog
cd pog
git checkout 569bdc7
sh sim/setup_engine.sh
node app/test_companion.cjs
node sim/tests/multinational.js
node sim/tests/event_choices.js
node sim/tests/siege.js
node sim/tests/movement.js
node sim/tests/priorities.js
python3 print/check_print.py
```

To rebuild the companion without overwriting the shipped file, create another worktree at the reviewed commit, set up the pinned engine there and run `node app/build_app.js` there. Compare the two `app/General_Staff_Companion.html` files with `cmp`. Expected SHA-256:

`60a650af3c9c25da517f961c391491b0dd8fa399931f1a408e9b0e975775eafd`.

With pandoc installed, `NO_PDF=1 node print/build.js` rebuilds the three printable HTML files; all three compared byte for byte with the shipped copies. This review did not claim byte-identical PDF rebuilds.

## Independently replayed strict self-play

```sh
STRICT=1 node sim/final_eval.js self 20 1100000 > self-rerun-20.json
```

Compare `games` with the first 20 entries of `sim/results/v0.8.0/self_a.json`. Every recorded game field matched, including activity statistics, milestones, final VP, turn, steps, exceptions and supply breaches. These are replays of existing seeds, not an additional independent strength sample.

## New matched seeds

Create a reference worktree at `62a7746` and set up its engine, or point its ignored `engine` path at the reviewed worktree's pinned engine. Replace `/absolute/reference/sim` below with that worktree's `sim` directory.

```sh
node sim/ab.js cp 200 2200000 /absolute/reference/sim '{"edgeShift":0,"campaign":null}' > fresh-baseline-200.json
node sim/ab.js cp 200 2200000 /absolute/reference/sim '{"edgeShift":0.75,"campaign":"west"}' > fresh-v080-200.json
```

Seeds are 2200000 through 2200199 inclusive. Both sides use the same setup and bot shuffle seeds in each pair. The opponent remains the v0.7.6 Allied bot in both runs. The old CP settings are explicit because the released constructor defaults changed. These A/B runs use the repository's `ab.js` harness; they are separate from the strict self-play replay above. The A/B harness records candidate decision exceptions, but does not provide all of `final_eval.js`'s health diagnostics. Do not describe the A/B runs as a full strict rules-health audit.

## Confirm the printed-reference defect

```sh
pdftotext -f 2 -l 2 -layout print/out/reference.pdf -
```

Page 2 says CP Assault 0, Press +0.75, Hold +1.5 and gives card-front-first ordering without the CP West-first exception. Rules sections 2 and 5.4, the Staff cards, reference page 1 and companion instead use West first and CP Assault +0.75, Press +1.5, Hold +2.25. The obsolete instructions originate in `print/build.js` lines 111 and 113; a rebuild reproduces them. The included proposed patch changes those two source lines. Applying it requires rebuilding and redistributing the reference HTML/PDF. No release files were changed during this review.

A concrete threshold example: CP Assault, clear terrain, no trenches or bonuses, 4 CF on the Army table attacking 3 CF on the Army table. Expected hits are 3.0 versus 2.5, so Score is +0.50. The old page-2 threshold allows the attack; the released +0.75 threshold rejects it. The companion correctly rejects it.

A concrete ordering example: CP, Mobilization, Staff card 10 (front number 4 = East). Released order is West, East, Italy, Balkans, Near East. The obsolete page-2 text puts East first. The siege-order fixture in `sim/tests/priorities.js` verifies that the released CP bot rolls Nancy before Ivangorod with that Staff card; disabling West-first reverses that choice.
