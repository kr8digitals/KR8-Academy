import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BadgeCheck,
  Flame,
  GraduationCap,
  Handshake,
  Heart,
  QrCode,
  Radio,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { MENTORS, PILLARS, PROGRAMME, TRACKS } from "../data/academy";
import { useDb } from "../lib/hooks";
import { useSeo, organizationJsonLd } from "../lib/seo";
import { ButtonLink, Pill, SectionHead } from "../components/ui";
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

const FAQS = [
  {
    q: "Is KR8 Academy really free?",
    a: "Yes — tuition is ₦0. There is no application fee, no graduation fee and no certificate fee. The academy is funded by the agency side of KR8 Digitals, which sells client work executed by our senior team and top graduates.",
  },
  {
    q: "Do I need experience or equipment?",
    a: "Every skill starts from zero. You need a laptop or a capable phone, a stable internet connection and roughly 6–8 hours a week. We recommend the free tools first (Canva, CapCut, Figma) so nothing blocks you.",
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
  {
    q: "I don't want a creative skill — I need help with WAEC/JAMB. Is that this school too?",
    a: "Yes — through KR8 Academics, delivered with our partner Next Gen Scholars. Tuition-free live preparation for UTME/JAMB, WAEC and NECO: Monday, Wednesday and Friday, 8–9pm WAT, starting January 2027, open to SS1, SS3, retakers and students not writing an exam yet. See /academics for the full picture.",
  },
  {
    q: "Can my company, church or foundation partner with KR8?",
    a: "Yes — partnership is how KR8 stays free. Sponsor a cohort, fund seats and UTME awards, bring a new skill (music, fintech — whatever you practice professionally), equip the lab, host a hub in your city, or hire our graduates. Everything is scoped in writing; see /partner.",
  },
];

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

const HERO_PLAYLIST = [
  {
    src: "/media/testimonials/testimonial_grant_gideon.mp4",
    poster: "/media/testimonials/testimonial_grant_gideon_poster.jpg",
    vtt: "/media/testimonials/testimonial_grant_gideon.vtt",
    name: "Grant Gideon",
    meta: "Federal University Dutse · Graphic Design",
    credential: "KR8-CERT-0001-PROF",
    credentialTo: "/certificate/KR8-CERT-0001-PROF",
  },
  {
    src: "/media/testimonials/testimonial_bio_nicz.mp4",
    poster: "/media/testimonials/testimonial_bio_nicz_poster.jpg",
    vtt: "/media/testimonials/testimonial_bio_nicz.vtt",
    name: "Bio Nicz",
    meta: "Video Editing & Content",
    credential: "Verified creator",
    credentialTo: "/verify",
  },
  {
    src: "/media/testimonials/testimonial_afolayan_grace.mp4",
    poster: "/media/testimonials/testimonial_afolayan_grace_poster.jpg",
    vtt: "/media/testimonials/testimonial_afolayan_grace.vtt",
    name: "Afolayan Grace Taiwo",
    meta: "Digital Skills & Strategy",
    credential: "Verified student",
    credentialTo: "/verify",
  },
  {
    src: "/media/testimonials/testimonial_elizabeth_oyejobi.mp4",
    poster: "/media/testimonials/testimonial_elizabeth_oyejobi_poster.jpg",
    vtt: "/media/testimonials/testimonial_elizabeth_oyejobi.vtt",
    name: "Elizabeth Oyejobi",
    meta: "Tech & Design",
    credential: "Verified student",
    credentialTo: "/verify",
  },
  {
    src: "/media/testimonials/testimonial_new_8.mp4",
    poster: "/media/testimonials/testimonial_new_8_poster.jpg",
    vtt: "/media/testimonials/testimonial_new_8.vtt",
    name: "Onyenaturuchi Chisom Mbanu",
    meta: "Video Editing & Social Media",
    credential: "Verified student",
    credentialTo: "/verify",
  },
  {
    src: "/media/testimonials/testimonial_new_2.mp4",
    poster: "/media/testimonials/testimonial_new_2_poster.jpg",
    vtt: "/media/testimonials/testimonial_new_2.vtt",
    name: "William Marvelous",
    meta: "Video Editing & Animation",
    credential: "Verified student",
    credentialTo: "/verify",
  },
  {
    src: "/media/testimonials/testimonial_new_5.mp4",
    poster: "/media/testimonials/testimonial_new_5_poster.jpg",
    vtt: "/media/testimonials/testimonial_new_5.vtt",
    name: "David Ebuka",
    meta: "Digital Skills & Design",
    credential: "Verified student",
    credentialTo: "/verify",
  },
] as const;

const HERO_LAST_KEY = "kr8.hero.last";

/* Fully random playback — no clip is ever locked to a position. Picks any clip
   other than the one currently playing (and never the clip seen last visit on
   the first frame of a new visit). */
function pickRandomIndex(exclude: number | null): number {
  const choices = HERO_PLAYLIST.map((_, index) => index).filter((index) => index !== exclude);
  return choices[Math.floor(Math.random() * choices.length)] ?? 0;
}

function pickStartingIndex(): number {
  let exclude: number | null = null;
  try {
    const raw = window.localStorage.getItem(HERO_LAST_KEY);
    if (raw !== null) {
      const parsed = Number(raw);
      if (Number.isInteger(parsed)) exclude = parsed;
    }
  } catch {
    /* storage unavailable — fall through to random */
  }
  return pickRandomIndex(exclude);
}

function HeroPanel() {
  const [active, setActive] = useState(pickStartingIndex);
  const current = HERO_PLAYLIST[active];

  useEffect(() => {
    try {
      window.localStorage.setItem(HERO_LAST_KEY, String(active));
    } catch {
      /* storage unavailable — rotation still works for this visit */
    }
  }, [active]);

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
            key={current.src}
            src={current.src}
            poster={current.poster}
            autoPlay
            muted
            controls
            controlsList="nodownload"
            playsInline
            preload="auto"
            onEnded={() => setActive((prev) => pickRandomIndex(prev))}
            className="absolute inset-0 h-full w-full object-cover object-[center_42%]"
          >
            <track kind="captions" src={current.vtt} srcLang="en" label="English" />
          </video>

          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/75 to-transparent"
            aria-hidden="true"
          />
        </div>

        {/* Whose voice this is, and the record behind it. */}
        <div className="px-4 pb-4 pt-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-[13.5px] font-semibold leading-tight text-white">{current.name}</p>
            <div className="flex items-center gap-1" aria-hidden="true">
              {HERO_PLAYLIST.map((clip, index) => (
                <button
                  key={clip.src}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Play testimonial from ${clip.name}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === active ? "w-5 bg-magenta-bright" : "w-1.5 bg-white/25 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="mt-0.5 text-[10.5px] text-[#c8bcdd]">{current.meta}</p>

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
            to={current.credentialTo}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:border-magenta-bright/60 hover:text-white"
          >
            <ShieldCheck size={10} className="text-magenta-bright" aria-hidden="true" />
            {current.credential}
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
        <div className="mt-2 grid items-center gap-12 lg:mt-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="rise-in">
            <Link
              to="/academics"
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 py-1.5 pl-2.5 pr-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan transition hover:border-cyan/60 hover:bg-cyan/15"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" />
              New — KR8 Academics with Next Gen Scholars
              <ArrowUpRight size={12} />
            </Link>
            <h1 className="display display-xl max-w-[15ch] text-white">
              Skills for the future.
              <br />
              <span className="text-gradient">Results</span> for the exams.
            </h1>

            <p className="lede mt-6 max-w-xl">
              Bring a phone or laptop, we take care of the rest. Eight weeks of live, practice-led training
              from practitioners who ship real client work — and, with our partner Next Gen Scholars,
              tuition-free live preparation for UTME, WAEC and NECO. Zero tuition on both sides of the house.
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
              <ButtonLink to="/skills" variant="ghost" size="lg">
                Explore the 7 skills
              </ButtonLink>
            </div>

            <div className="mt-9 grid grid-cols-3 gap-2.5 sm:gap-4">
              {[
                { value: "₦0", label: "Tuition, forever", dot: "bg-live" },
                { value: "7", label: "Craft skills", dot: "bg-magenta-bright" },
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
              Academics open now · Skills waitlist opens March–April 2027
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
      "Eight-week tuition-free cohorts in graphic design, video editing, website development, front-end engineering, content creation, social media management and digital marketing. Plus KR8 Academics with Next Gen Scholars — tuition-free live UTME, WAEC and NECO preparation. Verifiable certificates, zero tuition.",
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

            <p className="mt-7 max-w-md border-l-2 border-cyan/40 pl-4 text-[13px] leading-relaxed text-body">
              And now, the exam too. With our partner <span className="font-semibold text-white">Next Gen Scholars</span>,
              KR8 teaches UTME, WAEC and NECO the same way we teach craft — live, marked, and free.{" "}
              <Link to="/academics" className="inline-flex items-center gap-1 font-semibold text-cyan hover:underline">
                See KR8 Academics <ArrowUpRight size={12} />
              </Link>
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ButtonLink to="/admissions" variant="primary" size="lg" arrow>
                See how admissions work
              </ButtonLink>
              <ButtonLink to="/about" variant="ghost" size="lg">
                Read our story
              </ButtonLink>
            </div>
          </div>

          <div className="relative">
            <figure className="group relative overflow-hidden rounded-[26px] border border-white/10 shadow-[0_50px_110px_-60px_rgba(224,38,196,0.5)]">
              <img
                src="/media/why-kr8-academy.jpg"
                alt="KR8 Academy students reviewing a brand identity together during a weekly critique"
                loading="lazy"
                className="aspect-[4/5] w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.02]"
              />
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0d0015]/95 via-[#0d0015]/40 to-transparent px-5 pb-16 pt-24 text-white sm:pb-[4.5rem]">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-magenta-bright">
                  Inside KR8 Academy
                </p>
                <p className="mt-1 max-w-[26ch] font-display text-[16px] font-semibold leading-snug">
                  Live critique, real briefs, zero tuition.
                </p>
              </figcaption>
            </figure>

            <div className="relative mx-2 -mt-12 rounded-2xl border border-white/10 bg-raised p-4 shadow-2xl sm:mx-4 sm:-mt-14">
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
            eyebrow="02 — The skills"
            title="Seven crafts. One standard."
            body="Eight weeks per skill, taught live by a practitioner who ships client work — every brief, every critique, every published criterion. You leave with a portfolio you can defend and a credential anyone can check."
            align="center"
            action={
              <ButtonLink to="/skills" variant="ghost" arrow>
                See all seven skills
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
          <Link
            to="/academics"
            className="group mt-8 flex flex-col gap-3 rounded-2xl border border-cyan/25 bg-cyan/5 px-5 py-4 transition hover:border-cyan/50 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-start gap-3 sm:items-center">
              <GraduationCap size={20} className="mt-0.5 shrink-0 text-cyan sm:mt-0" />
              <span className="text-[13px] leading-snug text-body">
                <span className="font-semibold text-white">Not a craft person — or want more than a craft?</span>{" "}
                KR8 Academics: tuition-free UTME, WAEC and NECO preparation with Next Gen Scholars.
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-semibold text-cyan transition group-hover:gap-2.5">
              Explore Academics <ArrowUpRight size={13} />
            </span>
          </Link>
        </div>
      </section>


      {/* ---------------------------------------------------------------- Academics */}
      <section className="relative overflow-hidden border-b border-white/10 bg-[#070a12] py-16 sm:py-24">
        <div
          className="pointer-events-none absolute -right-24 top-10 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(56,224,255,0.14),transparent_65%)] blur-2xl"
          aria-hidden="true"
        />
        <div className="shell relative grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <p className="flex items-center gap-3">
              <span className="inline-flex h-7 items-center rounded-full border border-magenta/60 bg-magenta/15 px-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-magenta-bright">
                New
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                KR8 Academics · with Next Gen Scholars
              </span>
              <span className="h-px flex-1 bg-white/10" />
            </p>
            <h2 className="display display-lg mt-5 max-w-lg text-white">
              We didn’t stop at skills. <span className="text-cyan">Now we do results.</span>
            </h2>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-body">
              The same standard that took 772+ students from zero to verifiable now goes into the exam hall.
              With our partner <span className="font-semibold text-white">Next Gen Scholars</span>, KR8 prepares
              you tuition-free for <span className="font-semibold text-white">UTME/JAMB, WAEC and NECO</span> —
              live, three nights a week, with assignments marked in between.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["UTME / JAMB", "WAEC", "NECO"].map((exam) => (
                <span key={exam} className="rounded-full border border-cyan/35 bg-cyan/10 px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan">
                  {exam}
                </span>
              ))}
              <span className="rounded-full border border-white/12 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                every combination
              </span>
            </div>
            <ul className="mt-6 space-y-2.5 text-[13px] text-[#d8ccdf]">
              {[
                { icon: Radio, text: "Monday, Wednesday & Friday · 8–9pm WAT · starting January 2027 — join any time" },
                { icon: GraduationCap, text: "SS1 to SS3, retakers and students not writing an exam yet — all welcome" },
                { icon: Trophy, text: "Verified scores earn KR8 award tiers — Merit Scholar to Legend — on The Wall" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <Icon size={16} className="mt-0.5 shrink-0 text-cyan" />
                  {text}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink to="/academics" variant="primary" size="lg" arrow>
                Explore KR8 Academics
              </ButtonLink>
              <ButtonLink to="/apply?door=academic" variant="ghost" size="lg">
                Apply for Academics
              </ButtonLink>
            </div>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              In partnership with Next Gen Scholars · ₦0 tuition
            </p>
          </div>

          <div>
            <figure className="group relative overflow-hidden rounded-[26px] border border-cyan/20 shadow-[0_50px_110px_-60px_rgba(56,224,255,0.35)]">
              <img
                src="/media/academics-evening-class.jpg"
                alt="KR8 Academics evening class in session — students working through past questions at desks while a facilitator explains at the whiteboard"
                loading="lazy"
                className="aspect-[4/5] w-full object-cover object-[62%_center] transition-transform duration-[1200ms] group-hover:scale-[1.02]"
              />
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050a12]/95 via-[#050a12]/40 to-transparent px-5 pb-5 pt-24">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan">
                  KR8 Academics · Evening class
                </p>
                <p className="mt-1 max-w-[30ch] font-display text-[15px] font-semibold leading-snug text-white">
                  Live at 8–9pm, three nights a week — English and Maths first, always.
                </p>
              </figcaption>
            </figure>
            <Link to="/wall" className="group/wall mt-4 flex items-center justify-between gap-3 rounded-xl border border-gold/25 bg-gold/5 px-4 py-3 transition hover:border-gold/45">
              <span className="flex items-center gap-2.5">
                <Trophy size={16} className="shrink-0 text-gold" />
                <span className="text-[11.5px] leading-snug text-white/80">
                  Verified UTME distinctions live on The Wall — the public record of excellence.
                </span>
              </span>
              <ArrowUpRight size={14} className="shrink-0 text-gold transition group-hover/wall:translate-x-0.5 group-hover/wall:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Blueprint */}
      <section className="shell py-16 sm:py-24">
        <div className="panel-glow px-5 py-12 sm:px-10 sm:py-14">
          <div className="text-center">
            <p className="mx-auto flex w-fit items-center gap-3">
              <span className="h-px w-8 bg-white/15" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                04 — The blueprint
              </span>
              <span className="h-px w-8 bg-white/15" />
            </p>
            <h2 className="display display-lg mx-auto mt-5 max-w-3xl">
              Four moves. <span className="text-gradient">Two doors.</span> One standard.
            </h2>
            <p className="lede mx-auto mt-4 max-w-xl">
              The same blueprint runs both programmes — one application, one KR8 ID, live teaching, public proof.
              Pick the door that matches your ambition.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {/* Skills door */}
            <div className="rounded-2xl border border-magenta/25 bg-magenta/[0.05] p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3 border-b border-magenta/20 pb-4">
                <span className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-magenta-fill text-white">
                    <Rocket size={18} />
                  </span>
                  <span>
                    <span className="block font-display text-[16px] font-semibold text-white">The Skills door</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-magenta-bright">7 crafts · from 3 May 2027</span>
                  </span>
                </span>
                <Pill tone="magenta">Skills</Pill>
              </div>
              <ol className="mt-5 space-y-4">
                {[
                  { n: "01", t: "Apply in 3 minutes", d: "Tell us your skill and your situation. No fees, no essay gauntlet." },
                  { n: "02", t: "Claim your KR8 ID", d: "Issued the moment you’re accepted — on your dashboard, certificate and the public record." },
                  { n: "03", t: "Show up and ship", d: "Live Mon · Wed · Fri, 8–9pm WAT. Weekly briefs, honest critique, visible progress." },
                  { n: "04", t: "Graduate with proof", d: "Meet the criteria and your verifiable certificate is issued — scannable anywhere." },
                ].map((step) => (
                  <li key={step.n} className="flex items-start gap-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-magenta/35 bg-magenta/10 font-display text-[11px] font-semibold text-magenta-bright">
                      {step.n}
                    </span>
                    <span>
                      <span className="block font-display text-[14.5px] font-semibold text-white">{step.t}</span>
                      <span className="mt-1 block text-[12px] leading-relaxed text-muted">{step.d}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <Link to="/skills" className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-semibold text-magenta-bright hover:underline">
                Explore the seven skills <ArrowUpRight size={12} />
              </Link>
            </div>

            {/* Academic door */}
            <div className="rounded-2xl border border-cyan/25 bg-cyan/[0.05] p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3 border-b border-cyan/20 pb-4">
                <span className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan/90 text-[#04202a]">
                    <GraduationCap size={18} />
                  </span>
                  <span>
                    <span className="block font-display text-[16px] font-semibold text-white">The Exam door</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan">UTME · WAEC · NECO · open now</span>
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-cyan">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" /> Open
                </span>
              </div>
              <ol className="mt-5 space-y-4">
                {[
                  { n: "01", t: "Apply through the academic door", d: "Your level, your exam, your subjects. Two minutes, no fee." },
                  { n: "02", t: "Same KR8 ID", d: "One identity for both doors — craft and grades, one register." },
                  { n: "03", t: "Learn three nights a week", d: "Mon · Wed · Fri, 8–9pm WAT + marked assignments on Tue, Thu, Sat." },
                  { n: "04", t: "Sit the exam with receipts", d: "Mocks before the real paper; verified scores earn award tiers on The Wall." },
                ].map((step) => (
                  <li key={step.n} className="flex items-start gap-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-cyan/35 bg-cyan/10 font-display text-[11px] font-semibold text-cyan">
                      {step.n}
                    </span>
                    <span>
                      <span className="block font-display text-[14.5px] font-semibold text-white">{step.t}</span>
                      <span className="mt-1 block text-[12px] leading-relaxed text-muted">{step.d}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <Link to="/academics" className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-semibold text-cyan hover:underline">
                Explore KR8 Academics <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>

          <div className="mt-11 flex flex-col items-center gap-3">
            <ButtonLink to="/apply" variant="primary" size="lg" arrow>
              Start your application
            </ButtonLink>
            <p className="text-[11px] text-muted">₦0 tuition, application and certificate fees — on both doors.</p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Proof */}
      <section className="ink-panel grain relative overflow-hidden py-16 sm:py-24">
        <div className="shell relative z-10 grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow text-white/70">05 — Proof, not promises</p>
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
          eyebrow="06 — The practitioners"
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
            eyebrow="07 — Graduate stories"
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
            <SectionIndex index="08" label="For employers" />
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
            <SectionIndex index="09" label="Questions" />
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

      {/* ---------------------------------------------------------------- Partner strip */}
      <section className="shell pb-14">
        <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-gold/20 bg-gold/[0.04] p-6 sm:flex-row sm:items-center sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-gold/30 bg-gold/10">
              <Handshake size={20} className="text-gold" />
            </span>
            <span>
              <p className="font-display text-[16px] font-semibold leading-snug">
                A company, church, studio or individual who wants to build this too?
              </p>
              <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted">
                KR8 is partner-powered by design — sponsor a cohort, fund awards, bring a skill, equip the lab,
                or hire the talent. Any industry, any scale.
              </p>
            </span>
          </div>
          <ButtonLink to="/partner" variant="ghost" size="md" arrow className="shrink-0 border-gold/30 text-gold hover:border-gold/60">
            Partner with KR8
          </ButtonLink>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
