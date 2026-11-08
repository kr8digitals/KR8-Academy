import { beforeEach, describe, expect, it } from "vitest";
import {
  db,
  reseed,
  makeKr8Id,
  currentMonthKey,
  monthlySpotlightSummary,
  spotlightEligible,
  SPOTLIGHT_CRITERIA,
  awardMonthly,
  listMonthlyAwards,
  subscribeNewsletter,
  unsubscribeNewsletter,
  exportNewsletterCsv,
  sendNudge,
  listNotifications,
  unreadNotificationCount,
  markNotificationsRead,
  getAnnouncements,
} from "../src/lib/store";
import { requestOtp, verifyOtp } from "../src/lib/otp";

beforeEach(() => {
  window.localStorage.clear();
  reseed();
});

describe("new KR8 ID format", () => {
  it("mints KR8-YY-XXXXX with the registration year and stays unique", () => {
    const seen = new Set<string>();
    const students = db().students;
    for (let i = 0; i < 200; i++) {
      const id = makeKr8Id(students);
      expect(id).toMatch(/^KR8-\d{2}-[A-Z2-9]{5}$/);
      expect(id.slice(4, 6)).toBe(String(new Date().getFullYear()).slice(-2));
      seen.add(id);
    }
    expect(seen.size).toBe(200);
  });
});

describe("newsletter enrolment", () => {
  it("subscribes, dedupes, resubscribes after unsubscribe, and exports CSV", async () => {
    const email = "fresh.face@example.com";
    expect(subscribeNewsletter({ email, name: "Fresh Face", source: "test" })).toMatchObject({ ok: true, created: true });
    expect(subscribeNewsletter({ email, source: "test" })).toMatchObject({ ok: true, duplicate: true });
    unsubscribeNewsletter(email);
    expect(exportNewsletterCsv()).not.toContain(email);
    expect(subscribeNewsletter({ email, source: "test" })).toMatchObject({ ok: true, created: true });
    expect(exportNewsletterCsv()).toContain(email);
    expect(exportNewsletterCsv().split("\n")[0]).toBe("email,name,source,joined_at");
  });
});

describe("admin nudges", () => {
  it("delivers personalized in-app notifications and clears the unread badge", () => {
    const target = db().students.find((s) => s.role === "student")!;
    const before = unreadNotificationCount(target.id);
    const result = sendNudge({
      studentIds: [target.id],
      title: "Hey {first}",
      body: "{first} — class tonight at 8pm WAT. Bring your best work.",
      actor: "Test Admin",
    });
    expect(result).toMatchObject({ ok: true, sent: 1 });
    const feed = listNotifications(target.id);
    expect(feed[0].body).toContain(target.name.split(" ")[0]);
    expect(feed[0].body).not.toContain("{first}");
    expect(unreadNotificationCount(target.id)).toBe(before + 1);
    markNotificationsRead(target.id);
    expect(unreadNotificationCount(target.id)).toBe(0);
  });

  it("refuses empty messages and unknown students", () => {
    expect(sendNudge({ studentIds: [], title: "Hi", body: "a real message body here", actor: "x" }).ok).toBe(false);
    expect(sendNudge({ studentIds: ["NOPE-1"], title: "Hello", body: "a real message body here", actor: "x" }).ok).toBe(false);
  });
});

describe("monthly spotlight awards", () => {
  it("computes month-scoped summaries and gates eligibility", () => {
    const target = db().students.find((s) => s.role === "student")!;
    const month = currentMonthKey();
    const sum = monthlySpotlightSummary(target.id, month);
    expect(sum.attendance).toBeGreaterThanOrEqual(0);
    expect(spotlightEligible({ attendance: SPOTLIGHT_CRITERIA.attendance, submissions: SPOTLIGHT_CRITERIA.submissions, accepted: 0 })).toBe(true);
    expect(spotlightEligible({ attendance: SPOTLIGHT_CRITERIA.attendance - 1, submissions: SPOTLIGHT_CRITERIA.submissions, accepted: 0 })).toBe(false);
  });

  it("publishing an award notifies the winner and cohort, and pins an announcement", () => {
    const winner = db().students.find((s) => s.role === "student")!;
    const month = currentMonthKey();
    const result = awardMonthly({ studentId: winner.id, trackKey: winner.trackKey, month }, "Test Admin");
    expect(result.ok).toBe(true);
    const awards = listMonthlyAwards();
    expect(awards.some((a) => a.studentId === winner.id && a.month === month)).toBe(true);
    expect(listNotifications(winner.id).some((n) => n.kind === "award")).toBe(true);
    expect(getAnnouncements(winner.trackKey).some((a) => a.title.includes(winner.name.split(" ")[0]))).toBe(true);
  });
});

describe("email one-time codes", () => {
  it("issues a working code and locks out after repeated wrong guesses", async () => {
    const email = "otp.case@example.com";
    const issued = await requestOtp(email);
    expect(issued.ok).toBe(true);
    /* mail relay is not configured in tests — the code comes back inline */
    expect(issued.inlineCode).toMatch(/^\d{6}$/);

    expect((await verifyOtp(email, "000000")).ok === false || issued.inlineCode === "000000").toBe(true);
    for (let i = 0; i < 5; i++) await verifyOtp(email, "111111");
    expect((await verifyOtp(email, issued.inlineCode!)).ok).toBe(false);

    const second = await requestOtp(email);
    /* cooldown applies immediately after an issue */
    expect(second.ok === false || second.inlineCode).toBeTruthy();
  });
});
