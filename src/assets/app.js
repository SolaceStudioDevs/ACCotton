/* ==========================================================================
   accotton.com — client behaviour

   Every route is a real page, so this layer is enhancement only: it
   intercepts internal navigation to play the waveform wipe, and upgrades
   the reel players from native <audio controls> to the designed UI.
   With JavaScript off, links navigate and the audio elements still play.
   ========================================================================== */

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
const root = document.documentElement;

root.dataset.js = "on";

/* --- Hub: fit the stage, light up spokes on hover ------------------------- */

function initHub(scope) {
  const stage = scope.querySelector(".hub__stage");
  if (!stage) return null;

  // Matches the design's fit: reserve 28px horizontally and 128px vertically
  // for the wordmark and tagline, then clamp.
  const fit = () => {
    const byW = (window.innerWidth - 28) / 1080;
    const byH = (window.innerHeight - 128) / 480;
    root.style.setProperty("--hub-zoom",
      String(Math.max(0.4, Math.min(1.45, byW, byH))));
  };
  fit();
  window.addEventListener("resize", fit, { passive: true });

  const paint = (key, on) => {
    scope.querySelectorAll(`[data-node="${key}"]`)
      .forEach((el) => el.classList.toggle("is-hot", on));
  };
  scope.querySelectorAll(".tile[data-nav]").forEach((tile) => {
    const key = tile.dataset.nav;
    tile.addEventListener("pointerenter", () => paint(key, true));
    tile.addEventListener("pointerleave", () => paint(key, false));
    tile.addEventListener("focus", () => paint(key, true));
    tile.addEventListener("blur", () => paint(key, false));
  });

  const stopRadial = initRadial(scope, stage);

  return () => {
    window.removeEventListener("resize", fit);
    stopRadial();
  };
}

/* --- Mobile radial menu ----------------------------------------------------
   Press the medallion and the six tiles fan out around it; drag toward one
   and it highlights; release and it opens. Releasing without a direction
   latches the menu open so the tiles can simply be tapped, which is also
   what a plain tap does — the gesture is a shortcut, never the only way in.
   -------------------------------------------------------------------------- */

const RADIAL_MQ = "(max-width: 700px)";
const DEAD_ZONE = 50;   // px from centre before a drag counts as a direction

function initRadial(scope, stage) {
  const trigger = scope.querySelector("#hub-trigger");
  if (!trigger) return () => {};

  const mq = window.matchMedia(RADIAL_MQ);
  const tiles = Array.from(stage.querySelectorAll(".tile[data-nav]"));

  let selected = null;
  let dragging = false;
  let openedFromLatched = false;

  const isLatched = () => stage.dataset.latched === "true";

  const select = (key) => {
    if (selected === key) return;
    selected = key;
    tiles.forEach((t) => t.classList.toggle("is-hot", t.dataset.nav === key));
    // A short tick makes the sector boundary findable without looking.
    if (key && navigator.vibrate) { try { navigator.vibrate(8); } catch { /* ignore */ } }
  };

  const setOpen = (open, latched = false) => {
    stage.dataset.open = String(open);
    stage.dataset.latched = String(open && latched);
    trigger.setAttribute("aria-expanded", String(open));
    trigger.setAttribute("aria-label",
      open ? "Close the section menu" : "Open the section menu");
    if (!open) select(null);
  };

  /* Nearest tile by bearing. Six sectors 60 degrees apart, so past the dead
     zone the nearest is always within 30 degrees — no direction can miss. */
  const pick = (clientX, clientY) => {
    const box = trigger.getBoundingClientRect();
    const dx = clientX - (box.left + box.width / 2);
    const dy = clientY - (box.top + box.height / 2);
    if (Math.hypot(dx, dy) < DEAD_ZONE) return null;

    const bearing = (Math.atan2(dy, dx) * 180) / Math.PI;
    let best = null;
    let bestDelta = Infinity;
    for (const tile of tiles) {
      const delta = Math.abs(
        ((Number(tile.dataset.ang) - bearing + 540) % 360) - 180);
      if (delta < bestDelta) { bestDelta = delta; best = tile.dataset.nav; }
    }
    return best;
  };

  const onDown = (e) => {
    if (!mq.matches || e.button > 0) return;
    e.preventDefault();
    openedFromLatched = isLatched();
    dragging = true;
    try { trigger.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    setOpen(true, false);
  };

  const onMove = (e) => {
    if (!dragging) return;
    select(pick(e.clientX, e.clientY));
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    if (selected) {
      const key = selected;
      setOpen(false);
      go(ROUTES[key], LABELS[ROUTES[key]]);
    } else if (openedFromLatched) {
      setOpen(false);           // second tap closes it again
    } else {
      setOpen(true, true);      // tapped without a direction — leave it open
    }
  };

  const onCancel = () => { dragging = false; setOpen(false); };

  const onDocDown = (e) => {
    if (!isLatched()) return;
    if (e.target.closest("#hub-trigger") || e.target.closest(".tile")) return;
    setOpen(false);
  };

  const onKey = (e) => {
    if (e.key === "Escape" && stage.dataset.open === "true") {
      setOpen(false);
      trigger.focus();
      return;
    }
    if (e.target !== trigger) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    setOpen(!isLatched(), !isLatched());
  };

  // On desktop the medallion is decoration, so it should not be focusable or
  // announced as a control.
  const sync = () => {
    trigger.disabled = !mq.matches;
    if (!mq.matches) setOpen(false);
  };
  sync();
  mq.addEventListener("change", sync);

  trigger.addEventListener("pointerdown", onDown);
  trigger.addEventListener("pointermove", onMove);
  trigger.addEventListener("pointerup", onUp);
  trigger.addEventListener("pointercancel", onCancel);
  document.addEventListener("pointerdown", onDocDown);
  // Bound on the document only: bound on the trigger as well, a keypress
  // there would run the toggle twice and land back where it started.
  document.addEventListener("keydown", onKey);

  return () => {
    mq.removeEventListener("change", sync);
    document.removeEventListener("pointerdown", onDocDown);
    document.removeEventListener("keydown", onKey);
  };
}

/* --- Demo reels ------------------------------------------------------------ */

const fmt = (x) => {
  if (!isFinite(x) || x < 0) x = 0;
  const m = Math.floor(x / 60);
  const s = Math.floor(x % 60);
  return m + ":" + String(s).padStart(2, "0");
};

function initReels(scope) {
  const list = scope.querySelectorAll(".reel");
  if (!list.length) return;

  let peaks = {};
  const node = document.getElementById("peaks");
  if (node) { try { peaks = JSON.parse(node.textContent); } catch { /* keep synthetic */ } }

  const players = [];
  let active = null;

  const drawWave = (reel, count) => {
    const data = peaks[reel.dataset.file];
    const svg = reel.querySelector(".reel__wave");
    if (!data || !data[count] || !svg) return;
    const vals = data[count];
    svg.setAttribute("viewBox", `0 0 ${vals.length * 3} 100`);
    svg.innerHTML = vals.map((v, i) =>
      `<rect x="${i * 3}" y="${(50 - v * 50).toFixed(2)}" width="2"` +
      ` height="${Math.max(v * 100, 1.2).toFixed(2)}" rx="1"/>`).join("");
  };

  const paintProgress = (reel, ratio) => {
    const rects = reel.querySelectorAll(".reel__wave rect");
    const n = rects.length;
    for (let i = 0; i < n; i++) {
      rects[i].classList.toggle("is-played", (i + 0.5) / n <= ratio);
    }
  };

  list.forEach((reel) => {
    const audio = reel.querySelector("audio");
    const btn = reel.querySelector(".reel__play");
    const holder = reel.querySelector(".reel__waveholder");
    const time = reel.querySelector(".reel__time");
    const title = reel.querySelector(".reel__title").textContent.trim();
    if (!audio || !btn || !holder) return;

    // Only now that the handlers below exist does the waveform become a
    // real control.
    holder.setAttribute("role", "button");
    holder.setAttribute("tabindex", "0");
    holder.setAttribute("aria-label", `Play or seek within ${title}`);

    const p = { reel, audio, btn, time, title };
    players.push(p);

    const setLabel = () => {
      const isActive = active === p;
      const label = !isActive ? "Play" : audio.paused ? "Resume" : "Pause";
      btn.textContent = label;
      btn.setAttribute("aria-label", `${label} ${title}`);
    };
    p.setLabel = setLabel;

    const showTime = () => {
      if (!time) return;
      time.textContent = fmt(audio.currentTime) + " / " +
        (isFinite(audio.duration) && audio.duration ? fmt(audio.duration) : "—");
    };

    const activate = () => {
      if (active === p) return;
      if (active) {
        active.audio.pause();
        active.reel.classList.remove("is-active");
        drawWave(active.reel, "96");
        paintProgress(active.reel, 0);
        active.setLabel();
      }
      active = p;
      reel.classList.add("is-active");
      drawWave(reel, "134");
    };
    p.activate = activate;

    btn.addEventListener("click", () => {
      if (active !== p) {
        activate();
        audio.currentTime = 0;
        audio.play().catch(setLabel);
      } else if (audio.paused) {
        audio.play().catch(setLabel);
      } else {
        audio.pause();
      }
      setLabel();
    });

    const seekFrom = (clientX) => {
      const b = holder.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - b.left) / b.width));
      if (isFinite(audio.duration) && audio.duration) {
        audio.currentTime = ratio * audio.duration;
        paintProgress(reel, ratio);
        showTime();
      }
    };

    // Clicking an inactive reel's waveform starts it; the active one seeks.
    holder.addEventListener("click", (e) => {
      if (active !== p) {
        activate();
        audio.currentTime = 0;
        audio.play().catch(setLabel);
        setLabel();
      } else {
        seekFrom(e.clientX);
      }
    });

    holder.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); btn.click(); return; }
      if (active !== p || !isFinite(audio.duration)) return;
      const step = e.key === "ArrowRight" ? 5 : e.key === "ArrowLeft" ? -5 : 0;
      if (!step) return;
      e.preventDefault();
      audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + step));
      showTime();
    });

    audio.addEventListener("timeupdate", () => {
      if (active !== p || !isFinite(audio.duration) || !audio.duration) return;
      paintProgress(reel, audio.currentTime / audio.duration);
      showTime();
    });
    audio.addEventListener("loadedmetadata", showTime);
    audio.addEventListener("play", setLabel);
    audio.addEventListener("pause", setLabel);
    audio.addEventListener("ended", () => {
      audio.currentTime = 0;
      paintProgress(reel, 0);
      showTime();
      setLabel();
    });
    audio.addEventListener("error", () => {
      btn.disabled = true;
      btn.textContent = "Unavailable";
      if (!reel.querySelector(".reel__error")) {
        const msg = document.createElement("p");
        msg.className = "reel__error";
        msg.textContent = "This reel could not be loaded.";
        reel.appendChild(msg);
      }
    });

    showTime();
    setLabel();
  });

  // Leaving the listening room stops playback.
  return () => players.forEach((p) => p.audio.pause());
}

/* --- Contact form ----------------------------------------------------------- */

function initForm(scope) {
  const form = scope.querySelector("#brief");
  if (!form) return;

  const status = form.querySelector(".brief__status");
  const submit = form.querySelector(".brief__submit");

  const showError = (field, message) => {
    const wrap = field.closest(".field");
    let err = wrap.querySelector(".field__error");
    if (!err) {
      err = document.createElement("span");
      err.className = "field__error";
      wrap.appendChild(err);
    }
    err.textContent = message;
    field.setAttribute("aria-invalid", "true");
  };

  const clearError = (field) => {
    const wrap = field.closest(".field");
    const err = wrap && wrap.querySelector(".field__error");
    if (err) err.remove();
    field.removeAttribute("aria-invalid");
  };

  const validate = () => {
    const checks = [
      ["name", (v) => v.trim() ? "" : "Please tell me your name."],
      ["email", (v) => !v.trim() ? "Please add an email address."
        : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "That email address doesn't look right."],
      ["message", (v) => v.trim() ? "" : "A sentence on the read you want is enough."],
    ];
    let first = null;
    for (const [name, check] of checks) {
      const field = form.elements[name];
      const message = check(field.value);
      if (message) { showError(field, message); first = first || field; }
      else clearError(field);
    }
    return first;
  };

  form.querySelectorAll("input, textarea").forEach((el) => {
    el.addEventListener("input", () => clearError(el));
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const bad = validate();
    if (bad) { bad.focus(); return; }

    submit.disabled = true;
    status.textContent = "Sending…";

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) {
          let detail = "";
          try {
            const body = await res.json();
            detail = body.error || "";
          } catch { /* not JSON */ }
          throw new Error(detail || `The server returned ${res.status}.`);
        }
        form.innerHTML =
          '<div class="brief__done"><h3>Brief received.</h3>' +
          "<p>Thanks — I'll come back to you shortly.</p></div>";
      })
      .catch((err) => {
        submit.disabled = false;
        // Say what actually failed rather than "something went wrong"; the
        // mailto stays as the way out either way.
        const said = document.createElement("span");
        said.textContent = err && err.message ? err.message : "Something went wrong.";
        status.textContent = "";
        status.append(said, " Please email ");
        const link = document.createElement("a");
        link.href = "mailto:narration@accotton.com";
        link.textContent = "narration@accotton.com";
        status.append(link, " directly.");
      });
  });
}

/* --- The waveform wipe ------------------------------------------------------- */

/* Seeded PRNG from the design prototype — the wipe's ragged edge is
   decoration, not audio, so it stays synthetic and deterministic. */
function rng(seed) {
  let a = seed * 9301 + 49297;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function amps(seed, n) {
  const r = rng(seed);
  const out = [];
  for (let i = 0; i < n; i++) {
    const env = Math.pow(Math.sin((Math.PI * (i + 0.5)) / n), 0.4);
    const gust = 0.55 + 0.45 * Math.sin(i / (n / 9) + seed);
    out.push(0.1 + 0.9 * env * gust * (0.45 + 0.55 * r()));
  }
  return out;
}

const EDGE = amps(11, 46);

function makeWipe(label) {
  const el = document.createElement("div");
  el.className = "wipe";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML =
    `<div class="wipe__edge">${EDGE.map((v) =>
      `<i style="width:${(5 + v * 64).toFixed(1)}px"></i>`).join("")}</div>` +
    `<span class="wipe__label">${label}</span>`;
  return el;
}

/* --- Router ------------------------------------------------------------------ */

let teardown = null;
let navigating = false;

function mount(scope) {
  if (teardown) { teardown(); teardown = null; }
  const stops = [initHub(scope), initReels(scope)].filter(Boolean);
  initForm(scope);
  teardown = () => stops.forEach((stop) => stop());
}

function swap(html, url) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const view = doc.getElementById("view");
  const current = document.getElementById("view");
  if (!view || !current) { location.href = url; return; }

  current.replaceWith(view);
  document.title = doc.title;
  document.body.dataset.view = doc.body.dataset.view;

  const desc = doc.querySelector('meta[name="description"]');
  const here = document.querySelector('meta[name="description"]');
  if (desc && here) here.setAttribute("content", desc.getAttribute("content"));

  // The reels page ships its own peak data.
  const incoming = doc.getElementById("peaks");
  const existing = document.getElementById("peaks");
  if (existing) existing.remove();
  if (incoming) document.body.appendChild(incoming);

  mount(view);
  window.scrollTo(0, 0);
}

async function go(url, label, push = true) {
  if (navigating) return;
  navigating = true;

  const fetching = fetch(url, { headers: { "X-Requested-With": "fetch" } })
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))));

  if (reduced.matches) {
    try {
      const html = await fetching;
      if (push) history.pushState({}, "", url);
      swap(html, url);
    } catch { location.href = url; return; }
    finally { navigating = false; }
    return;
  }

  const overlay = makeWipe(label);
  overlay.dataset.phase = "in";
  document.body.appendChild(overlay);

  const html = await fetching.catch(() => null);
  if (html === null) { location.href = url; return; }

  // Swap under cover of the panel, then let it exit.
  await new Promise((r) => setTimeout(r, 430));
  if (push) history.pushState({}, "", url);
  swap(html, url);
  overlay.dataset.phase = "out";

  await new Promise((r) => setTimeout(r, 450));
  overlay.remove();
  navigating = false;
}

const LABELS = {
  "/": "Menu", "/about/": "About", "/reels/": "Demo Reels",
  "/credits/": "Credits", "/rates/": "Rates",
  "/contact/": "Contact", "/updates/": "Updates",
};

const ROUTES = {
  hub: "/", about: "/about/", reels: "/reels/", credits: "/credits/",
  rates: "/rates/", contact: "/contact/", updates: "/updates/",
};

document.addEventListener("click", (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey ||
      e.shiftKey || e.altKey) return;

  const link = e.target.closest("a[href]");
  if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return;
  if (!(url.pathname in LABELS)) return;
  if (url.pathname === location.pathname) { e.preventDefault(); return; }

  e.preventDefault();
  go(url.pathname, LABELS[url.pathname]);
});

window.addEventListener("popstate", () => {
  go(location.pathname, LABELS[location.pathname] || "Menu", false);
});

mount(document);
