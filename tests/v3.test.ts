/* v3 unit tests — TOTP (RFC 6238), scoring thresholds & grace override,
 * UTME award tier boundaries and tier validation. */
import { beforeEach, describe, expect, it } from "vitest";
import {
  base32Decode,
  base32Encode,
  generateRecoveryCodes,
  generateTotpSecret,
  totpAt,
  verifyTotp,
} from "../src/lib/totp";
import {
  DEFAULT_UTME_TIERS,
  tierForScore,
  validateUtmeTiers,
} from "../src/lib/awards";
import {
  canOverride,
  computeFinalScore,
  meetsUtmeParticipation,
  participationPct,
  utmeCertificateEligible,
} from "../src/lib/scoring";
import type { AwardTier, ComponentScore, Db, ScoringComponent } from "../src/lib/types";
import {
  decideAwardGrant,
  db,
  reseed,
  setProgramme,
  registerStudent,
  reviewUtmeSlip,
  saveSettings,
  submitUtmeSlip,
} from "../src/lib/store";

/* ---------------- TOTP ---------------- */

describe("TOTP (RFC 6238)", () => {
  /* Appendix B vectors, SHA-1. Our codes are truncated to 6 digits. */
  const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"; // ASCII "12345678901234567890"
  const VECTORS: Array<[number, string]> = [
    [59, "287082"],
    [1111111109, "081804"],
    [1111111111, "050471"],
    [1234567890, "005924"],
    [2000000000, "279037"],
    [20000000000, "353130"],
  ];

  it.each(VECTORS)("produces the RFC vector for T=%i", async (time, expected) => {
    expect(await totpAt(RFC_SECRET, time)).toBe(expected);
  });

  it("round-trips base32 encode/decode", () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255, 128, 64, 32]);
    expect(Array.from(base32Decode(base32Encode(bytes)))).toEqual(Array.from(bytes));
  });

  it("accepts a code inside the ±1 step window and rejects others", async () => {
    const now = Date.now();
    const current = await totpAt(RFC_SECRET, Math.floor(now / 1000));
    expect(await verifyTotp(RFC_SECRET, current, now)).toBe(true);
    expect(await verifyTotp(RFC_SECRET, "000000", now)).toBe(false);
    const drift = await totpAt(RFC_SECRET, Math.floor(now / 1000) - 30);
    expect(await verifyTotp(RFC_SECRET, drift, now)).toBe(true);
    const far = await totpAt(RFC_SECRET, Math.floor(now / 1000) - 90);
    expect(await verifyTotp(RFC_SECRET, far, now)).toBe(false);
  });

  it("generates 8 unique recovery codes in the canonical format", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    for (const code of codes) expect(code).toMatch(/^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
  });

  it("generates base32 secrets from 20 random bytes", () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(generateTotpSecret()).not.toBe(secret);
  });
});

/* ---------------- Scoring thresholds & grace override ---------------- */

function fakeDb(scores: Array<[string, number]>): Db {
  const components: ScoringComponent[] = [
    { id: "class", name: "Class attendance", active: true, order: 1 },
    { id: "assignment", name: "Assignments", active: true, order: 2 },
    { id: "final", name: "Final project", active: true, order: 3 },
  ];
  const componentScores: ComponentScore[] = scores.map(([componentId, score], index) => ({
    id: `sc-${index}`,
    studentId: "stu-1",
    componentId,
    score,
    enteredAt: Date.now(),
    enteredBy: "test",
  }));
  return {
    components,
    scores: componentScores,
    overrides: [],
    settings: { skillsCertificateThreshold: 90, skillsGraceFloor: 80 },
  } as unknown as Db;
}

describe("final score & eligibility (threshold 90 / grace floor 80)", () => {
  it("averages exactly at the boundaries — 79 ineligible, 80 grace, 89 grace, 90 certificate", () => {
    // 3 components averaged precisely.
    expect(computeFinalScore(fakeDb([["class", 79], ["assignment", 79], ["final", 79]]), "stu-1").eligibility).toBe("ineligible");
    expect(computeFinalScore(fakeDb([["class", 80], ["assignment", 80], ["final", 80]]), "stu-1").eligibility).toBe("grace");
    expect(computeFinalScore(fakeDb([["class", 89], ["assignment", 89], ["final", 89]]), "stu-1").eligibility).toBe("grace");
    expect(computeFinalScore(fakeDb([["class", 90], ["assignment", 90], ["final", 90]]), "stu-1").eligibility).toBe("certificate");
  });

  it("respects mixed averages that land inside/above/below the bands", () => {
    // avg 79.67 → ineligible
    expect(computeFinalScore(fakeDb([["class", 79], ["assignment", 80], ["final", 80]]), "stu-1").eligibility).toBe("ineligible");
    // avg 81 → grace
    expect(computeFinalScore(fakeDb([["class", 81], ["assignment", 81], ["final", 81]]), "stu-1").eligibility).toBe("grace");
    // avg 89.67 → grace (not yet 90)
    expect(computeFinalScore(fakeDb([["class", 89], ["assignment", 90], ["final", 90]]), "stu-1").eligibility).toBe("grace");
    // avg 90.33 → certificate
    expect(computeFinalScore(fakeDb([["class", 90], ["assignment", 90], ["final", 91]]), "stu-1").eligibility).toBe("certificate");
  });

  it("only counts active components and only marked ones", () => {
    const db = fakeDb([["class", 100], ["assignment", 90]]);
    const result = computeFinalScore(db, "stu-1");
    expect(result.scoredCount).toBe(2);
    expect(result.average).toBe(95);
  });

  it("override is allowed only inside [floor, threshold)", () => {
    expect(canOverride(fakeDb([["class", 70], ["assignment", 80], ["final", 79]]), "stu-1").ok).toBe(false); // 76.33 avg
    expect(canOverride(fakeDb([["class", 80], ["assignment", 82], ["final", 84]]), "stu-1").ok).toBe(true); // 82 avg
    expect(canOverride(fakeDb([["class", 90], ["assignment", 92], ["final", 94]]), "stu-1").ok).toBe(false); // already clears
  });
});

/* ---------------- UTME tiers ---------------- */

describe("UTME award tier boundaries (merit 240 / scholar 250 / distinction 280 / pinnacle 300 / legend 350)", () => {
  const cases: Array<[number, string | null]> = [
    [0, null],
    [239, null],
    [240, "utme-merit"],
    [249, "utme-merit"],
    [250, "utme-scholar"],
    [279, "utme-scholar"],
    [280, "utme-distinction"],
    [299, "utme-distinction"],
    [300, "utme-pinnacle"],
    [349, "utme-pinnacle"],
    [350, "utme-legend"],
    [400, "utme-legend"],
  ];

  it.each(cases)("score %i → %s", (score, expected) => {
    expect(tierForScore(DEFAULT_UTME_TIERS, score)?.id ?? null).toBe(expected);
  });
});

describe("validateUtmeTiers", () => {
  it("accepts the seeded starter tiers", () => {
    expect(validateUtmeTiers(DEFAULT_UTME_TIERS)).toBeNull();
  });

  it("rejects overlapping tiers", () => {
    const overlapping: AwardTier[] = [
      { ...DEFAULT_UTME_TIERS[0], id: "a", min: 240, max: 260 },
      { ...DEFAULT_UTME_TIERS[1], id: "b", min: 250, max: 279 },
    ];
    expect(validateUtmeTiers(overlapping)).toMatch(/overlap/i);
  });

  it("rejects max below min and out-of-range bounds", () => {
    const inverted: AwardTier[] = [
      { ...DEFAULT_UTME_TIERS[0], id: "a", min: 250, max: 240 },
    ];
    expect(validateUtmeTiers(inverted)).toMatch(/below min/i);
    const outOfRange: AwardTier[] = [
      { ...DEFAULT_UTME_TIERS[0], id: "a", min: 0, max: 401 },
    ];
    expect(validateUtmeTiers(outOfRange)).toMatch(/0 and 400/i);
  });
});

/* ---------------- Participation & UTME eligibility ---------------- */

describe("UTME eligibility gate", () => {
  function academicDb(overrides: { attendance?: number; submissions?: number; slip?: { score: number; status: "pending" | "verified" | "rejected" } }): Db {
    const { attendance = 0, submissions = 0, slip } = overrides;
    return {
      attendance: Array.from({ length: attendance }, (_, i) => ({
        id: `att-${i}`,
        studentId: "stu-1",
        sessionId: `sess-${i}`,
        trackKey: "academic",
        week: i + 1,
        at: Date.now(),
        kind: "class" as const,
      })),
      submissions: Array.from({ length: submissions }, (_, i) => ({
        id: `sub-${i}`,
        studentId: "stu-1",
        trackKey: "academic",
        week: i + 1,
        title: `Work ${i}`,
        url: "https://example.com/work",
        status: "accepted" as const,
        submittedAt: Date.now(),
      })),
      utmeSlips: slip
        ? [{
            id: "slip-1",
            studentId: "stu-1",
            score: slip.score,
            fileName: "slip.jpg",
            dataUrl: `data:image/jpeg;base64,${"x".repeat(200)}`,
            status: slip.status,
            submittedAt: Date.now(),
          }]
        : [],
      settings: { expectedClassCount: 24, expectedAssignmentCount: 24, jambMinParticipationPct: 80, utmeCertificateThreshold: 240 },
    } as unknown as Db;
  }

  it("full participation clears the bar; sparse participation does not", () => {
    expect(participationPct(academicDb({ attendance: 24, submissions: 24 }), "stu-1")).toBe(100);
    expect(meetsUtmeParticipation(academicDb({ attendance: 24, submissions: 24 }), "stu-1")).toBe(true);
    expect(meetsUtmeParticipation(academicDb({ attendance: 12, submissions: 12 }), "stu-1")).toBe(false);
    expect(meetsUtmeParticipation(academicDb({ attendance: 0, submissions: 0 }), "stu-1")).toBe(false);
  });

  it("requires a verified slip at/above threshold plus participation", () => {
    // No slip at all.
    expect(utmeCertificateEligible(academicDb({ attendance: 24, submissions: 24 }), "stu-1").ok).toBe(false);
    // Slip pending — not yet.
    expect(utmeCertificateEligible(academicDb({ attendance: 24, submissions: 24, slip: { score: 300, status: "pending" } }), "stu-1").ok).toBe(false);
    // Verified but below threshold.
    expect(utmeCertificateEligible(academicDb({ attendance: 24, submissions: 24, slip: { score: 200, status: "verified" } }), "stu-1").ok).toBe(false);
    // Verified, 240, but no participation.
    expect(utmeCertificateEligible(academicDb({ slip: { score: 240, status: "verified" } }), "stu-1").ok).toBe(false);
    // The full stack: verified 268 + perfect participation.
    const eligible = utmeCertificateEligible(academicDb({ attendance: 24, submissions: 24, slip: { score: 268, status: "verified" } }), "stu-1");
    expect(eligible.ok).toBe(true);
    expect(eligible.score).toBe(268);
  });
});

/* ---------------- Store-level award gate ---------------- */

describe("decideAwardGrant (store) — UTME prize refusal without participation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    reseed();
    saveSettings({ ...db().settings, registrationOpen: true });
    setProgramme("academic", { status: "open" }, "test");
  });

  async function verifiedGrant(score: number): Promise<string | null> {
    const created = await registerStudent({
      name: "UTME Candidate",
      email: "utme@example.com",
      phone: "+2348010001111",
      country: "NG",
      side: "academic",
      dob: "2008-05-05",
      password: "supersecret99",
      academic: { classLevel: "SS3", exam: "utme", combination: "science", subjects: ["Mathematics", "Physics"] },
    });
    if (!created.student) return null;
    const slip = submitUtmeSlip(created.student.id, {
      score,
      fileName: "slip.jpg",
      dataUrl: `data:image/jpeg;base64,${"x".repeat(200)}`,
    });
    expect(slip.ok).toBe(true);
    const slipRecord = db().utmeSlips.find((s) => s.studentId === created.student!.id)!;
    expect(reviewUtmeSlip(slipRecord.id, true, "Matches candidate details", "Timfire").ok).toBe(true);
    const grant = db().awardGrants.find((g) => g.studentId === created.student!.id);
    return grant?.id ?? null;
  }

  it("refuses prize approval while participation is below the bar, then allows it once met", async () => {
    const grantId = await verifiedGrant(265);
    expect(grantId).toBeTruthy();
    const refused = decideAwardGrant(grantId!, "approved", "Timfire");
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/participation/i);

    // Move the bar, not the clock: shrink expectations to 1 class + 1 assignment and meet them.
    saveSettings({ ...db().settings, expectedClassCount: 1, expectedAssignmentCount: 1 });
    const studentId = db().awardGrants.find((g) => g.id === grantId!)!.studentId;
    const live = db();
    live.attendance.push({
      id: "att-test-1",
      studentId,
      sessionId: "sess-test-1",
      trackKey: "academic",
      week: 1,
      at: Date.now(),
      kind: "class",
    });
    live.submissions.push({
      id: "sub-test-1",
      studentId,
      trackKey: "academic",
      week: 1,
      title: "Classwork",
      url: "https://example.com/classwork",
      status: "accepted",
      submittedAt: Date.now(),
    });

    const approved = decideAwardGrant(grantId!, "approved", "Timfire");
    expect(approved.ok).toBe(true);
    expect(db().awardGrants.find((g) => g.id === grantId!)?.status).toBe("approved");
  });
});
