import { useMemo, useState } from "react";
import { Sparkles, Trophy, Crown, Flame, Info } from "lucide-react";
import {
  currentMonthKey,
  monthLabel,
  shortlistForMonth,
  awardMonthly,
  listMonthlyAwards,
  SPOTLIGHT_CRITERIA,
  spotlightEligible,
} from "../../lib/store";
import { useDb } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Avatar, Card, EmptyState, Pill } from "../../components/ui";

/**
 * Monthly spotlight control room — every month, one name per discipline is
 * announced. The shortlist is computed from real attendance and submissions;
 * the academy team makes the final call.
 */
export default function SpotlightTab({ actor }: { actor: string }) {
  const db = useDb();
  const toast = useToast();
  const [month, setMonth] = useState(currentMonthKey());

  const groups = useMemo(() => shortlistForMonth(month), [month, db]);
  const published = useMemo(() => listMonthlyAwards().filter((a) => a.month === month), [month, db]);
  const alreadyNamed = new Set(published.map((a) => a.trackKey));

  const crown = (trackKey: string, studentId: string, title: string, name: string) => {
    const ok = window.confirm(`Name ${name} as ${title} for ${monthLabel(month)}? Everyone in the cohort will be told.`);
    if (!ok) return;
    const result = awardMonthly({ studentId, trackKey, month }, actor);
    if (result.ok) toast.success("Announced", `${name} is ${title} for ${monthLabel(month)}.`);
    else toast.error("Could not announce", result.error ?? "Try again.");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow flex items-center gap-2"><Sparkles size={12} className="text-gold" /> Monthly spotlight</p>
          <h1 className="display display-md mt-2">The best in the room, named.</h1>
          <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-muted">
            One winner per discipline each month — Designer of the Month, Editor of the Month and the rest. Shortlist is
            computed; you make the call. Publishing notifies the cohort and pins an announcement.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[12px] font-semibold text-muted">
          Month
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="rounded-lg border border-white/12 bg-raised px-3 py-2 text-[12px] text-white outline-none focus:border-magenta/50"
          />
        </label>
      </div>

      <div className="rounded-xl border border-cyan/20 bg-cyan/6 px-4 py-2.5 text-[11px] leading-relaxed text-cyan">
        <Info size={12} className="mr-1.5 inline" />
        Eligibility (published): at least {SPOTLIGHT_CRITERIA.attendance} class attendances and {SPOTLIGHT_CRITERIA.submissions} assignments submitted in {monthLabel(month)}.
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<Crown size={22} />}
          title="Nobody has broken the tape yet"
          body="As soon as attendance and submissions land for this month, the shortlist builds itself."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {groups.map((group) => {
            const named = alreadyNamed.has(group.trackKey);
            const winner = published.find((a) => a.trackKey === group.trackKey);
            return (
              <Card key={group.trackKey} className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{group.trackName}</p>
                    <p className="mt-0.5 text-[15px] font-bold text-gold">{group.title}</p>
                  </div>
                  {named ? (
                    <Pill tone="solid" className="border-gold/40 bg-gold/15 text-gold"><Trophy size={11} className="mr-1 inline" />Named</Pill>
                  ) : (
                    <Pill tone="dark"><Flame size={11} className="mr-1 inline" />{group.rows.length} in the running</Pill>
                  )}
                </div>

                <ol className="mt-4 space-y-2">
                  {group.rows.map(({ student, sum }, index) => {
                    const eligible = spotlightEligible(sum);
                    const isWinner = winner?.studentId === student.id;
                    return (
                      <li
                        key={student.id}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                          isWinner ? "border-gold/40 bg-gold/10" : "border-white/8 bg-base"
                        }`}
                      >
                        <span className="w-5 text-center font-mono text-[12px] font-bold text-muted">{index + 1}</span>
                        <Avatar name={student.name} src={student.avatar} size={32} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold">{student.name}</p>
                          <p className="text-[9.5px] uppercase tracking-wider text-muted">
                            {sum.attendance} classes · {sum.submissions} submitted · {sum.accepted} accepted
                            {eligible ? " · eligible" : ""}
                          </p>
                        </div>
                        {isWinner ? (
                          <span className="grid h-8 w-8 place-items-center text-gold" title="Winner"><Trophy size={17} /></span>
                        ) : (
                          !named && (
                            <button
                              type="button"
                              onClick={() => crown(group.trackKey, student.id, group.title, student.name)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-gold/45 bg-gold/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gold transition hover:bg-gold/20"
                            >
                              <Crown size={12} /> Crown
                            </button>
                          )
                        )}
                      </li>
                    );
                  })}
                </ol>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
