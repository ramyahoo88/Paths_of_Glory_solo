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
