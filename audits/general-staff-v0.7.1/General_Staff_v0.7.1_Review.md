# General Staff v0.7.1 review

Reviewed `ramyahoo88/Paths_of_Glory_solo`, branch `claude-bot`, commit `40fbb10755643ccf92287564f8acb24b48c9cb82`. The live branch matched that commit when checked. This is a focused review of the printed procedure, simulation policy, companion calculations and reproducibility.

General Staff implements the physical-board direction Taylor requested. The operator uses Staff cards and fixed priorities while the companion draws cards, calculates attack scores and shows reference tables. My recommendation is to keep this design and make a correctness patch before using the reported results to establish paper/code agreement.

I reproduced five findings. Five selected Operations plans in four of 24 fresh campaigns carried incorrect mandated-offensive credit. Separate deterministic examples reproduced the calculator and rounding mismatches. An injected exception established the reporting problem. The repository's engine symlink established the setup problem.

| ID | Priority | Finding |
| --- | --- | --- |
| GS-01 | Medium | Mandated-offensive credit survives removal of the required nationality from the attacking plan |
| GS-02 | Medium | Companion treats a defending zero-CF corps as having no defensive fire |
| GS-03 | Medium | Printed and simulated expected-hit precision can reverse attack decisions |
| GS-04 | Medium | Evaluation silently replaces decision exceptions and reports a clean game |
| GS-05 | Medium | Tracked engine symlink points to Claude's home directory and breaks setup elsewhere |

**GS-01 — recompute MO qualification after selecting attacking spaces.**

`sim/bot.js` marks a candidate as an MO attack using all potentially attacking spaces around the target in `attackCandidates`. `planOps` subsequently fits spaces to the available OPS and recalculates Edge. It retains the original MO flag and bonus even when the selected forces no longer include the nationality required by the mandate. This can also force an otherwise weak attack in rounds 5–6 and take precedence over an urgent event.

A concrete example is seed 931003, turn 4, Allied round 5. The mandate is French. The selected Operation plays Salonika for OPS and plans an attack on Cambrai from Calais with BE 1 alone. The flag remains `mo: true`, and the action is labelled `Mandated Offensive (last chance)`. Its Edge is -0.5, the recorded Score is 6.75, and the Allied Assault threshold is 1. No French unit participates in that selected plan.

The 24-game review found six distinct intermediate plans with the mismatch and five selected plans carrying it. Selected examples occurred at seed 931003 turns 4 and 8, seed 932003 turn 10, seed 933005 turn 19, and seed 934000 turn 9. See `mo-selected-summary.json` and the accompanying saved states. These are planning-credit errors. The rules engine still determines whether an actual attack fulfills an MO.

Recompute MO qualification from the selected attackers before applying the MO bonus and forced-attack exception. Carry the corrected flag into card selection and subsequent replanning. Check again if the actual eligible attacking units change during resolution. Measure how much this contributes to missed mandates and wasted mandate actions after the fix.

Code locations are `sim/bot.js` around lines 192–209, 254–265, 486–490 and 828–834.

**GS-02 — keep defending presence separate from defending CF.**

In `app/build_app.js` around lines 133–137, the calculator sets defender expected fire to zero whenever defending CF plus fort CF equals zero. A reduced corps with CF 0 is still a defending combat unit and uses the zero column of the Corps/Fort table. At the pinned engine version that column averages 1/3.

Reproduction uses Allied Hold, an attacking army with 3 CF, a defending corps with 0 CF, no fort, clear terrain, no trench and no bonuses. The companion displays Edge and Score +2.50 and recommends attacking at the 2.5 threshold. Applying the zero Corps column gives Edge 2.5 minus 1/3, approximately +2.17, below the threshold. Zero-CF defenders in trenches also need their presence accounted for independently of CF when determining the defensive column shift.

Use a presence flag or an explicit legal-target convention so a zero-CF defending unit still fires on its table. The simplified attack evaluation and the companion should agree. The fixture runs the shipped page script with a simulated DOM.

**GS-03 — define one attack-score precision for paper, companion and simulator.**

`print/build.js` renders the Edge table to one decimal place, `app/build_app.js` stores expected-hit values to two decimal places, and `sim/bot.js` uses full table averages. This difference is large enough to reverse a decision close to the Stance threshold.

For example, a 9-CF attacking army has expected fire 4 2/3 and a 12-CF defending army has 5 1/3. Suppose the target is within two spaces of the front's Objective (+0.4), is a VP space (+0.5), and is on the second front (-0.25), with no other bonus. The exact Score is approximately -0.0167. The printed table gives 4.7 minus 5.3 plus 0.65, or +0.05. Under Central Powers Assault, the paper procedure accepts the attack while the simulator declines it.

Choose a common precision and explicit treatment of threshold ties. Using the printed rounded values throughout is one option that preserves the operator's existing arithmetic. Compare the resulting decisions on matched cases and rerun an independent confirmation sample. This adjustment concerns the bot's evaluation procedure. Normal game combat still follows the printed fire tables.

Code locations are `print/build.js` around lines 74–79, `app/build_app.js` around lines 27–29 and 132–142, and `sim/bot.js` around lines 140–163. The generated reference HTML carries the one-decimal values.

**GS-04 — record exceptions, fallbacks, resets and unfinished games.**

`sim/final_eval.js` around lines 29–31 catches a bot-decision exception, substitutes a generic fallback and proceeds without recording the exception. Its `err` field can therefore remain null. Its final statistics selection also drops `stats.fallback`, including missing state handlers and rejected policy proposals. Reaching the 60,000-step cap does not explicitly set an error either.

I injected exactly one identifiable decision exception at seed 948001. The campaign finished and the evaluator reported `err: null`, with neither side recording an errors count. The reproduction is in `error-reporting-proof.cjs` and `error-reporting-proof.json`.

The fresh strict review loop used no exception replacement and all 24 campaigns finished. It did record three Central Powers rule-violation resets and several engine-default event choices. Those repairs and defaults matter when comparing the tested algorithm with the printed procedure. They should remain visible in the evaluation output.

Record each decision exception with seed, side, turn and engine state. Retain fallback reasons and rule-reset counts. Treat a missing game-over result or step-cap exit as incomplete. A strict confirmation mode that stops on unexpected exceptions will make clean-run claims reproducible.

**GS-05 — replace the tracked absolute engine symlink with a generated directory.**

The repository tree records `engine` as mode `120000`, pointing to `/home/claude/pog/engine`. The documented `sim/setup_engine.sh` eventually runs `mkdir -p ../engine` before copying the pinned rules files. On a machine where that home-directory target does not exist, the link is dangling and `mkdir -p` fails because an entry already exists.

The reproduction creates that same dangling link in a temporary directory and invokes `mkdir -p` on it. It exits with status 1. See `engine-path-proof.json`.

Remove the tracked machine-specific link, keep the generated engine directory ignored, and test setup from a clean checkout. The engine can remain an external dependency downloaded at the pinned version. I obtained its three files through GitHub and applied the repository's hook in a regular local directory to run this review.

**Checks completed.**

The repository was inspected at the pinned commit. Downloaded text files were checked against their Git blob fingerprints. The committed companion rebuilt byte for byte from its builder using Rally the Troops engine commit `c58b0b4` and the hook supplied by this repository.

I ran 24 fresh full campaigns, six each at seeds 931000–931005, 932000–932005, 933000–933005 and 934000–934005. All reached game over without an uncaught exception or an action outside the engine's offered actions. The results were 17 Allied wins and seven Central Powers wins. That small sample checks execution and supplies reproducible failures. It does not independently confirm the reported 600-game win rate or the approximately 30,000 development games.

The review also replayed four affected seeds to capture the selected MO plans, ran calculator and rounding fixtures, injected a reporting error and reproduced the dangling-symlink setup failure. The hosted Claude artifact, physical play times, PDF rendering, and stronger human opposition remain unverified in this review.

**Implications for the next version.**

The full-campaign card-driven design is worth retaining. Fix the MO qualification and calculator first, align arithmetic precision, and make clean-checkout evaluation preserve error evidence. Recheck the previously acknowledged event sub-choices against front order and Tie before claiming complete paper/code parity.

The reported 2.4 Edge calculations per action covers only part of the operator's work. The printed procedure also searches the map for eligible targets, ranks CF differences, checks Objectives and mandates, and builds the Move list. A few timed physical turns should count that work alongside attack arithmetic. Human strength and administration still need direct playtesting.

**Reproducing this review.**

Set up a source checkout at the reviewed commit in a directory named `source` beside this evidence directory. Resolve GS-05 locally so the pinned engine is available through `source/engine`, then follow `source/sim/setup_engine.sh`. The review files use the repository's unmodified bot and companion. The engine itself is external and is excluded from this evidence archive.

```sh
node evidence/replay-audit.cjs 6 931000
node evidence/replay-audit.cjs 6 932000
node evidence/replay-audit.cjs 6 933000
node evidence/replay-audit.cjs 6 934000
node evidence/mo-proof.cjs
node evidence/calculator-proof.cjs
node evidence/error-reporting-proof.cjs
```

The calculator fixture reads the included `evidence/companion-original.html`. Preserve that copy when reproducing this exact review. It is the committed page at `40fbb10`.

Sources are the pinned repository, the pinned Rally the Troops engine and GMT's August 2022 Deluxe living rules, especially combat sections 12.1 and 12.2.

- https://github.com/ramyahoo88/Paths_of_Glory_solo/tree/40fbb10755643ccf92287564f8acb24b48c9cb82
- https://github.com/rally-the-troops/paths-of-glory/tree/c58b0b4
- https://gmtwebsiteassets.s3.us-west-2.amazonaws.com/nnpg/PoG-DeluxeRules2022Final.pdf
