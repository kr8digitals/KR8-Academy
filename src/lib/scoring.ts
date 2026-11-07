import type { Db, ScoringComponent, Student } from "./types";

/* Grading rules (brief, non-negotiable):
 *   - Every scored component is marked out of 100.
 *   - The final score is the average of all scored components.
 *   - skillsCertificateThreshold (default 90) earns the certificate.
 *   - An admin may graduate a student between skillsGraceFloor (default 80)
 *     and the threshold — a 10-point grace. Below the floor, no override.
 *   - Every override records who did it and why.
 *   - Academics (UTME): only the official, verified UTME score counts.
 *     Attendance and assignments are recorded but never decide UTME awards.
 *   - KR8's own exam (WAEC / NECO / not-yet-writing students): the
 *     certificate threshold is kr8ExamPassMark (default 80).
 */

export type FinalScoreBreakdown = {
  components: Array<{ id: string; name: string; score: number | null }>;
  scoredCount: number;
  average: number | null;
  eligibility: "certificate" | "grace" | "ineligible" | "none";
};

export function activeComponents(db: Db): ScoringComponent[] {
  return [...db.components].filter((c) => c.active).sort((a, b) => a.order - b.order);
}

export function scoreFor(db: Db, studentId: string, componentId: string): number | null {
  const found = db.scores.find((s) => s.studentId === studentId && s.componentId === componentId);
  return found && Number.isFinite(found.score) ? found.score : null;
}

export function computeFinalScore(db: Db, studentId: string): FinalScoreBreakdown {
  const threshold = db.settings.skillsCertificateThreshold;
  const floor = db.settings.skillsGraceFloor;
  const components = activeComponents(db).map((component) => ({
    id: component.id,
    name: component.name,
    score: scoreFor(db, studentId, component.id),
  }));
  const scored = components.filter((c) => c.score !== null) as Array<{ id: string; name: string; score: number }>;
  if (scored.length === 0) {
    return { components, scoredCount: 0, average: null, eligibility: "none" };
  }
  const average = Math.round((scored.reduce((sum, c) => sum + c.score, 0) / scored.length) * 100) / 100;
  const eligibility = average >= threshold ? "certificate" : average >= floor ? "grace" : "ineligible";
  return { components, scoredCount: scored.length, average, eligibility };
}

export function overrideFor(db: Db, studentId: string) {
  return db.overrides.find((o) => o.studentId === studentId) ?? null;
}

/* An override is only valid inside [floor, threshold). Records who & why — enforced here too. */
export function canOverride(db: Db, studentId: string): { ok: boolean; reason?: string; average: number | null } {
  const { average } = computeFinalScore(db, studentId);
  if (average === null) return { ok: false, reason: "No scores recorded yet.", average };
  const { skillsCertificateThreshold, skillsGraceFloor } = db.settings;
  if (average >= skillsCertificateThreshold)
    return { ok: false, reason: "This student already meets the certificate threshold.", average };
  if (average < skillsGraceFloor)
    return { ok: false, reason: `Below the ${skillsGraceFloor}% grace floor — no override is allowed.`, average };
  return { ok: true, average };
}

/* Participation percentage for the UTME minimum-participation requirement:
 * combines class attendance and assignment submissions against the cohort
 * expectations. Both are recorded; neither moves the UTME score itself. */
export function participationPct(db: Db, studentId: string): number {
  const { expectedClassCount, expectedAssignmentCount } = db.settings;
  const classAttended = db.attendance.filter(
    (a) => a.studentId === studentId && (a.kind ?? "class") === "class"
  ).length;
  const assignmentsDone = db.submissions.filter((s) => s.studentId === studentId).length;
  const classPct = expectedClassCount > 0 ? Math.min(1, classAttended / expectedClassCount) : 0;
  const assignmentPct = expectedAssignmentCount > 0 ? Math.min(1, assignmentsDone / expectedAssignmentCount) : 0;
  return Math.round(((classPct + assignmentPct) / 2) * 100);
}

export function meetsUtmeParticipation(db: Db, studentId: string): boolean {
  return participationPct(db, studentId) >= db.settings.jambMinParticipationPct;
}

export function attendanceKindCount(db: Db, studentId: string, kind: "class" | "assignment" | "mindset" | "hangout"): number {
  if (kind === "assignment") {
    const submissions = db.submissions.filter((s) => s.studentId === studentId).length;
    const marked = db.attendance.filter((a) => a.studentId === studentId && a.kind === "assignment").length;
    return Math.max(submissions, marked);
  }
  return db.attendance.filter((a) => a.studentId === studentId && (a.kind ?? "class") === kind).length;
}

/* UTME eligibility: registered student with a KR8 ID + verified official slip
 * + the configured minimum participation. The score decides the certificate. */
export function utmeCertificateEligible(db: Db, studentId: string): { ok: boolean; reason?: string; score?: number } {
  const slip = db.utmeSlips.find((s) => s.studentId === studentId && s.status === "verified");
  if (!slip) return { ok: false, reason: "No verified UTME result slip on file." };
  if (!meetsUtmeParticipation(db, studentId))
    return {
      ok: false,
      reason: `Participation is below the ${db.settings.jambMinParticipationPct}% minimum required before the exam.`,
    };
  if (slip.score < db.settings.utmeCertificateThreshold)
    return { ok: false, reason: `UTME score ${slip.score} is below the ${db.settings.utmeCertificateThreshold} certificate threshold.` };
  return { ok: true, score: slip.score };
}

/* KR8's own exam — pass mark decides the certificate (attendance recorded, never decisive). */
export function kr8ExamResult(db: Db, moduleId: string, studentId: string) {
  const attempts = db.examAttempts
    .filter((a) => a.moduleId === moduleId && a.studentId === studentId && a.submittedAt > 0)
    .sort((a, b) => b.submittedAt - a.submittedAt);
  return attempts[0] ?? null;
}

export type StudentAcademicView = {
  final: FinalScoreBreakdown;
  override: ReturnType<typeof overrideFor>;
  everyClear: boolean;
};

export function academicTrackKey(student: Student): string {
  return student.side === "academic" ? "academic" : student.trackKey;
}
