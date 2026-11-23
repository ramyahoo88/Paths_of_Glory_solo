"""Recount the shipped v0.8.2 records and paired changes. Run from the repository root."""
from pathlib import Path
import json, collections, math, subprocess

ROOT = Path.cwd()
HERE = Path(__file__).resolve().parent
NEW = ROOT / 'sim/results/v0.8.2'
read = lambda p: json.loads(p.read_text())
out = {'paired': {}, 'handicap': []}
for side in ['cp', 'ap']:
    for batch in [6, 7]:
        name = f'paired_{side}{batch}.json'
        a = read(NEW / name)
        b = read(ROOT / 'sim/results' / ('v0.8.0' if side == 'cp' else 'v0.7.6') / name)
        assert a['candidate']['commit'] == 'dba0de2ff37d86f678fe506e9dee5dd2e88423dc' and not a['candidate']['dirty']
        assert a['reference']['commit'] == 'bc8bef6ceb8311425accab2bfe2f7a8411548f55' and not a['reference']['dirty']
        old = {g['seed']: g for g in b['games']}
        assert len(old) == len(a['games']) == a['n'] == 300
        assert {g['seed'] for g in a['games']} == set(old)
        wins = lambda g: g['result'] == ('Central Powers' if side == 'cp' else 'Allied Powers')
        gain = sum(wins(g) and not wins(old[g['seed']]) for g in a['games'])
        loss = sum(not wins(g) and wins(old[g['seed']]) for g in a['games'])
        n = gain + loss
        p = min(1, 2 * sum(math.comb(n, i) for i in range(min(gain, loss) + 1)) / 2**n)
        assert a['errs'] == 0 and all(g['candidateDecisionErrors'] == 0 for g in a['games'])
        out['paired'][name] = dict(n=a['n'], wins=sum(map(wins, a['games'])), oldWins=sum(map(wins, b['games'])), gained=gain, lost=loss, exactPairedP=p, candidate=a['candidate'], reference=a['reference'])
for i in range(6):
    x = read(NEW / f'handicap_{i}.json')
    assert x['n'] == len(x['games']) == 150 and x['errors'] == 0
    assert x['bot']['commit'] == 'dba0de2ff37d86f678fe506e9dee5dd2e88423dc' and not x['bot']['dirty']
    out['handicap'].append(dict(shift=i, n=x['n'], cpWins=sum(g['result'] == 'Central Powers' for g in x['games'])))
health = collections.Counter()
selfplay = []
for f in ['self_a', 'self_b', 'self_c', 'self_d', 'rnd_ap', 'rnd_cp', 'naive_ap', 'naive_cp']:
    x = read(NEW / (f + '.json'))
    assert x['bot']['commit'] == 'dba0de2ff37d86f678fe506e9dee5dd2e88423dc' and not x['bot']['dirty']
    assert len(x['games']) == x['n'] == len({g['seed'] for g in x['games']})
    if f.startswith('self_'):
        selfplay.extend(x['games'])
    for g in x['games']:
        health['games'] += 1
        health['incomplete'] += not g['complete']
        health['exceptions'] += len(g['exceptions'])
        health['errors'] += bool(g['err'])
        for side in ['ap', 'cp']:
            st = g['stats'][side]
            for k in ['violations', 'undos', 'abandoned', 'calledOff', 'salonikaForced']:
                health[k] += st.get(k, 0)
            health['fallback'] += sum(st['fallback'].values())
        for breach in g['supplyBreaches']:
            opponent = x['pairing'][0 if breach['side'] == 'ap' else 1] == 'rnd'
            health['opponentSupplyBreaches' if opponent else 'botSupplyBreaches'] += 1
assert sorted(g['seed'] for g in selfplay) == list(range(1200000, 1200600))
out['selfplay'] = {s: sum(g['result'] == r for g in selfplay) for s, r in [('ap', 'Allied Powers'), ('cp', 'Central Powers')]}
out['health'] = dict(health)
subprocess.run(['git', 'diff', '--exit-code', 'dba0de2', '50dd245', '--', 'sim/bot.js', 'sim/events.js', 'sim/board.js', 'sim/engine_hook.js'], check=True)
(HERE / 'published-records.json').write_text(json.dumps(out, indent=2) + '\n')
print(json.dumps({k: v for k, v in out.items() if k != 'paired'}, indent=2))
