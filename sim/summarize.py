#!/usr/bin/env python3
"""Summarize final_eval.py JSON outputs into report tables (markdown) and a JSON digest."""
import json, sys, glob, os, statistics as st
from collections import Counter, defaultdict

d = sys.argv[1]
def load(name):
    out = []
    for f in sorted(glob.glob(os.path.join(d, name))):
        data = json.load(open(f))
        if isinstance(data, dict) and 'games' in data: out += data['games']  # skips digest.json
    return out

def wins(games, side):
    role = 'Allied Powers' if side == 'ap' else 'Central Powers'
    return sum(1 for g in games if g['result'] == role)

def ci(k, n):
    p = k / n if n else 0
    se = (p * (1 - p) / n) ** 0.5 if n else 0
    return p, se

def kind(g):
    v = (g['victory'] or 'error').split(':')[0]
    return v

rows = []
digest = {}
for label, pat, side in [('Self-play (GS vs GS)', 'self_*.json', None), ('GS Allies vs random CP', 'rnd_ap.json', 'ap'), ('GS CP vs random Allies', 'rnd_cp.json', 'cp'),
                         ('GS Allies vs naive CP', 'naive_ap.json', 'ap'), ('GS CP vs naive Allies', 'naive_cp.json', 'cp')]:
    G = load(pat)
    if not G: continue
    n = len(G)
    errs = sum(1 for g in G if g['err'] or not g['result'])
    ap, cp = wins(G, 'ap'), wins(G, 'cp')
    kinds = Counter((('AP' if g['result'] == 'Allied Powers' else 'CP' if g['result'] == 'Central Powers' else '?') + ' ' + kind(g)) for g in G)
    vp = [g['vp'] for g in G]
    turns = [g['turn'] for g in G]
    digest[label] = dict(n=n, ap=ap, cp=cp, errors=errs, kinds=dict(kinds), meanVP=st.mean(vp), meanTurn=st.mean(turns))
    rows.append((label, n, ap, cp, errs, st.mean(turns), kinds))

print('| Match-up | Games | Allied wins | CP wins | Mean end turn | How games ended |')
print('|---|---|---|---|---|---|')
for label, n, ap, cp, errs, mt, kinds in rows:
    k = ', '.join(f'{a} {b}' for a, b in sorted(kinds.items(), key=lambda x: -x[1]))
    print(f'| {label} | {n} | {ap} ({ap/n:.0%}) | {cp} ({cp/n:.0%}) | {mt:.1f} | {k} |')

# Run health: every game in every file, so clean-run claims can be checked
ALL = load('*.json')
if ALL:
    inc = [g for g in ALL if g.get('err') or not g.get('result')]
    exc = sum(len(g.get('exceptions', [])) for g in ALL)
    viol = Counter(); fb = Counter(); forced = Counter(); undo = 0; hold = 0; called = 0
    for g in ALL:
        for side in ('ap', 'cp'):
            s_ = g['stats'][side]
            undo += s_.get('undos', 0) or 0
            hold += s_.get('holdMoves', 0) or 0
            called += s_.get('calledOff', 0) or 0
            for k, v in (s_.get('fallback') or {}).items():
                if k.startswith('viol:'): viol[k.split(':')[2]] += v
                elif k.startswith('illegal:'): fb['rejected bot proposal: ' + k.split(':')[1]] += v
                elif k.startswith('forced:'): forced[k.split(':', 1)[1]] += v
                elif k.startswith('nochoice:'): fb['handler found no choice: ' + k.split(':', 1)[1]] += v
                elif k.startswith('nohandler:'): fb['no bot rule (engine default): ' + k.split(':', 1)[1]] += v
                else: fb['engine default (unclassified): ' + k] += v
    print()
    print('**Run health** (all games above)')
    print('| Check | Count |')
    print('|---|---|')
    print(f'| Games | {len(ALL)} |')
    print(f'| Unfinished games or harness errors | {len(inc)} |')
    print(f'| Decision exceptions replaced by the engine\'s first legal action | {exc} |')
    resets = sum((g['stats'][x].get('violations') or 0) for g in ALL for x in ('ap', 'cp'))
    hit = sum(1 for g in ALL if any(g['stats'][x].get('violations') for x in ('ap', 'cp')))
    print(f'| Rule-violation resets (' + (', '.join(f'{k} {v}' for k, v in viol.most_common()) or 'none') + f'); games affected: {hit} | {resets} |')
    print(f'| Undo of a dead-end step | {undo} |')
    print(f'| Units moved one safe step because their planned move was abandoned | {hold} |')
    print(f'| Attacks called off after the final check of the selected units | {called} |')
    print(f'| Choices with no bot rule, empty handler results or rejected proposals | {sum(fb.values())} |')
    for k, v in fb.most_common(12): print(f'| &nbsp;&nbsp;{k} | {v} |')
    print(f'| Forced acknowledgements (one legal action, no choice) | {sum(forced.values())} |')
    digest['health'] = dict(games=len(ALL), incomplete=len(inc), exceptions=exc, violations=dict(viol), undos=undo, holdMoves=hold, calledOff=called, fallback=dict(fb), forced=dict(forced))

# Self-play details
G = load('self_*.json')
if G:
    print()
    print('**Self-play milestones** (median turn when reached; share of games reaching it)')
    ms = defaultdict(list)
    for g in G:
        for k, v in g['milestones'].items(): ms[k].append(v)
    names = {'tu': 'Turkey at war', 'it': 'Italy at war', 'bu': 'Bulgaria at war', 'ro': 'Romania at war', 'gr': 'Greece at war', 'us': 'USA at war',
             'apLimited': 'Allies Limited War', 'cpLimited': 'CP Limited War', 'apTotal': 'Allies Total War', 'cpTotal': 'CP Total War',
             'tsar_takes_command': 'Tsar Takes Command', 'fall_of_the_tsar': 'Fall of the Tsar', 'bolshevik_revolution': 'Bolshevik Revolution', 'treaty_of_brest_litovsk': 'Brest Litovsk'}
    print('| Milestone | Median turn | Games |')
    print('|---|---|---|')
    for k in ['cpLimited', 'apLimited', 'tu', 'it', 'bu', 'ro', 'gr', 'cpTotal', 'apTotal', 'tsar_takes_command', 'fall_of_the_tsar', 'bolshevik_revolution', 'treaty_of_brest_litovsk', 'us']:
        if ms[k]: print(f'| {names[k]} | {st.median(ms[k]):.0f} | {len(ms[k])/len(G):.0%} |')
    print()
    print('**Self-play bot activity per game** (mean)')
    print('| Measure | Allied bot | CP bot |')
    print('|---|---|---|')
    keys = ['rounds', 'events', 'ops', 'single', 'sr', 'rp', 'attacks', 'advances', 'evals']
    lab = {'rounds': 'Action rounds', 'events': 'Events played', 'ops': 'Operations', 'single': '…of which 1-OP Automatic', 'sr': 'SR plays', 'rp': 'RP plays', 'attacks': 'Attacks', 'advances': 'Advances after combat', 'evals': 'Edge/Score calculations'}
    for k in keys:
        a = st.mean(g['stats']['ap'].get(k, 0) for g in G); c = st.mean(g['stats']['cp'].get(k, 0) for g in G)
        print(f'| {lab[k]} | {a:.1f} | {c:.1f} |')
    a_m = st.mean(g['missedMO']['ap'] for g in G); c_m = st.mean(g['missedMO']['cp'] for g in G)
    print(f'| Mandated offensives missed | {a_m:.2f} | {c_m:.2f} |')
    ra = sum(g['stats']['ap'].get('rounds', 0) for g in G); rc = sum(g['stats']['cp'].get('rounds', 0) for g in G)
    ea = sum(g['stats']['ap'].get('evals', 0) for g in G); ec = sum(g['stats']['cp'].get('evals', 0) for g in G)
    print(f'| Edge/Score calculations per action round | {ea/ra:.2f} | {ec/rc:.2f} |')
    print()
    print('**Which step decided the action round** (share of bot action rounds, self-play)')
    stepc = {'ap': Counter(), 'cp': Counter()}
    for g in G:
        for s in ['ap', 'cp']:
            for k, v in g['stats'][s].items():
                if k.startswith('step:'): stepc[s][k[5:]] += v
    allk = sorted(set(stepc['ap']) | set(stepc['cp']), key=lambda k: -(stepc['ap'][k] + stepc['cp'][k]))
    ta, tc = sum(stepc['ap'].values()), sum(stepc['cp'].values())
    print('| Step | Allied bot | CP bot |')
    print('|---|---|---|')
    for k in allk:
        print(f'| {k} | {stepc["ap"][k]/ta:.1%} | {stepc["cp"][k]/tc:.1%} |')
    # VP by turn
    print()
    print('**Self-play mean VP at the start of each turn** (games still running)')
    byT = defaultdict(list)
    for g in G:
        for i, v in enumerate(g['vpByTurn']): byT[i + 2].append(v)
    print('| Turn | ' + ' | '.join(str(t) for t in sorted(byT)) + ' |')
    print('|---|' + '---|' * len(byT))
    print('| Mean VP | ' + ' | '.join(f'{st.mean(byT[t]):.1f}' for t in sorted(byT)) + ' |')
    print('| Games | ' + ' | '.join(str(len(byT[t])) for t in sorted(byT)) + ' |')
json.dump(digest, open(os.path.join(d, 'digest.json'), 'w'), indent=1)
