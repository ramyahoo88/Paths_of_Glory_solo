#!/usr/bin/env python3
"""Independent PDF mutation controls for the per-card checker at 04a4734.

Requires PyMuPDF, Poppler's pdfinfo/pdftotext, and the repository's Git history.
Uses temporary copies only; does not need Chrome or modify shipped PDFs.
Run from any directory: python3 /path/to/this/script.py
"""
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

import fitz

ROOT = Path(__file__).resolve().parents[3]
FILES = [
    "print/check_print.py", "sim/bot.js", "app/build_app.js",
    "print/out/rules.pdf", "print/out/reference.pdf", "print/out/staff_cards.pdf",
]
THRESHOLDS = ["CP +0.75 · Allies +1", "CP +1.5 · Allies +1.75", "CP +2.25 · Allies +2.5"]
STANCES = ["Assault", "Press", "Hold"]


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


def mutate(dest, card, kind):
    pdf = dest / "print/out/staff_cards.pdf"
    page_number = ((card - 1) // 6) * 2
    row = ((card - 1) % 6) // 3
    stance = (card - 1) % 3
    phrase = STANCES[stance] if kind == "wrong-stance" else THRESHOLDS[stance]
    with fitz.open(pdf) as doc:
        page = doc[page_number]
        matches = sorted(page.search_for(phrase), key=lambda r: (r.y0, r.x0))
        assert len(matches) == 2, (card, phrase, matches)
        rect = matches[row]
        if kind != "duplicate":
            page.add_redact_annot(rect, fill=(1, 1, 1))
            page.apply_redactions()
        if kind == "stale":
            assert card == 5
            page.insert_text((rect.x0, rect.y1 - 1), "CP +0.75 · Allies +1.75", fontname="helv", fontsize=7.5)
        elif kind == "wrong-stance":
            page.insert_text((rect.x0, rect.y1 - 1), "Press", fontname="helv", fontsize=12)
        elif kind == "duplicate":
            page.insert_text((rect.x0, rect.y1 + 8), phrase, fontname="helv", fontsize=7.5)
        elif kind != "missing":
            raise AssertionError(kind)
        altered = dest / "altered.pdf"
        doc.save(altered)
    shutil.copy2(altered, pdf)


def require_card_failure(dest, card, label):
    result = check(dest)
    named = re.findall(r"^  card (\d+):", result.stdout, flags=re.M)
    assert result.returncode == 1 and named == [str(card)], result.stdout + result.stderr
    assert result.stdout.count("MISMATCH") == 1, result.stdout
    print(f"PASS {label}: rejected; only card {card} named")


with tempfile.TemporaryDirectory(prefix="gs-per-card-04a4734-") as tmp:
    parent = Path(tmp)
    result = check(fixture(parent, "current"))
    assert result.returncode == 0 and "ok (18 cards)" in result.stdout, result.stdout + result.stderr
    print("PASS current release: all 18 cards accepted")

    old = fixture(parent, "old-reference")
    data = subprocess.run(
        ["git", "show", "569bdc7:print/out/reference.pdf"],
        cwd=ROOT, capture_output=True, check=True,
    ).stdout
    (old / "print/out/reference.pdf").write_bytes(data)
    result = check(old)
    assert result.returncode == 1 and result.stdout.count("MISMATCH") == 2, result.stdout + result.stderr
    for label in ["reference p2: Stance", "reference p2: CP West first"]:
        assert label + ": MISMATCH" in result.stdout, result.stdout
    print("PASS old reference: rejected; exactly the original two page-2 mismatches")

    for card in range(1, 19):
        dest = fixture(parent, f"missing-{card}")
        mutate(dest, card, "missing")
        require_card_failure(dest, card, f"missing threshold on card {card}")

    for kind, card in [("stale", 5), ("wrong-stance", 3), ("duplicate", 2)]:
        dest = fixture(parent, f"{kind}-{card}")
        mutate(dest, card, kind)
        require_card_failure(dest, card, kind)

print("PASS 23 independent PDF controls")
