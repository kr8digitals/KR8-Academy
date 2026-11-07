import { useState } from "react";
import { CalendarClock, Check, GraduationCap, Rocket, Save } from "lucide-react";
import { useDb } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { setProgramme, saveSettings } from "../../lib/store";
import { trackName } from "../../data/academy";
import { cn } from "../../lib/utils";
import { Countdown } from "../../components/sections";
import type { ProgrammeStatus } from "../../lib/types";

const STATUS_LABEL: Record<ProgrammeStatus, string> = { open: "Open", waitlist: "Waitlist", closed: "Closed" };

const WEEKDAYS = [
  { key: "mon", label: "Mon" }, { key: "tue", label: "Tue" }, { key: "wed", label: "Wed" }, { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" }, { key: "sat", label: "Sat" }, { key: "sun", label: "Sun" },
];

const TIMEZONES = [
  "Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Africa/Johannesburg", "Africa/Cairo",
  "Europe/London", "Europe/Berlin", "America/New_York", "America/Chicago", "America/Los_Angeles",
  "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney", "Pacific/Auckland",
];

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ProgrammesTab() {
  const db = useDb();
  const toast = useToast();
  const [drafts, setDrafts] = useState<Record<string, { status: ProgrammeStatus; opensAt: string; note: string }>>(() =>
    Object.fromEntries(
      db.programmes.map((p) => [p.key, { status: p.status, opensAt: toLocalInput(p.opensAt), note: p.note }])
    )
  );
  const [schedule, setSchedule] = useState({
    classDays: db.settings.classDays,
    classStart: db.settings.classStart,
    classEnd: db.settings.classEnd,
    classAttendanceStart: db.settings.classAttendanceStart,
    classAttendanceEnd: db.settings.classAttendanceEnd,
    assignmentDays: db.settings.assignmentDays,
    assignmentWindowStart: db.settings.assignmentWindowStart,
    assignmentWindowEnd: db.settings.assignmentWindowEnd,
    timeZone: db.settings.timeZone,
  });
  const [dates, setDates] = useState({
    cohortStart: toLocalInput(db.settings.cohortStart),
    applicationDeadline: toLocalInput(db.settings.applicationDeadline),
    academicStartNote: db.settings.academicStartNote,
    waitlistPriorityHours: String(db.settings.waitlistPriorityHours),
    cohortSeatsNote: db.settings.cohortSeatsNote,
    expectedClassCount: String(db.settings.expectedClassCount),
    expectedAssignmentCount: String(db.settings.expectedAssignmentCount),
    jambMinParticipationPct: String(db.settings.jambMinParticipationPct),
    skillsCertificateThreshold: String(db.settings.skillsCertificateThreshold),
    skillsGraceFloor: String(db.settings.skillsGraceFloor),
    utmeCertificateThreshold: String(db.settings.utmeCertificateThreshold),
    kr8ExamPassMark: String(db.settings.kr8ExamPassMark),
  });
  const [savedTick, setSavedTick] = useState<string | null>(null);

  function flash(key: string) {
    setSavedTick(key);
    window.setTimeout(() => setSavedTick(null), 1600);
  }

  function saveProgrammeRow(key: string) {
    const draft = drafts[key];
    if (!draft) return;
    const opensAt = draft.status === "open" ? null : draft.opensAt ? new Date(draft.opensAt).toISOString() : null;
    setProgramme(key, { status: draft.status, opensAt, note: draft.note }, "Admin");
    flash(`prog-${key}`);
    toast.success("Programme saved", `${trackName(key)} → ${STATUS_LABEL[draft.status]}`);
  }

  function toggleDay(list: string[], day: string) {
    return list.includes(day) ? list.filter((d) => d !== day) : [...list, day];
  }

  function saveSchedule() {
    saveSettings({ ...schedule });
    flash("schedule");
    toast.success("Schedule saved", "Every window and the time zone are live immediately.");
  }

  function saveDates() {
    const numeric = (value: string, fallback: number) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : fallback;
    };
    saveSettings({
      cohortStart: new Date(dates.cohortStart).toISOString(),
      applicationDeadline: new Date(dates.applicationDeadline).toISOString(),
      academicStartNote: dates.academicStartNote.trim() || "January",
      waitlistPriorityHours: Math.max(1, Math.round(numeric(dates.waitlistPriorityHours, 72))),
      cohortSeatsNote: dates.cohortSeatsNote.trim(),
      expectedClassCount: Math.max(1, Math.round(numeric(dates.expectedClassCount, 24))),
      expectedAssignmentCount: Math.max(1, Math.round(numeric(dates.expectedAssignmentCount, 24))),
      jambMinParticipationPct: Math.min(100, Math.max(0, Math.round(numeric(dates.jambMinParticipationPct, 80)))),
      skillsCertificateThreshold: Math.min(100, Math.max(1, Math.round(numeric(dates.skillsCertificateThreshold, 90)))),
      skillsGraceFloor: Math.min(100, Math.max(0, Math.round(numeric(dates.skillsGraceFloor, 80)))),
      utmeCertificateThreshold: Math.min(400, Math.max(1, Math.round(numeric(dates.utmeCertificateThreshold, 240)))),
      kr8ExamPassMark: Math.min(100, Math.max(1, Math.round(numeric(dates.kr8ExamPassMark, 80)))),
    });
    flash("dates");
    toast.success("Cohort settings saved", "Dates, thresholds and expectations are live.");
  }

  const skillProgrammes = db.programmes.filter((p) => p.side === "skill");
  const academicProgramme = db.programmes.find((p) => p.key === "academic");

  const renderProgrammeEditor = (programme: (typeof db.programmes)[number]) => {
    const draft = drafts[programme.key] ?? { status: programme.status, opensAt: "", note: programme.note };
    const dirty =
      draft.status !== programme.status ||
      toLocalInput(programme.opensAt) !== draft.opensAt ||
      draft.note !== programme.note;
    return (
      <div key={programme.key} className="rounded-xl border border-white/10 bg-sunken p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-semibold">{programme.side === "academic" ? "Academics · Next Gen Scholars" : trackName(programme.key)}</p>
          <div className="flex items-center gap-2">
            {programme.opensAt && draft.status !== "open" && <Countdown to={programme.opensAt} />}
            {dirty && (
              <button className="btn btn-primary btn-sm" onClick={() => saveProgrammeRow(programme.key)}>
                {savedTick === `prog-${programme.key}` ? <Check size={13} /> : <Save size={13} />} Save
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[130px_1fr]">
          <label className="block">
            <span className="field-label">Status</span>
            <select
              className="input"
              value={draft.status}
              onChange={(e) => setDrafts((d) => ({ ...d, [programme.key]: { ...draft, status: e.target.value as ProgrammeStatus } }))}
            >
              <option value="open">Open</option>
              <option value="waitlist">Waitlist</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <label className="block">
            <span className="field-label">Opening date & time {draft.status === "open" && "(n/a)"}</span>
            <input
              type="datetime-local"
              className="input"
              disabled={draft.status === "open"}
              value={draft.opensAt}
              onChange={(e) => setDrafts((d) => ({ ...d, [programme.key]: { ...draft, opensAt: e.target.value } }))}
            />
          </label>
        </div>
        <label className="mt-3 block">
          <span className="field-label">Public note (shown on the registration page)</span>
          <input
            className="input"
            value={draft.note}
            onChange={(e) => setDrafts((d) => ({ ...d, [programme.key]: { ...draft, note: e.target.value } }))}
            placeholder="e.g. Selection by application; opens around March–April 2027."
          />
        </label>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Skills */}
      <div className="card p-5">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          <Rocket size={12} className="text-magenta-bright" /> Digital skills — next intake
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
          Each track opens and closes independently. Waitlisted tracks capture names and emails; registration is refused
          for anything not Open. Status, opening date and note are live immediately.
        </p>
        <div className="mt-4 space-y-3">{skillProgrammes.map(renderProgrammeEditor)}</div>
      </div>

      {/* Academics */}
      {academicProgramme && (
        <div className="card p-5">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            <GraduationCap size={12} className="text-cyan" /> Academics · Next Gen Scholars
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
            Academic registration is open now and stays open — training starts in January. Classes follow the same weekly
            rhythm as the skills cohort.
          </p>
          <div className="mt-4">{renderProgrammeEditor(academicProgramme)}</div>
        </div>
      )}

      {/* Weekly schedule */}
      <div className="card p-5">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          <CalendarClock size={12} className="text-warn" /> Weekly schedule & attendance windows
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
          Identical for digital skills and academics. Windows are West Africa Time by default; the time zone drives how
          students see the schedule in their own local time.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <fieldset>
            <span className="field-label">Class days</span>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d) => {
                const on = schedule.classDays.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setSchedule((s) => ({ ...s, classDays: toggleDay(s.classDays, d.key) }))}
                    className={cn("rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition", on ? "border-magenta bg-magenta/15 text-magenta-bright" : "border-white/12 text-muted hover:text-white")}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="block"><span className="field-label">Class starts</span><input type="time" className="input" value={schedule.classStart} onChange={(e) => setSchedule((s) => ({ ...s, classStart: e.target.value }))} /></label>
              <label className="block"><span className="field-label">Class ends</span><input type="time" className="input" value={schedule.classEnd} onChange={(e) => setSchedule((s) => ({ ...s, classEnd: e.target.value }))} /></label>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="block"><span className="field-label">Attendance opens</span><input type="time" className="input" value={schedule.classAttendanceStart} onChange={(e) => setSchedule((s) => ({ ...s, classAttendanceStart: e.target.value }))} /></label>
              <label className="block"><span className="field-label">Attendance closes</span><input type="time" className="input" value={schedule.classAttendanceEnd} onChange={(e) => setSchedule((s) => ({ ...s, classAttendanceEnd: e.target.value }))} /></label>
            </div>
          </fieldset>
          <fieldset>
            <span className="field-label">Assignment days</span>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d) => {
                const on = schedule.assignmentDays.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setSchedule((s) => ({ ...s, assignmentDays: toggleDay(s.assignmentDays, d.key) }))}
                    className={cn("rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition", on ? "border-cyan bg-cyan/10 text-cyan" : "border-white/12 text-muted hover:text-white")}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="block"><span className="field-label">Window opens</span><input type="time" className="input" value={schedule.assignmentWindowStart} onChange={(e) => setSchedule((s) => ({ ...s, assignmentWindowStart: e.target.value }))} /></label>
              <label className="block"><span className="field-label">Window closes</span><input type="time" className="input" value={schedule.assignmentWindowEnd} onChange={(e) => setSchedule((s) => ({ ...s, assignmentWindowEnd: e.target.value }))} /></label>
            </div>
            <label className="mt-2 block">
              <span className="field-label">Time zone</span>
              <select className="input" value={schedule.timeZone} onChange={(e) => setSchedule((s) => ({ ...s, timeZone: e.target.value }))}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace("_", " ")}</option>)}
              </select>
            </label>
          </fieldset>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="btn btn-primary btn-sm" onClick={saveSchedule}>
            {savedTick === "schedule" ? <Check size={13} /> : <Save size={13} />} Save schedule
          </button>
        </div>
      </div>

      {/* Cohort dates & grading policy */}
      <div className="card p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Training dates & grading policy</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block"><span className="field-label">Classes begin</span><input type="datetime-local" className="input" value={dates.cohortStart} onChange={(e) => setDates((d) => ({ ...d, cohortStart: e.target.value }))} /></label>
          <label className="block"><span className="field-label">Onboarding / deadline</span><input type="datetime-local" className="input" value={dates.applicationDeadline} onChange={(e) => setDates((d) => ({ ...d, applicationDeadline: e.target.value }))} /></label>
          <label className="block"><span className="field-label">Academic starts</span><input className="input" value={dates.academicStartNote} onChange={(e) => setDates((d) => ({ ...d, academicStartNote: e.target.value }))} /></label>
          <label className="block"><span className="field-label">Waitlist priority (hours)</span><input type="number" className="input" value={dates.waitlistPriorityHours} onChange={(e) => setDates((d) => ({ ...d, waitlistPriorityHours: e.target.value }))} /></label>
          <label className="block"><span className="field-label">Seats note</span><input className="input" value={dates.cohortSeatsNote} onChange={(e) => setDates((d) => ({ ...d, cohortSeatsNote: e.target.value }))} /></label>
          <label className="block"><span className="field-label">Min participation for UTME awards (%)</span><input type="number" className="input" value={dates.jambMinParticipationPct} onChange={(e) => setDates((d) => ({ ...d, jambMinParticipationPct: e.target.value }))} /></label>
          <label className="block"><span className="field-label">Expected classes in cohort</span><input type="number" className="input" value={dates.expectedClassCount} onChange={(e) => setDates((d) => ({ ...d, expectedClassCount: e.target.value }))} /></label>
          <label className="block"><span className="field-label">Expected assignments</span><input type="number" className="input" value={dates.expectedAssignmentCount} onChange={(e) => setDates((d) => ({ ...d, expectedAssignmentCount: e.target.value }))} /></label>
          <label className="block"><span className="field-label">Skills certificate threshold (/100)</span><input type="number" className="input" value={dates.skillsCertificateThreshold} onChange={(e) => setDates((d) => ({ ...d, skillsCertificateThreshold: e.target.value }))} /></label>
          <label className="block"><span className="field-label">Admin grace floor (/100)</span><input type="number" className="input" value={dates.skillsGraceFloor} onChange={(e) => setDates((d) => ({ ...d, skillsGraceFloor: e.target.value }))} /></label>
          <label className="block"><span className="field-label">UTME certificate threshold</span><input type="number" className="input" value={dates.utmeCertificateThreshold} onChange={(e) => setDates((d) => ({ ...d, utmeCertificateThreshold: e.target.value }))} /></label>
          <label className="block"><span className="field-label">KR8 exam pass mark</span><input type="number" className="input" value={dates.kr8ExamPassMark} onChange={(e) => setDates((d) => ({ ...d, kr8ExamPassMark: e.target.value }))} /></label>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="btn btn-primary btn-sm" onClick={saveDates}>
            {savedTick === "dates" ? <Check size={13} /> : <Save size={13} />} Save dates & policy
          </button>
        </div>
      </div>
    </div>
  );
}
