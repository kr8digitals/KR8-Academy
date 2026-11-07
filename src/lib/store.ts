import type {
  AcademicProfile,
  Announcement,
  Application,
  AttendanceKind,
  AttendanceRecord,
  AuditEntry,
  AwardTier,
  Certificate,
  CertificateTier,
  CertificateVariant,
  Db,
  EmailTemplate,
  Programme,
  RegistrationSide,
  Role,
  ScoringComponent,
  SessionState,
  Settings,
  Student,
  Submission,
} from "./types";
import { DEFAULT_UTME_TIERS, tierForScore, validateUtmeTiers } from "./awards";
import { canOverride, meetsUtmeParticipation } from "./scoring";
import { DEFAULT_EMAIL_TEMPLATES } from "./email";
import { wallRows } from "./awards";
import { generateRecoveryCodes, generateTotpSecret, verifyTotp } from "./totp";
import { TRACKS, trackByKey, trackCode, trackName } from "../data/academy";
import { normalizeEmail, normalizePhone, uid } from "./utils";

const STORAGE_KEY = "kr8.academy.db.v1";
const SESSION_KEY = "kr8.academy.session.v1";
const SCHEMA_VERSION = 3;
const PRE_V3_BACKUP_KEY = "kr8.academy.db.v1.pre-v3";

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
/* Hashing — WebCrypto with a deterministic fallback                    */
/* ------------------------------------------------------------------ */

async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Deterministic fallback for non-secure contexts (never used on HTTPS).
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < input.length; i++) {
    h1 = (h1 ^ input.charCodeAt(i)) * 0x01000193;
    h2 = (h2 + input.charCodeAt(i) * (i + 7)) >>> 0;
  }
  return `${(h1 >>> 0).toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`.repeat(4);
}

export function makeSalt(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(`kr8::${salt}::${password}`);
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
  cohortSeatsNote: "40 seats per track · registration open",
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

type SeedStudentSpec = {
  name: string;
  track: string;
  avatar: string;
  xpBase: number;
  weeks: number;
  accepted: number;
  attendance: number;
  graduated?: boolean;
  tier?: CertificateTier;
  email: string;
};

const SAMPLE_STUDENTS: SeedStudentSpec[] = [
  { name: "Grant Gideon", track: "graphic", avatar: "/media/p-grant.jpg", xpBase: 1450, weeks: 8, accepted: 6, attendance: 7, graduated: true, tier: "Professionalism", email: "grant.gideon@student.kr8digitals.com" },
  { name: "Maduka Samuel", track: "video", avatar: "/media/p-maduka.jpg", xpBase: 1320, weeks: 8, accepted: 6, attendance: 7, graduated: true, tier: "Professionalism", email: "maduka.samuel@student.kr8digitals.com" },
  { name: "Elizabeth Oyejobi", track: "smm", avatar: "/media/p-elizabeth.jpg", xpBase: 1180, weeks: 7, accepted: 5, attendance: 6, graduated: true, tier: "Completion", email: "elizabeth.oyejobi@student.kr8digitals.com" },
  { name: "Chinenye Ibeh", track: "graphic", avatar: "/media/p-chinenye.jpg", xpBase: 980, weeks: 6, accepted: 4, attendance: 6, email: "chinenye.ibeh@student.kr8digitals.com" },
  { name: "Obo Peter", track: "video", avatar: "/media/p-peter.jpg", xpBase: 870, weeks: 6, accepted: 4, attendance: 5, email: "obo.peter@student.kr8digitals.com" },
  { name: "Emmanuel Nweke", track: "web", avatar: "/media/p-7.jpg", xpBase: 760, weeks: 5, accepted: 3, attendance: 5, email: "emmanuel.nweke@student.kr8digitals.com" },
  { name: "Calistus Precious", track: "content_creation", avatar: "/media/p-6.jpg", xpBase: 640, weeks: 4, accepted: 3, attendance: 4, email: "calistus.precious@student.kr8digitals.com" },
  { name: "Esther Adeyemi", track: "marketing", avatar: "/media/p-11.jpg", xpBase: 520, weeks: 3, accepted: 2, attendance: 3, email: "esther.adeyemi@student.kr8digitals.com" },
];

function makeReferralCode(name: string): string {
  const base = name.trim().split(/\s+/)[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) || "KR8";
  const tail = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${base}-${tail}`;
}

function serialFor(students: Student[], trackKey: string): number {
  const prefix = `KR8-${new Date().getFullYear()}-${trackCode(trackKey)}-`;
  const count = students.filter((s) => s.id.startsWith(prefix)).length;
  return count + 1;
}

/* Certificate serials are global and monotonic, so two graduates in the same
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

export function makeKr8Id(students: Student[], trackKey: string): string {
  const year = new Date().getFullYear();
  const serial = String(serialFor(students, trackKey)).padStart(4, "0");
  return `KR8-${year}-${trackCode(trackKey)}-${serial}`;
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

export const SEED_ADMIN_EMAIL = "kr8digitals01@gmail.com";
export const SEED_ADMIN_PASSWORD = "KR8@Academy2026";

function buildSeed(): Db {
  const now = Date.now();
  const students: Student[] = [];
  const submissions: Submission[] = [];
  const attendance: AttendanceRecord[] = [];
  const certificates: Certificate[] = [];
  const applications: Application[] = [];
  const auditLog: AuditEntry[] = [];

  // Founder / academy admin
  const founderSalt = makeSalt();
  students.push({
    id: "KR8-FOUNDER-TIMFIRE",
    name: "Kenneth Timothy Iziogo (Timfire)",
    email: SEED_ADMIN_EMAIL,
    phone: "+2348125687509",
    country: "NG",
    trackKey: "web",
    dob: "2002-01-01",
    passwordHash: hashSyncSeed(SEED_ADMIN_PASSWORD, founderSalt),
    passwordSalt: founderSalt,
    mustChangePassword: true,
    createdAt: now - 240 * 86_400_000,
    role: "owner",
    status: "active",
    avatar: "/team/founder-timfire.jpg",
    xpBase: 4200,
    weeksDone: [1, 2, 3, 4, 5, 6, 7, 8],
    referralCode: "TIMFIRE",
    bio: "Founder & CEO of KR8 Digitals. Teaches the Website Development cohort.",
    prefs: { emailUpdates: true, whatsappUpdates: true },
    founded: true,
  });

  SAMPLE_STUDENTS.forEach((spec, index) => {
    const salt = makeSalt();
    const track = trackByKey(spec.track);
    const weeks = Array.from({ length: spec.weeks }, (_, i) => i + 1);
    const id = makeKr8Id(students, spec.track);
    const student: Student = {
      id,
      name: spec.name,
      email: spec.email,
      phone: `+23480${String(10000000 + index * 137).slice(0, 8)}`,
      country: "NG",
      trackKey: spec.track,
      dob: `200${index % 5}-0${(index % 9) + 1}-1${index % 9}`,
      passwordHash: hashSyncSeed("KR8@Sample2026", salt),
      passwordSalt: salt,
      createdAt: now - (60 - index * 5) * 86_400_000,
      role: "student",
      status: "active",
      avatar: spec.avatar,
      xpBase: spec.xpBase,
      weeksDone: weeks,
      referralCode: makeReferralCode(spec.name),
      prefs: { emailUpdates: true, whatsappUpdates: true },
      sample: true,
      bio: `${track?.name ?? "KR8"} student · ${DEFAULT_SETTINGS.cohortName}`,
    };
    students.push(student);

    for (let w = 1; w <= spec.accepted; w++) {
      submissions.push({
        id: uid("SUB"),
        studentId: id,
        trackKey: spec.track,
        week: w,
        title: track?.curriculum[w - 1]?.title ?? `Week ${w} project`,
        url: `https://portfolio.kr8digitals.com/${spec.name.split(" ")[0].toLowerCase()}/week-${w}`,
        note: `Week ${w} deliverable submitted for review.`,
        submittedAt: now - (30 - w) * 86_400_000,
        status: "accepted",
        score: 78 + ((w * 7 + index) % 20),
        feedback: "Strong execution. Tighten the typographic hierarchy and resubmit the final frame.",
        reviewedAt: now - (28 - w) * 86_400_000,
        reviewedBy: "KR8 Academy",
      });
    }
    for (let w = 1; w <= spec.attendance; w++) {
      attendance.push({
        id: uid("ATT"),
        studentId: id,
        sessionId: `${spec.track}-w${w}`,
        trackKey: spec.track,
        week: w,
        at: now - (32 - w * 3) * 86_400_000,
      });
    }
    if (spec.graduated && spec.tier) {
      certificates.push({
        id: uid("CERT"),
        code: makeCertificateCode(certificates, spec.tier),
        studentId: id,
        trackKey: spec.track,
        tier: spec.tier,
        issuedAt: now - (index + 2) * 86_400_000,
        issuedBy: "Kenneth Timothy Iziogo (Timfire)",
        studentNameSnapshot: spec.name,
      });
    }
    applications.push({
      id: uid("APP"),
      studentId: id,
      trackKey: spec.track,
      motivation: `I want to build a real career in ${track?.name ?? "a creative skill"}.`,
      experience: "Beginner",
      status: "auto-approved",
      createdAt: now - (60 - index * 5) * 86_400_000,
    });
  });

  auditLog.push({
    id: uid("LOG"),
    at: now - 86_400_000,
    actor: "System",
    action: "academy.seeded",
    detail: `${students.length} accounts including sample cohort data.`,
  });

  const announcements: Announcement[] = [
    {
      id: uid("ANN"),
      title: "The 5th Cohort is open for registration",
      body: "Onboarding is 30 April and classes begin 3 May. Live classes run Monday, Wednesday and Friday, 8–9pm WAT, and every class is followed by an assignment on Tuesday, Thursday or Saturday.",
      trackKey: "all",
      createdAt: now - 2 * 86_400_000,
      pinned: true,
      author: "KR8 Academy",
    },
    {
      id: uid("ANN"),
      title: "Certificate verification is live",
      body: "Every issued certificate now carries a QR code that resolves to a public verification page. Employers can confirm a graduate in one scan.",
      trackKey: "all",
      createdAt: now - 6 * 86_400_000,
      author: "KR8 Academy",
    },
    {
      id: uid("ANN"),
      title: "Graphic Design: portfolio review moved to Friday",
      body: "Bring two finished pieces and one work-in-progress. We will be reviewing hierarchy and colour systems line by line.",
      trackKey: "graphic",
      createdAt: now - 9 * 86_400_000,
      author: "Stevenson (Motionverse)",
    },
  ];

  return {
    version: SCHEMA_VERSION,
    seededAt: now,
    students,
    applications,
    submissions,
    attendance,
    sessionStates: [],
    certificates,
    certificateRequests: [],
    announcements,
    auditLog,
    settings: { ...DEFAULT_SETTINGS },
    programmes: DEFAULT_PROGRAMMES.map((p) => ({ ...p })),
    waitlist: [],
    components: DEFAULT_COMPONENTS.map((c) => ({ ...c })),
    scores: [],
    overrides: [],
    utmeSlips: [],
    awardTiers: DEFAULT_UTME_TIERS.map((t) => ({ ...t })),
    awardGrants: [],
    examModules: [
      {
        id: "exam-kr8-foundation",
        title: "KR8 Foundation Scholarship Exam",
        instructions:
          "KR8's own exam for students preparing for WAEC, NECO or any other exam — and for those not writing an exam yet. 80% is required for the certificate. Timfire manages questions, timing and results here in the dashboard.",
        durationMin: 60,
        passMark: 80,
        active: true,
        questions: [],
      },
    ],
    examAttempts: [],
    content: { published: {}, draft: {} },
    emailTemplates: { ...DEFAULT_EMAIL_TEMPLATES },
    history: [],
    security: { totpEnabled: false, totpSecret: null, recoveryCodeHashes: [], recoveryCodes: [] },
  };
}

/* Fills any missing v3 slices on a partially-old Db. Never discards accounts. */
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
  return {
    ...base,
    ...partial,
    version: SCHEMA_VERSION,
    students,
    settings,
    programmes,
    components,
    awardTiers,
    examModules,
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
}

/* The seed runs synchronously at first boot; a synchronous digest keeps the
   seeded accounts consistent across reloads. Real registrations use the
   async WebCrypto path. */
function hashSyncSeed(password: string, salt: string): string {
  const input = `kr8::${salt}::${password}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  let h3 = 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = (h1 ^ c) * 0x01000193;
    h2 = (h2 + c * (i + 7)) >>> 0;
    h3 = (h3 ^ (c + i)) * 0x85ebca6b;
  }
  return [h1, h2, h3]
    .map((n) => (n >>> 0).toString(16).padStart(8, "0"))
    .join("")
    .repeat(3)
    .slice(0, 64);
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
      // One-time safety copy of the pre-migration payload, kept locally.
      try {
        window.localStorage.setItem(PRE_V3_BACKUP_KEY, raw);
      } catch {
        /* quota — non-fatal */
      }
      merged.auditLog = [
        {
          id: uid("LOG"),
          at: Date.now(),
          actor: "System",
          action: "academy.migrated",
          detail: `Schema v${fromVersion} → v${SCHEMA_VERSION}. Pre-migration copy stored under ${PRE_V3_BACKUP_KEY}.`,
        },
        ...merged.auditLog,
      ].slice(0, 400);
    }
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
    const sampleIds = new Set(d.students.filter((s) => s.sample).map((s) => s.id));
    d.students = d.students.filter((s) => !sampleIds.has(s.id));
    d.submissions = d.submissions.filter((s) => !sampleIds.has(s.studentId));
    d.attendance = d.attendance.filter((a) => !sampleIds.has(a.studentId));
    d.certificates = d.certificates.filter((c) => !sampleIds.has(c.studentId));
    d.applications = d.applications.filter((a) => !sampleIds.has(a.studentId));
    log(d, "Admin", "academy.sample-cleared", `${sampleIds.size} sample accounts removed.`);
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
  return db().students.find(
    (s) =>
      s.id.toLowerCase() === lower ||
      normalizeEmail(s.email) === lower ||
      normalizePhone(s.phone) === phone ||
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
    const referrals = db().students.filter((x) => x.referredBy === s.id).length;
    const xp =
      (s.xpBase || 0) + s.weeksDone.length * 120 + accepted * 80 + attendance * 60 + referrals * 40;
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
    if (programme.status === "waitlist")
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
  if (input.password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const salt = makeSalt();
  const passwordHash = await hashPassword(input.password, salt);
  const id = makeKr8Id(d.students, trackKey);
  const status = d.settings.autoApprove && d.settings.registrationOpen ? "active" : "pending";

  const student: Student = {
    id,
    name: input.name.trim(),
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
      status: d.settings.autoApprove && d.settings.registrationOpen ? "auto-approved" : "pending",
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

  const modern = await hashPassword(password, student.passwordSalt);
  const legacy = hashSyncSeed(password, student.passwordSalt);
  if (modern !== student.passwordHash && legacy !== student.passwordHash)
    return { ok: false, error: "That password is not correct." };

  /* Password verified — session is established by commitSession() so the
     auth layer can interpose a TOTP check for staff accounts first. */
  return { ok: true, student };
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
  const modern = await hashPassword(currentPassword, student.passwordSalt);
  const legacy = hashSyncSeed(currentPassword, student.passwordSalt);
  if (modern !== student.passwordHash && legacy !== student.passwordHash)
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
  patch: Partial<Pick<Student, "name" | "avatar" | "bio" | "city" | "goal" | "prefs" | "links" | "phone">>
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
    d.students = d.students.filter((s) => s.id !== studentId);
    d.submissions = d.submissions.filter((s) => s.studentId !== studentId);
    d.attendance = d.attendance.filter((a) => a.studentId !== studentId);
    d.certificates = d.certificates.filter((c) => c.studentId !== studentId);
    d.applications = d.applications.filter((a) => a.studentId !== studentId);
    log(d, "Admin", "student.deleted", target.name);
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

export function importDatabase(json: string): { ok: boolean; error?: string } {
  try {
    const parsed = JSON.parse(json) as Db;
    if (!parsed || !Array.isArray(parsed.students)) return { ok: false, error: "That file is not a KR8 Academy backup." };
    const version = typeof parsed.version === "number" ? parsed.version : 0;
    if (version > SCHEMA_VERSION)
      return {
        ok: false,
        error: "That backup came from a newer build of the academy. Update the site, then import it again.",
      };
    snapshotHistory("Before import");
    const merged = fillV3(parsed);
    // History inside a pasted backup is capped hard — snapshots are big.
    merged.history = merged.history.slice(0, 3);
    merged.auditLog = [
      {
        id: uid("LOG"),
        at: Date.now(),
        actor: "Admin",
        action: "academy.imported",
        detail: "Backup imported and upgraded to the current schema.",
      },
      ...merged.auditLog,
    ].slice(0, 400);
    persist(merged);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not read that backup file." };
  }
}

export function storageSizeKb(): number {
  try {
    return Math.round((rawRead()?.length ?? 0) / 1024);
  } catch {
    return 0;
  }
}

export { SCHEMA_VERSION, STORAGE_KEY, SESSION_KEY };

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
