# Paths of Glory Solo — *General Staff* bot (branch `claude-bot`)

**General Staff** is an unofficial, card-driven solo opponent for GMT Games' **Paths of Glory** (Deluxe edition, Historical scenario, standard 110 strategy cards, no optional cards). It can command **either side** through the **full campaign**. You need the physical game.

The bot plays by the same rules you do. It holds a hand of real strategy cards and uses them as Events, Operations, SR or RP, or takes the 1-OP Automatic Operation. Its choices come from an 18-card **Staff deck** — each card gives a front, a Stance (how good an attack must look), a Plan (Ops, Event or Logistics first) and a tie-break — and from fixed, printed priorities. It never looks at your hand and never rolls dice to decide what to do.

## Start here

| What | File |
|---|---|
| **Rules** (booklet) | [Markdown](bot/General_Staff_Rules.md) · [PDF](print/out/rules.pdf) |
| **Staff cards**: 18 poker-size cards and backs | [PDF](print/out/staff_cards.pdf) |
| **Reference sheets**: procedure summary, Front Tables, Objectives, Edge table, Event priorities for both decks | [PDF](print/out/reference.pdf) |
| **Companion** (optional offline web page: draws Staff cards, Edge/Score calculator, turn/round/MO tracker, lookups, session export/import) | [HTML file](app/General_Staff_Companion.html) |
| **Worked example**: narrated bot decisions for the first two turns of a game | [Sample turns](bot/Sample_Turns.md) |
| **Simulation report** | [REPORT.md](sim/REPORT.md) |
| **Changes** | [CHANGELOG.md](CHANGELOG.md) |
| **Independent reviews** and responses: v0.7.1 review, v0.7.2 re-audit, v0.7.2 comprehensive audit, v0.7.3 re-audit, v0.7.4 and v0.7.5 verifications, v0.7.5 comprehensive audit | [audits/](audits/) |
| **Seed-level results** behind the report's tables | [sim/results/](sim/results/) |

Print the cards at 100% (actual size) on US Letter: six cards per page, each face page followed by a page of backs. Print double-sided (flip on long edge) for backed cards, or print only the odd pages for faces alone. `python3 print/check_print.py` checks that no card is split across pages. The reference sheets are seven pages: procedure, tables, a record sheet, and the event lists (which can stay in a sleeve).

## How good is it?

General Staff was developed and tested in about **50,000 simulated full campaigns** on the open-source **Rally the Troops** rules engine. The engine is used with GMT's permission on that site and is not included here. The final version:

* plays both sides strongly: against the earlier v0.7 bots, the current version (v0.8.0) wins **92–94%** as the Allies and **74%** as the Central Powers. v0.8.0 made the Central Powers bot stronger: it now always puts the West first and attacks more selectively. In 600 strict self-play games the Allied bot won **69%** and the Central Powers bot **31%** (v0.7.6: 85% / 15%). There were no exceptions, no rule-violation resets, no bot movement out of supply and no choice left to the engine's default. Every figure has per-seed, commit-stamped records in [sim/results/v0.8.0](sim/results/v0.8.0/) (the Allied paired figures are from [v0.7.6](sim/results/v0.7.6/); the Allied bot did not change);
* beat a random player and a naive one-attack, no-events bot in every test game (**1,240 of 1,240** across v0.7 to v0.8.0);
* made only legal moves, and plays a recognisable war: Russia usually collapses in 1917 and the USA enters in most games;
* has an optional difficulty handicap (starting VP), worth six to eight points of win rate per VP in bot-versus-bot play.

Bot-versus-bot strength is not the same as strength against a person; **human playtesting is the next step.** See the [report](sim/REPORT.md) for the evidence behind each design decision and the known limits. The Allied bot is still the stronger of the two, so for the hardest game give the bot the Allies. Against the Central Powers bot, add VP in its favour if it proves too easy. In bot-versus-bot play each VP is worth six to eight points, and about three VP evens the game (see the report's handicap table). The main known weakness is that both bots, and especially the Allies, miss some mandated offensives.

## For developers

```sh
cd sim
./setup_engine.sh                    # fetch the rules engine (pinned commit) into ../engine
node batch.js 20 1 bot bot           # 20 bot-vs-bot games
node sample.js 7 2                   # narrated bot decisions, seed 7, turns 1-2
STRICT=1 node final_eval.js self 100 5001 > /tmp/ev/self_a.json   # strict evaluation runs
python3 summarize.py /tmp/ev                # results and run-health table
node tests/multinational.js          # attack-group regression (GS-14)
node tests/event_choices.js          # event-choice regressions (Salonika, War in Africa, Ties)
node tests/siege.js                  # units leaving a siege keep a legal besieging force
node tests/movement.js               # no step out of supply; corps gather to besiege
node tests/priorities.js             # Tie and front order, Brusilov choice
node ../print/build.js               # rebuild the PDFs (needs Google Chrome and pandoc)
python3 ../print/check_print.py      # every Staff card whole on one page
node ../app/build_app.js             # rebuild the companion page
node ../app/test_companion.cjs       # companion regression tests (no browser)
```

`sim/bot.js` is the reference implementation of the printed procedure. Its constructor defaults are the released rules; options that are off by default are rejected experiments kept for reproducibility. `research/event_policy.md` is the card-by-card research behind the event priorities.

GPT's earlier 1914 Tabletop Pilot and digital reference are kept in [`gpt_handoff/`](gpt_handoff/). General Staff is a new design and does not depend on them.

*Unofficial fan material, not endorsed by GMT Games. Paths of Glory is © GMT Games; designer Ted Raicer.*
