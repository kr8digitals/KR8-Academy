export type Role = "student" | "owner" | "admin" | "coach" | "reviewer" | "editor";
export type ProgrammeStatus = "open" | "waitlist" | "closed";
export type RegistrationSide = "skill" | "academic";
export type AcademicExam = "utme" | "waec" | "neco" | "other" | "not_writing";
export type AcademicCombination = "science" | "arts" | "general";
export type AttendanceKind = "class" | "assignment" | "mindset" | "hangout";
export type CertificateVariant =
  | "Completion"
  | "Professionalism"
  | "utme_merit"
  | "utme_scholar"
  | "utme_distinction"
  | "utme_pinnacle"
  | "utme_legend"
  | "kr8_exam";
export type StudentStatus = "pending" | "active" | "paused" | "suspended";
export type SubmissionStatus = "submitted" | "accepted" | "revise";
export type CertificateTier = "Completion" | "Professionalism";
export type CertificateRequestStatus = "pending" | "approved" | "declined";
export type SessionStatus = "scheduled" | "open" | "closed";

export type Student = {
  id: string;
  name: string;
  /* Optional — what the academy calls them. Used in every personalised
     message; falls back to the first name when absent. */
  nickname?: string;
  email: string;
  phone: string;
  country: string;
  trackKey: string;
  dob: string;
  gender?: string;
  city?: string;
  goal?: string;
  passwordHash: string;
  passwordSalt: string;
  mustChangePassword?: boolean;
  createdAt: number;
  lastLoginAt?: number;
  role: Role;
  status: StudentStatus;
  avatar?: string;
  xpBase: number;
  weeksDone: number[];
  referralCode: string;
  referredBy?: string;
  bio?: string;
  links?: { label: string; url: string }[];
  prefs: { emailUpdates: boolean; whatsappUpdates: boolean };
  sample?: boolean;
  founded?: boolean;
  side?: RegistrationSide;
  vip?: boolean;
  vipNote?: string;
  academic?: AcademicProfile;
};

export type ReturnedStudent = Omit<Student, "passwordHash" | "passwordSalt">;

export type Application = {
  id: string;
  studentId: string;
  trackKey: string;
  motivation: string;
  experience: string;
  status: "auto-approved" | "pending" | "approved" | "declined";
  note?: string;
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  side?: RegistrationSide;
  academic?: AcademicProfile;
};

export type Submission = {
  id: string;
  studentId: string;
  trackKey: string;
  week: number;
  title: string;
  url: string;
  note?: string;
  submittedAt: number;
  status: SubmissionStatus;
  feedback?: string;
  score?: number;
  reviewedAt?: number;
  reviewedBy?: string;
};

export type AttendanceRecord = {
  id: string;
  studentId: string;
  sessionId: string;
  trackKey: string;
  week: number;
  at: number;
  kind?: AttendanceKind;
  source?: "self" | "admin";
};

export type SessionState = {
  id: string;
  trackKey: string;
  week: number;
  status: SessionStatus;
  updatedAt: number;
};

export type Certificate = {
  id: string;
  code: string;
  studentId: string;
  trackKey: string;
  tier: CertificateTier;
  issuedAt: number;
  issuedBy: string;
  revoked?: boolean;
  revokedReason?: string;
  studentNameSnapshot: string;
  variant?: CertificateVariant;
};

export type CertificateRequest = {
  id: string;
  studentId: string;
  trackKey: string;
  tier: CertificateTier;
  status: CertificateRequestStatus;
  createdAt: number;
  note?: string;
  reviewedAt?: number;
  variant?: CertificateVariant;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  trackKey: "all" | string;
  createdAt: number;
  pinned?: boolean;
  author: string;
};

export type AuditEntry = {
  id: string;
  at: number;
  actor: string;
  action: string;
  detail: string;
};

export type Settings = {
  cohortName: string;
  cohortStart: string;
  registrationOpen: boolean;
  autoApprove: boolean;
  applicationDeadline: string;
  whatsappUrl: string;
  supportEmail: string;
  agencyUrl: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  certificateRequiresApproval: boolean;
  cohortSeatsNote: string;
  /* Weekly schedule — KR8 Academy runs every cohort on a Monday/Wednesday/Friday
     cadence. All editable from the dashboard. Default timezone West Africa Time. */
  classDays: string[];
  classStart: string;
  classEnd: string;
  classAttendanceStart: string;
  classAttendanceEnd: string;
  assignmentDays: string[];
  assignmentWindowStart: string;
  assignmentWindowEnd: string;
  timeZone: string;
  /* Partner and grading policy */
  partnerName: string;
  skillsCertificateThreshold: number;
  skillsGraceFloor: number;
  utmeCertificateThreshold: number;
  kr8ExamPassMark: number;
  jambMinParticipationPct: number;
  expectedClassCount: number;
  expectedAssignmentCount: number;
  academicStartNote: string;
  supportFromName: string;
  waitlistPriorityHours: number;
  wallIntro: string;
};

export type AcademicProfile = {
  classLevel: string;
  exam: AcademicExam;
  otherExam?: string;
  combination: AcademicCombination;
  subjects: string[];
};

export type Programme = {
  key: string;
  side: RegistrationSide;
  status: ProgrammeStatus;
  opensAt: string | null;
  note: string;
};

export type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  country: string;
  trackKey: string;
  side: RegistrationSide;
  createdAt: number;
  notifiedAt?: number;
  note?: string;
};

export type ScoringComponent = {
  id: string;
  name: string;
  active: boolean;
  order: number;
};

export type ComponentScore = {
  id: string;
  studentId: string;
  componentId: string;
  score: number;
  enteredBy: string;
  enteredAt: number;
};

export type StudentOverride = {
  id: string;
  studentId: string;
  finalScoreAtOverride: number;
  reason: string;
  actor: string;
  at: number;
};

export type UtmeSlip = {
  id: string;
  studentId: string;
  score: number;
  fileName: string;
  dataUrl: string;
  note?: string;
  status: "pending" | "verified" | "rejected";
  submittedAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
  reviewNote?: string;
};

export type AwardTier = {
  id: string;
  scope: "utme" | "kr8_exam";
  name: string;
  min: number;
  max: number;
  reward: string;
  artifact: string;
  amount: number;
  currency: string;
  variant: CertificateVariant;
  order: number;
  active: boolean;
  pendingReview: boolean;
};

export type AwardGrant = {
  id: string;
  studentId: string;
  tierId: string;
  scope: "utme" | "kr8_exam";
  scoreUsed: number;
  slipId?: string;
  status: "pending" | "approved" | "paid" | "rejected";
  createdAt: number;
  decidedBy?: string;
  decidedAt?: number;
  note?: string;
  published: boolean;
};

export type ExamQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  points: number;
};

export type ExamModule = {
  id: string;
  title: string;
  instructions: string;
  durationMin: number;
  passMark: number;
  active: boolean;
  questions: ExamQuestion[];
};

export type ExamAttempt = {
  id: string;
  moduleId: string;
  studentId: string;
  answers: number[];
  scorePct: number;
  passed: boolean;
  startedAt: number;
  submittedAt: number;
};

export type ContentState = {
  published: Record<string, string | string[]>;
  draft: Record<string, string | string[]>;
};

export type EmailTemplate = {
  subject: string;
  body: string;
};

export type HistoryEntry = {
  id: string;
  at: number;
  actor: string;
  label: string;
  snapshot: string;
};

export type SecurityState = {
  totpEnabled: boolean;
  totpSecret: string | null;
  recoveryCodeHashes: string[];
  recoveryCodes: string[];
};

export type Db = {
  version: number;
  seededAt: number;
  students: Student[];
  applications: Application[];
  submissions: Submission[];
  attendance: AttendanceRecord[];
  sessionStates: SessionState[];
  certificates: Certificate[];
  certificateRequests: CertificateRequest[];
  announcements: Announcement[];
  auditLog: AuditEntry[];
  settings: Settings;
  programmes: Programme[];
  waitlist: WaitlistEntry[];
  components: ScoringComponent[];
  scores: ComponentScore[];
  overrides: StudentOverride[];
  utmeSlips: UtmeSlip[];
  awardTiers: AwardTier[];
  awardGrants: AwardGrant[];
  examModules: ExamModule[];
  examAttempts: ExamAttempt[];
  notifications: AppNotification[];
  monthlyAwards: MonthlyAward[];
  subscribers: NewsletterSubscriber[];
  learningGroups: LearningGroup[];
  outbox: OutboxMessage[];
  broadcasts: BroadcastRecord[];
  content: ContentState;
  emailTemplates: Record<string, EmailTemplate>;
  history: HistoryEntry[];
  security: SecurityState;
};

/* ------------------------------------------------------------------ */
/* Growth layer — WhatsApp-first operations                             */
/* ------------------------------------------------------------------ */

export type LearningGroupKind = "general" | "academic" | "track" | "cohort" | "program" | "event";
export type LearningGroup = {
  id: string;
  kind: LearningGroupKind;
  name: string;
  /* Set for track groups (their track key) and cohort groups (cohort label). */
  trackKey?: string;
  cohort?: string;
  joinUrl: string;
  note?: string;
  active: boolean;
  updatedAt: number;
  updatedBy?: string;
};

export type OutboxKind = "welcome" | "broadcast" | "nudge" | "custom";
export type OutboxStatus = "queued" | "sent" | "failed";
export type OutboxMessage = {
  id: string;
  at: number;
  to: string;
  text: string;
  kind: OutboxKind;
  meta?: string;
  status: OutboxStatus;
  detail?: string;
};

export type BroadcastRecipientStatus = "sent" | "queued" | "failed" | "no-number";
export type BroadcastRecipient = {
  studentId: string;
  name: string;
  phone: string;
  status: BroadcastRecipientStatus;
  error?: string;
};
export type BroadcastRecord = {
  id: string;
  at: number;
  actor: string;
  template: string;
  audienceLabel: string;
  audienceCount: number;
  sent: number;
  queued: number;
  failed: number;
  skipped: number;
  recipients: BroadcastRecipient[];
};

export type NotificationKind = "nudge" | "award" | "welcome" | "system" | "broadcast";
export type AppNotification = {
  id: string;
  studentId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: number;
  readAt?: number;
  actionUrl?: string;
  actor?: string;
};

export type MonthlyAward = {
  id: string;
  month: string;
  trackKey: string;
  title: string;
  studentId: string;
  note?: string;
  createdAt: number;
  createdBy: string;
  published: boolean;
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  name?: string;
  source: string;
  createdAt: number;
  unsubscribedAt?: number | null;
};

export type Session = {
  id: string;
  trackKey: string;
  week: number;
  title: string;
  focus: string;
  date: Date;
  timeLabel: string;
  status: SessionStatus;
};
