import { ArrowUpRight, Quote } from "lucide-react";
import { MENTORS, TRACKS } from "../data/academy";
import { useSeo } from "../lib/seo";
import { ButtonLink, Pill, SectionHead } from "../components/ui";
import { CtaBand, Reveal, SectionIndex } from "../components/sections";
import { MentorCard } from "../components/showcase";
import { Link } from "react-router-dom";

export default function Mentors() {
  useSeo({
    title: "Mentors — the practitioners who teach",
    description:
      "Meet the KR8 Academy faculty: the founder, co-founders and directors who run studios and ship client work — and teach every cohort themselves.",
    path: "/mentors",
  });

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 starfield opacity-70" aria-hidden="true" />
        <div className="shell relative grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <SectionIndex index="Faculty" label="Who teaches you" />
            <h1 className="display display-xl mt-5 max-w-[16ch]">
              Practitioners, not lecturers.
            </h1>
            <p className="lede mt-5 max-w-xl">
              KR8 Academy is taught by the people who built KR8 Digitals and run its client studios. They do not
              teach from slides — they teach from the work on their screens this week.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Pill>Founder-led</Pill>
              <Pill>Studio practitioners</Pill>
              <Pill>Live critique</Pill>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {MENTORS.slice(0, 2).map((mentor) => (
              <div key={mentor.key} className="photo-frame aspect-[4/5]">
                <img src={mentor.photo} alt={mentor.name} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="shell py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MENTORS.map((mentor, index) => (
            <Reveal key={mentor.key} delay={index * 50}>
              <MentorCard mentor={mentor} />
            </Reveal>
          ))}

          <Reveal delay={260}>
            <div className="flex h-full flex-col justify-between rounded-[18px] border border-dashed border-white/20 p-6">
              <div>
                <Quote size={18} className="text-magenta-bright" />
                <p className="mt-3 font-display text-lg leading-snug">
                  “We teach the way we work: brief, build, critique, ship — then do it again next week.”
                </p>
              </div>
              <p className="mt-5 text-[11px] uppercase tracking-[0.12em] text-muted">
                The KR8 Academy standard
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-raised py-16">
        <div className="shell">
          <SectionHead
            eyebrow="Teaching model"
            title="How a KR8 session actually runs."
            body="No 90-minute monologues. Each live session is a working room with a brief, a demonstration, and a critique."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              { step: "01", title: "The brief", body: "A real client-style brief opens the week, with constraints and a deadline." },
              { step: "02", title: "The drill", body: "Your mentor demonstrates the craft live on screen, then you build alongside them." },
              { step: "03", title: "The critique", body: "Work goes up, line by line. Feedback is specific, not polite noise." },
              { step: "04", title: "The ship", body: "You submit the deliverable in your dashboard. It feeds your XP and your certificate." },
            ].map((item, index) => (
              <Reveal key={item.step} delay={index * 60}>
                <div className="card h-full p-5">
                  <p className="font-mono text-[10px] text-muted">{item.step}</p>
                  <h3 className="mt-2 font-display text-base font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="shell py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionIndex index="Specialisms" label="Who teaches what" />
            <h2 className="display display-md mt-4 max-w-xs">Every track has a named owner.</h2>
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-muted">
              You will always know whose standard you are being held to — and who signs your certificate.
            </p>
          </div>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {TRACKS.map((track) => {
              const mentor = MENTORS.find((m) => m.key === track.mentorKey);
              return (
                <div key={track.key} className="flex flex-wrap items-center gap-3 py-3.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: track.accent }} />
                  <Link to={`/tracks/${track.slug}`} className="text-[13.5px] font-medium hover:text-magenta-bright">
                    {track.name}
                  </Link>
                  <span className="ml-auto flex items-center gap-2 text-[12px] text-muted">
                    {mentor?.shortName ?? "KR8 Faculty"}
                    <ArrowUpRight size={12} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-10">
          <ButtonLink to="/tracks" variant="ghost" arrow>
            Explore every curriculum
          </ButtonLink>
        </div>
      </section>

      <CtaBand
        title="Learn directly from the people doing the work."
        body="Seats are limited per track so critique stays personal. Apply once and pick your mentor's track."
        primaryLabel="Apply free"
        secondaryLabel="Read admissions"
        secondaryTo="/admissions"
      />
    </>
  );
}
