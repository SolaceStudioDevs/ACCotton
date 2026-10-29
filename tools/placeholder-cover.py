#!/usr/bin/env python3
"""Draw public/img/cover-tba-240.{jpg,webp} — the stand-in plate a credit uses
when a title is announced before there is any artwork for it.

Run from the repo root:  python tools/placeholder-cover.py

Deliberately carries no title: one plate serves every unannounced book, so the
next signing needs a content entry and nothing else.

Drawn with ffmpeg rather than Pillow — Pillow's compiled core is blocked by
Application Control on the machine this was written on. Drawn at 3x and
downsampled so the bars and the letterspacing stay clean at 240px. drawtext has
no tracking of its own, so each letter is placed individually at a position
measured from the font's own advance widths.

Needs: ffmpeg on PATH, fonttools, brotli.
"""
import pathlib, subprocess, tempfile

from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import decompress

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONTS = ROOT / "public" / "fonts"
OUT = ROOT / "public" / "img" / "cover-tba-240"

S = 3                        # supersample factor
W = 240 * S

# The share card's gradient and the favicon's bar colour, so the plate reads as
# part of the same set as the real covers around it.
TOP, BOT = "0x2C455D", "0x16222E"
BAR, INK, EDGE = "0x94BCE3", "0xEEF6FF", "0x416180"

tmp = pathlib.Path(tempfile.mkdtemp(prefix="placeholder-"))
ttf = tmp / "head.ttf"
decompress(str(FONTS / "wdxllubrifontjpn-400-latin.woff2"), str(ttf))

# ---------- type metrics ----------
font = TTFont(ttf)
upem = font["head"].unitsPerEm
cmap = font.getBestCmap()
hmtx = font["hmtx"]
ascent, descent = font["hhea"].ascent, font["hhea"].descent


def advance(ch, size):
    return hmtx[cmap[ord(ch)]][0] * size / upem


def tracked(text, size, cy, colour, track):
    """One drawtext per glyph, centred as a block on cy."""
    widths = [advance(ch, size) for ch in text]
    x = (W - (sum(widths) + track * (len(text) - 1))) / 2
    # drawtext's y is the top of the text box, which it sizes from the font's
    # own ascent and descent — so centring means offsetting by half of that.
    y = cy - (ascent - descent) * size / upem / 2
    out = []
    for ch, w in zip(text, widths):
        # Named relatively, with ffmpeg run from the font's own directory: a
        # Windows drive letter inside a filtergraph needs escaping that differs
        # between ffmpeg builds, and sidestepping it is cheaper than guessing.
        out.append(f"drawtext=fontfile={ttf.name}:text='{ch}'"
                   f":fontsize={size}:fontcolor={colour}"
                   f":x={x:.1f}:y={y:.1f}")
        x += w + track
    return out


# ---------- the brand mark's bars ----------
# The same five bars as favicon.svg, in its 32-unit coordinate space, scaled up
# and centred in the top half of the plate.
MARK = [(0, 10, 22), (6, 2, 30), (12, 6, 26), (22, 8, 24), (28, 12, 20)]
unit = W * 0.40 / 32
ox = (W - 32 * unit) / 2
oy = W * 0.30 - 16 * unit

chain = [
    f"drawbox=x={ox + x * unit:.1f}:y={oy + y0 * unit:.1f}"
    f":w={4 * unit:.1f}:h={(y1 - y0) * unit:.1f}:color={BAR}:t=fill"
    for x, y0, y1 in MARK
]
size = 26 * S
chain += tracked("COVER", size, W * 0.635, INK, 7 * S)
chain += tracked("TBA", size, W * 0.755, BAR, 7 * S)
# A hairline inset keeps the plate from bleeding into the dark page behind it.
chain.append(f"drawbox=x={1.5 * S}:y={1.5 * S}:w={W - 3 * S}:h={W - 3 * S}"
             f":color={EDGE}:t={S}")
chain.append("scale=240:240:flags=lanczos")

src = (f"gradients=s={W}x{W}:c0={TOP}:c1={BOT}"
       f":x0={W // 2}:y0=0:x1={W // 2}:y1={W}:type=linear:n=2")

for ext, args in (("jpg", ["-q:v", "2"]),
                  ("webp", ["-c:v", "libwebp", "-quality", "88",
                            "-compression_level", "6"])):
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                    "-f", "lavfi", "-i", src, "-vf", ",".join(chain),
                    "-frames:v", "1", *args, f"{OUT}.{ext}"],
                   check=True, cwd=tmp)
    p = pathlib.Path(f"{OUT}.{ext}")
    print(f"wrote {p}  {p.stat().st_size / 1024:.1f} KB")
