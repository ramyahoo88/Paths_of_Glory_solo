# General Staff — a card-driven solo opponent for *Paths of Glory*

**Version 0.8.0 (playtest draft)** · Unofficial fan material for GMT Games' *Paths of Glory* (Deluxe edition, Historical scenario / full campaign, the standard 110 strategy cards, no optional cards). You need the physical game. Strategy-card numbers below are the numbers printed on the cards.

General Staff can command **either side**; you play the other side normally. The bot follows the same rules you do. It holds a hand of real strategy cards and takes six action rounds a turn. Each round it plays a card as an Event, for Operations (OPS), for Strategic Redeployment (SR) or for Replacement Points (RP), or it takes the 1-OP Automatic Operation. It never breaks a rule, never looks at your hand and never rolls dice to make a decision. Its decisions come from a deck of **Staff cards** and the fixed priorities in this booklet. Dice are rolled only where the game rules call for them (combat, mandated offensives, entrenching, sieges and so on).

You do the bot's physical work: move its counters, roll its dice and keep its hand. When the bot must choose between equal options, the Staff card's **Tie** decides.

The optional **General Staff Companion** (an offline web page) draws Staff cards, works out Edge and Score, tracks the turn, round and MO, lists the tables, and can move a session to another device. Everything it decides is also on the printed sheets.

---

## 1. Components and setup

**Staff cards (18).** Print `staff_cards.pdf` at 100% on US Letter: six poker-size cards per page, each face page followed by a page of backs (print double-sided, flipping on the long edge, or print the odd pages only). Each card shows:

* a **Front number** (1–6). Find the front on the bot's **Front Table** (§10.2) for its current War Commitment level;
* a **Stance**: *Assault*, *Press* or *Hold*. It sets how good an attack must look (§5.4);
* a **Plan**: *Ops*, *Event* or *Logistics*. It sets the order of the bot's options (§3);
* a **Tie**: *North* or *South*. Between equal choices, take the more northerly or more southerly space (or the unit in it).

**Reference sheets**: the procedure summary, the Front Tables, the Objective lists, the Edge table and the Event Priority lists for both decks.

**Setup.** Set up the Historical scenario normally. Shuffle the Staff deck. Deal the bot its strategy cards exactly as for a human player.

**Difficulty (optional).** For a harder game, start the VP marker 1 or 2 spaces in the bot's favour: toward 20 when the bot plays the Central Powers, toward 0 when it plays the Allies. For an easier game, move it toward you instead. In bot-versus-bot tests, each VP of handicap shifted the result by six to eight percentage points. The Allied bot is still the stronger of the two: about three VP evens a game between the bots. A player facing the Central Powers bot may want to start with 1 or 2 VP in the bot's favour, raising it if the bot still loses. Keep the bot's hand face down beside the board and look at it when the procedure tells you to. The bot plays to fixed rules, so seeing its cards gives you little, but the honest habit is to look only when asked.

---

## 2. Terms

* **Front.** Every space belongs to one of five fronts: **West**, **East**, **Italy**, **Balkans**, **Near East** (§10.1).
* **Front order.** The Staff card's front first; then the others in this fixed order: West, East, Italy, Balkans, Near East. **The Central Powers bot always puts the West first**, then the Staff card's front, then the fixed order. Its main effort stays in the West, and the Staff card sets the second front.
* **Contact.** A space is *in contact* if an enemy unit is in an adjacent space.
* **Objective.** For each front, the bot's Objective is the **first space on that front's Objective list (§10.3) that the bot does not control**. Where a list starts with some of the bot's own key spaces (for example Paris for the Allies, or Lemberg for the Central Powers), a lost one becomes the Objective until it is retaken. "The front's Objective" and "Objective list" always mean those of the front the space in question lies on (§10.1). A few lists name a space on a neighbouring front (Bucharest and Constanta on the Central Powers' Balkans list, Constantinople on the Allied Near East list). Such a space can be that front's Objective for Forward moves and the "within two spaces" bonus, but an attack on it is an Objective attack only for the front it lies on.
* **Distance.** The number of connections crossed on the shortest route between two spaces, ignoring units; adjacent spaces are at Distance 1. Connections that only one nation may use (the British Channel crossings, and the Russian, Italian and Turkish ones) count; MEF and Arab Northern Army landing links do not. Work out the Attack Search and the Move list only when a step needs them.
* **Threatened space.** A bot-controlled VP space, capital or space with a fort symbol that holds no units at all, while an enemy unit is within two spaces. It is in **crisis** if an enemy unit is adjacent.
* **Edge.** In a proposed attack, the bot's expected hits minus the defender's expected hits (§5.3).
* **Current Staff card.** The card drawn for the bot's latest action round. Use it for every bot decision until the next draw, including decisions made during your action rounds and in the turn-end phases. Before the bot's first draw of the game, use Stance *Press* and Tie *North*.
* **Missing steps.** Count them by RP nationality: 2 for each army and 1 for each corps in the Eliminated Units box (not permanently eliminated units), 1 for each reduced army on the map, ½ for each reduced corps on the map.
* **Equal units.** When the procedure ranks two units in the same space equally (for losses, the Guard rule, advances or replacements), you choose.

---

## 3. The bot's action round

Draw one Staff card. When the deck runs out, shuffle the discards to form a new one. Then go down this list. The **first** step that produces an action is the bot's action for the round.

1. **Forced play.** If a rule requires a particular card (Guns of August in the first action round of the game), play it.
2. **MO: last chance.** In action rounds 5 and 6, if the bot's mandated offensive (MO) is unmet and the attacks the Attack Search plans (§5.4, with the highest OPS among the bot's cards) include one that would satisfy it, conduct that Operation (§4).
3. **Urgent event.** Among the bot's cards whose event is legal now, play the one with the highest **event priority of 7, 8 or 9** (§8). Ties: lower OPS value, then the lower card number.
4. **MO.** From action round 3, if the MO is unmet and the planned attacks include one that would satisfy it, conduct that Operation.
5. **Crisis.** If a bot space is in crisis, plan an Operation as in §4 with the highest OPS among the bot's cards. If its planned moves include any **Fill** (§6), of this space or another, conduct an Operation — but choose the card as if no attacks were planned: the lowest-OPS card that pays for the first planned move (§4 step 2), then plan again with that card's OPS, attacks first. A cheap card may therefore make no Fill; that is intended and tested.
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
   2. conduct a moves-only Operation if the moves it could pay for (going down the Move list with the highest OPS among its cards) include a Capture, Fill or Siege, or at least two moves of any kind;
   3. play a card for RP or SR using the low triggers in §7;
   4. otherwise take the **1-OP Automatic Operation** and use it for the first move on the Move list, if any.

---

## 4. Conducting an Operation

1. **Plan the attacks** with the Attack Search (§5). The bot may spend up to the highest OPS value among its cards (1 if it has none).
2. **Choose the card.**
   * If the whole plan (the attacks plus the moves the highest-OPS card could pay for, step 3) costs 1 OP and makes at most one attack, or the bot has no card it can play for OPS, take the **Automatic Operation** and keep the cards.
   * Otherwise play the card with the **lowest OPS value that is enough** for the planned attacks (if none are planned, enough for the first planned move), avoiding cards of event priority 6 or more unless no other card is enough. Ties: lower event priority, then the lower card number. For this choice, and for RP and SR, a combat card counts as priority 0.
   * If no card is enough, play the one with the highest OPS value (ties: lower priority) and plan again within it.
3. **Spend the OPS.** Activate the planned attack spaces. Then use any OPS left for Move activations, going down the Move list (§6) and skipping any that cost too much. Each space is activated only once.
4. **Resolve** movement and then combat, as the rules require. Make the planned attacks in order. Before each one, work out its Edge again with the attacking group (§5.2) of the units now able to attack, and keep the bonuses from planning. If the units now able to attack would no longer satisfy the MO, drop the MO bonus: it is now an ordinary attack. Skip it if it is no longer possible, or if this new Score has fallen more than 0.5 below the Stance. Never skip an attack that still satisfies the MO. Then units in spaces activated for combat that have not attacked may attack the target with the best Edge (no bonuses), if that Edge meets the Stance, one attack at a time.

---

## 5. Attack Search

### 5.1 Targets

A **target** is an enemy-occupied space, or an enemy-controlled fort that is not besieged, that bot units could legally attack this action round. The attacking units must be supplied, belong to nations at war, and be adjacent and allowed to attack that space; the Near East restrictions and similar rules apply as usual.

### 5.2 Shortlist and attackers

For each target, the **attackers** are the bot units able to attack it, from one or more adjacent spaces.

**Attacking together.** Units in several spaces can join one attack only where the rules allow it. In particular, when units of different nationalities attack from more than one space, one attacking space must hold units of every nationality taking part (12.1.11.1). Build the attacking group space by space, strongest space first (equal CF: the Tie), and skip a space whose units could not legally join the units already taken. The Score of a target (§5.3) always uses this group.

Make a **shortlist** across the whole map: the **three** targets with the largest **CF difference**, counting the CF of every bot unit able to attack the target (whatever the OPS) minus the defending CF and any undestroyed fort's value. Add any target that is the Objective of its own front, and any target where an attack by its attacking group would satisfy the bot's unmet MO. Rank the shortlist by Score (§5.3), using each target's attacking group.

### 5.3 Edge and Score

For each shortlisted target, find both fire columns exactly as in combat.

* **Bot column**: the total attacking CF, on the Army table if any attacker is an army, otherwise on the Corps table. Shift one column left for mountain or swamp, one for a level-1 trench and two for a level-2 trench.
* **Defender column**: the total defending CF plus the fort value (for an undestroyed fort the defender controls), on the Army table if any defender is an army. Shift one column right if the defender has a trench. A defender always fires: a unit with 0 CF uses the Corps table's 0 column, and an empty fort fires on the Corps table at its fort value.
* Trench shifts apply only when defending units are in the space.

Read each column's **expected hits** from the Edge table (§10.4), using its one-decimal values exactly as printed. Then:

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

Consider the shortlisted targets from the highest Score down. For each, take its attacking spaces strongest first, skipping any whose activation cost no longer fits the OPS still unspent or whose units could not legally join those already taken (§5.2), and work out the Score again with only those units. The MO bonus counts only if those units would satisfy the MO. Attack if the Score meets the Staff card's Stance (a Score equal to the threshold meets it):

| Stance | Central Powers bot: attack if the Score is at least | Allied bot: attack if the Score is at least |
|---|---|---|
| Assault | +0.75 | +1 |
| Press | +1.5 | +1.75 |
| Hold | +2.25 | +2.5 |

From action round 5, the first attack whose chosen units would satisfy the bot's unmet MO is made whatever its Score.

Each attacking space joins only one attack. The bot plans **at most three attacks** in one action round (the leftover attacks of §4 step 4 come on top).

---

## 6. Moves

The **Move list** holds every move below that the bot could make, ranked by **Move value** (highest first; ties by the front order of the moving stack's space, then the Tie for that space, then the Tie for the destination).

| Move | What happens | Value |
|---|---|---|
| **Capture** | A stack moves into an adjacent enemy-controlled space that has no enemy unit and no undestroyed enemy fort, and where the rules let it end its move. A stack next to several such spaces takes a VP space first, then one nearer the front's Objective than the stack is, then the Tie. | 4 for a VP space, otherwise 2 |
| **Fill** | The nearest bot stack within three spaces of a threatened space moves into it (ties: the Tie). The stack must be out of contact or hold two or more units. | 2, +1 if in crisis, +1 if a capital |
| **Siege** | A stack that can besiege moves into an adjacent enemy fort space with no enemy units. It can besiege if it moves an army, or at least as many corps as the fort's value after the Guard rule. | 3 for a VP space, otherwise 2 |
| **Forward** | A stack not in contact moves toward the bot-controlled space in contact on its front that has fewer than three units. Choose the one nearest the stack, counting half the distance from that space to the front's Objective as extra distance (ties: the Tie). With no such space, the stack moves toward the Objective. It stops on reaching a space in contact. | With an army: 1.5 (CP bot), 2.5 (Allied bot). Otherwise 1 |
| **Entrench** | Only once an Entrench event has been played: an army in contact, in a bot-controlled space below trench level 2, attempts to entrench. | 1.5 with a Hold card, otherwise 0.5 |

Once a space is activated, ignore its other entries on the list.

**How a stack moves.** Move the strongest units of the stack, up to three, but no more than the first step can take without overstacking (the Guard rule still applies). Units besieging an enemy fort keep a legal besieging force behind (an army, or as many corps as the fort's level, 15.2.4): skip any unit whose departure would leave less. If no unit can take a step, or none may leave a siege, drop the move. At each step, enter the adjacent space nearest the destination (ties: the Tie) that meets all of these:

* the stack may legally enter it and end its move there;
* it holds no enemy unit and would not overstack;
* it is not an enemy fort the stack cannot besiege (judge corps by the whole group that will move, so two corps may gather to besiege a level-2 fort);
* the moving units would be **in supply** there, counting any supply route their arrival opens.

Stop when no such space is nearer the destination than the stack is. If that happens on the first step, drop the move.

**Guard rule.** When a stack of two or more units leaves a bot-controlled space that is in contact, it leaves its weakest unit behind, unless it is capturing a VP space. A lone unit may move.

---

## 7. Logistics

The bot plays a card for RP or SR only when the rules allow it: no SR play if it played SR in its previous action round (9.3.3), no RP play if it played RP in its previous action round (9.4.3), and no RP in the Influenza turn. When the play is not allowed, treat its trigger as not met.

### 7.1 Replacement Points

Add up the bot's missing steps (§2) by RP nationality, less the RP it already holds for that nationality (counting no nationality below zero). Use the trigger: **3 or more** normally, **1.5 or more** in the Fallback step.

When the trigger is met, play the card whose RP values cover the most missing steps of matching nationalities: for each nationality, a card covers up to that nationality's missing steps, counted before subtracting RP already held. It must cover at least **2** steps (**1** in Fallback). Never use a card of event priority 7 or more. Ties: lower event priority, then the lower card number.

### 7.2 Strategic Redeployment

Add up the SR cost (corps 1, army 4) of the bot's units in the Reserve Box and its units more than three spaces from any enemy unit. Use the trigger: **4 or more** normally, **1 or more** in the Fallback step.

When the trigger is met, play the card whose SR value is closest to that total (counting at most 5). Never use a card of event priority 7 or more. Ties: lower event priority, then the lower card number.

Redeploy first any bot unit that can reach a space in crisis, provided it is not in contact and not a lone unit within two spaces of an enemy unit. Then redeploy the counted units (Reserve Box, or more than three spaces from the enemy), until the SR points run out. In both groups take armies first, then corps; among equal units, one in the Reserve Box before one on the map, then the Tie. For each unit, choose the destination in this order of preference:

1. a space that would not overstack and is in supply;
2. a threatened space (nearest an enemy unit first);
3. a space in contact, on the earliest front in front order;
4. a VP space;
5. the Tie.

---

## 8. Events

Each strategy card has an **event priority** from 0 to 9 on the Event Priority lists. Some notes change it with the situation.

* **7–9: urgent.** Played at §3 step 3, after Forced play and *MO: last chance*.
* **5–6.** Played when the Staff card's Plan reaches *Event*.
* **3–4.** Played only in the Fallback step.
* **0–2.** Never played as an action-round event.
* **CC.** Combat cards are never played as action-round events (§9). The number after "CC" on the Event Priority lists is the card's keep value, used for draw-phase discards.

A card's event is played only when the rules allow it at that moment. A reinforcement card of priority 5 or less counts as priority 3 while the bot holds a reinforcement card of the same nation with priority 7 or more.

When the bot chooses a card for OPS, SR or RP, a combat card counts as priority 0, so it is usually the first card spent (§4). The bot uses the combat cards it still holds in combat (§9).

**Placing reinforcements.** Put each new unit in the legal arrival space that would not overstack, on the earliest front in front order; then the one nearest an enemy unit; then the Tie.

---

## 9. Other decisions

| Situation | Bot decision |
|---|---|
| **Combat cards, attacking** | Play every usable combat card from hand. Always use already-played combat cards that apply. |
| **Combat cards, defending** | Play usable combat cards from hand when defending a VP space, a fort space or a trench. Always use already-played combat cards that apply. |
| **Flank attack** | Never attempted. (Wireless Intercepts is played when the rules allow, which makes the flank attack automatic.) |
| **Losses** | Among the losses the rules allow (as much of the Loss Number as possible without going over it, and the British loss priority, 12.4), take steps from full corps first, then reduced corps, then full armies, then reduced armies. Within each group, start with the lowest CF; equal units in different spaces: the Tie. |
| **Retreat** | Choose among the spaces the rules allow, in this order of preference: one the retreat will not overstack; bot-controlled; supplied; not in contact; nearest a bot capital (Allies: Paris, London, Petrograd, Rome, Belgrade, Bucharest; CP: Berlin, Vienna, Constantinople, Sofia); most bot units; the Tie. Apply this to each space of a longer retreat. |
| **Cancelling a retreat** | When defending a VP space or capital that holds a full-strength unit, take the extra step loss (from the smallest such unit) to stay, where the rules allow. |
| **Advance after combat** | Advance into the battle space if it is a VP space, a fort, or on its front's Objective list, or if the Staff card is Assault or Press. Move the strongest units first (equal CF in different spaces: the Tie), up to three in the space. Leave one unit behind in any bot-controlled space that would otherwise be emptied while it is still in contact with other enemy units. Advance one space only. |
| **Replacement Phase** | Spend RP on armies in contact first, then other armies on the map, then eliminated armies; then corps in the same order. Equal units in different spaces: the Tie. Rebuild an eliminated army in the legal space on the earliest front in the order West, East, Italy, Balkans, Near East (ignore the Staff card), without overstacking; ties: the Tie. |
| **Draw phase** | Before drawing, if the bot holds three or more combat cards, discard the one with the lowest keep value (ties: lower card number); repeat until it holds two. Never discard other cards. |
| **Operations and attacks granted by an event** | An event that grants a whole Operation (Guns of August and the like) is planned like any Operation (§4–§6) with the OPS the event gives. Units an event lets attack outside such a plan attack the target with the best Edge (no bonuses) that meets the Stance, then the next, as in §4 step 4. If none meets the Stance, they make no attack. |
| **French Mutiny** | While French Mutiny replaces the Allied MO, the Allied bot treats its MO as met (no MO bonus, no MO steps). Its French units still attack normally; pay any VP the rules charge. |
| **Other choices** (attrition, the order of siege and entrenchment rolls, where to place an event trench, which army entrenches) | Follow the rules; where the bot must choose, use front order, then the Tie. When an army entrenches, use the strongest. |

**Event choices.** When an event the bot played, or an event affecting the bot, asks it to choose:

| Event | The bot's choice |
|---|---|
| **Landwehr** (CP) | Use the whole effect. Flip reduced German units in the Replacement Phase order: armies in contact, other armies, corps in contact, other corps; ties: front order, then the Tie. |
| **War in Africa** (bot is the Allies) | Remove a British corps rather than give the VP: one in the Reserve Box first, then one out of contact, then any. Among equals, take the one on the latest front in front order; on the same front, use the Tie. Give the VP only if no corps can be removed. |
| **Salonika** (Allied bot) | Play it as an event only if at least one corps may go: a British or French corps (not the BEF or a minor British corps) in the Reserve Box, or in an Allied port space out of contact. Then send corps up to the limit: from the Reserve Box first, then from spaces out of contact (latest front in front order first; on the same front, the Tie). Never send a corps that is in contact. |
| **Entering neutral units** | Place each unit in an empty space of its nation: next to enemy units first, then a VP space, then any; ties: the Tie. |
| **Withdrawal** (bot defending) | Negate the loss that eliminated a unit first, otherwise the loss of the strongest unit. |
| **Trench-negating combat cards** | Play them when the rules offer them, as for any combat card when attacking. |
| **Kerensky Offensive** | Use the +2 on the first Russian attack that can take it. |
| **Brusilov Offensive** | Cancel trench effects on the first Russian attack where the rules allow it (not against German defenders). |

---

## Rules reminders for the bot's operator

The bot relies on the normal *Paths of Glory* rules. These come up most often when you run it:

* Activating a space costs 1 OP per nationality in it, with the printed exceptions.
* MO attacks must meet the MO rules: French and British attacks must hit German units in France, Belgium or Germany, and minor British units do not count.
* Before Race to the Sea, Central Powers units may not end a move in Amiens, Calais or Ostend unless the CP War Status is 4 or more. German armies may not enter Trent, Villach or Trieste before the Allies reach Total War.
* Out-of-supply units cannot move or attack, and units may not end a move overstacked.
* A retreat can be cancelled only where the rules allow it (terrain or trenches).

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
