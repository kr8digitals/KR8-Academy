import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { MENTORS, TRACKS } from "../data/academy";
import { useDb, useMediaQuery } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { ButtonLink, SectionHead } from "../components/ui";
import { CtaBand, Reveal, SectionIndex } from "../components/sections";
import { TrackCard } from "../components/showcase";

const GROUPINGS = [
  { id: "all", label: "All tracks" },
  { id: "design", label: "Design & brand" },
  { id: "build", label: "Build & code" },
  { id: "growth", label: "Content & growth" },
];

const GROUP_MAP: Record<string, string[]> = {
  design: ["graphic"],
  build: ["web", "frontend"],
  growth: ["video", "content_creation", "smm", "marketing"],
};

export default function Tracks() {
  const db = useDb();
  const [group, setGroup] = useState("all");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useSeo({
    title: "Tracks — seven free creative disciplines",
    description:
      "Compare all seven KR8 Academy tracks: graphic design, video editing & animation, website development, front-end development, content creation, social media management and digital marketing.",
    path: "/tracks",
  });

  const filtered = useMemo(
    () => (group === "all" ? TRACKS : TRACKS.filter((t) => GROUP_MAP[group]?.includes(t.key))),
    [group]
  );

  return (
    <>
      <section className="border-b border-ink/10">
        <div className="shell py-12 sm:py-16">
          <SectionIndex index="Tracks" label="The catalogue" />
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <h1 className="display display-xl max-w-[16ch]">
                Pick the craft you want to be paid for.
              </h1>
              <p className="lede mt-5 max-w-xl">
                Seven eight-week tracks. Same standard, same tuition (zero), same promise: you leave with work
                you can show and a credential anyone can verify.
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-cream p-5">
              <p className="eyebrow">Next cohort</p>
              <p className="mt-2 font-display text-lg font-semibold">{db.settings.cohortName}</p>
              <p className="mt-1 text-[12px] text-muted">{db.settings.cohortSeatsNote}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-ink/8 pt-4 text-[12px]">
                <div>
                  <p className="text-muted">Live sessions</p>
                  <p className="mt-0.5 font-semibold">Tue & Thu · 7pm</p>
                </div>
                <div>
                  <p className="text-muted">Time per week</p>
                  <p className="mt-0.5 font-semibold">6–8 hours</p>
                </div>
              </div>
              <ButtonLink to="/apply" variant="primary" size="sm" full className="mt-4" arrow>
                {db.settings.registrationOpen ? "Apply free" : "Join the waitlist"}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="shell py-12">
        <div className="flex flex-wrap items-center gap-2">
          {GROUPINGS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setGroup(item.id)}
              className={`rounded-full border px-3.5 py-2 text-[12px] font-medium transition ${
                group === item.id
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/15 bg-cream text-ink/65 hover:border-ink/35 hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-muted">
            {filtered.length} track{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((track, index) => (
            <Reveal key={track.key} delay={index * 40}>
              <TrackCard track={track} index={index} />
            </Reveal>
          ))}
        </div>
      </section>

      {isDesktop && (
        <section className="shell pb-16">
          <SectionHead eyebrow="Side by side" title="The comparison table" />
          <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-cream">
            <table className="data-table min-w-[860px]">
              <thead>
                <tr className="bg-paper-2/60">
                  <th className="pl-5">Track</th>
                  <th>Code</th>
                  <th>Level</th>
                  <th>Duration</th>
                  <th>Commitment</th>
                  <th>Mentor</th>
                  <th>Seats</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {TRACKS.map((track) => {
                  const mentor = MENTORS.find((m) => m.key === track.mentorKey);
                  return (
                    <tr key={track.key}>
                      <td className="pl-5">
                        <Link to={`/tracks/${track.slug}`} className="flex items-center gap-2 font-semibold hover:text-plum">
                          <span className="h-2 w-2 rounded-full" style={{ background: track.accent }} />
                          {track.name}
                        </Link>
                      </td>
                      <td className="font-mono text-[11px] text-muted">{track.code}</td>
                      <td className="text-[12px] text-muted">{track.level}</td>
                      <td className="text-[12px]">{track.duration}</td>
                      <td className="text-[12px] text-muted">{track.commitment}</td>
                      <td className="text-[12px]">{mentor?.shortName}</td>
                      <td className="text-[12px] tabular-nums">{track.seats}</td>
                      <td className="pr-5 text-right">
                        <Link to={`/tracks/${track.slug}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-magenta">
                          View <ArrowRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="shell pb-16">
        <div className="grid gap-4 rounded-2xl border border-ink/10 bg-paper-2 p-6 sm:grid-cols-3 sm:p-8">
          {[
            { title: "Every track is free", body: "No tuition, no exam fee, no certificate fee. Funded by the KR8 agency." },
            { title: "Every track is live", body: "Two sessions a week with the practitioner who actually does the work." },
            { title: "Every track ends in proof", body: "A portfolio, a verifiable KR8 ID and a certificate with a QR code." },
          ].map((item) => (
            <div key={item.title} className="flex gap-2.5">
              <Check size={16} className="mt-0.5 shrink-0 text-magenta" />
              <div>
                <p className="text-[13px] font-semibold">{item.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CtaBand
        title="Still deciding? Apply, then switch tracks inside week one."
        body="You do not have to get the choice perfect. Accepted students can move track once, before the first assignment is due."
        primaryLabel="Start my application"
        secondaryLabel="Talk to a human"
        secondaryTo="/admissions"
      />
    </>
  );
}
