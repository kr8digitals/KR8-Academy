/* KR8 Academy — WhatsApp delivery.
 *
 * Two honest tiers, both built in:
 *
 * 1) Deep links (works today, zero setup): wa.me links open WhatsApp with the
 *    message pre-filled to the student's registered number. Perfect for nudges,
 *    reminders and celebrations — the admin taps send. No API key needed.
 *
 * 2) Automatic sends (turns on the moment credentials are set): POST to
 *    /api/send-whatsapp, backed by the WhatsApp Business Cloud API (Meta).
 *    Needs WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID in the server environment
 *    and a verified WhatsApp Business account with approved message templates.
 *    Until then the adapter answers 501 with setup steps — it never pretends a
 *    message went out.
 */

import { normalizePhone } from "./utils";

/** E.164-ish digits only, defaulting to Nigeria for local numbers starting with 0. */
export function waDigits(phone: string): string | null {
  const normalized = normalizePhone(phone);
  const digits = normalized.replace(/[^\d+]/g, "");
  if (!digits) return null;
  const raw = digits.startsWith("+") ? digits.slice(1) : digits;
  if (/^0\d{9,10}$/.test(raw)) return `234${raw.slice(1)}`;
  if (/^234\d{10}$/.test(raw)) return raw;
  if (/^\d{10,15}$/.test(raw)) return raw;
  return null;
}

export function buildWaLink(phone: string, text: string): string | null {
  const target = waDigits(phone);
  if (!target) return null;
  return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
}

export const NUDGE_PRESETS = [
  { id: "attendance", label: "Missed class", body: "Hey {first} — you missed the last KR8 Academy live session. Everything okay? Check the schedule and jump back in this week. We need you in the room. — KR8 Academy" },
  { id: "assignment", label: "Assignment pending", body: "Hey {first} — your assignment for week {week} is still open. Submit something — even a draft — and get feedback. Deadline is this week. — KR8 Academy" },
  { id: "certificate", label: "Certificate push", body: "Hey {first} — you are close to your certificate. Log in and finish what's left; the finish line is nearer than it feels. — KR8 Academy" },
  { id: "award", label: "Award push", body: "Hey {first} — the spotlight this month goes to the most consistent person in the room. Eight good weeks can change your life. Keep showing up. — KR8 Academy" },
] as const;

export function renderNudge(template: string, first: string, week?: number): string {
  return template.replaceAll("{first}", first).replaceAll("{week}", String(week ?? ""));
}

/** Automatic send via the WhatsApp Business Cloud API (through /api/send-whatsapp). */
export async function sendWhatsApp(input: { to: string; text: string }): Promise<{
  ok: boolean;
  error?: string;
  configured?: boolean;
}> {
  const digits = waDigits(input.to);
  if (!digits) return { ok: false, error: "That WhatsApp number is not valid." };
  try {
    const res = await fetch("/api/send-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: digits, text: input.text }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; configured?: boolean; detail?: string; error?: string };
    if (res.ok && data.ok) return { ok: true };
    return { ok: false, error: data.detail ?? data.error ?? `WhatsApp responded ${res.status}.`, configured: data.configured };
  } catch {
    return { ok: false, error: "WhatsApp could not be reached. Check your connection." };
  }
}

/** Server-side readiness probe used by the admin console. */
export async function whatsappStatus(): Promise<{ configured: boolean; detail?: string }> {
  try {
    const res = await fetch("/api/send-whatsapp", { method: "GET" });
    const data = (await res.json().catch(() => ({}))) as { configured?: boolean; detail?: string };
    return { configured: !!data.configured, detail: data.detail };
  } catch {
    return { configured: false };
  }
}
