/* ==========================================================================
   AC Cotton — site behaviour
   No dependencies, no build step. Loaded with `defer`.
   ========================================================================== */

(function () {
  "use strict";

  /* --- Mobile navigation -------------------------------------------------- */

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.dataset.open = String(open);
      document.body.style.overflow = open ? "hidden" : "";
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Any in-page link closes the panel behind it.
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // Leaving the mobile breakpoint must not strand a hidden-but-open panel.
    var mq = window.matchMedia("(min-width: 801px)");
    mq.addEventListener("change", function (e) {
      if (e.matches) setOpen(false);
    });
  }

  /* --- Header shadow on scroll -------------------------------------------- */

  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    var sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText = "position:absolute;top:0;height:1px;width:1px;";
    document.body.prepend(sentinel);

    new IntersectionObserver(function (entries) {
      header.dataset.scrolled = String(!entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* --- Active section in nav ---------------------------------------------- */

  function initScrollSpy() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll('.nav__link[href^="#"]')
    );
    if (!links.length) return;

    var byId = {};
    var sections = [];

    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      byId[id] = link;
      sections.push(section);
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var link = byId[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            links.forEach(function (l) { l.removeAttribute("aria-current"); });
            link.setAttribute("aria-current", "true");
          }
        });
      },
      // Trigger around the vertical middle of the viewport so the highlight
      // tracks what the reader is actually looking at.
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach(function (s) { observer.observe(s); });
  }

  /* --- Scroll reveal ------------------------------------------------------- */

  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    function revealAll() {
      items.forEach(function (el) { el.dataset.revealed = "true"; });
    }

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      revealAll();
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.dataset.revealed = "true";
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );

    items.forEach(function (el) { observer.observe(el); });

    // Last-resort safety net: nothing on this site may stay invisible because
    // an observer misbehaved.
    window.setTimeout(revealAll, 4000);
  }

  /* --- Demo reel players --------------------------------------------------- */

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) seconds = 0;
    var total = Math.floor(seconds);
    var m = Math.floor(total / 60);
    var s = total % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function initReels() {
    var reels = Array.prototype.slice.call(document.querySelectorAll(".reel"));
    if (!reels.length) return;

    var players = [];

    reels.forEach(function (reel) {
      var audio = reel.querySelector("audio");
      var playBtn = reel.querySelector(".reel__play");
      var seek = reel.querySelector(".reel__seek");
      var current = reel.querySelector("[data-time-current]");
      var duration = reel.querySelector("[data-time-duration]");
      if (!audio || !playBtn || !seek) return;

      var scrubbing = false;
      var title = reel.querySelector(".reel__title");
      var label = title ? title.textContent.trim() : "demo reel";

      function paint(ratio) {
        seek.style.setProperty("--progress", String(ratio));
      }

      function syncFromAudio() {
        var d = audio.duration;
        if (!isFinite(d) || d === 0) return;
        if (!scrubbing) {
          seek.value = String(audio.currentTime);
          paint(audio.currentTime / d);
          seek.setAttribute(
            "aria-valuetext",
            formatTime(audio.currentTime) + " of " + formatTime(d)
          );
        }
        if (current) current.textContent = formatTime(audio.currentTime);
      }

      // The slider is measured in seconds, not percent, so a single arrow key
      // press moves one second and PageUp/PageDown move a useful chunk. A
      // 0-100 percentage range would make each press a fraction of a second.
      function armSeek() {
        var d = audio.duration;
        if (!isFinite(d) || d <= 0) return;
        seek.max = String(d);
        seek.step = "1";
        seek.disabled = false;
        if (duration) duration.textContent = formatTime(d);
        syncFromAudio();
      }

      audio.addEventListener("loadedmetadata", armSeek);
      audio.addEventListener("durationchange", armSeek);

      audio.addEventListener("timeupdate", syncFromAudio);

      audio.addEventListener("play", function () {
        // Only one reel at a time.
        players.forEach(function (other) {
          if (other !== audio && !other.paused) other.pause();
        });
        reel.dataset.playing = "true";
        playBtn.setAttribute("aria-label", "Pause " + label);
      });

      audio.addEventListener("pause", function () {
        reel.dataset.playing = "false";
        playBtn.setAttribute("aria-label", "Play " + label);
      });

      audio.addEventListener("ended", function () {
        reel.dataset.playing = "false";
        audio.currentTime = 0;
        seek.value = "0";
        scrubbing = false;
        paint(0);
        if (current) current.textContent = formatTime(0);
        playBtn.setAttribute("aria-label", "Play " + label);
      });

      audio.addEventListener("error", function () {
        reel.dataset.error = "true";
        playBtn.disabled = true;
        seek.disabled = true;
        if (duration) duration.textContent = "unavailable";
      });

      playBtn.addEventListener("click", function () {
        if (audio.paused) {
          var attempt = audio.play();
          // Autoplay policies reject silently in some browsers; surface it.
          if (attempt && typeof attempt.catch === "function") {
            attempt.catch(function () { reel.dataset.playing = "false"; });
          }
        } else {
          audio.pause();
        }
      });

      // Scrub without fighting the timeupdate handler.
      seek.addEventListener("pointerdown", function () { scrubbing = true; });
      seek.addEventListener("keydown", function () { scrubbing = true; });

      seek.addEventListener("input", function () {
        var seconds = Number(seek.value);
        var d = audio.duration;
        if (!isFinite(d) || d <= 0) return;
        paint(seconds / d);
        seek.setAttribute(
          "aria-valuetext",
          formatTime(seconds) + " of " + formatTime(d)
        );
        if (current) current.textContent = formatTime(seconds);
      });

      seek.addEventListener("change", function () {
        if (isFinite(audio.duration)) audio.currentTime = Number(seek.value);
        scrubbing = false;
      });

      // A pointer drag that ends outside the slider still has to release it.
      window.addEventListener("pointerup", function () { scrubbing = false; });
      seek.addEventListener("blur", function () { scrubbing = false; });

      // Metadata may already be present from cache before listeners attached.
      if (audio.readyState >= 1) armSeek();

      paint(0);
      players.push(audio);
    });
  }

  /* --- Contact form -------------------------------------------------------- */

  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;

    var status = form.querySelector(".form__status");
    var submit = form.querySelector('[type="submit"]');
    var endpoint = form.getAttribute("action");

    // Until a real endpoint is wired up, let the browser do its thing
    // (mailto: or a plain GET) rather than swallowing the submission.
    if (!endpoint || endpoint.indexOf("http") !== 0) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      submit.disabled = true;
      if (status) {
        status.dataset.state = "pending";
        status.textContent = "Sending…";
      }

      fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed: " + res.status);
          form.reset();
          if (status) {
            status.dataset.state = "ok";
            status.textContent = "Thanks — your message is on its way.";
          }
        })
        .catch(function () {
          if (status) {
            status.dataset.state = "error";
            status.textContent =
              "Something went wrong. Please email hello@accotton.com directly.";
          }
        })
        .finally(function () {
          submit.disabled = false;
        });
    });
  }

  /* --- Boot ---------------------------------------------------------------- */

  function init() {
    initNav();
    initHeader();
    initScrollSpy();
    initReveal();
    initReels();
    initContactForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
