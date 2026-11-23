| Match-up | Games | Allied wins | CP wins | Mean end turn | How games ended |
|---|---|---|---|---|---|
| Self-play (GS vs GS) | 600 | 414 (69%) | 186 (31%) | 16.7 | AP Automatic Victory 204, AP Turn Limit 153, CP Automatic Victory 135, AP Armistice Declared 57, CP Turn Limit 39, CP Armistice Declared 12 |
| GS Allies vs random CP | 20 | 20 (100%) | 0 (0%) | 5.8 | AP Automatic Victory 20 |
| GS CP vs random Allies | 20 | 0 (0%) | 20 (100%) | 4.5 | CP Automatic Victory 20 |
| GS Allies vs naive CP | 50 | 50 (100%) | 0 (0%) | 7.8 | AP Automatic Victory 50 |
| GS CP vs naive Allies | 50 | 0 (0%) | 50 (100%) | 3.8 | CP Automatic Victory 50 |

**Run health** (all games above)
| Check | Count |
|---|---|
| Games | 740 |
| Unfinished games or harness errors | 0 |
| Decision exceptions replaced by the engine's first legal action | 0 |
| Rule-violation resets (none); games affected: 0 | 0 |
| Undo of a dead-end step | 0 |
| Bot movement steps that left moving units out of supply (rules §6) | 0 |
| &nbsp;&nbsp;(baseline opponents' own steps out of supply, not bound by §6: 2) | — |
| Units moved one safe step because their planned move was abandoned | 2 |
| ... of which passed through a space they could not end in, then returned | 0 |
| Attacks called off after the final check of the selected units | 0 |
| Salonika transfers with no corps the printed rule allows (safety path) | 0 |
| Choices with no bot rule, empty handler results or rejected proposals | 0 |
| Forced acknowledgements (one legal action, no choice) | 0 |

**Self-play milestones** (median turn when reached; share of games reaching it)
| Milestone | Median turn | Games |
|---|---|---|
| CP Limited War | 2 | 100% |
| Allies Limited War | 2 | 100% |
| Turkey at war | 2 | 100% |
| Italy at war | 4 | 100% |
| Bulgaria at war | 5 | 100% |
| Romania at war | 8 | 75% |
| Greece at war | 16 | 44% |
| CP Total War | 6 | 100% |
| Allies Total War | 8 | 99% |
| Tsar Takes Command | 10 | 65% |
| Fall of the Tsar | 13 | 53% |
| Bolshevik Revolution | 17 | 20% |
| Brest Litovsk | 17 | 18% |
| USA at war | 15 | 68% |

**Self-play bot activity per game** (mean)
| Measure | Allied bot | CP bot |
|---|---|---|
| Action rounds | 100.1 | 100.1 |
| Events played | 31.7 | 28.5 |
| Operations | 48.4 | 56.6 |
| …of which 1-OP Automatic | 0.1 | 0.3 |
| SR plays | 3.9 | 5.3 |
| RP plays | 16.0 | 9.6 |
| Attacks | 44.7 | 71.4 |
| Advances after combat | 21.8 | 30.4 |
| Edge/Score calculations | 276.8 | 267.9 |
| Mandated offensives missed | 2.33 | 0.93 |
| Edge/Score calculations per action round | 2.77 | 2.68 |

**Which step decided the action round** (share of bot action rounds, self-play)
| Step | Allied bot | CP bot |
|---|---|---|
| Crisis | 31.6% | 32.1% |
| Urgent event | 25.1% | 21.7% |
| Plan ops:play_ops | 7.8% | 17.2% |
| Plan log:play_rps | 4.1% | 9.6% |
| Plan event:play_event | 6.5% | 5.6% |
| Rebuild | 11.9% | 0.0% |
| Mandated Offensive | 6.0% | 4.8% |
| Plan log:play_sr | 3.9% | 5.3% |
| Mandated Offensive (last chance) | 2.1% | 1.7% |
| Fallback | 0.9% | 0.8% |
| Forced play | 0.1% | 1.0% |
| Plan ops:single_op | 0.0% | 0.2% |

**Self-play mean VP at the start of each turn** (games still running)
| Turn | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Mean VP | 10.2 | 10.7 | 10.8 | 9.7 | 9.8 | 10.2 | 10.9 | 10.4 | 10.5 | 10.2 | 9.6 | 8.9 | 8.9 | 8.7 | 8.7 | 8.3 | 8.4 | 8.7 | 8.3 |
| Games | 600 | 600 | 599 | 599 | 598 | 597 | 590 | 582 | 573 | 549 | 529 | 494 | 468 | 439 | 403 | 348 | 321 | 278 | 239 |
