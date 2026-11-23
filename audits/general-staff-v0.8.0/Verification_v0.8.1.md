# Independent verification of General Staff v0.8.1

Reviewed release: `a81eda6` on `claude-bot`. This follow-up verifies the v0.8.0 correction and the new guard; it does not repeat the full base-game audit or strength study.

**Verdict: the Medium printed-reference defect is closed. The corrected v0.8.1 release is acceptable for play.** One Low coverage limitation remains in the checker, with no defect found in the shipped Staff cards.

## Verified correction

- Visually inspected the rendered reference page 2. It prints CP Assault +0.75, Press +1.5, Hold +2.25 and explicitly puts West first. All columns are legible; the reference remains seven pages.
- `python3 print/check_print.py` passes on the release. When the v0.8.0 reference PDF is substituted, it exits 1 and flags exactly the two original page-2 mismatches: Stance values and West-first wording. The original Medium finding is therefore closed.
- All 40 companion regression checks pass.
- A separate worktree rebuild produces byte-identical companion HTML, Staff-card HTML, reference HTML and rules HTML. PDF binary reproducibility was not claimed.
- The only change to `sim/bot.js` is a comment clarifying front order. The remaining simulation files have no changes. There is no bot behavior change requiring a new strength study.
- The existing response agrees with the complete original review's finding and fresh-seed result: 24/200 CP wins with the old settings, 63/200 with v0.8.0, on seeds 2200000-2200199. The original review, original archive and expanded evidence are now included in this directory.

Rebuilt companion SHA-256: `e76f9c646277ebc60c9bdd3278509d3e77f2f47ce7be920d42eb393e9e7f5393`.

## Low: Staff-card guard checks presence, not each individual card

**Impact.** A future missing or stale threshold on one Staff card can escape the print check while other cards of that Stance retain the correct line. This is a checker-coverage issue. Every shipped Stance line in v0.8.1 is correct.

**Expected behavior.** The new guard is described as checking every printed copy of the thresholds. There are six cards of each Stance.

**Reproduction.** Run `python3 audits/general-staff-v0.8.0/verification-v0.8.1/guard_coverage.py` from a checkout containing the reviewed release. It uses temporary fixture copies. One control substitutes the old reference and verifies the expected two failures. The second deletes only the first `CP +0.75 · Allies +1` line from the Staff-card PDF, leaving five correct Assault lines. It changes no card number, Tie or heading.

**Observed.** The second mutated PDF still produces `PASS`, exit 0, including `Staff cards: A thresholds: ok`. Logs for both controls are alongside the script. These mutations were not applied to the release files.

**Source.** `print/check_print.py:48` supplies one whole-document presence check for each Stance; line 54 uses substring membership. It does not associate the threshold with each of the 18 card faces.

**Smallest improvement.** Check the threshold within every card face, using its card number and Stance. A simpler count of exactly six correct lines per Stance would catch the reproduced missing-line case, though card-level checks would be stronger. Keep the existing old-reference negative control.

## Publication scope

The maintainer clarified that this project has no Cloudflare deployment. The repository companion was independently checked. The private claude.ai page and its reported byte identity were not independently accessed; no Cloudflare action is needed.
