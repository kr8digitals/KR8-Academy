import type { Student } from "../src/lib/types";
import {
  createOwnerAccount,
  db,
  makeCertificateCode,
  makeKr8Id,
  registerStudent,
  reseed,
  setProgramme,
  STORAGE_KEY,
} from "../src/lib/store";

/** Test-only identity data. These records are never part of the production seed. */
export const TEST_PASSWORD = "test-only-password";
export const TEST_OWNER_EMAIL = "owner@example.test";
export const TEST_STUDENT_NAME = "Test Learner 01";
export const TEST_STUDENT_EMAIL = "learner01@example.test";

const TEST_TRACKS = ["graphic", "video", "web", "frontend", "content_creation", "smm", "marketing", "graphic"];
const TEST_PROGRAMMES = ["video", "graphic", "web", "frontend", "content_creation", "smm", "marketing"];

export async function seedTestAcademy(): Promise<void> {
  window.localStorage.clear();
  reseed();
  for (const key of TEST_PROGRAMMES) setProgramme(key, { status: "open" }, "Test fixture");

  const owner = await createOwnerAccount({
    name: "Test Owner",
    email: TEST_OWNER_EMAIL,
    password: TEST_PASSWORD,
  });
  if (!owner.ok || !owner.student) throw new Error("Could not create the test-only owner fixture.");

  const created = await registerStudent({
    name: TEST_STUDENT_NAME,
    email: TEST_STUDENT_EMAIL,
    phone: "+2348012345101",
    country: "NG",
    trackKey: TEST_TRACKS[0],
    dob: "2004-01-01",
    password: TEST_PASSWORD,
    motivation: "Synthetic test fixture; not Academy content.",
  });
  if (!created.ok || !created.student) throw new Error("Could not create the test-only learner fixture.");

  const data = db();
  const template = created.student;
  const weekSets = [
    [1, 2, 3, 4, 5, 6, 7, 8],
    [1, 2, 3, 4, 5, 6, 7, 8],
    [1, 2, 3, 4],
    [1, 2, 3, 4, 5, 6],
    [1, 2, 3],
    [1, 2, 3, 4, 5, 6, 7],
    [1, 2, 3],
    [1, 2, 3, 4, 5],
  ];
  const acceptedCounts = [6, 6, 2, 4, 2, 6, 1, 3];
  const attendanceCounts = [6, 7, 3, 5, 2, 6, 1, 4];
  const students: Student[] = [template];
  template.sample = true;
  template.xpBase = 1_400;
  template.weeksDone = [...weekSets[0]];

  for (let index = 1; index < 8; index++) {
    const student: Student = {
      ...template,
      id: makeKr8Id([...data.students, ...students.slice(1)]),
      name: `Test Learner ${String(index + 1).padStart(2, "0")}`,
      email: `learner${String(index + 1).padStart(2, "0")}@example.test`,
      phone: `+23480123451${String(index + 1).padStart(2, "0")}`,
      trackKey: TEST_TRACKS[index],
      dob: `200${index}-01-01`,
      createdAt: Date.now() - index * 86_400_000,
      xpBase: 500 + index * 70,
      weeksDone: [...weekSets[index]],
      referralCode: `TEST${String(index + 1).padStart(2, "02")}`,
      sample: true,
      side: "skill",
    };
    students.push(student);
    data.students.push(student);
    data.applications.push({
      id: `TEST-APP-${index + 1}`,
      studentId: student.id,
      trackKey: student.trackKey,
      motivation: "Synthetic test fixture; not Academy content.",
      experience: "Test fixture",
      status: index === 7 ? "pending" : "auto-approved",
      createdAt: student.createdAt,
      side: "skill",
    });
    if (index === 7) student.status = "pending";
  }

  // Synthetic records exercise dashboard, reports, review queues and certificate screens.
  for (let index = 0; index < students.length; index++) {
    const student = students[index];
    for (let week = 1; week <= acceptedCounts[index]; week++) {
      data.submissions.push({
        id: `TEST-SUB-${index + 1}-${week}`,
        studentId: student.id,
        trackKey: student.trackKey,
        week,
        title: `Test deliverable ${week}`,
        url: "https://example.test/work",
        submittedAt: Date.now() - week * 60_000,
        status: "accepted",
        feedback: "Synthetic test fixture.",
        score: 90,
      });
    }
    for (let week = 1; week <= attendanceCounts[index]; week++) {
      data.attendance.push({
        id: `TEST-ATT-${index + 1}-${week}`,
        studentId: student.id,
        sessionId: `${student.trackKey}-w${week}`,
        trackKey: student.trackKey,
        week,
        at: Date.now() - week * 60_000,
        kind: "class",
        source: "admin",
      });
    }
  }

  const certificateTiers = ["Professionalism", "Completion"] as const;
  for (const [index, tier] of certificateTiers.entries()) {
    const student = students[index];
    const variant = tier;
    data.certificates.push({
      id: `TEST-CERT-${index + 1}`,
      code: makeCertificateCode(data.certificates, tier, variant),
      studentId: student.id,
      trackKey: student.trackKey,
      tier,
      issuedAt: Date.now() - index * 86_400_000,
      issuedBy: owner.student.name,
      studentNameSnapshot: student.name,
      variant,
    });
  }

  data.announcements.push({
    id: "TEST-ANNOUNCEMENT",
    title: "Test fixture announcement",
    body: "Synthetic test content only; this is not an Academy announcement.",
    trackKey: "all",
    createdAt: Date.now(),
    pinned: true,
    author: "Test fixture",
  });
  data.auditLog = [];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("kr8:academy:change"));
}
