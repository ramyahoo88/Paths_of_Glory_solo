#!/usr/bin/env python3
"""Reproduce v0.8.1's old-reference rejection and single-card coverage gap.

Requires Python, PyMuPDF, Node-free print checker dependencies (pdfinfo and
pdftotext), and a Git checkout containing commits a81eda6 and 569bdc7.
Only temporary PDF copies are changed. Exit 0 confirms both documented results.
"""
from pathlib import Path
import shutil
import subprocess
import tempfile

import fitz

ROOT = Path(__file__).resolve().parents[3]
FILES = [
    "print/check_print.py", "sim/bot.js", "app/build_app.js",
    "print/out/rules.pdf", "print/out/reference.pdf", "print/out/staff_cards.pdf",
]


def fixture(parent, name):
    dest = parent / name
    for rel in FILES:
        target = dest / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / rel, target)
    return dest


def check(dest):
    return subprocess.run(
        ["python3", str(dest / "print/check_print.py")],
        capture_output=True, text=True, check=False,
    )


with tempfile.TemporaryDirectory(prefix="gs-v081-guard-") as tmp:
    parent = Path(tmp)
    old = fixture(parent, "old-reference")
    data = subprocess.run(
        ["git", "show", "569bdc7:print/out/reference.pdf"],
        cwd=ROOT, capture_output=True, check=True,
    ).stdout
    (old / "print/out/reference.pdf").write_bytes(data)
    result = check(old)
    assert result.returncode == 1, result.stdout + result.stderr
    assert result.stdout.count("MISMATCH") == 2, result.stdout
    for label in ["reference p2: Stance", "reference p2: CP West first"]:
        assert label + ": MISMATCH" in result.stdout, result.stdout
    print("PASS: old reference rejected with exactly the original two mismatches")

    single = fixture(parent, "single-card")
    pdf = single / "print/out/staff_cards.pdf"
    phrase = "CP +0.75 · Allies +1"
    with fitz.open(pdf) as doc:
        assert sum(page.get_text().count(phrase) for page in doc) == 6
        rects = doc[0].search_for(phrase)
        assert len(rects) == 2
        doc[0].add_redact_annot(rects[0], fill=(1, 1, 1))
        doc[0].apply_redactions()
        mutated = single / "mutated.pdf"
        doc.save(mutated)
    shutil.copy2(mutated, pdf)
    with fitz.open(pdf) as doc:
        assert sum(page.get_text().count(phrase) for page in doc) == 5
    result = check(single)
    assert result.returncode == 0, result.stdout + result.stderr
    assert "Staff cards: A thresholds: ok" in result.stdout
    print("CONFIRMED LOW GAP: one card's threshold is missing, but checker passes")
