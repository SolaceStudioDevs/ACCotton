# Design brief — the brand waveform

**For:** whoever is drawing the mark
**Site:** [accotton.com](https://accotton.com) — A.C. Cotton, audiobook narrator and character voice actor
**Repo:** `SolaceStudioDevs/ACCotton`
**Date:** 3 October 2026

---

## 1. What we're asking for

A **single waveform tile**, drawn as an SVG, that becomes the site's repeating
rule. It replaces a placeholder I generated from an arbitrary list of bar
heights — functional, but it says nothing. We want one that is specifically
*his*.

The waveform is the brand device. The site sells a voice, the reels already
draw real audio, and a rule made of a waveform is the one ornament that isn't
decoration — it's the product.

## 2. Where it appears

Two places today, both decorative, both using the same tile:

| Placement | Rendered size | Repeats | Colour | Opacity |
|---|---|---|---|---|
| Under every section title (`.section h2::after`) | 128 × 13 px | ~3 tiles, clipped | `--color-accent-500` `#749dc4` | 0.6 |
| Along the top edge of the footer (`.foot::before`) | full width × 12 px | up to ~45 tiles | `--color-accent-600` `#597ea3` | 0.4 |

At narrow widths the heading rule drops to **96 × 11 px**.

**Out of scope:** the demo reels page draws *real* waveforms, computed from
each recording's actual envelope by `tools/generate-peaks.py` (96 bars
collapsed, 134 expanded). Those are data, not branding, and they stay as they
are. The new mark should feel like it belongs beside them without pretending
to be one.

## 3. How it's implemented — this constrains the artwork

The tile is a **CSS mask**, not an image:

```css
background-color: var(--color-accent-600);
mask: var(--wave-svg) repeat-x left center / auto 100%;
```

The SVG supplies **shape only**. Colour comes from CSS, so the same tile works
in any accent and any opacity, and it will adapt if the palette changes.

This means:

- **Only the alpha channel survives.** Fill everything solid. Any colour in the
  file is discarded.
- **No gradients, no strokes, no filters, no opacity inside the SVG.** A
  semi-transparent shape becomes a semi-transparent mask, which reads as a
  muddy bar rather than a soft one.
- **Must tile seamlessly on the horizontal.** The right edge has to meet the
  left edge with the same rhythm — no doubled gap, no collision. Test it
  repeated twenty times, not twice.
- **Height is scaled, width is not.** The mask is sized `auto 100%`, so the
  tile is scaled to the rule's height and repeated along its width. Draw it at
  whatever viewBox is convenient; it will be squashed to 12px tall.

### The current placeholder, for reference

`viewBox="0 0 192 24"` — 32 bars, one every 6px, each 3px wide with `rx="1.5"`,
vertically centred, heights running 6 → 24 in a pattern with no meaning behind
it. It lives as a single data URI in the `--wave-svg` custom property at the
top of `src/assets/styles.css`.

**Swapping it is a one-line change.** Hand back an SVG; replacing that one
property is the entire integration.

## 4. What would make it good

**It has to survive 12 pixels.** This is the hard part. Most of the time this
mark is a 12px-tall strip seen at a glance. Fine detail, thin gaps and subtle
height variation all disappear. Design *at* the rendered size and scale up, not
the reverse.

**It should read as speech, not as a meter.** Even bars at even spacing read as
a graphic equaliser — a stock audio cliché. Speech has a different shape:
clusters, sharp onsets, decaying tails, and real silence between phrases.
Asymmetry is what will distinguish it.

**It should survive being clipped.** Under headings it is cut off mid-tile at
128px. There's no "beginning" or "end" to compose toward; any horizontal slice
has to look deliberate.

**One idea worth considering.** We can derive the tile from an actual recording
— the envelope of A.C. saying his own name, or a line from one of the
published books. The tooling for this already exists in the repo
(`tools/generate-peaks.py` turns audio into normalised bar heights), so a real
envelope can be handed over as a starting point rather than invented. A mark
that is literally his voice is a better story than one that merely looks like a
voice. Ask and it can be generated.

## 5. Deliverables

1. **The tile** as an optimised SVG — single path or a group of rects, no
   metadata, no editor cruft, viewBox present, no `width`/`height` attributes.
2. **A seam test**: the tile repeated across 1200px at 12px tall, so we can
   see the join.
3. **The source file**, in whatever you drew it in.
4. Confirmation of **licensing** — this becomes the site's identity, so it
   needs to be ours to use.

Optional, if it helps the mark work harder: a **short variant** for the heading
rule, denser or more characterful than the one that tiles 45 times along the
footer. Two tiles are easy to support.

## 6. Acceptance checklist

- [ ] Renders correctly as a mask — shape only, nothing colour-dependent
- [ ] Tiles seamlessly at 20+ repeats with no visible seam
- [ ] Legible and characterful at **12px** tall
- [ ] Any 128px horizontal slice looks intentional
- [ ] Reads clearly on `#16222e` at 40% opacity in `#597ea3`
- [ ] Doesn't read as a generic equaliser
- [ ] Sits comfortably beside the real reel waveforms without competing

## 7. Brand reference

**Palette** — accents, light to dark:

| Token | Hex | Used for |
|---|---|---|
| `--color-accent-200` | `#d6ebff` | Highlights, pill faces |
| `--color-accent-300` | `#b5d9fd` | Rate figures, emphasis |
| `--color-accent-500` | `#749dc4` | Heading rule |
| `--color-accent-600` | `#597ea3` | Footer rule |
| `--color-accent-700` | `#416180` | Card surfaces |
| `--color-accent-900` | `#1d2d3d` | Nav bar, dark cards |
| `--color-bg` | `#16222e` | Page background |

Pages are dark. The hub homepage is a navy radial gradient with a faint grain
overlay.

**Type** — headings are **WDXL Lubrifont JP N** (wide, squared, mechanical,
single weight). Body is **Space Grotesk**. Both self-hosted. The mark should
sit with squared, technical letterforms rather than soft ones.

**Tone** — the site is dry and plainspoken, not slick. The voice work spans
folklore horror, a memoir, Hermetic non-fiction and a medieval RPG, so the mark
should stay genre-neutral: it's a voice, not a mood.

## 8. Questions to settle before drawing

1. One tile or two (footer vs heading)?
2. Derive from a real recording, or draw it?
3. Should the mark also work standalone — a favicon, a social avatar, a stamp
   on an audio deliverable — or is the repeating rule its only job? That changes
   whether it needs a composed, finite version as well as a tiling one.
