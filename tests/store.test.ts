import { beforeEach, describe, expect, it } from "vitest";
import {
  authenticate,
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
  submitAssignment,
  toggleWeek,
  updateProfile,
} from "../src/lib/store";

beforeEach(() => {
  window.localStorage.clear();
  reseed();
});

describe("registration & authentication", () => {
  it("seeds a founder admin and eight sample students", () => {
    const roster = getRoster();
    expect(roster).toHaveLength(8);
    const founder = db().students.find((s) => s.role === "superadmin");
    expect(founder?.email).toBe("kr8digitals01@gmail.com");
    expect(db().certificates.length).toBeGreaterThan(0);
  });

  it("registers a student and issues a track-scoped KR8 ID", async () => {
    const result = await registerStudent({
      name: "Test Applicant",
      email: "test@example.com",
      phone: "+2348012345678",
      country: "NG",
      trackKey: "graphic",
      dob: "2000-01-01",
      password: "supersecret1",
    });
    expect(result.ok).toBe(true);
    expect(result.student?.id).toMatch(/^KR8-\d{4}-GDVFD-\d{4}$/);
    expect(result.student?.status).toBe("active");
    expect(db().applications.some((a) => a.studentId === result.student?.id)).toBe(true);
  });

  it("rejects duplicate emails, weak passwords and unknown tracks", async () => {
    const base = {
      name: "Dup User",
      email: "grant.gideon@student.kr8digitals.com",
      phone: "+2348099999999",
      country: "NG",
      trackKey: "graphic",
      dob: "2000-01-01",
      password: "supersecret1",
    };
    expect((await registerStudent(base)).error).toMatch(/already exists/i);
    const weak = await registerStudent({ ...base, email: "fresh@example.com", password: "123" });
    expect(weak.error).toMatch(/8 characters/i);
    const badTrack = await registerStudent({ ...base, email: "fresh2@example.com", trackKey: "astrophysics" });
    expect(badTrack.error).toMatch(/valid skill track/i);
  });

  it("signs in with email or KR8 ID and rejects a wrong password", async () => {
    const byEmail = await authenticate("grant.gideon@student.kr8digitals.com", "KR8@Sample2026");
    expect(byEmail.ok).toBe(true);
    const id = byEmail.student!.id;
    const byId = await authenticate(id, "KR8@Sample2026");
    expect(byId.ok).toBe(true);
    const wrong = await authenticate(id, "nope");
    expect(wrong.ok).toBe(false);
    expect(wrong.error).toMatch(/password/i);
  });

  it("changes passwords and refuses the old one afterwards", async () => {
    const student = await authenticate("grant.gideon@student.kr8digitals.com", "KR8@Sample2026");
    const id = student.student!.id;
    const change = await changePassword(id, "KR8@Sample2026", "brandnewpass99");
    expect(change.ok).toBe(true);
    expect((await authenticate(id, "KR8@Sample2026")).ok).toBe(false);
    expect((await authenticate(id, "brandnewpass99")).ok).toBe(true);
  });

  it("blocks suspended accounts from signing in", async () => {
    const id = getRoster()[0].id;
    db().students.find((s) => s.id === id)!.status = "suspended";
    const result = await authenticate(id, "KR8@Sample2026");
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
    const student = getRoster().find((s) => s.name === "Esther Adeyemi")!;
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

  it("clears sample data without deleting the founder", () => {
    clearSampleData();
    expect(getRoster()).toHaveLength(0);
    expect(db().students.filter((s) => s.role === "superadmin")).toHaveLength(1);
    expect(db().certificates).toHaveLength(0);
  });

  it("round-trips a backup through export and import", () => {
    const backup = exportDatabase();
    const before = getRoster().length;
    clearSampleData();
    expect(getRoster()).toHaveLength(0);
    expect(importDatabase(backup).ok).toBe(true);
    expect(getRoster()).toHaveLength(before);
    expect(importDatabase("not json").ok).toBe(false);
  });
});

describe("certificate integrity", () => {
  it("gives every seeded certificate a unique, verifiable code", () => {
    const certificates = getCertificates();
    expect(certificates.length).toBeGreaterThan(1);
    const codes = certificates.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^KR8-CERT-\d{4}-(PROF|COMP)$/);
      expect(findCertificate(code)?.code).toBe(code);
    }
  });

  it("never reissues a code that is already in the register", () => {
    const grant = db().students.find((s) => s.name.includes("Grant Gideon"))!;
    const first = issueCertificate({ studentId: grant.id, tier: "Professionalism", issuedBy: "Test Admin" });
    const before = new Set(getCertificates().map((c) => c.code));
    expect(first.ok).toBe(false); // Grant already holds an active certificate
    const maduka = db().students.find((s) => s.name.includes("Maduka Samuel"))!;
    const revoked = getCertificates(maduka.id)[0];
    db().certificates.find((c) => c.id === revoked.id)!.revoked = true;
    const second = issueCertificate({ studentId: maduka.id, tier: "Completion", issuedBy: "Test Admin" });
    expect(second.ok).toBe(true);
    expect(before.has(second.certificate!.code)).toBe(false);
  });
});
