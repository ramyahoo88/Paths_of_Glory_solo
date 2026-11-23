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
] + [(f'Staff cards: {k} thresholds', None, ('staff_cards.pdf', None, f"CP {cp[k]} · Allies {ap[k]}")) for k in 'APH']
if west_first:
    need += [('rules: CP West first', None, ('rules.pdf', None, 'The Central Powers bot always puts the West first')),
             ('reference p1: CP West first', None, ('reference.pdf', 1, 'CP bot: West first')),
             ('reference p2: CP West first', None, ('reference.pdf', 2, 'The Central Powers bot always puts the West first'))]
for label, val, spec in need:
    good = val if spec == '' else spec[2] in text(spec[0], spec[1])
    ok &= bool(good)
    print(f'{label}: {"ok" if good else "MISMATCH (expected " + repr(spec[2] if spec else "") + ")"}')
print('PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
