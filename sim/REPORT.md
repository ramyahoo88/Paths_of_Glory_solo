# General Staff — simulation report

*Covers General Staff **v0.7**, with checks of **v0.7.1** and **v0.7.2** (rules: [`bot/General_Staff_Rules.md`](../bot/General_Staff_Rules.md)). Written 22 November 2026.*

## Summary

* **v0.7.2 (current).** v0.7.2 fixes the five findings of an independent review: MO credit, a Companion error, one shared Edge-table precision, evaluation honesty and engine setup. Strict self-play over 600 games is **67% Allies / 33% CP**, with no exceptions and no unfinished games (see *v0.7.2: review fixes*). v0.7.1 had made the Allied bot about seven points stronger by following the printed Capture tie-break. The rest of this summary describes v0.7.
* In **200 self-play campaigns** (bot against bot), the Allied bot won **62%** and the Central Powers bot **38%**. Mean VP stayed between 8 and 12 all war.
* Against a **random** player and against a **naive** one-attack, no-events bot, General Staff won **every** game on both sides: 260 of 260.
* About **27,000 further campaigns** compared design alternatives in paired tests. They settled the main choices:
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
* **Some sub-choices took the engine's first legal option**: where to place an event trench, entering neutral units, and some event follow-ups (about 14 a game, counted in the v0.7.2 run-health table). At the table the rules say to use front order and the Tie, so those choices were never tested.
* **Rule-violation resets.** In about one game in 23, a planned move would overstack. The harness then undoes the round and replans it with attacks only. A person at the table would just pick another space.

## What to watch for in playtesting

* **Table time per bot round.** Count minutes for a few turns. The Attack Search and Move list are the slow parts.
* **Thin lines.** Watch whether the bot's Fill and Capture moves leave holes a person can drive through.
* **Mandated offensives.** Note when the Allied bot misses one because no British or Italian unit is in contact.
* **The 1914 West.** Check whether the CP bot's Guns of August push feels too strong or too weak against your defence.
* **Event timing.** Note any card the bot plays (or holds) at a clearly wrong moment, with the turn and the situation.

Reports like these are the most useful input for v0.8.

## Reproducing

```sh
cd sim && ./setup_engine.sh
STRICT=1 node final_eval.js self 100 5001 > self_a.json     # self-play; STRICT=1 stops a game on any decision exception
node final_eval.js naive-ap 100 7001 > naive_ap.json
python3 summarize.py .                              # tables above
node ab.js ap 150 2001 <ref-bot-dir> '{"shortlist":3}'   # an A/B comparison
```
