#!/usr/bin/env python3
"""Re-download the self-hosted Barlow subsets into public/fonts/.

Run from the repo root. Rewrites src/assets/fonts.css to point at the local
files. Only the Latin subsets are kept — the site has no other scripts.
"""
import os, pathlib, re, subprocess

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/120.0 Safari/537.36")
URL = ("https://fonts.googleapis.com/css2?"
       "family=Barlow:wght@400;500;700&family=Barlow+Condensed:wght@600&display=swap")

css = subprocess.run(["curl", "-sS", "-A", UA, URL],
                     capture_output=True, text=True, check=True).stdout

blocks = re.findall(r"/\* (\S+) \*/\s*(@font-face \{.*?\})", css, re.S)
keep = [(s, b) for s, b in blocks if s in ("latin", "latin-ext")]

os.makedirs("public/fonts", exist_ok=True)
out, seen = [], {}
for subset, block in keep:
    url = re.search(r"url\((https://fonts\.gstatic\.com/[^)]+)\)", block).group(1)
    fam = re.search(r"font-family: '([^']+)'", block).group(1).replace(" ", "")
    wt = re.search(r"font-weight: (\d+)", block).group(1)
    name = f"{fam.lower()}-{wt}-{subset}.woff2"
    if url not in seen:
        subprocess.run(["curl", "-sS", "-o", f"public/fonts/{name}", url], check=True)
        seen[url] = name
        print(f"  {name}")
    out.append(block.replace(url, f"/fonts/{seen[url]}"))

header = ("/* Self-hosted Barlow + Barlow Condensed (Latin subsets only).\n"
          "   Regenerate with tools/fetch-fonts.py. Licensed under the SIL Open\n"
          "   Font License; see https://fonts.google.com/specimen/Barlow. */\n\n")
pathlib.Path("src/assets/fonts.css").write_text(header + "\n".join(out) + "\n")
print("wrote src/assets/fonts.css")
