# v0.8.3 closure evidence

Reviewed release: `23dfb51`, branch `claude-bot`. Install the pinned engine via `sim/setup_engine.sh` if necessary. Tests used Node 24.22.3, Python 3.12.14 and PyMuPDF. Substitute this directory's path for `VERIFY` below; run from the repository root.

```
node app/test_companion.cjs
node VERIFY/verify-companion.cjs . VERIFY
node VERIFY/verify-calculator.cjs . VERIFY
node audits/general-staff-v0.8.1-comprehensive/verification-v0.8.2/verify-policy.cjs .
python3 print/check_print.py
python3 audits/general-staff-v0.8.0/verification-checker-04a4734/verify_card_guard.py
git diff --exit-code 657e6bb 23dfb51 -- sim/bot.js sim/events.js sim/board.js sim/engine_hook.js
```

`verify-companion.cjs` updates the original B01/B02 expectations and adds varied history-cap and genuine legacy-save migration checks. It retrieves the v0.8.2 HTML through `git show 657e6bb:app/General_Staff_Companion.html` and executes that old script to generate the legacy fixtures in memory. No multi-megabyte saves need to be distributed. It uses an explicit synthetic storage cap; it is not a browser quota test.

`verify-calculator.cjs` checks the expected-hit arithmetic against independently transcribed tables, damaged saves and repeated deck cycles. `build.json` records the separate-worktree byte comparisons. `print-comparison.json` records normalized PDF text identity with v0.8.2. `geometry.json` records the all-page text bounds. `source-manifest.json` pins reviewed production files.

The new real-browser script was reviewed but not run in this verification. The companion fingerprint matches the reported private-page fingerprint; direct private-page retrieval was not performed.
