#!/usr/bin/env node
/* ==========================================================================
   Static site generator.

   Renders one real HTML file per route so every section is independently
   linkable and indexable, then copies assets over. No dependencies.

     node build.js            build into dist/
     node build.js --serve    build, then serve dist/ on :8000
   ========================================================================== */

import { readFile, writeFile, mkdir, rm, cp, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { page } from "./src/render.js";
import { routes } from "./src/content.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, "dist");

async function dirSize(dir) {
  let total = 0;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    total += e.isDirectory() ? await dirSize(p) : (await stat(p)).size;
  }
  return total;
}

const kb = (n) => (n / 1024).toFixed(1) + "KB";

async function build() {
  const started = Date.now();

  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  const peaks = JSON.parse(
    await readFile(path.join(ROOT, "public/data/waveforms.json"), "utf8")
  );

  // One file per route. "/" is dist/index.html; "/about/" is
  // dist/about/index.html, which Cloudflare Pages serves at the clean URL.
  for (const [key, route] of Object.entries(routes)) {
    const html = page(key, peaks);
    const out = route === "/"
      ? path.join(DIST, "index.html")
      : path.join(DIST, route.replace(/^\/|\/$/g, ""), "index.html");
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, html);
    console.log(`  ${route.padEnd(11)} → ${path.relative(ROOT, out).padEnd(26)} ${kb(Buffer.byteLength(html))}`);
  }

  // 404 reuses the hub shell but must not be indexed.
  const notFound = page("hub", peaks)
    .replace("<title>", '<meta name="robots" content="noindex">\n<title>');
  await writeFile(path.join(DIST, "404.html"), notFound);

  await cp(path.join(ROOT, "public"), DIST, { recursive: true });
  await cp(path.join(ROOT, "src/assets"), path.join(DIST, "assets"), { recursive: true });

  // waveforms.json is inlined into the reels page; no need to ship it twice.
  await rm(path.join(DIST, "data"), { recursive: true, force: true });

  await writeFile(path.join(DIST, "sitemap.xml"), sitemap());

  console.log(`\n  dist: ${kb(await dirSize(DIST))} in ${Date.now() - started}ms`);
}

function sitemap() {
  const origin = "https://accotton.com";
  const urls = Object.values(routes).map((r) =>
    `  <url><loc>${origin}${r}</loc><changefreq>monthly</changefreq>` +
    `<priority>${r === "/" ? "1.0" : "0.8"}</priority></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

await build();

if (process.argv.includes("--serve")) {
  const { createServer } = await import("node:http");
  const TYPES = {
    ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8", ".json": "application/json",
    ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg",
    ".mp3": "audio/mpeg", ".woff2": "font/woff2", ".xml": "application/xml",
  };

  createServer(async (req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    let file = path.join(DIST, url);
    if (url.endsWith("/")) file = path.join(file, "index.html");
    if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
    let status = 200;
    if (!existsSync(file)) { file = path.join(DIST, "404.html"); status = 404; }

    const body = await readFile(file);
    const type = TYPES[path.extname(file)] || "application/octet-stream";
    // Range support so <audio> can seek, the way a real static host does.
    const range = req.headers.range;
    if (range && /^bytes=/.test(range)) {
      const [s, e] = range.replace("bytes=", "").split("-");
      const start = s ? +s : 0;
      const end = e ? +e : body.length - 1;
      res.writeHead(206, {
        "Content-Type": type,
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes ${start}-${end}/${body.length}`,
        "Content-Length": end - start + 1,
      }).end(body.subarray(start, end + 1));
      return;
    }
    res.writeHead(status, { "Content-Type": type, "Accept-Ranges": "bytes" }).end(body);
  }).listen(8000, () => console.log("  serving dist/ on http://localhost:8000"));
}
