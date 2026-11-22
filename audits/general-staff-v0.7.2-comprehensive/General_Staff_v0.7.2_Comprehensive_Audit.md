# General Staff v0.7.2 — comprehensive audit

**22 November 2026 · Verdict: hold for a corrective patch.**

The release rebuild is reproducible, and the original five review fixes hold. However, the supplied Staff-card PDF cannot be cut into 18 complete cards as instructed. Two calculator cases give the wrong recommendation, the simulator can plan an incompatible multinational attack and then fight with a weaker subset, and saved-session recovery needs work. The three findings from the preceding re-audit also remain open.

**Nine confirmed findings: one High, seven Medium and one Low. Six are new; three are carried forward and reproduced again.** This audit recommends corrections to the bot, companion, print layout and testing. It does not recommend changing the native Paths of Glory rules.

## 1. Scope, version and authority

Repository: `ramyahoo88/Paths_of_Glory_solo`, branch `claude-bot`. Reviewed production commit: **87e7b3911e507713b57ed2fce1763e11200eee8e**. The branch head checked before packaging was **dd4f2b5d035a05b2f5087017cf16378222e1747e**; that later commit adds the preceding audit, without changing the production files reviewed here. All source line references below are to this production version.

The product under review is the **card-driven General Staff bot and its offline companion**, not the earlier full-map digital prototype. Rules: Deluxe edition, Historical scenario, full campaign, standard 110 strategy cards, no optional cards, normal starting VP. The bot booklet identifies itself as v0.7.2, a playtest draft. The physical game is required. Experimental constructor options are not released bot rules; they are used only for the separately labelled stress opponents below.

Materials examined:

- `bot/General_Staff_Rules.md`; all **nine rendered pages** of the shipped `print/out/rules.pdf`, including all table columns.
- All **seven rendered reference pages**, including both columns of the procedure sheet, all six Staff-number columns for both sides and all three commitments, both Edge-table rows, all Objective lists, the record sheet, and both 55-card event lists.
- All **six rendered Staff-card PDF pages**, including the overflow strips and backs; all 18 faces, Stances, Plans, numbers and Ties.
- The shipped companion HTML, its builder, the print builder, bot code, event policy, README, changelog, simulation report, worked example and earlier audit/response.
- GMT's [Deluxe product page](https://www.gmtgames.com/p-1182-paths-of-glory-deluxe-edition-3rd-printing.aspx), its linked [Living Rules, August 2022](https://gmtwebsiteassets.s3.us-west-2.amazonaws.com/nnpg/PoG-DeluxeRules2022Final.pdf), and both rendered pages of the [War Status / VP aid](https://gmtwebsiteassets.s3.us-west-2.amazonaws.com/nnpg/POG_PAC_WarStatus_2022.pdf). The product page labels these downloads June 2023; the rulebook itself is dated August 2022.
- GMT's older [errata and clarifications, June 2000](https://www.gmtgames.com/nnpg/pog_errata.html), and rendered [Allied](https://s3-us-west-2.amazonaws.com/gmtwebsiteassets/nnpg/allied_cards.pdf) and [CP](https://s3-us-west-2.amazonaws.com/gmtwebsiteassets/nnpg/cp_cards.pdf) card manifests. These are supporting historical references, not authority over the current Living Rules. In particular, the old Allied manifest labels Kerensky Offensive as a combat card; the errata corrects that, and this bot treats it as an action-round event.

The simulation uses Rally the Troops engine revision **c58b0b4**, with the repository's inspection hook. Engine legality, bot policy, printed instructions and companion arithmetic were treated as separate things to check. The engine was not assumed to prove every bot choice correct.

## 2. Release verification and direct coverage

The shipped HTML was preserved. Builders ran in a **separate source copy**, followed by byte comparisons. Node and pandoc were available.

| Artifact | Result | SHA-256 |
|---|---|---|
| `app/General_Staff_Companion.html` | Byte-identical | `fb16bccdcd2d46c383e456552dab4468d04db8d61303fd0696738cebebd574de` |
| `print/out/rules.html` | Byte-identical | `614fbcd5f5702a4e5b7a554d4b20b761bcb207fe709bb91afd0feb97dc65197f` |
| `print/out/reference.html` | Byte-identical | `c10274c36e0f3f749ca895619fd1c63e52c64645c8dd431f13c9497cf34279c6` |
| `print/out/staff_cards.html` | Byte-identical | `d7d70561eaa40c8f42d4e3948ceeeb1d1aea253b13d807e63acbe9a648d64556` |

The seed-2, two-turn worked example also rebuilt byte for byte. It describes current simulated decisions, including the simulation's limitations; matching it is not an independent proof of the printed policy.

**PDFs:** the actual shipped PDF bytes were downloaded and checked against repository blob identities, then rendered for inspection. They were **not regenerated**: the installed Chromium could not launch in this environment. The PDF layout findings concern what players actually receive, not a substitute rendering of the HTML.

**Companion:** the unmodified script from the shipped HTML was executed in Node with small DOM and storage doubles. Tests called its actual draw, Undo, side-change, input and search handlers. This is useful functional evidence, but **not a real-browser test**. The hosted Claude artifact required sign-in; direct local browser access was also blocked. Hosted-file parity, mobile layout, real browser storage, keyboard focus and touch behavior remain unverified. No simulated screenshot or browser pass is claimed.

| Area | Direct result |
|---|---|
| Print content | 36 Front Table cells, 110 event rows, 10 Objective rows and 19 expected-hit columns agree with the companion data; all 18 card identities and Ties are present. Page layout fails GS-09. |
| Original calculator fixes | 864 CF/table/terrain/trench combinations pass the printed-table calculation; 0-CF defense, the +0.05 rounding example and empty-fort trench immunity pass. |
| Session/control handlers | Clean start, complete 18-card cycle, ordinary Undo, valid reload, 108 side/commitment/card combinations and card-number search pass. Boundary/recovery failures are below. |
| Original MO fix | Replayed seeds 931003, 932003, 933005 and 934000; no planned MO credit given to units that fail the mandate. |
| Error reporting | Injected exception is recorded; strict mode stops at it; step-cap termination is reported as unfinished. |
| Earlier engine setup fix | Prior local-cache tests of absent and dangling `engine` paths passed twice each. Current setup code is unchanged. A fresh network clone was not repeated here. |
| Campaign stress | 72 complete games, 162,918 decisions, no decision exceptions or returned actions outside the offered action list; one operation reset for overstacking. |
| Hidden information | Separate seed 981000 completed 3,648 decisions with reads of the opponent's hand, either strategy deck and engine RNG state made fatal. Zero such reads. |
| Focused boundaries | Eight check groups pass: Historical setup, final scoring thresholds/modifiers, automatic endings, exhausted reserve, compulsory loss allocation, isolated supply and directional Ties. |

Focused native-rule expectations were established from the published rules before exercising the engine: Historical scoring uses §§5.7.2 and 5.7.4; supply and reserve/loss cases use §§14 and 12.4. The loss fixture tests both possible first army choices and requires the same army to take the next loss. This checks the choices actually offered after each step, not merely an intermediate loss-tree representation. Full campaigns also traversed combat, retreats, replacement, neutral entry, supply, sieges and scoring; that does not exhaust every event interaction.

## 3. Confirmed findings

| ID | Severity | Status | Finding |
|---|---|---|---|
| GS-09 | High | New | Six Staff-card faces split across PDF pages. |
| GS-10 | Medium | New | Calculator rejects qualifying last-chance MOs below Stance. |
| GS-11 | Medium | New | Empty-fort mode still counts stale defender CF. |
| GS-14 | Medium | New | Attack planning combines incompatible nationalities; execution can attack below the permitted cutoff. |
| GS-06 | Medium | Open, reproduced | Missing event handlers discard useful effects or use unprinted choices. |
| GS-07 | Medium | Open, reproduced | Abandoned movement can re-enter fallback and overstack. |
| GS-08 | Medium | Open, reproduced | Event-trench placement differs from the booklet. |
| GS-13 | Medium | New | Damaged session state can break startup/Undo; failed writes are silent. |
| GS-12 | Low | New | Undo fails to restore the state before a reshuffle. |

### GS-09 — Staff-card PDF fragmentation

**Player impact:** a player following the supplied print instructions cannot cut out six complete Staff cards. Their Tie and identification footer are on a different sheet. The backs fragment too.

**Expected:** booklet §1 and README line 20 promise 18 poker-size cards printed at 100% on US Letter. Each face must be contained within one printed page.

**Exact reproduction:** open the shipped `print/out/staff_cards.pdf` at actual size. Inspect pages 1–4: cards **7, 8 and 9** begin on page 1, but their Tie/footer strips appear on page 2. Cards **16, 17 and 18** similarly split between pages 3 and 4. Pages 5–6 split the bottom row of backs. No printer setting is needed to reproduce it; it is in the PDF.

**Observed:** the first and third pages each contain nine face headers but only six Ties; the following pages contain three Ties and no face headers. All text exists somewhere, so a text-presence check alone incorrectly looks reassuring.

**Source:** `print/build.js:19`, `:21`, `:58`, `:59`; `README.md:20`. Three 3.5-inch rows plus two 0.08-inch gaps require **10.66 inches**. Letter paper with 0.4-inch top/bottom margins provides **10.2 inches**.

**Smallest fix:** retain poker-size cards and paginate six faces per page, prevent breaks inside cards, and provide matching backs with explicit copy/printing instructions. Regenerate the PDF and inspect all pages at 100%. Add a check that every face and its Tie/footer share a page; do not rely on page text counts alone.

**Evidence:** `print-checks.py`, `print-results.json`, `rendered/staff_cards-01.png` through `-06.png`.

### GS-10 — last-chance MO calculator verdict

**Player impact:** the calculator can tell the operator to skip an attack the bot procedure requires, potentially costing the bot its mandated offensive and a VP.

**Expected:** booklet §5.4 and reference page 2 require the first qualifying attack for an unmet MO in rounds 5–6 regardless of Score. Ordinary attacks and earlier-round MOs still use their normal threshold.

**Exact reproduction:** choose Allies and draw an Assault Staff card. Enter bot CF 0 on Corps, defender CF 16 on Army, units present, fort 0, clear terrain, trench 2, no other bonuses, first front; set MO attack to rounds 5–6. This calculator fixture assumes the operator has already established that the attack legally qualifies for an unmet MO; the app has no board state to establish that itself. Run `node app-state-checks.cjs` for the deterministic handler reproduction.

**Observed:** Edge **−6.0**, Score **+0.00**, **“too weak (needs 1)”**. The first qualifying last-chance attack should instead be identified as mandatory. Changing the selection to rounds 3–4 correctly remains below threshold, providing a nearby control.

**Source:** `app/build_app.js:97`, `:141–145`; the verdict checks Stance only and never applies the late-MO exception. The bot planner already has that exception in `sim/bot.js:217`.

**Smallest fix:** make the calculator's MO input explicitly mean “this attack satisfies an unmet MO”; for rounds 5–6 display the mandatory-first-attack instruction even below Stance. Preserve the computed Score and distinguish ordinary/earlier attacks. Do not automatically claim legal qualification from CF alone.

**Evidence:** `app-state-checks.cjs`, `app-state-results.json`, finding `lateMO`.

### GS-11 — empty-fort mode retains unit CF

**Player impact:** an empty fort can appear much stronger than it is, causing the operator to reject an otherwise acceptable bot attack.

**Expected:** booklet §5.3 and native combat rules: an empty fort's defense uses its own CF on Corps; nonexistent units contribute nothing. The checkbox expressly says to untick it for an empty fort.

**Exact reproduction:** CP bot, Hold Staff card; bot CF 8 with Army; defender CF 12; fort 2; untick “units in the space”; clear terrain, trench 2, no bonuses. Compare with the same settings after changing defender CF to 0.

**Observed:** with the leftover 12, defender expected hits are **3.0**, Score **+1.00**, **too weak**. With 0, defender expected hits are **0.8**, Score **+3.20**, **attack**. Both describe the same empty fort. The existing fix correctly ignores its trench and Army checkbox, but does not ignore its unit CF.

**Source:** `app/build_app.js:133`, `:137–139`.

**Smallest fix:** compute defense as `(unitsPresent ? unitCF : 0) + fortCF`; disable or clearly mark unit-only fields inactive when the checkbox is off. Test toggling from an occupied defense without clearing its numbers, and verify that toggling back restores useful values.

**Evidence:** `app-state-checks.cjs`, `app-state-results.json`, finding `emptyFortStaleCF`.

### GS-14 — incompatible multinational attackers

**Player impact:** the bot can pay to activate units that cannot join the same attack, overestimate its strength, then attack with a weaker force than its printed procedure permits. The engine prevents the illegal combined combat, but does not repair the bot's evaluation.

**Expected:** native §12.1.11.1 requires a participating common space for a multinational attack from multiple spaces. Booklet §§5.1–5.4 must therefore evaluate a legal participating group. At resolution, §4 step 4 skips an ordinary attack more than 0.5 below Stance.

**Exact reproduction:** run `node multinational-proof.cjs`. Minimal engine fixture, based on seed **987654**, turn 3: reduced **FR 1 in Verdun**, full **BR 1 in Nancy**, full **GE corps in Metz**, intact Metz fort 3, no defending trench; other units removed for isolation, standard control retained. AP has a Hold Staff card, 2 OPS and no MO. Both attacking armies are supplied. Their individual target lists include Metz; their combined target list is empty.

**Observed:** the planner activates Nancy and Verdun for **2 OPS**, evaluating combined Edge **+2.2**, Score **+3.7**. At execution it selects FR 1 first; the engine cannot offer BR 1 as a compatible addition. The bot commits FR 1 alone: actual Edge **+0.2**, Score **+1.7**, below both Hold's **2.5** and its resolution cutoff **2.0**. There is no final selected-group check before committing the target.

**Nearby control:** move BR 1 into Verdun. Both nationalities now participate from one common stack; the combined target is legal and the same 2-OPS plan is valid.

**Source:** `sim/bot.js:237–239` tests attackers individually; `:209–216` scores their union; `:842–859` evaluates eligible attackers before selecting them; `:864–867` commits the target without rescoring the actual selected group. Engine `get_attackable_spaces` enforces the group restriction, so this is a bot-planning defect, not a proposed rule change.

**Smallest fix:** select and score a legally compatible group before assigning attack activations, store that group in the plan, and recheck the final selected units immediately before committing the target. Apply the existing 0.5 resolution allowance and MO qualification to those selected units. Add a short common-space reminder to §5.2 so the paper operator follows the same selection rule.

**Evidence:** `multinational-proof.cjs`, `multinational-proof.json`, `multinational-state.json`. The JSON is an engine fixture, not a companion import file.

### GS-06 — event choices fall through to generic defaults

**Player impact:** the simulation can discard a free event benefit or make consequential choices without following the printed priorities. This undermines claims that simulation results validate the paper bot.

**Expected:** booklet §§8–9 require events to take their effects and specified choices to use the printed priorities. The native Landwehr effect offers immediate restoration. Some resource-versus-consequence choices need a more explicit bot policy; see the rules questions below.

**Exact reproduction:** `node event-proof.cjs`, seed **951000**. On CP turn 1, Landwehr offers reduced GE 7 at Mulhouse and GE corps at Bremen and Oppeln. On AP turn 3, War in Africa offers British corps at Basra, Cairo and in reserve.

**Observed:** Landwehr returns `pass`, restores **no unit**, and ends. War in Africa returns `pass` and adds **1 VP for CP**. The latter may sometimes be strategically reasonable; the defect is an unprinted generic default, not a proof that sacrificing a corps is always better. The fresh 72-game stress suite encountered 71 choice-bearing Landwehr calls and 71 choice-bearing War in Africa calls, plus numerous neutral-entry/Salonika choices.

**Source:** `sim/bot.js:61–78` dispatches missing handlers to the generic fallback; `:1083–1088` prefers pass/skip before unit and space selection. There are no named handlers for these event states. `bot/General_Staff_Rules.md:197`, `:216` define the relevant placement/other-choice policies.

**Smallest fix:** implement explicit handlers for these states and the other choice-bearing fallback states. For space/unit selections use the printed rule. Make Landwehr spend its free restoration. Specify resource-versus-VP and optional-transfer decisions in the booklet before coding them. Record missing handlers separately from forced acknowledgements; strict exception mode cannot detect an absent handler.

**Evidence:** `event-proof.cjs`, `event-proof.json`, `event-state-landwehr-951000.json`, `event-state-war_in_africa-951000.json`, `strategy-summary.json`.

### GS-07 — abandoned movement can return through fallback

**Player impact:** a paid movement plan can become an overstacked move, forcing the simulator to undo and replan the operation. This is not the paper procedure and can change the action selected.

**Expected:** booklet §6 requires a legal stack and step, with no overstacked destination. An abandoned move must not silently resume through a generic fallback.

**Exact reproduction:** `node event-proof.cjs`, seed **951000**, AP turn **9**, round **5**, Staff card **17**. Reval contains **RU 7, RU 8 and RU 12**; Riga contains a Russian corps. The planned Forward move selects all three armies.

**Observed:** no suitable step is found; the move is marked abandoned and undone. The next move handler returns no choice, allowing fallback to reselect the armies. The abandoned-move handler again returns no choice when Done/Stop is unavailable. Fallback sends the three armies to Riga, creating four units there. The engine flags overstacking and the bot returns `reset_phase`.

**Source:** `sim/bot.js:729–740`, `:752–755`, `:774–782`, `:1038–1041`, and the fallback dispatcher at `:74–78`.

**Smallest fix:** make abandonment terminal for that activation; choose another valid planned move or a safe exit without fallback resurrecting it. Check destination capacity when choosing the moving group. Clarify/use the strongest legal subset when fewer units fit, while preserving Guard. Keep repair counters visible until the reproduction and fresh games have zero repairs.

**Evidence:** `event-proof.json` contains the position and 12-action trace. The new stress sweep also required one reset at seed **980008**, released AP bot versus capture opponent. The hidden-information campaign encountered two more reset states; neither result supports a blanket “no illegal moves” claim.

### GS-08 — event trench uses unprinted priorities

**Player impact:** the simulator places a trench on a different front than a person following the booklet. That can affect subsequent combats and the apparent strength of the paper bot.

**Expected:** booklet §9, Other choices, explicitly includes event trenches: front order, then Tie.

**Exact reproduction:** `node event-proof.cjs`, seed **951000**, AP turn **2**, Staff card **10** (front number 4, Tie South). The front order starts East, then West. Eligible Eastern spaces include Ivangorod, Kovno, Lublin, Kharkov and Dubno.

**Observed:** the printed order selects **Dubno**. The simulator selects **Cambrai**, scoring enemy contact and VP status instead. This is a wrong custom handler, so missing-handler statistics do not reveal it.

**Source:** `sim/bot.js:1051–1055`; printed policy `bot/General_Staff_Rules.md:216`.

**Smallest fix:** sort legal event-trench spaces by the existing front order and Tie. A different strategic policy would need an explicit, separately tested bot-rule change; it is unnecessary to correct this mismatch.

**Evidence:** `event-proof.json`, `event-state-trench-951000.json`.

### GS-13 — saved-session validation and recovery

**Player impact:** a damaged stored session can repeatedly break rendering or Undo. Another accepted malformed session can produce duplicate Staff cards. If storage is unavailable or full, progress can appear to save while being lost on reload.

**Expected behavior:** validate a saved session before using it, recover visibly from invalid data, and disclose failed persistence. A session should contain valid side/commitment values, valid card identities and a coherent deck/discard/history structure.

**Exact reproduction:** run `node app-state-checks.cjs`. Its first damaged-state fixture is provided as `companion-invalid-side.json`. Put that JSON under localStorage key `gs-companion` before startup, or load it through the VM harness. A second fixture supplies 18 copies of card 1 in the deck. A third supplies the history entry `invalid JSON`. Finally, have the storage double throw on `setItem`.

**Observed:** invalid side plus a current card throws **“Cannot read properties of undefined (reading 'mobilization')”**, retaining the bad stored state. The duplicate deck draws card 1 twice consecutively. Invalid history throws during Undo. A failed write is swallowed without a notice. Syntactically invalid JSON instead silently starts a new deck; ordinary valid reload passes.

**Source:** `app/build_app.js:108–109`, `:119–121`, `:156`, `:162`. `load()` accepts any object with a truthy `deck` and merges it into live state.

**Smallest fix:** validate the session before assignment, including nested history snapshots; preserve rejected data for recovery and offer a visible fresh-start action. Catch damaged Undo entries. Show an unsaved-state warning on failed writes. Add a format version for future migrations. Preserve the current valid-session behavior.

**Evidence:** `app-state-checks.cjs`, `app-state-results.json`, `companion-invalid-side.json`. These are storage fixtures, not files the current companion can import; it has no import/export UI. This is boundary testing, not evidence that ordinary saves routinely become corrupt.

### GS-12 — Undo at the reshuffle boundary

**Player impact:** Undo no longer restores the complete pre-draw state at the deck boundary. The deck counter and discard state change even though the player has undone the draw.

**Expected behavior:** one Undo should restore the state immediately before that draw, including whether reshuffling had occurred.

**Exact reproduction:** start a fresh session, draw all 18 cards, note **0 in deck / 18 discarded**, draw once more, then Undo.

**Observed:** the current card returns correctly, but the counters become **18 in deck / 0 discarded**. The code snapshots after shuffling. Ordinary Undo and reload both pass; no extra or missing card within a normal cycle was found. This is therefore Low severity.

**Source:** `app/build_app.js:155–156`.

**Smallest fix:** capture the pre-draw state before reshuffling or moving the discard pile. If redo-like replay of an undone shuffle is desired, preserve the generated order explicitly; do not silently change the restored pre-draw state.

**Evidence:** `app-state-checks.cjs`, `app-state-results.json`, `companion-after-18-draws.json`.

## 4. Purposeful opponents and limits

The released bot played three declared policy variants, on both sides, using **seeds 980000–980011 for each pairing**. These are stress opponents built from the same machinery; they are not independent expert policies. No release policy was tuned against these results, and no version-strength improvement is claimed.

| Opponent strategy | Deliberate behavior | Released AP wins | Released CP wins |
|---|---|---:|---:|
| Pressure | Always Assault; lower attack threshold; always advance; no early Rebuild step | 11/12 | 11/12 |
| Defensive | Always Hold; higher threshold; prioritize entrenching; never advance; earlier Rebuild | 12/12 | 12/12 |
| Capture | Promote non-VP captures and Forward movement; enable gap-filling moves | 11/12 | 12/12 |

The configurations are recorded verbatim in `strategy-games.json`. All 72 games completed. Small samples and shared implementation make the win rates unsuitable for difficulty labels or human-strength claims. They do show that these obvious extremes did not repeatedly defeat the released bot in this suite. No repeatable VP-farming strategy was established. This is not proof that no such strategy exists.

The released Allied bot still missed an average of **3.92 / 1.17 / 4.00** MOs per game against pressure / defensive / capture opponents, respectively. CP averages were **0.67 / 0.25 / 0.25**. These are diagnostics for these matchups, not replacements for Claude's larger self-play measurements. Do not infer that GS-01 failed: a bot can correctly qualify an attack yet fail to create a suitable opportunity.

Fallback coverage is consequential: the sweep recorded **761 choice-bearing calls** to states with no named handler, and **410 forced calls**. Choice-bearing counts included 500 neutral placements, 101 Salonika calls, 71 Landwehr, 71 War in Africa, 16 Negate Trench, one Kerensky option and one Withdrawal loss choice. Counts cover both the released and stress policies; they are not per-game performance estimates for just the released bot. Each choice count is a state visit, not necessarily a separate event card.

The retained `representative-campaign.json` supplies setup, round decisions and final state for seed 980000, released AP versus pressure CP. The seed-2 worked example covers both opening turns. The reproducible multinational position shows a concrete way to induce an overestimated attack. Landwehr shows a repeatable wasted event; the abandoned-move trace shows a wasted/repaired operation. No human play session was conducted.

## 5. Rules questions and optional usability improvements

### Rules questions — unresolved policy, not native-rule defects

1. **War in Africa and optional event transfers:** front order and Tie do not decide whether to surrender a corps, accept VP, or use zero versus several optional transfers. Specify these bot choices explicitly. Do not assume the current generic `pass` preference is the intended policy.
2. **Moving fewer units when the destination is crowded:** §6 says to move the strongest units up to three, while also prohibiting overstacking. State directly whether to choose the largest legal subset before abandoning a move. The engine-reset path is a confirmed defect either way; this question concerns the paper procedure used to replace it.

### Optional recommendations — not implemented or strength-tested

These improvements keep the physical board and avoid maintaining a digital copy of the whole map.

| Priority | Recommendation | Benefit and scope |
|---|---|---|
| 1 | Add a compact turn/round, MO-unmet and RP-played tracker | Carries the procedure's recurring conditions; makes the late-MO exception visible without entering the board. Let the user correct values and Undo them. |
| 1 | Add New game, export/import session and a visible saved/unsaved status | Makes recovery possible and supports switching devices. New game should clearly identify what is reset. This complements GS-13. |
| 1 | Add a three-target planning scratchpad | Keep target names, activation cost, selected units, Edge, bonuses and MO qualification together through planning and execution. These are manual notes, not automatic map decisions. |
| 1 | Present a clear mandatory-MO message and incompatible-nationality reminder | Put the exception and legality check beside the calculator verdict, where they affect a decision. |
| 2 | Preserve calculator inputs on reload; offer a separate Clear battle control | Avoid retyping an interrupted calculation. Keep it distinct from resetting the Staff deck. |
| 2 | Improve print navigation | Page numbers, repeated event-table headers, and a complete Move list kept together. On reference page 1, Entrench is separated from the other Move rows by the column break; pages 5 and 7 continue event rows without their header. Content is present, but navigation suffers. |
| 2 | Put the full bot rules and a glossary beside the offline tables | The companion summarizes steps but still sends operators back to separate materials for detailed decisions. Include an offline Rules link/tab and explain CF, OPS, MO, RP and SR. |
| 2 | Explain what Edge does and does not predict | It is a policy estimate from printed expected hits, not combat odds or a complete forecast of die-roll modifiers, combat cards, losses and retreats. Keep this short and near the calculator. |
| 2 | Validate and label inputs accessibly | Reject negative/nonintegral CF and invalid fort entries, connect text labels to controls, add clear inactive states for empty-fort fields, and test keyboard/mobile use in a real browser. These are recommendations, not a claimed accessibility audit pass. |
| 3 | Add a compact Staff history and optional covered display | Helps reconstruct an interrupted turn and limits accidental information exposure when using the same screen at the table. |
| 3 | Run timed physical playtests with an experienced and a new operator | Record minutes per bot round, lookups, rescans, unclear choices and interventions. Human effort and challenge remain unknown. |

**Observed operator workload, not measured playing time:** each round requires one Staff draw and Front lookup, potentially updating five Objectives, inspecting up to eight strategy cards, scanning the board for threats/targets and ranking moves. Each shortlisted attack needs two fire-column lookups plus bonuses; budget selection and resolution can require recalculation. The “three-target shortlist” does not remove the whole-map scan needed to identify those three, and Objectives/MO targets can add more. Tracking these intermediate results is the most direct simplification. There is no evidence here for a particular minutes-per-round promise.

## 6. Evidence and reproduction

The accompanying ZIP includes scripts, JSON results, engine-position fixtures, source hashes, the exact build comparison and rendered shipped pages. Publisher rulebook/card PDFs and Rally the Troops engine code are not redistributed in it; their URLs/pin are documented. The tests use the repository's normal engine setup.

For most scripts, set `GS_ROOT` to a checkout at the reviewed production commit with its engine installed, or place that checkout at `../source` relative to the extracted evidence folder. `event-proof.cjs`, `fix-checks.cjs` and `mo-proof.cjs` retain that `../source` convention. Commands and fixture limitations are detailed in `evidence/README.md`.

Core commands:

```sh
node evidence/app-state-checks.cjs
python evidence/print-checks.py
node evidence/multinational-proof.cjs
node evidence/event-proof.cjs
node evidence/fix-checks.cjs
node evidence/mo-proof.cjs
node evidence/boundary-checks.cjs
node evidence/hidden-info-check.cjs
node evidence/strategy-sweep.cjs
```

The scripts deliberately assert the current observed defects where labelled; a passing reproduction script is not a passing release. Change those expectations to the corrected behavior when implementing the fixes. Engine state files are for the engine harness. The companion cannot import board positions and has no session-import control.

## 7. Release decision and remaining coverage

**Hold v0.7.2 for a corrective patch before recommending the supplied package for general use.** The card PDF is the immediate blocker for print-and-play. Fix GS-09, both calculator verdict cases and GS-14 first; then align event/movement handlers with the paper rules and make saved-state recovery reliable. GS-12 is small enough to include in the same patch. None requires changing native supply, combat, scoring or other game rules.

Evidence supporting that decision: reproducible print fragmentation, exact calculator counterexamples, a legal minimal position that produces an incompatible attack plan and an under-threshold actual attack, repeated known policy mismatches, and concrete recovery failures. Conversely, all four shipped HTML files rebuild exactly, the original five fixes remain supported, the examined printed values agree, and the declared stress games finish with error and repair counts exposed.

Before release, rerun the focused reproductions and new-seed campaigns after fixes, inspect every regenerated print page, and complete a real-browser pass on desktop and mobile. If claiming stronger play, compare old/new policies on matched seeds and confirm improvements on a separate fresh set. Do not use wins against these shared-code stress variants as that confirmation.

Important gaps remain: hosted artifact bytes and controls, mobile/touch/accessibility behavior, browser persistence on real devices, physical cutting/duplex alignment, timed human operation, strength against experienced people, exhaustive event/rare-state combinations and an independent audit of the entire rules engine. The full-game simulations are broader than the focused assertions, but they still inherit engine and policy assumptions. The earlier balance/difficulty figures are not independently revalidated by this audit.
