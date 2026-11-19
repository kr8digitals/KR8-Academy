import type {
  AcademicProfile,
  AppNotification,
  MonthlyAward,
  Announcement,
  AttendanceKind,
  AttendanceRecord,
  AwardTier,
  BroadcastRecord,
  Certificate,
  CertificateTier,
  CertificateVariant,
  Db,
  EmailTemplate,
  LearningGroup,
  LearningGroupKind,
  OutboxMessage,
  OutboxKind,
  Programme,
  RegistrationSide,
  Role,
  ScoringComponent,
  SessionState,
  Settings,
  Student,
  Submission,
} from "./types";
import { sendWhatsApp } from "./whatsapp";
import { DEFAULT_UTME_TIERS, tierForScore, validateUtmeTiers } from "./awards";
import { canOverride, meetsUtmeParticipation } from "./scoring";
import { DEFAULT_EMAIL_TEMPLATES } from "./email";
import { wallRows } from "./awards";
import { generateRecoveryCodes, generateTotpSecret, verifyTotp } from "./totp";
import { TRACKS, trackByKey, trackName } from "../data/academy";
import { normalizeEmail, normalizePhone, uid } from "./utils";

const STORAGE_KEY = "kr8.academy.db.v1";
const SESSION_KEY = "kr8.academy.session.v1";
const SCHEMA_VERSION = 4;
const LEGACY_PRE_V3_BACKUP_KEY = "kr8.academy.db.v1.pre-v3";
const MIGRATION_RECOVERY_KEY = "kr8.academy.db.v1.v4-recovery";

export const EVENT = "kr8:academy:change";

/* ------------------------------------------------------------------ */
/* Storage primitives                                                   */
/* ------------------------------------------------------------------ */

let memoryFallback: string | null = null;

function rawRead(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryFallback;
  }
}

function rawWrite(value: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    memoryFallback = value;
  }
}

function emit() {
  try {
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* noop */
  }
}

/* ------------------------------------------------------------------ */
/* Password hashing — WebCrypto only; fail closed when secure primitives are unavailable. */
/* ------------------------------------------------------------------ */

const PASSWORD_HASH_PREFIX = "pbkdf2-sha256";
const PASSWORD_HASH_ITERATIONS = import.meta.env.MODE === "test" ? 1_000 : 310_000;

async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("Secure browser cryptography is unavailable.");
  }
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function makeSalt(): string {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("Secure random number generation is unavailable.");
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("Secure browser cryptography is unavailable.");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: PASSWORD_HASH_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256
  );
  const digest = Array.from(new Uint8Array(bits))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `${PASSWORD_HASH_PREFIX}$${PASSWORD_HASH_ITERATIONS}$${digest}`;
}

async function legacyPasswordHash(password: string, salt: string): Promise<string> {
  return sha256Hex(`kr8::${salt}::${password}`);
}

async function verifyStoredPassword(student: Student, password: string): Promise<boolean> {
  if (!student.passwordHash || !student.passwordSalt) return false;
  if (student.passwordHash.startsWith(`${PASSWORD_HASH_PREFIX}$`)) {
    return (await hashPassword(password, student.passwordSalt)) === student.passwordHash;
  }

  // Existing local registrations used a single SHA-256 digest. Upgrade only
  // after the supplied password verifies; v4 retires the old demo credentials.
  if ((await legacyPasswordHash(password, student.passwordSalt)) !== student.passwordHash) return false;
  const salt = makeSalt();
  const hash = await hashPassword(password, salt);
  mutate((data) => {
    const target = data.students.find((record) => record.id === student.id);
    if (target) {
      target.passwordSalt = salt;
      target.passwordHash = hash;
    }
  });
  return true;
}

/* ------------------------------------------------------------------ */
/* Seed data                                                            */
/* ------------------------------------------------------------------ */

export const DEFAULT_SETTINGS: Settings = {
  cohortName: "5th Cohort",
  cohortStart: nextCohortStartISO(),
  registrationOpen: true,
  autoApprove: true,
  applicationDeadline: nextOnboardingISO(),
  whatsappUrl: "https://chat.whatsapp.com/KdzTcSlrGlp8CQcbxFuUgU",
  supportEmail: "academy@kr8digitals.com",
  agencyUrl: "https://www.kr8digitals.com/agency",
  instagram: "https://instagram.com/kr8digitals",
  tiktok: "https://tiktok.com/@kr8digitals",
  youtube: "https://youtube.com/@kr8digitals",
  certificateRequiresApproval: true,
  cohortSeatsNote: "40 seats per skill · full registration opens March–April 2027",
  classDays: ["mon", "wed", "fri"],
  classStart: "20:00",
  classEnd: "21:00",
  classAttendanceStart: "21:00",
  classAttendanceEnd: "00:00",
  assignmentDays: ["tue", "thu", "sat"],
  assignmentWindowStart: "00:00",
  assignmentWindowEnd: "00:00",
  timeZone: "Africa/Lagos",
  partnerName: "Next Gen Scholars",
  skillsCertificateThreshold: 90,
  skillsGraceFloor: 80,
  utmeCertificateThreshold: 240,
  kr8ExamPassMark: 80,
  jambMinParticipationPct: 80,
  expectedClassCount: 24,
  expectedAssignmentCount: 24,
  academicStartNote: "January",
  supportFromName: "KR8 Academy",
  waitlistPriorityHours: 72,
  wallIntro: "The KR8 Recognition Wall honours the scholars who set the pace — UTME and KR8 exam achievers, celebrated in public, verified in private.",
};

// Classes begin on 3 May. Returns the next 3 May that is today or later.
function nextCohortStartISO(): string {
  const now = new Date();
  const thisYear = now.getMonth() > 4 || (now.getMonth() === 4 && now.getDate() > 3);
  const d = new Date(thisYear ? now.getFullYear() + 1 : now.getFullYear(), 4, 3, 20, 0, 0, 0);
  return d.toISOString();
}

// Onboarding is 30 April.
function nextOnboardingISO(): string {
  const start = new Date(nextCohortStartISO());
  const d = new Date(start.getFullYear(), 3, 30, 19, 0, 0, 0);
  return d.toISOString();
}

function makeReferralCode(name: string): string {
  const base = name.trim().split(/\s+/)[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) || "KR8";
  const tail = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${base}-${tail}`;
}


/* Certificate serials are monotonic within this local store, so two graduates in the same
   track (or the same graduate earning a second tier) can never share a code.
   The suffix names the variant the code was awarded for. */
const VARIANT_SUFFIX: Record<string, string> = {
  Completion: "COMP",
  Professionalism: "PROF",
  utme_merit: "MERIT",
  utme_scholar: "SCHO",
  utme_distinction: "DIST",
  utme_pinnacle: "PINN",
  utme_legend: "LEGN",
  kr8_exam: "KREX",
};

export function makeCertificateCode(
  certificates: Certificate[],
  tier: CertificateTier,
  variant?: CertificateVariant
): string {
  const suffix = VARIANT_SUFFIX[variant ?? tier] ?? (tier === "Professionalism" ? "PROF" : "COMP");
  let serial = certificates.length + 1;
  let code = `KR8-CERT-${String(serial).padStart(4, "0")}-${suffix}`;
  while (certificates.some((c) => c.code === code)) {
    serial += 1;
    code = `KR8-CERT-${String(serial).padStart(4, "0")}-${suffix}`;
  }
  return code;
}

/* Older builds could mint the same code twice. Repairs in place, keeping the
   first occurrence of each code and re-serialling the rest. */
export function normalizeCertificateCodes(certificates: Certificate[]): Certificate[] {
  const seen = new Set<string>();
  for (const certificate of certificates) {
    const code = (certificate.code ?? "").toUpperCase();
    if (!code || seen.has(code)) {
      certificate.code = makeCertificateCode(
        certificates.filter((c) => c !== certificate),
        certificate.tier
      );
    }
    seen.add(certificate.code.toUpperCase());
  }
  return certificates;
}

const ID_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; /* no I, L, O, 0, 1 — easy to read aloud */
export function makeKr8Id(students: Student[], _trackKey?: string): string {
  const year = String(new Date().getFullYear()).slice(-2);
  for (let attempt = 0; attempt < 60; attempt++) {
    const rand = Array.from({ length: 5 }, () => ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)]).join("");
    const candidate = `KR8-${year}-${rand}`;
    if (!students.some((s) => s.id === candidate)) return candidate;
  }
  return `KR8-${year}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

/* The seeded admin. Password is documented and must be changed on first login. */
/* Default programme statuses (all editable from the dashboard):
 *   - Digital skills next intake: VIDEO EDITING, GRAPHIC DESIGN, WEBSITE DESIGN
 *     are the only tracks offered, and they are on WAITLIST now. Full registration
 *     is planned for around March–April 2027; classes begin 3 May 2027.
 *   - Academics (Next Gen Scholars): registration is OPEN.
 *     Training starts in January and students may join any time. */
export const DEFAULT_PROGRAMMES: Programme[] = [
  { key: "video", side: "skill", status: "waitlist", opensAt: "2027-04-01T00:00:00+01:00", note: "Next intake: video editing. Full registration opens around March–April 2027; classes begin 3 May 2027." },
  { key: "graphic", side: "skill", status: "waitlist", opensAt: "2027-04-01T00:00:00+01:00", note: "Next intake: graphic design. Full registration opens around March–April 2027; classes begin 3 May 2027." },
  { key: "web", side: "skill", status: "waitlist", opensAt: "2027-04-01T00:00:00+01:00", note: "Next intake: website design. Full registration opens around March–April 2027; classes begin 3 May 2027." },
  { key: "frontend", side: "skill", status: "closed", opensAt: null, note: "Not part of the next intake." },
  { key: "content_creation", side: "skill", status: "closed", opensAt: null, note: "Not part of the next intake." },
  { key: "smm", side: "skill", status: "closed", opensAt: null, note: "Not part of the next intake." },
  { key: "marketing", side: "skill", status: "closed", opensAt: null, note: "Not part of the next intake." },
  { key: "academic", side: "academic", status: "open", opensAt: null, note: "Academic registration is open now. Training starts in January; students may join any time." },
];

export const DEFAULT_COMPONENTS: ScoringComponent[] = [
  { id: "comp-class", name: "Class attendance", active: true, order: 1 },
  { id: "comp-assignment", name: "Assignment submission", active: true, order: 2 },
  { id: "comp-final", name: "Final project assessment", active: true, order: 3 },
  { id: "comp-mindset", name: "Mindset Shift", active: true, order: 4 },
  { id: "comp-hangout", name: "Hangout", active: true, order: 5 },
];


/* Learning groups — every place a student lands after signing up. Admins edit
   these from Admin → Groups & links; a blank joinUrl falls back to the
   academy-wide community link in Settings. */
function buildSeedLearningGroups(communityUrl: string): LearningGroup[] {
  const now = Date.now();
  const groups: LearningGroup[] = [];
  groups.push({
    id: uid("GRP"),
    kind: "general",
    name: "KR8 Academy — Everyone",
    joinUrl: communityUrl,
    note: "The academy-wide community. Everyone who joins lands here.",
    active: true,
    updatedAt: now,
    updatedBy: "System",
  });
  groups.push({
    id: uid("GRP"),
    kind: "academic",
    name: "Next Gen Scholars — All Classes",
    trackKey: "academic",
    joinUrl: "",
    note: "Academics cohort group — classes, timetable and revision drops.",
    active: true,
    updatedAt: now,
    updatedBy: "System",
  });
  for (const track of TRACKS) {
    if ((track as { side?: string }).side === "academic") continue;
    groups.push({
      id: uid("GRP"),
      kind: "track",
      name: `${track.name} — Cohort Group`,
      trackKey: track.key,
      joinUrl: "",
      note: `${track.name} students only.`,
      active: true,
      updatedAt: now,
      updatedBy: "System",
    });
  }
  return groups;
}

function buildSeed(): Db {
  const now = Date.now();
  const learningGroups = buildSeedLearningGroups(DEFAULT_SETTINGS.whatsappUrl);
  return {
    version: SCHEMA_VERSION,
    seededAt: now,
    students: [],
    applications: [],
    submissions: [],
    attendance: [],
    sessionStates: [],
    certificates: [],
    certificateRequests: [],
    announcements: [],
    auditLog: [],
    settings: { ...DEFAULT_SETTINGS },
    programmes: DEFAULT_PROGRAMMES.map((programme) => ({ ...programme })),
    waitlist: [],
    components: DEFAULT_COMPONENTS.map((component) => ({ ...component })),
    scores: [],
    overrides: [],
    utmeSlips: [],
    awardTiers: DEFAULT_UTME_TIERS.map((tier) => ({ ...tier })),
    awardGrants: [],
    examModules: [],
    examAttempts: [],
    notifications: [],
    monthlyAwards: [],
    subscribers: [],
    learningGroups,
    outbox: [],
    broadcasts: [],
    content: { published: {}, draft: {} },
    emailTemplates: { ...DEFAULT_EMAIL_TEMPLATES },
    history: [],
    security: { totpEnabled: false, totpSecret: null, recoveryCodeHashes: [], recoveryCodes: [] },
  };
}

function removeLearnerRecords(data: Db, retiredIds: Set<string>, retiredStudents: Student[]): void {
  const emails = new Set(retiredStudents.map((student) => normalizeEmail(student.email)).filter(Boolean));
  const phones = new Set(retiredStudents.map((student) => normalizePhone(student.phone)).filter(Boolean));
  const identityTerms = retiredStudents
    .flatMap((student) => [student.id, student.name, student.email, student.phone])
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 2);

  data.students = data.students.filter((student) => !retiredIds.has(student.id));
  data.applications = data.applications.filter((application) => !retiredIds.has(application.studentId));
  data.submissions = data.submissions.filter((submission) => !retiredIds.has(submission.studentId));
  data.attendance = data.attendance.filter((record) => !retiredIds.has(record.studentId));
  data.certificates = data.certificates.filter((certificate) => !retiredIds.has(certificate.studentId));
  data.certificateRequests = data.certificateRequests.filter((request) => !retiredIds.has(request.studentId));
  data.notifications = data.notifications.filter((notification) => !retiredIds.has(notification.studentId));
  data.monthlyAwards = data.monthlyAwards.filter((award) => !retiredIds.has(award.studentId));
  data.scores = data.scores.filter((score) => !retiredIds.has(score.studentId));
  data.overrides = data.overrides.filter((override) => !retiredIds.has(override.studentId));
  data.utmeSlips = data.utmeSlips.filter((slip) => !retiredIds.has(slip.studentId));
  data.awardGrants = data.awardGrants.filter((grant) => !retiredIds.has(grant.studentId));
  data.examAttempts = data.examAttempts.filter((attempt) => !retiredIds.has(attempt.studentId));
  data.waitlist = data.waitlist.filter((entry) => !emails.has(normalizeEmail(entry.email)) && !phones.has(normalizePhone(entry.whatsapp)));
  data.subscribers = data.subscribers.filter((subscriber) => !emails.has(normalizeEmail(subscriber.email)));
  data.outbox = data.outbox.filter((message) => !phones.has(normalizePhone(message.to)));
  data.broadcasts = data.broadcasts.filter((record) => !record.recipients.some((recipient) => retiredIds.has(recipient.studentId)));
  data.auditLog = data.auditLog.filter((entry) => {
    const text = `${entry.actor} ${entry.action} ${entry.detail}`.toLowerCase();
    return !identityTerms.some((term) => text.includes(term));
  });
  // History entries contain serialized whole-database snapshots, so keeping them
  // could restore retired demo identities and their linked learner data.
  data.history = [];
}

function removeLegacyDemoAccounts(data: Db): void {
  const retiredStudents = data.students.filter(
    (student) => student.sample || student.id === "KR8-FOUNDER-TIMFIRE"
  );
  const retiredIds = new Set(retiredStudents.map((student) => student.id));
  if (retiredIds.size > 0) {
    removeLearnerRecords(data, retiredIds, retiredStudents);
    data.auditLog.unshift({
      id: uid("AUD"),
      at: Date.now(),
      actor: "System",
      action: "legacy_demo_data_removed",
      detail: `${retiredIds.size} legacy demo account(s) and associated learner records were removed during the local schema update.`,
    });
  }
  if (!data.students.some((student) => student.role !== "student")) {
    data.security = { totpEnabled: false, totpSecret: null, recoveryCodeHashes: [], recoveryCodes: [] };
  }
}

/* Hydrates old and current schema snapshots, then retires the known seeded demo identities. */
function fillV3(partial: Partial<Db>): Db {
  const base = buildSeed();
  const keep = <T,>(value: T[] | undefined, fallback: T[]): T[] => (Array.isArray(value) ? value : fallback);
  const settings = { ...DEFAULT_SETTINGS, ...(partial.settings ?? {}) };
  const programmes = Array.isArray(partial.programmes) && partial.programmes.length > 0
    ? DEFAULT_PROGRAMMES.map((def) => {
        const stored = partial.programmes!.find((p) => p && p.key === def.key);
        return stored ? { ...def, ...stored, side: def.side } : { ...def };
      })
    : DEFAULT_PROGRAMMES.map((p) => ({ ...p }));
  const components = Array.isArray(partial.components) && partial.components.length > 0
    ? partial.components
    : DEFAULT_COMPONENTS.map((c) => ({ ...c }));
  const awardTiers = Array.isArray(partial.awardTiers) && partial.awardTiers.length > 0
    ? partial.awardTiers
    : DEFAULT_UTME_TIERS.map((t) => ({ ...t }));
  const examModules = Array.isArray(partial.examModules) && partial.examModules.length > 0
    ? partial.examModules
    : base.examModules;
  const students = keep(partial.students, base.students).map((s) => {
    const role = (s.role as string) === "superadmin" ? "owner" : s.role;
    return { ...s, role, side: s.side ?? "skill" } as Student;
  });
  const hydrated = {
    ...base,
    ...partial,
    version: SCHEMA_VERSION,
    students,
    settings,
    programmes,
    components,
    awardTiers,
    examModules,
    notifications: keep(partial.notifications, []),
    monthlyAwards: keep(partial.monthlyAwards, []),
    subscribers: keep(partial.subscribers, []),
    learningGroups: keep(partial.learningGroups, base.learningGroups),
    outbox: keep(partial.outbox, []),
    broadcasts: keep(partial.broadcasts, []),
    waitlist: keep(partial.waitlist, []),
    scores: keep(partial.scores, []),
    overrides: keep(partial.overrides, []),
    utmeSlips: keep(partial.utmeSlips, []),
    awardGrants: keep(partial.awardGrants, []),
    examAttempts: keep(partial.examAttempts, []),
    announcements: keep(partial.announcements, []),
    applications: keep(partial.applications, []).map((a) => ({ ...a, side: a.side ?? "skill" })),
    submissions: keep(partial.submissions, []),
    attendance: keep(partial.attendance, []).map((a) => ({ ...a, kind: a.kind ?? ("class" as AttendanceKind), source: a.source ?? "self" })),
    sessionStates: keep(partial.sessionStates, []),
    certificates: normalizeCertificateCodes(keep(partial.certificates, []).map((c) => ({ ...c }))),
    certificateRequests: keep(partial.certificateRequests, []),
    auditLog: keep(partial.auditLog, []),
    content: partial.content && typeof partial.content === "object" ? { published: partial.content.published ?? {}, draft: partial.content.draft ?? {} } : { published: {}, draft: {} },
    emailTemplates: { ...DEFAULT_EMAIL_TEMPLATES, ...(partial.emailTemplates ?? {}) },
    history: keep(partial.history, []).slice(0, 10),
    security: partial.security
      ? { totpEnabled: !!partial.security.totpEnabled, totpSecret: partial.security.totpSecret ?? null, recoveryCodeHashes: Array.isArray(partial.security.recoveryCodeHashes) ? partial.security.recoveryCodeHashes : [], recoveryCodes: [] }
      : { totpEnabled: false, totpSecret: null, recoveryCodeHashes: [], recoveryCodes: [] },
  } as Db;
  removeLegacyDemoAccounts(hydrated);
  if ((partial.version ?? 0) < SCHEMA_VERSION) hydrated.history = [];
  return hydrated;
}

/* ------------------------------------------------------------------ */
/* Load / save                                                          */
/* ------------------------------------------------------------------ */

let cache: Db | null = null;

function hydrate(): Db {
  const raw = rawRead();
  if (!raw) {
    const seeded = buildSeed();
    cache = seeded;
    rawWrite(JSON.stringify(seeded));
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<Db>;
    const fromVersion = typeof parsed?.version === "number" ? parsed.version : 0;
    const merged = fillV3(parsed ?? {});
    if (fromVersion !== SCHEMA_VERSION) {
      merged.auditLog = [
        {
          id: uid("LOG"),
          at: Date.now(),
          actor: "System",
          action: "academy.migrated",
          detail: `Schema v${fromVersion} → v${SCHEMA_VERSION}. Local demo identities were retired; a recovery snapshot without those identities is stored in this browser.`,
        },
        ...merged.auditLog,
      ].slice(0, 400);
      // Preserve learner records that remain after removing seeded demo identities.
      // The older pre-v3 snapshot may still contain those retired identities, so remove it.
      try {
        window.localStorage.setItem(MIGRATION_RECOVERY_KEY, JSON.stringify(merged));
        window.localStorage.removeItem(LEGACY_PRE_V3_BACKUP_KEY);
      } catch {
        /* quota or restricted storage — non-fatal */
      }
    }
    const session = readSession();
    if (session && !merged.students.some((student) => student.id === session.studentId)) clearSession();
    cache = merged;
    rawWrite(JSON.stringify(merged));
    return merged;
  } catch {
    const seeded = buildSeed();
    cache = seeded;
    rawWrite(JSON.stringify(seeded));
    return seeded;
  }
}

export function db(): Db {
  if (!cache) return hydrate();
  return cache;
}

function persist(db: Db) {
  cache = db;
  rawWrite(JSON.stringify(db));
  emit();
}

/** Backup imports must be durable before reporting success. Unlike ordinary
 * edits, a failed import write must not replace the in-memory copy. */
function persistImported(db: Db): boolean {
  try {
    const serialized = JSON.stringify(db);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    memoryFallback = null;
    cache = db;
    emit();
    return true;
  } catch {
    return false;
  }
}

function mutate(fn: (db: Db) => void) {
  const current = db();
  fn(current);
  persist(current);
}

function log(db: Db, actor: string, action: string, detail: string) {
  db.auditLog.unshift({ id: uid("LOG"), at: Date.now(), actor, action, detail });
  db.auditLog = db.auditLog.slice(0, 400);
}

export function subscribe(listener: () => void): () => void {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function reseed() {
  const fresh = buildSeed();
  cache = fresh;
  rawWrite(JSON.stringify(fresh));
  emit();
}

export function clearSampleData() {
  mutate((d) => {
    const samples = d.students.filter((student) => student.sample);
    const sampleIds = new Set(samples.map((student) => student.id));
    if (sampleIds.size > 0) removeLearnerRecords(d, sampleIds, samples);
    if (!d.students.some((student) => student.role !== "student")) {
      d.security = { totpEnabled: false, totpSecret: null, recoveryCodeHashes: [], recoveryCodes: [] };
    }
    log(d, "Admin", "academy.sample-cleared", `${sampleIds.size} legacy sample account(s) and linked local records removed.`);
  });
}

/* ------------------------------------------------------------------ */
/* Session (auth)                                                       */
/* ------------------------------------------------------------------ */

type StoredSession = { studentId: string; issuedAt: number };

export function readSession(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.studentId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(studentId: string) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ studentId, issuedAt: Date.now() }));
  } catch {
    /* noop */
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

/* ------------------------------------------------------------------ */
/* Reads                                                                */
/* ------------------------------------------------------------------ */

export function getStudent(id: string): Student | undefined {
  return db().students.find((s) => s.id === id);
}

export function findStudentByEmail(email: string): Student | undefined {
  const e = normalizeEmail(email);
  return db().students.find((s) => normalizeEmail(s.email) === e);
}

export function findStudentByIdentifier(identifier: string): Student | undefined {
  const value = identifier.trim();
  if (!value) return undefined;
  const lower = value.toLowerCase();
  const phone = normalizePhone(value);
  const looksLikePhone = phone.length >= 7;
  return db().students.find(
    (s) =>
      s.id.toLowerCase() === lower ||
      normalizeEmail(s.email) === lower ||
      (looksLikePhone && normalizePhone(s.phone).length >= 7 && normalizePhone(s.phone) === phone) ||
      s.referralCode.toLowerCase() === lower
  );
}

export function getSubmissions(studentId?: string): Submission[] {
  const all = db().submissions;
  return studentId ? all.filter((s) => s.studentId === studentId) : all;
}

export function getAttendance(studentId?: string): AttendanceRecord[] {
  const all = db().attendance;
  return studentId ? all.filter((a) => a.studentId === studentId) : all;
}

export function getCertificates(studentId?: string): Certificate[] {
  const all = db().certificates;
  return studentId ? all.filter((c) => c.studentId === studentId) : all;
}

export function findCertificate(code: string): Certificate | undefined {
  const value = code.trim().toUpperCase();
  return db().certificates.find((c) => c.code.toUpperCase() === value || c.id.toUpperCase() === value);
}

export function getAnnouncements(trackKey?: string): Announcement[] {
  const all = db().announcements;
  const filtered = trackKey ? all.filter((a) => a.trackKey === "all" || a.trackKey === trackKey) : all;
  return [...filtered].sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false) || b.createdAt - a.createdAt);
}

export function getSessionStatus(trackKey: string, week: number): SessionState["status"] {
  const found = db().sessionStates.find((s) => s.id === `${trackKey}-w${week}`);
  return found?.status ?? "scheduled";
}

/* Progress maths shared by dashboard, admin and certificate gating. */
export function progressFor(student: Student) {
  const track = trackByKey(student.trackKey);
  const weeks = track?.curriculum.length ?? 8;
  const submissions = getSubmissions(student.id);
  const accepted = submissions.filter((s) => s.status === "accepted").length;
  const pending = submissions.filter((s) => s.status === "submitted").length;
  const attendance = getAttendance(student.id).length;
  const certificates = getCertificates(student.id).filter((c) => !c.revoked);
  const weeksDone = student.weeksDone.length;
  const weekPct = Math.round((weeksDone / weeks) * 100);
  const attendancePct = Math.round((attendance / weeks) * 100);
  const submissionPct = Math.round((accepted / Math.max(6, weeks - 1)) * 100);
  const eligible = weeksDone >= Math.max(6, weeks - 2) && accepted >= Math.max(5, weeks - 2) && attendance >= Math.max(5, weeks - 2);
  return {
    weeks,
    weeksDone,
    weekPct: Math.min(100, weekPct),
    accepted,
    pending,
    submissions,
    attendance,
    attendancePct: Math.min(100, attendancePct),
    submissionPct: Math.min(100, submissionPct),
    certificates,
    eligible,
    overall: Math.round((Math.min(100, weekPct) + Math.min(100, attendancePct) + Math.min(100, submissionPct)) / 3),
  };
}

export function getRoster(trackKey?: string): Student[] {
  return db()
    .students.filter((s) => s.role === "student" && (!trackKey || s.trackKey === trackKey))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getLeaderboard() {
  const students = db().students.filter((s) => s.role === "student" && s.status !== "suspended");
  const rows = students.map((s) => {
    const accepted = getSubmissions(s.id).filter((x) => x.status === "accepted").length;
    const attendance = getAttendance(s.id).length;
    const xp = scoreForStudent(s);
    return {
      student: s,
      xp,
      accepted,
      attendance,
      trackKey: s.trackKey,
      track: trackName(s.trackKey),
    };
  });
  return rows.sort((a, b) => b.xp - a.xp);
}

export function getStats() {
  const d = db();
  const students = d.students.filter((s) => s.role === "student");
  const active = students.filter((s) => s.status === "active").length;
  const pendingApps = d.applications.filter((a) => a.status === "pending").length;
  const pendingReviews = d.submissions.filter((s) => s.status === "submitted").length;
  const pendingCerts = d.certificateRequests.filter((c) => c.status === "pending").length;
  const pendingUtme = d.utmeSlips.filter((c) => c.status === "pending").length;
  const awardsPending = d.awardGrants.filter((g) => g.status === "pending").length;
  const waitlistCount = d.waitlist.filter((w) => !w.notifiedAt).length;
  const certs = d.certificates.filter((c) => !c.revoked).length;
  const tracks = new Map<string, number>();
  students.forEach((s) => tracks.set(s.trackKey, (tracks.get(s.trackKey) ?? 0) + 1));
  return {
    totalStudents: students.length,
    active,
    pendingApps,
    pendingReviews,
    pendingCerts,
    pendingUtme,
    awardsPending,
    waitlistCount,
    certs,
    byTrack: Array.from(tracks.entries()).map(([key, count]) => ({
      key,
      name: trackName(key),
      count,
    })),
    attendanceRate: Math.round(
      (d.attendance.length / Math.max(1, students.length * 8)) * 100
    ),
  };
}

/* ------------------------------------------------------------------ */
/* Writes — accounts                                                    */
/* ------------------------------------------------------------------ */

export type RegisterInput = {
  name: string;
  nickname?: string;
  email: string;
  phone: string;
  country: string;
  trackKey: string;
  dob: string;
  password: string;
  motivation?: string;
  experience?: string;
  referredBy?: string;
  city?: string;
  side?: RegistrationSide;
  academic?: AcademicProfile;
  /** Fallback registration: even on a waitlist, create the account now and
      park the applications row at "waitlist" (the account itself is live). */
  allowWaitlist?: boolean;
};

export async function registerStudent(
  input: RegisterInput
): Promise<{ ok: boolean; error?: string; student?: Student; waitlist?: boolean }> {
  const d = db();
  const side: RegistrationSide = input.side === "academic" ? "academic" : "skill";
  const trackKey = side === "academic" ? "academic" : input.trackKey;
  const email = normalizeEmail(input.email);

  if (side === "skill" && !TRACKS.some((t) => t.key === trackKey))
    return { ok: false, error: "Choose a valid skill track." };
  if (side === "academic" && (!input.academic || !input.academic.classLevel || !input.academic.exam))
    return { ok: false, error: "Complete the academics section — class level and exam." };

  /* Programme gate — enforced server-side-of-the-form (same store), not just in the UI. */
  const programme = d.programmes.find((p) => p.key === trackKey);
  if (programme && side === "skill") {
    if (programme.status === "closed")
      return { ok: false, error: "That track is not part of the next intake." };
    if (programme.status === "waitlist" && !input.allowWaitlist)
      return {
        ok: false,
        waitlist: true,
        error: "Full registration for this track opens around March–April 2027. Join the waitlist and you will hear first.",
      };
  }
  if (programme && side === "academic" && programme.status !== "open")
    return { ok: false, error: "Academic registration is not open right now." };

  if (d.students.some((s) => normalizeEmail(s.email) === email))
    return { ok: false, error: "An account with that email already exists. Try signing in." };
  const phone = normalizePhone(input.phone);
  if (d.students.some((s) => normalizePhone(s.phone) === phone))
    return { ok: false, error: "That phone number is already registered." };
  /* Similar-detail guard — same name and date of birth is one person, one KR8 ID. */
  const nameKey = (value: string) =>
    value.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean).sort().join(" ");
  const candidateKey = nameKey(input.name);
  if (input.dob && d.students.some((s) => s.dob === input.dob && nameKey(s.name) === candidateKey))
    return { ok: false, error: "An account with this name and date of birth already exists. Sign in instead." };
  if (input.password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const salt = makeSalt();
  const passwordHash = await hashPassword(input.password, salt);
  const id = makeKr8Id(d.students, trackKey);
  const status = d.settings.autoApprove && d.settings.registrationOpen ? "active" : "pending";

  const student: Student = {
    id,
    name: input.name.trim(),
    nickname: input.nickname?.trim() || undefined,
    email,
    phone,
    country: input.country,
    trackKey,
    dob: input.dob,
    city: input.city?.trim(),
    goal: input.motivation?.trim(),
    passwordHash,
    passwordSalt: salt,
    createdAt: Date.now(),
    role: "student",
    status,
    xpBase: 0,
    weeksDone: [],
    referralCode: makeReferralCode(input.name),
    referredBy: input.referredBy,
    prefs: { emailUpdates: true, whatsappUpdates: true },
    side,
    academic: side === "academic" ? input.academic : undefined,
  };

  mutate((next) => {
    next.students.push(student);
    next.applications.push({
      id: uid("APP"),
      studentId: id,
      trackKey,
      motivation: input.motivation?.trim() ?? "",
      experience: input.experience ?? (side === "academic" ? "Preparing for exams" : "Beginner"),
      status:
        programme && side === "skill" && programme.status === "waitlist"
          ? "waitlist"
          : d.settings.autoApprove && d.settings.registrationOpen
            ? "auto-approved"
            : "pending",
      createdAt: Date.now(),
      side,
      academic: side === "academic" ? input.academic : undefined,
    });
    log(next, student.name, "student.registered", `${student.id} · ${trackName(trackKey)}${side === "academic" ? " · Next Gen Scholars" : ""}`);
  });

  return { ok: true, student };
}

export async function authenticate(
  identifier: string,
  password: string
): Promise<{ ok: boolean; error?: string; student?: Student }> {
  const student = findStudentByIdentifier(identifier);
  if (!student) return { ok: false, error: "No account found with those details." };
  if (student.status === "suspended")
    return { ok: false, error: "This account is suspended. Contact the academy team." };
  if (!(await verifyStoredPassword(student, password)))
    return { ok: false, error: "That password is not correct." };

  /* Password verified — session is established by commitSession() so the
     auth layer can interpose a TOTP check for staff accounts first. */
  return { ok: true, student: getStudent(student.id) ?? student };
}

export function ownerSetupRequired(): boolean {
  return !db().students.some((student) => student.role !== "student");
}

export async function createOwnerAccount(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: boolean; error?: string; student?: Student }> {
  const data = db();
  const name = input.name.trim().replace(/\s+/g, " ");
  const email = normalizeEmail(input.email);
  if (!ownerSetupRequired()) return { ok: false, error: "Academy owner setup has already been completed on this device." };
  if (name.length < 2) return { ok: false, error: "Enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (input.password.length < 8) return { ok: false, error: "Use a password with at least 8 characters." };
  if (data.students.some((student) => normalizeEmail(student.email) === email)) {
    return { ok: false, error: "That email is already attached to an Academy account." };
  }

  const salt = makeSalt();
  const passwordHash = await hashPassword(input.password, salt);
  const owner: Student = {
    id: makeKr8Id(data.students),
    name,
    email,
    phone: "",
    country: "NG",
    trackKey: "web",
    dob: "",
    passwordHash,
    passwordSalt: salt,
    createdAt: Date.now(),
    role: "owner",
    status: "active",
    xpBase: 0,
    weeksDone: [],
    referralCode: "",
    prefs: { emailUpdates: false, whatsappUpdates: false },
  };
  mutate((next) => {
    if (next.students.some((student) => student.role !== "student")) return;
    next.students.push(owner);
    log(next, owner.name, "owner.setup_completed", "First local Academy owner account created.");
  });
  const saved = getStudent(owner.id);
  if (!saved) return { ok: false, error: "The browser could not save the owner account. Check local storage and try again." };
  return { ok: true, student: saved };
}

/* Establishes the session (locally persisted) and stamps lastLoginAt. */
export function commitSession(studentId: string) {
  mutate((d) => {
    const target = d.students.find((s) => s.id === studentId);
    if (target) target.lastLoginAt = Date.now();
  });
  writeSession(studentId);
}

export async function changePassword(
  studentId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const student = getStudent(studentId);
  if (!student) return { ok: false, error: "Account not found." };
  if (!(await verifyStoredPassword(student, currentPassword)))
    return { ok: false, error: "Your current password is incorrect." };
  if (newPassword.length < 8) return { ok: false, error: "New password must be at least 8 characters." };
  const salt = makeSalt();
  const hash = await hashPassword(newPassword, salt);
  mutate((d) => {
    const target = d.students.find((s) => s.id === studentId);
    if (target) {
      target.passwordHash = hash;
      target.passwordSalt = salt;
      target.mustChangePassword = false;
    }
    log(d, student.name, "account.password-changed", studentId);
  });
  return { ok: true };
}

export function updateProfile(
  studentId: string,
  patch: Partial<Pick<Student, "name" | "avatar" | "bio" | "city" | "goal" | "prefs" | "links" | "phone" | "nickname">>
): { ok: boolean; error?: string } {
  const student = getStudent(studentId);
  if (!student) return { ok: false, error: "Account not found." };
  if (patch.name !== undefined && patch.name.trim().length < 2)
    return { ok: false, error: "Name must be at least 2 characters." };
  if (patch.phone !== undefined) {
    const normalized = normalizePhone(patch.phone);
    if (db().students.some((s) => s.id !== studentId && normalizePhone(s.phone) === normalized))
      return { ok: false, error: "That phone number belongs to another account." };
  }
  mutate((d) => {
    const target = d.students.find((s) => s.id === studentId);
    if (!target) return;
    Object.assign(target, patch);
    if (patch.phone) target.phone = normalizePhone(patch.phone);
    log(d, target.name, "account.profile-updated", studentId);
  });
  return { ok: true };
}

export function toggleWeek(studentId: string, week: number, done: boolean) {
  mutate((d) => {
    const target = d.students.find((s) => s.id === studentId);
    if (!target) return;
    const set = new Set(target.weeksDone);
    if (done) set.add(week);
    else set.delete(week);
    target.weeksDone = Array.from(set).sort((a, b) => a - b);
  });
}

export function checkIn(studentId: string, trackKey: string, week: number): { ok: boolean; error?: string } {
  if (getSessionStatus(trackKey, week) !== "open")
    return { ok: false, error: "Check-in for this session is not open yet." };
  if (hasCheckedIn(studentId, trackKey, week)) return { ok: false, error: "You are already checked in." };
  mutate((d) => {
    d.attendance.push({
      id: uid("ATT"),
      studentId,
      sessionId: `${trackKey}-w${week}`,
      trackKey,
      week,
      at: Date.now(),
    });
    log(d, getStudent(studentId)?.name ?? studentId, "attendance.check-in", `${trackKey} · week ${week}`);
  });
  return { ok: true };
}

export function submitAssignment(input: {
  studentId: string;
  week: number;
  title: string;
  url: string;
  note?: string;
}): { ok: boolean; error?: string } {
  const student = getStudent(input.studentId);
  if (!student) return { ok: false, error: "Account not found." };
  const existing = db().submissions.find(
    (s) => s.studentId === input.studentId && s.week === input.week
  );
  if (existing) return { ok: false, error: "You already submitted this week. Edit your submission instead." };
  mutate((d) => {
    d.submissions.push({
      id: uid("SUB"),
      studentId: input.studentId,
      trackKey: student.trackKey,
      week: input.week,
      title: input.title,
      url: input.url,
      note: input.note,
      submittedAt: Date.now(),
      status: "submitted",
    });
    log(d, student.name, "assignment.submitted", `Week ${input.week}`);
  });
  return { ok: true };
}

export function updateSubmission(
  submissionId: string,
  patch: Partial<Pick<Submission, "url" | "note" | "title">>
) {
  mutate((d) => {
    const target = d.submissions.find((s) => s.id === submissionId);
    if (!target || target.status === "accepted") return;
    Object.assign(target, patch, { status: "submitted", submittedAt: Date.now() });
  });
}

export function reviewSubmission(
  submissionId: string,
  status: "accepted" | "revise",
  feedback: string,
  score: number,
  reviewer: string
) {
  mutate((d) => {
    const target = d.submissions.find((s) => s.id === submissionId);
    if (!target) return;
    target.status = status;
    target.feedback = feedback;
    target.score = score;
    target.reviewedAt = Date.now();
    target.reviewedBy = reviewer;
    log(d, reviewer, `assignment.${status}`, `${target.studentId} · week ${target.week}`);
  });
}

export function requestCertificate(studentId: string, tier: CertificateTier): { ok: boolean; error?: string } {
  const student = getStudent(studentId);
  if (!student) return { ok: false, error: "Account not found." };
  const progress = progressFor(student);
  if (!progress.eligible)
    return { ok: false, error: "You have not met the graduation criteria yet — check the progress panel." };
  if (progress.certificates.length > 0) return { ok: false, error: "You already hold a certificate for this track." };
  if (db().certificateRequests.some((r) => r.studentId === studentId && r.status === "pending"))
    return { ok: false, error: "Your request is already with the academy team." };
  mutate((d) => {
    d.certificateRequests.push({
      id: uid("CREQ"),
      studentId,
      trackKey: student.trackKey,
      tier,
      status: "pending",
      createdAt: Date.now(),
    });
    log(d, student.name, "certificate.requested", tier);
  });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Writes — admin                                                       */
/* ------------------------------------------------------------------ */

export function setStudentStatus(studentId: string, status: Student["status"], reason?: string) {
  mutate((d) => {
    const target = d.students.find((s) => s.id === studentId);
    if (!target) return;
    target.status = status;
    log(d, "Admin", `student.${status}`, `${target.name}${reason ? ` · ${reason}` : ""}`);
  });
}

export function countOwners(): number {
  return db().students.filter((s) => s.role === "owner").length;
}

export function ownerGuardError(targetId: string, nextRole: Role): string | null {
  const d = db();
  const target = d.students.find((s) => s.id === targetId);
  if (!target) return "Account not found.";
  if (target.role === "owner" && nextRole !== "owner") {
    const owners = d.students.filter((s) => s.role === "owner");
    if (owners.length <= 2) return "At least two owner accounts must remain. Promote another owner first.";
  }
  return null;
}

export function setStudentRole(studentId: string, role: Role): { ok: boolean; error?: string } {
  const guard = ownerGuardError(studentId, role);
  if (guard) return { ok: false, error: guard };
  mutate((d) => {
    const target = d.students.find((s) => s.id === studentId);
    if (!target) return;
    const previous = target.role;
    target.role = role;
    log(d, "Admin", "student.role", `${target.name} ${previous} → ${role}`);
  });
  return { ok: true };
}

export function deleteStudent(studentId: string): { ok: boolean; error?: string } {
  const guard = ownerGuardError(studentId, "student");
  if (guard) return { ok: false, error: guard };
  mutate((d) => {
    const target = d.students.find((s) => s.id === studentId);
    if (!target) return;
    removeLearnerRecords(d, new Set([studentId]), [target]);
    log(d, "Admin", "student.deleted", target.id);
  });
  return { ok: true };
}

export function reviewApplication(appId: string, status: "approved" | "declined", note?: string) {
  mutate((d) => {
    const target = d.applications.find((a) => a.id === appId);
    if (!target) return;
    target.status = status;
    target.note = note;
    target.reviewedAt = Date.now();
    target.reviewedBy = "Admin";
    const student = d.students.find((s) => s.id === target.studentId);
    if (student) student.status = status === "approved" ? "active" : "pending";
    log(d, "Admin", `application.${status}`, target.studentId);
  });
}

export function issueCertificate(input: {
  studentId: string;
  tier: CertificateTier;
  issuedBy: string;
  variant?: CertificateVariant;
}): { ok: boolean; error?: string; certificate?: Certificate } {
  const student = getStudent(input.studentId);
  if (!student) return { ok: false, error: "Student not found." };
  const existing = db().certificates.find(
    (c) => c.studentId === input.studentId && !c.revoked
  );
  if (existing) return { ok: false, error: "An active certificate already exists for this student." };
  let issued: Certificate | undefined;
  mutate((d) => {
    const variant: CertificateVariant = input.variant ?? input.tier;
    const code = makeCertificateCode(d.certificates, input.tier, variant);
    const certificate: Certificate = {
      id: uid("CERT"),
      code,
      studentId: student.id,
      trackKey: student.trackKey,
      tier: input.tier,
      issuedAt: Date.now(),
      issuedBy: input.issuedBy,
      studentNameSnapshot: student.name,
      variant,
    };
    d.certificates.push(certificate);
    issued = certificate;
    const request = d.certificateRequests.find((r) => r.studentId === student.id && r.status === "pending");
    if (request) {
      request.status = "approved";
      request.reviewedAt = Date.now();
    }
    log(d, input.issuedBy, "certificate.issued", `${student.name} · ${code}`);
  });
  if (!issued) return { ok: false, error: "The certificate could not be issued. Try again." };
  return { ok: true, certificate: issued };
}

export function revokeCertificate(certId: string, reason: string) {
  mutate((d) => {
    const target = d.certificates.find((c) => c.id === certId);
    if (!target) return;
    target.revoked = true;
    target.revokedReason = reason;
    log(d, "Admin", "certificate.revoked", `${target.code} · ${reason}`);
  });
}

export function declineCertificateRequest(requestId: string, note?: string) {
  mutate((d) => {
    const target = d.certificateRequests.find((r) => r.id === requestId);
    if (!target) return;
    target.status = "declined";
    target.note = note;
    target.reviewedAt = Date.now();
  });
}

export function setSessionStatus(trackKey: string, week: number, status: SessionState["status"]) {
  mutate((d) => {
    const id = `${trackKey}-w${week}`;
    const existing = d.sessionStates.find((s) => s.id === id);
    if (existing) {
      existing.status = status;
      existing.updatedAt = Date.now();
    } else {
      d.sessionStates.push({ id, trackKey, week, status, updatedAt: Date.now() });
    }
    log(d, "Admin", `session.${status}`, `${trackName(trackKey)} · week ${week}`);
  });
}

export function saveAnnouncement(input: Omit<Announcement, "id" | "createdAt"> & { id?: string }) {
  mutate((d) => {
    if (input.id) {
      const target = d.announcements.find((a) => a.id === input.id);
      if (target) Object.assign(target, input);
    } else {
      d.announcements.unshift({ ...input, id: uid("ANN"), createdAt: Date.now() });
    }
    log(d, input.author, "announcement.saved", input.title);
  });
}

export function deleteAnnouncement(id: string) {
  mutate((d) => {
    d.announcements = d.announcements.filter((a) => a.id !== id);
  });
}

export function saveSettings(patch: Partial<Settings>) {
  mutate((d) => {
    d.settings = { ...d.settings, ...patch };
    log(d, "Admin", "settings.updated", Object.keys(patch).join(", "));
  });
}

export function resetTrackProgress(studentId: string) {
  mutate((d) => {
    const target = d.students.find((s) => s.id === studentId);
    if (!target) return;
    target.weeksDone = [];
    d.submissions = d.submissions.filter((s) => s.studentId !== studentId);
    d.attendance = d.attendance.filter((a) => a.studentId !== studentId);
    log(d, "Admin", "student.progress-reset", studentId);
  });
}

/* ------------------------------------------------------------------ */
/* Backup                                                               */
/* ------------------------------------------------------------------ */

export function exportDatabase(): string {
  return JSON.stringify(db(), null, 2);
}

const MAX_IMPORT_BYTES = 5_000_000;
const MAX_IMPORT_RECORDS = 20_000;
const MAX_IMPORT_NODES = 200_000;

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeJsonTree(value: unknown, depth = 0, count = { nodes: 0 }): boolean {
  count.nodes += 1;
  if (count.nodes > MAX_IMPORT_NODES || depth > 40) return false;
  if (Array.isArray(value)) {
    if (value.length > MAX_IMPORT_RECORDS) return false;
    return value.every((child) => safeJsonTree(child, depth + 1, count));
  }
  if (!isJsonRecord(value)) return value === null || ["string", "number", "boolean"].includes(typeof value);
  const entries = Object.entries(value);
  if (entries.length > 2_000) return false;
  return entries.every(([key, child]) =>
    key !== "__proto__" && key !== "prototype" && key !== "constructor" && safeJsonTree(child, depth + 1, count)
  );
}

const IMPORT_ARRAY_KEYS = [
  "students", "applications", "submissions", "attendance", "sessionStates", "certificates",
  "certificateRequests", "announcements", "auditLog", "programmes", "waitlist", "components",
  "scores", "overrides", "utmeSlips", "awardTiers", "awardGrants", "examModules", "examAttempts",
  "notifications", "monthlyAwards", "subscribers", "learningGroups", "outbox", "broadcasts", "history",
] as const;

const IMPORT_RECORD_STRINGS: Partial<Record<(typeof IMPORT_ARRAY_KEYS)[number], string[]>> = {
  students: ["id", "name", "email", "phone", "country", "trackKey", "dob", "passwordHash", "passwordSalt", "role", "status", "referralCode"],
  applications: ["id", "studentId", "trackKey", "motivation", "experience", "status"],
  submissions: ["id", "studentId", "trackKey", "title", "url", "status"],
  attendance: ["id", "studentId", "sessionId", "trackKey"],
  sessionStates: ["id", "trackKey", "status"],
  certificates: ["id", "code", "studentId", "trackKey", "tier", "issuedBy", "studentNameSnapshot"],
  certificateRequests: ["id", "studentId", "trackKey", "tier", "status"],
  announcements: ["id", "title", "body", "trackKey", "author"],
  auditLog: ["id", "actor", "action", "detail"],
  programmes: ["key", "status", "note"],
  waitlist: ["id", "name", "email", "whatsapp", "country", "trackKey", "side"],
  components: ["id", "name"],
  examModules: ["id", "title", "instructions"],
  notifications: ["id", "studentId", "kind", "title", "body"],
  subscribers: ["id", "email", "source"],
  learningGroups: ["id", "kind", "name", "joinUrl"],
  outbox: ["id", "to", "text", "kind", "status"],
  history: ["id", "actor", "label", "snapshot"],
};

const IMPORT_RECORD_NUMBERS: Partial<Record<(typeof IMPORT_ARRAY_KEYS)[number], string[]>> = {
  students: ["createdAt", "xpBase"],
  applications: ["createdAt"],
  submissions: ["week", "submittedAt"],
  attendance: ["week", "at"],
  sessionStates: ["week", "updatedAt"],
  certificates: ["issuedAt"],
  certificateRequests: ["createdAt"],
  announcements: ["createdAt"],
  auditLog: ["at"],
  waitlist: ["createdAt"],
  components: ["order"],
  examAttempts: ["scorePct", "startedAt", "submittedAt"],
  notifications: ["createdAt"],
  monthlyAwards: ["createdAt"],
  subscribers: ["createdAt"],
  broadcasts: ["at", "audienceCount", "sent", "queued", "failed", "skipped"],
  history: ["at"],
};

const IMPORT_ENUMS: Partial<Record<(typeof IMPORT_ARRAY_KEYS)[number], Record<string, string[]>>> = {
  students: {
    role: ["student", "owner", "admin", "coach", "reviewer", "editor", "superadmin"],
    status: ["pending", "active", "paused", "suspended"],
  },
  applications: { status: ["auto-approved", "pending", "approved", "declined", "waitlist"] },
  submissions: { status: ["submitted", "accepted", "revise"] },
  sessionStates: { status: ["scheduled", "open", "closed"] },
  certificates: { tier: ["Completion", "Professionalism"] },
  certificateRequests: { status: ["pending", "approved", "declined"], tier: ["Completion", "Professionalism"] },
  waitlist: { side: ["skill", "academic"] },
  programmes: { status: ["open", "waitlist", "closed"] },
  notifications: { kind: ["nudge", "award", "welcome", "system", "broadcast"] },
  outbox: { status: ["queued", "sent", "failed"] },
};

function validateImportShape(parsed: unknown): string | null {
  if (!isJsonRecord(parsed) || !Array.isArray(parsed.students)) {
    return "That file is not a KR8 Academy backup. Select an exported JSON backup and try again.";
  }
  if (!safeJsonTree(parsed)) {
    return "The backup contains an unsupported or overly complex data structure. Export a fresh copy from Academy and try again.";
  }
  const version = parsed.version === undefined ? 0 : parsed.version;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 0) {
    return "The backup has an invalid schema version. Export a fresh JSON backup and try again.";
  }
  if (version > SCHEMA_VERSION) {
    return "That backup came from a newer build of the academy. Update the site, then import it again.";
  }

  const ids = new Set<string>();
  for (const [index, student] of parsed.students.entries()) {
    if (!isJsonRecord(student)) return `Student record ${index + 1} is invalid. Nothing was imported.`;
    for (const field of IMPORT_RECORD_STRINGS.students ?? []) {
      if (typeof student[field] !== "string" || (student[field] as string).length > 4_096) {
        return `Student record ${index + 1} has an invalid ${field} field. Nothing was imported.`;
      }
    }
    if (ids.has(student.id as string)) return "The backup contains duplicate student IDs. Nothing was imported.";
    ids.add(student.id as string);
    for (const field of IMPORT_RECORD_NUMBERS.students ?? []) {
      if (typeof student[field] !== "number" || !Number.isFinite(student[field])) {
        return `Student record ${index + 1} has an invalid ${field} field. Nothing was imported.`;
      }
    }
    if (!Array.isArray(student.weeksDone) || student.weeksDone.some((week) => !Number.isInteger(week) || week < 1 || week > 60)) {
      return `Student record ${index + 1} has an invalid progress list. Nothing was imported.`;
    }
    if (!isJsonRecord(student.prefs) || typeof student.prefs.emailUpdates !== "boolean" || typeof student.prefs.whatsappUpdates !== "boolean") {
      return `Student record ${index + 1} has invalid notification preferences. Nothing was imported.`;
    }
    for (const [field, allowed] of Object.entries(IMPORT_ENUMS.students ?? {})) {
      if (!allowed.includes(String(student[field]))) return `Student record ${index + 1} has an invalid ${field} value. Nothing was imported.`;
    }
  }

  for (const key of IMPORT_ARRAY_KEYS) {
    const value = parsed[key];
    if (value === undefined) continue;
    if (!Array.isArray(value) || value.length > MAX_IMPORT_RECORDS) {
      return `The ${key} collection is invalid or too large. Nothing was imported.`;
    }
    for (const [index, record] of value.entries()) {
      if (!isJsonRecord(record)) return `Record ${index + 1} in ${key} is invalid. Nothing was imported.`;
      for (const field of IMPORT_RECORD_STRINGS[key] ?? []) {
        if (typeof record[field] !== "string" || (record[field] as string).length > 1_000_000) {
          return `Record ${index + 1} in ${key} has an invalid ${field} field. Nothing was imported.`;
        }
      }
      for (const field of IMPORT_RECORD_NUMBERS[key] ?? []) {
        if (typeof record[field] !== "number" || !Number.isFinite(record[field])) {
          return `Record ${index + 1} in ${key} has an invalid ${field} field. Nothing was imported.`;
        }
      }
      for (const [field, allowed] of Object.entries(IMPORT_ENUMS[key] ?? {})) {
        if (!allowed.includes(String(record[field]))) return `Record ${index + 1} in ${key} has an invalid ${field} value. Nothing was imported.`;
      }
    }
  }

  if (parsed.settings !== undefined && !isJsonRecord(parsed.settings)) return "The settings section is invalid. Nothing was imported.";
  if (parsed.content !== undefined && !isJsonRecord(parsed.content)) return "The content section is invalid. Nothing was imported.";
  if (parsed.security !== undefined && !isJsonRecord(parsed.security)) return "The security section is invalid. Nothing was imported.";
  if (parsed.security && isJsonRecord(parsed.security)) {
    if (parsed.security.totpEnabled !== undefined && typeof parsed.security.totpEnabled !== "boolean") return "The security section is invalid. Nothing was imported.";
    if (parsed.security.totpSecret !== undefined && parsed.security.totpSecret !== null && typeof parsed.security.totpSecret !== "string") return "The security section is invalid. Nothing was imported.";
    for (const key of ["recoveryCodeHashes", "recoveryCodes"]) {
      const value = parsed.security[key];
      if (value !== undefined && (!Array.isArray(value) || value.some((item) => typeof item !== "string"))) return "The security section is invalid. Nothing was imported.";
    }
  }
  if (parsed.settings && isJsonRecord(parsed.settings)) {
    const settings = parsed.settings;
    const stringFields = ["cohortName", "cohortStart", "applicationDeadline", "whatsappUrl", "supportEmail", "agencyUrl", "instagram", "tiktok", "youtube", "cohortSeatsNote", "classStart", "classEnd", "classAttendanceStart", "classAttendanceEnd", "assignmentWindowStart", "assignmentWindowEnd", "timeZone", "partnerName", "academicStartNote", "supportFromName", "wallIntro"];
    const booleanFields = ["registrationOpen", "autoApprove", "certificateRequiresApproval"];
    const numberFields = ["skillsCertificateThreshold", "skillsGraceFloor", "utmeCertificateThreshold", "kr8ExamPassMark", "jambMinParticipationPct", "expectedClassCount", "expectedAssignmentCount", "waitlistPriorityHours"];
    if (stringFields.some((field) => settings[field] !== undefined && typeof settings[field] !== "string")) return "A settings field has the wrong data type. Nothing was imported.";
    if (booleanFields.some((field) => settings[field] !== undefined && typeof settings[field] !== "boolean")) return "A settings field has the wrong data type. Nothing was imported.";
    if (numberFields.some((field) => settings[field] !== undefined && (typeof settings[field] !== "number" || !Number.isFinite(settings[field] as number)))) return "A settings field has the wrong data type. Nothing was imported.";
    for (const field of ["classDays", "assignmentDays"]) {
      const days = settings[field];
      if (days !== undefined && (!Array.isArray(days) || days.some((day) => typeof day !== "string"))) return "A settings schedule is invalid. Nothing was imported.";
    }
  }
  if (parsed.content && isJsonRecord(parsed.content)) {
    for (const key of ["published", "draft"]) {
      const content = parsed.content[key];
      if (content === undefined) continue;
      if (!isJsonRecord(content) || Object.values(content).some((value) =>
        typeof value !== "string" && !(Array.isArray(value) && value.every((item) => typeof item === "string"))
      )) return "The content section is invalid. Nothing was imported.";
    }
  }
  if (parsed.emailTemplates !== undefined) {
    if (!isJsonRecord(parsed.emailTemplates) || Object.values(parsed.emailTemplates).some((template) =>
      !isJsonRecord(template) || typeof template.subject !== "string" || typeof template.body !== "string"
    )) return "The email-template section is invalid. Nothing was imported.";
  }
  if (parsed.examModules !== undefined && Array.isArray(parsed.examModules)) {
    for (const module of parsed.examModules) {
      if (!isJsonRecord(module)) continue;
      if (module.questions !== undefined && (!Array.isArray(module.questions) || module.questions.some((question) =>
        !isJsonRecord(question) || typeof question.prompt !== "string" || !Array.isArray(question.options) ||
        question.options.some((option) => typeof option !== "string") || typeof question.correctIndex !== "number" ||
        typeof question.points !== "number"
      ))) return "An exam module contains an invalid question. Nothing was imported.";
    }
  }
  if (parsed.broadcasts !== undefined && Array.isArray(parsed.broadcasts)) {
    for (const broadcast of parsed.broadcasts) {
      if (isJsonRecord(broadcast) && broadcast.recipients !== undefined && (!Array.isArray(broadcast.recipients) || broadcast.recipients.some((recipient) =>
        !isJsonRecord(recipient) || typeof recipient.studentId !== "string" || typeof recipient.name !== "string" || typeof recipient.phone !== "string"
      ))) return "A broadcast recipient record is invalid. Nothing was imported.";
    }
  }

  return null;
}

type ParsedImport = { ok: true; parsed: Partial<Db> } | { ok: false; error: string };

function parseDatabaseImport(json: unknown): ParsedImport {
  if (typeof json !== "string") {
    return { ok: false, error: "That backup is not readable JSON. The current local workspace was left unchanged." };
  }
  if (json.length > MAX_IMPORT_BYTES || new TextEncoder().encode(json).byteLength > MAX_IMPORT_BYTES) {
    return { ok: false, error: "This backup is larger than the 5 MB local import limit. Export a smaller backup or remove large attachments before trying again." };
  }
  try {
    const parsed: unknown = JSON.parse(json);
    const invalid = validateImportShape(parsed);
    if (invalid) return { ok: false, error: invalid };
    return { ok: true, parsed: parsed as Partial<Db> };
  } catch {
    return { ok: false, error: "Could not read that backup. The current local workspace was left unchanged; restore an exported JSON backup and try again." };
  }
}

export function validateDatabaseImport(json: string): { ok: boolean; error?: string } {
  const result = parseDatabaseImport(json);
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export function importDatabase(json: string): { ok: boolean; error?: string; safetySnapshotSaved?: boolean } {
  const validation = parseDatabaseImport(json);
  if (!validation.ok) return { ok: false, error: validation.error };
  try {
    const merged = fillV3(validation.parsed);
    const currentCopy = JSON.parse(JSON.stringify({ ...db(), version: SCHEMA_VERSION })) as Partial<Db>;
    const prior = fillV3(currentCopy);
    prior.history = [];
    const priorSnapshot = JSON.stringify(prior);
    const safetySnapshotSaved = new TextEncoder().encode(priorSnapshot).byteLength <= 2_500_000;
    merged.history = safetySnapshotSaved
      ? [{ id: uid("VER"), at: Date.now(), actor: "System", label: "Before import", snapshot: priorSnapshot }, ...merged.history].slice(0, 3)
      : merged.history.slice(0, 3);
    merged.auditLog = [
      ...(!safetySnapshotSaved ? [{
        id: uid("LOG"),
        at: Date.now(),
        actor: "System",
        action: "history.skipped",
        detail: "Automatic pre-import snapshot skipped because the current local workspace exceeds the 2.5 MB snapshot budget.",
      }] : []),
      {
        id: uid("LOG"),
        at: Date.now(),
        actor: "Admin",
        action: "academy.imported",
        detail: "Backup imported and upgraded to the current schema.",
      },
      ...merged.auditLog,
    ].slice(0, 400);
    const session = readSession();
    if (!persistImported(merged)) {
      return { ok: false, error: "The browser could not save this restore. The current local workspace was left unchanged; free some browser storage and try again." };
    }
    if (session && !merged.students.some((student) => student.id === session.studentId)) clearSession();
    return { ok: true, safetySnapshotSaved };
  } catch {
    return { ok: false, error: "Could not restore that backup. The current local workspace was left unchanged; export a fresh backup and try again." };
  }
}

export function storageSizeKb(): number {
  try {
    return Math.round((rawRead()?.length ?? 0) / 1024);
  } catch {
    return 0;
  }
}

export { SCHEMA_VERSION, STORAGE_KEY, SESSION_KEY, MAX_IMPORT_BYTES };

/* ================================================================== */
/* v3 API — programmes, waitlist, scores, awards, exams, content,       */
/* history, security. Everything mutates through `mutate` so the UI,     */
/* audit log and exports stay in lock-step.                              */
/* ================================================================== */

/* ---------------- Programmes ---------------- */

export function listProgrammes(): Programme[] {
  return db().programmes;
}

export function getProgramme(key: string): Programme | undefined {
  return db().programmes.find((p) => p.key === key);
}

export function setProgramme(
  key: string,
  patch: Partial<Omit<Programme, "key" | "side">>,
  actor: string
) {
  mutate((d) => {
    const target = d.programmes.find((p) => p.key === key);
    if (!target) return;
    Object.assign(target, patch);
    log(d, actor, "programme.updated", `${key} → ${patch.status ?? target.status}${patch.opensAt !== undefined ? ` · opens ${patch.opensAt ?? "unset"}` : ""}`);
  });
}

/* ---------------- Waitlist ---------------- */

export type WaitlistInput = {
  name: string;
  email: string;
  whatsapp: string;
  country: string;
  trackKey: string;
  side?: RegistrationSide;
};

export function joinWaitlist(input: WaitlistInput): { ok: boolean; error?: string; duplicate?: boolean } {
  const email = normalizeEmail(input.email);
  const whatsapp = normalizePhone(input.whatsapp);
  if (!input.name.trim() || input.name.trim().length < 2) return { ok: false, error: "Enter your full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (whatsapp.replace(/\D/g, "").length < 7) return { ok: false, error: "Enter a valid WhatsApp number." };
  const d = db();
  const existing = d.waitlist.find(
    (w) => normalizeEmail(w.email) === email || normalizePhone(w.whatsapp) === whatsapp
  );
  if (existing) return { ok: true, duplicate: true };
  mutate((next) => {
    next.waitlist.push({
      id: uid("WL"),
      name: input.name.trim(),
      email,
      whatsapp,
      country: input.country,
      trackKey: input.trackKey,
      side: input.side ?? "skill",
      createdAt: Date.now(),
    });
    log(next, input.name.trim(), "waitlist.joined", `${input.trackKey} · ${email}`);
  });
  return { ok: true };
}

export function markWaitlistNotified(ids: string[], actor: string) {
  mutate((d) => {
    const set = new Set(ids);
    d.waitlist.forEach((w) => {
      if (set.has(w.id) && !w.notifiedAt) w.notifiedAt = Date.now();
    });
    log(d, actor, "waitlist.notified", `${ids.length} entr${ids.length === 1 ? "y" : "ies"} marked notified`);
  });
}

export function removeWaitlistEntry(id: string, actor: string) {
  mutate((d) => {
    const target = d.waitlist.find((w) => w.id === id);
    d.waitlist = d.waitlist.filter((w) => w.id !== id);
    if (target) log(d, actor, "waitlist.removed", target.email);
  });
}

export function waitlistForTrack(trackKey: string) {
  return db().waitlist.filter((w) => w.trackKey === trackKey);
}

/* ---------------- Scoring components & scores ---------------- */

export function upsertScoringComponent(
  input: { id?: string; name: string; active?: boolean },
  actor: string
): { ok: boolean; error?: string } {
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Give the component a name." };
  mutate((d) => {
    if (input.id) {
      const target = d.components.find((c) => c.id === input.id);
      if (target) {
        target.name = name;
        if (input.active !== undefined) target.active = input.active;
        log(d, actor, "component.renamed", `${input.id} → ${name}`);
      }
      return;
    }
    const order = d.components.reduce((max, c) => Math.max(max, c.order), 0) + 1;
    d.components.push({ id: uid("COMP"), name, active: input.active ?? true, order });
    log(d, actor, "component.added", name);
  });
  return { ok: true };
}

export function removeScoringComponent(id: string, actor: string) {
  mutate((d) => {
    const target = d.components.find((c) => c.id === id);
    d.components = d.components.filter((c) => c.id !== id);
    d.scores = d.scores.filter((s) => s.componentId !== id);
    if (target) log(d, actor, "component.removed", target.name);
  });
}

export function moveScoringComponent(id: string, direction: -1 | 1, actor: string) {
  mutate((d) => {
    const sorted = [...d.components].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((c) => c.id === id);
    const swap = index + direction;
    if (index < 0 || swap < 0 || swap >= sorted.length) return;
    const current = sorted[index].order;
    sorted[index].order = sorted[swap].order;
    sorted[swap].order = current;
    log(d, actor, "component.reordered", sorted[index].name);
  });
}

export function setScoringComponentActive(id: string, active: boolean, actor: string) {
  mutate((d) => {
    const target = d.components.find((c) => c.id === id);
    if (target) {
      target.active = active;
      log(d, actor, active ? "component.activated" : "component.deactivated", target.name);
    }
  });
}

/* score: 0–100, or null to clear. Every scored component is out of 100. */
export function setComponentScore(
  studentId: string,
  componentId: string,
  score: number | null,
  actor: string
): { ok: boolean; error?: string } {
  if (score !== null && (!Number.isFinite(score) || score < 0 || score > 100))
    return { ok: false, error: "Scores are out of 100." };
  mutate((d) => {
    const existing = d.scores.find((s) => s.studentId === studentId && s.componentId === componentId);
    if (score === null) {
      d.scores = d.scores.filter((s) => !(s.studentId === studentId && s.componentId === componentId));
      log(d, actor, "score.cleared", `${studentId} · ${componentId}`);
      return;
    }
    if (existing) {
      existing.score = Math.round(score * 100) / 100;
      existing.enteredBy = actor;
      existing.enteredAt = Date.now();
    } else {
      d.scores.push({ id: uid("SCO"), studentId, componentId, score: Math.round(score * 100) / 100, enteredBy: actor, enteredAt: Date.now() });
    }
    log(d, actor, "score.recorded", `${studentId} · ${componentId} → ${score}`);
  });
  return { ok: true };
}

/* Admin grace override — only inside [floor, threshold). Who & why are mandatory. */
export function recordOverride(
  studentId: string,
  reason: string,
  actor: string
): { ok: boolean; error?: string } {
  const check = canOverride(db(), studentId);
  if (!check.ok) return { ok: false, error: check.reason ?? "Override not allowed." };
  const why = reason.trim();
  if (why.length < 10) return { ok: false, error: "Give a real reason — at least 10 characters." };
  mutate((d) => {
    d.overrides = d.overrides.filter((o) => o.studentId !== studentId);
    d.overrides.push({
      id: uid("OVR"),
      studentId,
      finalScoreAtOverride: check.average ?? 0,
      reason: why,
      actor,
      at: Date.now(),
    });
    log(d, actor, "override.recorded", `${studentId} · ${check.average}% · ${why}`);
  });
  return { ok: true };
}

export function removeOverride(studentId: string, actor: string) {
  mutate((d) => {
    d.overrides = d.overrides.filter((o) => o.studentId !== studentId);
    log(d, actor, "override.removed", studentId);
  });
}

/* ---------------- UTME slips & verification ---------------- */

export function submitUtmeSlip(
  studentId: string,
  input: { score: number; fileName: string; dataUrl: string; note?: string }
): { ok: boolean; error?: string } {
  const score = Math.round(Number(input.score));
  if (!Number.isFinite(score) || score < 0 || score > 400)
    return { ok: false, error: "UTME scores are between 0 and 400." };
  if (!input.dataUrl || input.dataUrl.length < 100)
    return { ok: false, error: "Upload the photo or scan of your official result slip." };
  mutate((d) => {
    // One pending slip at a time; resubmitting replaces the pending one.
    d.utmeSlips = d.utmeSlips.filter((s) => !(s.studentId === studentId && s.status === "pending"));
    d.utmeSlips.push({
      id: uid("SLIP"),
      studentId,
      score,
      fileName: input.fileName,
      dataUrl: input.dataUrl,
      note: input.note?.trim() || undefined,
      status: "pending",
      submittedAt: Date.now(),
    });
    log(d, getStudent(studentId)?.name ?? studentId, "utme.slip-submitted", `score ${score}`);
  });
  return { ok: true };
}

export function reviewUtmeSlip(
  slipId: string,
  approve: boolean,
  note: string,
  actor: string
): { ok: boolean; error?: string } {
  const d = db();
  const slip = d.utmeSlips.find((s) => s.id === slipId);
  if (!slip) return { ok: false, error: "Slip not found." };
  if (slip.status !== "pending") return { ok: false, error: "That slip has already been reviewed." };
  mutate((next) => {
    const target = next.utmeSlips.find((s) => s.id === slipId);
    if (!target) return;
    target.status = approve ? "verified" : "rejected";
    target.reviewedBy = actor;
    target.reviewedAt = Date.now();
    target.reviewNote = note.trim() || undefined;
    if (approve) {
      const tier = tierForScore(next.awardTiers.filter((t) => t.scope === "utme"), target.score);
      // Awards stay pending until a later, separate approval. Verification only
      // unlocks eligibility; it never pays anyone.
      next.awardGrants = next.awardGrants.filter((g) => !(g.slipId === target.id && g.status === "pending"));
      if (tier) {
        next.awardGrants.push({
          id: uid("AWD"),
          studentId: target.studentId,
          tierId: tier.id,
          scope: "utme",
          scoreUsed: target.score,
          slipId: target.id,
          status: "pending",
          createdAt: Date.now(),
          published: false,
        });
      }
      log(next, actor, "utme.slip-verified", `${target.studentId} · ${target.score}${tier ? ` · ${tier.name}` : " · below award tiers"}`);
    } else {
      next.awardGrants = next.awardGrants.filter((g) => g.slipId !== target.id);
      log(next, actor, "utme.slip-rejected", `${target.studentId} · ${note.trim() || "no reason given"}`);
    }
  });
  return { ok: true };
}

/* ---------------- Awards ---------------- */

export function decideAwardGrant(
  grantId: string,
  decision: "approved" | "paid" | "rejected",
  actor: string,
  note?: string
): { ok: boolean; error?: string } {
  const d = db();
  const grant = d.awardGrants.find((g) => g.id === grantId);
  if (!grant) return { ok: false, error: "Award not found." };
  if (grant.status === "paid" && decision !== "paid") return { ok: false, error: "That award is already marked paid." };
  // Hard gate: a UTME prize can only be approved once the candidate meets the
  // configured minimum participation — the slip being verified is not enough.
  if (decision === "approved" && grant.scope === "utme" && !meetsUtmeParticipation(d, grant.studentId)) {
    return {
      ok: false,
      error: `Participation is below the ${d.settings.jambMinParticipationPct}% minimum — the slip can be verified, but no prize may be approved.`,
    };
  }
  mutate((next) => {
    const target = next.awardGrants.find((g) => g.id === grantId);
    if (!target) return;
    target.status = decision;
    target.decidedBy = actor;
    target.decidedAt = Date.now();
    target.note = note?.trim() || target.note;
    if (decision === "rejected") target.published = false;
    log(next, actor, `award.${decision}`, `${target.studentId} · ${target.scope} · score ${target.scoreUsed}${note ? ` · ${note.trim()}` : ""}`);
  });
  return { ok: true };
}

export function toggleGrantPublished(grantId: string, actor: string) {
  mutate((d) => {
    const target = d.awardGrants.find((g) => g.id === grantId);
    if (!target) return;
    target.published = !target.published;
    log(d, actor, target.published ? "award.published" : "award.unpublished", `${target.studentId} · ${target.tierId}`);
  });
}

export function saveAwardTier(
  input: Omit<AwardTier, "id"> & { id?: string },
  actor: string
): { ok: boolean; error?: string } {
  const draft: AwardTier = { ...input, id: input.id ?? uid("TIER") };
  const d = db();
  const others = d.awardTiers.filter((t) => t.id !== draft.id);
  const candidate = [...others, draft];
  const problem = validateUtmeTiers(candidate.filter((t) => t.scope === "utme"));
  if (problem) return { ok: false, error: problem };
  mutate((next) => {
    const index = next.awardTiers.findIndex((t) => t.id === draft.id);
    if (index >= 0) next.awardTiers[index] = draft;
    else next.awardTiers.push(draft);
    log(next, actor, "award-tier.saved", `${draft.name} · ${draft.min}–${draft.max}`);
  });
  return { ok: true };
}

export function deleteAwardTier(id: string, actor: string) {
  mutate((d) => {
    const target = d.awardTiers.find((t) => t.id === id);
    d.awardTiers = d.awardTiers.filter((t) => t.id !== id);
    if (target) log(d, actor, "award-tier.deleted", target.name);
  });
}

export function markAwardTiersReviewed(actor: string) {
  mutate((d) => {
    d.awardTiers.forEach((t) => {
      t.pendingReview = false;
    });
    log(d, actor, "award-tiers.reviewed", "All tiers marked as reviewed by Timfire.");
  });
}

export function getWall() {
  return wallRows(db());
}

/* ---------------- KR8 exam module ---------------- */

export function saveExamModule(
  input: { id?: string; title: string; instructions: string; durationMin: number; passMark: number; active?: boolean; questions?: import("./types").ExamQuestion[] },
  actor: string
): { ok: boolean; error?: string; id?: string } {
  const title = input.title.trim();
  if (title.length < 3) return { ok: false, error: "Give the exam a title." };
  const durationMin = Math.max(5, Math.min(300, Math.round(input.durationMin) || 60));
  const passMark = Math.max(1, Math.min(100, Math.round(input.passMark) || 80));
  mutate((d) => {
    if (input.id) {
      const target = d.examModules.find((m) => m.id === input.id);
      if (target) {
        target.title = title;
        target.instructions = input.instructions;
        target.durationMin = durationMin;
        target.passMark = passMark;
        if (input.active !== undefined) target.active = input.active;
        if (input.questions) target.questions = input.questions;
        log(d, actor, "exam.saved", title);
      }
      return;
    }
    d.examModules.push({
      id: uid("EXAM"),
      title,
      instructions: input.instructions,
      durationMin,
      passMark,
      active: input.active ?? true,
      questions: input.questions ?? [],
    });
    log(d, actor, "exam.created", title);
  });
  return { ok: true };
}

export function deleteExamModule(id: string, actor: string) {
  mutate((d) => {
    const target = d.examModules.find((m) => m.id === id);
    d.examModules = d.examModules.filter((m) => m.id !== id);
    if (target) log(d, actor, "exam.deleted", target.title);
  });
}

export function setExamModuleActive(id: string, active: boolean, actor: string) {
  mutate((d) => {
    const target = d.examModules.find((m) => m.id === id);
    if (target) {
      target.active = active;
      log(d, actor, active ? "exam.activated" : "exam.deactivated", target.title);
    }
  });
}

export function startExamAttempt(
  moduleId: string,
  studentId: string
): { ok: boolean; attemptId?: string; error?: string } {
  const d = db();
  const module = d.examModules.find((m) => m.id === moduleId);
  if (!module) return { ok: false, error: "Exam not found." };
  if (!module.active) return { ok: false, error: "That exam is not open right now." };
  if (module.questions.length === 0) return { ok: false, error: "This exam has no questions yet." };
  const attemptId = uid("ATT");
  mutate((next) => {
    next.examAttempts.push({
      id: attemptId,
      moduleId,
      studentId,
      answers: [],
      scorePct: 0,
      passed: false,
      startedAt: Date.now(),
      submittedAt: 0,
    });
    log(next, getStudent(studentId)?.name ?? studentId, "exam.started", module.title);
  });
  return { ok: true, attemptId };
}

export function submitExamAttempt(
  attemptId: string,
  answers: Array<number | null>
): { ok: boolean; error?: string; scorePct?: number; passed?: boolean } {
  const d = db();
  const attempt = d.examAttempts.find((a) => a.id === attemptId);
  if (!attempt) return { ok: false, error: "Attempt not found." };
  if (attempt.submittedAt > 0) return { ok: false, error: "That attempt was already submitted." };
  const module = d.examModules.find((m) => m.id === attempt.moduleId);
  if (!module) return { ok: false, error: "Exam not found." };
  let earned = 0;
  let possible = 0;
  module.questions.forEach((question, i) => {
    possible += question.points;
    if (answers[i] === question.correctIndex) earned += question.points;
  });
  const scorePct = possible > 0 ? Math.round((earned / possible) * 1000) / 10 : 0;
  const passed = scorePct >= module.passMark;
  mutate((next) => {
    const target = next.examAttempts.find((a) => a.id === attemptId);
    if (!target) return;
    target.answers = answers.map((a) => (a === null ? -1 : a));
    target.scorePct = scorePct;
    target.passed = passed;
    target.submittedAt = Date.now();
    log(next, getStudent(target.studentId)?.name ?? target.studentId, "exam.submitted", `${module.title} · ${scorePct}%`);
  });
  return { ok: true, scorePct, passed };
}

/* ---------------- Content studio ---------------- */

export function saveDraftContent(key: string, value: string) {
  mutate((d) => {
    d.content.draft = { ...d.content.draft, [key]: value };
  });
}

export function publishContent(actor: string): { ok: boolean; changed: number } {
  const d = db();
  const keys = new Set([...Object.keys(d.content.published), ...Object.keys(d.content.draft)]);
  let changed = 0;
  mutate((next) => {
    next.content = {
      published: { ...next.content.draft },
      draft: { ...next.content.draft },
    };
    keys.forEach((key) => {
      if (JSON.stringify(d.content.published[key]) !== JSON.stringify(d.content.draft[key])) changed += 1;
    });
    if (changed > 0) log(next, actor, "content.published", `${changed} field${changed === 1 ? "" : "s"} published`);
  });
  return { ok: true, changed };
}

export function discardContentDraft(actor: string) {
  mutate((d) => {
    d.content.draft = { ...d.content.published };
    log(d, actor, "content.discarded", "Draft copy discarded; published copy kept.");
  });
}

export function resetContentKey(key: string, actor: string) {
  mutate((d) => {
    const draft = { ...d.content.draft };
    const published = { ...d.content.published };
    delete draft[key];
    delete published[key];
    d.content = { draft, published };
    log(d, actor, "content.reset", key);
  });
}

export function saveEmailTemplate(key: string, patch: Partial<EmailTemplate>, actor: string) {
  mutate((d) => {
    const current = d.emailTemplates[key] ?? DEFAULT_EMAIL_TEMPLATES[key];
    if (!current) return;
    d.emailTemplates[key] = { ...current, ...patch };
    log(d, actor, "email-template.saved", key);
  });
}

export function resetEmailTemplate(key: string, actor: string) {
  mutate((d) => {
    if (DEFAULT_EMAIL_TEMPLATES[key]) {
      d.emailTemplates[key] = { ...DEFAULT_EMAIL_TEMPLATES[key] };
      log(d, actor, "email-template.reset", key);
    }
  });
}

/* ---------------- Version history ---------------- */

export function snapshotHistory(label: string, actor = "Admin") {
  const d = db();
  try {
    const snapshot = JSON.stringify({ ...d, history: [] });
    if (snapshot.length > 2_500_000) {
      // Snapshot too large for the local budget — keep the audit honest.
      mutate((next) => {
        log(next, actor, "history.skipped", `${label} skipped: snapshot ${Math.round(snapshot.length / 1024)} KB exceeds the local budget`);
      });
      return;
    }
    const entry = { id: uid("VER"), at: Date.now(), actor, label, snapshot };
    mutate((next) => {
      next.history = [entry, ...next.history].slice(0, 10);
    });
  } catch {
    /* serialization failure must never break the underlying operation */
  }
}

export function saveVersion(label: string, actor: string) {
  snapshotHistory(label.trim() || "Manual save point", actor);
}

export function restoreHistory(id: string, actor: string): { ok: boolean; error?: string } {
  const d = db();
  const entry = d.history.find((h) => h.id === id);
  if (!entry) return { ok: false, error: "That version no longer exists." };
  if (!entry.snapshot) return { ok: false, error: "That entry is a marker only — pick another save point." };
  // Safety snapshot of the CURRENT state before anything is overwritten.
  snapshotHistory("Before restore", actor);
  const current = db();
  try {
    const parsed = JSON.parse(entry.snapshot) as Db;
    const restored = fillV3(parsed);
    const marker = {
      id: uid("VER"),
      at: Date.now(),
      actor,
      label: `Restored: ${entry.label}`,
      snapshot: "",
    };
    restored.history = [marker, ...current.history].slice(0, 10);
    restored.auditLog = [
      {
        id: uid("LOG"),
        at: Date.now(),
        actor,
        action: "academy.restored",
        detail: `Restored snapshot "${entry.label}" from ${new Date(entry.at).toISOString()}`,
      },
      ...restored.auditLog,
    ].slice(0, 400);
    persist(restored);
    return { ok: true };
  } catch {
    return { ok: false, error: "That version could not be restored." };
  }
}

/* ---------------- VIP tagging ---------------- */

export function setVip(studentId: string, vip: boolean, note: string | undefined, actor: string) {
  mutate((d) => {
    const target = d.students.find((s) => s.id === studentId);
    if (!target) return;
    target.vip = vip;
    target.vipNote = vip ? note?.trim() || undefined : undefined;
    log(d, actor, vip ? "student.vip-tagged" : "student.vip-cleared", `${target.name}${target.vipNote ? ` · ${target.vipNote}` : ""}`);
  });
}

/* ---------------- CSV exports ---------------- */

function csvEscape(value: string): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function exportWaitlistCsv(): string {
  const header = ["Name", "Email", "WhatsApp", "Country", "Track", "Side", "Joined", "Notified"];
  const rows = db().waitlist.map((w) =>
    [
      w.name,
      w.email,
      w.whatsapp,
      w.country,
      trackName(w.trackKey),
      w.side,
      new Date(w.createdAt).toISOString(),
      w.notifiedAt ? new Date(w.notifiedAt).toISOString() : "",
    ]
      .map(csvEscape)
      .join(",")
  );
  return [header.map(csvEscape).join(","), ...rows].join("\n");
}

export function exportStudentsCsv(): string {
  const header = ["KR8 ID", "Name", "Email", "Phone", "Country", "Track", "Side", "Status", "VIP", "Role"];
  const rows = db().students.map((s) =>
    [
      s.id,
      s.name,
      s.email,
      s.phone,
      s.country,
      trackName(s.trackKey),
      s.side ?? "skill",
      s.status,
      s.vip ? "VIP" : "",
      s.role,
    ]
      .map(csvEscape)
      .join(",")
  );
  return [header.map(csvEscape).join(","), ...rows].join("\n");
}

/* ---------------- Attendance kinds ---------------- */

export function markAttendanceAdmin(
  studentId: string,
  trackKey: string,
  week: number,
  kind: AttendanceKind = "class",
  actor = "Admin"
) {
  if (hasCheckedIn(studentId, trackKey, week, kind)) return;
  mutate((d) => {
    d.attendance.push({
      id: uid("ATT"),
      studentId,
      sessionId: `${trackKey}-w${week}-${kind}`,
      trackKey,
      week,
      at: Date.now(),
      kind,
      source: "admin",
    });
    log(d, actor, "attendance.marked", `${studentId} · ${trackName(trackKey)} · week ${week} · ${kind}`);
  });
}

export function hasCheckedIn(
  studentId: string,
  trackKey: string,
  week: number,
  kind: AttendanceKind = "class"
): boolean {
  const legacy = `${trackKey}-w${week}`;
  const prefix = `${legacy}-`;
  return db().attendance.some(
    (a) =>
      a.studentId === studentId &&
      (a.kind ?? "class") === kind &&
      (a.sessionId === legacy || a.sessionId.startsWith(prefix))
  );
}

/* ---------------- Two-factor authentication (TOTP) ---------------- */

async function sha256HexOf(input: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `${input.length}-${input}`;
}

/* Step 1 — generate (or regenerate) a pending secret. 2FA stays off until verified. */
export function beginTotpSetup(actor: string): { secret: string } {
  const secret = generateTotpSecret();
  mutate((d) => {
    d.security.totpSecret = secret;
    d.security.totpEnabled = false;
    d.security.recoveryCodeHashes = [];
    log(d, actor, "security.totp-started", "Pending 2FA setup");
  });
  return { secret };
}

/* Step 2 — confirm the first code; issues 8 single-use recovery codes (shown once). */
export async function verifyAndEnableTotp(
  code: string,
  actor: string
): Promise<{ ok: boolean; error?: string; recoveryCodes?: string[] }> {
  const d = db();
  const secret = d.security.totpSecret;
  if (!secret) return { ok: false, error: "Start the 2FA setup first." };
  const valid = await verifyTotp(secret, code);
  if (!valid) return { ok: false, error: "That code did not match. Check your authenticator and try again." };
  const plain = generateRecoveryCodes(8);
  const hashes = await Promise.all(plain.map((c) => sha256HexOf(`kr8::recovery::${c.toUpperCase()}`)));
  mutate((next) => {
    next.security.totpEnabled = true;
    next.security.recoveryCodeHashes = hashes;
    next.security.recoveryCodes = [];
    log(next, actor, "security.totp-enabled", "Two-factor authentication enabled");
  });
  return { ok: true, recoveryCodes: plain };
}

export async function verifyTotpOnly(code: string): Promise<boolean> {
  const secret = db().security.totpSecret;
  if (!secret) return false;
  return verifyTotp(secret, code);
}

/* Recovery codes are single-use; a valid one signs the admin in once. */
export async function consumeRecoveryCode(code: string, actor: string): Promise<boolean> {
  const hash = await sha256HexOf(`kr8::recovery::${code.trim().toUpperCase()}`);
  const d = db();
  if (!d.security.recoveryCodeHashes.includes(hash)) return false;
  mutate((next) => {
    next.security.recoveryCodeHashes = next.security.recoveryCodeHashes.filter((h) => h !== hash);
    log(next, actor, "security.recovery-used", "A recovery code was consumed");
  });
  return true;
}

export async function disableTotp(code: string, actor: string): Promise<{ ok: boolean; error?: string }> {
  const ok = await verifyTotpOnly(code);
  if (!ok) {
    const used = await consumeRecoveryCode(code, actor);
    if (!used) return { ok: false, error: "Enter a valid authenticator or recovery code." };
  }
  mutate((next) => {
    next.security = { totpEnabled: false, totpSecret: null, recoveryCodeHashes: [], recoveryCodes: [] };
    log(next, actor, "security.totp-disabled", "Two-factor authentication disabled");
  });
  return { ok: true };
}

export function totpEnabled(): boolean {
  return db().security.totpEnabled;
}

export function recoveryCodesRemaining(): number {
  return db().security.recoveryCodeHashes.length;
}

/* ---------------- Lost-access recovery ---------------- */

/* Owner (or admin) sets a temporary password on any account; the target must
   change it on next sign-in. Used for lost-access recovery when the other
   owner is unavailable — logged in the audit trail either way. */
export async function setTemporaryPassword(
  studentId: string,
  temporaryPassword: string,
  actor: string
): Promise<{ ok: boolean; error?: string }> {
  if (temporaryPassword.length < 10) return { ok: false, error: "Temporary password must be at least 10 characters." };
  const salt = makeSalt();
  const hash = await hashPassword(temporaryPassword, salt);
  mutate((d) => {
    const target = d.students.find((s) => s.id === studentId);
    if (!target) return;
    target.passwordSalt = salt;
    target.passwordHash = hash;
    target.mustChangePassword = true;
    log(d, actor, "account.temp-password-set", `${target.id} · must change on next sign-in`);
  });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Growth layer — notifications, monthly spotlight awards, newsletter  */
/* ------------------------------------------------------------------ */

export function scoreForStudent(student: Student): number {
  const accepted = getSubmissions(student.id).filter((x) => x.status === "accepted").length;
  const attendance = getAttendance(student.id).length;
  const referrals = db().students.filter((x) => x.referredBy === student.id).length;
  return (student.xpBase || 0) + student.weeksDone.length * 120 + accepted * 80 + attendance * 60 + referrals * 40;
}

const monthKeyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export function currentMonthKey(offset = 0): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return monthKeyOf(d);
}
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map((n) => Number.parseInt(n, 10));
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleString("en", { month: "long", year: "numeric" });
}
const inMonth = (ts: number, month: string) => monthKeyOf(new Date(ts)) === month;

/* Published, fixed criteria for monthly spotlight eligibility. */
export const SPOTLIGHT_CRITERIA = { attendance: 6, submissions: 4 } as const;
export const AWARD_TITLE_BY_TRACK: Record<string, string> = {
  graphic: "Designer of the Month",
  video: "Editor of the Month",
  web: "Builder of the Month",
  content_creation: "Creator of the Month",
  smm: "Social Strategist of the Month",
  marketing: "Marketer of the Month",
  frontend: "Frontend Builder of the Month",
  academic: "Scholar of the Month",
};
export function spotlightAwardTitle(trackKey: string): string {
  return AWARD_TITLE_BY_TRACK[trackKey] ?? `${trackName(trackKey)} of the Month`;
}

export type SpotlightSummary = { attendance: number; submissions: number; accepted: number };
export function monthlySpotlightSummary(studentId: string, month: string = currentMonthKey()): SpotlightSummary {
  const d = db();
  const attendance = d.attendance.filter((a) => a.studentId === studentId && inMonth(a.at, month)).length;
  const monthSubs = d.submissions.filter((s) => s.studentId === studentId && inMonth(s.submittedAt, month));
  const accepted = monthSubs.filter((s) => s.status === "accepted").length;
  return { attendance, submissions: monthSubs.length, accepted };
}
export function spotlightEligible(sum: SpotlightSummary): boolean {
  return sum.attendance >= SPOTLIGHT_CRITERIA.attendance && sum.submissions >= SPOTLIGHT_CRITERIA.submissions;
}

export type SpotlightGroup = {
  trackKey: string;
  title: string;
  trackName: string;
  rows: { student: ReturnType<typeof getStudent> & object; sum: SpotlightSummary }[];
};
export function shortlistForMonth(month: string = currentMonthKey(), perTrack = 4) {
  const d = db();
  const trackKeys = Array.from(
    new Set(d.students.filter((s) => s.role === "student" && s.status !== "suspended").map((s) => s.trackKey))
  );
  return trackKeys
    .map((trackKey) => {
      const rows = d.students
        .filter((s) => s.trackKey === trackKey && s.role === "student" && s.status !== "suspended")
        .map((student) => ({ student, sum: monthlySpotlightSummary(student.id, month) }))
        .filter((r) => r.sum.attendance + r.sum.submissions > 0)
        .sort(
          (a, b) =>
            b.sum.accepted - a.sum.accepted ||
            b.sum.submissions - a.sum.submissions ||
            b.sum.attendance - a.sum.attendance
        )
        .slice(0, perTrack);
      return { trackKey, title: spotlightAwardTitle(trackKey), trackName: trackName(trackKey), rows };
    })
    .filter((g) => g.rows.length > 0);
}

export function awardMonthly(
  input: { studentId: string; trackKey: string; month: string; note?: string },
  actor: string
): { ok: boolean; error?: string } {
  const d = db();
  const student = d.students.find((s) => s.id === input.studentId);
  if (!student) return { ok: false, error: "Student not found." };
  const title = spotlightAwardTitle(input.trackKey);
  const monthName = monthLabel(input.month);
  mutate((next) => {
    next.monthlyAwards.push({
      id: uid("SPT"),
      month: input.month,
      trackKey: input.trackKey,
      title,
      studentId: student.id,
      note: input.note?.trim() || undefined,
      createdAt: Date.now(),
      createdBy: actor,
      published: true,
    });
    next.announcements.unshift({
      id: uid("ANN"),
      title: `${title}: ${student.name}`,
      body: `${student.name.split(" ")[0]} was named ${title} for ${monthName} — one of the very best in the room this month. The name you remember at the next cohort showing.`,
      trackKey: input.trackKey,
      createdAt: Date.now(),
      author: actor,
    });
    const cohort = next.students.filter((s) => s.trackKey === input.trackKey && s.role === "student");
    cohort.forEach((s) => {
      const winner = s.id === student.id;
      next.notifications.push({
        id: uid("NTF"),
        studentId: s.id,
        kind: "award",
        title: winner ? `You were named ${title}!` : `${student.name.split(" ")[0]} named ${title}`,
        body: winner
          ? `Congratulations — you were named ${title} for ${monthName}. Keep showing up like this.`
          : `${student.name} was named ${title} for ${monthName}. Respect the work — next month could be yours.`,
        createdAt: Date.now(),
        actor,
      });
    });
    log(next, actor, "award.monthly", `${student.id} → ${title} (${input.month})`);
  });
  return { ok: true };
}
export function listMonthlyAwards(): MonthlyAward[] {
  return db()
    .monthlyAwards.filter((a) => a.published)
    .slice()
    .sort((a, b) => b.month.localeCompare(a.month) || b.createdAt - a.createdAt);
}

/* Notifications — in-app feed; also the substrate for admin nudges. */
export function listNotifications(studentId: string, limit = 40): AppNotification[] {
  return db()
    .notifications.filter((n) => n.studentId === studentId)
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}
export function unreadNotificationCount(studentId: string): number {
  return db().notifications.filter((n) => n.studentId === studentId && !n.readAt).length;
}
export function pushNotifications(
  entries: Array<Omit<AppNotification, "id" | "createdAt" | "readAt">>
): void {
  if (entries.length === 0) return;
  mutate((next) => {
    entries.forEach((entry) => {
      next.notifications.push({ ...entry, id: uid("NTF"), createdAt: Date.now() });
    });
    next.notifications = next.notifications.slice(-800);
  });
}
export function markNotificationsRead(studentId: string, ids?: string[]) {
  mutate((next) => {
    next.notifications.forEach((n) => {
      if (n.studentId !== studentId) return;
      if (!ids || ids.includes(n.id)) n.readAt = Date.now();
    });
  });
}
export function sendNudge(input: {
  studentIds: string[];
  title: string;
  body: string;
  actor: string;
  actionUrl?: string;
}): { ok: boolean; error?: string; sent: number } {
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 3) return { ok: false, error: "Give the nudge a title (3+ characters).", sent: 0 };
  if (body.length < 10) return { ok: false, error: "Write a real message — at least 10 characters.", sent: 0 };
  const d = db();
  const ids = Array.from(new Set(input.studentIds)).filter((id) => d.students.some((s) => s.id === id));
  if (ids.length === 0) return { ok: false, error: "Pick at least one student.", sent: 0 };
  const nameOf = (id: string) => {
    const target = d.students.find((s) => s.id === id);
    return target?.nickname?.trim() || target?.name.split(" ")[0] || "there";
  };
  pushNotifications(
    ids.map((studentId) => ({
      studentId,
      kind: "nudge" as const,
      title: title.replaceAll("{first}", nameOf(studentId)),
      body: body.replaceAll("{first}", nameOf(studentId)),
      actor: input.actor,
      actionUrl: input.actionUrl,
    }))
  );
  mutate((next) => log(next, input.actor, "admin.nudge", `${ids.length} student(s) — ${title}`));
  return { ok: true, sent: ids.length };
}

/* Newsletter — every subscriber captured at onboarding; exportable. */
export function subscribeNewsletter(input: {
  email: string;
  name?: string;
  source: string;
}): { ok: boolean; created?: boolean; duplicate?: boolean; error?: string } {
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  const exists = db().subscribers.find((s) => s.email === email);
  if (exists) {
    if (exists.unsubscribedAt) {
      mutate((next) => {
        const target = next.subscribers.find((s) => s.id === exists.id);
        if (target) target.unsubscribedAt = null;
      });
      return { ok: true, created: true };
    }
    return { ok: true, duplicate: true };
  }
  mutate((next) => {
    next.subscribers.push({ id: uid("NWS"), email, name: input.name?.trim() || undefined, source: input.source, createdAt: Date.now(), unsubscribedAt: null });
  });
  return { ok: true, created: true };
}
export function unsubscribeNewsletter(email: string) {
  const normal = normalizeEmail(email);
  mutate((next) => {
    const target = next.subscribers.find((s) => s.email === normal);
    if (target) target.unsubscribedAt = Date.now();
  });
}
export function listNewsletterSubscribers() {
  return db().subscribers.filter((s) => !s.unsubscribedAt);
}
export function exportNewsletterCsv(): string {
  const rows = listNewsletterSubscribers().map(
    (s) => [s.email, s.name ?? "", s.source, new Date(s.createdAt).toISOString()].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
  );
  return ["email,name,source,joined_at", ...rows].join("\n");
}

/* ------------------------------------------------------------------ */
/* WhatsApp-first growth layer — groups, outbox, broadcasts            */
/* ------------------------------------------------------------------ */

/** First name the academy uses: nickname if they gave one, else first name. */
export function greetName(student: Pick<Student, "name" | "nickname">): string {
  return student.nickname?.trim() || student.name.trim().split(" ")[0] || student.name.trim();
}

/* ---------- Learning groups ---------- */

export function listLearningGroups(): LearningGroup[] {
  return db().learningGroups.slice().sort((a, b) => {
    const order: Record<LearningGroupKind, number> = { general: 0, academic: 1, cohort: 2, track: 3, program: 4, event: 5 };
    return order[a.kind] - order[b.kind] || a.name.localeCompare(b.name);
  });
}

export function upsertLearningGroup(
  input: {
    id?: string;
    kind: LearningGroupKind;
    name: string;
    trackKey?: string;
    cohort?: string;
    joinUrl: string;
    note?: string;
    active?: boolean;
  },
  actor: string
): { ok: boolean; error?: string } {
  const name = input.name.trim();
  if (name.length < 3) return { ok: false, error: "Give the group a real name." };
  const url = input.joinUrl.trim();
  if (url && !/^https?:\/\//i.test(url) && !/^https:\/\/chat\./i.test(url))
    return { ok: false, error: "Group link must start with https:// (a chat.whatsapp.com or wa.me link works)." };
  mutate((next) => {
    if (input.id) {
      const target = next.learningGroups.find((g) => g.id === input.id);
      if (target) {
        target.kind = input.kind;
        target.name = name;
        target.trackKey = input.trackKey || undefined;
        target.cohort = input.cohort || undefined;
        target.joinUrl = url;
        target.note = input.note?.trim() || undefined;
        target.active = input.active ?? target.active;
        target.updatedAt = Date.now();
        target.updatedBy = actor;
      }
    } else {
      next.learningGroups.push({
        id: uid("GRP"),
        kind: input.kind,
        name,
        trackKey: input.trackKey || undefined,
        cohort: input.cohort || undefined,
        joinUrl: url,
        note: input.note?.trim() || undefined,
        active: input.active ?? true,
        updatedAt: Date.now(),
        updatedBy: actor,
      });
    }
    log(next, actor, "group.upsert", `${name} (${input.kind})`);
  });
  return { ok: true };
}

export function deleteLearningGroup(id: string, actor: string): { ok: boolean } {
  mutate((next) => {
    const target = next.learningGroups.find((g) => g.id === id);
    if (target) {
      next.learningGroups = next.learningGroups.filter((g) => g.id !== id);
      log(next, actor, "group.delete", target.name);
    }
  });
  return { ok: true };
}

/** The link a student in (trackKey, side) should land in after signing up. */
export function learningGroupFor(
  trackKey: string,
  side: RegistrationSide
): { url: string; label: string; specific: boolean } | null {
  const d = db();
  const active = d.learningGroups.filter((g) => g.active);
  const specific =
    active.find((g) => g.trackKey && g.trackKey === trackKey) ??
    (side === "academic" ? active.find((g) => g.kind === "academic") : undefined) ??
    active.find((g) => g.kind === "cohort" && g.cohort);
  const general = active.find((g) => g.kind === "general");
  const url = specific?.joinUrl?.trim() || general?.joinUrl?.trim() || d.settings.whatsappUrl;
  if (!url) return null;
  return {
    url,
    label: specific?.name ?? general?.name ?? "KR8 Academy community",
    specific: !!specific,
  };
}

/* ---------- Outbox (queued WhatsApp sends) ---------- */

export function queueOutboxMessage(input: {
  to: string;
  text: string;
  kind: OutboxKind;
  meta?: string;
  detail?: string;
}): OutboxMessage {
  const message: OutboxMessage = {
    id: uid("OUT"),
    at: Date.now(),
    to: input.to,
    text: input.text,
    kind: input.kind,
    meta: input.meta,
    status: "queued",
    detail: input.detail,
  };
  mutate((next) => {
    next.outbox.push(message);
    next.outbox = next.outbox.slice(-500);
  });
  return message;
}

export function listOutbox(limit = 60): OutboxMessage[] {
  return db().outbox.slice().sort((a, b) => b.at - a.at).slice(0, limit);
}
export function pendingOutboxCount(): number {
  return db().outbox.filter((m) => m.status === "queued").length;
}

/** Try to send every queued message. Safe to call any time; caps at 200 per run. */
export async function flushOutbox(): Promise<{ sent: number; failed: number; remaining: number }> {
  const queued = db().outbox.filter((m) => m.status === "queued").slice(0, 200);
  let sent = 0;
  let failed = 0;
  for (const message of queued) {
    const res = await sendWhatsApp({ to: message.to, text: message.text });
    mutate((next) => {
      const target = next.outbox.find((m) => m.id === message.id);
      if (!target) return;
      if (res.ok) {
        target.status = "sent";
        target.detail = undefined;
        sent += 1;
      } else {
        target.status = res.configured === false ? "queued" : "failed";
        target.detail = res.error;
        if (target.status === "failed") failed += 1;
      }
    });
  }
  return { sent, failed, remaining: pendingOutboxCount() };
}

/* ---------- Broadcast engine ---------- */

export type BroadcastSegment = {
  side: "all" | "skill" | "academic";
  trackKey: string; // "all" or a track key
  status: "all" | "active" | "paused" | "pending";
  band: "all" | "showing" | "flagged"; // showing = ≥ SPOTLIGHT_CRITERIA.attendance classes
  special: "none" | "spotlight" | "certificate-ready" | "graduates";
};

export const DEFAULT_SEGMENT: BroadcastSegment = { side: "all", trackKey: "all", status: "all", band: "all", special: "none" };

/** Live class attendance for a student (all time) against the published bar. */
function attendanceCount(studentId: string): number {
  return db().attendance.filter((a) => a.studentId === studentId).length;
}
function acceptedCount(studentId: string): number {
  return db().submissions.filter((s) => s.studentId === studentId && s.status === "accepted").length;
}
export function certificateReady(student: Student): boolean {
  const d = db();
  if (d.certificateRequests.some((r) => r.studentId === student.id)) return true;
  return acceptedCount(student.id) >= SPOTLIGHT_CRITERIA.submissions && student.weeksDone.length >= 6;
}

export function resolveAudience(segment: BroadcastSegment): Student[] {
  const d = db();
  const awardIds = new Set(d.monthlyAwards.filter((a) => a.published).map((a) => a.studentId));
  return d.students.filter((s) => {
    if (s.role !== "student") return false;
    if (s.status === "suspended") return false;
    if (segment.side !== "all" && (s.side ?? "skill") !== segment.side) return false;
    if (segment.trackKey !== "all" && s.trackKey !== segment.trackKey) return false;
    if (segment.status !== "all" && s.status !== segment.status) return false;
    if (segment.band !== "all") {
      const showing = attendanceCount(s.id) >= SPOTLIGHT_CRITERIA.attendance;
      if (segment.band === "showing" && !showing) return false;
      if (segment.band === "flagged" && showing) return false;
    }
    if (segment.special === "spotlight" && !awardIds.has(s.id)) return false;
    if (segment.special === "certificate-ready" && !certificateReady(s)) return false;
    if (segment.special === "graduates" && !(s as Student & { graduated?: boolean }).graduated) return false;
    return true;
  });
}

export function audienceLabel(segment: BroadcastSegment): string {
  const parts: string[] = [];
  parts.push(segment.side === "all" ? "Everyone in the academy" : segment.side === "skill" ? "Creative-skills students" : "Academics students");
  if (segment.trackKey !== "all") parts.push(trackName(segment.trackKey));
  if (segment.status !== "all") parts.push(`status: ${segment.status}`);
  if (segment.band !== "all") parts.push(segment.band === "showing" ? "showing up" : "off the radar");
  if (segment.special !== "none")
    parts.push(segment.special === "spotlight" ? "spotlight winners" : segment.special === "certificate-ready" ? "graduation-ready" : "graduates");
  return parts.join(" · ");
}

/** Personalize a template with the recipient's details. */
export function renderBroadcastTemplate(template: string, student: Student, groupUrl?: string | null): string {
  const d = db();
  const greet = greetName(student);
  return template
    .replaceAll("{first}", greet)
    .replaceAll("{name}", student.name)
    .replaceAll("{id}", student.id)
    .replaceAll("{track}", trackName(student.trackKey))
    .replaceAll("{cohort}", d.settings.cohortName)
    .replaceAll("{group}", groupUrl ?? "your learning group");
}

export type Sender = (input: { to: string; text: string }) => Promise<{ ok: boolean; error?: string; configured?: boolean }>;

/**
 * One-tap bulk send. WhatsApp not connected → every message is queued to the
 * outbox (nothing is lost, nothing is faked) and in-app copies are pushed.
 * Connected → sends live, per-recipient status recorded in the broadcast log.
 */
export async function runBroadcast(
  input: { segment: BroadcastSegment; template: string; actor: string; alsoInApp?: boolean },
  sender: Sender = sendWhatsApp
): Promise<{ ok: boolean; error?: string; record?: BroadcastRecord }> {
  const template = input.template.trim();
  if (template.length < 10) return { ok: false, error: "Write a real message — at least 10 characters." };
  const audience = resolveAudience(input.segment);
  if (audience.length === 0) return { ok: false, error: "That audience is empty right now. Loosen a filter." };

  const record: BroadcastRecord = {
    id: uid("BCT"),
    at: Date.now(),
    actor: input.actor,
    template,
    audienceLabel: audienceLabel(input.segment),
    audienceCount: audience.length,
    sent: 0,
    queued: 0,
    failed: 0,
    skipped: 0,
    recipients: [],
  };

  for (const student of audience) {
    const group = learningGroupFor(student.trackKey, student.side ?? "skill");
    const text = renderBroadcastTemplate(template, student, group?.url);
    const digits = waDigitsLite(student.phone);
    if (!digits) {
      record.skipped += 1;
      record.recipients.push({ studentId: student.id, name: student.name, phone: student.phone, status: "no-number", error: "No usable WhatsApp number" });
      continue;
    }
    const res = await sender({ to: digits, text });
    if (res.ok) {
      record.sent += 1;
      record.recipients.push({ studentId: student.id, name: student.name, phone: digits, status: "sent" });
    } else if (res.configured === false) {
      queueOutboxMessage({ to: digits, text, kind: "broadcast", meta: record.id });
      record.queued += 1;
      record.recipients.push({ studentId: student.id, name: student.name, phone: digits, status: "queued", error: "WhatsApp not connected — queued" });
    } else {
      record.failed += 1;
      record.recipients.push({ studentId: student.id, name: student.name, phone: digits, status: "failed", error: res.error });
    }
  }

  mutate((next) => {
    next.broadcasts.push(record);
    next.broadcasts = next.broadcasts.slice(-100);
    log(next, input.actor, "broadcast.sent", `${record.audienceLabel} — ${record.sent} sent · ${record.queued} queued · ${record.failed} failed (${record.recipients.length} reached)`);
  });

  if (input.alsoInApp !== false) {
    pushNotifications(
      audience.map((student) => ({
        studentId: student.id,
        kind: "broadcast" as const,
        title: template.split("\n")[0].slice(0, 90) || "A message from KR8 Academy",
        body: renderBroadcastTemplate(template, student, learningGroupFor(student.trackKey, student.side ?? "skill")?.url),
        actor: input.actor,
      }))
    );
  }
  return { ok: true, record };
}

export function listBroadcasts(limit = 15): BroadcastRecord[] {
  return db().broadcasts.slice().sort((a, b) => b.at - a.at).slice(0, limit);
}

function waDigitsLite(phone: string): string | null {
  const normalized = normalizePhone(phone);
  const digits = normalized.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

/** One CSV: the whole contact directory (or a resolved segment) for the WhatsApp Business broadcast tool. */
export function exportContactsCsv(segment?: BroadcastSegment): string {
  const rows = segment ? resolveAudience(segment) : db().students.filter((s) => s.role === "student");
  const header = "name,nickname,kr8_id,whatsapp,email,track,side,status,country,joined_at";
  const escape = (value: string) => `"${String(value).replaceAll('"', '""')}"`;
  const lines = rows.map((s) =>
    [
      escape(s.name),
      escape(s.nickname ?? ""),
      escape(s.id),
      escape(s.phone),
      escape(s.email),
      escape(trackName(s.trackKey)),
      escape(s.side ?? "skill"),
      escape(s.status),
      escape(s.country),
      escape(new Date(s.createdAt).toISOString().slice(0, 10)),
    ].join(",")
  );
  return [header, ...lines].join("\n");
}
