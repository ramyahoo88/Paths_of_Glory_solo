#!/usr/bin/env python3
"""Checks that every Staff card face is whole on one page of print/out/staff_cards.pdf.

A face counts as whole on a page when its top (Front number label), its Tie line and its card number (n/18) are all
on that page; each face page must hold equal numbers of all three, and every card 1-18 must appear exactly once.
It also checks that every printed Stance threshold and the CP front-order rule match the reference bot (sim/bot.js) and
the companion (app/build_app.js): the rules, both reference pages that state them, and the Staff cards.
Usage: python3 print/check_print.py   (needs pdftotext and pdfinfo from poppler-utils)
"""
import re, subprocess, sys, os

pdf = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'staff_cards.pdf')
pages = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout).group(1))
seen, ok = [], True
for p in range(1, pages + 1):
    text = subprocess.run(['pdftotext', '-layout', '-f', str(p), '-l', str(p), pdf, '-'], capture_output=True, text=True).stdout
    ids = [int(x) for x in re.findall(r'\b(\d+)/18\b', text)]
    ties = len(re.findall(r'Tie:', text))
    heads = len(re.findall(r'front number', text, re.I))  # the label under the big number, near the top of the face
    backs = text.count('Paths of Glory solo bot')
    kind = 'faces' if ids else 'backs' if backs else 'other'
    good = (len(ids) == ties == heads) and (kind != 'other')
    ok &= good
    seen += ids
    print(f'page {p}: {kind:5}  card numbers {len(ids)}  Tie lines {ties}  tops {heads}  backs {backs}  {"ok" if good else "SPLIT OR MISSING"}')
if sorted(seen) != list(range(1, 19)):
    ok = False
    print('card numbers found:', sorted(seen))

# Printed thresholds and front order must match the reference bot (sim/bot.js) and the companion
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bot = open(os.path.join(root, 'sim', 'bot.js')).read()
base = {k: float(v) for k, v in re.findall(r'([APH]): ([\d.]+)', re.search(r'STANCE_MIN_EDGE = \{([^}]*)\}', bot).group(1))}
ap_shift, cp_shift = map(float, re.search(r"edgeShift: side === 'ap' \? ([\d.]+) : ([\d.]+)", bot).groups())
west_first = re.search(r"campaign: side === 'cp' \? 'west'", bot) is not None
app = open(os.path.join(root, 'app', 'build_app.js')).read()
app_cp, app_ap = map(float, re.search(r'const SHIFT = \{ cp: ([\d.]+), ap: ([\d.]+) \}', app).groups())
f = lambda x: f'+{x:g}'
cp = {k: f(base[k] + cp_shift) for k in 'APH'}; ap = {k: f(base[k] + ap_shift) for k in 'APH'}
def text(name, page=None):
    a = ['pdftotext'] + (['-f', str(page), '-l', str(page)] if page else []) + [os.path.join(root, 'print', 'out', name), '-']
    return ' '.join(subprocess.run(a, capture_output=True, text=True).stdout.split())
need = [
    ('companion shift matches the bot', (app_cp, app_ap) == (cp_shift, ap_shift), ''),
    ('rules: Stance table', None, ('rules.pdf', None, f"Assault {cp['A']} {ap['A']} Press {cp['P']} {ap['P']} Hold {cp['H']} {ap['H']}")),
    ('reference p1: Stance', None, ('reference.pdf', 1, f"CP: Assault {cp['A']}, Press {cp['P']}, Hold {cp['H']}; Allies: {ap['A']}, {ap['P']}, {ap['H']}")),
    ('reference p2: Stance', None, ('reference.pdf', 2, f"Central Powers bot Assault {cp['A']}, Press {cp['P']}, Hold {cp['H']}; Allied bot Assault {ap['A']}, Press {ap['P']}, Hold {ap['H']}")),
]
if west_first:
    need += [('rules: CP West first', None, ('rules.pdf', None, 'The Central Powers bot always puts the West first')),
             ('reference p1: CP West first', None, ('reference.pdf', 1, 'CP bot: West first')),
             ('reference p2: CP West first', None, ('reference.pdf', 2, 'The Central Powers bot always puts the West first'))]
for label, val, spec in need:
    good = val if spec == '' else spec[2] in text(spec[0], spec[1])
    ok &= bool(good)
    print(f'{label}: {"ok" if good else "MISMATCH (expected " + repr(spec[2] if spec else "") + ")"}')

# Each Staff card face, one by one: its Stance (from the deck in sim/bot.js) and exactly one threshold line for that Stance.
# Words are placed on a card by position: the card's number "n/18" sits at the bottom of its face, in the same column.
stances = re.search(r"const STANCES = \[([^\]]*)\]", bot).group(1).replace("'", '').replace(' ', '').split(',')
assert re.search(r'for \(let n = 1; n <= 6; n\+\+\) for \(let s = 0; s < 3; s\+\+\) \{ deck\.push\(\{ id: deck\.length \+ 1, n, stance: STANCES\[s\]', bot), \
    'makeDeck() changed shape: update the per-card check in print/check_print.py'
NAME = {'A': 'Assault', 'P': 'Press', 'H': 'Hold'}
card_ok, cards_seen = [], set()
for p in range(1, pages + 1):
    html = subprocess.run(['pdftotext', '-bbox', '-f', str(p), '-l', str(p), pdf, '-'], capture_output=True, text=True).stdout
    words = [(float(a), float(b), float(c), float(d), w) for a, b, c, d, w in
             re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', html)]
    nums = [((x0 + x1) / 2, y0, int(w.split('/')[0])) for x0, y0, x1, y1, w in words if re.fullmatch(r'\d+/18', w)]
    if not nums: continue
    # card centres: the centred "FRONT NUMBER" label on each face; the cards are tiled, so each word belongs to the nearest centre
    fronts = [(x0, y0) for x0, y0, x1, y1, w in words if w == 'FRONT']
    cols = sorted({round((fx + x1) / 2) for fx, fy in fronts for x0, y0, x1, y1, w in words if w == 'NUMBER' and abs(y0 - fy) < 1 and 0 < x0 - fx < 60})
    col_of = lambda xc: min(cols, key=lambda c: abs(c - xc))
    per = {n: [] for _, _, n in nums}
    for x0, y0, x1, y1, w in words:
        col = col_of((x0 + x1) / 2)
        below = [(ny, n) for nx, ny, n in nums if col_of(nx) == col and ny >= y0 - 1]  # the card number is at the foot of its face
        if below: per[min(below)[1]].append((round(y0, 1), x0, w))
    for n, ws in per.items():
        cards_seen.add(n)
        lines = {}
        for y, x, w in ws: lines.setdefault(y, []).append((x, w))
        lines = [' '.join(w for _, w in sorted(v)) for _, v in sorted(lines.items())]
        want = stances[(n - 1) % 3]
        printed = [w for _, _, w in ws if w in NAME.values()]
        thr = [m.groups() for l in lines for m in re.finditer(r'CP (\+[\d.]+) · Allies (\+[\d.]+)', l)]
        good = printed == [NAME[want]] and thr == [(cp[want], ap[want])]
        if not good: card_ok.append(f'card {n}: Stance {printed or "missing"}, thresholds {thr or "missing"}; expected {NAME[want]} CP {cp[want]} · Allies {ap[want]}')
good = not card_ok and cards_seen == set(range(1, 19))
ok &= good
print(f'Staff cards: each card\'s Stance and threshold: {"ok (18 cards)" if good else "MISMATCH"}')
for m in card_ok: print('  ' + m)
if cards_seen != set(range(1, 19)): print('  cards placed:', sorted(cards_seen))
print('PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
