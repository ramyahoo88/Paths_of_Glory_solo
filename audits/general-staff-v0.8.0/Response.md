# Response to the v0.8.0 review

The original response was written from the user-relayed summary on 22 Nov 2026. The complete [independent review](Review.md), [original review/evidence archive](General_Staff_v0.8.0_Review_and_Evidence.zip), and [expanded evidence](evidence/) are now included alongside it. See the [v0.8.1 verification](Verification_v0.8.1.md) for the independently checked closure and the remaining Low checker-coverage limitation.

## Reported results

* **CP strength confirmed.** On 200 fresh matched seeds against the unchanged Allied bot, the CP bot won **24/200 (12%)** with the old settings and **63/200 (31.5%)** with v0.8.0. That is +19.5 points, with no CP decision exceptions.
* **Companion.** A rebuild matched the committed file byte for byte, and the regression checks passed.

## Finding: reference page 2 printed the old CP rules (Medium)

Page 2 of `print/out/reference.pdf` (*Fronts, Objectives and Edge*) still gave the v0.7.6 CP Stance thresholds (Assault 0, Press +0.75, Hold +1.5). It also gave the card-front-first order without the CP bot's West-first rule. The rules, reference page 1, the Staff cards and the companion were already correct.

**Fixed in v0.8.1.** The two generator lines in `print/build.js` now print:

* the CP thresholds as **Assault +0.75, Press +1.5, Hold +2.25**;
* the front order with **"The Central Powers bot always puts the West first, then the Staff card's front"**.

The reference was regenerated and is still seven pages.

**Guard.** `print/check_print.py` now reads the thresholds and the CP West-first default from `sim/bot.js` and the shift from `app/build_app.js`. It checks every place they are printed:

* the rules' Stance table;
* reference pages 1 and 2;
* the three Stance lines on the Staff cards;
* the West-first rule in the rules and on both reference pages.

Run against the v0.8.0 reference, it reports exactly the two mismatches above.

## Live deployment

The project has no Cloudflare deployment of its own. The companion is published two ways:

* as a file in the repository, `app/General_Staff_Companion.html`;
* as a private claude.ai artifact, which was republished for v0.8.1.

The bot's behaviour is unchanged from v0.8.0.

# Response to the v0.8.1 verification

The verification ([Verification_v0.8.1.md](Verification_v0.8.1.md)) closed the Medium finding. It found one **Low** checker limitation: the Staff-card guard only checked that each threshold line appeared somewhere in the PDF. A single card could lose its line and still pass.

**Fixed (tooling only; no printed file changed).** `print/check_print.py` now checks the 18 Staff card faces one by one. It places every word on a card by position: the nearest "FRONT NUMBER" label for the column, and the card number at the foot of the face for the row. For each card it requires two things:

* the printed Stance name matches that card's Stance in the deck (`makeDeck()` in `sim/bot.js`);
* there is exactly one threshold line, and it gives that Stance's CP and Allied values.

A mismatch names the card. The checker stops with a message if `makeDeck()` changes shape.

**Negative controls.** `print/test_check_print.py` builds temporary copies and never touches the release files. It checks five cases:

| Control | Expected result | Result |
|---|---|---|
| Release files | pass | pass |
| v0.8.0 reference (from git) | fail, page 2 only | fail: exactly the two page-2 mismatches |
| Card 1's threshold line deleted (the reviewer's case) | fail, card 1 | fail: card 1 only |
| Card 5 prints the v0.7.6 threshold | fail, card 5 | fail: card 5 only |
| Card 3 prints "Press" over the Hold threshold | fail, card 3 | fail: card 3 only |

The reviewer's `guard_coverage.py` needs PyMuPDF, which is not installed here, so it was not run. Its single-card mutation is the same case as the deleted-line control. Against the fixed checker it should now stop at its assertion that the checker passes, which is the intended outcome.

**Independent follow-up:** [verification at `04a4734`](Verification_checker_04a4734.md) confirms that behavior with the original reviewer script and closes the Low finding. An additional 23-control PDF test rejects a missing threshold on each of the 18 Staff cards separately, plus stale values, a wrong Stance, and a duplicate threshold. The new Chrome-dependent harness could not complete in that environment; the independently generated PDF controls cover its five cases, with the dependency limitation recorded in the verification.
