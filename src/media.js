/* ==========================================================================
   Range support for the demo reels.

   The static asset store answers a `Range:` request with the whole file and
   a 200. A media element that cannot get a 206 has an empty `seekable`, so
   setting `currentTime` silently does nothing and click-to-scrub is dead.

   This slices the range itself when the asset store won't. If the store ever
   starts honouring ranges the 206 passes straight through untouched.
   ========================================================================== */

const RANGE = /^bytes=(\d*)-(\d*)$/;

export async function serveMedia(request, env) {
  const res = await env.ASSETS.fetch(request);
  const range = request.headers.get("Range");

  // Advertise seekability even on a plain response; some browsers check this
  // before they will attempt a range request at all.
  if (!range) {
    if (res.headers.get("Accept-Ranges")) return res;
    const headers = new Headers(res.headers);
    headers.set("Accept-Ranges", "bytes");
    return new Response(res.body, { status: res.status, headers });
  }

  // Already handled upstream, or an error we should not rewrite.
  if (res.status !== 200) return res;

  const m = RANGE.exec(range.trim());
  if (!m) return res;

  const body = await res.arrayBuffer();
  const size = body.byteLength;

  let start = m[1] === "" ? NaN : Number(m[1]);
  let end = m[2] === "" ? NaN : Number(m[2]);

  if (Number.isNaN(start)) {
    // Suffix form: the last N bytes.
    if (Number.isNaN(end) || end <= 0) return res;
    start = Math.max(0, size - end);
    end = size - 1;
  } else if (Number.isNaN(end)) {
    end = size - 1;
  }
  end = Math.min(end, size - 1);

  if (!Number.isFinite(start) || start > end || start >= size) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${size}`, "Accept-Ranges": "bytes" },
    });
  }

  const headers = new Headers(res.headers);
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  headers.set("Accept-Ranges", "bytes");

  return new Response(body.slice(start, end + 1), { status: 206, headers });
}
