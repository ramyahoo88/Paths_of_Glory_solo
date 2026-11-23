#!/usr/bin/env python3
"""Real-browser checks of the companion: headless Chrome through Playwright, with the real DOM, localStorage and reloads.
Complements app/test_companion.cjs (script callbacks with DOM and storage doubles).
Usage: python3 app/test_browser.py [path to General_Staff_Companion.html] [chrome executable]
Needs the Python playwright package and Chrome (default /usr/bin/google-chrome).
"""
import os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__))
url = 'file://' + os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, 'General_Staff_Companion.html'))
chrome = sys.argv[2] if len(sys.argv) > 2 else '/usr/bin/google-chrome'
out = []
def ok(c, label):
    out.append(('ok  ' if c else 'FAIL') + ' ' + label)
    if not c: raise SystemExit('\n'.join(out))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=chrome, args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 1200, 'height': 1000})
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(url)
    S = lambda: pg.evaluate('JSON.parse(JSON.stringify(S))')
    # B01: draw, then Next round + draw to round 6; the button turns off
    pg.click('#draw')
    for _ in range(5): pg.click('#nextdraw')
    s = S(); ok(s['track']['round'] == 6 and len(s['discard']) == 6, 'round 6 reached with six cards drawn')
    ok(pg.is_disabled('#nextdraw'), 'Next round + draw is disabled at round 6')
    pg.reload(); ok(pg.is_disabled('#nextdraw') and len(S()['discard']) == 6, 'after a real reload: still round 6, still disabled')
    pg.click('#nextturn'); ok(not pg.is_disabled('#nextdraw') and S()['track']['round'] == 1, 'Next turn re-enables it')
    # A01 and B02: a donor session (Allies, Total War) imported twelve times; the save stays small; reload; Undo
    donor = pg.evaluate("(() => { const d = JSON.parse(JSON.stringify(S)); d.side = 'ap'; d.lvl = 'total'; d.hist = []; return JSON.stringify(Object.assign({ v: 1 }, d)) })()")
    before = S()
    pg.click('summary')
    sizes = []
    for i in range(12):
        pg.fill('#iotext', donor); pg.click('#import')
        sizes.append(pg.evaluate("localStorage.getItem('gs-companion').length"))
    ok(S()['side'] == 'ap' and pg.input_value('#side') == 'ap', 'Import took the Allied side')
    ok(max(sizes) < 10000, f'twelve Imports keep the save small: {sizes}')
    pg.reload(); ok(S()['side'] == 'ap', 'imported session survives a real reload')
    for _ in range(10): pg.click('#undo')
    ok(pg.is_disabled('#undo'), 'ten Undos use up the ten kept checkpoints')
    # one Import + one Undo restores the original exactly
    pg.evaluate("localStorage.clear()"); pg.reload(); pg.click('#draw'); pg.click('#draw'); orig = S()
    if not pg.is_visible('#iotext'): pg.click('summary')
    pg.fill('#iotext', donor); pg.click('#import'); pg.click('#undo')
    ok(S() == orig and pg.input_value('#side') == orig['side'], 'Import then Undo restores the original session, side included')
    # Clear attack
    pg.fill('#acf', '3'); pg.check('#bobj'); pg.select_option('#bmo', '6'); pg.click('#clearatk')
    ok(pg.input_value('#acf') == '8' and not pg.is_checked('#bobj') and pg.input_value('#bmo') == '0', 'Clear attack resets the calculator')
    ok(not errs, f'no page errors {errs}')
    b.close()
print('\n'.join(out)); print('PASS', len(out), 'browser checks')
