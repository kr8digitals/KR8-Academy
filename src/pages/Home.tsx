import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Flame,
  Heart,
  Radio,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { ADMISSION_STEPS, MENTORS, PILLARS, TRACKS } from "../data/academy";
import { useDb } from "../lib/hooks";
import { useSeo, organizationJsonLd } from "../lib/seo";
import { formatDate, daysUntil } from "../lib/utils";
import { ButtonLink, Pill, SectionHead, Stat } from "../components/ui";
import { CtaBand, Faq, Marquee, Reveal, SectionIndex } from "../components/sections";
import { MentorCard, TestimonialWall, TrackCard, VerifyWidget } from "../components/showcase";

const PILLAR_ICONS = { radio: Radio, badge: BadgeCheck, flame: Flame, heart: Heart } as const;

const FAQS = [
  {
    q: "Is KR8 Academy really free?",
    a: "Yes — tuition is ₦0. There is no application fee, no graduation fee and no certificate fee. The academy is funded by the agency side of KR8 Digitals, which sells client work executed by our senior team and top graduates.",
  },
  {
    q: "Do I need experience or equipment?",
    a: "Every track starts from zero. You need a laptop or a capable phone, a stable internet connection and roughly 6–8 hours a week. We recommend the free tools first (Canva, CapCut, Figma) so nothing blocks you.",
  },
  {
    q: "How do the eight weeks actually run?",
    a: "Two live sessions a week — Tuesday and Thursday, 7:00pm WAT — plus asynchronous drills you complete in your own time. Every week has a deliverable you submit in your dashboard for review.",
  },
  {
    q: "What is a KR8 ID?",
    a: "It is your verifiable student identity, issued the moment your application is accepted (for example KR8-2026-GD-0001). It appears on your dashboard and certificate, and anyone can check it on the public verification page.",
  },
  {
    q: "Can I get a certificate?",
    a: "Yes, and it is verifiable. You qualify after meeting the graduation criteria — weekly submissions, live attendance and a final project. Certificates are issued by the academy, downloadable as PDF, and each one carries a QR code that resolves to a public verification page.",
  },
  {
    q: "What happens after I graduate?",
    a: "Graduates join the KR8 Tribe, get matched with paid briefs through the agency, and can return to mentor the next cohort. Some graduates go straight into client retainers.",
  },
];

export default function Home() {
  const db = useDb();
  const open = db.settings.registrationOpen;

  useSeo({
    title: "Free, studio-grade creative training",
    description:
      "Eight-week tuition-free cohorts in graphic design, video editing, website development, front-end engineering, content creation, social media management and digital marketing. Live practitioners, verifiable certificates, zero tuition.",
    path: "/",
    image: "/img/og-cover.jpg",
    jsonLd: [
      organizationJsonLd,
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "KR8 Academy",
        url: "https://academy.kr8digitals.com",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://academy.kr8digitals.com/verify?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ],
  });

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 hairline-grid opacity-[0.55]" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(214,42,156,0.18), transparent 65%)" }}
          aria-hidden="true"
        />
        <div className="shell relative grid gap-12 pb-14 pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-10 lg:pb-20 lg:pt-16">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="live">
                <span className="ticker-dot" /> {db.settings.cohortName}
              </Pill>
              <Pill>{open ? "Admissions open" : "Waitlist open"}</Pill>
              <Pill tone="magenta">₦0 tuition</Pill>
            </div>

            <h1 className="display display-xl mt-6 max-w-[15ch] text-white">
              Learn a craft.
              <br />
              <span className="text-magenta-bright">Get paid</span> for it.
              <br />
              Pay nothing.
            </h1>

            <p className="lede mt-6 max-w-xl">
              KR8 Academy is the tuition-free school of KR8 Digitals. Eight weeks, live practitioners, real
              deliverables — and a verifiable certificate at the end. Built so talent, not money, decides who
              gets trained.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink to={open ? "/apply" : "/admissions"} variant="primary" size="lg" arrow>
                {open ? "Apply for free" : "Join the waitlist"}
              </ButtonLink>
              <ButtonLink to="/tracks" variant="ghost" size="lg">
                Explore the 7 tracks
              </ButtonLink>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-magenta-bright" /> Verifiable KR8 ID
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck size={14} className="text-magenta-bright" /> Certificate included
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={14} className="text-magenta-bright" /> No graduation fee
              </span>
            </div>
          </div>

          {/* Photo composition */}
          <div className="relative">
            <div className="hero-photo aspect-[4/5] w-full shadow-[0_40px_90px_-60px_rgba(36,7,48,0.8)]">
              <img src="/img/hero-studio.jpg" alt="A KR8 Academy student working on a brand identity in the studio" fetchPriority="high" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-magenta-deep/85 via-violet-deep/10 to-transparent p-5 pt-16">
                <p className="font-display text-[15px] font-semibold text-white">Inside the design studio</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-white/60">
                  Graphic Design · week 3
                </p>
              </div>
            </div>

            <div className="absolute -left-3 top-6 hidden w-[172px] rounded-xl border border-white/10 bg-raised/95 p-3 shadow-xl backdrop-blur sm:block">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">Student ID</p>
              <p className="mt-1 font-mono text-[11px] font-semibold text-white">KR8-2026-GD-0042</p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] text-muted">Verified · Cohort 08</span>
              </div>
            </div>

            <div className="absolute -bottom-5 -right-2 flex items-center gap-2.5 rounded-xl border border-white/10 bg-raised p-3 shadow-xl sm:-right-5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-magenta-fill text-white">
                <Star size={15} />
              </span>
              <div>
                <p className="font-display text-sm font-semibold leading-none">772+ graduates</p>
                <p className="mt-1 text-[10px] text-muted">Since the first cohort</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className="shell">
          <div className="grid grid-cols-2 gap-6 rounded-2xl border border-white/10 bg-raised px-6 py-6 sm:grid-cols-4">
            <Stat value="₦0" label="Tuition, forever" />
            <Stat value="7" label="Skill tracks" />
            <Stat value="8" label="Weeks per cohort" />
            <Stat value="40" label="Seats per track" />
          </div>
        </div>
      </section>

      <div className="mt-14">
        <Marquee
          items={[
            "Zero tuition",
            "Live practitioners",
            "Verifiable KR8 ID",
            "Proof over paper",
            "Eight-week cohorts",
            "From learners to earners",
            "Graduate-powered agency",
          ]}
        />
      </div>

      {/* ---------------------------------------------------------------- Pillars */}
      <section className="shell py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <SectionIndex index="01" label="Why KR8 Academy" />
            <h2 className="display display-lg mt-5 max-w-lg">
              A school built like a studio, not a lecture hall.
            </h2>
            <p className="lede mt-4 max-w-lg">
              Most free programmes hand you videos and hope. KR8 Academy runs like the studios our mentors
              actually own: live briefs, weekly critique, deadlines that matter, and a portfolio at the end.
            </p>

            <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {PILLARS.map((pillar) => {
                const Icon = PILLAR_ICONS[pillar.icon];
                return (
                  <div key={pillar.title}>
                    <span className="inline-grid h-9 w-9 place-items-center rounded-lg bg-magenta-fill text-white">
                      <Icon size={16} />
                    </span>
                    <h3 className="mt-3 font-display text-[15px] font-semibold">{pillar.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{pillar.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <div className="hero-photo aspect-[4/3]">
              <img src="/img/cohort-room.jpg" alt="A KR8 Academy cohort reviewing work together in the studio" loading="lazy" />
            </div>
            <div className="absolute -bottom-6 left-4 right-4 rounded-xl border border-white/10 bg-raised p-4 shadow-xl sm:left-8 sm:right-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Next cohort</p>
                  <p className="mt-1 font-display text-sm font-semibold">
                    {formatDate(db.settings.cohortStart, { weekday: "short", day: "numeric", month: "long" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Orientation in</p>
                  <p className="mt-1 font-display text-sm font-semibold text-magenta-bright">
                    {Math.max(0, daysUntil(db.settings.cohortStart))} days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Tracks */}
      <section className="border-y border-white/10 bg-raised py-16 sm:py-20">
        <div className="shell">
          <SectionHead
            eyebrow="02 — The tracks"
            title="Seven crafts. One standard."
            body="Every track is eight weeks, taught by a practitioner who ships client work, and ends with a portfolio you can defend."
            action={
              <ButtonLink to="/tracks" variant="ghost" arrow>
                Compare all tracks
              </ButtonLink>
            }
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRACKS.slice(0, 6).map((track, index) => (
              <Reveal key={track.key} delay={index * 45}>
                <TrackCard track={track} index={index} />
              </Reveal>
            ))}
            <Reveal delay={280}>
              <Link
                to="/tracks/digital-marketing"
                className="group flex h-full flex-col justify-between rounded-[18px] border border-dashed border-white/20 p-6 transition hover:border-magenta/50 hover:bg-raised"
              >
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">07 / DMVFD</span>
                  <h3 className="display mt-4 text-xl leading-tight">Digital Marketing</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">
                    China importation, affiliate marketing and Amazon bounties — real income tracks with little
                    or no capital.
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-semibold text-white">
                  See the curriculum
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Blueprint */}
      <section className="shell py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SectionIndex index="03" label="The blueprint" />
            <h2 className="display display-lg mt-5 max-w-sm">From curious to paid, in four moves.</h2>
            <p className="lede mt-4 max-w-md">
              No tuition ransom, no four-year theory degree. A straight line from opening the tools to billing a
              client — with proof you can show.
            </p>
            <div className="hero-photo mt-8 aspect-[5/4] max-w-md">
              <img src="/img/editor-at-work.jpg" alt="A KR8 video editing student at work" loading="lazy" />
            </div>
          </div>

          <ol className="relative">
            <span className="absolute bottom-6 left-[19px] top-6 w-px bg-white/10" aria-hidden="true" />
            {ADMISSION_STEPS.map((step, index) => (
              <Reveal key={step.step} delay={index * 70}>
                <li className="relative flex gap-5 pb-9 last:pb-0">
                  <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-raised font-display text-[13px] font-semibold">
                    {step.step}
                  </span>
                  <div className="pt-1">
                    <h3 className="font-display text-lg font-semibold">{step.title}</h3>
                    <p className="mt-1.5 max-w-lg text-[14px] leading-relaxed text-muted">{step.body}</p>
                    {index === 0 && (
                      <Link to="/apply" className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-magenta-bright">
                        Start your application <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Proof */}
      <section className="ink-panel grain relative overflow-hidden py-16 sm:py-24">
        <div className="shell relative z-10 grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow text-white/50">04 — Proof, not promises</p>
            <h2 className="display display-lg mt-4 text-white">A certificate anyone can check in one scan.</h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/70">
              Every KR8 certificate carries the graduate's name, track, tier and a QR code that resolves to a
              public verification page. Employers do not have to take your word for it — and neither do you.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                { title: "Tiered certification", body: "Completion and Professionalism tiers, earned against published criteria." },
                { title: "Public verification", body: "Look up any KR8 ID or certificate code, instantly." },
                { title: "Print-ready PDF", body: "Download the exact artwork the academy issues — in one click." },
                { title: "Revocation aware", body: "If a credential is withdrawn, its verification page says so." },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-white/12 bg-white/[0.04] p-3.5">
                  <p className="text-[12px] font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/55">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-7">
              <ButtonLink to="/verify" variant="light" arrow>
                Verify a credential
              </ButtonLink>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-white/20 bg-white shadow-2xl">
              <img
                src="/cert/professionalism_graphic.jpg"
                alt="KR8 Academy Certificate of Professionalism artwork"
                loading="lazy"
                className="block w-full"
              />
            </div>
            <div className="mt-4 rounded-xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">Certificate preview</p>
              <p className="mt-1.5 font-display text-sm font-semibold text-white">
                Certificate of Professionalism · Graphic Design
              </p>
              <p className="mt-1 text-[11px] text-white/55">
                Real KR8 artwork. Names, tiers and QR codes are rendered live at issuance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Mentors */}
      <section className="shell py-16 sm:py-20">
        <SectionHead
          eyebrow="05 — The practitioners"
          title="Taught by people who ship daily."
          body="Not career lecturers. Working designers, editors, engineers and operators who run studios and client accounts."
          action={
            <ButtonLink to="/mentors" variant="ghost" arrow>
              Meet the mentors
            </ButtonLink>
          }
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MENTORS.slice(0, 4).map((mentor, index) => (
            <Reveal key={mentor.key} delay={index * 50}>
              <MentorCard mentor={mentor} compact />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- Graduates */}
      <section className="border-y border-white/10 bg-raised py-16 sm:py-20">
        <div className="shell">
          <SectionHead
            eyebrow="06 — Graduate stories"
            title="They started exactly where you are."
            body="Real students. Real footage. Zero tuition, zero gatekeeping — and a portfolio at the end."
            action={
              <ButtonLink to="/leaderboard" variant="ghost" arrow>
                See the leaderboard
              </ButtonLink>
            }
          />
          <div className="mt-10">
            <TestimonialWall limit={6} />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Verify strip */}
      <section className="shell py-16">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <SectionIndex index="07" label="For employers" />
            <h2 className="display display-md mt-4 max-w-md">
              Hiring? Check the credential before the CV.
            </h2>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted">
              Paste a graduate's KR8 ID or the code printed on their certificate. If it is real, we will say so —
              with the track, tier and issue date attached.
            </p>
            <Link to="/verify" className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-magenta-bright">
              Open the verification centre <ArrowUpRight size={13} />
            </Link>
          </div>
          <VerifyWidget />
        </div>
      </section>

      {/* ---------------------------------------------------------------- FAQ */}
      <section className="shell py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionIndex index="08" label="Questions" />
            <h2 className="display display-lg mt-5 max-w-xs">The honest answers.</h2>
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-muted">
              Still unsure? Message the team on WhatsApp — a human replies, usually within a day.
            </p>
            <ButtonLink href={db.settings.whatsappUrl} variant="ghost" size="sm" className="mt-5">
              Chat on WhatsApp
            </ButtonLink>
          </div>
          <Faq items={FAQS} />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
