# Response to the comprehensive v0.7.2 audit

All nine findings were reproduced and fixed in **v0.7.3**. Six were new (GS-09 to GS-14). Three were carried over from the v0.7.2 re-audit (GS-06 to GS-08). No native Paths of Glory rule was changed.

Following the printed procedure everywhere, and above all no longer throwing away the plan for event-granted Operations, made both bots much stronger. Against the v0.7 reference bots, the Allied bot now wins 90–95% (was 66–68%) and the CP bot 49–56% (was 32–45%). Strict self-play is 84% / 16%. Test results are in [`sim/REPORT.md`](../../sim/REPORT.md) under *v0.7.3: comprehensive audit fixes*.

| ID | Finding | Fix | Check |
|---|---|---|---|
| GS-09 | Six Staff-card faces split across PDF pages | Six cards per Letter page (two rows of three). Each face page is followed by a page of backs, for long-edge duplex; or print the odd pages only. Cards cannot break inside. | `print/check_print.py` requires each face's top label, Tie line and card number on one page, and every card 1–18 exactly once. It fails on the v0.7.2 PDF and passes on v0.7.3. All six pages were rendered and inspected. |
| GS-10 | Calculator rejected a qualifying last-chance MO | The MO field now reads "Attack meets an unmet MO". In rounds 5–6, an attack below the Stance is shown as mandatory: *attack: last-chance MO*, with its Score and the normal threshold. A new turn/round/MO tracker shows when steps 2 and 4 apply. | `app/test_companion.cjs`: the audit's case shows the mandatory verdict, and the rounds 3–4 control stays "too weak". |
| GS-11 | Empty-fort mode kept stale unit CF | Defence is `(units ? unit CF : 0) + fort`. Unit CF, the army box and trench are disabled when "units in the space" is off. | The audit's 8-CF vs empty fort 2 gives the same result (defender 0.8, attack) with 0 or 12 left in the CF box. Ticking the box again restores the occupied defence. |
| GS-14 | Plans combined nationalities that could not attack together | Attacking groups are built space by space, strongest first. A space is skipped if its units could not legally join those already taken (the engine's `get_attackable_spaces`, which applies 12.1.11.1, the London rule and similar). The same applies to the shortlist Score, budget selection, resolution and opportunistic attacks. Before committing, an ordinary attack is checked against its selected units and called off if more than 0.5 below the Stance. Rules §5.2 and §5.4 now explain this. | `sim/tests/multinational.js`, the audit's Verdun/Nancy/Metz position. The bot now activates only Nancy (BR 1, Edge +1.2, Score +2.7, above Hold's 2.5) for 1 OP and attacks with that group. The common-stack control still plans the combined attack. |
| GS-06 | Event choices fell through to generic defaults | Named rules, printed in §9 *Event choices* and coded: Landwehr, War in Africa, Salonika, entering neutral units, Withdrawal, trench-negating cards and Kerensky Offensive (each rule is in §9). | The audit's `event-proof.cjs` on seed 951000: Landwehr flips GE 7 (army in contact) instead of passing, and War in Africa removes a Reserve Box corps instead of giving the VP. Strict campaigns (740 games) record **no** choice-bearing states without a bot rule. |
| GS-07 | Abandoned movement re-entered fallback and overstacked | Four changes. A stack moves no more units than its first step can take (§6). At planning, a move with no engine-legal first step is dropped. An abandoned move never resumes: it ends the activation if the engine allows, otherwise entrenches or takes one safe step. A related fault was also fixed: an event-granted operation now keeps the plan made for it. Before, its moves were lost and the units were moved by the generic fallback. SR now picks only units with room at a destination, and movement respects the Brest-Litovsk stacking rule. | Rule-violation resets in strict evaluation went from 67 in 740 games (v0.7.2) to **1** in 740 (v0.7.3): an army too weak to besiege. Units moved one safe step after an abandoned move: 8 in 740 games. |
| GS-08 | Event trench used unprinted priorities | Front order, then the Tie, as printed. The old contact/VP rule is kept only as an experiment switch. | The audit's seed 951000 position now places the trench where the printed order says. |
| GS-13 | Damaged saved sessions broke startup or Undo, and failed writes were silent | A session is validated before use: side, commitment, a deck plus discard holding each card exactly once, and every history snapshot. Rejected data is kept under `gs-companion-rejected`, with a visible notice and a fresh deck. A damaged Undo step is skipped with a notice. A failed save shows "Not saved". Saves carry a format number. | `app/test_companion.cjs` covers each of the audit's damaged fixtures, malformed JSON and a throwing `setItem`. |
| GS-12 | Undo after a reshuffle restored the wrong counters | The snapshot is taken before the reshuffle. | After 18 draws, a draw and an Undo, the state is identical to before: 0 in deck, 18 discarded. |

**Rules questions raised by the audit**

1. *War in Africa and optional transfers.* The bot removes a British corps rather than give the VP: one in the Reserve Box first, then one out of contact, then any. Salonika sends corps up to the limit, never one in contact. In paired tests the corps choice beat giving the VP by about two points on both seed sets (Allied bot 95% vs 92% and 90% vs 89%).
2. *Moving fewer units into a crowded space.* Yes: the stack moves the strongest units that fit the first step, still applying the Guard rule. If none fit, the move is dropped (§6).

**Usability recommendations**

Done in v0.7.3:

* the round and MO tracker;
* the mandatory-MO message next to the verdict;
* the New deck control;
* the saved/unsaved notice;
* disabled inactive fields;
* print navigation notes on the card pages.

Not done yet:

* export/import of sessions;
* a planning scratchpad;
* an offline rules tab and glossary;
* print page numbers and repeated table headers;
* a full accessibility and keyboard pass;
* timed physical playtests.

**Browser check.** The page was loaded in headless Google Chrome at desktop width (1280 px) and phone width (390 px). The script ran: deck counter, calculator and tracker hint were filled in, and screenshots were inspected. This is not a test on a real mobile device and not an accessibility audit.
