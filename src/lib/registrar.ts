import type { CloudRegistration } from "./registration";

/** The registration desk is a same-browser working register. The learning
 * application itself remains the source of truth for student accounts. */
export type RegistrationRow = CloudRegistration;
type NewRegistration = Omit<RegistrationRow, "id" | "created_at" | "updated_at" | "status"> & { status: "new" };

const REGISTRATIONS_KEY = "kr8.academy.registrations.v1";
const MAX_REGISTRATION_ROWS = 20_000;
const MAX_REGISTRATION_FIELD_LENGTH = 1_000_000;

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

const REQUIRED_TEXT_FIELDS = ["created_at", "updated_at", "full_name", "email", "phone", "country"] as const;
const NULLABLE_TEXT_FIELDS = [
  "dob", "gender", "whatsapp_number", "state", "lga", "city", "community", "education_level",
  "institution", "course_of_study", "class_level", "occupation", "experience_level", "learning_objectives",
  "academic_class", "subject_combination", "how_heard", "preferred_contact", "notes", "kr8_id",
] as const;
const STRING_ARRAY_FIELDS = ["skills", "device_access", "exam_targets", "subjects"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBoundedText(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_REGISTRATION_FIELD_LENGTH;
}

function isRegistrationRow(value: unknown): value is RegistrationRow {
  if (!isRecord(value)) return false;
  if (!Number.isSafeInteger(value.id) || (value.id as number) < 1) return false;
  if (REQUIRED_TEXT_FIELDS.some((field) => !isBoundedText(value[field]))) return false;
  if (value.created_at === "" || value.updated_at === "") return false;
  if (typeof value.consent_terms !== "boolean" || typeof value.consent_privacy !== "boolean" || typeof value.consent_comms !== "boolean") return false;
  if (value.category !== "skill" && value.category !== "academic") return false;
  if (!["new", "contacted", "converted", "dropped"].includes(String(value.status))) return false;
  if (NULLABLE_TEXT_FIELDS.some((field) => value[field] !== null && !isBoundedText(value[field]))) return false;
  if (STRING_ARRAY_FIELDS.some((field) => value[field] !== null && (
    !Array.isArray(value[field]) || (value[field] as unknown[]).length > 1_000 ||
    (value[field] as unknown[]).some((item) => !isBoundedText(item))
  ))) return false;
  return true;
}

export function isRegistrationRecords(value: unknown): value is RegistrationRow[] {
  if (!Array.isArray(value) || value.length > MAX_REGISTRATION_ROWS) return false;
  const ids = new Set<number>();
  for (const row of value) {
    if (!isRegistrationRow(row) || ids.has(row.id)) return false;
    ids.add(row.id);
  }
  return true;
}

export function importRegistrationRecords(value: unknown): boolean {
  return isRegistrationRecords(value) && writeRows(value);
}

export function captureRegistrationStorage(): { available: true; value: string | null } | { available: false } {
  try {
    return { available: true, value: window.localStorage.getItem(REGISTRATIONS_KEY) };
  } catch {
    return { available: false };
  }
}

export function restoreRegistrationStorage(value: string | null): boolean {
  try {
    if (value === null) window.localStorage.removeItem(REGISTRATIONS_KEY);
    else window.localStorage.setItem(REGISTRATIONS_KEY, value);
    window.dispatchEvent(new CustomEvent("kr8:registrations:change"));
    return true;
  } catch {
    return false;
  }
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
