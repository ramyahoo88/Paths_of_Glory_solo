# v0.8.0 Central Powers experiments

Per-seed records behind the screening and confirmation tables in the report (*v0.8.0: Central Powers strategy*). Each file is one `ab.js cp` run: a candidate CP bot with the options in `opts` against the **v0.7.6 Allied bot** (reference commit `62a7746`, stamped in `reference`).

* `screen7001_*`: screening, seeds 7001–7200 (200 games).
* `confirm8001_*`, `confirm9001_*`, `confirm7001_*`: confirmation, 300 games each.
* `variants9001_*`: variants of the adopted pair, seeds 9001–9300.
* `determinism9001_selwest_repeat.json`: a repeat of `confirm9001_selwest`, identical game for game. Its extra `westTurns` option had no effect.

**Candidate code.** The candidates ran from a scratch copy of `sim/` (stamped `commit: null`). It was the v0.8.0 code (`c8559da`) except for the constructor defaults: the CP bot then defaulted to `edgeShift: 0` and no `campaign`, as in v0.7.6. So `opts: {}` here means the v0.7.6 CP bot.

To rerun an experiment from v0.8.0 or later, give both settings explicitly, because the defaults have changed. For example:

```sh
cd sim
node ab.js cp 300 9001 <v0.7.6-worktree>/sim '{"edgeShift":0,"campaign":null}'       # v0.7.6 CP bot ("base")
node ab.js cp 300 9001 <v0.7.6-worktree>/sim '{"edgeShift":0.75,"campaign":"west"}'  # adopted ("selwest")
```

Options:

* `edgeShift`: added to every Stance threshold.
* `campaign`: `west`, `east` or `checklist`, a front put ahead of the Staff card's front.
* `secure`: home VP spaces in contact keep a garrison and weak ones count as gaps.
* `attrPenalty`: Score penalty for attacks with no positional stake.
* `rpStep` / `rpOnly`: the rebuild step threshold and nations.
