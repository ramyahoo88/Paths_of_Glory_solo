# Response to the comprehensive v0.7.5 audit

All five findings and the carried-forward EV-01 are fixed in **v0.7.6**. The code is at commit `8f71855`, and the evidence was rerun from a clean worktree of that commit. No native Paths of Glory rule was changed. Each fixed audit position is now a repository regression, using the audit's fixtures (`sim/tests/fixtures/`).

| ID | Fix | Regression |
|---|---|---|
| **C01** First step out of supply | New `prospectiveSupplied`. It asks the engine whether the moving units would be supplied in a space, judged on a copy of the game: the units are moved there, control is taken and supply is recomputed. So a capture that opens a supply route still counts as supplied. Supply is now a filter on every step (the nearest supplied step is taken), on the safety exit and on the first-step planning check. Rules §6 now lists supply among the step conditions. If no step nearer the destination qualifies, the stack stops, or on the first step the move is dropped. | `sim/tests/movement.js`: in the Skopje → Sofia position (seed 1080907) the stack is put back (`undo`) instead of entering Sofia. Played out, SB 1 and its corps end the round in Skopje, supplied. Control: with the Strumitsa–Salonika route open, Sofia counts as supplied. |
| **C02** Corps-only siege entry | The step capacity now judges the fort-strength test on the complete group that could still be formed (strongest first, with the Guard and siege rules applied), not on the first selected corps. Moves are no longer planned through a space the same Operation activates for attack, since units cannot end there. The abandoned-move exit no longer has a room-only last resort: it uses the same legality, supply and stacking test as every step. Only when no such step exists may the units pass through a space they cannot end in (keeping stacking and supply) and return; this is counted. A handler that still finds nothing is counted as well. | `sim/tests/movement.js`: in the audit's Mulhouse/Strasbourg fixture, both corps enter Belfort and besiege it, with no reset. |
| **C03** Brusilov trench cancellation | Handler: use it whenever the engine offers it, which is the first eligible Russian attack, never against German defenders. Printed in §9 *Event choices*, the reference summary and the Allied event list (card 46). Kerensky's note was added there too. | `sim/tests/priorities.js`: the seed 1080927 Cracow state chooses `use`, `trenches_canceled` is set, and the option is not offered again. |
| **C04** Tie and front order | Equal-CF attack origins use the Tie, both in planning (`attackCandidates`) and in execution (`bySpace`). Attrition, siege rolls and entrenchment rolls go in front order, then the Tie (`phaseOrder`), instead of the generic helper. The Move list breaks remaining ties by the destination's Tie (Q2). §5.2, §6 and §9 say so. | `sim/tests/priorities.js`: Metz with Tie North, Strasbourg with Tie South. Staff card 10 rolls Ivangorod before Nancy, and the control card (West first) rolls Nancy first. |
| **C05** Damaged commitment name | The commitment is checked against an explicit list of the three levels. | `app/test_companion.cjs`: `constructor`, `__proto__`, `toString` and `nonsense` are all rejected with the damaged-session notice and no "undefined front". |
| **EV-01** Provenance | `sim/provenance.js` stamps every `final_eval.js`, `ab.js` and `vpshift.js` output. The stamp records the bot's commit, whether `sim/` had uncommitted changes, and the engine revision plus hook hash, which `setup_engine.sh` now writes to `engine/VERSION.json`. The existing v0.7.5 files get an honestly labelled manifest, `sim/results/v0.7.5/MANIFEST.md`, with declared (not captured) provenance and SHA-256s. | v0.7.6 result files carry the run-time stamp. |

**Rules questions**

* **Q1, event-granted attacks.** §9 now separates the two cases. An event that grants a whole Operation, such as Guns of August, is planned like any Operation, with its bonuses. Only units an event lets attack outside a plan use "best Edge, no bonuses". This is what the simulator does.
* **Q2, equal moves from one origin.** The next comparison is the destination's Tie. This is printed and coded.

**Usability, done in v0.7.6:**

* **Next round** and **Next turn** buttons. Next turn clears the MO and RP boxes, Undo restores the tracker, and the round is now limited to 1–6.
* **Export / Import** of a session through a text box, checked by the same validator as reload. A damaged import changes nothing, and Undo returns to the previous deck.
* A labelled session text box.

Not yet done: the planning worksheet, the offline rules tab, the calculation breakdown, a full accessibility pass and print navigation polish.

**Supply-policy check in evaluation.** `final_eval.js` now judges every movement step on a copy of the game and records any that leave the moving units out of supply. `summarize.py` reports the count in the run-health table.

**Browser.** The rebuilt page was loaded in headless Google Chrome at 390 px width: the script ran, the controls rendered, and the screenshot was inspected. Real-device, keyboard and screen-reader testing remain undone.
