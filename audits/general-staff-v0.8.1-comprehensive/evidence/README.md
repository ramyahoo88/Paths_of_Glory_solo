# Reproducing the v0.8.1 comprehensive audit

Reviewed commit: `1973dd811d4aa8e6ed45a668d96a4245b425a329`, branch `claude-bot`.
Engine: Rally the Troops PoG `c58b0b4a33e227faf73cbe561f3bede17087a142` with the repository hook.

The evidence ZIP contains this entire directory, including the large per-game files and two complete traces. Extract it into the audit directory to run the scoring/summary command. The smaller scripts, fixtures and summaries also appear directly in the repository.

Install the pinned engine using `sim/setup_engine.sh` if `engine/` is absent. Run from the repository root. Tests used Node 24.22.3 and Python 3.12.14. PDF checks require PyMuPDF, Poppler's `pdftotext`/`pdfinfo`; rebuilding printable HTML also requires Pandoc. PDF generation via the repository build additionally requires Chrome and was not run here.

```
node app/test_companion.cjs
node sim/tests/multinational.js
node sim/tests/event_choices.js
node sim/tests/siege.js
node sim/tests/movement.js
node sim/tests/priorities.js
python3 print/check_print.py
python3 audits/general-staff-v0.8.0/verification-checker-04a4734/verify_card_guard.py
```

Focused audit scripts (substitute the audit directory path for `AUDIT`):

```
node AUDIT/evidence/companion-expanded.cjs . AUDIT/evidence
node AUDIT/evidence/focused-policy.cjs .
GS_ROOT=$PWD python3 AUDIT/evidence/print-parity.py
node AUDIT/evidence/scoring-and-summary.cjs . AUDIT/evidence
```

`companion-expanded.cjs` and `focused-policy.cjs` positively assert the existing defects at this commit. They should need updating after the defects are fixed. A passing reproduction does not certify correct behavior. The companion script runs actual HTML callbacks with DOM/storage doubles, not a real browser.

Fresh campaign commands:

```
STRICT=1 node sim/final_eval.js self 100 3400000 > self-100.json
node AUDIT/evidence/audit-run.cjs . release ap 20 3410000 release-ap.json
node AUDIT/evidence/audit-run.cjs . pressure ap 20 3410000 pressure-ap.json
node AUDIT/evidence/audit-run.cjs . pressure cp 20 3410000 pressure-cp.json
node AUDIT/evidence/audit-run.cjs . preservation ap 20 3410000 preservation-ap.json
node AUDIT/evidence/audit-run.cjs . preservation cp 20 3410000 preservation-cp.json
node AUDIT/evidence/audit-run.cjs . exploitation ap 20 3410000 exploitation-ap.json
node AUDIT/evidence/audit-run.cjs . exploitation cp 20 3410000 exploitation-cp.json
node AUDIT/evidence/audit-run.cjs . release ap 1 3410000 representative.json trace
node AUDIT/evidence/audit-run.cjs . release ap 1 3410001 turnlimit.json trace
```

The trace runs repeat two baseline seeds; they are not extra unique games. The harness has no action-exception substitution. It checks legal offers, hidden reads, supply after moving, Staff cycles and a VP ledger. Hidden fields are non-enumerable throwing getters during policy decisions, allowing the supply-only structured clone to omit them. Original fields are restored before engine actions. These are coverage checks, not a separate game engine.

Smallest finding fixtures:

- A01: normal callbacks in `companion-expanded.cjs`; output in `companion-expanded-results.json`.
- A02 Forward: `forward-tie.json`, real Staff cards 3 and 6.
- A02 SR: `sr-tie.json`, real Staff cards 1 and 4.
- A02 replacements: `rp-tie.json`, real Staff cards 1 and 4.
- Rejected capture hypothesis: `capture-distance.json`; both North/South outcomes follow the literal printed rule and pass.

`build.json` contains byte-comparison results from a separate worktree. `source-manifest.json` pins reviewed production bytes. `print-parity.json`, `rendered-inspection.json` and `regressions.json` record the print and regression checks. `summary.json` combines totals, independent scoring reconstruction and planning-work counters. Full official PDFs and licensed engine sources are not redistributed in this evidence.
