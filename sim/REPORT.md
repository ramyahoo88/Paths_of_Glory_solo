# General Staff — simulation report

*Covers General Staff **v0.5** (rules: [`bot/General_Staff_Rules.md`](../bot/General_Staff_Rules.md)). Written 22 November 2026.*

## Summary

* In **200 self-play campaigns** (bot against bot), the Allied bot won **48%** and the Central Powers bot **52%**. Over 22 turns the mean VP stayed between 8 and 11.
* Against a **random** player and against a **naive** one-attack, no-events bot, General Staff won **every** game on both sides: 260 of 260.
* About **16,200 additional campaigns** were used to compare design alternatives. They led to the main decisions:
  * the bot chooses the best attack (by Score), not the first acceptable one;
  * it advances after combat;
  * it fills endangered spaces by movement, not SR;
  * the Allied bot is more cautious, and rebuilds its losses once per turn when they get heavy.
* The bot made no illegal moves: every decision was taken from the rules engine's list of legal actions. The 460 evaluation games ran without a harness error.
* These are bot-versus-bot results. They show the procedure is coherent, legal and far better than simple baselines. They do not show how it fares against a strong person. **Human playtesting is the next step.**

## Method

**Engine.** Every game was a full *Paths of Glory* campaign: the Historical scenario, August 1914 to the end, with the standard cards. The games were played on the open-source **Rally the Troops** rules engine at commit `c58b0b4`. The engine enforces the rules: legal moves, combat, supply, sieges, trenches, mandated offensives, war status, neutral entries, Russian collapse, US entry and victory. The harness adds a read-only hook so the bot can query the board. `sim/setup_engine.sh` fetches the engine; it is not included in this repository.

**Bot.** [`sim/bot.js`](bot.js) carries out the printed procedure. It uses only what an operator at the table has: the open board, the bot's own hand and the current Staff card. It does not look ahead, simulate dice or see the opponent's hand. The released behaviour is the default option set in its constructor. Options switched off by default are experiments described below and are not part of the rules.

**Opponents.**

* **General Staff itself** (self-play): the most demanding opponent available here.
* **Random**: picks uniformly among legal actions, as a sanity check.
* **Naive**: the same machinery with the main features off. It plays only forced events and makes one attack per action round. It does not advance, move, use SR or fill crisis spaces, and it checks every target. This is roughly a first-draft "one order per round" bot.

**Design comparisons.** A candidate bot played one side against a frozen reference bot on the other, on the same seeds (120 or 150 per side). With 120 to 150 games, the standard error of a win rate near 50% is about ±4 points. Only differences of about 10 points or more were treated as real; smaller ones were treated as "no effect". When a change made no difference, the simpler procedure was kept.

## Results for v0.5

| Match-up | Games | Allied wins | CP wins | Mean end turn | How games ended |
|---|---|---|---|---|---|
| Self-play | 200 | 96 (48%) | 104 (52%) | 17.3 | CP automatic victory 75, Allied win at turn limit 68, CP win at turn limit 29, Allied automatic victory 24, Allied win at armistice 4 |
| General Staff Allies vs random CP | 30 | 30 (100%) | 0 | 6.4 | Allied automatic victory 30 |
| General Staff CP vs random Allies | 30 | 0 | 30 (100%) | 4.9 | CP automatic victory 30 |
| General Staff Allies vs naive CP | 100 | 100 (100%) | 0 | 6.7 | Allied automatic victory 100 |
| General Staff CP vs naive Allies | 100 | 0 | 100 (100%) | 5.2 | CP automatic victory 100 |

### Does it play a recognisable war?

Self-play, 200 games. The table gives the median turn when each milestone was reached and the share of games that reached it. Turn 1 is August 1914; turns 5, 9, 13 and 17 are the first turns of 1915, 1916, 1917 and 1918.

| Milestone | Median turn | Games |
|---|---|---|
| CP and Allies reach Limited War; Turkey enters | 2 | 100% |
| Italy and Bulgaria enter | 5 | 100% |
| CP reach Total War | 7 | 99% |
| Tsar Takes Command | 9 | 65% |
| Allies reach Total War | 12 | 60% |
| Romania enters | 12 | 52% |
| Fall of the Tsar | 16 | 48% |
| USA at war | 17 | 33% |
| Bolshevik Revolution / Brest-Litovsk | 19 | 14% / 12% |
| Greece enters | 16 | 8% |

Mean VP at the start of each turn (games still running):

| Turn | 2 | 4 | 6 | 8 | 10 | 12 | 14 | 16 | 18 | 20 |
|---|---|---|---|---|---|---|---|---|---|---|
| Mean VP | 10.2 | 10.6 | 9.8 | 9.7 | 9.3 | 10.2 | 9.3 | 9.3 | 8.2 | 8.7 |
| Games still running | 200 | 200 | 200 | 199 | 196 | 182 | 164 | 145 | 120 | 103 |

The war's big moments arrive in roughly the right order: early neutral entries, the CP reaching Total War first, a slow Russian collapse and late US entry. US entry and the Bolshevik Revolution come later and less often than in history, because the bots raise War Status more slowly than experienced players.

### What the bots do with their action rounds

Mean per game, self-play:

| Measure | Allied bot | CP bot |
|---|---|---|
| Action rounds | 104.2 | 104.0 |
| Events played | 20.8 | 28.6 |
| Operations (of which 1-OP Automatic) | 66.7 (0.1) | 54.9 (0.3) |
| SR plays | 2.5 | 8.0 |
| RP plays | 14.2 | 12.5 |
| Attacks | 48.0 | 89.0 |
| Advances after combat | 16.8 | 36.6 |
| Mandated offensives missed | 3.69 | 1.33 |

Which step of the action-round procedure decided the round:

| Step | Allied bot | CP bot |
|---|---|---|
| Crisis (Fill) | 48.5% | 21.3% |
| Plan: Attack | 6.0% | 24.8% |
| Urgent event | 11.2% | 14.0% |
| Plan: Event | 8.6% | 12.3% |
| Rebuild (Allies only) | 10.6% | — |
| Plan: Logistics (RP / SR) | 3.0% / 2.4% | 12.0% / 7.7% |
| Mandated Offensive (round 3+ / last chance) | 7.0% / 1.9% | 4.8% / 1.0% |
| Forced play, Fallback, Automatic Operation | 0.7% | 2.2% |

The two bots play differently. The CP bot attacks almost twice as often and advances far more. The Allied bot spends about half its rounds shoring up endangered spaces.

## How the design changed

Each row compares a candidate with the reference bot of the time, on the same seeds. The figures are the candidate side's win rate before → after the change.

| Change | Allied bot | CP bot | Decision |
|---|---|---|---|
| Crisis spaces filled by **SR** (rushing units in by rail) switched off; crisis handled by moves only | 80% → 88% | 20% → 67% | Kept off |
| **Advance after combat** added (the early harness never advanced) | 35% → 43% | 33% → 93% | Kept |
| Attack the **first acceptable target** in a fixed order, instead of the best Score | 49% → 4% | 51% → 37% | Rejected |
| **Fixed priority order for moves** instead of values | 43% → 3% | 93% → 49% | Rejected |
| **Move value table** (Capture 4/2, Fill 2–4, Siege 2–3, Forward 1–1.5, Entrench 0.5–1.5) instead of finer scoring | 44% → 53% | 90% → 97% | Kept |
| **Five-target shortlist** instead of scoring every target | 44% → 48% | 90% → 89% | Kept (less work, no loss) |
| Allied Stance thresholds **+1** | 12% → 27% | — | Kept |
| Map's nation-only links (Channel crossings, Russian links) counted in distances | 26% → 44% | 83% → 80% | Kept |
| Allied **Rebuild** step (one RP play a turn when missing steps ≥ 6) | 38% → 51% | 68% → 60% (if given to CP) | Allies only |
| Holding key event cards until playable ("Kept" cards) | no effect | 87% → 80% | Dropped |
| Lexicographic retreat/SR/reinforcement choices and other clean-ups from the rules review | 39% → 49% | 61% → 57% | Kept (simpler, no loss) |
| Crisis Fill paid for **before** attacks | 49% → 22% | 57% → 44% | Rejected |
| Every Staff card's Plan = Ops (no Plan variety) | 39% → 43% | 61% → **8%** | Rejected: the Plan mix matters |
| Every Staff card's Plan = Logistics / = Event | 38% / 56% | 9% / 30% | Rejected |
| Every Staff card's Stance = Press (no Stance variety) | 39% → 42% | 61% → 57% | Variety kept (free) |
| Staff card front preference switched off | 80% → 78% | 20% → 24% | Kept (free) |
| Flank attacks attempted | 27% → 23% | 83% → 81% | Never attempt |
| Extra gap-filling, longer crisis range, idle-reserve SR, reserve-only crisis SR, MO preparation moves, different RP/SR triggers | no gain, or worse | no gain, or worse | Not adopted |

What the Plan experiments show: the even mix of Ops, Event and Logistics Plans on the Staff cards is what keeps the CP bot playing its reinforcements and war-status events and buying replacements. A bot that always attacks first collapses. The cards are not decoration; they carry the bot's strategic balance.

## Admin load

* The operator works out **3 to 5 Edge/Score values per bot action round** on average: about 3.2 for the CP bot and 4.5 for the Allies. The five-target shortlist caps this. Each value takes two lookups on the Edge table plus a few small bonuses; the Companion's calculator does it in seconds.
* Many bot rounds need no Attack Search at all: an urgent event, the Rebuild step, or an Event or Logistics Plan that fires first decides them. The Attack Search is only needed when a step asks for it.
* The 1-OP Automatic Operation is almost never used, so the bot's hand turns over normally.
* Turn-end decisions (replacements, reinforcements, draw-phase discards) follow short fixed orders.

These are counts, not clock times. Table time has not been measured.

## Known limits

* **The opponent was a bot.** All strength figures come from games against bots. A strong person will exploit things no tested opponent exploits, especially thin lines and the bot's predictable Fill moves.
* **The Allied bot misses mandated offensives** about 3.7 times a game, often because no British or Italian unit is in contact with a valid target. Moving those units into contact (MO preparation) made no difference in testing, so it was left out.
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
