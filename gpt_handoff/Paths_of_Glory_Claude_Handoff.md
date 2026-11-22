# Paths of Glory handoff for Claude

Continue the physical-board solo companion from **Tabletop Pilot v0.2**. Taylor wants a purposeful opponent with fixed decisions and low administration. The player should answer factual questions about the physical board, move counters and resolve printed rules. The bot should choose its objective, card use, orders and tie breaks. Keep improving that approach while measuring the work it puts on the player.

The original project explored a complete digital opponent. Taylor then asked whether the bots could be simplified because maintaining the whole board digitally seemed burdensome. The accepted direction became a small offline companion for the 1914 Introductory Scenario, with either side playable by the bot. Preserve the printed game rules when changing bot priorities. Full-campaign coverage remains future work.

**Start with these files.**

| File or folder | Purpose |
| --- | --- |
| `apps/Paths_of_Glory_1914_Tabletop_Pilot.html` | Current tabletop companion, v0.2 |
| `source/tabletop/` | Editable resources, planner, interface, HTML shell and CSS recovered from that exact release |
| `apps/Paths_of_Glory_1914_Solo_v1_7_Playtest.html` | Latest retained complete digital reference, v1.7.0 |
| `source/digital/` | Digital reference extracted into its script, shell and CSS |
| `build.cjs` | Rebuilds either app using only Node built-ins |
| `checks/verify.cjs` | Recovery verification and UI flow checks supplied with this handoff |
| `checks/recovery-verification.txt` | Results from running those checks during handoff preparation |
| `checks/reported-results.json` | Earlier reported aggregates with provenance and verification limits |
| `SHA256SUMS.txt` | Checksums for the delivered files |

The HTML releases were recovered from their saved copies and match the fingerprints recorded when they were delivered. Workspace maintenance removed the original development tree and raw replay evidence. The editable source is a faithful extraction of the release bytes. The build script and recovery verifier were recreated for this handoff. They reproduce both HTML files byte for byte. The earlier simulation harnesses, checkpoint JSON, seed-level output and experimental candidate builds are unavailable in this package.

**Current tabletop behavior.**

The app covers August, September and Fall 1914, six bot actions each turn. Choose Central Powers or Allies. The default option allows six order-search checks, with a three-check option for a shorter procedure. The physical board holds unit locations, control, supply, combat and scoring. The app holds the bot's hand, deck, discards, removed cards, turn, round, mandate, pending order and recent order history.

Each side has a fixed objective for each turn. In the broader procedure, the app normally checks three orders on the main front, then three on a reserve front. Late actions can prioritize a pending mandated offensive. The player confirms a march or attack and enters the printed activation cost. Fixed group priorities choose one nationality, most armies, then most units, then printed unit designations. Cover orders use corps. The player checks movement, combat, stacking, supply and other restrictions on the physical board.

A listed junction with an adjacent enemy combat unit must retain a friendly combat unit when the bot marches away. This is a bot precaution. It addresses a particular failure seen in the digital experiments, but it does not establish that every protected route is safe.

Central Powers new games using the six-check option enable **local search in Fall**. The bot first checks three normal orders. A blocked order can report that its origin still contains a supplied stack. The app remembers the first such origin. If it has no remembered origin, it asks for the first supplied stack in a list of up to two named spaces. It then proposes nearby destinations from a small stored adjacency list. Each extra stack lookup reduces the remaining order budget. Order checks plus stack lookups stay within six for that search. Replacement eligibility, unit selection, supply tracing and combat resolution are additional player work beyond this counter.

The Allied bot keeps the two-front procedure because the local-search variants reduced its legal-order coverage. The short option keeps the earlier fixed order list. Loading a v0.1 session preserves its previous behavior through defaults that disable the new local-search flag. New Central Powers sessions with the broader option enable it.

The Cluj drill is a worked example. Stanislau has one Austro-Hungarian corps and RU 8 is adjacent at Czernowitz. The corps must stay at Stanislau under the guard procedure. The backup marches a different corps from Villach through Graz and Vienna to Budapest. Entering or leaving the drill restores the table session.

**Card and combat limits matter for the next design work.**

The app manages seven-card Mobilization hands and gives the Central Powers Guns of August in the opening hand. It plays that event first. One-OPS orders use a cardless Automatic Operation. More expensive orders spend the lowest sufficient OPS card under fixed priorities. When orders fail, the app can bank replacements in the first two turns, subject to consecutive-RP restrictions, or take an Automatic Operation with no activations.

The current policy executes one selected group/order at a time. It does not develop combined operations across multiple activated spaces, SR plans, or general event selection beyond Guns of August. It declines optional combat cards and flank attempts. Losses, retreats, advances and replacements follow the simple priorities printed in the app. Reinforcement and other useful events therefore remain major strategic gaps. The bot selects from actions available under the printed game rules.

The app requests manual completion of the printed turn-end sequence. It does not track the physical VP marker or resolve a full battle itself. Its card metadata includes names, OPS and total replacement value. The player refers to the printed card for its actual replacement allocation and event text.

**Earlier tests reported in this conversation.**

These figures are retained development summaries. Their raw evidence was removed with the old workspace, and the results were not rerun while preparing this handoff.

| Tabletop procedure on 420 ordinary positions from 12 digital replays | Legal march or attack | Average order checks |
| --- | --- | --- |
| Three fixed checks | 232/420 | 2.34 |
| Six checks on one front | 287/420 | 3.53 |
| Three checks on each of two fronts | 308/420 | 3.48 |

The two-front procedure found an order in 70 of 144 Fall positions. Subsequent experiments tested extra stack observations and nearby destinations. The selected Central Powers Fall policy produced the following reported results. The first fresh batch informed the decision to enable the policy only for Central Powers. The last batch followed that decision.

| Central Powers Fall cohort | v0.1 orders | v0.2 orders | v0.1 average checks | v0.2 average checks |
| --- | --- | --- | --- | --- |
| Development, 12 replays | 31/72 | 45/72 | 4.33 | 4.14 |
| First fresh batch, 24 replays | 82/138 | 97/138 | 3.92 | 3.83 |
| Final fresh batch, 16 replays | 54/90 | 61/90 | 3.72 | 3.66 |
| Two fresh batches combined | 136/228 | 158/228 | 3.84 | 3.76 |

The combined gain was 26 positions gaining an order and four losing one. Most additional orders were attacks. For Allies, the same local-search idea fell from 140/228 to 117/228 across the fresh Fall positions, supporting the side-specific decision.

These checks evaluated suggested orders on positions generated by the existing digital players. The tabletop bot did not play those whole games. Legal-order availability does not establish good attack selection, balance, challenge or enjoyment. Counts of checks do not measure elapsed tabletop time. Human playtesting remains pending.

**Digital reference and lessons from rejected changes.**

The earlier v1.7 digital baseline reported 31 Central Powers wins, 42 draws and 87 Allied wins across 160 matched seeds. It combined supply recovery and stronger protection of supply routes. A later fresh 96-seed sample gave v1.7 17 Central Powers wins, 30 draws and 49 Allied wins, with mean CP VP 9.29. Different samples explain the different totals.

Two attempts to add Eastern garrisons and counterattacks failed to improve that 96-seed sample. Garrison-only gave 17 CP wins, 29 draws and 50 Allied wins, mean VP 9.18. Garrison plus counterattack gave 15, 28 and 53, mean VP 9.01. v1.7 remained the retained digital build. There is no released v1.8 in this handoff.

The revealing replay was seed 530433 against the western Allied policy. An experimental garrison move sent the Stanislau corps to Cluj. The Allies marched into Lemberg and advanced into Lodz after combat. At August attrition, the variant lost four armies versus one in v1.7 and eventually scored 3 VP versus a 12-VP draw. The lesson was to examine connected movement-and-combat threats and the cost of vacating a junction. The local guard simplifies that concern. Broader supply safety needs further verification.

The reference digital app is useful as an implementation source and a future simulation harness foundation. Verify it against the current official rules before using its output to establish rules correctness. The original audit fixtures and experiment scripts are absent.

**Build and verify from the package root.**

```sh
node checks/verify.cjs
node build.cjs tabletop
node build.cjs digital
```

An optional third argument writes to a separate path.

```sh
node build.cjs tabletop rebuilt/Tabletop.html
```

Node 24.22.3 ran the recovery checks successfully. The scripts use built-in modules and need no package install. Recovery verification checked both original fingerprints, byte-identical builds, JavaScript parsing, the Cluj drill, two complete 18-action interface flows, reload of a pending order, reload during the Fall stack search, and card conservation. The checks use a simulated DOM and factual input choices. They do not verify those choices against a physical board. Real browser rendering and Android use were not verified in this handoff. The earlier cloud browser blocked opening a local file URL.

For future edits, the retained hashes identify these exact snapshots. Update release expectations deliberately when changing the app. The checksum verifier is a snapshot/recovery check.

**Recommended continuation.**

1. Rebuild and run the recovery verifier, then test the actual page in an available supported browser. Check mobile layout, reload, new-game confirmation, the drill and the Fall branch.
2. Rebuild an executable tabletop-policy harness using the retained digital engine where appropriate. Implement the actual card, group, combat and fallback priorities from the companion. Run full games before claiming strength. Measure wins, draws, score margins, idle actions, failed orders, legal but costly attacks, mandate failures, and attrition losses.
3. Add a small deterministic attack-quality check and compare it to the existing policy. The recent availability gains mostly increased attacks, so casualty-heavy attacks are an immediate concern. Keep all selection and fallback priorities explicit for a human operator.
4. Test a compact event/reinforcement procedure and better use of OPS against its extra administration. The current one-order policy often conserves the hand and leaves useful events unused.
5. Preserve factual inputs and fixed tie breaks. Measure supply lookups, group searches, total questions and tabletop time. A player should not need to choose the bot's strongest strategy.
6. Review save validation and recovery. Current validation checks only part of the saved shape, storage failures are silent, and the companion has no export/import or general Undo. Preserve existing sessions if extending these features.
7. Once the 1914 procedure works in full play and at the table, assess further campaign coverage and a printable procedure using the same priorities.

Taylor requested this handoff and another copy of the latest files. Both apps retain their recovered release bytes. Repository setup and public deployment remain unverified in the recovered material.
