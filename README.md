# ACCotton

Voice acting website for AC Cotton — [accotton.com](https://accotton.com)

A dependency-free static site. No build step, no framework, no `npm install`.
Open `index.html` in a browser and it works.

## Layout

```
index.html          Single-page site: hero, demos, services, about, studio,
                    clients, contact
404.html            Not-found page
_headers            Cloudflare Pages response headers (security + caching)
_redirects          Cloudflare Pages redirects — add legacy URLs here
robots.txt          Crawler rules
sitemap.xml         Sitemap
assets/css/tokens.css   Design tokens: every colour, size, font
assets/css/styles.css   Base styles + components
assets/js/site.js       Nav, scroll spy, reveal, audio players, contact form
assets/audio/           Demo reels
assets/img/             Headshot, social card, favicon
```

## Re-skinning

Colours, type, spacing, radii, and motion all resolve to CSS custom properties
in `assets/css/tokens.css`. Changing the look means editing that one file —
the markup and component styles don't hard-code any values.

A light theme is already stubbed under `:root[data-theme="light"]`; set
`data-theme="light"` on `<html>` to use it.

## Local preview

Any static server works. The site uses root-relative paths (`/assets/…`), so
serve from the project root rather than opening the file directly:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying to Cloudflare Pages

Connect the repo in the Cloudflare dashboard and use:

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Build command | *(leave empty)* |
| Build output directory | `/` |

Pages picks up `_headers` and `_redirects` automatically. Pushes to the
production branch deploy on their own; other branches get preview URLs.

## Outstanding work

Placeholder content is marked in the markup with `TODO(content)`,
`TODO(assets)`, and `TODO(setup)` comments. Find them with:

```sh
grep -rn "TODO(" index.html
```

Still to do:

- Replace all placeholder copy with AC's real bio, services, and stats
- Add demo reels to `assets/audio/` and the headshot to `assets/img/`
- Confirm the public contact address and real social links
- Point the contact form at a real endpoint (see `TODO(setup)` in `index.html`)
- Add legacy URL redirects from the old site to `_redirects`
