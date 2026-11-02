import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BadgeCheck,
  Flame,
  Heart,
  QrCode,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ADMISSION_STEPS, MENTORS, PILLARS, PROGRAMME, TRACKS } from "../data/academy";
import { useDb } from "../lib/hooks";
import { useSeo, organizationJsonLd } from "../lib/seo";
import { ButtonLink, SectionHead } from "../components/ui";
import { CtaBand, Faq, Marquee, Reveal, SectionIndex } from "../components/sections";
import { MentorCard, TestimonialWall, TrackCard, VerifyWidget } from "../components/showcase";
import { CertificatePreview } from "../components/CertificatePreview";

// A real record from the academy register, rendered through the live certificate
// engine on the home page so the QR code on display actually resolves.
const SAMPLE_CERTIFICATE = {
  studentName: "Grant Gideon",
  trackKey: "graphic",
  tier: "Professionalism" as const,
  code: "KR8-CERT-0001-PROF",
  kr8Id: "KR8-2026-GDVFD-0001",
  issuedAt: Date.UTC(2026, 9, 31, 12),
  verifyUrl: "https://academy.kr8digitals.com/certificate/KR8-CERT-0001-PROF",
};

const PILLAR_ICONS = { radio: Radio, badge: BadgeCheck, flame: Flame, heart: Heart } as const;

const HERO_PILLS = [
  `${PROGRAMME.cohortName} · registration open`,
  `Onboarding ${PROGRAMME.onboardingDate}`,
  `Classes begin ${PROGRAMME.classesBeginDate}`,
  `${PROGRAMME.classDaysShort} · ${PROGRAMME.classTimeShort}`,
];

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
    a: "The programme is eight weeks: the first four weeks are beginner, the last four are advanced. Class holds every Monday, Wednesday and Friday, 8:00–9:00pm WAT. Every class is followed by an assignment, submitted on Tuesday, Thursday or Saturday.",
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

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function HeroPill() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFade(true);
      window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % HERO_PILLS.length);
        setFade(false);
      }, 280);
    }, 3800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span className="inline-flex max-w-full items-center gap-2.5 rounded-full border border-white/12 bg-black/60 px-4 py-2 backdrop-blur-md">
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-magenta-bright opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-magenta-bright" />
      </span>
      <span
        className={`min-w-0 truncate text-[9px] font-bold uppercase tracking-[0.14em] text-[#f0c6ea] transition-opacity duration-300 sm:text-[11px] sm:tracking-[0.18em] ${
          fade ? "opacity-0" : "opacity-100"
        }`}
      >
        {HERO_PILLS[index]}
      </span>
    </span>
  );
}

function HeroPanel() {
  return (
    <div className="relative">
      <div
        className="absolute -inset-8 rounded-[42px] bg-[radial-gradient(circle_at_55%_35%,rgba(224,38,196,0.26),transparent_62%)] blur-2xl"
        aria-hidden="true"
      />

      <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-[#12001f] shadow-[0_60px_140px_-70px_rgba(0,0,0,0.95)]">
        {/* A real graduate, speaking in his own recording. No stock imagery, no rendered artwork. */}
        <div className="relative aspect-[5/6] w-full overflow-hidden bg-black">
          <video
            src="/media/testimonials/testimonial_grant_gideon.mp4"
            poster="/media/testimonials/testimonial_grant_gideon_poster.jpg"
            controls
            controlsList="nodownload"
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover object-[center_42%]"
          >
            <track
              kind="captions"
              src="/media/testimonials/testimonial_grant_gideon.vtt"
              srcLang="en"
              label="English"
            />
          </video>

          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/75 to-transparent"
            aria-hidden="true"
          />
          <span className="pointer-events-none absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live" />
            </span>
            {PROGRAMME.cohortName} · registration open
          </span>
        </div>

        {/* Whose voice this is, and the record behind it. */}
        <div className="px-4 pb-4 pt-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-[13.5px] font-semibold leading-tight text-white">Grant Gideon</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-live">Verified graduate</p>
          </div>
          <p className="mt-0.5 text-[10.5px] text-[#c8bcdd]">Federal University Dutse · Graphic Design</p>

          <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
            {[
              { k: "Classes", v: PROGRAMME.classDaysShort },
              { k: "Time", v: PROGRAMME.classTimeShort },
              { k: "Weeks", v: "8 · 4 + 4" },
            ].map((item) => (
              <div key={item.k}>
                <dt className="text-[8px] font-semibold uppercase tracking-[0.16em] text-white/45">{item.k}</dt>
                <dd className="mt-1 text-[10.5px] font-semibold leading-tight text-white">{item.v}</dd>
              </div>
            ))}
          </dl>

          <Link
            to="/certificate/KR8-CERT-0001-PROF"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:border-magenta-bright/60 hover:text-white"
          >
            <ShieldCheck size={10} className="text-magenta-bright" aria-hidden="true" />
            KR8-CERT-0001-PROF
            <ArrowUpRight size={10} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const open = useDb().settings.registrationOpen;

  return (
    <section className="hero-aurora starfield relative overflow-hidden">
      <div
        className="pointer-events-none absolute -left-32 top-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(122,31,168,0.35),transparent_65%)] blur-2xl"
        aria-hidden="true"
      />
      <div className="shell relative z-10 pb-16 pt-12 sm:pt-14 lg:pb-24 lg:pt-16">
        <div className="flex justify-center">
          <HeroPill />
        </div>

        <div className="mt-9 grid items-center gap-12 lg:mt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="rise-in">
            <h1 className="display display-xl max-w-[13ch] text-white">
              Learn a craft.
              <br />
              <span className="text-gradient">Get paid</span> for it.
              <br />
              Pay nothing.
            </h1>

            <p className="lede mt-6 max-w-xl">
              KR8 Academy is the tuition-free school of KR8 Digitals. Eight weeks, live practitioners, real
              deliverables — and a verifiable certificate at the end. Built so talent, not money, decides who
              gets trained.
            </p>

            <ul className="mt-7 space-y-3">
              {[
                { icon: ShieldCheck, text: "Verifiable KR8 ID", tone: "from-[#e026c4] to-[#7a1fa8]" },
                { icon: BadgeCheck, text: "Certificate included", tone: "from-[#c02ad4] to-[#7a1fa8]" },
                { icon: Sparkles, text: "No graduation fee", tone: "from-[#ff5bd8] to-[#b429c9]" },
              ].map(({ icon: Icon, text, tone }) => (
                <li key={text} className="flex items-center gap-3 text-[14px] font-medium text-[#e4dbef]">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-[0_8px_20px_-12px_rgba(224,38,196,0.9)]`}
                  >
                    <Icon size={13} aria-hidden="true" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink to={open ? "/apply" : "/admissions"} variant="primary" size="lg" arrow>
                {open ? "Apply for free" : "Join the waitlist"}
              </ButtonLink>
              <ButtonLink to="/tracks" variant="ghost" size="lg">
                Explore the 7 tracks
              </ButtonLink>
            </div>

            <div className="mt-9 grid grid-cols-3 gap-2.5 sm:gap-4">
              {[
                { value: "₦0", label: "Tuition, forever", dot: "bg-live" },
                { value: "7", label: "Skill tracks", dot: "bg-magenta-bright" },
                { value: "8", label: "Weeks per cohort", dot: "bg-[#a855f7]" },
              ].map((stat) => (
                <div key={stat.label} className="stat-card">
                  <p className="stat-value">{stat.value}</p>
                  <p className="mt-2 flex items-start gap-1.5 text-[8.5px] font-semibold uppercase leading-[1.35] tracking-[0.1em] text-[#b3a6cb] sm:text-[10px] sm:tracking-[0.14em]">
                    <span className={`mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full ${stat.dot}`} aria-hidden="true" />
                    <span>{stat.label}</span>
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[11px] text-muted">
              {PROGRAMME.seatsPerTrack} seats per track · {PROGRAMME.cohortName} · registration open
            </p>
          </div>

          <HeroPanel />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Home() {
  const db = useDb();

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
      <Hero />

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

      {/* ---------------------------------------------------------------- Why */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div
          className="pointer-events-none absolute right-0 top-10 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(224,38,196,0.12),transparent_65%)] blur-2xl"
          aria-hidden="true"
        />
        <div className="shell relative grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
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
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#e026c4] to-[#7a1fa8] text-white shadow-[0_10px_24px_-14px_rgba(224,38,196,0.9)]">
                      <Icon size={17} aria-hidden="true" />
                    </span>
                    <h3 className="mt-3 font-display text-[15px] font-semibold">{pillar.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{pillar.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              {[
                { src: "/media/work-fashion.jpg", alt: "City Fashion Stores brand identity", label: "Brand identity" },
                { src: "/media/p-elizabeth.jpg", alt: "A KR8 Academy student sharing her story", label: "Student story" },
                { src: "/media/work-afristem.jpg", alt: "Afristem digital science school project", label: "Event & school" },
                { src: "/media/work-chitom.png", alt: "Chitom platform preview built by KR8 Digitals", label: "Web platform" },
              ].map((tile, index) => (
                <Reveal key={tile.src} delay={index * 60}>
                  <figure className="group relative overflow-hidden rounded-[18px] border border-white/10 bg-raised">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={tile.src}
                        alt={tile.alt}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2.5 pt-8 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/80">
                      {tile.label}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-raised/95 p-4 shadow-xl backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Next cohort</p>
                  <p className="mt-1 font-display text-sm font-semibold">{PROGRAMME.cohortName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Classes begin</p>
                  <p className="mt-1 font-display text-sm font-semibold text-magenta-bright">
                    {PROGRAMME.classesBeginDate}
                  </p>
                </div>
              </div>
              <p className="mt-3 border-t border-white/10 pt-3 text-[11px] text-muted">
                Onboarding {PROGRAMME.onboardingDate} · classes begin {PROGRAMME.classesBeginDate} ·{" "}
                {PROGRAMME.classDaysShort}, {PROGRAMME.classTimeShort}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Tracks */}
      <section className="border-y border-white/10 bg-[#0a0312] py-16 sm:py-24">
        <div className="shell">
          <SectionHead
            eyebrow="02 — The tracks"
            title="Seven crafts. One standard."
            body="Every track is eight weeks, taught by a practitioner who ships client work, and ends with a portfolio you can defend."
            align="center"
            action={
              <ButtonLink to="/tracks" variant="ghost" arrow>
                Compare all tracks
              </ButtonLink>
            }
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRACKS.map((track, index) => (
              <Reveal key={track.key} delay={index * 45}>
                <TrackCard track={track} index={index} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Blueprint */}
      <section className="shell py-16 sm:py-24">
        <div className="panel-glow px-5 py-12 sm:px-10 sm:py-14">
          <div className="text-center">
            <SectionIndex index="03" label="The blueprint" />
            <h2 className="display display-lg mx-auto mt-5 max-w-2xl">
              From curious to <span className="text-gradient">paid</span>, in four moves.
            </h2>
            <p className="lede mx-auto mt-4 max-w-xl">
              No tuition ransom, no four-year theory degree. A straight line from opening the tools to billing a
              client — with proof you can show.
            </p>
          </div>

          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ADMISSION_STEPS.map((step, index) => (
              <Reveal key={step.step} delay={index * 70}>
                <li className="flex flex-col items-center text-center">
                  <span className="step-orb">{step.step}</span>
                  <h3 className="mt-4 font-display text-[17px] font-semibold">{step.title}</h3>
                  <p className="mt-2 max-w-[17rem] text-[13px] leading-relaxed text-[#c6b9d8]">{step.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>

          <div className="mt-11 flex justify-center">
            <ButtonLink to="/apply" variant="primary" size="lg" arrow>
              Start your application
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Proof */}
      <section className="ink-panel grain relative overflow-hidden py-16 sm:py-24">
        <div className="shell relative z-10 grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow text-white/70">04 — Proof, not promises</p>
            <h2 className="display display-lg mt-4 text-white">A certificate anyone can check in one scan.</h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/75">
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
                  <p className="mt-1 text-[11px] leading-relaxed text-white/60">{item.body}</p>
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
            <CertificatePreview input={SAMPLE_CERTIFICATE} showActions={false} />
            <div className="mt-3 flex items-start gap-3 rounded-xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-white">
                <QrCode size={15} />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">Certificate preview</p>
                <p className="mt-1.5 font-display text-sm font-semibold text-white">
                  Certificate of Professionalism · Graphic Design
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/60">
                  Real KR8 artwork rendered live. This sample carries the graduate&rsquo;s name, tier code and a QR
                  that resolves to the public record — scan it with your phone to see the register answer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Mentors */}
      <section className="shell py-16 sm:py-24">
        <SectionHead
          eyebrow="05 — The practitioners"
          title="Taught by people who ship daily."
          body="Not career lecturers. Working designers, editors, engineers and operators who run studios and client accounts."
          align="center"
          action={
            <ButtonLink to="/mentors" variant="ghost" arrow>
              Meet the mentors
            </ButtonLink>
          }
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MENTORS.slice(0, 4).map((mentor, index) => (
            <Reveal key={mentor.key} delay={index * 50}>
              <MentorCard mentor={mentor} compact />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- Graduates */}
      <section className="border-y border-white/10 bg-[#0a0312] py-16 sm:py-24">
        <div className="shell">
          <SectionHead
            eyebrow="06 — Graduate stories"
            title="They started exactly where you are."
            body="Real students. Real footage. Zero tuition, zero gatekeeping — and a portfolio at the end."
            align="center"
            action={
              <ButtonLink to="/leaderboard" variant="ghost" arrow>
                See the leaderboard
              </ButtonLink>
            }
          />
          <div className="mt-12">
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
