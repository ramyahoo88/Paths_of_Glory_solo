# Verification of the per-card print-check fix

Reviewed commit: `04a4734dba305afde50297b1dfda98a7542edf7a` on `claude-bot`.

**Verdict: the Low checker-coverage finding is closed.** No further defect was found in this focused verification. The released bot, companion, rules and printed files are unchanged, so v0.8.1 remains the release version.

## Results

`python3 print/check_print.py` passes on the shipped files and reports all 18 Staff cards as valid.

The original reviewer script, `verification-v0.8.1/guard_coverage.py`, was run with PyMuPDF available. It rejects the old reference with exactly the two page-2 mismatches. For its deleted card-1 threshold, the revised checker returns exit 1 and names card 1 only. The historical script then stops at its old `assert result.returncode == 0`, exactly as expected after fixing the false acceptance. That assertion failure demonstrates closure of the original gap; it is not a checker regression.

An additional, independent test edits temporary PDF copies directly with PyMuPDF. It does not use the checker's geometry or HTML mutation code to choose the expected outcome. Run:

```sh
python3 audits/general-staff-v0.8.0/verification-checker-04a4734/verify_card_guard.py
```

All 23 controls pass:

| Control | Cases | Verified result |
|---|---:|---|
| Shipped files | 1 | Pass; all 18 cards valid |
| Old v0.8.0 reference | 1 | Fail; exactly the two original page-2 lines |
| Delete one threshold, separately for every Staff card | 18 | Each fails; only the affected card is named |
| Card 5 with the old CP Press threshold | 1 | Fail; card 5 only |
| Card 3 showing Press instead of Hold | 1 | Fail; card 3 only |
| Add a second valid threshold line to card 2 | 1 | Fail; card 2 only |

The duplication control additionally confirms that the checker enforces exactly one valid threshold line per card. The 18 deletion controls exercise all three columns and both rows on all three face pages.

## Scope and dependency limit

The new `print/test_check_print.py` was attempted, but it could not complete because this environment lacks `google-chrome`. An attempted Playwright browser installation was unavailable because its download returned HTTP 403. This is an environment limitation, not a finding against the checker. The independent PDF controls above cover the same five behaviors plus the remaining card locations and a duplicate line; this note does not claim the Chrome-dependent harness completed here.

Git comparison confirms there are no changes from `2b411bf` to `04a4734` under `sim/`, `bot/`, `app/` or `print/out/`. The changes are confined to the checker, its new test, and documentation. No new game-strength simulation or rebuild of unchanged release files was necessary.

The [logs and independent test](verification-checker-04a4734/) preserve the completed checks, the expected historical-script assertion failure and the Chrome harness dependency failure. All mutations used temporary files; no shipped PDF was changed.
