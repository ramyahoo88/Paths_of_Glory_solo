# General Staff — a card-driven solo opponent for *Paths of Glory*

**Version 0.2 (playtest draft)** · Unofficial fan material for GMT Games' *Paths of Glory* (Deluxe edition, Historical/Campaign game, the standard 110 strategy cards, no optional cards). You need the physical game. Card numbers below are the printed numbers on the strategy cards.

General Staff can command **either side**. You play the other side normally. The bot follows the same game rules you do: it holds a hand of real strategy cards, takes six action rounds a turn, and uses each card as an Event, for Operations (OPS), for Strategic Redeployment (SR), for Replacement Points (RP), or takes the 1-OP Automatic Operation. The bot never breaks a rule, never looks at your hand and never rolls dice to make a decision. Its decisions come from a small deck of **Staff cards** and the fixed priorities in this booklet. Dice are rolled only where the game rules call for them (combat, MO, entrenching, sieges, flank attempts and so on).

You do the bot's physical work: you move its counters, roll its dice and keep its hand. When a rule asks you to pick between equal options, the Staff card's **Tie** decides it.

---

## 1. Components and setup

**Staff cards (18).** Each card shows:

* a **Front number** from 1 to 6, read on the bot's Front Table (§9.2);
* a **Stance**: *Assault*, *Press* or *Hold*, which sets how good an attack must look (§5.4);
* a **Plan**: *Ops*, *Event* or *Logistics*, which orders the bot's options (§3);
* a **Tie**: *North* or *South*. Between equal choices, take the more northerly (or southerly) space or unit on the map.

**Reference sheets**: the one-page procedure summary, the Front Tables, Objective lists, Edge table and the Event Priority lists for both decks.

**Setup.** Set up the Historical scenario normally. Shuffle the Staff deck. Deal the bot its strategy cards exactly as for a human player. Keep the bot's hand face down beside the board; look at it whenever the procedure tells you to. (The bot plays to fixed rules, so seeing its cards gives you no real advantage — but the honest way is to look only when asked.)

---

## 2. Terms

* **Front.** Every space belongs to one of five fronts: **West**, **East**, **Italy**, **Balkans**, **Near East** (§9.1).
* **Front order.** First the front shown for the current Staff card on the Front Table; then the others in this fixed order: West, East, Italy, Balkans, Near East.
* **Contact.** A space is *in contact* if an enemy unit is in an adjacent space.
* **Objective.** For each front, the bot's Objective is the **first space on that front's Objective list (§9.3) that the bot does not control**. The lists begin with the bot's own important spaces, so a lost one becomes the Objective until it is retaken.
* **Threatened space.** A bot-controlled VP space, capital or fort space that holds no bot unit while an enemy unit is within two spaces. It is in **crisis** if the enemy unit is adjacent.
* **Edge.** In a proposed attack, the bot's expected hits minus the defender's expected hits (§5.3).
* **Kept cards.** These cards are never used for OPS, SR or RP; the bot holds them until their event can be played: Allied 12 Entrench (until any Entrench event is played), 16 Romania, 17 Italy, 26 Lusitania, 33 Grand Fleet, 40 Fourteen Points, 43 and 47 USA Reinforcements, 52 Convoy, 54 Zimmermann Telegram, 55 Over There; Central Powers 6 Entrench (same exception), 28 Tsar Takes Command, 34 Bulgaria, 36 U-Boats Unleashed, 45 Treaty of Brest Litovsk, 52 Fall of the Tsar, 53 Bolshevik Revolution, 54 H-L Take Command.
* **Missing steps.** For RP purposes: 2 for each eliminated army, 1 for each eliminated corps or reduced army, ½ for each reduced corps, by RP nationality.

---

## 3. The bot's action round

Draw one Staff card (when the deck runs out, shuffle the discards). Then go down this list. The **first** step that produces an action is the bot's action for the round.

1. **Forced play.** If a rule requires a particular card (Guns of August on the first action round of the game), play it.
2. **Last chance for the MO.** In action rounds 5 and 6, if the bot's MO is unmet and the Attack Search (§5) includes an attack that would satisfy it, conduct that Operation.
3. **Urgent event.** Among the bot's cards whose event is legal now, play the one with the highest **event priority of 8 or 9** (§8). Ties: lower OPS value, then the lower card number.
3. **Mandated Offensive.** If the bot's MO is unmet, this is action round 3 or later, and the Attack Search (§5) includes an attack that would satisfy the MO, conduct that Operation.
4. **Crisis.** If a bot space is in crisis and the Move list (§6) includes a **Fill** move, conduct that Operation.
5. **The Staff card's Plan**, in the order shown on the card:

   | Plan | First | Second | Third |
   |---|---|---|---|
   | Ops | Attack | Event | Logistics |
   | Event | Event | Attack | Logistics |
   | Logistics | Logistics | Attack | Event |

   * **Attack** — the Attack Search finds at least one attack: conduct the Operation (§4).
   * **Event** — play the highest-priority legal event of priority **5 or more**.
   * **Logistics** — play a card for RP or SR if a trigger in §7 is met (RP is checked first).
6. **Fallback**, in order:
   1. play the highest legal event of priority **3 or 4**;
   2. conduct a moves-only Operation if the Move list contains a Fill, Capture or Siege move, or at least two moves;
   3. RP or SR with the low triggers in §7;
   4. otherwise take the **1-OP Automatic Operation** (use it for the first move on the Move list, if any).

---

## 4. Conducting an Operation

1. **Plan the attacks** with the Attack Search (§5), assuming the bot may spend the highest OPS value among its cards that are not Kept (or 1 if it has none).
2. **Choose the card.**
   * If all planned activations cost 1 OP and there is at most one attack, take the **Automatic Operation** and keep the cards.
   * Otherwise play, from the cards that are not Kept, the card with enough OPS for the planned attacks (or for the first move if there are no attacks) that has the **lowest event priority** — a card of priority 6+ only if no lower one is enough. Ties: lower OPS value, then lower card number. If no card is enough, play the highest-OPS card and plan again within its value.
3. **Spend the OPS.** Activate the planned attack spaces. Then spend any OPS left on Move activations from the Move list (§6), in its order, as long as they can be paid for. A space is activated only once.
4. **Resolve** moves first and then attacks, as the rules require. If a planned attack is no longer possible, use those attackers for the best other target they can reach that meets the Stance (§5.4), if any.

---

## 5. Attack Search

### 5.1 Targets

A **target** is an enemy-occupied space, or an enemy-controlled fort that is not besieged, that bot units could legally attack this action round: units that are supplied, belong to nations at war, and are adjacent and allowed to attack that space (Near East restrictions and the like apply as usual).

### 5.2 Shortlist and attackers

For each target, the **attackers** are the bot units able to attack it. Add attacking spaces strongest first while their activation costs fit the OPS available.

Look over the board and make a shortlist of targets: those with the largest **CF difference** (attacking CF minus defending CF, counting an undestroyed fort's value), plus the front's Objective and any target where an attack would satisfy the bot's MO.

### 5.3 Edge and Score

For each shortlisted target, find the two fire columns exactly as in combat:

* **Bot column**: total attacking CF on the Army table if any attacker is an army, otherwise the Corps table. Shift one column left for mountain or swamp, one for a level-1 trench and two for a level-2 trench.
* **Defender column**: total defending CF plus the fort value (undestroyed, defender-controlled fort), on the Army table if any defender is an army. Shift one column right if the defender has a trench.

Read each column's **expected hits** from the Edge table (§9.4).

> **Edge** = bot's expected hits − defender's expected hits

> **Score** = Edge + the bonuses below

| Bonus | Value |
|---|---|
| Target is the front's Objective | +1 |
| Target is within two spaces of the front's Objective | +0.4 |
| Target is a VP space | +0.5 |
| A defender is out of supply | +0.5 |
| Attack would satisfy the bot's unmet MO | +1 (rounds 1–2), +2.5 (rounds 3–4), +6 (rounds 5–6) |
| Target's front is 2nd / 3rd / 4th / 5th in front order | −0.25 / −0.5 / −0.75 / −1 |

### 5.4 Decision

Attack the target with the highest Score if the Score meets the Staff card's Stance:

| Stance | Attack if the Score is at least |
|---|---|
| Assault | 0 |
| Press | +0.75 |
| Hold | +1.5 |

From action round 5, an attack that satisfies the bot's unmet MO is made whatever its Score.

Then look for another attack with the OPS still unspent, using attacking spaces not yet chosen. The bot makes **at most three attacks** in one action round.

---

## 6. Moves

The **Move list** contains every move below that the bot could make, ranked by **Move value** (highest first; ties by front order, then the Tie).

| Move | What happens | Value |
|---|---|---|
| **Capture** | A stack adjacent to an enemy-controlled space that has no enemy unit and no intact enemy fort moves in. | 4 for a VP space, otherwise 2 |
| **Fill** | For a threatened space: the nearest bot stack within three spaces that is not in contact, or has two or more units, moves into it. | 2, +1 if in crisis, +1 if a capital |
| **Siege** | A stack that can besiege (an army, or at least as many corps as the fort's value) moves into an adjacent enemy fort space with no enemy units. | 3 for a VP space, otherwise 2 |
| **Forward** | A stack that is not in contact moves toward the nearest bot-controlled space in contact on its front that has fewer than three units, preferring the one nearest the front's Objective. It stops on reaching a space in contact. | 1.5 with an army, otherwise 1 |
| **Entrench** | (Only once an Entrench event has been played.) An army in contact, in a bot-controlled space below trench level 2, attempts to entrench. | 1.5 with a Hold card, otherwise 0.5 |

A stack appears on the list once for each move it could make; once a space is activated, ignore its other entries.

**How a stack moves.** Move the strongest units of the stack, up to the stacking limit, by the shortest route. Never enter a space where the move would overstack, never end the move in an enemy fort space that the stack cannot besiege, and never end it out of supply.

**Guard rule.** When a stack leaves a bot-controlled space that is in contact, it leaves its weakest unit behind — unless it is moving to capture a VP space.

---

## 7. Logistics

### 7.1 Replacement Points

Count the bot's missing steps (§2) by RP nationality and subtract RP it already has this turn. If the total is **3 or more** (low trigger: 1.5 or more), play the card whose RP values cover the most missing steps of the right nationalities, provided it covers at least 2 (low trigger: 1). Never use a Kept card or a card of event priority 7+. Ties: lower event priority.

### 7.2 Strategic Redeployment

Count the SR cost (corps 1, army 4) of the bot's units in the Reserve Box plus its units more than three spaces from any enemy unit. If the total is **4 or more** (low trigger: 1 or more), play the card whose SR value is closest to that total (up to 5). Never use a Kept card or a card of event priority 7+.

Move units in this order: armies, then corps. Destinations, best first: a threatened space; a space in contact on the earliest front in front order; a VP space. Never overstack and never move a unit out of supply.

---

## 8. Events

Every strategy card has an **event priority** from 0 to 9 on the Event Priority lists.

* **8–9: urgent** — played before anything else (§3 step 2).
* **5–7** — played when the Staff card's Plan reaches *Event*.
* **3–4** — played only in the Fallback step.
* **0** — never played as an action-round event.
* **CC** — combat cards are held for combat.

A few priorities change with the situation; the lists show these (for example *Rathenau* drops to 3 once *Independent Air Force* has been played). An army reinforcement card in hand lowers a two-corps reinforcement card of the same nation to 3. A card can be played as an event only if the rules allow it at that moment.

**Reinforcements.** Place new units in the legal arrival space nearest the Staff card's front (front order), and then nearest the enemy.

---

## 9. Other decisions

| Situation | Bot decision |
|---|---|
| **Combat cards (attacking)** | Play every usable combat card from hand; always use already-played ones that apply. |
| **Combat cards (defending)** | Play usable combat cards when defending a VP space, a fort or a trench. |
| **Flank attack** | Never attempted. |
| **Losses** | Take steps from full corps first, then reduced corps, then full armies, then reduced armies; lowest CF first. |
| **Retreat** | To a bot-controlled, supplied space; prefer one not in contact, then the one closest to a bot capital, then the one with most bot units. |
| **Cancelling a retreat** | When defending a VP space or capital with a full-strength unit, take the extra step loss (smallest CF unit) to stay, where the rules allow. |
| **Advance after combat** | Advance into the battle space if it is a VP space, a fort or on an Objective list — or with an Assault or Press card. Strongest units first, up to three, keeping the Guard rule; advance one space only. |
| **Replacement Phase** | Rebuild/flip armies in contact first, then other armies, then corps. Rebuilt armies go to the legal space on the earliest front in the bot's fixed order. |
| **Draw phase** | Before drawing, discard combat cards beyond the first two. |
| **Attrition, sieges, other choices** | Follow the rules; where the bot must choose, use front order and then the Tie. |

---

## 10. Reference

### 10.1 Fronts

* **West** — France, Belgium, Britain; Germany except the eastern spaces listed under East.
* **East** — Russia (except the Caucasus spaces under Near East), Romania; Austria-Hungary except the spaces listed under Italy and Balkans; eastern Germany: Oppeln, Breslau, Posen, Thorn, Danzig, Konigsberg, Tannenberg, Insterberg, Memel, Kolberg, Stettin, Cottbus, Berlin, Dresden.
* **Italy** — Italy; Trent, Trieste, Innsbruck, Spittal, Villach, Zagreb, Graz, Banja Luka.
* **Balkans** — Serbia, Montenegro, Albania, Greece, Bulgaria; Mostar, Sarajevo, Novi Sad, Pecs; Adrianople, Gallipoli, Cana Kale, Constantinople; the MEF beachhead spaces.
* **Near East** — the rest of Turkey, Persia, Arabia, Egypt, Libya; the Russian Caucasus: Batum, Kars, Poti, Grozny, Petrovsk, Tbilisi, Elizabethpol, Baku, Erivan, Caucasus.

### 10.2 Front Tables, 10.3 Objectives, 10.4 Edge table

See the Reference sheets.
