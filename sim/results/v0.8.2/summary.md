| Match-up | Games | Allied wins | CP wins | Mean end turn | How games ended |
|---|---|---|---|---|---|
| Self-play (GS vs GS) | 600 | 439 (73%) | 161 (27%) | 16.4 | AP Automatic Victory 242, AP Turn Limit 133, CP Automatic Victory 112, AP Armistice Declared 64, CP Turn Limit 39, CP Armistice Declared 10 |
| GS Allies vs random CP | 20 | 20 (100%) | 0 (0%) | 6.2 | AP Automatic Victory 20 |
| GS CP vs random Allies | 20 | 0 (0%) | 20 (100%) | 4.0 | CP Automatic Victory 20 |
| GS Allies vs naive CP | 50 | 50 (100%) | 0 (0%) | 7.6 | AP Automatic Victory 50 |
| GS CP vs naive Allies | 50 | 0 (0%) | 50 (100%) | 3.9 | CP Automatic Victory 50 |

**Run health** (all games above)
| Check | Count |
|---|---|
| Games | 740 |
| Unfinished games or harness errors | 0 |
| Decision exceptions replaced by the engine's first legal action | 0 |
| Rule-violation resets (none); games affected: 0 | 0 |
| Undo of a dead-end step | 0 |
| Bot movement steps that left moving units out of supply (rules §6) | 0 |
| &nbsp;&nbsp;(baseline opponents' own steps out of supply, not bound by §6: 1) | — |
| Units moved one safe step because their planned move was abandoned | 0 |
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
| Italy at war | 5 | 100% |
| Bulgaria at war | 5 | 100% |
| Romania at war | 8 | 72% |
| Greece at war | 16 | 44% |
| CP Total War | 6 | 100% |
| Allies Total War | 8 | 98% |
| Tsar Takes Command | 9 | 63% |
| Fall of the Tsar | 13 | 51% |
| Bolshevik Revolution | 16 | 20% |
| Brest Litovsk | 17 | 18% |
| USA at war | 14 | 62% |

**Self-play bot activity per game** (mean)
| Measure | Allied bot | CP bot |
|---|---|---|
| Action rounds | 98.6 | 98.6 |
| Events played | 31.6 | 28.5 |
| Operations | 47.0 | 56.0 |
| …of which 1-OP Automatic | 0.1 | 0.3 |
| SR plays | 4.0 | 5.1 |
| RP plays | 16.0 | 9.0 |
| Attacks | 44.5 | 68.9 |
| Advances after combat | 22.3 | 29.2 |
| Edge/Score calculations | 272.1 | 263.7 |
| Mandated offensives missed | 2.27 | 0.81 |
| Edge/Score calculations per action round | 2.76 | 2.67 |

**Which step decided the action round** (share of bot action rounds, self-play)
| Step | Allied bot | CP bot |
|---|---|---|
| Crisis | 30.2% | 33.2% |
| Urgent event | 25.3% | 22.0% |
| Plan ops:play_ops | 8.2% | 16.2% |
| Plan log:play_rps | 4.2% | 9.2% |
| Plan event:play_event | 6.7% | 5.7% |
| Rebuild | 12.0% | 0.0% |
| Mandated Offensive | 6.1% | 4.8% |
| Plan log:play_sr | 4.1% | 5.2% |
| Mandated Offensive (last chance) | 2.1% | 1.8% |
| Fallback | 1.1% | 0.9% |
| Forced play | 0.1% | 1.0% |
| Plan ops:single_op | 0.1% | 0.2% |

**Self-play mean VP at the start of each turn** (games still running)
| Turn | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Mean VP | 10.3 | 10.8 | 10.9 | 9.8 | 9.9 | 10.0 | 10.5 | 10.1 | 10.0 | 9.7 | 9.7 | 8.7 | 8.7 | 8.4 | 8.2 | 7.7 | 7.8 | 7.5 | 7.7 |
| Games | 600 | 600 | 600 | 600 | 598 | 596 | 587 | 578 | 567 | 550 | 531 | 494 | 451 | 414 | 375 | 335 | 298 | 263 | 223 |
