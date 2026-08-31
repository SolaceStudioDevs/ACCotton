/* ==========================================================================
   Worker entry point.

   Static assets are served by the asset store ahead of this script; only
   paths listed under `assets.run_worker_first` in wrangler.jsonc reach here
   first. Everything else falls through to env.ASSETS.
   ========================================================================== */

import { handleBrief } from "./api/brief.js";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/brief") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: { Allow: "POST" },
        });
      }
      return handleBrief(request, env);
    }

    // Not an API route — hand back to static assets, which applies
    // not_found_handling (dist/404.html) when nothing matches.
    return env.ASSETS.fetch(request);
  },
};
