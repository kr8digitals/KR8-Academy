import { useMemo } from "react";
import { Sparkles, Trophy, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Student } from "../lib/types";
import {
  currentMonthKey,
  listMonthlyAwards,
  monthLabel,
  monthlySpotlightSummary,
  spotlightAwardTitle,
  spotlightEligible,
  SPOTLIGHT_CRITERIA,
} from "../lib/store";
import { Progress, Pill } from "./ui";

/**
 * "Monthly spotlight" — every student sees the running bar for the discipline
 * prize (Designer of the Month etc.), where they stand this month, and their
 * own shelf of past wins.
 */
export function SpotlightCard({ student }: { student: Student }) {
  const month = currentMonthKey();
  const summary = monthlySpotlightSummary(student.id, month);
  const eligible = spotlightEligible(summary);
  const awardTitle = spotlightAwardTitle(student.trackKey);
  const mine = useMemo(
    () => listMonthlyAwards().filter((a) => a.studentId === student.id),
    [student.id]
  );

  const attPct = Math.min(100, (summary.attendance / SPOTLIGHT_CRITERIA.attendance) * 100);
  const subPct = Math.min(100, (summary.submissions / SPOTLIGHT_CRITERIA.submissions) * 100);

  return (
    <div className="rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/8 via-raised to-raised p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow flex items-center gap-2 text-gold">
            <Sparkles size={13} /> This month's spotlight
          </p>
          <h3 className="display mt-1.5 text-[22px] font-semibold leading-tight">{awardTitle}</h3>
          <p className="mt-1 text-[12.5px] text-muted">{monthLabel(month)} · your discipline, your month to take.</p>
        </div>
        {eligible ? (
          <Pill tone="solid" className="border-gold/40 bg-gold/15 text-gold">You're in the running</Pill>
        ) : (
          <Pill tone="dark">{SPOTLIGHT_CRITERIA.attendance - summary.attendance > 0 || SPOTLIGHT_CRITERIA.submissions - summary.submissions > 0 ? "Keep going" : "Eligible"}</Pill>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Progress
          value={attPct}
          tone="gold"
          label={`Classes attended — ${summary.attendance}/${SPOTLIGHT_CRITERIA.attendance}`}
        />
        <Progress
          value={subPct}
          tone="gold"
          label={`Assignments submitted — ${summary.submissions}/${SPOTLIGHT_CRITERIA.submissions}`}
        />
      </div>
      <p className="mt-2.5 text-[11px] leading-relaxed text-muted">
        Eligibility is published: <span className="font-semibold text-white/80">{SPOTLIGHT_CRITERIA.attendance} classes</span> and{" "}
        <span className="font-semibold text-white/80">{SPOTLIGHT_CRITERIA.submissions} submissions</span> this month. {summary.accepted} accepted so far — quality counts for the final call.
      </p>

      {mine.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Your spotlights</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {mine.map((a) => (
              <li key={a.id} className="inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-gold/12 px-2.5 py-1 text-[10.5px] font-semibold text-gold">
                <Trophy size={11} /> {a.title} · {monthLabel(a.month)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link to="/leaderboard" className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-gold/90 transition hover:text-gold">
        See the leaderboard <ArrowRight size={12} />
      </Link>
    </div>
  );
}
