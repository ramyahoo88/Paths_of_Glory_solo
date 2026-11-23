# General Staff — simulation report

*Covers General Staff **v0.7**, with checks of **v0.7.1** to **v0.7.6** and the Central Powers changes of **v0.8.0** (print fix in v0.8.1) (rules: [`bot/General_Staff_Rules.md`](../bot/General_Staff_Rules.md)). Written 22 November 2026.*

## Summary

* **v0.8.0 / v0.8.1 (current).** The Central Powers bot always puts the West first and needs 0.75 more Edge to attack, so it makes fewer, better-placed attacks. GPT's five recommendations and my own campaign-focus ideas were each tested on matched seeds; only these two changes helped. Against the v0.7 reference the CP bot now wins **74%** (was 53–56%; z 4.9 and 4.2 on the same seeds). Strict self-play is **69% Allies / 31% CP** (was 85% / 15%), with every bot run-health count zero. The Allied bot is unchanged (see *v0.8.0*). An independent review (GPT) confirmed the gain on 200 fresh matched seeds: 12% to 31.5%. v0.8.1 corrects reference page 2, which still printed the v0.7.6 CP thresholds.
* **v0.7.6.** v0.7.6 fixes the comprehensive v0.7.5 audit: supply-safe movement, corps gathering to besiege, Brusilov, Tie and front order, companion validation and provenance stamps. Against the v0.7 reference the Allied bot wins 92–94% and the CP bot 53–56%. Strict self-play is **85% Allies / 15% CP**, and every run-health count, including the new supply-policy check, is zero (see *v0.7.6*).
* **v0.7.5.** In v0.7.5, units leaving a siege keep a legal besieging force, and every headline figure comes from per-seed records of one pinned commit. Against the v0.7 reference the Allied bot wins 90–92% and the CP bot 49–59%. Strict self-play is **85% Allies / 15% CP**, with **no rule-violation resets** in 740 games (see *v0.7.5*).
* **v0.7.4.** v0.7.4 corrects the two issues left by the v0.7.3 re-audit: a Salonika corps in contact and the event Tie. 600 fresh strict self-play games: **85% Allies / 15% CP**, no exceptions, no choice left to the engine's default (see *v0.7.4: re-audit corrections*).
* **v0.7.3.** v0.7.3 fixes the nine findings of a comprehensive audit. The simulator now follows the printed procedure in every choice it meets, including event choices and event-granted Operations. Both bots are much stronger against the v0.7 reference: Allies 90–95%, CP 49–56%. Strict self-play is **84% Allies / 16% CP**, with one rule-violation reset in 740 games (see *v0.7.3: comprehensive audit fixes*).
* **v0.7.2.** v0.7.2 fixes the five findings of an independent review: MO credit, a Companion error, one shared Edge-table precision, evaluation honesty and engine setup. Strict self-play over 600 games is **67% Allies / 33% CP**, with no exceptions and no unfinished games (see *v0.7.2: review fixes*). v0.7.1 had made the Allied bot about seven points stronger by following the printed Capture tie-break. The rest of this summary describes v0.7.
* In **200 self-play campaigns** (bot against bot), the Allied bot won **62%** and the Central Powers bot **38%**. Mean VP stayed between 8 and 12 all war.
* Against a **random** player and against a **naive** one-attack, no-events bot, General Staff won **every** game on both sides: 260 of 260.
* About **32,000 further campaigns** compared design alternatives in paired tests. They settled the main choices:
  * attack the best Score, not the first acceptable target;
  * advance after combat;
  * fill endangered spaces by movement, not SR;
  * play every event of priority 7 or more as soon as it is legal;
  * make the Allied bot more cautious, with a once-a-turn rebuild of heavy losses, and quicker to bring armies up to the line.
* The bot never made an illegal move: every decision was chosen from the rules engine's list of legal actions. The 460 evaluation games finished without a harness error. A further 300 fresh self-play games, run from this repository's copy of the code, gave 63% / 37% and no errors.
* These are bot-versus-bot results. They show the procedure is coherent, legal, much stronger than simple baselines, and plays a recognisable war. They do not show how it fares against a strong player. **Human playtesting is the next step.**

## Method

**Engine.** Every game was a full *Paths of Glory* campaign: the Historical scenario, August 1914 to the end, standard cards. Games ran on the open-source **Rally the Troops** rules engine at commit `c58b0b4`. The engine enforces the rules: legal moves, combat, supply, sieges, trenches, mandated offensives, war status, neutral entries, Russian collapse, US entry and victory. The harness adds a read-only hook so the bot can query the board. `sim/setup_engine.sh` fetches the engine; it is not included in this repository.

**Bot.** [`sim/bot.js`](bot.js) carries out the printed procedure. It uses only what a person running the bot at the table has: the open board, the bot's own hand and the current Staff card. It does not look ahead, simulate dice or see the opponent's hand. The constructor's default options are the released behaviour. Options that are off by default are experiments described below and are not part of the rules.

**Opponents.**

* **General Staff itself** (self-play): the most demanding opponent available here.
* **Random**: picks uniformly among legal actions, as a sanity check.
* **Naive**: the same machinery with the main features off. It plays only forced events and makes one attack per action round. It does not advance, move, use SR or fill crisis spaces, and it checks every target. This is roughly a first-draft "one order per round" bot.

**Design comparisons.** A candidate bot played one side against a frozen reference bot on the other side, on the same seeds: 120 or 150 per side. At those sizes the standard error of a win rate near 50% is about ±4 points. Only differences of about 10 points or more were treated as real. When a change made no difference, the simpler procedure was kept.

## v0.8.0: Central Powers strategy

In v0.7.6 self-play the Allied bot won 85%. The CP bot attacked about twice as often as the Allies: 86 attacks a game against 44. GPT's review of v0.7.5 games read this as winning battles while losing the position: ground gained in the East, more lost in the West and Italy. GPT proposed five changes:

1. protect the German front before it becomes a crisis;
2. keep a main front for a sustained campaign;
3. value attacks by their strategic consequence;
4. rebuild German strength selectively;
5. redeploy to the West after success in the East.

I tested those as paper-friendly CP-only rules, together with my own campaign-focus tests: a turn checklist, West first, and East first until Russia falls. Each was played as the CP bot against the **current (v0.7.6) Allied bot** on matched seeds. The v0.7.6 CP bot wins about 16% of these games. The per-seed files are in [`results/v0.8.0/experiments/`](results/v0.8.0/experiments/).

**Screening** (seeds 7001–7200, 200 games each; the v0.7.6 CP bot won 16.5%):

| Change tested | Source | CP wins |
|---|---|---|
| Stance threshold +0.75 (fewer, better attacks; +0.5 and +1 gave the same) | GPT 3 | **23%** |
| West always the first front | my test, GPT 2 | 20% |
| West first and Stance +0.5 | both | 21.5% |
| Attacks with no positional stake count 0.5 less | GPT 3 | 17% |
| Turn checklist: a threatened home VP front, else West in 1914, else East until Russia falls, then West | my test, GPT 2 and 5 | 15% |
| Home VP spaces in contact keep an army or two units; weak ones are reinforced like gaps | GPT 1 | 14% |
| Checklist + home-VP security (with or without the attack penalty) | GPT 1, 2 | 10–13% |
| Rebuild step at 6 missing steps | GPT 4 | 11% |
| Rebuild step at 4 missing German steps only (alone or with Stance +0.5) | GPT 4 | 12.5% (17.5%) |
| East first until the Tsar falls, then West | my test, GPT 5 | 9% |

**Confirmation on fresh seeds** (300 games each, paired by seed with the v0.7.6 CP bot):

| Seeds | v0.7.6 CP bot | West first + Stance +0.75 | Seeds gained / lost | z |
|---|---|---|---|---|
| 8001–8300 | 16.0% | **30.0%** | 76 / 34 | 4.0 |
| 9001–9300 | 15.3% | **32.0%** | 82 / 32 | 4.7 |
| 7001–7300 | 16.5% (first 200) | **25.3%** | — | — |

On seeds 8001–8300, each part alone was smaller: Stance +0.75 gave 18.3% and West first gave 20.0%. Variants of the winning pair on seeds 9001–9300:

* Stance +0.5: 23%;
* Stance +1: 30%;
* adding the attack penalty: 26%;
* adding home-VP security: 27%.

A repeat run gave identical results, confirming the harness is deterministic.

**Adopted in v0.8.0 (CP bot only):**

* **The West is always the CP bot's first front.** The Staff card's front comes second, so the card still varies the secondary effort.
* **CP Stance thresholds are 0.75 higher:** Assault +0.75, Press +1.5, Hold +2.25. The Allied bot's are +1, +1.75 and +2.5.

The Allied bot is unchanged.

**Why the two help together** (my reading, not separately tested): the higher threshold stops the CP bot from bleeding steps in marginal attacks. Putting the West first then concentrates fills, SR destinations, Forward moves and the remaining attacks where the CP loses most of its VP. Neither change alone gained more than four points on seeds 8001–8300. Together they gained 14 and 17 points on two fresh seed sets.

**Not adopted:** the turn checklist, East-first focus, home-VP security, the attack penalty and both rebuild rules made the CP bot weaker or no stronger in these tests. These are tests of simple paper rules against one opponent, not proof that the underlying ideas are wrong.

**Evidence suite.** Every figure below comes from a clean worktree of the v0.8.0 code (commit `c8559da`), with each output file stamped. The paired runs play against the v0.7 reference at `bc8bef6`. The files are in [`results/v0.8.0/`](results/v0.8.0/).

| Test | v0.7.6 | v0.8.0 |
|---|---|---|
| CP bot against the v0.7 reference, seeds 6001–6300 / 7001–7300 | 53% / 56% | **74% / 74%** |
| Same seeds, games gained / lost against v0.7.6 (z) | — | 107 / 46 (4.9); 105 / 52 (4.2) |
| Strict self-play, 600 games (v0.8.0: seeds 1100000–1100599, a range not used before) | Allies 85% / CP 15% | Allies **69%** / CP **31%** |
| Against random and naive opponents (140 games) | won all 140 | won all 140 |
| CP attacks per game (self-play) | 86 | 71 |
| CP advances after combat per game | 33 | 30 |
| Mandated offensives missed per game, Allies / CP | 2.5 / 1.0 | 2.3 / 0.9 |
| Fall of the Tsar / USA at war (share of games) | 71% / 74% | 53% / 68% |

The Allied bot is unchanged. Its paired figures (92–94% against the v0.7 reference) stand from v0.7.6. As a check, 60 Allied paired games from v0.8.0 (seeds 6001–6060, `ap_identity6.json`) match the v0.7.6 records game for game: same winner, final turn, VP and number of steps.

**Run health, strict mode** (740 games): no unfinished games, exceptions, rule-violation resets, bot supply breaches, called-off attacks, Salonika safety transfers or choices without a rule. Two Allied moves in self-play were abandoned and took the printed one-safe-step exit (§6). The supply check also caught two steps out of supply by the *random* baseline player. These are not General Staff moves, and `summarize.py` now lists them separately.

**Handicap** (self-play, starting VP moved in the CP bot's favour, seeds 30001–30150):

| Starting VP | 10 (normal) | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|
| Allied / CP wins | 69% / 31% | 61% / 39% | 55% / 45% | 49% / 51% | 45% / 55% | 37% / 63% |

About **three VP** now evens a bot-versus-bot game (v0.7.6: five and a half). Each VP is worth six to eight points. This is a coarse self-play calibration, not a human difficulty rating.

## v0.7.6: comprehensive v0.7.5 audit fixes

The comprehensive v0.7.5 audit ([`audits/general-staff-v0.7.5-comprehensive/`](../audits/general-staff-v0.7.5-comprehensive/)) found five problems:

* a first movement step that sent a Serbian army out of supply;
* two corps that could not gather to besiege a fort;
* no rule for Brusilov's trench cancellation;
* Tie and front order not applied to equal attack origins and siege rolls;
* a companion validation gap.

It also repeated the handicap-provenance point. All are fixed ([response](../audits/general-staff-v0.7.5-comprehensive/Response.md)). Every figure below comes from a clean worktree of the v0.7.6 code (commit `8f71855`). Each output file carries a run-time stamp: the bot commit, uncommitted changes (none) and the engine revision. The paired runs play against the v0.7 reference at `bc8bef6`. The files are in [`results/v0.7.6/`](results/v0.7.6/).

| Test | Result |
|---|---|
| Allied bot against the v0.7 reference, seeds 6001–6300 / 7001–7300 | **92% / 94%** |
| CP bot against the v0.7 reference, seeds 6001–6300 / 7001–7300 | **53% / 56%** |
| Strict self-play, seeds 1090000–1090599 (600 games, a range not used before) | Allies **85%** / CP **15%** |
| Against random and naive opponents (140 games) | won all 140 |
| Mandated offensives missed per game (self-play) | Allies 2.5, CP 1.0 |

**Run health, strict mode** (740 games): every count is **zero**. That covers:

* unfinished games, errors and exceptions;
* rule-violation resets;
* **movement steps that left units out of supply** (a new check, made on a copy of the game after every step);
* abandoned moves and pass-throughs;
* called-off attacks and Salonika safety transfers;
* choices without a bot rule.

**Handicap** (self-play, starting VP moved in the CP bot's favour, seeds 30001–30150):

| Starting VP | 10 (normal) | 11 | 12 | 13 | 14 | 15 | 16 |
|---|---|---|---|---|---|---|---|
| Allied / CP wins | 83% / 17% | 81% / 19% | 78% / 22% | 75% / 25% | 67% / 33% | 55% / 45% | 43% / 57% |

By interpolation, about **five and a half VP** evens a bot-versus-bot game. This is a coarse self-play calibration, not a human difficulty rating.

## v0.7.5: siege rule and complete per-game evidence

The v0.7.4 verification closed all earlier findings and named two follow-ups. Both are done ([response](../audits/general-staff-v0.7.4/Response.md)):

* **Units leaving a siege** now keep a legal besieging force behind (15.2.4). This caused the last rule-violation resets.
* **Paired and handicap runs** now save one record per seed.

Every figure below was produced from a clean worktree of the v0.7.5 code (commit `9c1326e`), against the v0.7 reference bots (commit `bc8bef6`). The per-seed files are in [`results/v0.7.5/`](results/v0.7.5/).

| Test | Result |
|---|---|
| Allied bot against the v0.7 reference, seeds 6001–6300 / 7001–7300 | **90% / 92%** |
| CP bot against the v0.7 reference, seeds 6001–6300 / 7001–7300 | **49% / 59%** |
| Strict self-play, seeds 1080000–1080599 (600 games) | Allies **85%** / CP **15%** |
| Against random and naive opponents (140 games) | won all 140 |
| Mandated offensives missed per game (self-play) | Allies 2.7, CP 1.1 |

**Isolation** (seeds 7001–7300, one switch off at a time; the effects interact and are not additive):

| Switched off | Allied bot | CP bot |
|---|---|---|
| Nothing (v0.7.5) | 92% | 59% |
| Event-granted Operations keep their plan | 81% | 47% |
| Named event choices | 87% | 53% |
| Legal attack groups, on their own | 90% of the 260 games that finished; **40 games ended in a harness error** | 54% of 226; **74 ended in a harness error** |
| War in Africa gives the VP instead of a corps | 91% (and 89% vs 90% on seeds 6001–6300) | — |

Without legal attack groups the bot keeps declaring attacks that units of different nationalities cannot make together, and many games break off. Legal groups are therefore needed for the bot to run at all, not just for strength. The corps-for-VP choice in War in Africa is worth only about one point, but it is never worse.

**Run health, strict mode** (740 games):

* 0 unfinished games, 0 errors and 0 decision exceptions;
* **0 rule-violation resets**;
* 0 choices left to the engine's default and 0 Salonika safety-path transfers;
* 3 units moved one safe step after an abandoned move.

**Handicap** (self-play, starting VP moved in the CP bot's favour, seeds 30001–30150, per-seed files `handicap_<shift>.json`):

| Starting VP | 10 (normal) | 11 | 12 | 13 | 14 | 15 | 16 |
|---|---|---|---|---|---|---|---|
| Allied / CP wins | 87% / 13% | 85% / 15% | 79% / 21% | 71% / 29% | 66% / 34% | 58% / 42% | 43% / 57% |

Each VP is worth about seven points, and about five and a half VP evens a bot-versus-bot game. Against a person, treat 1–3 VP for the CP bot as a starting setting for playtests.

## v0.7.4: re-audit corrections

The v0.7.3 re-audit ([`audits/general-staff-v0.7.3/`](../audits/general-staff-v0.7.3/)) closed eight of the nine findings and reported two remaining issues:

* a Salonika transfer of a corps in contact, made through the generic fallback when the only offered corps was in contact;
* War in Africa and Salonika ties reversed within a front.

Both are fixed ([response](../audits/general-staff-v0.7.3/Response.md)). Fresh strict self-play, seeds 1080000–1080599:

| Check | Result |
|---|---|
| Games / Allied wins / CP wins | 600 / 510 (85%) / 90 (15%) |
| Unfinished games, harness errors, decision exceptions | 0 |
| Choices left to the engine's default | 0 |
| Salonika safety-path transfers | 0 |
| Rule-violation resets | 2, in one game (units moved out of a siege left too small a besieging force; fixed in v0.7.5) |
| Units moved one safe step after an abandoned move | 5 |
| Mandated offensives missed per game | Allies 2.7, CP 1.2 |

Seed-level files for this run and for the v0.7.3 tables are in [`results/`](results/).

## v0.7.3: comprehensive audit fixes

A comprehensive audit of v0.7.2 ([`audits/general-staff-v0.7.2-comprehensive/`](../audits/general-staff-v0.7.2-comprehensive/)) reported nine problems:

* Staff cards split across PDF pages;
* two calculator verdicts;
* incompatible multinational attack groups;
* event choices left to engine defaults;
* abandoned moves resumed by the fallback;
* an unprinted event-trench rule;
* saved-session recovery;
* Undo at the reshuffle.

All nine are fixed ([response](../audits/general-staff-v0.7.2-comprehensive/Response.md)).

Fixing them also exposed a larger fault. When an **event granted an Operation**, the plan made for it was thrown away, so its moves were made by the generic fallback. Making the simulator follow the printed procedure everywhere made **both bots much stronger**:

| Test (against the v0.7 reference bots, 300 paired games each) | v0.7.2 | v0.7.3 |
|---|---|---|
| Allied bot, seeds 6001–6300 / 7001–7300 | 66% / 68% | **90% / 95%** |
| CP bot, seeds 6001–6300 / 7001–7300 | 45% / 32% | **49% / 56%** |
| Self-play, seeds 10001–10300 and 20001–20300 (600 games) | Allies 67% / CP 33% | **Allies 84% / CP 16%** |
| Mandated offensives missed per game (self-play) | Allies 3.1, CP 1.3 | Allies 2.7, CP 1.1 |
| Against random and naive opponents (140 games) | won all 140 | won all 140 |

Where the gain comes from (seeds 7001–7300, Allied / CP bot, each change undone on its own):

| Undone | Allied bot | CP bot |
|---|---|---|
| Nothing (v0.7.3) | 95% | 56% |
| Event-granted Operations keep their plan | 83% | 47% |
| Named event choices (Landwehr, War in Africa, Salonika, neutral placement, etc.) | 88% | 49% |
| Legal attack groups, step capacity and first-step check (undone together) | 87% (39 decision errors) | 50% (72 decision errors) |
| War in Africa: give the VP instead of a corps | 92% (and 89% vs 90% on seeds 6001–6300) | — |

Each fix helps both sides. One-at-a-time ablations interact, so these differences are not additive. The Allied bot gains more, so self-play balance moved toward the Allies. The handicap needed for an even bot-versus-bot game is now about **five VP** for the CP bot (table below).

**Run health, strict mode** (740 v0.7.3 evaluation games):

| Check | v0.7.2 | v0.7.3 |
|---|---|---|
| Unfinished games, harness errors, decision exceptions | 0 | 0 |
| Rule-violation resets | 67 (32 games) | **1** (units moved out of a siege left too small a besieging force; fixed in v0.7.5) |
| Choice-bearing states with no bot rule | about 14 a game | **0** |
| Units moved one safe step after an abandoned move | — | 8 |
| Attacks called off at the final selected-unit check | — | 0 |

The companion, card PDF and attack-group fixes have their own regression checks: `app/test_companion.cjs` (28 checks), `print/check_print.py` and `sim/tests/multinational.js`. The companion was also loaded in headless Chrome at desktop and phone widths, which confirmed that its script runs and renders. That is not a test on a real device.

## v0.7.2: review fixes

An independent review of v0.7.1 ([`audits/general-staff-v0.7.1/`](../audits/general-staff-v0.7.1/)) reported five problems:

* MO credit kept after the mandated nation's units were dropped from an attack;
* a Companion error with 0-CF defenders;
* three different expected-hit precisions;
* an evaluator that hid decision exceptions;
* a machine-specific engine link.

All five are fixed ([response](../audits/general-staff-v0.7.1/Response.md)). The simulator, the Companion and the printed sheet now share one Edge table, the printed one-decimal values. Evaluation now uses strict mode and reports run health.

| Test | v0.7.1 | v0.7.2 |
|---|---|---|
| Allied bot against the v0.7 CP reference, seeds 6001–6300 / 7001–7300 | 67% / 66% | 66% / 68% |
| CP bot against the v0.7 Allied reference, seeds 6001–6300 / 7001–7300 | 40% / 37% | 45% / 32% |
| Self-play, seeds 10001–10300 and 20001–20300 (600 games) | Allies 68% / CP 32% | **Allies 67% / CP 33%** |
| Mandated offensives missed per game (self-play) | Allies 3.4, CP 1.4 | Allies 3.1, CP 1.3 |
| Against random and naive opponents (140 games) | won all 140 | won all 140 |

No change is larger than noise; the CP seed sets moved in opposite directions. The review's MO reproduction script now finds no affected plans (v0.7.1: five). Taking an MO target's mandated-nation spaces first was also tried; it made no difference (Allies 68% vs 68%, CP 32% vs 32%) and was not adopted.

**Run health, strict mode** (all 740 v0.7.2 evaluation games; `STRICT=1` stops a game at its first decision exception):

| Check | Count |
|---|---|
| Unfinished games or harness errors | 0 |
| Decision exceptions | 0 |
| Rule-violation resets (an overstacking move undone and the round replanned with attacks only) | 67, in 32 of the 740 games |
| Choices left to the engine's default | about 14 per game: placing entering neutral units 7.4, War in Africa 2.6, Salonika 1.2, Withdrawal 1.9, Landwehr 0.9, others under 0.3 |

The engine-default choices are event and entry sub-choices that the booklet covers with "front order, then the Tie" (§9, *Other choices*). The simulator never tested those rules; it took the engine's first option. They are counted now and remain a known limit.

## v0.7.1 check

v0.7.1 changes no rule of play. It pins down tie-breaks that the booklet left open (RP and SR cards by lower card number, movement steps, Fill stacks and rebuilt armies by the Tie). It also fixes four harness faults:

* the Capture choice compared scores wrongly, so the printed preference for a capture nearer the front's Objective was often ignored;
* a map lookup sent the CP Balkans list's Salonika entry to an off-map box;
* event-granted operations ignored the "attacks only" restriction after a rule-violation reset (one stuck game in 300);
* a stack left with no legal step now has a safe exit.

The harness now follows every printed tie-break for moves.

| Test | Without the Capture/Fill fix | v0.7.1 |
|---|---|---|
| Allied bot against the v0.7 CP reference, seeds 6001–6300 | 58–61% | **67%** |
| Allied bot against the v0.7 CP reference, seeds 7001–7300 | 59% | **66%** |
| CP bot against the v0.7 Allied reference, seeds 6001–6300 | 39–41% | 40% |
| CP bot against the v0.7 Allied reference, seeds 7001–7300 | 35% | 37% |
| Self-play, seeds 10001–10300 and 20001–20300 (600 games) | Allies 61–62% / CP 38–39% | **Allies 68% / CP 32%**, no errors |
| Against random and naive opponents (140 games) | — | won all 140 |

Following the printed Capture rule made the Allied bot about **seven points stronger** on two seed sets of 300 games, and left the CP bot unchanged (within two points). The other tie-break changes made no measurable difference on their own. Self-play balance therefore moved toward the Allies. The handicap figures below were measured on v0.7; the CP bot now needs about one VP more to break even against the Allied bot.

## Results for v0.7

| Match-up | Games | Allied wins | CP wins | Mean end turn | How games ended |
|---|---|---|---|---|---|
| Self-play | 200 | 124 (62%) | 76 (38%) | 17.7 | Allied win at turn limit 79, CP automatic victory 47, armistice 34 (26 Allied, 8 CP), CP win at turn limit 21, Allied automatic victory 19 |
| General Staff Allies vs random CP | 30 | 30 (100%) | 0 | 6.4 | Allied automatic victory 30 |
| General Staff CP vs random Allies | 30 | 0 | 30 (100%) | 4.4 | CP automatic victory 30 |
| General Staff Allies vs naive CP | 100 | 100 (100%) | 0 | 8.4 | Allied automatic victory 100 |
| General Staff CP vs naive Allies | 100 | 0 | 100 (100%) | 4.7 | CP automatic victory 100 |

### Difficulty handicap

Moving the starting VP marker changes the self-play result by about **five or six percentage points per VP** (150 games each, the same seeds for every column of a row):

| Starting VP | 8 | 9 | 10 (normal) | 11 | 12 |
|---|---|---|---|---|---|
| v0.7: Allied / CP wins | 69% / 31% | 66% / 34% | 60% / 40% | 53% / 47% | 46% / 54% |
| v0.7.1: Allied / CP wins | 76% / 24% | 71% / 29% | 66% / 34% | 62% / 38% | 54% / 46% |

v0.7.3, starting VP moved in the CP bot's favour (seeds 30001–30150):

| Starting VP | 10 (normal) | 11 | 12 | 13 | 14 | 15 | 16 |
|---|---|---|---|---|---|---|---|
| Allied / CP wins | 80% / 20% | 78% / 22% | 69% / 31% | 65% / 35% | 60% / 40% | 53% / 47% | 40% / 60% |

The rules offer this as an optional difficulty setting (§1).

### Does it play a recognisable war?

Self-play, 200 games. The table gives the median turn when each milestone was reached and the share of games that reached it. Turn 1 is August 1914; turns 5, 9, 13 and 17 are the first turns of 1915, 1916, 1917 and 1918.

| Milestone | Median turn | Games |
|---|---|---|
| CP and Allies reach Limited War; Turkey enters | 2 | 100% |
| Italy and Bulgaria enter | 5 | 99–100% |
| CP reach Total War | 6 | 99% |
| Romania enters | 8 | 82% |
| Allies reach Total War | 8 | 98% |
| Tsar Takes Command | 9 | 82% |
| Fall of the Tsar | 13 | 76% |
| USA at war | 15 | 80% |
| Bolshevik Revolution and Brest-Litovsk | 17 | 30% / 28% |
| Greece enters | 16 | 46% |

Mean VP at the start of each turn (games still running):

| Turn | 2 | 4 | 6 | 8 | 10 | 12 | 14 | 16 | 18 | 20 |
|---|---|---|---|---|---|---|---|---|---|---|
| Mean VP | 10.3 | 11.1 | 11.1 | 12.2 | 11.1 | 10.6 | 9.6 | 9.2 | 8.6 | 8.7 |
| Games still running | 200 | 199 | 199 | 197 | 189 | 180 | 170 | 153 | 140 | 117 |

The war has a familiar shape. The Central Powers gain ground until 1916, then the tide turns. The big events arrive in roughly historical order: early neutral entries, Russia collapsing in 1917, and the USA entering in 1917 in four games out of five.

### What the bots do with their action rounds

Mean per game, self-play:

| Measure | Allied bot | CP bot |
|---|---|---|
| Action rounds | 106.2 | 106.2 |
| Events played | 32.9 | 30.2 |
| Operations (of which 1-OP Automatic) | 53.6 (0.1) | 57.1 (0.3) |
| SR plays | 3.5 | 6.6 |
| RP plays | 16.2 | 12.2 |
| Attacks | 46.8 | 89.0 |
| Advances after combat | 19.9 | 34.0 |
| Mandated offensives missed | 3.34 | 1.39 |

Which step of the action-round procedure decided the round:

| Step | Allied bot | CP bot |
|---|---|---|
| Crisis | 33.9% | 23.3% |
| Urgent event (priority 7–9) | 24.5% | 21.0% |
| Plan: Attack | 6.7% | 24.0% |
| Plan: Event | 6.3% | 6.3% |
| Plan: Logistics (RP / SR) | 3.7% / 3.3% | 11.5% / 6.2% |
| Rebuild (Allies only) | 11.5% | — |
| Mandated Offensive (round 3+ / last chance) | 6.4% / 2.8% | 4.6% / 1.3% |
| Forced play, Fallback, Automatic Operation | 0.8% | 1.7% |

The two bots play differently. The CP bot attacks about twice as often and advances far more. The Allied bot spends about a third of its rounds shoring up endangered spaces.

## How the design changed

Each row compares a candidate with the reference bot of the time, on the same seeds. The figures are the candidate side's win rate before → after the change.

| Change | Allied bot | CP bot | Decision |
|---|---|---|---|
| Crisis spaces filled by **SR** (rushing units in by rail) switched off; crisis handled by moves only | 80% → 88% | 20% → 67% | Kept off |
| **Advance after combat** added (the early harness never advanced) | 35% → 43% | 33% → 93% | Kept |
| Attack the **first acceptable target** in a fixed order, instead of the best Score | 49% → 4% | 51% → 37% | Rejected |
| **Fixed priority order for moves** instead of values | 43% → 3% | 93% → 49% | Rejected |
| **Move value table** (Capture 4/2, Fill 2–4, Siege 2–3, Forward 1–1.5, Entrench 0.5–1.5) instead of finer scoring | 44% → 53% | 90% → 97% | Kept |
| **Shortlist** instead of scoring every target: five targets, later three | 44% → 48% (5); 48% → 50% (3 vs 5) | 90% → 89% (5); 52% → 51% (3 vs 5) | Kept, three targets (less work, no loss) |
| Allied Stance thresholds **+1** | 12% → 27% | — | Kept |
| Map's nation-only links (Channel crossings, Russian links) counted in distances | 26% → 44% | 83% → 80% | Kept |
| Allied **Rebuild** step (one RP play a turn when missing steps ≥ 6) | 38% → 51% | 68% → 60% (if given to CP) | Allies only |
| Holding key event cards until playable ("Kept" cards); re-tested in v0.7 holding only the Russian-collapse and US-entry chains | no effect; 61% → 60% | 87% → 80%; 39% → 35–37% | Dropped |
| Lexicographic retreat/SR/reinforcement choices and other clean-ups from the rules review | 39% → 49% | 61% → 57% | Kept (simpler, no loss) |
| Events of priority **7** made urgent (played before anything else), instead of 8+ | 50% → 69% | 51% → 55% | Kept (v0.6) |
| Urgent threshold 6, 5 or 9 (baseline: threshold 8) | 50% → 64% / 34% / 25% | 51% → 54% / not run / 36% | Rejected; 7 is best |
| Plan: Event threshold 4 or 6 instead of 5 | 50% → 50% / 47% | 51% → 51% / 53% | No effect |
| At most two attacks a round instead of three | 48% → 44% | 52% → 46% | Rejected |
| At most four attacks a round | 48% → 47% | — | No effect |
| Losses: flip full units before eliminating reduced ones | 48% → 47% | 52% → 51% | No effect |
| Capture of a non-VP space valued 1 instead of 2 | 48% → 32% | 52% → 51% | Rejected |
| Crisis Fill paid for **before** attacks | 49% → 22% | 57% → 44% | Rejected |
| Every Staff card's Plan = Ops (no Plan variety) | 39% → 43% | 61% → **8%** | Rejected: the Plan mix matters |
| Every Staff card's Plan = Logistics / = Event | 38% / 56% | 9% / 30% | Rejected |
| Every Staff card's Stance = Press (no Stance variety) | 39% → 42% | 61% → 57% | Variety kept (free) |
| Staff card front preference switched off | 80% → 78% | 20% → 24% | Kept (free) |
| Flank attacks attempted | 27% → 23% | 83% → 81% | Never attempt |
| Allied Forward move with an army valued **2.5** instead of 1.5 | 55% → 61%; 54% → 64% (two seed sets) | 45% → 38% (if given to CP) | Allies only (v0.7) |
| Extra gap-filling, longer crisis range, idle-reserve SR, reserve-only crisis SR, MO preparation moves, capital units counted as reserves, different RP/SR triggers, other Stance offsets, making all war-status or reinforcement events urgent | no gain, or worse | no gain, or worse | Not adopted |
| CP-only tries in v0.7: Capture value 3, other Plan mixes, always advancing, Forward value 1 | — | 39% → 25–43% | Not adopted (none clearly better) |
| Gap-filling plus always advancing, re-tested on four seed sets (and once for the Allies) | 61% → 57% | 35–39% → 35–44% | Not adopted (no consistent gain) |

What the Plan experiments show: the even mix of Ops, Event and Logistics Plans on the Staff cards is what keeps the CP bot playing its reinforcements and war-status events and buying replacements. A bot that always attacks first collapses. The cards are not decoration; they carry the bot's strategic balance.

### A greedy look-ahead variant is weaker, not stronger

As a stress test, a variant was built that looks one round ahead at each action phase. It tries up to ten first actions, plays out the rest of its round and the opponent's next round with the General Staff procedure (dice re-seeded so the future stays unknown), scores the result (VP, surviving steps, war status, RP) and picks the best. It overruled the printed procedure in about three rounds out of four. Against the plain bot:

* as the Allies it won **0 of 40** games;
* as the Central Powers it won **0 of 40** games.

Short-horizon greed loses because it undervalues what the procedure plays for over the longer term: reinforcement and war-status events, MO compliance and rebuilding. It also suggests the printed priorities are not easy to beat by local tinkering. It says nothing about strong human play.

## Admin load

* The operator works out about **2.4 Edge/Score values per bot action round** on average: 2.3 for the CP bot and 2.5 for the Allies. The three-target shortlist (plus Objectives and MO targets) caps this. Each value takes two lookups on the Edge table plus a few small bonuses; the Companion's calculator does it in seconds.
* Many bot rounds need no Attack Search at all: an urgent event, the Rebuild step, or an Event or Logistics Plan that fires first decides them. The Attack Search is only needed when a step asks for it.
* The 1-OP Automatic Operation is almost never used, so the bot's hand turns over normally.
* Turn-end decisions (replacements, reinforcements, draw-phase discards) follow short fixed orders.

These are counts, not clock times. Table time has not been measured.

## Known limits

* **The opponent was a bot.** All strength figures come from games against bots. A strong person will exploit things no tested opponent exploits, especially thin lines and the bot's predictable Fill moves.
* **The Allied bot misses mandated offensives** about 3.3 times a game, often because no British or Italian unit is in contact with a valid target. Moving those units into contact (MO preparation) made no difference in testing, so it was left out.
* **Events are played by priority and legality, with a few situational adjustments.** The finer timing advice in [`research/event_policy.md`](../research/event_policy.md) is research, not part of the procedure.
* **The tests used Rally the Troops' rules implementation.** Any difference between it and your printed rules would affect these results.
* **Event sub-choices (fixed in v0.7.3).** Up to v0.7.2, where to place an event trench, entering neutral units and some event follow-ups took the engine's first legal option (about 14 a game). v0.7.3 has a printed rule for each, and strict campaigns record none left to the engine.
* **Rule-violation resets.** In v0.7.2, about one game in 23 had a planned move that would overstack. The harness then undid the round and replanned it with attacks only. In v0.7.3 this happened once in 740 games. A person at the table would just pick another space.

## What to watch for in playtesting

* **Table time per bot round.** Count minutes for a few turns. The Attack Search and Move list are the slow parts.
* **Thin lines.** Watch whether the bot's Fill and Capture moves leave holes a person can drive through.
* **Mandated offensives.** Note when the Allied bot misses one because no British or Italian unit is in contact.
* **The 1914 West.** Check whether the CP bot's Guns of August push feels too strong or too weak against your defence.
* **The CP bot's West focus (v0.8.0).** Since the West always comes first, watch whether the CP bot neglects Russia or the Balkans in ways a person can punish, and whether it still takes chances in the East.
* **Event timing.** Note any card the bot plays (or holds) at a clearly wrong moment, with the turn and the situation.

Reports like these are the most useful input for the next version.

## Reproducing

```sh
cd sim && ./setup_engine.sh
STRICT=1 node final_eval.js self 100 5001 > self_a.json     # self-play; STRICT=1 stops a game on any decision exception
node final_eval.js naive-ap 100 7001 > naive_ap.json
python3 summarize.py .                              # tables above
node ab.js ap 150 2001 <ref-bot-dir> '{"shortlist":3}'   # an A/B comparison
```
