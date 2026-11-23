# General Staff v0.8.3 — Closure Verification

22 November 2026 · Codex · `claude-bot`

**B01 and B02 are closed. No new defect was confirmed in this targeted verification.** A01, A02 and Q01 remain closed. The companion rebuilds exactly, the older-save migration works, and the ten-import limit preserves the sessions it retains.

Reviewed release: **`23dfb51`**; the full commit and source hashes are in the accompanying evidence. This review verifies the companion-only patch against the preceding v0.8.2 report. The playing-code files `sim/bot.js`, `sim/events.js`, `sim/board.js` and `sim/engine_hook.js` are unchanged. No new campaign simulation was needed or counted.

## B01 — Round-6 combined draw: closed

The actual shipped script disables Next round + draw at round 6 and guards the handler before either taking a snapshot or drawing. A forced call to the callback at round 6 leaves the **entire state unchanged**, including the Undo history. Six cards remain drawn, rather than seven.

The independent test also checks the nearby outcomes: round 5 to 6 works; Undo returns to round 5 and re-enables the button; Next turn re-enables it; reload preserves the disabled state. Plain Draw remains available for corrections. The tooltip directs the operator to Next turn, then Draw.

## B02 — Exponential import history: closed

The original repeated-import case now gives exactly the reported measurements:

| Imports | v0.8.2 characters | v0.8.3 characters |
|---|---:|---:|
| 1 | 588 | 552 |
| 10 | 104,273 | 2,613 |
| 16 | 6,556,463 | 2,467 |

The first ten imports add **229 characters each after the first** in this fixture. From import 11 through 18 the size remains 2,467 characters. The previous synthetic 5,242,880-character storage cap is never reached. These are saved-string lengths from the original deterministic fixture, not universal browser quota measurements.

Additional independent checks passed:

- Twenty-five imports with different sides, commitments, turns and drawn cards, interleaved with ordinary actions. Reload before every Undo. Exactly ten import checkpoints can be undone; each restores the correct retained session.
- Five ordinary draws before ten imports. Ten import Undos restore the original session exactly, and all five earlier draws can still be undone.
- Two imports with intervening tracker changes and draws, reloads and successive Undos. Side, commitment, deck, current card, tracker and retained history stay coherent.
- Genuine saves produced by the **v0.8.2 script**, with 1, 2, 10, 12 and 16 nested imports. Each loads without a damaged-save notice and can undo its original import chain. A new import converts the legacy representation and applies the ten-checkpoint bound.

The largest legacy fixture contains **6,556,351 characters** and normalizes to **2,390** after a new import. Its donor context differs from the original benchmark above, accounting for the small size difference. All legacy checkpoints are readable before adding the new, capped checkpoint; preservation beyond the newly documented ten-import limit is not claimed.

Nested checkpoint steps are now structured objects. The session's own top-level history remains string snapshots, so old saves are supported. This removes repeated JSON escaping while retaining the complete-session restoration introduced for A01.

## Release and regression verification

All **71 shipped companion checks** pass. The independent calculator/deck harness passes **13,080 calculator cases** and ten complete deck cycles, with reload, reshuffle Undo and new-deck Undo. The prior policy verification also passes against the unchanged bot. The print checker and all **23 independent PDF mutation controls** pass.

A separate worktree at the reviewed release rebuilt all four HTML outputs. Each is **byte-identical** to the shipped file. Companion size: **37,598 bytes**; SHA-256:

`8d8d6030bbf1952f1739b922e6dd4282d23fdb9de4ec9f22f95a3261a2925f0d`

This matches the fingerprint reported for the republished private page. It establishes that the checked repository file has that fingerprint; the private publication itself was not independently retrieved. If its reported full-file hash was measured from the published file, the bytes are identical.

The three printed PDFs have the same extracted text as v0.8.2 after substituting the release number. Page counts remain **11 rules / 7 reference / 6 cards and backs**. All 24 pages pass the off-page text scan. No printed-rule or card-policy change was found.

The new `app/test_browser.py` was reviewed. It uses real Playwright controls, storage and reloads; the author reports eleven passing checks. Those browser checks were not independently executed here. Independent verification used the shipped script's real callbacks with DOM/storage doubles. Browser layout, browser-specific persistence and direct private-page retrieval remain outside the evidence from this environment.

## Verdict

**Close both Low findings.** The release's companion fixes are verified, with no further corrective patch requested by this review. The prior bot-strength results remain applicable because the playing code is unchanged. Physical playtesting and the deferred attack/move worksheet remain useful next steps; neither is a release defect.

Only verification documents, scripts and evidence were added. Production code, rules and published files were not changed by this review.
