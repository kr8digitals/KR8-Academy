import { useMemo, useState } from "react";
import { Crown, Flame, Medal, Sparkles, Trophy } from "lucide-react";
import { TRACKS } from "../data/academy";
import { getLeaderboard } from "../lib/store";
import { useDb } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { levelFor } from "../lib/utils";
import { Avatar, ButtonLink, Pill, Progress, SectionHead } from "../components/ui";
import { CtaBand, SectionIndex } from "../components/sections";

export default function Leaderboard() {
  const db = useDb();
  const [filter, setFilter] = useState<string>("all");
  const rows = getLeaderboard();

  useSeo({
    title: "Leaderboard — the cohort standings",
    description:
      "Live KR8 Academy standings. Points come from completed weeks, accepted assignments, live attendance and referrals — showing up is the whole strategy.",
    path: "/leaderboard",
  });

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((row) => row.trackKey === filter)),
    [rows, filter]
  );

  const top = filtered.slice(0, 3);
  const rest = filtered.slice(3, 25);

  return (
    <>
      <section className="border-b border-white/10">
        <div className="shell py-12 sm:py-16">
          <SectionIndex index="Leaderboard" label={`${db.settings.cohortName} standings`} />
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="display display-xl max-w-[15ch]">Showing up is the strategy.</h1>
              <p className="lede mt-5 max-w-xl">
                Points come from four things only: finishing weeks, getting assignments accepted, attending live
                sessions, and bringing someone who graduates. No popularity. No talent contests.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Week completed", value: "+120 XP", icon: Sparkles },
                { label: "Assignment accepted", value: "+80 XP", icon: Trophy },
                { label: "Live session", value: "+60 XP", icon: Flame },
                { label: "Referral", value: "+40 XP", icon: Medal },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-raised p-3">
                    <Icon size={14} className="text-magenta-bright" />
                    <p className="mt-1.5 font-display text-[13px] font-semibold">{item.value}</p>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-muted">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="shell py-10">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-medium transition ${
              filter === "all" ? "border-white bg-magenta-fill text-white" : "border-white/15 bg-raised text-muted hover:text-white"
            }`}
          >
            All tracks
          </button>
          {TRACKS.map((track) => (
            <button
              key={track.key}
              type="button"
              onClick={() => setFilter(track.key)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-medium transition ${
                filter === track.key ? "border-white bg-magenta-fill text-white" : "border-white/15 bg-raised text-muted hover:text-white"
              }`}
            >
              {track.name}
            </button>
          ))}
        </div>

        {/* Podium */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {top.map((row, index) => {
            const level = levelFor(row.xp);
            const medal = ["bg-gold text-[#1a0326]", "bg-white/85 text-[#1a0326]", "bg-[#b07a4a] text-white"][index];
            return (
              <div
                key={row.student.id}
                className={`card relative overflow-hidden p-5 ${index === 0 ? "sm:-mt-2 sm:shadow-[0_30px_60px_-40px_rgba(36,7,48,0.55)]" : ""}`}
              >
                <span className={`absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ${medal}`}>
                  {index + 1}
                </span>
                <div className="flex items-center gap-3">
                  <Avatar name={row.student.name} src={row.student.avatar} size={52} ring />
                  <div className="min-w-0">
                    <p className="truncate font-display text-[15px] font-semibold">{row.student.name}</p>
                    <p className="truncate text-[11px] text-muted">{row.track}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="font-display text-2xl font-semibold tabular-nums">{row.xp.toLocaleString()}</p>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted">XP</p>
                  </div>
                  <Pill tone={index === 0 ? "magenta" : "default"}>{level.current.name}</Pill>
                </div>
                <Progress className="mt-3" value={level.pct} tone="magenta" />
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/8 pt-3 text-center">
                  <div><p className="text-[12px] font-semibold tabular-nums">{row.student.weeksDone.length}</p><p className="text-[9px] uppercase text-muted">weeks</p></div>
                  <div><p className="text-[12px] font-semibold tabular-nums">{row.accepted}</p><p className="text-[9px] uppercase text-muted">accepted</p></div>
                  <div><p className="text-[12px] font-semibold tabular-nums">{row.attendance}</p><p className="text-[9px] uppercase text-muted">sessions</p></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-raised">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Standings</p>
            <span className="text-[11px] text-muted">{filtered.length} students</span>
          </div>
          <div className="divide-y divide-white/8">
            {rest.length === 0 && top.length === 0 && (
              <p className="px-5 py-10 text-center text-[13px] text-muted">No students in this track yet.</p>
            )}
            {rest.map((row, index) => {
              const level = levelFor(row.xp);
              return (
                <div key={row.student.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-magenta/[0.02] sm:px-5">
                  <span className="w-7 shrink-0 font-mono text-[11px] text-muted">{index + 4}</span>
                  <Avatar name={row.student.name} src={row.student.avatar} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{row.student.name}</p>
                    <p className="truncate text-[10px] text-muted">{row.track} · {level.current.name}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[11px] text-muted">{row.student.weeksDone.length}/8 weeks</p>
                    <p className="text-[10px] text-muted">{row.accepted} accepted</p>
                  </div>
                  <p className="w-16 shrink-0 text-right font-display text-[13px] font-semibold tabular-nums">
                    {row.xp.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-raised p-4">
          <p className="text-[12px] text-muted">
            Your position updates the moment you complete a week, submit work or check in.
          </p>
          <ButtonLink to="/dashboard" variant="ghost" size="sm">
            Open my dashboard
          </ButtonLink>
        </div>
      </section>

      <section className="shell pb-12">
        <SectionHead eyebrow="How ranking works" title="Levels, explained." />
        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { name: "Newcomer", min: 0 },
            { name: "Apprentice", min: 250 },
            { name: "Practitioner", min: 700 },
            { name: "Craftsperson", min: 1400 },
            { name: "Specialist", min: 2400 },
            { name: "Master", min: 3600 },
          ].map((level, index) => (
            <div key={level.name} className="rounded-xl border border-white/10 bg-raised p-3.5">
              <div className="flex items-center gap-1.5">
                {index === 5 ? <Crown size={13} className="text-gold" /> : <span className="h-1.5 w-1.5 rounded-full bg-magenta-fill" />}
                <p className="text-[12px] font-semibold">{level.name}</p>
              </div>
              <p className="mt-1 font-mono text-[10px] text-muted">{level.min.toLocaleString()}+ XP</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-muted">
          Sample cohort data is included so the standings are not empty on first load. The academy can clear it
          from the admin console at any time.
        </p>
      </section>

      <CtaBand
        title="Want your name on this board?"
        body="The ladder starts at your first completed week. Apply, show up, and climb it."
        primaryLabel="Apply free"
        secondaryLabel="See the tracks"
        secondaryTo="/tracks"
      />
    </>
  );
}
