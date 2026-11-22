# General Staff — simulation report

*Version tested: General Staff v__VERSION__ (rules in [`bot/General_Staff_Rules.md`](../bot/General_Staff_Rules.md)). Report generated __DATE__.*

## What was tested, and how

**Engine.** All games were full *Paths of Glory* campaigns (Historical scenario, August 1914 to the end, standard cards) played on the open-source **Rally the Troops** rules engine, at a pinned commit. The engine enforces the rules: legal moves, combat, supply, sieges, trenches, mandated offensives, war status, neutral entries, Russian collapse, US entry and victory. The bot never makes an illegal move, because every decision is chosen from the engine's list of legal actions.

**Bot.** The harness in [`sim/bot.js`](bot.js) carries out the printed procedure: Staff card draw, action-round steps, Attack Search (shortlist, Edge, Score, Stance), Move list values, Logistics triggers, event priorities, Kept cards, and the "other decisions" table. It uses only information a person at the table has: the open board, the bot's own hand and the Staff card. It does not look ahead, simulate dice or see the opponent's hand.

**Opponents.**

* **General Staff itself** (self-play), the most demanding opponent available here.
* A **random** player, which picks uniformly among legal actions. This is a sanity check.
* A **naive** bot: the same machinery with the main features switched off. It plays no events except forced ones, makes one attack per action round, does not advance after combat, makes no moves, no SR and no crisis fills, and checks every target. It is roughly what a first-draft one-order bot does.

**Design comparisons.** Each design alternative was tested in paired games. A candidate bot on one side played a frozen reference bot on the other, on the same 120 seeds for both sides. That totals about **__ABGAMES__** simulated campaigns over the night. With 120 games, the standard error of a win rate near 50% is about ±4.5 points, so only differences of roughly 10 points or more were treated as real.

## Headline results (v__VERSION__)

__HEADLINE__

## How the design changed

The most important decisions, with the evidence behind them (win rate of the candidate side against the frozen reference of the time, 120 games per side):

| Change | Allied bot | CP bot | Kept? |
|---|---|---|---|
__ABLATIONS__

### Things that did **not** work

* **Picking the first acceptable target in a fixed order** instead of the best Score. It is easier at the table but much weaker: the Allied bot fell from 49% to 4%, the CP bot from 51% to 37%. The final rules use a five-target shortlist ranked by Score. The shortlist costs nothing measurable compared with scoring every target.
* **A fixed priority order for moves**, such as "always fill gaps first". It was disastrous (Allies 3%). A small value table (Capture VP 4, Fill 2–4, Siege 2–3, Capture 2, Forward 1–1.5, Entrench 0.5–1.5) did as well as fine-grained scoring, or better.
* **Crisis SR**, which used Strategic Redeployment to rush a unit into an endangered VP space. It cost the CP bot about 45 points of win rate and the Allies about 10. Crisis is now handled by Fill moves only.
* **Holding key cards unconditionally** for their future event (for example Fall of the Tsar, Over There) clogged the hand. The final rule keeps a card only while its event is close to playable.
* **Flank attacks**, **extra gap-filling**, **a longer crisis range**, and **stricter or looser RP/SR triggers** made no measurable difference. Flank attempts stayed out to keep the procedure short.

## Behaviour checks

__BEHAVIOUR__

## Admin load

__ADMIN__

## Known limits

* **Simulated opponents are not people.** All strength figures come from bot-versus-bot games. A strong human will exploit things no bot opponent tested here exploits, especially loose front lines. Human playtesting is the next step.
* **The Allied bot is the weaker of the two.** In self-play the CP bot wins about __CPSELF__ of games. The Allied bot is passive by design (higher attack thresholds, many crisis fills), and it often loses French units piecemeal while filling endangered spaces. It still beats the random and naive opponents in every game. If you want the stiffest challenge, give the bot the Central Powers.
* **Some events are only partly modelled.** Card events are played when legal, in priority order with a few situational adjustments. The finer timing judgements in the research table ([`research/event_policy.md`](../research/event_policy.md)) are not all in the procedure.
* **Rally the Troops implements the Historical scenario rules.** Rule differences between that implementation and your printed rules would carry over into these results.
* **Some decisions are not modelled.** Event sub-choices (for example where to place an event trench or which unit a card affects) use the engine's first legal option in the harness. At the table, the rules tell you to use front order and the Tie.
