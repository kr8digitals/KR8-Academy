/* KR8 Academy — WhatsApp one-time codes.
 *
 * This is the authentication spine. Requesting a code generates a 6-digit
 * code, stores a SHA-256 hash on this device with a 10-minute expiry and
 * 5 attempts, then hands the code to WhatsApp via /api/send-whatsapp.
 * If the WhatsApp Business API is not connected yet, the code comes back
 * inline so the flow works end to end — it is shown clearly on screen,
 * never hidden, and it lights up real delivery the moment credentials are
 * set (WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID).
 *
 * Nobody is ever stuck at a code screen: resend has a visible cooldown,
 * attempts are counted honestly, and the Google path is always one tap away.
 */

import { waDigits } from "./whatsapp";

const KEY = "kr8.academy.waotp.v1";
const TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30 * 1000;

type WaOtpRecord = { phone: string; codeHash: string; expiresAt: number; attempts: number; sentAt: number };

export function formatWaPhone(phone: string): string {
  const digits = waDigits(phone) ?? "";
  /* Display +234 803 000 0000 style */
  const local = digits.startsWith("234") ? `+234 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}` : digits;
  return local.trim();
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  /* Non-secure-context fallback — never relied on for secrecy, only uniqueness. */
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0").repeat(8);
}

function read(): WaOtpRecord | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WaOtpRecord;
    if (!parsed?.phone || !parsed?.codeHash) return null;
    return parsed;
  } catch {
    return null;
  }
}
function write(rec: WaOtpRecord | null) {
  try {
    if (rec) window.localStorage.setItem(KEY, JSON.stringify(rec));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* quota — non-fatal */
  }
}

export function pendingWaPhone(): string | null {
  const rec = read();
  return rec && rec.expiresAt > Date.now() ? rec.phone : null;
}
export function secondsUntilWaResend(): number {
  const rec = read();
  if (!rec) return 0;
  return Math.max(0, Math.ceil((rec.sentAt + COOLDOWN_MS - Date.now()) / 1000));
}

export async function requestWhatsAppOtp(phone: string): Promise<{
  ok: boolean;
  error?: string;
  sent?: boolean;
  inlineCode?: string;
  cooldownSec?: number;
  phone?: string;
}> {
  const digits = waDigits(phone);
  if (!digits) return { ok: false, error: "Enter a valid WhatsApp number — e.g. 0803 000 0000 or +234 803 000 0000." };
  const existing = read();
  if (existing && existing.sentAt + COOLDOWN_MS > Date.now())
    return { ok: false, error: "Give it a moment.", cooldownSec: Math.ceil((existing.sentAt + COOLDOWN_MS - Date.now()) / 1000) };

  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
  const rec: WaOtpRecord = {
    phone: digits,
    codeHash: await sha256(`${digits}:${code}`),
    expiresAt: Date.now() + TTL_MS,
    attempts: 0,
    sentAt: Date.now(),
  };
  write(rec);

  /* Try live delivery. Not connected → hand the code back so nobody is stranded. */
  let sent = false;
  try {
    const res = await fetch("/api/send-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: digits,
        text: `KR8 Academy: your sign-in code is ${code}. It expires in 10 minutes. Don't share it with anyone — the academy will never ask for it.`,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
    sent = res.ok && data.ok === true;
  } catch {
    sent = false;
  }
  return { ok: true, sent, inlineCode: sent ? undefined : code, phone: digits };
}

export async function verifyWhatsAppOtp(phone: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const digits = waDigits(phone);
  if (!digits) return { ok: false, error: "That number is not valid." };
  const rec = read();
  if (!rec || rec.phone !== digits) return { ok: false, error: "Request a fresh code first." };
  if (rec.expiresAt < Date.now()) {
    write(null);
    return { ok: false, error: "That code expired. Request a new one." };
  }
  if (rec.attempts >= MAX_ATTEMPTS) {
    write(null);
    return { ok: false, error: "Too many attempts. Request a fresh code." };
  }
  const hash = await sha256(`${digits}:${code.trim()}`);
  if (hash !== rec.codeHash) {
    write({ ...rec, attempts: rec.attempts + 1 });
    const left = MAX_ATTEMPTS - rec.attempts - 1;
    return {
      ok: false,
      error: left > 0 ? `That code is not right — ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many attempts. Request a fresh code.",
    };
  }
  write(null);
  return { ok: true };
}

/** Forget the current code — used when someone fixes a mistyped number. */
export function clearWaOtp() {
  write(null);
}
