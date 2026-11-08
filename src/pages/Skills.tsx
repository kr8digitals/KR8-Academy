import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, GraduationCap } from "lucide-react";
import { MENTORS, TRACKS } from "../data/academy";
import { useDb, useMediaQuery } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { ButtonLink, SectionHead } from "../components/ui";
import { CtaBand, Reveal, SectionIndex } from "../components/sections";
import { TrackCard } from "../components/showcase";

const GROUPINGS = [
  { id: "all", label: "All skills" },
  { id: "design", label: "Design & brand" },
  { id: "build", label: "Build & code" },
  { id: "growth", label: "Content & growth" },
];

const GROUP_MAP: Record<string, string[]> = {
  design: ["graphic"],
  build: ["web", "frontend"],
  growth: ["video", "content_creation", "smm", "marketing"],
};

export default function Skills() {
  const db = useDb();
  const [group, setGroup] = useState("all");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useSeo({
    title: "Skills — seven tuition-free craft disciplines, full comparison",
    description:
      "All seven KR8 Academy skills in full — graphic design, video editing & animation, website development, front-end development, content creation, social media management and digital marketing — compared side by side. Plus KR8 Academics: tuition-free live UTME, WAEC and NECO preparation with Next Gen Scholars.",
    path: "/skills",
  });

  const skillsOpen = TRACKS.some((t) => db.programmes.find((p) => p.key === t.key)?.status === "open");

  const filtered = useMemo(
    () => (group === "all" ? TRACKS : TRACKS.filter((t) => GROUP_MAP[group]?.includes(t.key))),
    [group]
  );

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <img
          src="/media/hero-skills.jpg"
          alt="KR8 students building late into the evening — rows of laptops, headphones, a whiteboard of wireframes behind"
          className="absolute inset-0 h-full w-full object-cover object-[50%_35%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07050f]/78 via-[#07050f]/50 to-[#07050f]/6" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07050f]/70 via-[#07050f]/10 to-[#07050f]/32" aria-hidden="true" />
        <div className="shell relative py-16 sm:py-24">
          <SectionIndex index="Skills" label="The catalogue" />
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <h1 className="display display-xl max-w-[16ch]">
                Pick the skill you want to be paid for.
              </h1>
              <p className="lede mt-5 max-w-xl">
                Seven eight-week skills, taught live by working practitioners. Same standard, same tuition
                (zero), same promise: you leave with work you can show and a credential anyone can verify.
                Weeks 1–4 are beginner, weeks 5–8 advanced. And if exams are your focus, see KR8 Academics below.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-[#120822]/85 p-5 backdrop-blur-md">
              <p className="eyebrow">Next cohort</p>
              <p className="mt-2 font-display text-lg font-semibold">{db.settings.cohortName}</p>
              <p className="mt-1 text-[12px] text-muted">{db.settings.cohortSeatsNote}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/8 pt-4 text-[12px]">
                <div>
                  <p className="text-muted">Live classes</p>
                  <p className="mt-0.5 font-semibold">Mon · Wed · Fri</p>
                </div>
                <div>
                  <p className="text-muted">Class time</p>
                  <p className="mt-0.5 font-semibold">8–9pm WAT</p>
                </div>
              </div>
              <ButtonLink to="/apply" variant="primary" size="sm" full className="mt-4" arrow>
                {skillsOpen ? "Apply free" : "Join the waitlist"}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ————— The second door: Academics ————— */}
      <section className="shell pt-10">
        <Link
          to="/academics"
          className="group grid gap-4 rounded-2xl border border-cyan/25 bg-[#0b111c] p-5 transition hover:border-cyan/50 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-cyan/30 bg-cyan/10">
            <GraduationCap size={22} className="text-cyan" />
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-display text-[16px] font-semibold text-white">Not here for a craft? Try the other door.</span>
              <span className="rounded-full border border-cyan/40 bg-cyan/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-cyan">Open now</span>
            </span>
            <span className="mt-1 block text-[13px] leading-relaxed text-muted">
              KR8 Academics with <span className="text-white">Next Gen Scholars</span> — tuition-free live preparation for
              UTME, WAEC and NECO. Mon · Wed · Fri, 8–9pm WAT, starting January 2027. SS1 to retakers, all combinations.
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-cyan group-hover:gap-2.5 transition-all">
            Explore Academics <ArrowRight size={14} />
          </span>
        </Link>
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
                  ? "border-white bg-magenta-fill text-white"
                  : "border-white/15 bg-raised text-muted hover:border-white/35 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-muted">
            {filtered.length} skill{filtered.length === 1 ? "" : "s"}
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

      {/* ————— The walk-out ————— */}
      <section className="shell pb-14">
        <div className="grid items-stretch gap-0 overflow-hidden rounded-[26px] border border-white/10 bg-raised lg:grid-cols-[0.92fr_1.08fr]">
          <figure className="group relative min-h-[280px]">
            <img
              src="/media/portfolio-review.jpg"
              alt="A student walking a mentor through a finished website portfolio during review — case-study printouts spread across the worktable"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-[52%_center] transition-transform duration-[1400ms] group-hover:scale-[1.03]"
            />
            <figcaption className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#0d0015]/95 via-[#0d0015]/30 to-transparent px-6 pb-5 pt-24">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-magenta-bright">Week 7</p>
              <p className="mt-1 font-display text-[15px] font-semibold leading-snug text-white">The portfolio review — your mentor, your work, no hiding.</p>
            </figcaption>
          </figure>
          <div className="p-6 sm:p-8 lg:p-10">
            <SectionHead
              eyebrow="The walk-out"
              title="You leave with proof, not platitudes."
            />
            <ul className="mt-6 space-y-3.5 text-[13px] leading-relaxed text-body">
              {[
                "A portfolio of deployed, client-grade work — yours to link anywhere",
                "A verified KR8 ID and certificate anyone can check in one scan",
                "Published criteria, honestly applied — you know exactly where you stand",
                "A place in the register employers can verify in seconds",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-magenta-fill text-white">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <ButtonLink to="/apply" variant="primary" arrow className="mt-7">
              Start your application
            </ButtonLink>
          </div>
        </div>
      </section>

      {isDesktop && (
        <section className="shell pb-16">
          <SectionHead eyebrow="Side by side" title="All seven, side by side." />
          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-raised">
            <table className="data-table min-w-[860px]">
              <thead>
                <tr className="bg-raised/60">
                  <th className="pl-5">Skill</th>
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
                        <Link to={`/skills/${track.slug}`} className="flex items-center gap-2 font-semibold hover:text-magenta-bright">
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
                        <Link to={`/skills/${track.slug}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-magenta-bright">
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
        <div className="grid gap-4 rounded-2xl border border-white/10 bg-raised p-6 sm:grid-cols-3 sm:p-8">
          {[
            { title: "Every skill is free", body: "No tuition, no exam fee, no certificate fee. Funded by the KR8 agency and our partners." },
            { title: "Every skill is live", body: "Three classes a week — Monday, Wednesday and Friday, 8–9pm — with the practitioner who actually does the work." },
            { title: "Every skill ends in proof", body: "A portfolio, a verifiable KR8 ID and a certificate with a QR code." },
          ].map((item) => (
            <div key={item.title} className="flex gap-2.5">
              <Check size={16} className="mt-0.5 shrink-0 text-magenta-bright" />
              <div>
                <p className="text-[13px] font-semibold">{item.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CtaBand
        title="Still deciding? Apply, then switch skills inside week one."
        body="You do not have to get the choice perfect. Accepted students can move skill once, before the first assignment is due."
        primaryLabel="Start my application"
        secondaryLabel="How admissions work"
        secondaryTo="/admissions"
      />
    </>
  );
}
