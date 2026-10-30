/* Small, dependency-free helpers used across the academy. */

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function uid(prefix = ""): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}${Date.now().toString(36)}${rand}`.toUpperCase();
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "KR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0") && digits.length >= 10) return `+234${digits.slice(1)}`;
  return `+${digits}`;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/[^\d]/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

export function ageFromDob(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const age = diff / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(age);
}

export function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong", "Excellent"];
  return { score: clamp(score, 0, 5), label: labels[clamp(score, 0, 5)] };
}

/* ---------------- Dates ---------------- */

const DAY = 86_400_000;

export function formatDate(value: number | string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value: number | string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(value: number): string {
  const diff = Date.now() - value;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

/* Whole days left, for display. daysUntil() rounds up so it can drive
   "is this still ahead of us?" logic; this one matches what the countdown
   underneath it is actually counting. */
export function daysRemaining(value: number | string): number {
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return 0;
  return Math.max(0, Math.floor((d - Date.now()) / DAY));
}

export function daysUntil(value: number | string): number {
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return 0;
  return Math.ceil((d - Date.now()) / DAY);
}

export function nextWeekday(from: Date, weekday: number, hour = 19): Date {
  const d = new Date(from);
  d.setHours(hour, 0, 0, 0);
  const diff = (weekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + (diff === 0 && d.getTime() < Date.now() ? 7 : diff));
  return d;
}

export function addDays(date: Date | string, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/* ---------------- Levels & progress ---------------- */

export const LEVELS = [
  { name: "Newcomer", min: 0 },
  { name: "Apprentice", min: 250 },
  { name: "Practitioner", min: 700 },
  { name: "Craftsperson", min: 1400 },
  { name: "Specialist", min: 2400 },
  { name: "Master", min: 3600 },
];

export function levelFor(xp: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
    }
  }
  const span = next ? next.min - current.min : 1;
  const into = xp - current.min;
  const pct = next ? clamp(Math.round((into / span) * 100), 0, 100) : 100;
  return { current, next, pct, toNext: next ? Math.max(0, next.min - xp) : 0 };
}

export function xpFor(student: { xpBase: number; weeksDone: number[] }, derived: { accepted: number; attendance: number; referrals: number }) {
  return (
    (student.xpBase || 0) +
    student.weeksDone.length * 120 +
    derived.accepted * 80 +
    derived.attendance * 60 +
    derived.referrals * 40
  );
}

export function bool(v: unknown): boolean {
  return v === true;
}

export function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  return new Promise((resolve) => {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand("copy");
    } catch {
      /* noop */
    }
    document.body.removeChild(el);
    resolve();
  });
}

export function download(filename: string, data: string | Blob, mime = "application/json") {
  const blob = typeof data === "string" ? new Blob([data], { type: mime }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
