#!/usr/bin/env python3
"""Re-download the self-hosted font subsets into public/fonts/.

Run from the repo root. Rewrites src/assets/fonts.css to point at the local
files. Only the Latin subsets are kept — the site has no other scripts.

Two families, fetched differently:

  Barlow / Barlow Condensed — Google labels each @font-face with a subset
  comment, so the blocks are picked by name.

  WDXL Lubrifont JP N — a Japanese family served as 123 unlabelled faces
  split by unicode-range, with no subset comments to match on, so the Latin
  faces are identified by their ranges instead. Self-hosting these matters:
  left to Google, the browser resolves chunks lazily and can end up rendering
  Latin headings in a fallback face instead of this one.
"""
import os, pathlib, re, subprocess

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/120.0 Safari/537.36")

BARLOW = ("https://fonts.googleapis.com/css2?"
          "family=Barlow:wght@400;500;700&family=Barlow+Condensed:wght@600&display=swap")
WDXL = ("https://fonts.googleapis.com/css2?"
        "family=WDXL+Lubrifont+JP+N&display=swap")

# The two ranges carrying Latin text; the other 121 faces in the JP family
# are CJK and would be dead weight.
LATIN_MARKERS = {"U+0000-00FF": "latin", "U+0100-02BA": "latin-ext"}


def fetch(url):
    return subprocess.run(["curl", "-sS", "-A", UA, url],
                          capture_output=True, text=True, check=True).stdout


os.makedirs("public/fonts", exist_ok=True)
out, seen = [], {}


def emit(block, subset):
    url = re.search(r"url\((https://fonts\.gstatic\.com/[^)]+)\)", block).group(1)
    fam = re.search(r"font-family: '([^']+)'", block).group(1).replace(" ", "")
    wt = re.search(r"font-weight: (\d+)", block).group(1)
    name = f"{fam.lower()}-{wt}-{subset}.woff2"
    if url not in seen:
        subprocess.run(["curl", "-sS", "-o", f"public/fonts/{name}", url], check=True)
        seen[url] = name
        print(f"  {name}")
    out.append(block.replace(url, f"/fonts/{seen[url]}"))


# --- Barlow: subset comments are present, match on them ---------------------
for subset, block in re.findall(r"/\* (\S+) \*/\s*(@font-face \{.*?\})", fetch(BARLOW), re.S):
    if subset in ("latin", "latin-ext"):
        emit(block, subset)

# --- WDXL: no comments, so match on the unicode-range itself ----------------
for block in re.findall(r"@font-face \{.*?\}", fetch(WDXL), re.S):
    ranges = re.search(r"unicode-range: ([^;]+);", block).group(1).strip()
    for marker, subset in LATIN_MARKERS.items():
        if ranges.startswith(marker):
            emit(block, subset)
            break

header = ("/* Self-hosted Barlow, Barlow Condensed and WDXL Lubrifont JP N\n"
          "   (Latin subsets only). Regenerate with tools/fetch-fonts.py.\n"
          "   All three are licensed under the SIL Open Font License. */\n\n")
pathlib.Path("src/assets/fonts.css").write_text(header + "\n".join(out) + "\n")
print("wrote src/assets/fonts.css")
