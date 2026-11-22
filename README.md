# Paths of Glory Solo — *General Staff* bot (branch `claude-bot`)

**General Staff** is an unofficial, card-driven solo opponent for GMT Games' **Paths of Glory** (Deluxe edition, Historical scenario, standard 110 strategy cards, no optional cards). It can command **either side** through the **full campaign**. You need the physical game.

The bot plays by the same rules you do. It holds a hand of real strategy cards and uses them as Events, Operations, SR or RP, or takes the 1-OP Automatic Operation. Its choices come from an 18-card **Staff deck** — each card gives a front, a Stance (how good an attack must look), a Plan (Ops, Event or Logistics first) and a tie-break — and from fixed, printed priorities. It never looks at your hand and never rolls dice to decide what to do.

## Start here

| What | File |
|---|---|
| **Rules** (8-page booklet) | [Markdown](bot/General_Staff_Rules.md) · [PDF](print/out/rules.pdf) |
| **Staff cards**: 18 poker-size cards and backs | [PDF](print/out/staff_cards.pdf) |
| **Reference sheets**: procedure summary, Front Tables, Objectives, Edge table, Event priorities for both decks | [PDF](print/out/reference.pdf) |
| **Companion** (optional offline web page: draws Staff cards, Edge/Score calculator, lookups) | [HTML file](app/General_Staff_Companion.html) |
| **Worked example**: narrated bot decisions for the first two turns of a game | [Sample turns](bot/Sample_Turns.md) |
| **Simulation report** | [REPORT.md](sim/REPORT.md) |
| **Changes** | [CHANGELOG.md](CHANGELOG.md) |

Print the cards at 100% (US Letter), single-sided; the last sheet is backs. The reference sheets are six pages; the event lists (pages 3–6) can stay in a sleeve.

## How good is it?

General Staff was developed and tested in about **16,600 simulated full campaigns** on the open-source **Rally the Troops** rules engine. The engine is used with GMT's permission on that site and is not included here. The final version:

* is balanced against itself: in 200 self-play games, the Allies won **48%** and the Central Powers **52%**;
* beat a random player and a naive one-attack, no-events bot in **260 of 260** games;
* made only legal moves.

Bot-versus-bot strength is not the same as strength against a person; **human playtesting is the next step.** See the [report](sim/REPORT.md) for the evidence behind each design decision and the known limits. The most important limit: the Allied bot is the more reactive of the two and misses some mandated offensives.

## For developers

```sh
cd sim
./setup_engine.sh                    # fetch the rules engine (pinned commit) into ../engine
node batch.js 20 1 bot bot           # 20 bot-vs-bot games
node sample.js 7 2                   # narrated bot decisions, seed 7, turns 1-2
node final_eval.js self 100 5001     # evaluation runs; summarize with summarize.py
node ../print/build.js               # rebuild the PDFs (needs Google Chrome and pandoc)
node ../app/build_app.js             # rebuild the companion page
```

`sim/bot.js` is the reference implementation of the printed procedure. Its constructor defaults are the released rules; options that are off by default are rejected experiments kept for reproducibility. `research/event_policy.md` is the card-by-card research behind the event priorities.

GPT's earlier 1914 Tabletop Pilot and digital reference are kept in [`gpt_handoff/`](gpt_handoff/). General Staff is a new design and does not depend on them.

*Unofficial fan material, not endorsed by GMT Games. Paths of Glory is © GMT Games; designer Ted Raicer.*
