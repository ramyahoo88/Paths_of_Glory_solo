# Paths of Glory Solo — *General Staff* bot (branch `claude-bot`)

**General Staff** is an unofficial, card-driven solo opponent for GMT Games' **Paths of Glory** (Deluxe edition, Historical/Campaign game, standard 110 strategy cards, no optional cards). It can command **either side** for the **full campaign**. You need the physical game.

The bot plays by the same rules you do. It holds a hand of real strategy cards and uses them as Events, Operations, SR or RP, or takes the 1-OP Automatic Operation. Its choices come from an 18-card **Staff deck** (front, stance, plan, tie-break) and fixed, printed priorities. It never looks at your hand and never rolls dice to decide what to do.

| What | File |
|---|---|
| Rules (read this first) | [`bot/General_Staff_Rules.md`](bot/General_Staff_Rules.md) |
| Print-and-play: Staff cards (18 + backs) | [`print/out/staff_cards.pdf`](print/out/staff_cards.pdf) |
| Print-and-play: reference sheets (procedure, Front Tables, Objectives, Edge table, Event priorities) | [`print/out/reference.pdf`](print/out/reference.pdf) |
| Optional offline companion (draws Staff cards, Edge calculator, lookups) | [`app/General_Staff_Companion.html`](app/General_Staff_Companion.html) |
| Worked example: narrated bot turns | [`bot/Sample_Turns.md`](bot/Sample_Turns.md) |
| Simulation report | [`sim/REPORT.md`](sim/REPORT.md) |
| Card-by-card event research | [`research/event_policy.md`](research/event_policy.md) |
| Simulation harness (Node.js) | [`sim/`](sim/) |

GPT's earlier 1914 Tabletop Pilot and digital reference are on `main` in [`gpt_handoff/`](https://github.com/ramyahoo88/Paths_of_Glory_solo/tree/main/gpt_handoff). General Staff is a new design and does not depend on them.

## How it was tested

The bot was developed against a full rules engine: the open-source **Rally the Troops** implementation of *Paths of Glory* (used with GMT's permission on that site). The harness drives the engine with the bot's printed procedure, so every bot decision is a legal move under the real rules. The engine is **not** included here; `sim/setup_engine.sh` fetches it from GitHub at a pinned commit and adds a small read-only hook.

```sh
cd sim
./setup_engine.sh                 # fetch the engine into ../engine
node batch.js 20 1 bot bot        # 20 bot-vs-bot games
node sample.js 7 2 > turns.md     # narrated bot decisions for turns 1-2 of seed 7
node ../print/build.js            # rebuild the print PDFs (needs Google Chrome)
node ../app/build_app.js          # rebuild the companion app
```

See [`sim/REPORT.md`](sim/REPORT.md) for the methods, results and known limits. In short: thousands of simulated full campaigns were used to choose between design alternatives, and the bot was checked against a random player and a simplified "one attack, no events" baseline. Simulated strength against another bot is not the same as strength against a person; **human playtesting is the next step**.

## Status

Playtest draft. Feedback from real games is the most valuable next input — especially about admin time per bot turn, any rule the procedure leaves unclear, and positions where the bot did something no sensible player would do.
