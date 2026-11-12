import type { CloudRegistration } from "./registration";

/** The registration desk is a same-browser working register. The learning
 * application itself remains the source of truth for student accounts. */
export type RegistrationRow = CloudRegistration;
type NewRegistration = Omit<RegistrationRow, "id" | "created_at" | "updated_at" | "status"> & { status: "new" };

const REGISTRATIONS_KEY = "kr8.academy.registrations.v1";

function readRows(): RegistrationRow[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(REGISTRATIONS_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? (parsed as RegistrationRow[]) : [];
  } catch {
    return [];
  }
}

function writeRows(rows: RegistrationRow[]): boolean {
  try {
    window.localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent("kr8:registrations:change"));
    return true;
  } catch {
    return false;
  }
}

export function exportRegistrationRecords(): RegistrationRow[] {
  return readRows();
}

export function isRegistrationRecords(value: unknown): value is RegistrationRow[] {
  return Array.isArray(value) && value.every((row) =>
    typeof row === "object" && row !== null &&
    typeof (row as RegistrationRow).id === "number" &&
    typeof (row as RegistrationRow).full_name === "string" &&
    typeof (row as RegistrationRow).email === "string" &&
    typeof (row as RegistrationRow).phone === "string" &&
    ["new", "contacted", "converted", "dropped"].includes((row as RegistrationRow).status)
  );
}

export function importRegistrationRecords(value: unknown): boolean {
  return isRegistrationRecords(value) && writeRows(value);
}

export async function saveRegistration(row: NewRegistration): Promise<{ saved: boolean }> {
  const rows = readRows();
  const duplicate = rows.some((existing) =>
    existing.email.toLowerCase() === row.email.toLowerCase() || existing.phone === row.phone
  );
  if (duplicate) return { saved: true };
  const now = new Date().toISOString();
  const id = rows.reduce((max, current) => Math.max(max, Number(current.id) || 0), 0) + 1;
  const entry: RegistrationRow = { ...row, id, created_at: now, updated_at: now };
  return { saved: writeRows([entry, ...rows]) };
}

export interface RegistrationQuery {
  search?: string;
  category?: "skill" | "academic" | "";
  status?: RegistrationRow["status"] | "";
}

export async function listRegistrations(query: RegistrationQuery = {}): Promise<{ ok: true; rows: RegistrationRow[] }> {
  const needle = query.search?.trim().toLocaleLowerCase() ?? "";
  const rows = readRows().filter((row) => {
    if (query.category && row.category !== query.category) return false;
    if (query.status && row.status !== query.status) return false;
    if (!needle) return true;
    return [row.full_name, row.email, row.phone, row.kr8_id, row.city, row.state]
      .some((value) => value?.toLocaleLowerCase().includes(needle));
  });
  return { ok: true, rows };
}

export async function updateRegistrationStatus(
  id: number,
  status: RegistrationRow["status"]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const rows = readRows();
  if (!rows.some((row) => row.id === id)) return { ok: false, error: "That registration could not be found." };
  const next = rows.map((row) => row.id === id ? { ...row, status, updated_at: new Date().toISOString() } : row);
  return writeRows(next) ? { ok: true } : { ok: false, error: "Your browser could not save that update. Export a backup and try again." };
}

export function waLink(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function defaultWhatsAppGreeting(row: RegistrationRow, trackLabel?: string): string {
  const first = row.full_name.trim().split(/\s+/)[0] || "there";
  const what = row.category === "academic" ? "UTME/WAEC/NECO coaching" : trackLabel ? trackLabel : "digital skills";
  return `Karibu, ${first} 👋 — this is KR8 Academy. Thanks for registering for ${what}. I'm reaching out to confirm your details and send your onboarding info. Is this a good time?`;
}
