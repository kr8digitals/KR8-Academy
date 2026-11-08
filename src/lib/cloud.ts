/* Cloud registrar — talks to the shared Supabase project (KR8-Academy) where
   every fallback registration lands. No SDK: plain REST, RLS-respecting.

   Browser-safe by design: the publishable key is public and only grants what
   RLS allows (anonymous INSERT, nothing else). Admin reads/updates use the
   access token of the seeded admin account — never a service role. If the
   network is unreachable the payload waits in the local outbox and retries
   automatically (app start, admin open, after each signup). */

import type { CloudRegistration } from "./registration";

const RAW_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const RAW_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim();

/** In-code defaults: the publishable key is public by design (RLS-gated), so
    builds work even without env vars. Override via VITE_SUPABASE_* env. */
export const SUPABASE_URL = RAW_URL && RAW_URL.length > 0 ? RAW_URL.replace(/\/+$/, "") : "https://cwpojkhkozfclcydpvmg.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  RAW_KEY && RAW_KEY.length > 0 ? RAW_KEY : "sb_publishable_0dNxY-N8Tx077_p0KJcwvQ_e-kU0H2k";

export const cloudConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

const FETCH_TIMEOUT_MS = 15_000;

async function cloudFetch(path: string, init: RequestInit = {}, token?: string): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(`${SUPABASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers ?? {}),
      },
    });
  } finally {
    window.clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/*  Submitting a registration (public, anonymous)                      */
/* ------------------------------------------------------------------ */

export type CloudInsertResult = { ok: true; duplicates?: boolean } | { ok: false; error: string };

export async function submitCloudRegistration(
  row: Omit<CloudRegistration, "id" | "created_at" | "updated_at" | "status"> & { status: "new" }
): Promise<CloudInsertResult> {
  if (!cloudConfigured) return { ok: false, error: "Cloud registrar is not configured." };
  try {
    /* NOTE: never ask PostgREST for the inserted row back — anonymous
       sessions have no SELECT, so return=representation would 403. */
    const res = await cloudFetch("/rest/v1/registrations", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    if (res.status === 201 || res.status === 200 || res.status === 204) return { ok: true };
    const text = await res.text().catch(() => "");
    return { ok: false, error: `Registrar responded ${res.status}${text ? ` — ${text.slice(0, 140)}` : ""}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error && err.name === "AbortError" ? "Timed out reaching the server." : "Could not reach the server. Check your connection." };
  }
}

/* ------------------------------------------------------------------ */
/*  Outbox — registrations queued while offline, flushed when possible */
/* ------------------------------------------------------------------ */

const OUTBOX_KEY = "kr8.cloud.outbox.v1";

export interface OutboxEntry {
  queuedAt: number;
  row: Omit<CloudRegistration, "id" | "created_at" | "updated_at" | "status"> & { status: "new" };
}

export function listOutbox(): OutboxEntry[] {
  try {
    const raw = window.localStorage.getItem(OUTBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OutboxEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOutbox(entries: OutboxEntry[]) {
  try {
    window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(entries.slice(-50)));
  } catch {
    /* storage full — nothing more we can do; admin still has the local copy */
  }
}

export function enqueueOutbox(row: OutboxEntry["row"]): void {
  writeOutbox([...listOutbox(), { queuedAt: Date.now(), row }]);
}

export function outboxCount(): number {
  return listOutbox().length;
}

export async function flushOutbox(): Promise<{ flushed: number; remaining: number }> {
  const pending = listOutbox();
  if (pending.length === 0) return { flushed: 0, remaining: 0 };
  const failed: OutboxEntry[] = [];
  let flushed = 0;
  for (const entry of pending) {
    const res = await submitCloudRegistration(entry.row);
    if (res.ok) flushed += 1;
    else failed.push(entry);
  }
  writeOutbox(failed);
  return { flushed, remaining: failed.length };
}

/** Submit now, queue on failure. The single entry point used by the UI. */
export async function registerInCloud(
  row: OutboxEntry["row"]
): Promise<{ delivered: boolean }> {
  const res = await submitCloudRegistration(row);
  if (res.ok) {
    /* best effort: also flush anything older we were holding */
    void flushOutbox();
    return { delivered: true };
  }
  enqueueOutbox(row);
  return { delivered: false };
}

/* ------------------------------------------------------------------ */
/*  Admin session — the seeded kr8digitals01@gmail.com account         */
/* ------------------------------------------------------------------ */

const ADMIN_SESSION_KEY = "kr8.cloud.admin.v1";

export interface CloudAdminSession {
  email: string;
  accessToken: string;
  refreshToken: string;
  /** epoch ms when the access token expires */
  expiresAt: number;
}

export function readAdminSession(): CloudAdminSession | null {
  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as CloudAdminSession;
    if (!s?.accessToken || !s?.refreshToken) return null;
    return s;
  } catch {
    return null;
  }
}

function storeAdminSession(s: CloudAdminSession) {
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(s));
}

export function clearAdminSession() {
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
}

export async function signInCloudAdmin(
  email: string,
  password: string
): Promise<{ ok: true; session: CloudAdminSession } | { ok: false; error: string }> {
  try {
    const res = await cloudFetch(
      "/auth/v1/token?grant_type=password",
      { method: "POST", body: JSON.stringify({ email: email.trim().toLowerCase(), password }) }
    );
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { msg?: string; error_description?: string };
      return { ok: false, error: body.error_description ?? body.msg ?? `Sign-in failed (${res.status}). Check the credentials.` };
    }
    const body = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
    const session: CloudAdminSession = {
      email: email.trim().toLowerCase(),
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
    };
    storeAdminSession(session);
    return { ok: true, session };
  } catch (err) {
    return { ok: false, error: err instanceof Error && err.name === "AbortError" ? "Timed out. Check your connection." : "Could not reach the sign-in service." };
  }
}

async function refreshAdminSession(session: CloudAdminSession): Promise<CloudAdminSession | null> {
  try {
    const res = await cloudFetch(
      "/auth/v1/token?grant_type=refresh_token",
      { method: "POST", body: JSON.stringify({ refresh_token: session.refreshToken }) }
    );
    if (!res.ok) {
      clearAdminSession();
      return null;
    }
    const body = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
    const next: CloudAdminSession = {
      ...session,
      accessToken: body.access_token,
      refreshToken: body.refresh_token ?? session.refreshToken,
      expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
    };
    storeAdminSession(next);
    return next;
  } catch {
    return null;
  }
}

/** Returns a valid access token (refreshing if needed), or null when signed out. */
export async function validAdminToken(): Promise<CloudAdminSession | null> {
  const s = readAdminSession();
  if (!s) return null;
  if (s.expiresAt - Date.now() > 60_000) return s;
  return refreshAdminSession(s);
}

/* ------------------------------------------------------------------ */
/*  Admin reads + status pipeline                                       */
/* ------------------------------------------------------------------ */

export type CloudRegistrationRow = CloudRegistration;

async function adminGet(path: string): Promise<{ ok: true; rows: CloudRegistrationRow[] } | { ok: false; error: string }> {
  const session = await validAdminToken();
  if (!session) return { ok: false, error: "Cloud session expired — sign in again." };
  try {
    const res = await cloudFetch(path, { method: "GET" }, session.accessToken);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Registrar responded ${res.status}${text ? ` — ${text.slice(0, 140)}` : ""}` };
    }
    const rows = (await res.json()) as CloudRegistrationRow[];
    return { ok: true, rows: Array.isArray(rows) ? rows : [] };
  } catch (err) {
    return { ok: false, error: err instanceof Error && err.name === "AbortError" ? "Timed out reaching the server." : "Could not reach the server." };
  }
}

export interface CloudQuery {
  search?: string;
  category?: "skill" | "academic" | "";
  status?: CloudRegistrationRow["status"] | "";
}

export async function listCloudRegistrations(
  query: CloudQuery = {}
): Promise<{ ok: true; rows: CloudRegistrationRow[] } | { ok: false; error: string }> {
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("order", "created_at.desc");
  params.set("limit", "500");
  if (query.category) params.set("category", `eq.${query.category}`);
  if (query.status) params.set("status", `eq.${query.status}`);
  const search = query.search?.trim();
  if (search) {
    const escaped = search.replace(/[%*]/g, "");
    params.set(
      "or",
      `(full_name.ilike.*${escaped}*,email.ilike.*${escaped}*,phone.ilike.*${escaped}*,kr8_id.ilike.*${escaped}*,city.ilike.*${escaped}*,state.ilike.*${escaped}*)`
    );
  }
  return adminGet(`/rest/v1/registrations?${params.toString()}`);
}

export async function updateCloudRegistrationStatus(
  id: number,
  status: CloudRegistrationRow["status"]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await validAdminToken();
  if (!session) return { ok: false, error: "Cloud session expired — sign in again." };
  try {
    const res = await cloudFetch(
      `/rest/v1/registrations?id=eq.${id}`,
      { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status }) },
      session.accessToken
    );
    if (res.status === 200 || res.status === 204) return { ok: true };
    const text = await res.text().catch(() => "");
    return { ok: false, error: `Update failed (${res.status})${text ? ` — ${text.slice(0, 140)}` : ""}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error && err.name === "AbortError" ? "Timed out." : "Could not reach the server." };
  }
}

/** wa.me deep link for a registration row, with a pre-filled Nigerian greeting. */
export function waLink(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function defaultWhatsAppGreeting(row: CloudRegistrationRow, trackLabel?: string): string {
  const first = row.full_name.trim().split(/\s+/)[0] || "there";
  const what = row.category === "academic" ? "UTME/WAEC/NECO coaching" : trackLabel ? `${trackLabel}` : "digital skills";
  return `Karibu, ${first} 👋 — this is KR8 Academy. Thanks for registering for ${what}. I'm reaching out to confirm your details and send your onboarding info. Is this a good time?`;
}
