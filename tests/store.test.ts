import { seedTestAcademy, TEST_PASSWORD, TEST_STUDENT_EMAIL } from "./fixtures";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  authenticate,
  createOwnerAccount,
  changePassword,
  checkIn,
  clearSampleData,
  db,
  exportDatabase,
  findCertificate,
  getCertificates,
  getLeaderboard,
  getRoster,
  getSessionStatus,
  getStats,
  getStudent,
  getSubmissions,
  hasCheckedIn,
  importDatabase,
  issueCertificate,
  progressFor,
  registerStudent,
  requestCertificate,
  reseed,
  reviewSubmission,
  setSessionStatus,
  saveAnnouncement,
  submitAssignment,
  deleteAnnouncement,
  saveSettings,
  setStudentStatus,
  reviewApplication,
  resetTrackProgress,
  storageSizeKb,
  setStudentRole,
  deleteStudent,
  getAnnouncements,
  toggleWeek,
  updateProfile,
  subscribe,
  STORAGE_KEY,
  SCHEMA_VERSION,
  ownerSetupRequired,
  writeSession,
} from "../src/lib/store";

beforeEach(async () => {
  await seedTestAcademy();
});

describe("registration & authentication", () => {
  it("starts new local stores without seeded learner or staff accounts", () => {
    reseed();
    expect(db().students).toHaveLength(0);
    expect(getRoster()).toHaveLength(0);
    expect(db().applications).toHaveLength(0);
    expect(db().certificates).toHaveLength(0);
    expect(ownerSetupRequired()).toBe(true);
  });

  it("allows one local first-run owner account and uses a PBKDF2 password hash", async () => {
    reseed();
    expect(ownerSetupRequired()).toBe(true);
    const created = await createOwnerAccount({
      name: "Local Test Owner",
      email: "local-owner@example.test",
      password: TEST_PASSWORD,
    });
    expect(created.ok).toBe(true);
    expect(created.student?.role).toBe("owner");
    expect(created.student?.passwordHash?.startsWith("pbkdf2-sha256$")).toBe(true);
    expect(ownerSetupRequired()).toBe(false);
    const second = await createOwnerAccount({
      name: "Second Test Owner",
      email: "second-owner@example.test",
      password: TEST_PASSWORD,
    });
    expect(second.ok).toBe(false);
    expect(second.error).toMatch(/already been completed/i);
  });

  it("registers a student and issues a track-scoped KR8 ID", async () => {
    const result = await registerStudent({
      name: "Test Applicant",
      email: "test@example.com",
      phone: "+2348012345678",
      country: "NG",
      trackKey: "graphic",
      dob: "2000-01-01",
      password: TEST_PASSWORD,
    });
    expect(result.ok).toBe(true);
    expect(result.student?.id).toMatch(/^KR8-\d{2}-[A-Z2-9]{5}$/);
    expect(result.student?.status).toBe("active");
    expect(db().applications.some((a) => a.studentId === result.student?.id)).toBe(true);
  });

  it("rejects duplicate emails, weak passwords and unknown tracks", async () => {
    const base = {
      name: "Dup User",
      email: TEST_STUDENT_EMAIL,
      phone: "+2348099999999",
      country: "NG",
      trackKey: "graphic",
      dob: "2000-01-01",
      password: TEST_PASSWORD,
    };
    expect((await registerStudent(base)).error).toMatch(/already exists/i);
    const weak = await registerStudent({ ...base, email: "fresh@example.com", password: "123" });
    expect(weak.error).toMatch(/8 characters/i);
    const badTrack = await registerStudent({ ...base, email: "fresh2@example.com", trackKey: "astrophysics" });
    expect(badTrack.error).toMatch(/valid skill track/i);
  });

  it("signs in with email or KR8 ID and rejects a wrong password", async () => {
    const byEmail = await authenticate(TEST_STUDENT_EMAIL, TEST_PASSWORD);
    expect(byEmail.ok).toBe(true);
    expect(byEmail.student?.role).toBe("student");
    const id = byEmail.student!.id;
    const byId = await authenticate(id, TEST_PASSWORD);
    expect(byId.ok).toBe(true);
    const wrong = await authenticate(id, "nope");
    expect(wrong.ok).toBe(false);
    expect(wrong.error).toMatch(/password/i);
  });

  it("upgrades a valid legacy local password hash after successful authentication", async () => {
    const student = db().students.find((record) => record.email === TEST_STUDENT_EMAIL)!;
    const salt = "legacy-test-salt";
    const bytes = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`kr8::${salt}::${TEST_PASSWORD}`)
    );
    student.passwordSalt = salt;
    student.passwordHash = Array.from(new Uint8Array(bytes))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    expect((await authenticate(TEST_STUDENT_EMAIL, "incorrect-test-password")).ok).toBe(false);
    expect(student.passwordHash.startsWith("pbkdf2-sha256$")).toBe(false);
    expect((await authenticate(TEST_STUDENT_EMAIL, TEST_PASSWORD)).ok).toBe(true);
    expect(student.passwordHash.startsWith("pbkdf2-sha256$")).toBe(true);
  });

  it("changes passwords and refuses the old one afterwards", async () => {
    const student = await authenticate(TEST_STUDENT_EMAIL, TEST_PASSWORD);
    const id = student.student!.id;
    const changedPassword = `${TEST_PASSWORD}-changed`;
    const change = await changePassword(id, TEST_PASSWORD, changedPassword);
    expect(change.ok).toBe(true);
    expect((await authenticate(id, TEST_PASSWORD)).ok).toBe(false);
    expect((await authenticate(id, changedPassword)).ok).toBe(true);
  });

  it("blocks suspended accounts from signing in", async () => {
    const id = getRoster()[0].id;
    db().students.find((s) => s.id === id)!.status = "suspended";
    const result = await authenticate(id, TEST_PASSWORD);
    expect(result.ok).toBe(false);
  });
});

describe("profile", () => {
  it("updates name and rejects a phone number already in use", () => {
    const student = getRoster()[0];
    expect(updateProfile(student.id, { name: "Renamed Student" }).ok).toBe(true);
    expect(getStudent(student.id)?.name).toBe("Renamed Student");

    const other = getRoster()[1];
    const conflict = updateProfile(student.id, { phone: other.phone });
    expect(conflict.ok).toBe(false);
    expect(conflict.error).toMatch(/another account/i);
  });
});

describe("progress, attendance and assignments", () => {
  it("toggles weeks and reflects progress percentages", () => {
    const student = getRoster()[2];
    const before = progressFor(student).weeksDone;
    toggleWeek(student.id, 8, true);
    expect(progressFor(getStudent(student.id)!).weeksDone).toBe(before + 1);
    toggleWeek(student.id, 8, false);
    expect(progressFor(getStudent(student.id)!).weeksDone).toBe(before);
  });

  it("only allows check-in while the session is open, once", async () => {
    const student = getRoster()[0];
    expect(getSessionStatus(student.trackKey, 7)).toBe("scheduled");
    expect(checkIn(student.id, student.trackKey, 7).ok).toBe(false);

    setSessionStatus(student.trackKey, 7, "open");
    expect(getSessionStatus(student.trackKey, 7)).toBe("open");
    const first = checkIn(student.id, student.trackKey, 7);
    expect(first.ok).toBe(true);
    expect(hasCheckedIn(student.id, student.trackKey, 7)).toBe(true);
    expect(checkIn(student.id, student.trackKey, 7).ok).toBe(false);
  });

  it("submits, reviews and accepts an assignment", async () => {
    const student = getRoster()[4];
    const result = submitAssignment({
      studentId: student.id,
      week: 7,
      title: "Week 7 deliverable",
      url: "https://example.com/work",
    });
    expect(result.ok).toBe(true);
    const submission = getSubmissions(student.id).find((s) => s.week === 7)!;
    expect(submission.status).toBe("submitted");

    reviewSubmission(submission.id, "accepted", "Excellent", 92, "KR8 Academy");
    const reviewed = getSubmissions(student.id).find((s) => s.id === submission.id)!;
    expect(reviewed.status).toBe("accepted");
    expect(reviewed.score).toBe(92);

    // no duplicate submissions for the same week
    const duplicate = submitAssignment({ studentId: student.id, week: 7, title: "Again", url: "https://x.dev" });
    expect(duplicate.ok).toBe(false);
  });
});

describe("certificates", () => {
  it("refuses a request before criteria are met", () => {
    const student = getRoster().find((s) => s.weeksDone.length < 5)!;
    const result = requestCertificate(student.id, "Completion");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/criteria/i);
  });

  it("issues, verifies and revokes a credential", () => {
    const eligible = getRoster().find((s) => progressFor(s).eligible && getCertificates(s.id).length === 0);
    const target = eligible ?? getRoster()[0];
    db().certificates = db().certificates.filter((c) => c.studentId !== target.id);

    const issued = issueCertificate({ studentId: target.id, tier: "Professionalism", issuedBy: "KR8 Academy" });
    expect(issued.ok).toBe(true);
    const code = issued.certificate!.code;
    const found = findCertificate(code);
    expect(found?.studentId).toBe(target.id);
    expect(findCertificate("NOPE")).toBeUndefined();
  });

  it("prevents issuing two active certificates", () => {
    const withCert = db().certificates.find((c) => !c.revoked)!;
    const again = issueCertificate({ studentId: withCert.studentId, tier: "Completion", issuedBy: "KR8 Academy" });
    expect(again.ok).toBe(false);
  });
});

describe("admin data operations", () => {
  it("computes cohort statistics and a sorted leaderboard", () => {
    const stats = getStats();
    expect(stats.totalStudents).toBe(8);
    expect(stats.byTrack.length).toBeGreaterThan(3);
    const board = getLeaderboard();
    expect(board.length).toBe(8);
    expect(board[0].xp).toBeGreaterThanOrEqual(board[1].xp);
  });

  it("clears test-only sample records without deleting the local owner", () => {
    clearSampleData();
    expect(getRoster()).toHaveLength(0);
    expect(db().students.filter((s) => s.role === "owner")).toHaveLength(1);
    expect(db().certificates).toHaveLength(0);
  });

  it("round-trips a backup through export and import", () => {
    const snapshot = JSON.parse(exportDatabase());
    snapshot.students = snapshot.students.map((student: { sample?: boolean }) => ({ ...student, sample: false }));
    const backup = JSON.stringify(snapshot);
    const before = getRoster().length;
    clearSampleData();
    expect(getRoster()).toHaveLength(0);
    expect(importDatabase(backup).ok).toBe(true);
    expect(getRoster()).toHaveLength(before);
    expect(importDatabase("not json").ok).toBe(false);
  });

  it("rejects oversized and malformed imports without changing local data", () => {
    const before = exportDatabase();
    const malformed = JSON.parse(before);
    malformed.students[0].prefs = "invalid";
    const rejected = importDatabase(JSON.stringify(malformed));
    expect(rejected.ok).toBe(false);
    expect(rejected.error).toMatch(/preferences/i);
    expect(exportDatabase()).toBe(before);

    const oversized = importDatabase("x".repeat(5_000_001));
    expect(oversized.ok).toBe(false);
    expect(oversized.error).toMatch(/5 MB/i);
    expect(exportDatabase()).toBe(before);
  });
});

describe("certificate integrity", () => {
  it("gives every test-fixture certificate a unique local code", () => {
    const certificates = getCertificates();
    expect(certificates.length).toBeGreaterThan(1);
    const codes = certificates.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^KR8-CERT-\d{4}-(PROF|COMP)$/);
      expect(findCertificate(code)?.code).toBe(code);
    }
  });

  it("never reissues a code that is already in the local store", () => {
    const firstGraduate = getRoster()[0];
    const first = issueCertificate({ studentId: firstGraduate.id, tier: "Professionalism", issuedBy: "Test Admin" });
    const before = new Set(getCertificates().map((c) => c.code));
    expect(first.ok).toBe(false); // The test fixture already holds an active certificate.
    const secondGraduate = getRoster()[1];
    const revoked = getCertificates(secondGraduate.id)[0];
    db().certificates.find((c) => c.id === revoked.id)!.revoked = true;
    const second = issueCertificate({ studentId: secondGraduate.id, tier: "Completion", issuedBy: "Test Admin" });
    expect(second.ok).toBe(true);
    expect(before.has(second.certificate!.code)).toBe(false);
  });
});

describe("admissions control", () => {
  it("puts new applicants on the waitlist when admissions are closed", async () => {
    saveSettings({ ...db().settings, registrationOpen: false });
    const result = await registerStudent({
      name: "Waitlist Wendy",
      email: "wendy@example.com",
      phone: "8070001111",
      country: "NG",
      dob: "2003-03-03",
      trackKey: "smm",
      password: TEST_PASSWORD,
      motivation: "I want to run brand pages.",
    });
    expect(result.ok).toBe(true);
    expect(result.student?.status).toBe("pending");
    expect(db().applications.find((a) => a.studentId === result.student!.id)?.status).toBe("pending");
  });

  it("approves a pending application and activates the student", async () => {
    saveSettings({ ...db().settings, autoApprove: false });
    const created = await registerStudent({
      name: "Review Rita",
      email: "rita@example.com",
      phone: "8070002222",
      country: "NG",
      dob: "2002-02-02",
      trackKey: "content_creation",
      password: TEST_PASSWORD,
      motivation: "I shoot and edit.",
    });
    expect(created.student?.status).toBe("pending");
    const application = db().applications.find((a) => a.studentId === created.student!.id)!;
    reviewApplication(application.id, "approved");
    expect(getStudent(created.student!.id)?.status).toBe("active");
    expect(db().applications.find((a) => a.id === application.id)?.status).toBe("approved");
  });

  it("declining leaves the record on file for the next cohort", () => {
    const application = db().applications[0];
    reviewApplication(application.id, "declined", "Cohort full");
    const stored = db().applications.find((a) => a.id === application.id)!;
    expect(stored.status).toBe("declined");
    expect(stored.note).toBe("Cohort full");
    expect(db().students.find((s) => s.id === application.studentId)).toBeDefined();
  });

  it("persists cohort settings", () => {
    saveSettings({ ...db().settings, cohortName: "Cohort 10 · 2027", supportEmail: "hi@kr8digitals.com" });
    expect(db().settings.cohortName).toBe("Cohort 10 · 2027");
    expect(db().settings.supportEmail).toBe("hi@kr8digitals.com");
  });
});

describe("administration safety", () => {
  it("cannot delete the founder account", () => {
    const founder = db().students.find((s) => s.role === "owner")!;
    deleteStudent(founder.id);
    expect(db().students.some((s) => s.id === founder.id)).toBe(true);
  });

  it("keeps statistics and the register consistent after a delete", () => {
    const target = getRoster()[0];
    const certificatesBefore = db().certificates.length;
    deleteStudent(target.id);
    expect(getRoster().some((s) => s.id === target.id)).toBe(false);
    expect(db().certificates.length).toBeLessThanOrEqual(certificatesBefore);
    expect(getStats().totalStudents).toBe(getRoster().length);
  });

  it("promotes a student to admin without losing their record", () => {
    const target = getRoster()[0];
    setStudentRole(target.id, "admin");
    expect(getStudent(target.id)?.role).toBe("admin");
    expect(getRoster().some((s) => s.id === target.id)).toBe(false);
    setStudentRole(target.id, "student");
    expect(getRoster().some((s) => s.id === target.id)).toBe(true);
  });

  it("resets a student's progress without deleting the account", () => {
    const target = getRoster().find((s) => s.weeksDone.length > 0)!;
    resetTrackProgress(target.id);
    const after = getStudent(target.id)!;
    expect(after.weeksDone).toHaveLength(0);
    expect(getSubmissions(target.id)).toHaveLength(0);
  });

  it("adds, edits and removes announcements", () => {
    const before = getAnnouncements().length;
    saveAnnouncement({ title: "Week 4 brief", body: "Ship the poster.", trackKey: "all", author: "KR8 Academy" });
    const created = getAnnouncements().find((a) => a.title === "Week 4 brief")!;
    expect(getAnnouncements().length).toBe(before + 1);
    saveAnnouncement({ id: created.id, title: "Week 4 brief (updated)", body: "Ship the poster and the caption.", trackKey: "all", author: "KR8 Academy" });
    expect(getAnnouncements().find((a) => a.id === created.id)?.title).toMatch(/updated/);
    deleteAnnouncement(created.id);
    expect(getAnnouncements().some((a) => a.id === created.id)).toBe(false);
  });

  it("reports a storage footprint", () => {
    expect(storageSizeKb()).toBeGreaterThan(0);
  });

  it("refuses a backup from a newer schema but migrates older ones", () => {
    const newer = importDatabase(JSON.stringify({ version: 99, students: [] }));
    expect(newer.ok).toBe(false);
    expect(newer.error).toMatch(/newer build/i);

    const backup = JSON.parse(exportDatabase());
    // Represent retained local users as ordinary accounts in this older backup.
    backup.students = backup.students.map((student: { sample?: boolean }) => ({ ...student, sample: false }));
    const older = importDatabase(JSON.stringify({ ...backup, version: 1 }));
    expect(older.ok).toBe(true);
    expect(getRoster().length).toBeGreaterThan(0);
  });
});

describe("storage resilience", () => {
  it("notifies subscribers on every write", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    toggleWeek(getRoster()[0].id, 8, true);
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    const calls = listener.mock.calls.length;
    toggleWeek(getRoster()[0].id, 8, false);
    expect(listener.mock.calls.length).toBe(calls);
  });

  it("recovers from corrupt storage instead of white-screening", () => {
    window.localStorage.setItem(STORAGE_KEY, "{ this is not json");
    expect(getRoster().length).toBeGreaterThan(0);
    expect(db().version).toBe(SCHEMA_VERSION);
  });

  it("keeps the certificates register intact when older data is loaded", () => {
    const backup = JSON.parse(exportDatabase());
    backup.certificates = backup.certificates.map((c: { code: string }) => ({ ...c, code: "KR8-CERT-0001-PROF" }));
    backup.version = 1;
    expect(importDatabase(JSON.stringify(backup)).ok).toBe(true);
    const codes = getCertificates().map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) expect(findCertificate(code)?.code).toBe(code);
  });
});
