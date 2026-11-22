#!/usr/bin/env python3
"""Checks that every Staff card face is whole on one page of print/out/staff_cards.pdf.

A face counts as whole on a page when its top (Front number label), its Tie line and its card number (n/18) are all
on that page; each face page must hold equal numbers of all three, and every card 1-18 must appear exactly once.
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
print('PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
