/* KR8 Academy — WhatsApp Business Cloud API adapter.
 *
 * Sends one WhatsApp message through Meta's Cloud API. Until the Academy sets
 * the two environment variables below, this endpoint answers 501 with setup
 * steps — it never pretends a message went out.
 *
 * Env:
 *   WHATSAPP_TOKEN           — permanent or temporary access token (Meta for Developers → WhatsApp → API setup)
 *   WHATSAPP_PHONE_NUMBER_ID — the phone-number ID (not the number itself) from the same API setup screen
 *   WHATSAPP_GRAPH_VERSION   — optional, default "v21.0"
 *
 * What you need on the Meta side (free tier exists — up to 1,000 service
 * conversations a month):
 *   1. A Meta for Developers app with the WhatsApp product added
 *   2. A verified WhatsApp Business Account + a registered business phone number
 *   3. Your token pasted into this Vercel project's environment variables
 *
 * Honest limit of free-form text: business-initiated messages are only
 * delivered inside a 24-hour customer-care window, or via an approved message
 * template outside it. For KR8's nudges outside the window, register a
 * template (e.g. "kr8_nudge") in Meta and send with type "template" instead.
 */

function isDigits(value: string): boolean {
  return /^\d{10,15}$/.test(value);
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    const configured = !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
    res.status(200).json({
      ok: true,
      configured,
      detail: configured
        ? "WhatsApp Business Cloud API is connected."
        : "Not connected yet. Add WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID to this project's environment variables, then redeploy.",
    });
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, detail: "GET status or POST message." });
    return;
  }
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    res.status(501).json({
      ok: false,
      configured: false,
      detail:
        "WhatsApp is not connected. Create a Meta for Developers app with the WhatsApp product, register a business number, then set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID in the Vercel project environment and redeploy.",
    });
    return;
  }
  let body: { to?: string; text?: string } = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
  } catch {
    res.status(400).json({ ok: false, detail: "Body must be JSON." });
    return;
  }
  const to = String(body.to ?? "").replace(/\D/g, "");
  const text = String(body.text ?? "").trim();
  if (!isDigits(to)) {
    res.status(400).json({ ok: false, detail: "to must be 10–15 digits (e.g. 2348012345678)." });
    return;
  }
  if (!text || text.length > 4000) {
    res.status(400).json({ ok: false, detail: "text is required (max 4000 chars)." });
    return;
  }
  const version = process.env.WHATSAPP_GRAPH_VERSION ?? "v21.0";
  try {
    const upstream = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
    });
    const data = (await upstream.json().catch(() => ({}))) as Record<string, any>;
    if (!upstream.ok) {
      const detail = data?.error?.message ?? `Meta responded ${upstream.status}. Business-initiated text sends require a 24h customer-care window or an approved template — check the API setup screen.`;
      res.status(upstream.status === 401 ? 502 : upstream.status).json({ ok: false, detail });
      return;
    }
    res.status(200).json({ ok: true, id: data?.messages?.[0]?.id ?? null });
  } catch {
    res.status(502).json({ ok: false, detail: "Could not reach Meta Graph API." });
  }
}
