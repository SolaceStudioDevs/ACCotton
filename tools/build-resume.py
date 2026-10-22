#!/usr/bin/env python3
"""Rebuild public/AC-Cotton-Voice-Resume.pdf, typeset in the site's own fonts.

Run from the repo root:  python tools/build-resume.py

One page on purpose: casting people skim and forward, and a second page gets
lost. The script prints where the content ends so an overflow is obvious.

Fonts come from public/fonts/, the same woff2 files the site serves, converted
on the fly. Space Grotesk ships as a single variable file and ReportLab cannot
vary an axis, so the weights are instanced from it here — embedding the
variable file directly would render every weight at its 300 default and the
bold would quietly disappear.

Needs: reportlab, fonttools, brotli.
"""
import pathlib, tempfile

from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import decompress
from fontTools.varLib import instancer
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont as RLFont
from reportlab.pdfgen import canvas

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONTS = ROOT / "public" / "fonts"
OUT = ROOT / "public" / "AC-Cotton-Voice-Resume.pdf"

# ---------- fonts ----------
tmp = pathlib.Path(tempfile.mkdtemp(prefix="resume-fonts-"))
decompress(str(FONTS / "wdxllubrifontjpn-400-latin.woff2"), str(tmp / "head.ttf"))
decompress(str(FONTS / "spacegrotesk-var-latin.woff2"), str(tmp / "body-var.ttf"))
for wght, name in ((400, "body.ttf"), (500, "body-md.ttf"), (700, "body-bd.ttf")):
    instancer.instantiateVariableFont(TTFont(tmp / "body-var.ttf"), {"wght": wght}).save(tmp / name)

pdfmetrics.registerFont(RLFont("Head", tmp / "head.ttf"))
pdfmetrics.registerFont(RLFont("Body", tmp / "body.ttf"))
pdfmetrics.registerFont(RLFont("Body-Md", tmp / "body-md.ttf"))
pdfmetrics.registerFont(RLFont("Body-Bd", tmp / "body-bd.ttf"))

# ---------- palette, matching the site ----------
INK = (0x1d / 255, 0x2d / 255, 0x3d / 255)
MUTED = (0x5d / 255, 0x5d / 255, 0x60 / 255)
RULE = (0xb7 / 255, 0xb7 / 255, 0xba / 255)
ACCENT = (0x41 / 255, 0x61 / 255, 0x80 / 255)

W, H = LETTER
M = 0.72 * inch
RIGHT = W - M

c = canvas.Canvas(str(OUT), pagesize=LETTER)
c.setTitle("A.C. Cotton — Voice Actor & Narrator — Resume")
c.setAuthor("A.C. Cotton")
c.setSubject("Audiobook narration and character voice acting resume")

y = H - M - 6


def rule(gap_above=12, gap_below=14):
    global y
    y -= gap_above
    c.setStrokeColorRGB(*RULE)
    c.setLineWidth(0.6)
    c.line(M, y, RIGHT, y)
    y -= gap_below


def heading(text):
    global y
    y -= 4
    c.setFillColorRGB(*ACCENT)
    c.setFont("Body-Bd", 9.2)
    c.drawString(M, y, text.upper())
    y -= 13


def entry(title, detail=None, note=None):
    """A credit: bold title, grey detail alongside, note underneath."""
    global y
    c.setFillColorRGB(*INK)
    c.setFont("Body-Bd", 10.4)
    c.drawString(M + 10, y, title)
    if detail:
        w = c.stringWidth(title, "Body-Bd", 10.4)
        c.setFillColorRGB(*MUTED)
        c.setFont("Body", 10)
        c.drawString(M + 10 + w + 6, y, detail)
    y -= 13
    if note:
        c.setFillColorRGB(*MUTED)
        c.setFont("Body", 9.6)
        c.drawString(M + 10, y, note)
        y -= 13.5
    else:
        y -= 1.5


def wrapped(text, size=9.8, color=MUTED, indent=10, leading=13.2, font="Body"):
    global y
    maxw = RIGHT - (M + indent)
    c.setFillColorRGB(*color)
    c.setFont(font, size)
    cur = ""
    for word in text.split():
        trial = (cur + " " + word).strip()
        if c.stringWidth(trial, font, size) <= maxw:
            cur = trial
        else:
            c.drawString(M + indent, y, cur)
            y -= leading
            cur = word
    if cur:
        c.drawString(M + indent, y, cur)
        y -= leading


# ---------- header ----------
c.setFillColorRGB(*INK)
c.setFont("Head", 27)
c.drawString(M, y, "A.C. COTTON")
c.setFont("Body-Md", 10)
c.setFillColorRGB(*ACCENT)
c.drawRightString(RIGHT, y + 6, "VOICE ACTOR & NARRATOR")
y -= 17
c.setFillColorRGB(*MUTED)
c.setFont("Body", 9.4)
c.drawString(M, y, "Baritone  ·  Fredericksburg, Virginia  ·  Non-union  ·  Audio Publishers Association member")
y -= 13
c.setFillColorRGB(*INK)
c.setFont("Body-Md", 9.4)
c.drawString(M, y, "accotton.com")
c.setFillColorRGB(*MUTED)
c.setFont("Body", 9.4)
w = c.stringWidth("accotton.com", "Body-Md", 9.4)
c.drawString(M + w + 8, y, "·  narration@accotton.com  ·  acx.com/narrator?p=AH452LR18HLKW")
rule(gap_above=12, gap_below=14)

# ---------- credits ----------
heading("Audiobook narration")
entry("Loup-Garou", "— Kevin Schumacher",
      "Folklore horror · 9 hrs 57 mins · released October 2026 · Audible")
entry("The Book of Wisdom: The Hidden Order Behind All Things", "— Elias Thorne",
      "Esoteric non-fiction · 6 hrs 26 mins · released October 2026 · Audible")
entry("Shadows of Ascension", "— Jeremy Clowers",
      "Science fiction · four-book series · in production")
rule()

heading("Video game voice")
entry("Knight's Path", "— NPC voice actor",
      "Story-driven medieval action RPG · character and dialect work across the cast · in production")
rule()

heading("Demo reels")
wrapped("Five long-form samples at accotton.com — Loup-Garou (folklore & horror), The Book of Wisdom "
        "(reflective & literary), His Hand-Me-Down Countess (historical romance), Knife Point "
        "(suspense & thriller), Hunting for My Obsession (long-form narration).")
rule()

heading("Accents & dialects")
wrapped("Irish · British RP · Cockney · American Southern · American Midwest · Boston · Transatlantic · "
        "Australian · Indian · Mexican", color=INK, size=10)
y -= 3
heading("Range")
wrapped("Solo and multi-character audiobook narration · character and villain voices · video game VO · "
        "commercial VO · corporate and e-learning narration", color=INK, size=10)
rule()

heading("Home studio & delivery")
wrapped("Shure MV7+ (USB-C / XLR hybrid dynamic) in a quiet home recording space. Every file delivered to "
        "ACX specification — RMS between -23 and -18 dB, peak under -3 dB, noise floor below -60 dB, "
        "192 kbps CBR MP3 at 44.1 kHz. Multiple takes supplied as standard; fast turnaround.")
rule()

heading("Training & background")
wrapped("Licensed Virginia public school educator with 8+ years of professional speaking and instructional "
        "delivery — sustained vocal work, adapting tone and pacing to an audience, and making complex "
        "material clear. Directly applicable to non-fiction, corporate and e-learning narration.")
y -= 2
wrapped("B.S., IT Security — Western Governors University", color=INK, size=10)

# ---------- footer ----------
c.setFillColorRGB(*RULE)
c.setFont("Body", 8)
c.drawCentredString(W / 2, M - 16, "accotton.com  ·  narration@accotton.com")

print(f"content ends at y={y:.1f}; bottom margin is {M:.1f} "
      f"({'FITS' if y > M else 'OVERFLOWS'})")

c.showPage()
c.save()
print("wrote", OUT)
