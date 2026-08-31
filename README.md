# ACCotton

[accotton.com](https://accotton.com) — the site of A.C. Cotton, voice actor and narrator.

A wheel-and-spoke portfolio: visitors land on a dark hub with the headshot as
a medallion and six section tiles orbiting it on drawn spokes. Choosing a tile
fires a waveform wipe and reveals that section.

Built from the `design_handoff_accotton_wheel` package. Static output, no
runtime dependencies, deployed on Cloudflare Pages.

## Running it

```sh
node build.js            # build into dist/
node build.js --serve    # build, then serve dist/ on http://localhost:8000
```

Node 18+. There is nothing to install — the build script uses only the standard
library.

## Layout

```
build.js                 Static site generator; renders one page per route
src/content.js           ALL site copy and data — edit this to change content
src/render.js            HTML renderers for the hub and the six sections
src/assets/styles.css    Design tokens + every component style
src/assets/fonts.css     Self-hosted Barlow @font-face rules
src/assets/app.js        Wipe router, reel players, form validation
functions/api/brief.js   Contact form handler (Cloudflare Pages Function)
public/                  Copied verbatim into dist/ (media, images, fonts, headers)
tools/generate-peaks.py  Decodes the reels into waveform peak data
tools/fetch-fonts.py     Re-downloads the self-hosted font subsets
dist/                    Build output — generated, not committed
```

### Routes

Each section is a real, separately rendered HTML file with its own `<title>`
and meta description, so it can be linked, shared and indexed:

`/` `/about/` `/reels/` `/credits/` `/rates/` `/contact/` `/updates/`

The wipe transition is an enhancement layered on top: `app.js` intercepts
internal links, fetches the target page, plays the wipe, and swaps the view.
With JavaScript off, those same links are ordinary navigation and every page
still works — including the reels, which fall back to native `<audio controls>`.

## Changing content

Almost everything lives in `src/content.js`: copy, reel metadata, credits,
rates, contact links, update posts, and the hub tile coordinates.

**The rate figures are contractual — don't change them without A.C.'s say-so.**

### Adding or replacing a demo reel

1. Drop the mp3 into `public/media/` (the filename becomes the `file` key).
2. Add or edit the entry in the `reels` array in `src/content.js`.
3. Regenerate the waveform data:
   ```sh
   python3 tools/generate-peaks.py public/media public/data/waveforms.json
   ```
   Requires `pip install miniaudio`.

Peaks are decoded from the real audio, so clicking a waveform to scrub lands
where the listener expects. They're emitted at both bar counts the design uses
(96 collapsed, 134 expanded) and inlined into the reels page at build time.

### Re-skinning

Every colour, space and shadow resolves to a custom property in the `:root`
block at the top of `src/assets/styles.css`. That block is the Industry design
system's token set; component rules below it reference the tokens only.

## Deploying to Cloudflare Pages

| Setting | Value |
| --- | --- |
| Build command | `node build.js` |
| Build output directory | `dist` |
| Node version | 18 or newer |

`public/_headers` and `public/_redirects` are copied into `dist/` and picked up
automatically. `functions/` is detected by Pages without configuration.

### Contact form

`functions/api/brief.js` validates the brief and emails it via
[Resend](https://resend.com). Set these in Settings → Environment variables:

| Variable | Required | Default |
| --- | --- | --- |
| `RESEND_API_KEY` | yes | — |
| `BRIEF_TO` | no | `narration@accotton.com` |
| `BRIEF_FROM` | no | `site@accotton.com` — must be a verified sender |

Until `RESEND_API_KEY` is set the endpoint returns 501 and the form tells the
visitor to email directly, so a message is never silently dropped. The form
also carries a hidden honeypot field for spam.

Pages Functions do not run under `node build.js --serve`; use `wrangler pages
dev dist` to exercise the endpoint locally.

## Outstanding

- **The mobile wheel is not signed off.** The handoff flagged it as undesigned
  and asked for confirmation. Below 700px the six tiles become a full-width
  vertical index with the medallion as a header, which is the direction the
  handoff named — but it needs A.C.'s approval, or a proper design.
- **Update posts have no dates.** `src/content.js` supports a `date` field per
  post and renders it above the heading; nothing shows until one is set.
- Add legacy URLs from the previous site to `public/_redirects`.
- `assets/*` is not fingerprinted, so it's cached for an hour rather than
  immutably. Worth hashing the filenames if the CSS starts changing often.
