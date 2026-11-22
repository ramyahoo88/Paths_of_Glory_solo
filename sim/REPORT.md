# General Staff — simulation report

*Covers General Staff **v0.6** (rules: [`bot/General_Staff_Rules.md`](../bot/General_Staff_Rules.md)). Written 22 November 2026.*

## Summary

* In **200 self-play campaigns** (bot against bot), the Allied bot won **57%** and the Central Powers bot **43%**. Mean VP stayed between 8 and 12 all war.
* Against a **random** player and against a **naive** one-attack, no-events bot, General Staff won **every** game on both sides: 260 of 260.
* About **19,600 further campaigns** compared design alternatives in paired tests. They settled the main choices:
  * attack the best Score, not the first acceptable target;
  * advance after combat;
  * fill endangered spaces by movement, not SR;
  * play every event of priority 7 or more as soon as it is legal;
  * make the Allied bot more cautious, with a once-a-turn rebuild of heavy losses.
* The bot never made an illegal move: every decision was chosen from the rules engine's list of legal actions. The 460 evaluation games finished without a harness error.
* These are bot-versus-bot results. They show the procedure is coherent, legal, much stronger than simple baselines, and plays a recognisable war. They do not show how it fares against a strong player. **Human playtesting is the next step.**

## Method

**Engine.** Every game was a full *Paths of Glory* campaign: the Historical scenario, August 1914 to the end, standard cards. Games ran on the open-source **Rally the Troops** rules engine at commit `c58b0b4`. The engine enforces the rules: legal moves, combat, supply, sieges, trenches, mandated offensives, war status, neutral entries, Russian collapse, US entry and victory. The harness adds a read-only hook so the bot can query the board. `sim/setup_engine.sh` fetches the engine; it is not included in this repository.

**Bot.** [`sim/bot.js`](bot.js) carries out the printed procedure. It uses only what a person running the bot at the table has: the open board, the bot's own hand and the current Staff card. It does not look ahead, simulate dice or see the opponent's hand. The constructor's default options are the released behaviour. Options that are off by default are experiments described below and are not part of the rules.

**Opponents.**

* **General Staff itself** (self-play): the most demanding opponent available here.
* **Random**: picks uniformly among legal actions, as a sanity check.
* **Naive**: the same machinery with the main features off. It plays only forced events and makes one attack per action round. It does not advance, move, use SR or fill crisis spaces, and it checks every target. This is roughly a first-draft "one order per round" bot.

**Design comparisons.** A candidate bot played one side against a frozen reference bot on the other side, on the same seeds: 120 or 150 per side. At those sizes the standard error of a win rate near 50% is about ±4 points. Only differences of about 10 points or more were treated as real. When a change made no difference, the simpler procedure was kept.

## Results for v0.6

| Match-up | Games | Allied wins | CP wins | Mean end turn | How games ended |
|---|---|---|---|---|---|
| Self-play | 200 | 114 (57%) | 86 (43%) | 17.6 | Allied win at turn limit 80, CP automatic victory 59, CP win at turn limit 23, Allied automatic victory 22, armistice 16 (12 Allied, 4 CP) |
| General Staff Allies vs random CP | 30 | 30 (100%) | 0 | 6.7 | Allied automatic victory 30 |
| General Staff CP vs random Allies | 30 | 0 | 30 (100%) | 4.4 | CP automatic victory 30 |
| General Staff Allies vs naive CP | 100 | 100 (100%) | 0 | 8.1 | Allied automatic victory 99, turn limit 1 |
| General Staff CP vs naive Allies | 100 | 0 | 100 (100%) | 4.7 | CP automatic victory 100 |

### Difficulty handicap

Moving the starting VP marker changes the self-play result by about **6–7 percentage points per VP** (150 games each, the same seeds for every column):

| Starting VP | 8 | 9 | 10 (normal) | 11 | 12 |
|---|---|---|---|---|---|
| Allied wins | 69% | 63% | 57% | 51% | 42% |
| CP wins | 31% | 37% | 43% | 49% | 58% |

The rules offer this as an optional difficulty setting (§1).

### Does it play a recognisable war?

Self-play, 200 games. The table gives the median turn when each milestone was reached and the share of games that reached it. Turn 1 is August 1914; turns 5, 9, 13 and 17 are the first turns of 1915, 1916, 1917 and 1918.

| Milestone | Median turn | Games |
|---|---|---|
| CP and Allies reach Limited War; Turkey enters | 2 | 100% |
| Italy and Bulgaria enter | 5 | 99–100% |
| CP reach Total War | 6 | 99% |
| Romania enters | 8 | 78% |
| Allies reach Total War | 8 | 94% |
| Tsar Takes Command | 10 | 81% |
| Fall of the Tsar | 13 | 74% |
| USA at war | 14 | 76% |
| Bolshevik Revolution and Brest-Litovsk | 17 | 28% |
| Greece enters | 16 | 27% |

Mean VP at the start of each turn (games still running):

| Turn | 2 | 4 | 6 | 8 | 10 | 12 | 14 | 16 | 18 | 20 |
|---|---|---|---|---|---|---|---|---|---|---|
| Mean VP | 10.3 | 11.2 | 11.2 | 12.0 | 11.1 | 10.3 | 9.6 | 9.3 | 8.8 | 8.3 |
| Games still running | 200 | 199 | 199 | 196 | 190 | 184 | 169 | 151 | 129 | 119 |

The war has a familiar shape. The Central Powers gain ground until 1916, then the tide turns. The big events arrive in roughly historical order: early neutral entries, Russia collapsing in 1917, and the USA entering in 1917 in three games out of four.

### What the bots do with their action rounds

Mean per game, self-play:

| Measure | Allied bot | CP bot |
|---|---|---|
| Action rounds | 105.3 | 105.3 |
| Events played | 30.4 | 30.1 |
| Operations (of which 1-OP Automatic) | 59.0 (0.2) | 55.8 (0.3) |
| SR plays | 2.5 | 7.0 |
| RP plays | 13.4 | 12.5 |
| Attacks | 45.2 | 88.1 |
| Advances after combat | 17.1 | 35.9 |
| Mandated offensives missed | 3.58 | 1.46 |

Which step of the action-round procedure decided the round:

| Step | Allied bot | CP bot |
|---|---|---|
| Crisis (Fill) | 41.7% | 22.0% |
| Urgent event (priority 7–9) | 24.2% | 21.1% |
| Plan: Attack | 5.0% | 24.2% |
| Plan: Event | 4.5% | 6.4% |
| Plan: Logistics (RP / SR) | 2.8% / 2.4% | 11.8% / 6.6% |
| Rebuild (Allies only) | 9.9% | — |
| Mandated Offensive (round 3+ / last chance) | 6.0% / 2.7% | 4.6% / 1.4% |
| Forced play, Fallback, Automatic Operation | 0.7% | 1.9% |

The two bots play differently. The CP bot attacks about twice as often and advances far more. The Allied bot spends about two rounds in five shoring up endangered spaces.

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
| Holding key event cards until playable ("Kept" cards) | no effect | 87% → 80% | Dropped |
| Lexicographic retreat/SR/reinforcement choices and other clean-ups from the rules review | 39% → 49% | 61% → 57% | Kept (simpler, no loss) |
| Events of priority **7** made urgent (played before anything else), instead of 8+ | 50% → 69% | 51% → 55% | Kept (v0.6) |
| Urgent threshold 6, 5 or 9 instead of 7 | 64% / 34% / 25% | 54% / — / 36% | Rejected |
| Plan: Event threshold 4 or 6 instead of 5 | 50% / 47% | 51% / 53% | No effect |
| Two or four attacks a round instead of three; lose steps by flipping first; Capture value 1 | 44% / 47%; 47%; 32% | 46%; 51%; 51% | Not adopted |
| Crisis Fill paid for **before** attacks | 49% → 22% | 57% → 44% | Rejected |
| Every Staff card's Plan = Ops (no Plan variety) | 39% → 43% | 61% → **8%** | Rejected: the Plan mix matters |
| Every Staff card's Plan = Logistics / = Event | 38% / 56% | 9% / 30% | Rejected |
| Every Staff card's Stance = Press (no Stance variety) | 39% → 42% | 61% → 57% | Variety kept (free) |
| Staff card front preference switched off | 80% → 78% | 20% → 24% | Kept (free) |
| Flank attacks attempted | 27% → 23% | 83% → 81% | Never attempt |
| Extra gap-filling, longer crisis range, idle-reserve SR, reserve-only crisis SR, MO preparation moves, different RP/SR triggers | no gain, or worse | no gain, or worse | Not adopted |

What the Plan experiments show: the even mix of Ops, Event and Logistics Plans on the Staff cards is what keeps the CP bot playing its reinforcements and war-status events and buying replacements. A bot that always attacks first collapses. The cards are not decoration; they carry the bot's strategic balance.

## Admin load

* The operator works out about **2.5 Edge/Score values per bot action round** on average: 2.3 for the CP bot and 2.6 for the Allies. The three-target shortlist (plus Objectives and MO targets) caps this. Each value takes two lookups on the Edge table plus a few small bonuses; the Companion's calculator does it in seconds.
* Many bot rounds need no Attack Search at all: an urgent event, the Rebuild step, or an Event or Logistics Plan that fires first decides them. The Attack Search is only needed when a step asks for it.
* The 1-OP Automatic Operation is almost never used, so the bot's hand turns over normally.
* Turn-end decisions (replacements, reinforcements, draw-phase discards) follow short fixed orders.

These are counts, not clock times. Table time has not been measured.

## Known limits

* **The opponent was a bot.** All strength figures come from games against bots. A strong person will exploit things no tested opponent exploits, especially thin lines and the bot's predictable Fill moves.
* **The Allied bot misses mandated offensives** about 3.6 times a game, often because no British or Italian unit is in contact with a valid target. Moving those units into contact (MO preparation) made no difference in testing, so it was left out.
* **Events are played by priority and legality, with a few situational adjustments.** The finer timing advice in [`research/event_policy.md`](../research/event_policy.md) is research, not part of the procedure.
* **The tests used Rally the Troops' rules implementation.** Any difference between it and your printed rules would affect these results.
* **Some sub-choices took the engine's first legal option** in the harness: where to place an event trench, entering neutral units, and some event follow-ups. At the table the rules say to use front order and the Tie, so those choices were never tested.

## Reproducing

```sh
cd sim && ./setup_engine.sh
node final_eval.js self 100 5001 > self_a.json     # self-play
node final_eval.js naive-ap 100 7001 > naive_ap.json
python3 summarize.py .                              # tables above
node ab.js ap 150 2001 <ref-bot-dir> '{"shortlist":3}'   # an A/B comparison
```
