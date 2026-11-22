| Match-up | Games | Allied wins | CP wins | Mean end turn | How games ended |
|---|---|---|---|---|---|
| Self-play (GS vs GS) | 600 | 501 (84%) | 99 (16%) | 17.4 | AP Automatic Victory 221, AP Turn Limit 195, AP Armistice Declared 85, CP Automatic Victory 67, CP Turn Limit 26, CP Armistice Declared 6 |
| GS Allies vs random CP | 20 | 20 (100%) | 0 (0%) | 5.7 | AP Automatic Victory 20 |
| GS CP vs random Allies | 20 | 0 (0%) | 20 (100%) | 4.5 | CP Automatic Victory 20 |
| GS Allies vs naive CP | 50 | 50 (100%) | 0 (0%) | 7.3 | AP Automatic Victory 50 |
| GS CP vs naive Allies | 50 | 0 (0%) | 50 (100%) | 4.4 | CP Automatic Victory 50 |

**Run health** (all games above)
| Check | Count |
|---|---|
| Games | 740 |
| Unfinished games or harness errors | 0 |
| Decision exceptions replaced by the engine's first legal action | 0 |
| Rule-violation resets (Insufficient strength to besiege 1); games affected: 1 | 1 |
| Undo of a dead-end step | 0 |
| Units moved one safe step because their planned move was abandoned | 8 |
| Attacks called off after the final check of the selected units | 0 |
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
| Romania at war | 8 | 76% |
| Greece at war | 16 | 48% |
| CP Total War | 6 | 100% |
| Allies Total War | 8 | 99% |
| Tsar Takes Command | 9 | 81% |
| Fall of the Tsar | 13 | 70% |
| Bolshevik Revolution | 16 | 27% |
| Brest Litovsk | 17 | 25% |
| USA at war | 14 | 75% |

**Self-play bot activity per game** (mean)
| Measure | Allied bot | CP bot |
|---|---|---|
| Action rounds | 104.3 | 104.3 |
| Events played | 33.0 | 30.0 |
| Operations | 51.0 | 56.4 |
| …of which 1-OP Automatic | 0.1 | 0.3 |
| SR plays | 4.0 | 6.4 |
| RP plays | 16.3 | 11.5 |
| Attacks | 44.8 | 87.6 |
| Advances after combat | 22.0 | 32.9 |
| Edge/Score calculations | 279.1 | 248.7 |
| Mandated offensives missed | 2.67 | 1.11 |
| Edge/Score calculations per action round | 2.67 | 2.38 |

**Which step decided the action round** (share of bot action rounds, self-play)
| Step | Allied bot | CP bot |
|---|---|---|
| Crisis | 33.8% | 24.8% |
| Urgent event | 24.9% | 21.4% |
| Plan ops:play_ops | 6.8% | 22.5% |
| Plan log:play_rps | 4.0% | 11.0% |
| Plan event:play_event | 6.6% | 6.2% |
| Rebuild | 11.6% | 0.0% |
| Mandated Offensive | 5.5% | 4.9% |
| Plan log:play_sr | 3.8% | 6.1% |
| Mandated Offensive (last chance) | 1.9% | 1.2% |
| Fallback | 0.8% | 0.7% |
| Forced play | 0.1% | 1.0% |
| Plan ops:single_op | 0.0% | 0.3% |

**Self-play mean VP at the start of each turn** (games still running)
| Turn | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Mean VP | 10.0 | 10.4 | 10.8 | 9.7 | 9.7 | 10.0 | 10.4 | 9.7 | 9.5 | 8.9 | 8.7 | 7.6 | 7.3 | 7.1 | 7.1 | 6.4 | 6.5 | 6.1 | 6.3 |
| Games | 600 | 600 | 600 | 599 | 599 | 597 | 594 | 590 | 585 | 579 | 567 | 535 | 510 | 476 | 444 | 395 | 357 | 323 | 284 |
