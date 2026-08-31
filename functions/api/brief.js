/* ==========================================================================
   POST /api/brief — contact form handler (Cloudflare Pages Function)

   Configure in the Pages project (Settings → Environment variables):

     RESEND_API_KEY   required, from https://resend.com/api-keys
     BRIEF_TO         where briefs are delivered   (default narration@accotton.com)
     BRIEF_FROM       a verified sender on your domain
                                                   (default site@accotton.com)

   Without RESEND_API_KEY the endpoint returns 501 and the form falls back to
   telling the visitor to email directly, so the page never silently swallows
   a message.
   ========================================================================== */

const MAX = { name: 120, email: 200, length: 120, deadline: 120, message: 5000 };

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const clean = (v, cap) => String(v ?? "").trim().slice(0, cap);

export async function onRequestPost({ request, env }) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: "Expected form data." });
  }

  // Honeypot: a real person never fills a field they cannot see. Answer 200
  // so a bot has nothing to learn from the response.
  if (clean(form.get("company"), 100)) return json(200, { ok: true });

  const data = {
    name: clean(form.get("name"), MAX.name),
    email: clean(form.get("email"), MAX.email),
    type: clean(form.get("project_type"), 60),
    length: clean(form.get("length"), MAX.length),
    deadline: clean(form.get("deadline"), MAX.deadline),
    message: clean(form.get("message"), MAX.message),
  };

  const errors = {};
  if (!data.name) errors.name = "Required.";
  if (!data.email) errors.email = "Required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Invalid.";
  if (!data.message) errors.message = "Required.";
  if (Object.keys(errors).length) return json(422, { errors });

  const key = env.RESEND_API_KEY;
  if (!key) {
    return json(501, { error: "Mail delivery is not configured on this deployment." });
  }

  const to = env.BRIEF_TO || "narration@accotton.com";
  const from = env.BRIEF_FROM || "site@accotton.com";

  const rows = [
    ["Name", data.name],
    ["Email", data.email],
    ["Project type", data.type || "—"],
    ["Length", data.length || "—"],
    ["Deadline", data.deadline || "—"],
  ];
  const esc = (s) => String(s).replace(/[<>&]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `accotton.com <${from}>`,
      to: [to],
      reply_to: data.email,
      subject: `Project brief — ${data.name}${data.type ? ` (${data.type})` : ""}`,
      text: rows.map(([k, v]) => `${k}: ${v}`).join("\n") +
            `\n\nThe read they are after:\n${data.message}\n`,
      html:
        rows.map(([k, v]) => `<p><strong>${k}:</strong> ${esc(v)}</p>`).join("") +
        `<p><strong>The read they are after:</strong></p>` +
        `<p style="white-space:pre-wrap">${esc(data.message)}</p>`,
    }),
  });

  if (!res.ok) {
    // Surface nothing from the provider to the client, but keep it in the logs.
    console.error("resend failed", res.status, await res.text());
    return json(502, { error: "Could not send the brief." });
  }

  return json(200, { ok: true });
}

/* Anything other than POST on this path. */
export const onRequest = ({ request }) =>
  request.method === "POST"
    ? undefined
    : new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
