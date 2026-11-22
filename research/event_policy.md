# Paths of Glory (Deluxe, Historical scenario) - Bot Event Policy

Scope: the 110 standard strategy cards (AP 1-55, CP 1-55). Optional cards AP/CP 56-65 are excluded; they were identified with `is_optional_card()` in `data.js` (global indexes 56-65 and 121-130). Card stats (OPS, SR, WS, CC, removal, commitment) are taken from `data.js`; legality was cross-checked against the `events.<key>.can_play()` / `can_apply()` functions and `can_play_event()` in `rules.js`, the Deluxe rulebook text in `info/rules.html`, and the printed card images. Card text is paraphrased.

Machine-readable version: `event_policy.json` (same content, one object per card).

## How the bot uses this table

Each action round, after any mandatory play (CP Guns of August on turn 1 AR 1), the operator does the following:

1. **Find the candidate events.** Look at every card in hand whose *Play as event when* condition is true right now.
2. **Use the priority scale:**
   - **9**: play as the event this AR, unless the auto-victory warning is active (VP <= 2 for CP, VP >= 18 for AP) and the OPS are needed to save a space.
   - **7-8**: play as the event unless an unmet Mandated Offensive or a clear defensive emergency (an army about to be cut off, a capital or VP space about to fall) needs this exact card's OPS. If so, play it next AR.
   - **5-6**: play as the event only if no priority 7+ event is available and the bot has another card that can cover this turn's OPS needs.
   - **3-4**: play as the event only when the specific trigger in the condition is met. Otherwise use the card for OPS, SR or RP.
   - **0-2**: effectively never. A card with priority 0-2 is played as an event only to thin the deck in the last turns.
3. **Break ties** by higher priority, then by an expiring window (cards listed in *Traps*), then by lower OPS value, which keeps the big cards for operations.
4. **Combat cards (CC)** are never action-round events. In the engine they are legal only inside a combat; the one exception is Place of Execution, which can be played alone once every French fort is destroyed. For a CC, *priority* means how strongly to reserve it for combat:
   - Do not spend a CC of priority 6 or more as OPS, SR or RP while its *Hold as CC when* condition is true, unless it is the only card that can do a required job.
   - Keep at most 3 CCs in hand and spend the lowest-priority surplus.
   - In the Draw phase, discard any CC whose hold condition will be false next turn (rule 9.5.4.6).
5. **Event plus OPS.** The **+OPS** flag marks cards whose event also gives the card's full OPS: Landships, Cloak and Dagger, Mata Hari, Yanks and Tanks, Brusilov, Kerensky, Tsar Takes Command, Fall of the Tsar, Bolshevik Revolution, Zimmermann Telegram and Over There. When the event is legal, playing it is never worse than playing the card for OPS.

**R-check** (the standard reinforcement legality test, rule 9.5.3 and `can_play_event()`): all four must be true.

- It is not turn 1.
- No other reinforcement card for this nation has been played this turn.
- The nation is at war. US cards also need Over There played, and U-Boats Unleashed must not be in effect unless Convoy has been played.
- **Every** unit on the card can be placed now:
  - Corps go to the Reserve Box.
  - Armies go to a friendly-controlled, supplied, unbesieged capital or home supply source with stacking room: London; Paris, or Orleans if Paris is full; Berlin, Essen or Breslau; Vienna or Budapest; Rome; Petrograd, Moscow, Kharkov or Caucasus; Constantinople.
  - US armies go to a friendly, unbesieged French port.

The engine does **not** check that all units can be placed. The bot must.

Abbreviations: AR = action round; WS = own War Status; CWS = Combined War Status; RU VP = Current CP Russian VP marker (Russian VP spaces held by CP); MO = Mandated Offensive; LW / TW = Limited / Total War commitment. Flags: `*` = removed when played as event, `CC` = combat card, `+OPS` = event also gives the card's OPS. Turn calendar used by the engine: 1914 = turns 1-3, then four turns a year with Winter first (Winter = 4, 8, 12, 16, 20; Spring = 5, 9, 13, 17; Summer = 6, 10, 14, 18; Fall = 3, 7, 11, 15, 19).

## Key thresholds (War Status pacing)

| Threshold | Effect | Who benefits |
|---|---|---|
| Own WS >= 4 at a War Status Phase (turn 2+) | Limited War cards shuffled in; for CP, **Turkey enters** | Both; CP gets Turkey, Bulgaria, Rathenau; AP gets Italy, Romania |
| Own WS >= 11 | Total War cards shuffled in | CP: H-L, Fall of the Tsar, Bolshevik, Brest-Litovsk, 1918 offensives; AP: Zimmermann, Over There, US armies, Convoy |
| AP at TW with Italy neutral | +1 VP to CP every War Status Phase | CP |
| CP at TW and AP not | AP may use Italy/Romania only as events (or discard them) | CP |
| CWS >= 30 | Zimmermann Telegram legal (then Over There next turn, then US reinforcements) | AP |
| Tsar Takes Command played and CWS + RU VP >= 33 | Fall of the Tsar legal | CP |
| CWS >= 40 at a War Status Phase | Armistice: game ends on VP (CP wins at 13+, or 11+ after Brest-Litovsk; AP wins all draws) | Whoever leads on VP |
| End of game (Armistice or turn 20) | CP +1 VP per US army card (AP 43, 47) not played as event; -2 VP if Fall of the Tsar never played | AP for 43/47; CP for Fall of the Tsar |

## General principles

1. **Play reinforcements early.** Armies are the scarcest asset. An army reinforcement event puts an army on the map for one action, and the card then leaves the deck.
   - Play army cards in the first AR where the R-check passes and there is no emergency.
   - Order: two-army cards, then army + corps, then single army, then corps-only cards.
   - Only one reinforcement card per nation per turn, so a corps-only card used early can block an army card for that nation.
2. **Bank the free VP before the window shuts.**
   - AP: Blockade as early as possible (up to -5 VP over the game). Rape of Belgium before AP reaches Limited War. Lusitania before Zimmermann. 14 Points and Convoy when legal.
   - CP: Reichstag Truce before CP Total War. War in Africa, High Seas Fleet, and Fall of the Tsar the moment it is legal.
3. **WS pacing.**
   - Early on, both sides want Limited War quickly. AP gets there with Blockade + Rape of Belgium (4). CP gets there with Guns of August + Reichstag Truce + Oberost (4), and Falkenhayn adds 2.
   - Mid-game, CP wants Total War (most Russian-collapse cards are TW) and wants Fall of the Tsar before the US arrives. AP wants Italy in before it reaches Total War.
   - WS events by either side bring **both** US entry (CWS 30) and the Fall of the Tsar threshold (CWS + RU VP 33) closer.
   - AP: once Tsar Takes Command is played, avoid non-VP WS events (Brusilov, Great Retreat, Greece, Salonika, Independent Air Force) that would push CWS + RU VP to 33, unless the event wins more than it gives away. Zimmermann is still worth it.
   - Late game: when CWS >= 34, the side behind on VP should lower the priority of its non-VP WS events by 3 and play them for OPS. The side ahead should play WS events to force the armistice.
4. **Event plus OPS cards.** For the +OPS cards, playing the event costs nothing over playing for OPS, and it removes the card from the deck.
5. **Thin the deck.** Events with `*` leave the deck, so the 4-5 OPS cards come up more often. In slack ARs, prefer playing weak 2-OP cards as events (Oberost, Cloak and Dagger, Mata Hari, Hoffmann) over using them as 2 OPS.
6. **Neutral entry is one per turn for both sides combined.** Turkey entering at CP Limited War does not count.
   - Play neutral entries early in a turn to deny the opponent theirs. CP Bulgaria in AR 1 blocks Italy that turn, and vice versa.
   - Romania is dead once Fall of the Tsar is played, and its absence then costs AP 2 VP.
7. **Combat cards.**
   - The attacker plays CCs first, then the defender. Cards without `*` that win stay face up for the rest of the turn and can help once per AR. Cards with `*` and once-per-turn cards are discarded after use.
   - Reserve +1 cards for the battles that matter: VP spaces, army destruction, forts, and MO attacks.
   - Trench-negating CCs (Michael, Blucher, Peace Offensive, Von Below, Von Hutier, Royal Tank Corps) are the CP's main 1917-18 offensive tools. Do not spend them as OPS.
8. **Track the prerequisite chains** (an event becomes legal or dead when its partner is played):
   - Guns of August -> Rape of Belgium (while AP at Mobilization).
   - Blockade -> Lusitania (before Zimmermann).
   - Moltke / Falkenhayn -> Place of Execution (before H-L).
   - Landships -> Royal Tank Corps.
   - Sinai Pipeline -> Allenby at Alexandria.
   - Turkey at war -> MEF, ANA, Yudenitch, Libyan Revolt, TU reinforcements.
   - Italy -> Italian reinforcements.
   - Tsar Takes Command -> Fall of the Tsar -> Bolshevik -> Brest-Litovsk. Fall of the Tsar also opens Kerensky (until Bolshevik) and closes Romania.
   - CWS 30 -> Zimmermann -> (next turn) Over There -> US reinforcements, and Zimmermann -> 14 Points.
   - H-L -> Michael, Blucher, Peace Offensive, Hoffmann, U-Boats. U-Boats -> Convoy.
   - Michael / Blucher / Peace Offensive -> Everyone Into Battle, and they end Lloyd George.
   - High Seas Fleet -> Grand Fleet (the very next AP action only).
   - Rathenau <-> Independent Air Force.
9. **Mandated Offensives come first.** Never spend the only card that can pay for a required MO attack on a priority 7 or lower event in the same AR.
10. **Historical scenario specifics:**
    - 8-card hands (5.7.4.1).
    - Entrench may not be played on turn 1 (the engine enforces this).
    - Until AP Total War, only AH and IT armies may operate in Italy (5.7.4.6).
    - CP gets a bonus GE RP at Total War if it holds Sedan plus two more French or Belgian spaces (5.7.3).

## Traps for a bot

- **Expiring windows:**
  - Moltke after turn 2.
  - Rape of Belgium once AP is at Limited War.
  - Reichstag Truce once CP is at Total War.
  - Putnik after turn 7.
  - Lusitania after Zimmermann.
  - Romania after Fall of the Tsar.
  - Kerensky after Bolshevik.
  - Place of Execution after H-L.
  - Lloyd George after Michael, Blucher or Peace Offensive.
  - Grand Fleet outside the one AR straight after High Seas Fleet.
  - Tsar Takes Command if RU VP drops back below 3.
- **The second Entrench card** can never be an event. Once either Entrench is played, the other is OPS/SR/RP only.
- **Race to the Sea** is moot once CP WS reaches 4. Oberost's fort unlock is also moot then, though its WS still counts.
- **Reinforcements that cannot be fully placed.** The rules forbid playing them; the engine allows it and silently skips the units.
- **Corps-only cards** (AP 8, 20, 38, 41; CP 38, 39) burn the nation's one reinforcement slot for the turn. Hold them while an army card for the same nation is playable.
- **Salonika** counts as an SR play: it is illegal right after an SR action (9.3.3), and the engine does not check this.
- **MEF at Gallipoli** costs 3 OPS per activation and is easily isolated. Default to London.
- **Peace Offensive** costs 1 VP if the attacker fails to advance into the space.
- **Great Retreat** can hand Russian VP spaces to CP and feed Tsar Takes Command, Fall of the Tsar and Bolshevik.
- **Brest-Litovsk too early.** After it, CP can no longer attack RU units (except TU in the Near East) to take more Russian VP.
- **U-Boats and other CP WS cards** push CWS toward 30, the Zimmermann threshold. AP WS cards push toward the Fall of the Tsar threshold.
- **Italy left neutral** after AP Total War costs 1 VP every turn. Italy and Romania become event-only when CP is at TW and AP is not.
- **Zeppelin Raids** played early in a turn just tells AP not to play BR RP.
- **Hoarding CCs** clogs the hand. Spending them all as OPS leaves no defense.

## Allied Powers (AP)

### Allied Powers - Mobilization cards

| # | Card | OPS/SR | WS | Flags | Class | Pri | Play as event when | Hold as CC when | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | British Reinforcements (BR 2) | 4/4 | 1 | * | reinforcement | **8** | R-check passes for BR (London AP-controlled, supplied, room for an army). Play in the first AR with no emergency. | - | Army + corps in one action, plus WS +1 toward AP Limited War. One BR reinforcement card per turn: play this or BR 1st Army first. |
| 2 | Blockade | 4/4 | 2 | * | war_status_vp | **9** | Always legal. Play at the first AR without an emergency, ideally turn 1-2 and certainly before the first Winter turn (turn 4). | - | -1 VP in every Winter War Status Phase (turns 4,8,12,16,20) after play: up to 5 VP. +2 WS. Prerequisite for Lusitania. |
| 3 | Russian Reinforcements (RU 11) | 3/4 | - | * | reinforcement | **7** | R-check passes for RU (Petrograd, Moscow, Kharkov or Caucasus AP-controlled, supplied, unbesieged, room). No two-army RU card playable instead this turn. | - | Army + corps. Only one RU reinforcement card per turn, so play the two-army cards (RU 9/10, RU 6/7) first. |
| 4 | Pleve | 2/2 | - | * CC | combat_card | **6** | In combat: a RU unit attacks or defends and the battle matters (an army at risk, a VP or fort space, or +1 likely changes the outcome). | RU units are adjacent to CP units; keep it unless it is the only card to play or its OPS are needed for a RU MO. | Removed after use, so spend it on one important battle; +1 either attacking or defending. |
| 5 | Putnik | 2/2 | - | CC | combat_card | **5** | In combat, turns 1-7 only: a SB unit (MN does not count) attacks or defends. | Turn 7 or earlier and SB units adjacent to CP units. After turn 7 discard it at end of turn or use as OPS/SR/RP. | Not removed; if the combat is won it stays face up and can help once per AR for the rest of the turn. Dead after turn 7 (Fall 1915). |
| 6 | Withdrawal | 2/2 | - | * CC | combat_card | **4** | In combat while defending: a corps step loss is required and retreating one space gives up no VP space, fort or supply line. | AP units adjacent to strong CP stacks (2+ armies) that are likely to attack this turn. | Removed after use. Negates one corps step (or an army step if no corps step) at the cost of a retreat; full-strength attackers may advance. |
| 7 | Severe Weather | 2/2 | - | CC | combat_card | **6** | In combat: CP attacks an AP-defended mountain space in Fall/Winter, or a swamp space in Spring/Fall (+2 to defender). | This turn or next is Fall/Winter and AP holds mountain spaces facing CP, or Spring/Fall and AP holds swamp spaces facing CP. | Not removed. Seasons: Fall = turns 3,7,11,15,19; Winter = 4,8,12,16,20; Spring = 5,9,13,17. No season on turns 1-2. |
| 8 | Russian Reinforcements (2 corps) | 2/2 | - | * | reinforcement | **5** | Turn 2+, no RU reinforcement played this turn, and no RU army reinforcement card in hand that is playable this turn. | - | Two corps go to the Reserve Box, so placement is always possible. Cheap 2-OP card, but it uses the turn's only RU reinforcement play. |
| 9 | Moltke | 3/4 | - | * | strategic | **8** | Turn 1 or 2 only. Play in the first AP action of turn 1 if possible. | - | CP activation in Belgium/France costs 1 OP per unit until CP spends Falkenhayn; blunts the 1914 western drive. Dead after turn 2: OPS/SR only. |
| 10 | French Reinforcements (FR 10) | 3/4 | - | * | reinforcement | **7** | R-check passes for FR (Paris AP-controlled, supplied, unbesieged with room; Orleans allowed only if Paris is full). | - | One army. One FR reinforcement card per turn. |
| 11 | Russian Reinforcements (RU 9, RU 10) | 3/4 | - | * | reinforcement | **8** | R-check passes for RU with room for TWO armies among Petrograd, Moscow, Kharkov and Caucasus. | - | Two armies for a 3-OP card; the best early RU card. Play before other RU reinforcements. |
| 12 | Entrench | 3/4 | - | * | strategic | **7** | Turn 2+; no Entrench event played yet by either side; a supplied AP army is in a front-line space adjacent to CP armies (prefer France/Belgium or a RU VP space). | - | Free level-1 trench and lets both sides entrench. Only one Entrench event per game: once either side plays it, this card is OPS/SR/RP only. |
| 13 | Rape of Belgium | 4/4 | 2 | * | war_status_vp | **9** | CP played Guns of August and AP is still at Mobilization (no Limited War cards added). Play on turn 1 or 2. | - | -1 VP, +2 WS. Becomes unplayable as an event the moment AP reaches Limited War, so never delay it. |
| 14 | British Reinforcements (BR 1) | 4/4 | 1 | * | reinforcement | **8** | R-check passes for BR (London AP-controlled, supplied, room for an army). Play in the first AR with no emergency. | - | Army + corps plus WS +1. One BR reinforcement card per turn. |

### Allied Powers - Limited War cards

| # | Card | OPS/SR | WS | Flags | Class | Pri | Play as event when | Hold as CC when | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 15 | British Reinforcements (BR 4) | 3/4 | - | * | reinforcement | **7** | R-check passes for BR (London AP-controlled, supplied, room for an army). | - | Army + corps. Play before the corps-only BR cards. |
| 16 | Romania | 5/5 | 1 | * | neutral_entry | **6** | Romania neutral, Fall of the Tsar unplayed, no neutral entry this turn, and (Tsar Takes Command played, or RU armies border Romania, or CP at TW, AP not). | - | Raise to 9 once Tsar Takes Command is played: Romania still neutral at Fall of the Tsar gives CP +2 extra VP. Adds Ploesti/Bucharest as CP VP targets. Event-only if CP at TW and AP not (9.5.2.5). |
| 17 | Italy | 5/5 | 2 | * | neutral_entry | **8** | Italy neutral and no neutral entry yet this turn. Play during AP Limited War; at the latest on the turn AP reaches Total War. | - | +2 WS. If Italy is still neutral after AP reaches TW, CP gains +1 VP every turn. Event-only if CP at TW and AP not (9.5.2.5). |
| 18 | Hurricane Barrage | 2/2 | - | CC | combat_card | **6** | In combat: a BR unit (not AUS/CND/PT/ANA) attacks. | BR units are adjacent to CP units, especially on a turn with a BR MO. | Not removed; if the attack wins, it can support further BR attacks this turn (once per AR). |
| 19 | Air Superiority | 2/2 | - | CC | combat_card | **6** | In combat: a FR or BR unit (not AUS/CND/PT/ANA) attacks. | FR or BR units are adjacent to CP units in France/Belgium. | Not removed; reusable within the turn after a won combat. |
| 20 | British Reinforcements (AUS, CND) | 2/2 | - | * | reinforcement | **5** | Turn 2+, no BR reinforcement played this turn, and no BR army reinforcement card in hand that is playable this turn. | - | Two corps to the Reserve Box; always placeable. AUS/CND do not count as BR for BR combat cards or BR MOs. |
| 21 | Phosgene Gas | 2/2 | - | * CC | combat_card | **6** | In combat: a FR unit attacks (prefer a FR MO attack or an attack on an entrenched GE space). | FR units are adjacent to CP units. | Removed after use. |
| 22 | Italian Reinforcements | 3/4 | - | * | reinforcement | **7** | Italy at war and R-check passes for IT (Rome AP-controlled, supplied, unbesieged, room). | - | One army. Unplayable as an event until Italy enters the war. |
| 23 | Cloak and Dagger | 2/2 | - | * +OPS | weak | **5** | Whenever you would play this card for OPS, play it as the event instead. | - | Event = view CP hand + 2 OPS, and the card leaves the deck (thins weak 2-OP cards). Keep it only if you need it later as SR/RP. |
| 24 | French Reinforcements (FR 7) | 3/4 | - | * | reinforcement | **7** | R-check passes for FR (Paris AP-controlled, supplied, unbesieged with room; Orleans only if Paris is full). | - | One army. One FR reinforcement card per turn. |
| 25 | Russian Reinforcements (RU 6, RU 7) | 3/4 | - | * | reinforcement | **8** | R-check passes for RU with room for TWO armies among Petrograd, Moscow, Kharkov and Caucasus. | - | Two armies + two corps; the biggest RU card. Play before other RU reinforcements. |
| 26 | Lusitania | 3/4 | 2 | * | war_status_vp | **8** | Blockade has been played and Zimmermann Telegram has not. | - | -1 VP and +2 WS (helps reach CWS 30 for Zimmermann). Dies once Zimmermann is played, so play it first. |
| 27 | Great Retreat | 3/4 | 1 | * | defensive | **4** | AR 1-2 of a turn, 2+ GE armies adjacent to RU-held spaces with encirclement or OOS risk, and retreating abandons no RU VP space. | - | Lasts the turn: attacked RU units may step back instead of fighting. +1 WS feeds the Fall of the Tsar threshold. Usually better as 3 OPS. |
| 28 | Landships | 4/4 | - | * +OPS | strategic | **7** | Whenever you would play it for OPS, play it as the event instead. | - | Yellow card: the event gives the same 4 OPS and unlocks Royal Tank Corps. Strictly better than OPS use. |
| 29 | Yudenitch (RU Reinforcements) | 4/4 | - | * | reinforcement | **6** | Turkey at war, no RU reinforcement this turn, and a supplied AP-controlled RU space on the Near East map has room. | - | Caucasus Army vs Turkey. May instead enter at a RU home supply source (9.5.3.4) but then cannot operate in the Near East. |
| 30 | Salonika | 4/4 | 1 | * | strategic | **6** | Bulgaria at war or Serbia threatened; 1+ BR/FR corps in an AP port or Reserve; previous AP action this turn not SR; Salonika usable. | - | Counts as the AR's SR (no SR in the next AR). +1 WS. After it, MEF can only enter at London. If Greece already joined, Salonika must be AP-controlled with room. |
| 31 | MEF (BR Reinforcements) | 4/4 | 1 | * | reinforcement | **5** | Turkey at war, no BR reinforcement this turn. Default: place the MEF in London; land at a MEF space only if Salonika unplayed and the target weakly held. | - | +1 WS. A MEF beachhead army costs 3 OPS to activate; Gallipoli is a poor bot gamble. London placement keeps it as a normal BR army (9.5.3.4). |
| 32 | Russian Reinforcements (RU 12) | 2/2 | - | * | reinforcement | **7** | R-check passes for RU (a RU home supply source with room); no RU reinforcement played this turn. | - | A full army for a 2-OP card: excellent value. |
| 33 | Grand Fleet | 2/2 | - | * | war_status_vp | **9** | Only in the AP action immediately after CP plays High Seas Fleet: cancels its +1 VP. | - | No other event use. Hold it while High Seas Fleet is unplayed if the hand has other good plays; otherwise a plain 2/2 card. |
| 34 | British Reinforcements (BR 3) | 3/4 | - | * | reinforcement | **7** | R-check passes for BR (London AP-controlled, supplied, room for an army). | - | Army + two corps. |

### Allied Powers - Total War cards

| # | Card | OPS/SR | WS | Flags | Class | Pri | Play as event when | Hold as CC when | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 35 | Yanks and Tanks | 4/4 | - | * +OPS | strategic | **6** | Whenever you would play it for OPS; top choice when a US unit can attack this AR (+2 to every combat involving US units). | - | Event gives the same 4 OPS plus the bonus. |
| 36 | Mine Attack | 2/2 | - | CC | combat_card | **5** | In combat: a BR unit attacks an entrenched CP space (once per turn). | BR units are adjacent to entrenched CP spaces. | Not removed; usable in only one combat per turn. |
| 37 | Independent Air Force | 2/2 | 1 | * | defensive | **8** | Always legal. Play at once if Rathenau is in effect; otherwise play when no higher event is due (pre-empts Rathenau). | - | Cancels or prevents Rathenau's +1 GE RP every turn for the rest of the game. +1 WS. |
| 38 | USA Reinforcements (1 corps) | 2/2 | - | * | reinforcement | **6** | Over There played; U-Boats Unleashed not in effect (or Convoy played); no US reinforcement this turn; no US army card playable instead. | - | One corps to the Reserve Box. Not a US army card, so no end-game VP penalty if unplayed. |
| 39 | They Shall Not Pass | 2/2 | - | CC | combat_card | **6** | In combat: CP attacks an undestroyed French fort space (Paris, Verdun, Nancy, Belfort) containing a FR unit; cancels the retreat for losing. | CP armies are adjacent to an AP-held undestroyed French fort space. | Not removed; stays face up until AP loses a combat with it, then discarded. |
| 40 | 14 Points | 2/2 | - | * | war_status_vp | **9** | Zimmermann Telegram has been played. | - | -1 VP for a 2-OP card. The Peace Terms part is moot in the Historical scenario. |
| 41 | Arab Northern Army (BR Reinforcements) | 3/4 | - | * | reinforcement | **4** | Turkey at war, no BR reinforcement this turn, and no BR army reinforcement card in hand that is playable this turn. | - | ANA corps placed in Arabia; a nuisance in the Hejaz (holds spaces without converting them). |
| 42 | British Reinforcements (BR 5) | 3/4 | - | * | reinforcement | **7** | R-check passes for BR (London AP-controlled, supplied, room for an army). | - | Army + BR corps + PT corps. |
| 43 | USA Reinforcements (US 1) | 3/4 | - | * | reinforcement | **9** | Over There played; U-Boats Unleashed not in effect (or Convoy played); no US reinforcement this turn; an AP-controlled unbesieged French port has room. | - | Each US army card not played as an event by game end gives CP +1 VP (5.7.4.8). Army + two corps. |
| 44 | Greece | 3/4 | 1 | * | neutral_entry | **5** | Greece neutral, no neutral entry yet this turn, and Bulgaria at war or AP units already at Salonika. | - | +1 WS. Greek units become active; does not block Salonika or MEF. |
| 45 | Kerensky Offensive | 3/4 | - | * +OPS | strategic | **7** | Fall of the Tsar played and Bolshevik Revolution not. Play instead of OPS, best when a RU unit can attack a space with AH, BU or TU units. | - | Event gives the same 3 OPS plus +2 for one such RU attack (announce before CP combat cards). Window closes at Bolshevik Revolution. |
| 46 | Brusilov Offensive | 4/4 | 2 | * +OPS | strategic | **6** | Play instead of OPS when RU units will attack this AR, best against AH-only entrenched spaces. | - | Event = 4 OPS, +1 to all RU attacks this AR, trench negation for one attack vs non-GE. +2 WS: avoid if Tsar Takes Command played and CWS + RU VP would reach 33. |
| 47 | USA Reinforcements (US 2) | 4/4 | - | * | reinforcement | **9** | Over There played; U-Boats Unleashed not in effect (or Convoy played); no US reinforcement this turn; an AP-controlled unbesieged French port has room. | - | Each US army card not played as an event by game end gives CP +1 VP (5.7.4.8). Army + corps. |
| 48 | Royal Tank Corps | 4/4 | - | CC | combat_card | **6** | In combat (Landships played): a BR unit attacks an entrenched clear-terrain space in France, Belgium or Germany (once per turn). | Landships played and BR units face entrenched clear-terrain CP spaces in the west. | Not removed. Cancels the trench column shift only (not flank or retreat effects). No CC use before Landships. |
| 49 | Sinai Pipeline | 4/4 | - | * | strategic | **5** | Turkey at war and either Allenby is in hand (play Pipeline first) or BR units will attack across the Sinai. | - | Removes the -3 Sinai drm for Allied units and lets Allenby enter at Alexandria. |
| 50 | Allenby (BR Reinforcements) | 4/4 | 1 | * | reinforcement | **7** | No BR reinforcement this turn. With Sinai Pipeline played, place in Alexandria (AP-controlled, room); otherwise place in London as a normal army. | - | +1 WS. London placement is always allowed (9.5.3.4) but the army then cannot operate in the Near East. |
| 51 | Everyone Into Battle | 4/4 | 1 | * | strategic | **5** | Legal (Michael, Blucher or Peace Offensive played), AR 1-3, and 2+ mixed-nationality AP stacks in France/Belgium/Italy will attack this turn. | - | No OPS with the event: it only makes each such stack cost 1 OP for the rest of the turn. +1 WS. |
| 52 | Convoy | 4/4 | - | * | war_status_vp | **9** | U-Boats Unleashed has been played. | - | -1 VP and cancels U-Boats (restores BR RP and US reinforcements). |
| 53 | Army of the Orient (FR Reinforcements) | 5/5 | - | * | reinforcement | **6** | No FR reinforcement this turn and Salonika AP-controlled with room (preferred) or Paris has room. | - | 5-OP card: if a big OPS turn is needed, OPS may be worth more. In Paris the army cannot go to Salonika later. |
| 54 | Zimmermann Telegram | 5/5 | 2 | * +OPS | strategic | **9** | CWS is 30 or more (US Entry marker in Zimmermann Allowed box). Play immediately; the event also gives 5 OPS. | - | -1 VP, +2 WS, starts US entry, ends Lusitania. Warning: +2 CWS may unlock Fall of the Tsar if Tsar Takes Command is played. |
| 55 | Over There | 5/5 | - | * +OPS | strategic | **9** | Zimmermann Telegram was played on an earlier turn. Play immediately; the event also gives 5 OPS. | - | US enters fully: US reinforcements allowed and every AP RP card adds 1 US RP. |

## Central Powers (CP)

### Central Powers - Mobilization cards

| # | Card | OPS/SR | WS | Flags | Class | Pri | Play as event when | Hold as CC when | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Guns of August | 3/4 | 2 | * | strategic | **9** | Mandatory: CP turn 1, action round 1 (Historical rule 5.7.4.3). Legal at no other time. | - | +2 WS. Destroys Liege, puts GE 1st/2nd Armies there and activates GE 1st/2nd/3rd for combat. Enables AP Rape of Belgium. |
| 2 | Wireless Intercepts | 2/2 | - | * CC | combat_card | **6** | In combat, flank step: GE units attack a space holding only RU units from 2+ spaces with an army, defender not in trench/swamp/mountain; flank succeeds automatically. | GE armies are adjacent to RU units in open (non-trench) terrain. | Removed after use. Engine only checks that the target space contains RU units; follow the card text (only RU units). |
| 3 | Von Francois | 2/2 | - | CC | combat_card | **6** | In combat: a GE unit attacks a space containing RU units. | GE units are adjacent to RU units. | Not removed; reusable within the turn after a won combat. |
| 4 | Severe Weather | 2/2 | - | CC | combat_card | **6** | In combat: AP attacks a CP-defended mountain space in Fall/Winter, or a swamp space in Spring/Fall (+2 to defender). | This turn or next is Fall/Winter and CP holds mountain spaces facing AP, or Spring/Fall and CP holds swamp spaces facing AP. | Not removed. Fall = turns 3,7,11,15,19; Winter = 4,8,12,16,20; Spring = 5,9,13,17. |
| 5 | Landwehr | 2/2 | - | * | strategic | **7** | Berlin CP-controlled and supplied, and reduced GE units worth 2+ RP (army 1, corps 1/2) are supplied or in the Reserve Box. | - | Two free GE RP to flip reduced units (not rebuild eliminated ones): better than the card's 1 GE RP. Otherwise use as OPS. |
| 6 | Entrench | 3/4 | - | * | strategic | **6** | Turn 2+; no Entrench event played yet by either side; a supplied CP army is in a front-line space adjacent to 2+ enemy armies (prefer a VP space). | - | Free level-1 trench and lets both sides entrench. Only one Entrench event per game. |
| 7 | German Reinforcements (GE 9) | 3/4 | - | * | reinforcement | **8** | R-check passes for GE (Berlin, Essen or Breslau CP-controlled, supplied, unbesieged, room for an army). | - | One army. One GE reinforcement card per turn: play multi-army GE cards first. |
| 8 | Race to the Sea | 3/4 | - | * | weak | **3** | CP WS below 4 and a GE unit could end its move in Ostend, Calais or Amiens this turn; otherwise event only to cull the deck. | - | Restriction lifts automatically at CP WS 4, so the event is usually moot after turn 2. |
| 9 | Reichstag Truce | 4/4 | 1 | * | war_status_vp | **9** | CP not yet at Total War. Play early (turn 1-2 ideal). | - | +1 VP and +1 WS toward Limited War (Turkey enters at CP LW). Dies when CP reaches TW. |
| 10 | SUD Army | 3/4 | - | * | weak | **4** | An AH unit is (or will be) stacked with GE corps on an active front and the action can be spared. | - | Permanent: one AH unit + up to 2 GE corps activate for 1 OP, chosen each AR. Moltke overrides it in BE/FR. |
| 11 | Oberost | 2/2 | 1 | * | strategic | **7** | Always legal. Play soon while CP WS is below 4 and GE units face RU fort spaces; later still worth it for +1 WS. | - | Lets GE units attack RU fort spaces before CP WS 4. +1 WS toward LW/TW on a 2-OP card. |
| 12 | German Reinforcements (GE 10) | 4/4 | - | * | reinforcement | **8** | R-check passes for GE (Berlin, Essen or Breslau CP-controlled, supplied, unbesieged, room for an army). | - | Army + two corps. |
| 13 | Falkenhayn | 4/4 | 2 | * | strategic | **7** | Turn 3+, or Moltke has been played (then priority 9: play at once). | - | +2 WS toward LW/TW; cancels Moltke; prerequisite for Place of Execution. |
| 14 | Austria-Hungary Reinforcements (AH 7) | 4/4 | - | * | reinforcement | **8** | R-check passes for AH (Vienna or Budapest CP-controlled, supplied, unbesieged, room for an army). | - | Army + two corps. |

### Central Powers - Limited War cards

| # | Card | OPS/SR | WS | Flags | Class | Pri | Play as event when | Hold as CC when | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 15 | Chlorine Gas | 2/2 | - | * CC | combat_card | **6** | In combat: a GE unit attacks a key target (VP space, an army, entrenched space, or a GE MO attack). | GE units are adjacent to AP units. | Removed after use. |
| 16 | Liman Von Sanders | 2/2 | - | * CC | combat_card | **6** | In combat: a TU unit (not SN) attacks or defends. | Turkey at war and TU units are adjacent to AP units. | Removed after use. |
| 17 | Mata Hari | 2/2 | - | * +OPS | weak | **5** | Whenever you would play this card for OPS, play it as the event instead. | - | Event = view AP hand + 2 OPS, and the card leaves the deck. |
| 18 | Fortified Machine Guns | 2/2 | - | CC | combat_card | **6** | In combat: AP attacks an entrenched space defended by GE units. | GE units sit in trenches adjacent to AP units. | Not removed; reusable within the turn after a won defense. |
| 19 | Flamethrowers | 2/2 | - | * CC | combat_card | **6** | In combat: a GE unit attacks a key target (VP space, an army, entrenched space, or a GE MO attack). | GE units are adjacent to AP units. | Removed after use. |
| 20 | Austria-Hungary Reinforcements (AH 10) | 3/4 | - | * | reinforcement | **7** | R-check passes for AH (Vienna or Budapest CP-controlled, supplied, unbesieged, room for an army). | - | One army. |
| 21 | German Reinforcements (GE 11) | 3/4 | - | * | reinforcement | **8** | R-check passes for GE (Berlin, Essen or Breslau CP-controlled, supplied, unbesieged, room for an army). | - | Army + corps. 11th Army pairs with the 11th Army event. |
| 22 | German Reinforcements (GE 12) | 3/4 | - | * | reinforcement | **8** | R-check passes for GE (Berlin, Essen or Breslau CP-controlled, supplied, unbesieged, room for an army). | - | Army + corps. |
| 23 | Austria-Hungary Reinforcements (AH 11) | 3/4 | - | * | reinforcement | **7** | R-check passes for AH (Vienna or Budapest CP-controlled, supplied, unbesieged, room for an army). | - | One army. |
| 24 | Libyan Revolt (TU Reinforcements) | 3/4 | - | * | reinforcement | **5** | Turkey at war, no Allied units in Libya, and no TU reinforcement this turn. | - | SN corps in Libya threatens Egypt and diverts BR units; spaces it converts are checked for attrition. |
| 25 | High Seas Fleet | 4/4 | - | * | war_status_vp | **8** | Always legal. Best when AP cannot answer: AP still at Mobilization (Grand Fleet not in its deck) or Grand Fleet already played. | - | +1 VP unless AP plays Grand Fleet as its very next action. |
| 26 | Place of Execution | 4/4 | 1 | * CC | combat_card | **6** | In combat (Falkenhayn played, H-L not): GE attack on an undestroyed French fort space (Paris, Verdun, Nancy, Belfort) gets +2. Action event only once all FR forts destroyed. | Falkenhayn played, H-L not played, and GE armies adjacent to an undestroyed French fort space. | Removed after use, +1 WS. Dead once H-L Take Command is played. |
| 27 | Zeppelin Raids | 4/4 | 1 | * | strategic | **6** | AP's BR RP marker already shows 2+ this turn (raid removes 4 at the Replacement Phase); otherwise only in AR 5-6 for +1 WS. | - | Hurts only this turn's BR RP; AP will avoid BR RP plays after seeing it, so time it late in the turn. |
| 28 | Tsar Takes Command | 4/4 | 1 | * +OPS | strategic | **9** | CP controls 3+ Russian VP spaces (Capitulation marker in Tsar Takes Command Allowed). Play immediately; the event also gives 4 OPS. | - | +1 WS; first step of Russian collapse. If RU VP drops below 3 before play, the window closes. |
| 29 | 11th Army | 2/2 | - | * | weak | **4** | GE 11th Army is on the map next to CP corps of other nations and the action can be spared; or late in the game to cull the deck. | - | Permanent: GE 11th Army plus CP corps activate as one stack. Moltke overrides it in BE/FR. |
| 30 | Alpenkorps | 2/2 | - | CC | combat_card | **5** | In combat: a GE unit attacks into or out of a mountain space. | GE units are adjacent to AP units across mountain terrain (Italy, Balkans, Carpathians). | Not removed; reusable within the turn after a won combat. |
| 31 | Kemal | 3/4 | - | CC | combat_card | **6** | In combat: AP attacks a space defended by a TU unit with CF 1+ (not SN); the defender fires on the Army table (once per turn). | Turkey at war and AP units are adjacent to TU-defended spaces. | Not removed; usable in only one combat per turn. |
| 32 | War in Africa | 3/4 | 1 | * | war_status_vp | **8** | Always legal. Play early in CP Limited War. | - | +1 WS; AP must permanently remove a BR corps (not ANA/AUS/CND/BEF/PT) or give CP +1 VP. |
| 33 | Walter Rathenau | 5/5 | 2 | * | strategic | **8** | Independent Air Force not played: play as soon as possible. If IAF already played, only for +2 WS (treat as priority 3). | - | +1 GE RP every turn for the rest of the game; the earlier, the more RP. +2 WS. |
| 34 | Bulgaria | 5/5 | 2 | * | neutral_entry | **8** | Bulgaria neutral and no neutral entry yet this turn; best early in a turn while Serbia is still fighting. | - | +2 WS. Bulgarian corps crush Serbia; playing it also blocks AP's Italy/Romania/Greece entry that turn. |

### Central Powers - Total War cards

| # | Card | OPS/SR | WS | Flags | Class | Pri | Play as event when | Hold as CC when | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 35 | Mustard Gas | 2/2 | - | * CC | combat_card | **6** | In combat: a GE unit attacks a key target (VP space, an army, entrenched space). | GE units are adjacent to AP units. | Removed after use. |
| 36 | U-Boats Unleashed | 2/2 | 2 | * | strategic | **6** | H-L Take Command played; best once Zimmermann or Over There is played (blocks US reinforcements until Convoy). | - | -1 BR RP each turn; +2 WS speeds US entry and armistice. AP's Convoy cancels it for -1 VP. |
| 37 | Hoffmann | 2/2 | 1 | * | strategic | **6** | H-L Take Command played and the action can be spared. | - | +1 to all future CP MO rolls (fewer forced attacks) and +1 WS on a 2-OP card. |
| 38 | German Reinforcements (2 corps) | 2/2 | - | * | reinforcement | **5** | Turn 2+, no GE reinforcement this turn, and no GE army reinforcement card in hand that is playable this turn. | - | Two corps to the Reserve Box; always placeable. |
| 39 | German Reinforcements (2 corps) | 2/2 | - | * | reinforcement | **5** | Turn 2+, no GE reinforcement this turn, and no GE army reinforcement card in hand that is playable this turn. | - | Two corps to the Reserve Box; always placeable. |
| 40 | Air Superiority | 3/4 | - | CC | combat_card | **6** | In combat: a GE unit attacks. | GE units are adjacent to AP units. | Not removed; reusable within the turn after a won combat. |
| 41 | German Reinforcements (GE 14) | 3/4 | - | * | reinforcement | **8** | R-check passes for GE (Berlin, Essen or Breslau CP-controlled, supplied, unbesieged, room for an army). | - | One army. |
| 42 | Turkish Reinforcements (YLD) | 3/4 | - | * | reinforcement | **7** | Turkey at war; R-check passes for TU (Constantinople CP-controlled, supplied, unbesieged, room). | - | YLD army. |
| 43 | Von Below | 3/4 | - | * CC | combat_card | **7** | In combat: a GE unit attacks a space holding only IT units, best when it is entrenched (cancels all trench effects). | Italy at war and GE units are adjacent to IT-only spaces. | Removed after use. |
| 44 | Von Hutier | 3/4 | - | * CC | combat_card | **7** | In combat: a GE unit attacks a space containing RU units (attacker fires first, trench effects cancelled). | GE units are adjacent to RU-held spaces, especially entrenched or VP spaces. | Removed after use. Useless after Brest-Litovsk (no attacks on RU units). |
| 45 | Treaty of Brest Litovsk | 4/4 | 1 | * | strategic | **9** | Bolshevik Revolution played. Play at once unless GE/AH must still attack RU units to take specific Russian VP spaces. | - | +1 WS. CP victory level drops from 13 to 11; RU cannot attack and only TU may attack RU (Near East). |
| 46 | German Reinforcements (GE 17, GE 18) | 4/4 | - | * | reinforcement | **8** | R-check passes for GE with room for TWO armies among Berlin, Essen and Breslau. | - | Two armies; play before other GE reinforcements. |
| 47 | French Mutiny | 4/4 | 1 | * | strategic | **6** | Always legal; raise to 8 if this turn's AP MO is France and not yet satisfied. | - | +1 WS. French MOs become Mutiny turns: FR attacks in FR/BE/GE without US units give CP +1 VP. |
| 48 | Turkish Reinforcements (AoI) | 4/4 | - | * | reinforcement | **7** | Turkey at war; R-check passes for TU (Constantinople CP-controlled, supplied, unbesieged, room). | - | Army of Islam. |
| 49 | Michael | 4/4 | 1 | * CC | combat_card | **8** | In combat (H-L played): a major GE attack (2+ GE armies) on an entrenched or VP space; cancels trench effects and adds +1. | H-L played and GE armies face entrenched AP spaces. | Removed after use; +1 WS. Unlocks AP Everyone Into Battle and cancels Lloyd George. |
| 50 | Blucher | 4/4 | - | * CC | combat_card | **7** | In combat (H-L played): a GE attack on an entrenched space; cancels trench effects. | H-L played and GE armies face entrenched AP spaces. | Removed after use. Unlocks AP Everyone Into Battle. |
| 51 | Peace Offensive | 4/4 | - | * CC | combat_card | **6** | In combat (H-L played): a GE attack on an entrenched space that the attacker is very likely to clear and advance into. | H-L played and GE armies face entrenched AP spaces held by few units. | Removed after use. If the attacker does not advance into the space, -1 VP. Unlocks AP Everyone Into Battle. |
| 52 | Fall of the Tsar | 5/5 | - | * +OPS | strategic | **9** | Tsar Takes Command played and CWS + RU VP is 33+ (marker in Fall of the Tsar Allowed). Play immediately; the event also gives 5 OPS. | - | +1 VP (+3 if Romania still neutral); RU combat activation costs rise. If never played, -2 VP at game end (5.7.4.9). |
| 53 | Bolshevik Revolution | 5/5 | - | * +OPS | strategic | **9** | A turn after Fall of the Tsar, and RU VP exceeds the Tsar Fell marker or CP holds all 7 Russian VP spaces. Play at once; event also gives 5 OPS. | - | Max 1 RU RP per turn; RU MOs end. Unlocks Brest-Litovsk and closes AP's Kerensky window. |
| 54 | H-L Take Command | 5/5 | 2 | * | strategic | **8** | CP at Total War: play early. Delay only while Place of Execution is in hand and a French-fort attack is planned this turn. | - | +2 WS; unlocks Michael, Blucher, Peace Offensive, Hoffmann, U-Boats; current and future GE MOs become None; kills Place of Execution. |
| 55 | Lloyd George | 4/4 | - | * | defensive | **4** | This turn's AP MO is BR and unmet, the GE units facing BR are in level-2 trenches, and no Michael/Blucher/Peace Offensive played. | - | Can make the BR MO impossible (+1 VP to CP). Otherwise use for 4 OPS. |

## Engine and data notes (uncertainties)

- **Kerensky Offensive (AP 45):** `csv/cards.csv` marks it CC, but `data.js` and the printed card do not. It is treated as an event that also gives OPS, not a CC.
- **USA Reinforcements (AP 47):** `csv/cards.csv` has no `reinf_nation`; `data.js` has `us`. `data.js` was used.
- **Wireless Intercepts (CP 2):** there is no `events.wireless_intercepts` object. It is handled in the flank-attack step by `can_play_wireless_intercepts()`. The engine only checks that the target contains RU units, while the card says only RU units. The policy follows the card.
- **Place of Execution (CP 26):** `can_apply()` does not check that a GE unit is attacking (the card says a GE attack). As an action event, `can_play()` requires every French fort to be destroyed, which matches the Deluxe card.
- **Reinforcements:** the engine does not enforce the 9.5.3.1 rule that every unit must be placeable. US cards are blocked in `can_play_event()` while U-Boats is active and Convoy is not.
- **Salonika:** `can_play()` does not apply the no-consecutive-SR rule. The engine records the action as SR afterwards, so the following AR cannot be SR.
- **MEF and Allenby:** the engine checks only that Turkey is at war (MEF) and allows Allenby without Sinai Pipeline. Placement then falls back to London, which is legal under 9.5.3.4.
- **Putnik:** the engine allows it on turns 1-7, because its calendar labels Winter turns with the next year (turn 4 = Winter 1915, turn 8 = Winter 1916).
- **Rape of Belgium:** the engine also requires AP to be at Mobilization commitment, which matches the Deluxe card.
- **Turkey** enters only when CP reaches Limited War, both in the rules (16.1.3.1) and in the engine.
- **14 Points:** Peace Terms are disallowed in the Historical scenario, so the event is just -1 VP.
- **Basis for the priorities:** they are judgment calls from the rules, the VP and WS mechanics, and general PoG practice. The time-boxed web search found little card-by-card strategy (mostly rule texts and session reports), so tune the numbers by playtesting.
- **Contact proxy:** hold conditions use being adjacent to enemy units as the test for contact.

## Sources

- Local: `data.js`, `csv/cards.csv`, `rules.js` (event objects, `can_play_event`, war status phase), `info/rules.html` (Deluxe rules incl. 5.7 Historical rules, 9.5, 16), card images in `cards.2x/`.
- Web (limited value): grognard.com PoG card manifest and play-by-email session log; theplayersaid.com 'Guns of August' card article (opening use of Guns of August).
