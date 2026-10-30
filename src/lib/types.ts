export type Role = "student" | "admin" | "superadmin";
export type StudentStatus = "pending" | "active" | "paused" | "suspended";
export type SubmissionStatus = "submitted" | "accepted" | "revise";
export type CertificateTier = "Completion" | "Professionalism";
export type CertificateRequestStatus = "pending" | "approved" | "declined";
export type SessionStatus = "scheduled" | "open" | "closed";

export type Student = {
  id: string;
  name: string;
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
