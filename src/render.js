/* ==========================================================================
   HTML renderers. Every section is rendered to static markup at build time,
   so each route is a real, indexable page that works without JavaScript.
   ========================================================================== */

import * as C from "./content.js";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
           .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* --- Hub ------------------------------------------------------------------ */

function spokesSVG() {
  const { w, h, cx, cy } = C.stage;
  const parts = [
    `<ellipse cx="${cx}" cy="${cy}" rx="390" ry="210" fill="none"` +
    ` stroke="var(--color-accent-800)" stroke-width="1.5" stroke-dasharray="3 9"/>`,
  ];
  for (const n of C.nodes) {
    const dx = n.x - cx, dy = n.y - cy;
    const len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    const r = (v) => Math.round(v * 100) / 100;
    parts.push(
      `<line class="hub__spoke" data-node="${n.key}"` +
      ` x1="${r(cx + ux * 168)}" y1="${r(cy + uy * 168)}"` +
      ` x2="${r(n.x - ux * 118)}" y2="${r(n.y - uy * 118)}"/>`,
      `<circle class="hub__dot" data-node="${n.key}"` +
      ` cx="${r(n.x - ux * 112)}" cy="${r(n.y - uy * 112)}"/>`
    );
  }
  return `<svg class="hub__spokes" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"` +
         ` aria-hidden="true" focusable="false">${parts.join("")}</svg>`;
}

/* Unit vector for the mobile radial menu; CSS multiplies these by the
   ellipse radii to place each tile. */
function unit(ang) {
  const r = (ang * Math.PI) / 180;
  const round = (v) => Math.round(v * 1000) / 1000;
  return { fx: round(Math.cos(r)), fy: round(Math.sin(r)) };
}

function tile(n) {
  const variant = n.variant === "paper" ? "tile--paper" : "tile--steel";
  const size = n.titleSize ? `--title-size:${n.titleSize}px;` : "";
  const { fx, fy } = unit(n.ang);
  return `<a class="tile ${variant}" href="${C.routes[n.key]}" data-nav="${n.key}"` +
         ` data-ang="${n.ang}"` +
         ` style="--x:${n.x}px;--y:${n.y}px;--tile-w:${n.w}px;${size}--fx:${fx};--fy:${fy}">` +
         `<span class="tile__kicker">` +
           `<span class="tile__num">${esc(n.num)}</span>` +
           (n.note ? `<span class="tile__note">${esc(n.note)}</span>` : "") +
         `</span>` +
         `<span class="tile__title">${esc(n.title)}</span>` +
         `<span class="tile__desc">${esc(n.desc)}</span></a>`;
}

function portrait(sizes, cls, alt, loading) {
  return `<picture>` +
    `<source srcset="/img/headshot-${sizes}.webp" type="image/webp">` +
    `<img src="/img/headshot-${sizes}.jpg" alt="${esc(alt)}"${cls}` +
    ` loading="${loading}" decoding="async">` +
    `</picture>`;
}

export function hub() {
  return `<div class="hub">
  <header class="hub__head">
    <h1 class="hub__name">${esc(C.site.wordmark)}</h1>
    <p class="hub__role">${esc(C.site.role)}</p>
  </header>
  <div class="hub__stagewrap">
    <nav class="hub__stage" id="hub-stage" aria-label="Sections">
      ${spokesSVG()}
      <div class="hub__mspokes" aria-hidden="true">
        ${C.nodes.map((n) =>
          `<i data-node="${n.key}" style="--ang:${n.ang}deg"></i>`).join("\n        ")}
      </div>
      <div class="hub__aura"></div>
      <div class="hub__orbit"></div>
      <button class="hub__medallion" type="button" id="hub-trigger"
              aria-expanded="false" aria-controls="hub-stage"
              aria-label="Open the section menu">
        ${portrait("600", "", C.site.name, "eager")}
      </button>
      <p class="hub__hint" aria-hidden="true">Press and hold</p>
      ${C.nodes.map(tile).join("\n      ")}
    </nav>
  </div>
  <p class="hub__tagline">${esc(C.site.tagline)}</p>
</div>`;
}

/* --- Section chrome -------------------------------------------------------- */

function chrome(key, bodyHTML) {
  const i = C.order.indexOf(key);
  const prev = i > 0 ? C.order[i - 1] : "hub";
  const next = i < C.order.length - 1 ? C.order[i + 1] : "hub";
  return `<div class="section">
  <div class="bar">
    <a class="bar__menu" href="/" data-nav="hub">← Menu</a>
    <h1 class="bar__title">${esc(C.labels[key])}</h1>
    <div class="bar__steps">
      <a class="bar__step" href="${C.routes[prev]}" data-nav="${prev}">← ${esc(C.labels[prev])}</a>
      <a class="bar__step" href="${C.routes[next]}" data-nav="${next}">${esc(C.labels[next])} →</a>
    </div>
  </div>
  <main class="body body--${key}" id="main">
${bodyHTML}
  </main>
</div>`;
}

/* --- About ----------------------------------------------------------------- */

function about() {
  const a = C.about;
  const specs = a.specs.map((s, i) =>
    `<div class="spec${i === 0 ? " spec--dark" : ""}">
        <div class="spec__label">${esc(s.label)}</div>
        <div class="spec__value">${esc(s.value)}</div>
        <div class="spec__sub">${esc(s.sub)}</div>
      </div>`).join("\n      ");

  const groups = a.chipGroups.map((g) =>
    `<div class="chipgroup">
        <h6>${esc(g.heading)}</h6>
        <div class="chipgroup__list">${g.chips.map((c) =>
          `<span class="chip chip--${g.tone}">${esc(c)}</span>`).join("")}</div>
      </div>`).join("\n      ");

  return `    <div class="about">
      <div class="about__portrait">${portrait("900", "", C.site.name, "eager")}</div>
      <div class="about__col">
        <div class="about__lede">
          <h2>${esc(a.heading)}</h2>
          ${a.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("\n          ")}
        </div>
        <div class="specs">
      ${specs}
        </div>
        <div class="chipgroups">
      ${groups}
        </div>
        <div><a class="pill pill--dark" href="${C.routes.reels}" data-nav="reels">${esc(a.cta.label)}</a></div>
      </div>
    </div>`;
}

/* --- Demo reels ------------------------------------------------------------ */

/* Bar geometry matches the design: x = i*3, width 2, vertically centred. */
export function waveSVG(peaks, cls) {
  const n = peaks.length;
  const bars = peaks.map((v, i) =>
    `<rect x="${i * 3}" y="${Math.round((50 - v * 50) * 100) / 100}" width="2"` +
    ` height="${Math.round(Math.max(v * 100, 1.2) * 100) / 100}" rx="1"/>`).join("");
  return `<svg class="${cls}" viewBox="0 0 ${n * 3} 100" preserveAspectRatio="none"` +
         ` aria-hidden="true" focusable="false">${bars}</svg>`;
}

function reels(peaks) {
  const list = C.reels.map((r, i) => {
    const wave = waveSVG(peaks[r.file]["96"], "reel__wave");
    return `      <article class="reel" data-reel="${i}" data-file="${esc(r.file)}">
        <div class="reel__head">
          <span class="reel__n">${esc(r.n)}</span>
          <h3 class="reel__title">${esc(r.title)}</h3>
          <span class="chip reel__kicker">${esc(r.kicker)}</span>
          <span class="chip reel__tag">${esc(r.tag)}</span>
          <button class="reel__play" type="button"
                  aria-label="Play ${esc(r.title)}">Play</button>
        </div>
        <div class="reel__waveholder">${wave}</div>
        <div class="reel__meta">
          <span class="reel__time" aria-live="off">0:00 / —</span>
          <p class="reel__blurb">${esc(r.blurb)}</p>
        </div>
        <audio controls preload="none" src="/media/${esc(r.file)}.mp3"
               title="${esc(r.title)}"></audio>
      </article>`;
  }).join("\n");

  return `    <div class="reels__intro">
      <h2>${esc(C.reelsIntro.heading)}</h2>
      <p>${esc(C.reelsIntro.lede)}</p>
    </div>
    <div class="reels__list">
${list}
    </div>
    <div class="reels__ctas">
      <a class="pill pill--dark" href="${C.routes.contact}" data-nav="contact">Book a session</a>
      <a class="pill pill--light" href="${C.routes.credits}" data-nav="credits">See credits</a>
    </div>`;
}

/* --- Credits --------------------------------------------------------------- */

function credits() {
  const items = C.credits.items.map((c) => {
    const work = c.em ? `<em>${esc(c.work)}</em>` : esc(c.work);
    const trailer = c.trailer
      ? `\n            <a class="trailer" href="${esc(C.TRAILER_URL)}" target="_blank" rel="noreferrer">Watch the trailer →</a>`
      : "";
    return `      <article class="credit credit--${c.tone}">
        <span class="chip credit__medium">${esc(c.medium)}</span>
        <div>
          <div class="credit__titles">
            <span class="credit__title">${esc(c.role)}${work}</span>${trailer}
          </div>
          <div class="credit__meta">${esc(c.meta)}</div>
        </div>
        <div class="credit__status">${esc(c.status)}</div>
      </article>`;
  }).join("\n");

  return `    <h2>${esc(C.credits.heading)}</h2>
    <div class="credits">
${items}
    </div>
    <p class="credits__note">${esc(C.credits.footnote)}</p>`;
}

/* --- Rates ----------------------------------------------------------------- */

function rates() {
  const r = C.rates;
  const cards = r.cards.map((c) =>
    `      <article class="rate">
        <h3 class="rate__title">${esc(c.title)}</h3>
        <div class="rate__tiers">${c.tiers.map((t) =>
          `<div><div class="rate__figure">${esc(t.figure)}</div>` +
          `<div class="rate__unit">${esc(t.unit)}</div></div>`).join("")}</div>
      </article>`).join("\n");

  return `    <h2>${esc(r.heading)}</h2>
    <div class="rates">
      <article class="rate-hero">
        <div>
          <div class="rate-hero__label">${esc(r.hero.label)}</div>
          <div class="rate-hero__figure">${esc(r.hero.figure)}</div>
        </div>
        <div class="rate-hero__unit">${esc(r.hero.unit)}</div>
      </article>
${cards}
    </div>
    <section class="rates__custom">
      <h3>${esc(r.custom.title)}</h3>
      <p>${esc(r.custom.body)}</p>
    </section>
    <p style="margin-top:var(--space-8)">
      <a class="pill pill--dark" href="${C.routes.contact}" data-nav="contact">${esc(r.cta.label)}</a>
    </p>`;
}

/* --- Contact --------------------------------------------------------------- */

function contact() {
  const c = C.contact;
  const links = c.links.map((l) => {
    const ext = l.external ? ` target="_blank" rel="noreferrer"` : "";
    return `        <a class="clink${l.tone === "dark" ? " clink--dark" : ""}"` +
           ` href="${esc(l.href)}"${ext}>` +
           `<span class="clink__label">${esc(l.label)}</span>` +
           `<span class="clink__meta">${esc(l.meta)}</span></a>`;
  }).join("\n");

  const radios = c.form.types.map((t, i) =>
    `<label class="radio"><input type="radio" name="project_type" value="${esc(t)}"` +
    `${i === 0 ? " checked" : ""}> ${esc(t)}</label>`).join("\n            ");

  return `    <div class="contact">
      <div>
        <h2>${esc(c.heading)}</h2>
        <p class="contact__lede">${esc(c.lede)}</p>
        <div class="contact__links">
${links}
        </div>
      </div>

      <form class="brief" id="brief" method="post" action="/api/brief" novalidate>
        <div class="brief__label">${esc(c.form.label)}</div>
        <div class="brief__fields">
          <div class="visually-hidden" aria-hidden="true">
            <label for="f-company">Company</label>
            <input id="f-company" name="company" type="text" tabindex="-1" autocomplete="off">
          </div>
          <div class="field">
            <label class="field__label" for="f-name">Your name</label>
            <input id="f-name" name="name" type="text" placeholder="Name" required
                   autocomplete="name">
          </div>
          <div class="field">
            <label class="field__label" for="f-email">Email</label>
            <input id="f-email" name="email" type="email" placeholder="you@studio.com"
                   required autocomplete="email">
          </div>
          <fieldset class="field" style="border:0;padding:0;margin:0">
            <legend class="field__label" style="padding:0">Project type</legend>
            <div class="radios">
            ${radios}
            </div>
          </fieldset>
          <div class="field--pair">
            <div class="field">
              <label class="field__label" for="f-length">Length</label>
              <input id="f-length" name="length" type="text" placeholder="e.g. 8 finished hours">
            </div>
            <div class="field">
              <label class="field__label" for="f-deadline">Deadline</label>
              <input id="f-deadline" name="deadline" type="text" placeholder="e.g. mid-October">
            </div>
          </div>
          <div class="field">
            <label class="field__label" for="f-message">The read you are after</label>
            <textarea id="f-message" name="message" required
                      placeholder="Tone, characters, reference"></textarea>
          </div>
          <button class="brief__submit" type="submit">${esc(c.form.submit)}</button>
          <p class="brief__status" role="status" aria-live="polite"></p>
        </div>
      </form>
    </div>`;
}

/* --- Updates ---------------------------------------------------------------- */

function updates() {
  const u = C.updates;
  const posts = u.posts.map((p) => {
    const trailer = p.trailer
      ? `\n        <a class="post__trailer" href="${esc(C.TRAILER_URL)}" target="_blank" rel="noreferrer">Watch the trailer →</a>`
      : "";
    // Dates are not supplied yet; the line renders only once `date` is set.
    const date = p.date ? `\n        <div class="post__date">${esc(p.date)}</div>` : "";
    return `      <article class="post post--${p.tone}">
        <div class="post__chips">
          <span class="chip post__medium">${esc(p.medium)}</span>
          <span class="post__status">${esc(p.status)}</span>
        </div>${date}
        <h3 class="post__title">${p.title}</h3>
        <p class="post__body">${esc(p.body)}</p>${trailer}
      </article>`;
  }).join("\n");

  return `    <h2>${esc(u.heading)}</h2>
    <p class="updates__lede">${esc(u.lede)}</p>
    <div class="posts">
${posts}
    </div>`;
}

/* --- Page shell -------------------------------------------------------------- */

const SECTIONS = { about, reels, credits, rates, contact, updates };

export function page(key, peaks, assets) {
  const m = C.meta[key];
  const isHub = key === "hub";
  const inner = isHub ? hub()
    : chrome(key, key === "reels" ? reels(peaks) : SECTIONS[key]());

  // The reels page renders its own peak data so the expanded waveform can be
  // drawn client-side without an extra request.
  const peakData = key === "reels"
    ? `\n<script type="application/json" id="peaks">${JSON.stringify(peaks)}</script>`
    : "";

  const canonical = C.site.origin + C.routes[key];

  const ld = isHub ? `\n<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: C.site.name,
    jobTitle: "Voice Actor & Narrator",
    url: C.site.origin + "/",
    email: "mailto:" + C.site.email,
    image: C.site.origin + "/img/headshot-900.jpg",
    sameAs: C.contact.links.filter((l) => l.external).map((l) => l.href),
  })}</script>` : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(m.title)}</title>
<meta name="description" content="${esc(m.description)}">
<link rel="canonical" href="${esc(canonical)}">

<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(C.site.name)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:title" content="${esc(m.title)}">
<meta property="og:description" content="${esc(m.description)}">
<meta property="og:image" content="${esc(C.site.origin)}/img/headshot-900.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#1d2d3d">

<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/barlowcondensed-600-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/barlow-400-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${assets.css}">${ld}
<script>document.documentElement.dataset.js="on"</script>
<script src="${assets.js}" type="module"></script>
</head>
<body data-view="${key}">
<a class="skip-link" href="#main">Skip to content</a>
<div id="view">
${inner}
</div>${peakData}
</body>
</html>
`;
}
