# ACCotton

[accotton.com](https://accotton.com) — the site of A.C. Cotton, voice actor and narrator.

A wheel-and-spoke portfolio: visitors land on a dark hub with the headshot as
a medallion and six section tiles orbiting it on drawn spokes. Choosing a tile
fires a waveform wipe and reveals that section.

Built from the `design_handoff_accotton_wheel` package. Static output,
deployed on Cloudflare Workers with static assets.

## Running it

```sh
node build.js            # build into dist/
node build.js --serve    # build, then serve dist/ on http://localhost:8000
```

Node 18+. The build script uses only the standard library; `wrangler` is the
one dev dependency and is only needed to run or deploy the Worker:

```sh
npm install
npx wrangler dev      # serve dist/ through the real Worker on :8787
npx wrangler deploy   # build and deploy
```

## Layout

```
build.js                 Static site generator; renders one page per route
src/content.js           ALL site copy and data — edit this to change content
src/render.js            HTML renderers for the hub and the six sections
src/assets/styles.css    Design tokens + every component style
src/assets/fonts.css     Self-hosted Barlow @font-face rules
src/assets/app.js        Wipe router, reel players, form validation
src/worker.js            Worker entry — routes /api/brief, else static assets
src/api/brief.js         Contact form handler
wrangler.jsonc           Cloudflare Workers config (build command, assets)
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

## Deploying

The Cloudflare project (`accotton`) is a **Worker**, not a Pages project.
Everything it needs is in `wrangler.jsonc`:

- `build.command` runs `node build.js`, so `dist/` exists before deploy
- `assets.directory` points at `dist/`
- `assets.not_found_handling` serves `dist/404.html` with a real 404
- `assets.run_worker_first` routes `/api/*` to the Worker; without it the
  asset router would answer the contact form with the 404 page

`public/_headers` and `public/_redirects` are copied into `dist/` and applied
by the asset store.

Pushes to the connected branch build and deploy automatically. To deploy by
hand: `npx wrangler deploy`.

### Contact form

`src/api/brief.js` validates the brief and emails it via
[Resend](https://resend.com). Set these under Settings → Variables and Secrets
(`RESEND_API_KEY` as a secret):

| Variable | Required | Default |
| --- | --- | --- |
| `RESEND_API_KEY` | yes | — |
| `BRIEF_TO` | no | `narration@accotton.com` |
| `BRIEF_FROM` | no | `site@accotton.com` — must be a verified sender |

Until `RESEND_API_KEY` is set the endpoint returns 501 and the form tells the
visitor to email directly, so a message is never silently dropped. The form
also carries a hidden honeypot field for spam.

`node build.js --serve` serves the static files only. To exercise the
endpoint, run `npx wrangler dev` — that boots the real Worker.

## Outstanding

- **The mobile wheel is not signed off.** The handoff flagged it as undesigned
  and asked for confirmation. Below 700px the six tiles become a full-width
  vertical index with the medallion as a header, which is the direction the
  handoff named — but it needs A.C.'s approval, or a proper design.
- **Update posts have no dates.** `src/content.js` supports a `date` field per
  post and renders it above the heading; nothing shows until one is set.
- Add legacy URLs from the previous site to `public/_redirects`.
- **Confirm range requests work on the deployed reels.** Under `wrangler dev`
  the local asset server answers `Range:` with a `200` and the whole file, and
  click-to-scrub does not move the playhead as a result. Cloudflare's edge is
  expected to return `206` in production, but this has not been verified
  against a real deployment. Check it once the site is live:

  ```sh
  curl -sI -H "Range: bytes=0-99" https://accotton.com/media/loup-garou.mp3 | head -3
  # want: HTTP/2 206  +  content-range: bytes 0-99/11292128
  ```

  If it returns `200`, add `/media/*` to `assets.run_worker_first` and handle
  `Range` in `src/worker.js` — everything else stays as it is.
- The reels are 192kbps stereo (41MB total). Re-encoding the spoken-word
  tracks to mono ~96kbps would cut that roughly fourfold with no audible
  loss — worth doing when an encoder is to hand.
- `assets/*` is not fingerprinted, so it's cached for an hour rather than
  immutably. Worth hashing the filenames if the CSS starts changing often.
