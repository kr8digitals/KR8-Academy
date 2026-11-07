import type { Role } from "./types";

/* Role & capability matrix for the KR8 Academy admin surface.
 *
 * owner     — everything, plus managing other owners, security settings and
 *             permanent deletes. At least two owner accounts must always exist
 *             (see security enforcement in store.ts).
 * admin     — full academy operations: students, applications, submissions,
 *             attendance, scores, overrides, certificates, awards, exam
 *             module, waitlist, programmes, content, announcements, exports.
 * coach     — attendance and submissions review, score entry, exam marking.
 * reviewer  — read-everything + review submissions/attendance/UTME slips.
 * editor    — content studio, announcements and SEO only.
 * student   — no admin capabilities.
 */

export type Capability =
  | "admin.access"
  | "students.view"
  | "students.manage"
  | "students.vip"
  | "students.delete"
  | "applications.review"
  | "submissions.review"
  | "attendance.review"
  | "scores.entry"
  | "scores.override"
  | "certificates.issue"
  | "certificates.revoke"
  | "awards.manage"
  | "awards.decide"
  | "exams.manage"
  | "waitlist.view"
  | "waitlist.notify"
  | "programmes.manage"
  | "content.edit"
  | "announcements.manage"
  | "data.export"
  | "data.import"
  | "data.restore"
  | "security.manage"
  | "roles.manage"
  | "audit.view";

const MATRIX: Record<Exclude<Role, "student">, Capability[]> = {
  owner: [
    "admin.access", "students.view", "students.manage", "students.vip", "students.delete",
    "applications.review", "submissions.review", "attendance.review",
    "scores.entry", "scores.override", "certificates.issue", "certificates.revoke",
    "awards.manage", "awards.decide", "exams.manage", "waitlist.view", "waitlist.notify",
    "programmes.manage", "content.edit", "announcements.manage",
    "data.export", "data.import", "data.restore", "security.manage", "roles.manage", "audit.view",
  ],
  admin: [
    "admin.access", "students.view", "students.manage", "students.vip",
    "applications.review", "submissions.review", "attendance.review",
    "scores.entry", "scores.override", "certificates.issue", "certificates.revoke",
    "awards.manage", "awards.decide", "exams.manage", "waitlist.view", "waitlist.notify",
    "programmes.manage", "content.edit", "announcements.manage",
    "data.export", "data.import", "data.restore", "audit.view",
  ],
  coach: [
    "admin.access", "students.view", "submissions.review", "attendance.review",
    "scores.entry", "exams.manage", "waitlist.view", "audit.view",
  ],
  reviewer: [
    "admin.access", "students.view", "submissions.review", "attendance.review",
    "scores.entry", "waitlist.view", "audit.view",
  ],
  editor: [
    "admin.access", "students.view", "content.edit", "announcements.manage", "audit.view",
  ],
};

export function can(role: Role | undefined | null, capability: Capability): boolean {
  if (!role || role === "student") return false;
  return MATRIX[role]?.includes(capability) ?? false;
}

export function isStaffRole(role: Role | undefined | null): boolean {
  return !!role && role !== "student";
}

export const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  owner: "Owner",
  admin: "Admin",
  coach: "Coach",
  reviewer: "Reviewer",
  editor: "Editor",
};

export const ROLE_DESCRIPTION: Record<Exclude<Role, "student">, string> = {
  owner: "Full control: roles, security, destructive actions. Two owners minimum at all times.",
  admin: "Every academy operation except managing owners and security settings.",
  coach: "Attendance, submissions and scores. No settings, no certificates, no awards.",
  reviewer: "Read access plus submissions and attendance review.",
  editor: "Content studio and announcements only.",
};

/* Capabilities required per admin tab — used to hide tabs the role cannot use. */
export const TAB_CAPABILITY: Record<string, Capability> = {
  overview: "admin.access",
  students: "students.view",
  applications: "applications.review",
  submissions: "submissions.review",
  attendance: "attendance.review",
  certificates: "certificates.issue",
  announcements: "announcements.manage",
  settings: "programmes.manage",
  programmes: "programmes.manage",
  waitlist: "waitlist.view",
  scores: "scores.entry",
  awards: "awards.manage",
  exams: "exams.manage",
  content: "content.edit",
  data: "data.export",
  security: "security.manage",
};
