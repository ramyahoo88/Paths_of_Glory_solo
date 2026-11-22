# General Staff v0.7.5 — Comprehensive Audit

22 November 2026 · Paths of Glory solo system · Codex

**Verdict: patch before treating the release as complete.** The release rebuild is reproducible, the printed packet is intact, and the previous fixes still pass. This broader review found **five new defects: four Medium and one Low**, plus **one previously reported Low evidence issue**. The main problems are in the simulation's execution of the printed bot: an avoidable supply loss, a corps-only siege failure, an unhandled event choice, and incomplete use of the Staff card's priorities. The companion's new defect is limited to damaged saved data. Keeping v0.7.5 labelled a playtest draft is appropriate pending a corrective release.

No production code, rules, balance settings or hosted application was changed by this audit. The evidence scripts reproduce the existing behavior; a reproduction passing does not mean the defect is fixed.

## 1. Release, scope and independent expectations

Repository: `ramyahoo88/Paths_of_Glory_solo`, branch `claude-bot`. Fresh audit checkout: `073c31c7362684ea61149333bfc0ba70f0010ccd`, whose latest commit adds the preceding verification report. Production release: `cd648213326835fe32536688adc4755960137f46`. The core simulation files are byte-identical to the archived test candidate `9c1326ebe290b9bc8ac90d3dff59a9955b5f0a8e`. The earlier opponent is v0.7, `bc8bef6ceb8311425accab2bfe2f7a8411548f55`.

The engine was installed from the repository's setup script at pinned Rally the Troops revision `c58b0b4a33e227faf73cbe561f3bede17087a142`. Tests used Node 24.22.3. The reviewed product is General Staff's paper procedure, 18 Staff cards, reference packet and `app/General_Staff_Companion.html`. The older applications under `gpt_handoff/` are separate products and outside this review.

The declared ruleset is **Deluxe Historical scenario, full campaign, standard 110 strategy cards, no optional cards**. Expected decisions were taken from General Staff's rendered rules and reference sheets before checking the relevant code. Native-game expectations were checked against GMT's August 2022 living rules, especially Historical setup/scoring, multinational combat, supply, fort entry and siege maintenance. The official card manifests were also read in their rendered table layout. Their older wording does not override later living rules; for example, the old manifest's Kerensky CC marker is not used as current authority.

Sources consulted:

- [GMT living rules, August 2022](https://gmtwebsiteassets.s3.us-west-2.amazonaws.com/nnpg/PoG-DeluxeRules2022Final.pdf), including §§5.7.4, 12.1.11.1, 14.1.5, 14.3.5 and 15.2.
- [GMT Allied card manifest](https://www.gmtgames.com/nnpg/allied_cards.pdf), including AP 46, Brusilov Offensive.
- [GMT Central Powers card manifest](https://www.gmtgames.com/nnpg/cp_cards.pdf).
- [GMT legacy errata](https://www.gmtgames.com/nnpg/pog_errata.html), consulted as historical corrections, subordinate to the later living rules.
- Shipped `bot/General_Staff_Rules.md`, `bot/Sample_Turns.md`, all three PDFs, both 55-card event lists, README, simulation report, earlier audit responses and v0.7.5 per-game records.

### Separate rebuild

A clean Git archive was unpacked to a separate directory. `node app/build_app.js` and `NO_PDF=1 node print/build.js` ran there. All four HTML outputs matched the shipped files **byte for byte**. `rebuild.json` includes full hashes, commands and sizes.

| Artifact | Bytes | SHA-256 prefix | Match |
|---|---|---|---|
| Companion HTML | 31,736 | fca170f5719757f1 | Exact |
| Rules HTML | 32,076 | 48572ba09d065f2f | Exact |
| Reference HTML | 29,141 | 4dae59b8e8fcc6bc | Exact |
| Staff-card HTML | 15,394 | b71a19337d842b73 | Exact |

The shipped PDFs were rendered and inspected; they were **not regenerated or claimed byte-identical**. The PDF generator's required browser was unavailable for a permitted launch. Hosted Claude-artifact parity was not verified.

### Printed materials

All **23 shipped PDF pages** were viewed: rules 1–10; reference 1–7, including both columns on sheet 1 and all event-list pages; Staff cards 1–6. No clipped text, missing printed column, split card or missing card face was found. Six complete faces appear on each odd card page and six backs on each following page. Physical duplex alignment on a printer was not tested.

Executable comparisons additionally checked **36 Front Table cells, 110 event rows, 10 Objective rows and 19 expected-hit columns** against the companion data. All 18 Staff cards and backs were counted. This establishes agreement among shipped representations; it is not an independent proof of every strategic priority. The independently regenerated two-turn sample, seed 2, exactly matched `bot/Sample_Turns.md`.

## 2. Confirmed findings

| ID | Severity | Component | Finding |
|---|---|---|---|
| C01 | Medium | Simulation movement | First-step supply check can be bypassed; a Serbian army is permanently lost. |
| C02 | Medium | Simulation movement | A legal two-corps siege group is rejected, then a one-corps fallback causes a rule reset. |
| C03 | Medium | Event procedure and simulation | Brusilov's trench cancellation has no decision rule or handler. |
| C04 | Medium | Simulation priorities | Equal attack origins and siege rolls can ignore Staff Tie/front order. |
| C05 | Low | Companion recovery | Invalid inherited-property commitment names load as “undefined front.” |
| EV-01 | Low, carried forward | Evidence | Handicap output still lacks the commit stamps claimed by its README. |

### C01 — The first movement step can sacrifice a supplied Serbian army

**Player impact.** The simulated Allied bot takes an empty VP space and immediately loses an army permanently at attrition. This is a legal Paths of Glory movement choice, but it contradicts General Staff's explicit supply stop rule and weakens the simulation used to evaluate the paper bot. A zero rule-reset count cannot detect it.

**Expected.** General Staff §6, rules PDF page 6 and reference sheet 1 require stopping when the next space would be out of supply. Serbian units' special supply within Serbia does not follow them into Bulgaria; living rules §§14.1.5 and 14.3.5 distinguish that exception and the army's attrition consequence.

**Exact reproduction.** Stock self-play seed **1080907**, Allied turn **12**, action round **6**, zero-based decision **2136**. SB 1 (piece 66) and SB corps 171 are in Skopje (121), targeting empty CP-controlled Sofia (198). Nis is occupied by AH 6; Kazanlik holds a Bulgarian corps; Strumitsa is CP-controlled. Both selected Serbian units are supplied in Skopje and unsupplied after entering Sofia. The fixture contains the complete board, control, cards and event state, avoiding dependence on an abbreviated map description.

Run `focused-proofs.cjs` with `release-ap-unsafe.json`. The engine offers destinations Tirana, Monastir and Sofia plus Undo, but no Stop. The bot returns `space 198`. In the complete saved trace it stops, finishes its other move, and at decision **2143** the engine logs permanent removal of SB 1 from Sofia. The corps is removed on the following decision. The capture first gains the Allies one VP; it does not prevent the attrition loss.

**Cause and source.** `sim/bot.js:925` only rejects an unsupplied next step when `acts.stop` exists. It does not exist on this first step. The planning check at `sim/bot.js:850` does not test prospective supply, and the fallback path at `sim/bot.js:890` also lacks that guard. Printed requirement: `bot/General_Staff_Rules.md:153`.

**Smallest useful fix.** Validate the prospective moving group's supply before committing the first step and before activating a move that has no safe first step. If execution discovers no such step, undo/drop that move without restarting it through a weaker fallback. Check supply for the actual units and resulting control state: merely rejecting every currently unsupplied enemy-controlled destination would also reject valid captures that open a supply route.

**Controls and evidence.** Moving the Serbian pieces to Valjevo preserves their Serbia supply exception. Opening an Allied route from Sofia through Strumitsa to Salonika with the Salonika event active makes the Sofia position supplied. Both controls pass. One such entry occurred in the 80 stock self-play games; eight occurred across all 360 strategy-batch games. Full evidence: `release-ap-unsafe.json`, `supply-trace-trace-1080907.json`, `focused-proof-results.json`.

### C02 — Corps-only siege selection rejects the group before it can form

**Player impact.** A valid siege move is abandoned. The emergency path then puts one corps into a level-2 enemy fort, so the engine resets the movement phase. This directly disproves a general inference that all movement-rule violations have been eliminated; it does not contradict the reported zero resets in a particular finite batch.

**Expected.** General Staff §6 and native rule 15.2.1 allow two corps to besiege a level-2 fort. Unit selection must consider the completed moving group. An emergency move must obey the same fort restriction.

**Smallest setup.** Historical turn 3, CP to act, no MO, full-strength GE corps 68 and 69 in Mulhouse, three full-strength GE corps 70–72 in Strasbourg, no other units. Keep the normal initial forts and trenches; CP hand contains Severe Weather (internal card 69, printed CP 4), worth 2 OPS. Staff card **3**, Hold / Ops / North. `corps-siege-fixture.json` records this setup exactly.

The bot's actual plan spends one OPS attacking Nancy from Strasbourg and one moving Mulhouse's two corps into Belfort. Strasbourg is therefore both full and attack-activated. On execution the bot selects one Mulhouse corps, undoes that selection, selects one again through its hold path, moves that one corps to Belfort, and receives **“Insufficient strength to besiege”**, followed by `reset_phase`.

**Cause and source.** `sim/bot.js:820` calls `stepCapacity` before adding the second corps. `stepCapacity` at line 883 calls `legalSteps`, whose fort test at line 865 judges the incomplete one-corps group. Belfort is filtered out, Strasbourg cannot serve as the step, and capacity becomes zero. The last-resort room-only filter at lines 804–806 then bypasses the fort requirement.

**Smallest useful fix.** Select a feasible complete moving group and its first step together, or let the capacity calculation consider additional eligible corps before applying the fort-strength test. Reuse full movement legality in every abandoned-move exit. If there is no complete legal group, cancel the activation instead of forcing an illegal step.

**Control.** From the same selection state, manually selecting the second offered corps and entering Belfort works: both corps arrive, the fort becomes besieged, and there is no violation. The earlier **leave-a-siege** fix remains correct: its exact Nancy regression and 38 independent departure controls still pass. This is a different **enter-a-siege** boundary. Evidence: `corps-siege-trace.json` and `focused-proofs.cjs`.

### C03 — Brusilov Offensive silently passes its trench-cancellation choice

**Player impact.** The bot forfeits an available event benefit; the paper operator has no printed instruction for choosing when to use it. Brusilov's automatic +1 DRM still applies. This finding concerns the separate, once-per-action trench cancellation, not the entire event.

**Expected.** Allied card 46 permits cancellation of trench effects for one qualifying Russian attack against non-German defenders. The bot needs an explicit policy for that choice, just as it has for Kerensky. The exact preferred timing is a design decision; “use on the first eligible attack” is a small, deterministic recommendation, not an existing native-rule obligation.

**Exact reproduction.** Stock seed **1080927**, Allied turn **14**, round **3**, decision **2312**. RU 3, RU 5 and RU 8 attack **Cracow**, defended by an AH corps in a level-1 trench. State `brusilov_offensive_option` offers `use`, `pass` and Undo. The bot returns `pass`, records `nohandler:brusilov_offensive_option`, and retains both trench column shifts. In this particular battle the Allies still win; no changed game winner is claimed.

**Cause and source.** The handler is absent beside `sim/bot.js:1263`, which handles Kerensky. `decide` at lines 70–83 falls through to `fallback`; its preference list at line 1290 ranks `pass` ahead of the unrecognized `use`. The engine's explicit choice is at `engine/rules.js:9766`, in the pinned engine. The printed event-choice list at `bot/General_Staff_Rules.md:220–230` has no Brusilov entry.

**Smallest useful fix.** Add the agreed Brusilov choice to §9, the reference and event notes, and implement its handler. Under the first-eligible policy, return `use` whenever offered, otherwise `pass`. Add a later eligible-attack control proving that a used cancellation is not reused; retain the engine's exclusion of German defenders.

**Evidence.** `brusilov-trace-fixture.json` is the exact pre-choice state. The focused test confirms that `use` sets `trenches_canceled` and `pass` does not. The full trace preserves the die rolls and subsequent result. This was the sole generic unhandled choice in the 360-game batch.

### C04 — Printed priorities are not consistently applied

**Player impact.** A paper operator and simulator can select different attacking units or allocate siege rolls to different fronts from the same Staff card. This weakens the claim that simulation results describe the printed procedure exactly. The choices remain legal under the base game.

**Expected.** General Staff introduction and §1 apply the Staff Tie to equal options in different spaces. §2 keeps the current Staff card active through turn-end phases. §9 explicitly orders siege choices by front order, then Tie.

**Reproduction A: equal attack origins.** Put a full GE 1 in Metz, full GE 2 in Strasbourg and full FR 1 in Nancy; no other units. Turn 3, no MO, no Allied trenches; remove other forts from consideration, leaving Nancy's fort. Plan with one OPS and an Assault Staff card. Both candidate origins contribute 5 CF. **North should choose Metz** (map y=711); **South should choose Strasbourg** (y=782). The simulator chooses Strasbourg for both. The South case is the passing opposite-outcome control. Complete setup: `attack-tie-fixture.json`.

**Reproduction B: siege order.** Put supplied CP armies legally besieging Nancy and Ivangorod, with both siege rolls pending. Use Staff card **10**, which puts East first at Mobilization. The engine offers both forts. The bot rolls **Nancy** first, while the printed rule requires **Ivangorod**. `siege-order-fixture.json` and the test verify supply and legal besieging strength. Its fallback counter stays empty because the handler directly calls the fallback helper.

**Cause and source.** `sim/bot.js:290` sorts attack origins by CF alone, retaining adjacency order on a tie. The execution grouping at line 267 instead uses numeric space ID as its secondary key. `sim/bot.js:1153–1155` directly delegates attrition, siege and trench-roll ordering to generic fallback rather than front/Tie ordering. The siege case is directly reproduced; no separate observed attrition or trench-roll defect is claimed here.

**Smallest useful fix.** Add the Staff Tie to equal-CF origin sorts in both planning and execution. Give siege-space choices an explicit front-order/Tie comparator. Review the adjacent phase handlers against their printed priorities, and test North/South and changed first-front controls. Count explicit use of generic fallback separately if “no defaults” is to mean that every choice follows a printed policy.

### C05 — Damaged commitment names can evade session validation

**Player impact.** An otherwise valid saved session with a damaged commitment field loads without the promised warning and displays **“undefined front.”** This requires damaged or edited saved data; it was not observed through ordinary controls, and it is not a normal-save data-loss finding.

**Expected.** Only `mobilization`, `limited` or `total` should pass session validation. Invalid data should take the existing rejected-save/recovery path.

**Exact reproduction.** Draw a card, retain a valid saved deck/discard/history, and replace `lvl` with `"constructor"`. Reload. The card says “undefined front,” the invalid level is saved again, and there is no damaged-session notice. `"__proto__"` and `"toString"` reproduce the same result. An ordinary invalid string, `"nonsense"`, is correctly rejected as a control. The expanded companion script reproduces this using the shipped HTML and storage doubles.

**Cause and source.** `app/build_app.js:142` checks truthiness of `D.frontTable.cp[x.lvl]`, accepting inherited Object properties. `render` at line 166 then indexes the wrong value as a front array.

**Smallest useful fix.** Validate the field against an explicit three-string allowlist before assignment, then rebuild the shipped HTML. Add these three corrupt values to the recovery tests. The existing rejected-copy and visible notice behavior can remain as implemented.

### EV-01 — Handicap provenance is still missing from individual outputs

**Status and impact.** This is the Low issue already disclosed by the preceding v0.7.5 verification, not a newly discovered gameplay defect. All seven `handicap_*.json` files have per-game records but no commit field, contrary to `sim/results/README.md:7`. The folder-level README pins the candidate, so the runs are not wholly unattributed.

**Reproduction/source.** `node sim/vpshift.js 5 30001 30002` produces an object with `shift`, `startVP`, `n`, `errors`, `ap`, `cp`, and `games`, but no provenance. The output expression is `sim/vpshift.js:25`. By contrast, `sim/ab.js:25–26` writes candidate/reference metadata.

**Smallest useful fix.** Stamp the bot commit in new handicap outputs, preferably the engine commit and dirty-worktree status too. There is only one bot version in a self-play handicap run. Correct the README and add an honestly labelled manifest for existing files; do not invent a runtime-captured stamp retroactively. A full rerun is unnecessary merely to document the pinned source.

## 3. Full games, boundaries and strategy challenges

### Direct simulation coverage

The audit ran **360 fresh strategy-batch games**, comprising 80 stock self-play games, six 40-game purposeful-policy comparisons, and a 40-game confirmation batch. These completed **1,068,455 decisions**, across **41 decision-state types**, with no exception, unfinished game or rule-reset loop. Each proposed action was checked against the engine's offered actions. Some offered intermediate moves can still create an illegal end position, which is why C02 also checks the completed movement phase.

At every bot decision, access to the opponent's hand/deck and the engine RNG state was replaced with throwing getters. All **1,068,455** decisions passed. This is strong evidence against those hidden-information reads on exercised paths, not formal proof about every possible branch.

The audit also checked each completed 18-card Staff cycle for uniqueness and reconciled **1,068,453** non-Undo VP changes against new score-log entries. That ledger is a consistency check, not an independent rules implementation. Three complete trace endings were separately reconstructed from final space control, scoring events, missed MOs and Historical end adjustments; they exactly matched VP **3, 2 and 5**. Seventeen synthetic end-scoring controls passed, including 12/13 VP, Brest-Litovsk's 10/11 boundary, unplayed US armies, and the no-Fall-of-the-Tsar adjustment changing the winner.

The batch included Automatic Victory, Armistice and turn-limit endings for both sides. It exercised replacements, SR, entry of neutrals, retreat, advance, combat cards, attrition, sieges, Withdrawal, event trenches and both Russian offensive choices. Exercising a state is not the same as independently validating every rule within it.

### Representative complete campaign

Seed **1080800** was traced from Historical setup through turn-20 scoring, separately from the 360-game batch: **3,399 decisions**, 120 action rounds per side, Allied victory at **VP 3**, no generic fallback, supply-policy breach or reset.

The opening follows forced Guns of August. GE 1 and GE 2 move to Liege; GE 3 remains at Koblenz. All three attack Sedan. The CP die of 1 produces four hits, while the Allied die of 5 produces three. Withdrawal restores FR 5's lost step, and it retreats to Chateau Thierry. GE 1 takes the German loss; GE 2 and GE 3 advance to Sedan, raising VP from 10 to 11. The trace retains every subsequent card play, group selection, loss, retreat and phase transition.

Over the campaign the Allies play 37 events, 54 Operations, 9 SR cards and 20 RP cards; the CP play 32, 54, 16 and 18 respectively. The sides resolve 45 and 86 attacks. Their missed-MO totals are 8 and 2. The final board contributes net −6 VP, recorded events −7, and missed MOs +6: **10 − 6 − 7 + 6 = 3**. Both US army reinforcements and Fall of the Tsar were played, so the Historical end adjustment is zero. A table user can replay the human-readable opening and then inspect `representative-trace-1080800.json` for all actions.

The original Nancy departure campaign, seed **1080569**, was also replayed: 3,503 decisions, Allied automatic victory on turn 19 at VP 0, matching the archived record and producing no reset. The two new problematic campaigns were replayed with full traces; those are repetitions of batch seeds, not additional independent samples.

### Purposeful policies, with matched seeds

These opponents are **controlled variants of the same bot**, not independent human-quality players. Pressure fixes Assault/Ops. Preservation fixes Hold/Logistics and lowers RP triggers. Exploitation fixes Assault/Ops, removes the three-target shortlist, enables MO approach and gap moves, and changes capture weighting. Their exact options are in `audit-run.cjs`. Each variant changes one side while the other remains the release bot.

All exploratory comparisons use seeds **1080900–1080939**. Initial setup and RNG seed match; subsequent die streams can diverge when policies make different numbers of decisions. Results are paired by seed, not claimed to have identical later combat dice.

| Policy tested | Side changed | Allied wins | CP wins |
|---|---|---|---|
| Release baseline | Neither | 37/40 | 3/40 |
| Pressure | Allies | 30/40 | 10/40 |
| Pressure | CP | 33/40 | 7/40 |
| Preservation | Allies | 15/40 | 25/40 |
| Preservation | CP | 40/40 | 0/40 |
| Exploitation | Allies | 30/40 | 10/40 |
| Exploitation | CP | 40/40 | 0/40 |

CP Pressure looked promising at first: seven previously lost seeds became wins, but three baseline wins became losses, a net gain of four. On the reserved fresh set **1080940–1080979**, the release CP won **7/40**, while Pressure won **4/40**: four gains and seven losses. The improvement did not replicate. None of these tests supports replacing the release policy or declaring a human-proof strategy. The complete 80-game stock baseline was **70 Allied / 10 CP**.

No repeatable benefit-farming loop was established. C01 supplies a reproducible dangerous capture position, and C02 supplies a reproducible wasted movement/reset position; neither proves that a human can force that exact position from the opening. Preservation's poor results show that blindly avoiding combat and prioritizing repair can be costly. They do not measure an experienced person's defensive play.

### Archived strength claims

The audit recomputed the committed records rather than relying on summary percentages. The headline paired results are internally correct: Allied **270/300 and 276/300**; CP **148/300 and 176/300** against v0.7. The committed self-play records contain **509 Allied / 91 CP wins** across 600 games. The 740-game health table correctly describes its archived records.

Disabling legal groups produces **40/300** Allied-candidate error games and **74/300** CP-candidate error games. Their surviving-game win rates are not valid estimates of the strength of a working alternative bot. Errors are retained in the files, and per-fix gains must not be added.

The handicap data show CP **63/150** at +5 VP and **85/150** at +6 VP. Linear interpolation between those adjacent points is about **+5.55 VP**. This is a coarse self-play calibration, not a precise human difficulty rating; the local slope between +5 and +6 is not the overall roughly-seven-points-per-VP slope. The audit did not independently replay all 3,600 paired and 1,050 handicap games. It checked their complete records, source pins and aggregate arithmetic; the preceding focused audit separately replayed sample records.

## 4. Companion, regression status and operator workload

The shipped HTML script was executed with small DOM/storage doubles. **13,080 calculator combinations** matched an oracle transcribed from the rendered Edge table, covering both firing tables, CF boundaries, terrain and trench shifts, empty forts with stale defender fields, bonuses, both sides, all stances and late MO overrides. Ten complete Staff-deck cycles, reload after every draw, reshuffle Undo and New deck/Undo passed. Undo's documented implementation retains at most 30 history entries; deck-state comparisons account for that bound.

The existing 28 companion checks, multinational-attack regression, nine event-choice checks, exact siege-departure regression and print-page test all pass from the fresh checkout. Expanded siege controls also pass. The previous Salonika contact restriction, War in Africa/Salonika Tie cases, empty-fort calculation, late-MO verdict, damaged JSON recovery and reshuffle Undo remain intact.

**Actual browser gap.** Local Chromium could not launch because the environment blocked a required socket. The cloud browser rejected local-file access. No browser workaround was used. Consequently this audit does not certify real button interaction, responsive layout, keyboard navigation, screen-reader behavior, real-phone behavior, browser storage restrictions or hosted-artifact parity. VM control-handler tests and PDF page inspection are reported as such, not as browser tests. The companion has no board-operation apply/preview system to validate; its calculated suggestion does not move physical counters.

**Table workload.** A complete campaign still requires a Staff draw and front lookup each action round, event-priority checks, legal target/stack construction, distance/front/Tie decisions, card-budget selection and physical loss/RP bookkeeping. The representative game records 329 Allied and 288 CP shortlisted evaluations, or 2.74 and 2.40 per round. These counters do not measure all movement scans, preliminary evaluations, replans or time at the table. Instrumentation observes repeated computation, but computer function-call counts should not be relabelled as a person's number of lookups. No timed tabletop study was performed.

## 5. Optional quality-of-life recommendations

These are suggestions, not additional confirmed release defects, and no improvement in win rate is claimed.

| Priority | Recommendation | Concrete benefit and acceptance check |
|---|---|---|
| High | Next round / Next turn controls | Advance through six action rounds; on a new turn reset MO-met and RP-played flags together. Include Undo. Currently changing Turn 1 to Turn 2 retains both checks and can continue showing “Rebuild: not this turn.” The numeric round field also accepts 7 although the game has six rounds. Until changed, show an explicit manual-reset reminder. |
| High | Validated session export/import | Move a deck and tracker between devices and recover after browser data is cleared. Include format version, side, commitment, deck, discard, current card, tracker and bounded history. Reject duplicates and damaged fields using the same validator as reload. |
| High | Small planning worksheet | Keep target, legal origins, CF/fort/trench, bonuses, Score and OPS cost visible while choosing a card and rescoring. Keep the physical board authoritative. A printable version would serve paper-only users equally well. |
| Medium | Offline rules and geography reference | Embed the bot rules, front membership exceptions and event-choice instructions, with direct section links from the calculator and event list. It should work without a network and show the same version as the deck. |
| Medium | Accessible controls and notices | Associate every calculator input/search field with a programmatic label; announce draw/recovery results, preserve sensible keyboard focus, and check contrast at phone widths. Static markup suggests label gaps; a real accessibility pass remains necessary. |
| Medium | Explain the calculation | Show firing columns, shifts, each bonus and the threshold in a compact breakdown. Flag incompatible or missing inputs and distinguish mandatory late-MO attacks. This reduces repeated rulebook checks without changing the bot's choices. |
| Low | Print/navigation polish | Provide a single download area for rules, reference and cards, plus clear “faces only” and duplex instructions. Add section/page references beside condensed procedure rows. The existing card layout itself passed. |

## 6. Rules questions and remaining limits

**Q1 — Event attacks versus event-provided OPS.** §9 says event-granted attacks use best Edge without bonuses; the code plans normal OPS, including bonuses, for events that grant an entire Operation. Clarify whether that sentence is intended only for already-activated attacks such as Guns of August, or also for Brusilov/Kerensky/Yanks and Tanks. The distinction can change which attacks qualify. This is a wording/scope question, not a confirmed additional defect in this audit.

**Q2 — Equal moves from the same origin.** The Move-list tie rule compares the mover's front and space. If one origin has two equal-valued Siege destinations, that comparison cannot separate them. State explicitly whether the next comparison is the destination's Tie. This avoids a discretionary paper choice or reliance on iteration order. No changed-game strength result is claimed for this question.

Coverage does not amount to a proof of the entire third-party engine. Optional cards, other scenarios, every rare event combination, all publishers' physical printings, deliberate human long-term deception, real-device accessibility and physical print registration remain outside the demonstrated checks. The tests use the pinned engine as a legality oracle and separately validate selected high-risk rules; they do not replace it with an independently implemented game.

## 7. Reproduction package and release priorities

The accompanying ZIP contains the audit runner; full per-game strategy records; complete representative/problem-game traces; focused fixtures and assertions; the expanded companion oracle; scoring and archived-record checks; build hashes; regression output; and print-inspection metadata. The publisher's rulebook and the third-party engine are not redistributed in the ZIP. Install the pinned engine with the repository's setup script and use the commands in the evidence README. Small fixtures are executable simulation states, not importable companion sessions: the companion does not represent a board position.

Prioritize **C01 and C02** together so all planned and abandoned movement uses the same supply, fort and stacking criteria. Then add the **C03** event policy/handler and fix **C04** comparators in planning and execution. **C05 and EV-01** are small independent corrections. Rerun the focused cases with opposite-outcome controls, the existing regressions, a fresh strict batch with supply-policy checks, and a permitted real-browser smoke test. Rebuild and inspect any changed printables.

**Final release verdict:** the byte-identical HTML build, intact printed packet, passing prior regressions and complete fresh games support continued playtesting. The confirmed paper/simulation mismatches and missing Brusilov decision prevent an unqualified “all issues fixed” verdict. Correct the four Medium findings before presenting the next release and its simulation evidence as a fully consistent implementation of the printed bot.
