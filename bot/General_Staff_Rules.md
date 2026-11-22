# General Staff — a card-driven solo opponent for *Paths of Glory*

**Version 0.4 (playtest draft)** · Unofficial fan material for GMT Games' *Paths of Glory* (Deluxe edition, Historical scenario / full campaign, the standard 110 strategy cards, no optional cards). You need the physical game. Strategy-card numbers below are the numbers printed on the cards.

General Staff can command **either side**; you play the other side normally. The bot follows the same rules you do. It holds a hand of real strategy cards and takes six action rounds a turn. Each round it plays a card as an Event, for Operations (OPS), for Strategic Redeployment (SR) or for Replacement Points (RP), or it takes the 1-OP Automatic Operation. It never breaks a rule, never looks at your hand and never rolls dice to make a decision. Its decisions come from a deck of **Staff cards** and the fixed priorities in this booklet. Dice are rolled only where the game rules call for them (combat, mandated offensives, entrenching, sieges and so on).

You do the bot's physical work: move its counters, roll its dice and keep its hand. When the bot must choose between equal options, the Staff card's **Tie** decides.

The optional **General Staff Companion** (an offline web page) draws Staff cards, works out Edge and Score, and lists the tables. Everything it does is also on the printed sheets.

---

## 1. Components and setup

**Staff cards (18).** Each card shows:

* a **Front number** (1–6). Find the front on the bot's **Front Table** (§10.2) for its current War Commitment level;
* a **Stance**: *Assault*, *Press* or *Hold*. It sets how good an attack must look (§5.4);
* a **Plan**: *Ops*, *Event* or *Logistics*. It sets the order of the bot's options (§3);
* a **Tie**: *North* or *South*. Between equal choices, take the more northerly or more southerly space (or the unit in it).

**Reference sheets**: the procedure summary, the Front Tables, the Objective lists, the Edge table and the Event Priority lists for both decks.

**Setup.** Set up the Historical scenario normally. Shuffle the Staff deck. Deal the bot its strategy cards exactly as for a human player. Keep the bot's hand face down beside the board and look at it when the procedure tells you to. The bot plays to fixed rules, so seeing its cards gives you little, but the honest habit is to look only when asked.

---

## 2. Terms

* **Front.** Every space belongs to one of five fronts: **West**, **East**, **Italy**, **Balkans**, **Near East** (§10.1).
* **Front order.** The Staff card's front first; then the others in this fixed order: West, East, Italy, Balkans, Near East.
* **Contact.** A space is *in contact* if an enemy unit is in an adjacent space.
* **Objective.** For each front, the bot's Objective is the **first space on that front's Objective list (§10.3) that the bot does not control**. Each list starts with the bot's own key spaces, so a lost one becomes the Objective until it is retaken.
* **Threatened space.** A bot-controlled VP space, capital or fort space that holds no bot unit while an enemy unit is within two spaces. It is in **crisis** if an enemy unit is adjacent.
* **Edge.** In a proposed attack, the bot's expected hits minus the defender's expected hits (§5.3).
* **Missing steps.** Count them by RP nationality: 2 for each eliminated army, 1 for each eliminated corps, 1 for each reduced army on the map, ½ for each reduced corps on the map.

---

## 3. The bot's action round

Draw one Staff card. When the deck runs out, shuffle the discards to form a new one. Then go down this list. The **first** step that produces an action is the bot's action for the round.

1. **Forced play.** If a rule requires a particular card (Guns of August in the first action round of the game), play it.
2. **MO: last chance.** In action rounds 5 and 6, if the bot's mandated offensive (MO) is unmet and the Attack Search (§5) includes an attack that would satisfy it, conduct that Operation (§4).
3. **Urgent event.** Among the bot's cards whose event is legal now, play the one with the highest **event priority of 8 or 9** (§8). Ties: lower OPS value, then the lower card number.
4. **MO.** From action round 3, if the MO is unmet and the Attack Search includes an attack that would satisfy it, conduct that Operation.
5. **Crisis.** If a bot space is in crisis and the Move list (§6) contains a **Fill** move, conduct an Operation.
6. **Rebuild** (Allied bot only). If the bot has not played a card for RP this turn and its missing steps, less the RP it already holds, total **6 or more**, play a card for RP as in §7.1 (if one qualifies).
7. **The Staff card's Plan**, in the order on the card:

   | Plan | First | Second | Third |
   |---|---|---|---|
   | Ops | Attack | Event | Logistics |
   | Event | Event | Attack | Logistics |
   | Logistics | Logistics | Attack | Event |

   * **Attack**: if the Attack Search finds at least one attack, conduct the Operation.
   * **Event**: play the legal event with the highest priority, if that priority is **5 or more** (ties as in step 3).
   * **Logistics**: play a card for RP, or else for SR, if a normal trigger in §7 is met.
8. **Fallback**, in order:
   1. play the highest legal event of priority **3 or 4**;
   2. conduct a moves-only Operation if the Move list holds a Capture, Fill or Siege move, or at least two moves of any kind;
   3. play a card for RP or SR using the low triggers in §7;
   4. otherwise take the **1-OP Automatic Operation** and use it for the first move on the Move list, if any.

---

## 4. Conducting an Operation

1. **Plan the attacks** with the Attack Search (§5). The bot may spend up to the highest OPS value among its cards (1 if it has none).
2. **Choose the card.**
   * If the plan costs 1 OP and makes at most one attack, or the bot has no card it can play for OPS, take the **Automatic Operation** and keep the cards.
   * Otherwise play the card with **enough OPS for the planned attacks** (if none are planned, enough for the first move on the Move list) that has the **lowest event priority**. Use a card of priority 6 or more only if no lower card is enough. Ties: lower OPS value, then the lower card number.
   * If no card is enough, play the one with the highest OPS value and plan again within it.
3. **Spend the OPS.** Activate the planned attack spaces. Then use any OPS left for Move activations, going down the Move list (§6) and skipping any that cost too much. Each space is activated only once.
4. **Resolve** movement and then combat, as the rules require. Make the planned attacks in order. If a planned attack is no longer possible or no longer reaches its Stance by at least 0.5 below the requirement (MO attacks excepted), skip it. Attackers left over may attack any other target that meets the Stance.

---

## 5. Attack Search

### 5.1 Targets

A **target** is an enemy-occupied space, or an enemy-controlled fort that is not besieged, that bot units could legally attack this action round. The attacking units must be supplied, belong to nations at war, and be adjacent and allowed to attack that space; the Near East restrictions and similar rules apply as usual.

### 5.2 Shortlist and attackers

For each target, the **attackers** are the bot units able to attack it. Count attacking spaces strongest first, adding them while their activation costs still fit the OPS available.

Make a **shortlist** across the whole map: the **five** targets with the largest **CF difference** (attacking CF minus defending CF, counting an undestroyed fort's value). Add any front's Objective that is a target, and any target where an attack would satisfy the bot's unmet MO.

### 5.3 Edge and Score

For each shortlisted target, find both fire columns exactly as in combat.

* **Bot column**: the total attacking CF, on the Army table if any attacker is an army, otherwise on the Corps table. Shift one column left for mountain or swamp, one for a level-1 trench and two for a level-2 trench.
* **Defender column**: the total defending CF plus the fort value (for an undestroyed fort the defender controls), on the Army table if any defender is an army. Shift one column right if the defender has a trench.

Read each column's **expected hits** from the Edge table (§10.4). Then:

> **Edge** = bot's expected hits − defender's expected hits
>
> **Score** = Edge + the bonuses below

| Bonus | Value |
|---|---|
| The target is the front's Objective | +1 |
| Otherwise, the target is within two spaces of the front's Objective | +0.4 |
| The target is a VP space | +0.5 |
| A defender is out of supply | +0.5 |
| The attack would satisfy the bot's unmet MO | +1 in rounds 1–2, +2.5 in rounds 3–4, +6 in rounds 5–6 |
| The target's front is 2nd, 3rd, 4th or 5th in front order | −0.25, −0.5, −0.75 or −1 |

### 5.4 Decision

Consider the shortlisted targets from the highest Score down. Attack a target if its Score, recalculated with only the attacking spaces the remaining OPS can pay for, meets the Staff card's Stance:

| Stance | Central Powers bot: attack if the Score is at least | Allied bot: attack if the Score is at least |
|---|---|---|
| Assault | 0 | +1 |
| Press | +0.75 | +1.75 |
| Hold | +1.5 | +2.5 |

From action round 5, the first attack that would satisfy the bot's unmet MO is made whatever its Score.

Each attacking space joins only one attack. The bot makes **at most three attacks** in one action round.

---

## 6. Moves

The **Move list** holds every move below that the bot could make, ranked by **Move value** (highest first; ties by front order, then the Tie).

| Move | What happens | Value |
|---|---|---|
| **Capture** | A stack moves into an adjacent enemy-controlled space that has no enemy unit and no intact enemy fort. A stack next to several such spaces takes a VP space first, then the one nearer its front's Objective. | 4 for a VP space, otherwise 2 |
| **Fill** | The nearest bot stack within three spaces of a threatened space moves into it. The stack must be out of contact or hold two or more units. | 2, +1 if in crisis, +1 if a capital |
| **Siege** | A stack that can besiege moves into an adjacent enemy fort space with no enemy units. It can besiege if it moves an army, or at least as many corps as the fort's value after the Guard rule. | 3 for a VP space, otherwise 2 |
| **Forward** | A stack not in contact moves toward the bot-controlled space in contact on its front that has fewer than three units. Choose the one nearest the stack, counting half the distance from that space to the front's Objective as extra distance. With no such space, the stack moves toward the Objective. It stops on reaching a space in contact. | 1.5 with an army, otherwise 1 |
| **Entrench** | Only once an Entrench event has been played: an army in contact, in a bot-controlled space below trench level 2, attempts to entrench. | 1.5 with a Hold card, otherwise 0.5 |

Once a space is activated, ignore its other entries on the list.

**How a stack moves.** Move the strongest units of the stack, up to three, by the shortest route. Never enter a space where the move would overstack, never end the move in an enemy fort space the stack cannot besiege, and stop rather than end in a space that would be out of supply.

**Guard rule.** When a stack leaves a bot-controlled space that is in contact, it leaves its weakest unit behind, unless it is capturing a VP space.

---

## 7. Logistics

### 7.1 Replacement Points

Add up the bot's missing steps (§2) by RP nationality, less the RP it already holds for that nationality. Use the trigger: **3 or more** normally, **1.5 or more** in the Fallback step.

When the trigger is met, play the card whose RP values cover the most missing steps of matching nationalities. It must cover at least **2** steps (**1** in Fallback). Never use a card of event priority 7 or more. Ties: lower event priority.

### 7.2 Strategic Redeployment

Add up the SR cost (corps 1, army 4) of the bot's units in the Reserve Box and its units more than three spaces from any enemy unit. Use the trigger: **4 or more** normally, **1 or more** in the Fallback step.

When the trigger is met, play the card whose SR value is closest to that total (counting at most 5). Never use a card of event priority 7 or more.

Redeploy first any unit that can reach a space in crisis, then armies, then corps. Destinations, best first:

1. a threatened space;
2. a space in contact on the earliest front in front order;
3. a VP space.

Never overstack, and never redeploy a unit to a space that is out of supply.

---

## 8. Events

Each strategy card has an **event priority** from 0 to 9 on the Event Priority lists. Some notes change it with the situation.

* **8–9: urgent.** Played before anything else (§3, step 3).
* **5–7.** Played when the Staff card's Plan reaches *Event*.
* **3–4.** Played only in the Fallback step.
* **0.** Never played as an action-round event.
* **CC.** Combat cards are held for combat (§9).

A card's event is played only when the rules allow it at that moment. A two-corps reinforcement card counts as priority 3 while the bot holds a playable army reinforcement card (priority 7 or more) of the same nation.

**Placing reinforcements.** Put new units in the legal arrival space on the earliest front in front order. Among those, choose the one nearest an enemy unit, and never overstack.

---

## 9. Other decisions

| Situation | Bot decision |
|---|---|
| **Combat cards, attacking** | Play every usable combat card from hand. Always use already-played combat cards that apply. |
| **Combat cards, defending** | Play usable combat cards when defending a VP space, a fort space or a trench. |
| **Flank attack** | Never attempted. (Wireless Intercepts is played when the rules allow, which makes the flank attack automatic.) |
| **Losses** | Take steps from full corps first, then reduced corps, then full armies, then reduced armies. Within each group, start with the lowest CF. |
| **Retreat** | Go to a bot-controlled, supplied space that the retreat will not overstack. Prefer one not in contact, then the one nearest a bot capital, then the one with the most bot units. |
| **Cancelling a retreat** | When defending a VP space or capital that holds a full-strength unit, take the extra step loss (from the smallest such unit) to stay, where the rules allow. |
| **Advance after combat** | Advance into the battle space if it is a VP space, a fort, or on an Objective list, or if the Staff card is Assault or Press. Move the strongest units first, up to three in the space, keeping the Guard rule. Advance one space only. |
| **Replacement Phase** | Spend RP on armies in contact first, then other armies on the map, then eliminated armies, then corps. Rebuild an eliminated army in the legal space on the earliest front in the bot's fixed front order, without overstacking. |
| **Draw phase** | Before drawing, discard combat cards beyond the first two. |
| **Other choices** (attrition, sieges, event details) | Follow the rules; where the bot must choose, use front order, then the Tie. |

---

## 10. Reference

### 10.1 Fronts

* **West**: France, Belgium, Britain; Germany except the eastern spaces listed under East.
* **East**: Russia (except the Caucasus spaces listed under Near East), Romania, eastern Germany, and Austria-Hungary except the spaces listed under Italy and Balkans. Eastern Germany is Oppeln, Breslau, Posen, Thorn, Danzig, Konigsberg, Tannenberg, Insterberg, Memel, Kolberg, Stettin, Cottbus, Berlin and Dresden.
* **Italy**: Italy; Trent, Trieste, Innsbruck, Spittal, Villach, Zagreb, Graz, Banja Luka.
* **Balkans**: Serbia, Montenegro, Albania, Greece, Bulgaria; Mostar, Sarajevo, Novi Sad, Pecs; Adrianople, Gallipoli, Cana Kale, Constantinople; the MEF beachhead spaces.
* **Near East**: the rest of Turkey, Persia, Arabia, Egypt, Libya, and the Russian Caucasus: Batum, Kars, Poti, Grozny, Petrovsk, Tbilisi, Elizabethpol, Baku, Erivan and the Caucasus space.

### 10.2 Front Tables · 10.3 Objective lists · 10.4 Edge table · Event priorities

These are on the Reference sheets and in the Companion.

---

## Credits and status

Design: Claude (Anthropic), 2026, for a solo player of GMT's *Paths of Glory* (designer Ted Raicer). This is unofficial fan material, not endorsed by GMT Games. Developed and tested with simulated full campaigns on the Rally the Troops implementation of the rules (Nathan Forget and Tor Andersson, with GMT's permission). See the simulation report for results and limits. This is a playtest draft: human games have not yet been played with it.
