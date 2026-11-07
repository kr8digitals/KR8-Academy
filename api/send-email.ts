/* KR8 Academy — transactional email relay.
 *
 * Sends mail through Resend. No database, no stored state. Until the Academy
 * creates its Resend account and sets RESEND_API_KEY (and verifies the sending
 * domain), this endpoint answers 501 with { configured: false } and the client
 * falls back to a pre-filled draft — it never pretends an email went out.
 *
 * Env:
 *   RESEND_API_KEY   — required (create free account at resend.com)
 *   RESEND_FROM      — optional, default "KR8 Academy <academy@kr8digitals.com>";
 *                      the domain must be verified in Resend or sends will fail.
 */

type Body = { to?: string | string[]; subject?: string; html?: string; text?: string };

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, detail: "POST only." });
    return;
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(501).json({
      ok: false,
      configured: false,
      detail:
        "Resend is not configured. Create a Resend account, verify the sending domain, then set RESEND_API_KEY in the Vercel project environment.",
    });
    return;
  }
  let body: Body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
  } catch {
    res.status(400).json({ ok: false, detail: "Body must be JSON." });
    return;
  }
  const recipients = Array.isArray(body.to) ? body.to : body.to ? [body.to] : [];
  const clean = Array.from(new Set(recipients.map((r) => String(r).trim().toLowerCase()))).filter(isEmail);
  if (clean.length === 0) {
    res.status(400).json({ ok: false, detail: "Provide at least one valid recipient." });
    return;
  }
  if (clean.length > 100) {
    res.status(400).json({ ok: false, detail: "Refusing to send to more than 100 recipients in one call." });
    return;
  }
  const subject = String(body.subject ?? "").trim().slice(0, 200);
  const html = String(body.html ?? "").slice(0, 100_000);
  if (!subject || (!html && !body.text)) {
    res.status(400).json({ ok: false, detail: "subject and html (or text) are required." });
    return;
  }
  const from = process.env.RESEND_FROM ?? "KR8 Academy <academy@kr8digitals.com>";

  try {
    const upstream = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: clean.length === 1 ? clean[0] : clean,
        subject,
        html: html || undefined,
        text: body.text ? String(body.text) : undefined,
      }),
    });
    const data = (await upstream.json().catch(() => ({}))) as Record<string, unknown>;
    if (!upstream.ok) {
      res.status(upstream.status).json({
        ok: false,
        detail: typeof data.message === "string" ? data.message : `Resend responded ${upstream.status}.`,
      });
      return;
    }
    res.status(200).json({ ok: true, id: data.id ?? null, recipients: clean.length });
  } catch {
    res.status(502).json({ ok: false, detail: "Could not reach Resend. Try again shortly." });
  }
}
