import { useMemo, useState } from "react";
import { Flame, Megaphone, ShieldAlert, Coffee } from "lucide-react";
import { getRoster, getAttendance, db } from "../lib/store";
import { trackName } from "../data/academy";
import { Avatar, Pill } from "./ui";

/**
 * Admin's attendance command line — the people showing up and the people
 * quietly disappearing, computed from the same records the certificates use.
 */
export function ShowUpPanel({ onNudge, onNudgeAll }: { onNudge: (ids: string[]) => void; onNudgeAll: (ids: string[]) => void }) {
  const expected = db().settings.expectedClassCount || 16;
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo(() => {
    return getRoster()
      .filter((s) => s.role === "student" && s.status !== "suspended")
      .map((s) => {
        const attended = getAttendance(s.id).length;
        const pct = expected > 0 ? Math.min(100, Math.round((attended / expected) * 100)) : 0;
        return { student: s, attended, pct };
      })
      .sort((a, b) => a.pct - b.pct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expected, showAll]);

  const flagged = rows.filter((r) => r.pct < 50);
  const solid = rows.filter((r) => r.pct >= 75).length;
  const visible = showAll ? rows.slice(0, 14) : rows.slice(0, 6);

  return (
    <div className="rounded-2xl border border-white/10 bg-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow flex items-center gap-2"><Flame size={12} className="text-gold" /> Who is showing up</p>
          <p className="mt-1 text-[12px] text-muted">Attendance against the {expected} expected class sessions this cohort.</p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone="dark">{solid} solid</Pill>
          <Pill tone="default" className={flagged.length ? "border-gold/40 bg-gold/12 text-gold" : ""}>{flagged.length} flagged</Pill>
        </div>
      </div>

      <div className="mt-3 divide-y divide-white/6">
        {visible.map(({ student, attended, pct }) => (
          <div key={student.id} className="flex items-center gap-3 py-2">
            <Avatar name={student.name} src={student.avatar} size={30} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold leading-tight">{student.name}</p>
              <p className="truncate text-[9.5px] uppercase tracking-wider text-muted">{trackName(student.trackKey)} · {attended}/{expected} classes</p>
            </div>
            <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-white/8 sm:block" title={`${pct}%`}>
              <div className={pct < 50 ? "h-full bg-gold" : "h-full bg-cyan"} style={{ width: `${pct}%` }} />
            </div>
            {pct < 50 ? (
              <button
                type="button"
                onClick={() => onNudge([student.id])}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gold/40 bg-gold/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold transition hover:bg-gold/20"
              >
                <Megaphone size={11} /> Nudge
              </button>
            ) : (
              <span className="grid h-7 w-7 shrink-0 place-items-center text-cyan/70" title="Showing up"><Coffee size={15} /></span>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <p className="flex items-center gap-2 py-4 text-[12px] text-muted"><ShieldAlert size={14} /> No student records yet.</p>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => setShowAll((v) => !v)} className="text-[11px] font-semibold text-muted hover:text-white">
          {showAll ? "Show fewer" : `Show ${Math.min(rows.length, 14)} of ${rows.length}`}
        </button>
        {flagged.length > 0 && (
          <button
            type="button"
            onClick={() => onNudgeAll(flagged.map((r) => r.student.id))}
            className="inline-flex items-center gap-1.5 rounded-full border border-magenta/45 bg-magenta/12 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-magenta-bright transition hover:bg-magenta/20"
          >
            <Megaphone size={12} /> Nudge all {flagged.length} flagged
          </button>
        )}
      </div>
    </div>
  );
}
