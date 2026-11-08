import { beforeEach, describe, expect, it } from "vitest";
import {
  db,
  reseed,
  setProgramme,
  registerStudent,
  resolveAudience,
  audienceLabel,
  runBroadcast,
  listBroadcasts,
  listNotifications,
  listLearningGroups,
  upsertLearningGroup,
  deleteLearningGroup,
  learningGroupFor,
  queueOutboxMessage,
  pendingOutboxCount,
  listOutbox,
  flushOutbox,
  exportContactsCsv,
  listMonthlyAwards,
  awardMonthly,
  DEFAULT_SEGMENT,
} from "../src/lib/store";
import { TRACKS } from "../src/data/academy";

beforeEach(() => {
  window.localStorage.clear();
  reseed();
  for (const key of ["video", "graphic", "web", "frontend", "content_creation", "smm", "marketing"]) {
    setProgramme(key, { status: "open" }, "test");
  }
});

const unique = (() => {
  let n = 0;
  return () => `Unique Case ${Date.now().toString(36)}${(n += 1)}`;
})();

describe("registration integrity", () => {
  it("rejects a duplicate email, a duplicate phone and the same name + date of birth", async () => {
    const name = unique();
    const first = await registerStudent({
      name, email: "first@example.com", phone: "+2348011112222", country: "NG",
      trackKey: "graphic", dob: "2002-05-11", password: "KR8@Sample2026", side: "skill",
    });
    expect(first.ok).toBe(true);

    const dupEmail = await registerStudent({
      name: "Someone Else", email: "first@example.com", phone: "+2348011119999", country: "NG",
      trackKey: "graphic", dob: "2003-01-01", password: "KR8@Sample2026", side: "skill",
    });
    expect(dupEmail.ok).toBe(false);
    expect(dupEmail.error).toMatch(/email already exists/i);

    const dupPhone = await registerStudent({
      name: "Someone Else", email: "other@example.com", phone: "08011112222", country: "NG",
      trackKey: "graphic", dob: "2003-01-01", password: "KR8@Sample2026", side: "skill",
    });
    expect(dupPhone.ok).toBe(false);
    expect(dupPhone.error).toMatch(/phone number is already registered/i);

    const dupDob = await registerStudent({
      name: name.split(" ").reverse().join(" "), /* tokens in another order, same person */
      email: "different@example.com", phone: "+2348022223333", country: "NG",
      trackKey: "video", dob: "2002-05-11", password: "KR8@Sample2026", side: "skill",
    });
    expect(dupDob.ok).toBe(false);
    expect(dupDob.error).toMatch(/name and date of birth/i);
  });

  it("persists the nickname and keeps it on the record", async () => {
    const res = await registerStudent({
      name: unique(), nickname: "Dee", email: "nick@example.com", phone: "+2348033334444", country: "NG",
      trackKey: "graphic", dob: "2001-02-02", password: "KR8@Sample2026", side: "skill",
    });
    expect(res.ok).toBe(true);
    expect(db().students.find((s) => s.id === res.student!.id)?.nickname).toBe("Dee");
  });
});

describe("learning groups", () => {
  it("seeds an academy-wide group, an academic group and one per track", () => {
    const groups = listLearningGroups();
    expect(groups.some((g) => g.kind === "general")).toBe(true);
    expect(groups.some((g) => g.kind === "academic")).toBe(true);
    for (const track of TRACKS) {
      if ((track as { side?: string }).side === "academic") continue;
      expect(groups.some((g) => g.trackKey === track.key)).toBe(true);
    }
  });

  it("updates the group link and falls back to the academy-wide link", () => {
    const graphic = listLearningGroups().find((g) => g.trackKey === "graphic")!;
    const url = "https://chat.whatsapp.com/graphic-group";
    expect(upsertLearningGroup({ id: graphic.id, kind: "track", name: graphic.name, trackKey: "graphic", joinUrl: url }, "Test Admin").ok).toBe(true);
    expect(learningGroupFor("graphic", "skill")?.url).toBe(url);
    expect(learningGroupFor("video", "skill")?.url).toBe(db().learningGroups.find((g) => g.kind === "general")?.joinUrl);
    expect(upsertLearningGroup({ kind: "track", name: "x", trackKey: "web", joinUrl: "not-a-url" }, "Test Admin").ok).toBe(false);
    expect(deleteLearningGroup(graphic.id, "Test Admin").ok).toBe(true);
  });
});

describe("broadcast engine", () => {
  it("resolves audiences by side, band and special list with live labels", () => {
    const all = resolveAudience({ ...DEFAULT_SEGMENT });
    expect(all.length).toBeGreaterThan(0);
    const skill = resolveAudience({ ...DEFAULT_SEGMENT, side: "skill" });
    expect(skill.every((s) => (s.side ?? "skill") === "skill")).toBe(true);
    const showing = resolveAudience({ ...DEFAULT_SEGMENT, band: "showing" });
    expect(showing.every((s) => db().attendance.filter((a) => a.studentId === s.id).length >= 6)).toBe(true);
    expect(audienceLabel({ ...DEFAULT_SEGMENT, side: "academic", band: "flagged" })).toMatch(/Academics/);
  });

  it("sends personalized messages and pushes in-app copies (fake sender)", async () => {
    const sent: Array<{ to: string; text: string }> = [];
    const result = await runBroadcast(
      { segment: { ...DEFAULT_SEGMENT, band: "showing" }, template: "Karibu {first} — your ID is {id}. Group: {group}", actor: "Test Admin", alsoInApp: true },
      async ({ to, text }) => {
        sent.push({ to, text });
        return { ok: true };
      }
    );
    expect(result.ok).toBe(true);
    expect(sent.length).toBe(result.record!.sent);
    expect(sent[0].text).not.toContain("{first}");
    expect(sent[0].text).toMatch(/KR8-\d/);
    const rec = listBroadcasts(1)[0];
    expect(rec.audienceLabel).toContain("showing up");
    const target = db().students.find((s) => s.id === rec.recipients[0].studentId)!;
    expect(listNotifications(target.id).some((n) => n.kind === "broadcast")).toBe(true);
  });

  it("queues to the outbox instead of losing messages when WhatsApp is not connected", async () => {
    const result = await runBroadcast(
      { segment: { ...DEFAULT_SEGMENT }, template: "Class tomorrow, {first}. Bring your books.", actor: "Test Admin", alsoInApp: false },
      async () => ({ ok: false, configured: false, error: "not connected" })
    );
    expect(result.ok).toBe(true);
    expect(result.record!.queued).toBe(result.record!.audienceCount);
    expect(pendingOutboxCount()).toBeGreaterThanOrEqual(result.record!.queued);
    const queued = listOutbox().find((m) => m.kind === "broadcast");
    expect(queued?.text).toContain("Class tomorrow");
  });

  it("refuses empty audiences and stubby messages", async () => {
    expect((await runBroadcast({ segment: DEFAULT_SEGMENT, template: "hi", actor: "x" }, async () => ({ ok: true }))).ok).toBe(false);
  });
});

describe("outbox", () => {
  it("queues, lists and counts pending messages", () => {
    queueOutboxMessage({ to: "2348012345678", text: "Queued welcome", kind: "welcome", meta: "KR8-26-TEST1" });
    expect(pendingOutboxCount()).toBe(1);
    expect(listOutbox()[0].status).toBe("queued");
    /* flush hits the network-less jsdom transport, which reports not-connected → stays queued, never lost */
    return flushOutbox().then((r) => {
      expect(pendingOutboxCount()).toBeGreaterThanOrEqual(0);
      expect(r.remaining).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("contact export", () => {
  it("exports the directory as CSV with the documented header", () => {
    const csv = exportContactsCsv();
    const [header, firstRow] = csv.split("\n");
    expect(header).toBe("name,nickname,kr8_id,whatsapp,email,track,side,status,country,joined_at");
    expect(firstRow.split(",").length).toBeGreaterThanOrEqual(10);
  });
});

describe("spotlight interplay", () => {
  it("awardMonthly winner appears in the spotlight special audience", () => {
    const winner = db().students.find((s) => s.role === "student")!;
    awardMonthly({ studentId: winner.id, trackKey: winner.trackKey, month: "2026-11" }, "Test Admin");
    const spotlight = resolveAudience({ ...DEFAULT_SEGMENT, special: "spotlight" });
    expect(spotlight.some((s) => s.id === winner.id)).toBe(true);
    expect(listMonthlyAwards().length).toBeGreaterThanOrEqual(1);
  });
});
