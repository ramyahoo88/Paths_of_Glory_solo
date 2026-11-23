#!/usr/bin/env python3
"""Negative controls for print/check_print.py: each mutation must make the check fail, and name the right card or page.

Each control copies the checker, sim/bot.js, app/build_app.js and the three PDFs to a temporary folder. The release files are
never changed. Staff-card mutations edit a copy of print/out/staff_cards.html and print it with headless Chrome, the same way
print/build.js does.
Usage: python3 print/test_check_print.py   (needs pdftotext, pdfinfo and google-chrome; git for the old-reference control)
"""
import os, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = ['print/check_print.py', 'sim/bot.js', 'app/build_app.js', 'print/out/rules.pdf', 'print/out/reference.pdf', 'print/out/staff_cards.pdf']
CARD = '<div class="v">'


def fixture(tmp, name):
    d = os.path.join(tmp, name)
    for rel in FILES:
        os.makedirs(os.path.dirname(os.path.join(d, rel)), exist_ok=True)
        shutil.copy2(os.path.join(ROOT, rel), os.path.join(d, rel))
    return d


def run(d):
    r = subprocess.run(['python3', os.path.join(d, 'print', 'check_print.py')], capture_output=True, text=True)
    return r.returncode, r.stdout


def cards_pdf(d, html):
    src = os.path.join(d, 'cards.html')
    open(src, 'w').write(html)
    dst = os.path.join(d, 'print', 'out', 'staff_cards.pdf')
    subprocess.run(['google-chrome', '--headless', '--no-sandbox', '--disable-gpu', '--no-pdf-header-footer', f'--print-to-pdf={dst}', 'file://' + src],
                   capture_output=True, check=True)


def flagged(out):
    """Number of Staff cards the check names as wrong."""
    return sum(1 for l in out.splitlines() if l.startswith('  card '))


def nth(s, sub, n):
    """Index of the n-th (0-based) occurrence of sub in s."""
    i = -1
    for _ in range(n + 1):
        i = s.index(sub, i + 1)
    return i


html = open(os.path.join(ROOT, 'print', 'out', 'staff_cards.html')).read()
A1, P1 = 'CP +0.75 · Allies +1<', 'CP +1.5 · Allies +1.75<'
ok = True
with tempfile.TemporaryDirectory(prefix='gs-print-check-') as tmp:
    checks = []

    code, out = run(fixture(tmp, 'release'))
    checks.append(('release files pass', code == 0 and 'ok (18 cards)' in out, out))

    old = subprocess.run(['git', 'show', '569bdc7:print/out/reference.pdf'], cwd=ROOT, capture_output=True)
    if old.returncode == 0:
        d = fixture(tmp, 'old-reference')
        open(os.path.join(d, 'print', 'out', 'reference.pdf'), 'wb').write(old.stdout)
        code, out = run(d)
        checks.append(('v0.8.0 reference fails on page 2 only', code == 1 and out.count('MISMATCH') == 2 and 'reference p2: Stance: MISMATCH' in out
                       and 'reference p2: CP West first: MISMATCH' in out, out))
    else:
        print('skip: v0.8.0 reference not in git history')

    # one card loses its threshold line (the first Assault card); five correct Assault lines remain
    d = fixture(tmp, 'missing-threshold')
    i = html.index(A1)
    cards_pdf(d, html[:i] + html[i + len(A1) - 1:])
    code, out = run(d)
    checks.append(('one missing threshold fails, card 1 named', code == 1 and 'card 1: ' in out and flagged(out) == 1, out))

    # one card prints the v0.7.6 threshold (the second Press card)
    d = fixture(tmp, 'stale-threshold')
    i = nth(html, P1, 1)
    cards_pdf(d, html[:i] + 'CP +0.75 · Allies +1.75<' + html[i + len(P1):])
    code, out = run(d)
    checks.append(('one stale threshold fails, card 5 named', code == 1 and 'card 5: ' in out and flagged(out) == 1, out))

    # one card prints the wrong Stance name (card 3 shows Press over the Hold threshold)
    d = fixture(tmp, 'wrong-stance')
    i = nth(html, CARD + 'Hold<', 0)
    cards_pdf(d, html[:i] + CARD + 'Press<' + html[i + len(CARD + 'Hold<'):])
    code, out = run(d)
    checks.append(('one wrong Stance name fails, card 3 named', code == 1 and 'card 3: ' in out and flagged(out) == 1, out))

    for label, good, out in checks:
        ok &= good
        print(f'{label}: {"ok" if good else "FAILED"}')
        if not good: print(out)
print('PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
