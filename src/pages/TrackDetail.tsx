import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock,
  GraduationCap,
  Layers,
  Users,
} from "lucide-react";
import { MENTORS, TESTIMONIALS, TRACKS, trackBySlug, trackName } from "../data/academy";
import { useDb } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { cn, formatDate } from "../lib/utils";
import { Accordion, ButtonLink, Pill, SectionHead } from "../components/ui";
import { CtaBand, SectionIndex, StickyToc } from "../components/sections";
import { TestimonialWall, TrackIcon } from "../components/showcase";

import NotFound from "./NotFound";

/** Which graduate stories belong to which track — the filmed skills use looser names than the tracks. */
const STORY_KEYWORDS: Record<string, string[]> = {
  "graphic-design": ["graphic", "brand identity", "brand design"],
  "video-editing": ["video"],
  "website-development": ["web"],
  "frontend-development": ["web", "tech"],
  "content-creation": ["content"],
  "social-media-management": ["social", "content"],
  "digital-marketing": ["marketing", "digital skills"],
};

export default function TrackDetail() {
  const { slug = "" } = useParams();
  const track = trackBySlug(slug);
  const db = useDb();

  useSeo({
    title: track ? `${track.name} — free 8-week cohort` : "Track not found",
    description: track?.snippet,
    path: `/tracks/${slug}`,
    jsonLd: track
      ? {
          "@context": "https://schema.org",
          "@type": "Course",
          name: `${track.name} — KR8 Academy`,
          description: track.snippet,
          provider: {
            "@type": "EducationalOrganization",
            name: "KR8 Academy",
            sameAs: "https://academy.kr8digitals.com",
          },
          educationalCredentialAwarded: "Certificate of Completion / Professionalism",
          timeRequired: "P8W",
          offers: { "@type": "Offer", price: "0", priceCurrency: "NGN", category: "Free" },
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "online",
            courseWorkload: track.commitment,
            startDate: db.settings.cohortStart,
          },
        }
      : undefined,
  });

  if (!track) return <NotFound />;

  const mentor = MENTORS.find((m) => m.key === track.mentorKey);
  const related = TRACKS.filter((t) => t.key !== track.key).slice(0, 3);
  const trackTestimonials = TESTIMONIALS.filter((story) => {
    const skill = story.skill.toLowerCase();
    return (STORY_KEYWORDS[track.slug] ?? [track.name.split(" ")[0].toLowerCase()]).some((word) => skill.includes(word));
  }).slice(0, 3);

  const toc = [
    { id: "overview", label: "Overview" },
    { id: "curriculum", label: "Curriculum" },
    { id: "mentor", label: "Your mentor" },
    { id: "assessment", label: "Assessment" },
    { id: "stories", label: "Graduate stories" },
    { id: "apply", label: "Apply" },
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 starfield opacity-70" aria-hidden="true" />
        <div className="shell relative py-10 sm:py-14">
          <Link to="/tracks" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition hover:text-white">
            <ArrowLeft size={13} /> All tracks
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: track.accent }}>
                  <TrackIcon track={track} size={22} />
                </span>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{track.code}</p>
                  <p className="text-[11px] font-medium text-muted">{db.settings.cohortName}</p>
                </div>
              </div>

              <h1 className="display display-xl mt-5 max-w-[16ch]">{track.name}</h1>
              <p className="lede mt-4 max-w-xl">{track.tagline} {track.snippet}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Pill><Clock size={12} /> {track.duration}</Pill>
                <Pill><Layers size={12} /> {track.level}</Pill>
                <Pill><Users size={12} /> {track.seats} seats</Pill>
                <Pill tone={track.registrationOpen && db.settings.registrationOpen ? "live" : "default"}>
                  {track.registrationOpen && db.settings.registrationOpen ? "Registration open" : "Waitlist"}
                </Pill>
              </div>

              <div className="mt-7 flex flex-wrap gap-2.5">
                <ButtonLink to={`/apply?track=${track.key}`} variant="primary" size="lg" arrow>
                  Apply for this track
                </ButtonLink>
                <ButtonLink to="/admissions" variant="ghost" size="lg">
                  How admissions work
                </ButtonLink>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="relative aspect-[16/10] w-full bg-chip">
                <img src={track.cover} alt={`${track.name} at KR8 Academy`} className="h-full w-full object-cover" />
                <span className="absolute left-3 top-3 rounded-full bg-magenta/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur">
                  {track.code}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Classes begin</p>
                    <p className="mt-1 font-display text-sm font-semibold">
                      {formatDate(db.settings.cohortStart, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Tuition</p>
                    <p className="mt-1 font-display text-sm font-semibold text-magenta-bright">₦0.00</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/8 pt-4 text-[11px]">
                  <div className="flex items-center gap-1.5 text-muted"><CalendarDays size={13} /> Mon · Wed · Fri, 8–9pm WAT</div>
                  <div className="flex items-center gap-1.5 text-muted"><GraduationCap size={13} /> Certificate incl.</div>
                  <div className="flex items-center gap-1.5 text-muted"><BadgeCheck size={13} /> Verifiable KR8 ID</div>
                  <div className="flex items-center gap-1.5 text-muted"><Users size={13} /> Max {track.seats}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="shell flex gap-12 py-12">
        <StickyToc items={toc} />

        <div className="min-w-0 flex-1">
          {/* Overview */}
          <section id="overview" className="scroll-mt-28">
            <SectionIndex index="01" label="What you will be able to do" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {track.outcomes.map((outcome) => (
                <div key={outcome} className="flex gap-2.5 rounded-xl border border-white/10 bg-raised p-4">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-magenta-fill text-white">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <p className="text-[13px] leading-relaxed">{outcome}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-raised p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Tools you will use</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {track.tools.map((tool) => (
                  <span key={tool} className="rounded-lg border border-white/10 bg-raised px-2.5 py-1.5 text-[12px] font-medium">
                    {tool}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                Everything on this list has a free tier. Start free; upgrade only when your client work pays for it.
              </p>
            </div>
          </section>

          {/* Curriculum */}
          <section id="curriculum" className="mt-16 scroll-mt-28">
            <SectionHead
              eyebrow="02 — The eight weeks · beginner then advanced"
              title="Week by week, no filler."
              body="Each week pairs a live drill with a deliverable. Miss a week and your dashboard tells you exactly what to catch up on."
            />
            <div className="mt-8">
              <Accordion
                defaultOpen={0}
                items={track.curriculum.map((week, index) => ({
                  id: `w${index}`,
                  label: `${week.week} · ${index < 4 ? "Beginner" : "Advanced"}`,
                  meta: week.title,
                  body: (
                    <div>
                      <ul className="space-y-2">
                        {week.points.map((point) => (
                          <li key={point} className="flex gap-2.5 text-[13px] leading-relaxed text-body">
                            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-magenta-fill" />
                            {point}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
                        <Clock size={12} />
                        {index === track.curriculum.length - 1
                          ? "Final project, portfolio review and graduation"
                          : "Live drill + submitted deliverable"}
                      </div>
                    </div>
                  ),
                }))}
              />
            </div>
          </section>

          {/* Mentor */}
          {mentor && (
            <section id="mentor" className="mt-16 scroll-mt-28">
              <SectionIndex index="03" label="Who teaches it" />
              <div className="mt-6 grid gap-6 rounded-2xl border border-white/10 bg-raised p-5 sm:grid-cols-[180px_1fr] sm:p-6">
                <div className="photo-frame aspect-[4/5] w-full sm:aspect-auto">
                  <img src={mentor.photo} alt={mentor.name} loading="lazy" />
                </div>
                <div>
                  <h3 className="display text-xl">{mentor.shortName}</h3>
                  <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.1em] text-magenta-bright">{mentor.title}</p>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-body">{mentor.bio}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {mentor.trackKeys.map((key) => (
                      <span key={key} className="rounded-full bg-magenta/10 px-2 py-0.5 text-[10px] font-medium text-muted">
                        {trackName(key)}
                      </span>
                    ))}
                  </div>
                  <Link to="/mentors" className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-magenta-bright">
                    Meet the whole faculty <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Assessment */}
          <section id="assessment" className="mt-16 scroll-mt-28">
            <SectionIndex index="04" label="How you graduate" />
            <div className="mt-6 rounded-2xl bg-magenta-fill p-6 text-white">
              <h3 className="display text-xl">The certificate is earned, not bought.</h3>
              <p className="mt-2.5 text-[13px] leading-relaxed text-white/70">{track.criteria}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Live attendance", value: "≥ 80%" },
                  { label: "Weekly submissions", value: "6+ accepted" },
                  { label: "Final project", value: "Defended live" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/12 bg-white/[0.05] p-3">
                    <p className="font-display text-[16px] font-semibold text-white">{item.value}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-white/65">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Stories */}
          {trackTestimonials.length > 0 && (
            <section id="stories" className="mt-16 scroll-mt-28">
              <SectionHead eyebrow="05 — From this room" title="Graduates of this track." />
              <div className="mt-6">
                <TestimonialWall items={trackTestimonials} limit={3} />
              </div>
            </section>
          )}

          {/* Apply */}
          <section id="apply" className="mt-16 scroll-mt-28">
            <div className="rounded-2xl border border-white/10 bg-raised p-6 sm:p-8">
              <h3 className="display display-md max-w-md">Ready to take the seat?</h3>
              <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-muted">
                {db.settings.registrationOpen
                  ? `${track.seats} seats are released for ${db.settings.cohortName}. Applications take about three minutes.`
                  : "Admissions are paused for this cohort. Join the waitlist and we will alert you the moment a seat opens."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <ButtonLink to={`/apply?track=${track.key}`} variant="primary" arrow>
                  Apply for {track.name}
                </ButtonLink>
                <ButtonLink to="/admissions" variant="ghost">
                  Read the admissions policy
                </ButtonLink>
              </div>
            </div>

            <div className="mt-10">
              <p className="eyebrow">Other tracks</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {related.map((item) => (
                  <Link
                    key={item.key}
                    to={`/tracks/${item.slug}`}
                    className={cn("group card card-lift flex items-center gap-3 p-3.5")}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white" style={{ background: item.accent }}>
                      <TrackIcon track={item} size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold">{item.name}</span>
                      <span className="block text-[10px] text-muted">{item.duration} · {item.level}</span>
                    </span>
                    <ArrowRight size={14} className="ml-auto shrink-0 text-muted-2/70 transition group-hover:text-white" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <CtaBand
        title="One application. One seat. Zero tuition."
        body="Tell us which track you want and why. If a seat is open, you will have your KR8 ID the same day."
        primaryLabel="Apply free"
        secondaryLabel="See the mentors"
        secondaryTo="/mentors"
      />
    </>
  );
}
