# v0.8.2 verification evidence

Review: `50dd24589968c88dd115a3afa48d5da3e70f99b2`. Engine: `c58b0b4a33e227faf73cbe561f3bede17087a142`, with the repository's hook. Use `sim/setup_engine.sh` if needed. Node 24.22.3, Python 3.12.14; PDF parity requires PyMuPDF. No Chrome runtime or live browser was used.

From the repository root, substitute this directory path for `VERIFY`:

```
node app/test_companion.cjs
node sim/tests/ties.js
node VERIFY/verify-companion.cjs . VERIFY
node VERIFY/verify-calculator.cjs . VERIFY
node VERIFY/verify-policy.cjs .
python3 VERIFY/verify-records.py
GS_ROOT=$PWD python3 VERIFY/print-parity.py
python3 print/check_print.py
python3 audits/general-staff-v0.8.0/verification-checker-04a4734/verify_card_guard.py
```

`verify-companion.cjs` confirms A01's corrected behavior and positively reproduces B01/B02 at the audited commit. A passing B01/B02 reproduction means those Low issues exist; it is not a regression fix. Repeated-import storage failure uses an explicit synthetic 5,242,880-character limit; it does not measure a real browser's quota. The actual exponential saved-string growth is measured without a quota too.

`verify-policy.cjs` checks the original three positions, actual Reserve Box selection, primary army priority and a four-army advance through real engine controls. Fixtures for the original cases are in `sim/tests/fixtures/`.

```
STRICT=1 node sim/final_eval.js self 20 1200000 > replay20.json
node audits/general-staff-v0.8.1-comprehensive/evidence/audit-run.cjs . release ap 60 3500000 fresh60.json
```

The replay output should have identical `games` records to the first 20 in `sim/results/v0.8.2/self_a.json`. The fresh run uses the previous audit's fail-fast harness and non-enumerable throwing getters for hidden information. No decision exceptions are replaced with arbitrary actions by that harness. The engine itself supplies the legal-action oracle.

Full `fresh60.json` and `replay20.json` are in the evidence ZIP to keep the directly checked-in results compact. Extract the archive into an empty directory to inspect them. All other evidence files are also included in that ZIP; `manifest.json` lists their SHA-256 hashes. `build.json` records the byte comparison performed in a separate worktree. Production code and release outputs were not changed.
