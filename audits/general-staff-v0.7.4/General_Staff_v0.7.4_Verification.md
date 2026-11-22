# General Staff v0.7.4 verification

**22 November 2026 | The two targeted corrections pass. Close GS-06 and GS-15.**

Reviewed `ramyahoo88/Paths_of_Glory_solo`, `claude-bot`, commit `8cd287bdd85caef481ce280721b42185729c0d50`, from a fresh clone. The pinned engine was fetched successfully by the shipped setup script. This is a focused follow-up to the v0.7.3 re-audit. Production code was not modified.

## Corrections verified

**GS-06, Salonika: closed.** The event now has priority 0 unless a legally eligible British or French corps is in the Reserve Box or an Allied port out of contact. The eligibility query uses the pinned engine's port, BEF, minor-British and stacking helpers. The original contact-only fixture chooses the Automatic Operation, and full seed 1080055 finishes without a Salonika fallback or safety-path transfer. The printed section 9 and Allied event-list row 30 carry the condition.

**GS-15, event Tie: closed.** War in Africa and Salonika choose Port Said with Tie North and Alexandria with Tie South. The Reserve Box still comes first. Independent cross-front tests also show that changing the Staff front changes which available front is latest, while the Tie continues to apply within that front.

The new nine-check repository test passes. Another 28 independent controls cover British/French eligibility, BEF and minor-British exclusions, army exclusions, port/Reserve locations, no available corps, contact, a full Salonika destination, units already at Salonika, cross-front ordering, and stopping after the only safe transfer. The defensive `salonikaForced` path remains in the code, is counted explicitly, and is unused in both the committed 600 games and the new 48-game batch.

## Release and regression checks

| Check | Result |
|---|---|
| Fresh-clone engine setup | Pass; pinned RTT revision c58b0b4 |
| Event-choice regression | 9 checks pass, including original reached seed 1080055 |
| Independent event controls | 28 checks pass |
| Companion regression | 28 checks pass, including saved-session recovery, reshuffle Undo and both calculator cases |
| Multinational regression | Nancy alone attacks Metz with BR 1; Edge +1.2, Score +2.7; common-stack control passes |
| Separate-path HTML rebuild | All four shipped HTML files match byte for byte |
| Print checks | All 18 card faces remain whole, with six matching backs per back page; reference content comparisons pass |
| Changed printed text | Rendered rules page 9 and Allied event-list page 6 inspected; Salonika condition and event Ties agree with the code |

Build hashes and the print comparisons are in the evidence. PDF regeneration and a new real-browser/phone/accessibility pass were not performed. Hosted Claude artifact parity was not independently verified.

## Campaign evidence

The committed v0.7.4 files contain exactly 600 distinct seeds, 1080000-1080599. Every game is marked complete, with no exception or error. Independent aggregation reproduces **510 Allied wins and 90 CP wins**, zero generic fallback choices and zero forced Salonika transfers. The disclosed two rule-violation resets both belong to seed 1080569.

A separate strict run used **48 new seeds, 1080600-1080647**: **41 Allied wins and 7 CP wins**, all complete, no exceptions, no generic fallback, no forced Salonika transfer and no rule-violation reset. The raw output is included. This was an additional batch, not an independent replay of all 600 committed games.

The older v0.7.3 self-play/baseline records are now present: 740 individual games, including 600 self-play games with **501 Allied and 99 CP wins**. Their completion and health records agree with the published totals.

**Remaining evidence limitation:** the twelve older `paired_*.json` files contain aggregate win rate, mean VP, error and ending counts. They contain no individual game records or seed field. The handicap JSONL is aggregate too. Thus the self-play/baseline evidence gap is resolved; the per-game evidence for paired strength/ablation and handicap claims remains unavailable. The README supplies seed ranges and commands. It should also explicitly pin the v0.7.3 candidate to `2d8abad` when reproducing those old results; running the same commands on current v0.7.4 does not reproduce a frozen older candidate. The report correctly states that the movement ablation combines three fixes and that ablation gains are not additive.

## Disclosed movement limitation, traced precisely

The two resets are caused by **moving away from a siege and leaving too little force behind**. In seed **1080569**, Central Powers turn **9 round 6**, and again turn **10 round 3**, a Fill move goes from Nancy toward Cambrai. The moving group initially contains **GE 6 and corps 78**; it leaves reduced **German corps 73** alone at Nancy's intact **level-2 French fort**. The engine flags insufficient strength to besiege and the harness resets/replans the Operation. The full campaign finishes as recorded: CP win, turn 13, VP 20, 2,337 decisions. That exact outcome and decision count were independently replayed.

This is the previously disclosed repair limitation. The remaining siege force is one corps; describing it as an army being too weak is inaccurate. Native [Living Rules section 15.2.4](https://gmtwebsiteassets.s3.us-west-2.amazonaws.com/nnpg/PoG-DeluxeRules2022Final.pdf) requires a fort that remains occupied after movement to remain adequately besieged. A person operating the paper bot must apply that restriction when choosing movers.

**Smallest follow-up:** check the force left at a besieged origin before accepting a move, and again when choosing its actual movers. Retain a legal besieging force or skip that move; an empty origin may be vacated normally. Relevant source: `sim/bot.js:809` for current Guard/mover selection, `:825` for adding movers and `:838` for the first-step planner check. The two exact states and decision traces are retained in the evidence. Add both to movement regressions before a v1.0 rules-conformance claim.

## Verdict

**The v0.7.3 re-audit's two requested corrections are verified and can close. v0.7.4 is suitable for continued tabletop playtesting.** The disclosed siege-withdrawal repair, missing individual paired/handicap evidence and unverified hosted/browser parity remain explicit limits. This focused verification is not a new comprehensive certification or a human-strength measurement. No merge or public deployment was performed.
