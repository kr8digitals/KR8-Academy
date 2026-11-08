/* KR8 Academy — one-time email codes.
 *
 * Requesting an OTP generates a 6-digit code, stores a SHA-256 hash on this
 * device with a 10-minute expiry and 5 attempts, and asks the mail relay to
 * deliver it (POST /api/send-email). If the relay is not connected yet, the
 * code is returned inline so sign-in works end to end — the relay lights up
 * real delivery the moment it is configured.
 */

import { isValidEmail, normalizeEmail } from "./utils";

const KEY = "kr8.academy.otp.v1";
const TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30 * 1000;

type OtpRecord = { email: string; codeHash: string; expiresAt: number; attempts: number; sentAt: number };

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function read(): OtpRecord | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OtpRecord;
    if (!parsed?.email || !parsed?.codeHash) return null;
    return parsed;
  } catch {
    return null;
  }
}
function write(rec: OtpRecord | null) {
  try {
    if (rec) window.localStorage.setItem(KEY, JSON.stringify(rec));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* quota — non-fatal */
  }
}

export function pendingOtpEmail(): string | null {
  const rec = read();
  return rec && rec.expiresAt > Date.now() ? rec.email : null;
}
export function secondsUntilResend(): number {
  const rec = read();
  if (!rec) return 0;
  return Math.max(0, Math.ceil((rec.sentAt + COOLDOWN_MS - Date.now()) / 1000));
}

export async function requestOtp(email: string): Promise<{
  ok: boolean;
  error?: string;
  sent?: boolean;
  inlineCode?: string;
  cooldownSec?: number;
}> {
  const clean = normalizeEmail(email);
  if (!isValidEmail(clean)) return { ok: false, error: "Enter a valid email address." };
  const existing = read();
  if (existing && existing.sentAt + COOLDOWN_MS > Date.now())
    return { ok: false, error: "Give it a moment.", cooldownSec: Math.ceil((existing.sentAt + COOLDOWN_MS - Date.now()) / 1000) };

  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
  const rec: OtpRecord = { email: clean, codeHash: await sha256(`${clean}:${code}`), expiresAt: Date.now() + TTL_MS, attempts: 0, sentAt: Date.now() };
  write(rec);

  /* Try the mail relay. If it is not wired yet, hand the code back so the flow never dead-ends. */
  let sent = false;
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: clean,
        subject: "Your KR8 Academy sign-in code",
        text: `Your KR8 Academy sign-in code is ${code}. It expires in 10 minutes. If you did not ask for this, you can ignore this email.`,
        html: `<p style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1b1524">Your KR8 Academy sign-in code is <strong style="letter-spacing:2px">${code}</strong>.</p><p style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#5b5470">It expires in 10 minutes. If you did not ask for this, you can ignore this email.</p>`,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; configured?: boolean };
    sent = res.ok && data.ok === true;
  } catch {
    sent = false;
  }
  return { ok: true, sent, inlineCode: sent ? undefined : code };
}

export async function verifyOtp(email: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const clean = normalizeEmail(email);
  const rec = read();
  if (!rec || rec.email !== clean) return { ok: false, error: "Request a fresh code first." };
  if (rec.expiresAt < Date.now()) {
    write(null);
    return { ok: false, error: "That code expired. Request a new one." };
  }
  if (rec.attempts >= MAX_ATTEMPTS) {
    write(null);
    return { ok: false, error: "Too many attempts. Request a fresh code." };
  }
  const hash = await sha256(`${clean}:${code.trim()}`);
  if (hash !== rec.codeHash) {
    write({ ...rec, attempts: rec.attempts + 1 });
    const left = MAX_ATTEMPTS - rec.attempts - 1;
    return { ok: false, error: left > 0 ? `That code is not right — ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many attempts. Request a fresh code." };
  }
  write(null);
  return { ok: true };
}
