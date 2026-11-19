import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedTestAcademy, TEST_OWNER_EMAIL, TEST_STUDENT_EMAIL } from "./fixtures";
import { db, exportDatabase, importDatabase, STORAGE_KEY, writeSession } from "../src/lib/store";

beforeEach(async () => {
  await seedTestAcademy();
});

describe("schema v4 demo-data cleanup", () => {
  it("removes seeded identities from local storage, linked records, history, and recovery copies", async () => {
    const legacy = JSON.parse(exportDatabase());
    legacy.version = 3;
    legacy.students = legacy.students.map((student: { sample?: boolean }) => ({ ...student, sample: false }));

    const retainedOwner = legacy.students.find((student: { email: string }) => student.email === TEST_OWNER_EMAIL);
    const retainedLearner = legacy.students.find((student: { email: string }) => student.email === TEST_STUDENT_EMAIL);
    expect(retainedOwner).toBeTruthy();
    expect(retainedLearner).toBeTruthy();

    const demoLearner = {
      ...retainedLearner,
      id: "LEGACY-DEMO-LEARNER",
      name: "Legacy demo fixture",
      email: "legacy-demo@example.test",
      phone: "+2348012345998",
      sample: true,
    };
    const legacyFounder = {
      ...retainedOwner,
      id: "KR8-FOUNDER-TIMFIRE",
      name: "Legacy owner fixture",
      email: "legacy-owner@example.test",
      phone: "+2348012345999",
      role: "owner",
      mustChangePassword: true,
      sample: false,
    };
    legacy.students.push(demoLearner, legacyFounder);
    legacy.applications.push({
      id: "LEGACY-DEMO-APP",
      studentId: demoLearner.id,
      trackKey: demoLearner.trackKey,
      motivation: "Synthetic migration fixture.",
      experience: "Test fixture",
      status: "auto-approved",
      createdAt: Date.now(),
    });
    legacy.submissions.push({
      id: "LEGACY-DEMO-SUBMISSION",
      studentId: demoLearner.id,
      trackKey: demoLearner.trackKey,
      week: 1,
      title: "Synthetic migration fixture",
      url: "https://example.test/work",
      submittedAt: Date.now(),
      status: "accepted",
    });
    legacy.attendance.push({
      id: "LEGACY-DEMO-ATTENDANCE",
      studentId: demoLearner.id,
      sessionId: "graphic-w1",
      trackKey: demoLearner.trackKey,
      week: 1,
      at: Date.now(),
    });
    legacy.certificates.push({
      id: "LEGACY-DEMO-CERTIFICATE",
      code: "KR8-CERT-9876-COMP",
      studentId: demoLearner.id,
      trackKey: demoLearner.trackKey,
      tier: "Completion",
      issuedAt: Date.now(),
      issuedBy: "Test fixture",
      studentNameSnapshot: demoLearner.name,
      variant: "Completion",
    });
    legacy.auditLog.push({
      id: "LEGACY-DEMO-AUDIT",
      at: Date.now(),
      actor: demoLearner.name,
      action: "test.fixture",
      detail: demoLearner.email,
    });
    legacy.history = [{
      id: "LEGACY-DEMO-HISTORY",
      at: Date.now(),
      actor: "Test fixture",
      label: "Synthetic old snapshot",
      snapshot: JSON.stringify({ ...legacy, history: [] }),
    }];

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
    window.localStorage.setItem("kr8.academy.db.v1.pre-v3", JSON.stringify(legacy));
    writeSession(legacyFounder.id);

    vi.resetModules();
    const migratedStore = await import("../src/lib/store");
    const migrated = migratedStore.db();

    expect(migrated.version).toBe(4);
    expect(migrated.students.some((student) => student.id === demoLearner.id)).toBe(false);
    expect(migrated.students.some((student) => student.id === legacyFounder.id)).toBe(false);
    expect(migrated.students.some((student) => student.email === TEST_OWNER_EMAIL)).toBe(true);
    expect(migrated.students.some((student) => student.email === TEST_STUDENT_EMAIL)).toBe(true);
    expect(migrated.applications.some((record) => record.studentId === demoLearner.id)).toBe(false);
    expect(migrated.submissions.some((record) => record.studentId === demoLearner.id)).toBe(false);
    expect(migrated.attendance.some((record) => record.studentId === demoLearner.id)).toBe(false);
    expect(migrated.certificates.some((record) => record.studentId === demoLearner.id)).toBe(false);
    expect(migrated.auditLog.some((record) => record.id === "LEGACY-DEMO-AUDIT")).toBe(false);
    expect(migrated.history).toHaveLength(0);
    expect(migratedStore.readSession()).toBeNull();
    expect(window.localStorage.getItem("kr8.academy.db.v1.pre-v3")).toBeNull();

    const recovery = JSON.parse(window.localStorage.getItem("kr8.academy.db.v1.v4-recovery") ?? "null");
    expect(recovery).toBeTruthy();
    expect(recovery.students.some((student: { id: string }) => student.id === demoLearner.id)).toBe(false);
    expect(recovery.students.some((student: { id: string }) => student.id === legacyFounder.id)).toBe(false);
  });

  it("retires sample accounts and their linked records when a legacy backup is imported", () => {
    const backup = JSON.parse(exportDatabase());
    backup.version = 3;
    const sample = backup.students.find((student: { sample?: boolean }) => student.sample);
    expect(sample).toBeTruthy();

    const result = importDatabase(JSON.stringify(backup));
    expect(result.ok).toBe(true);
    expect(db().students.some((student) => student.id === sample.id)).toBe(false);
    expect(db().applications.some((record) => record.studentId === sample.id)).toBe(false);
    expect(db().submissions.some((record) => record.studentId === sample.id)).toBe(false);
  });
});

