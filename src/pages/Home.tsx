import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
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
import { ButtonLink, SectionHead } from "../components/ui";
import { CtaBand, Faq, Marquee, Reveal, SectionIndex } from "../components/sections";
import { MentorCard, TestimonialWall, VerifyWidget } from "../components/showcase";
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
  const skillStatus = new Map(TRACKS.map((t) => [t.key, db.programmes.find((p) => p.key === t.key)?.status ?? "waitlist"]));

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
          className="pointer-events-none absolute -left-32 top-24 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(224,38,196,0.10),transparent_65%)] blur-2xl"
          aria-hidden="true"
        />
        <div className="shell relative grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <SectionIndex index="01" label="Why KR8 Academy" />
            <h2 className="display display-lg mt-5 max-w-[14ch]">A school built like a studio.</h2>
            <p className="lede mt-4 max-w-lg">
              Most free programmes hand you videos and hope. KR8 runs like the studios our mentors own —
              live briefs, weekly critique, deadlines that matter, and work you can show at the end.
            </p>

            <ol className="mt-9 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {PILLARS.map((pillar, index) => {
                const Icon = PILLAR_ICONS[pillar.icon];
                return (
                  <li key={pillar.title} className="border-t border-white/10 pt-4">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-magenta-bright">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <Icon size={15} className="translate-y-[1px] text-magenta-bright" aria-hidden="true" />
                      <h3 className="font-display text-[15px] font-semibold text-white">{pillar.title}</h3>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted">{pillar.body}</p>
                  </li>
                );
              })}
            </ol>

            <p className="mt-7 max-w-md border-l-2 border-cyan/40 pl-4 text-[13px] leading-relaxed text-body">
              And now the exam too — <span className="font-semibold text-white">UTME, WAEC and NECO</span>, taught
              the same way: live, marked, free.{" "}
              <Link to="/academics" className="inline-flex items-center gap-1 font-semibold text-cyan hover:underline">
                See KR8 Academics <ArrowUpRight size={12} />
              </Link>
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink to="/admissions" variant="primary" size="lg" arrow>
                See how admissions work
              </ButtonLink>
              <ButtonLink to="/about" variant="ghost" size="lg">
                Read our story
              </ButtonLink>
            </div>
          </div>

          <div className="lg:col-span-5">
            <figure className="group relative overflow-hidden rounded-[26px] border border-white/12 shadow-[0_50px_110px_-60px_rgba(224,38,196,0.55)]">
              <img
                src="/media/cohort-critique.jpg"
                alt="A KR8 facilitator guiding students through a print critique, posters spread across the worktable"
                loading="lazy"
                className="aspect-[4/5] w-full object-cover object-[42%_center] transition-transform duration-[1200ms] group-hover:scale-[1.02]"
              />
              <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 backdrop-blur-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff4d6d]" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white">Live critique</span>
              </span>
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0d0015]/90 via-[#0d0015]/35 to-transparent px-5 pb-5 pt-24">
                <p className="font-display text-[15px] font-semibold leading-snug text-white">
                  This is the room — not the lecture theatre.
                </p>
              </figcaption>
            </figure>
            <div className="mt-4 grid grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-raised text-center">
              {[
                { v: db.settings.cohortName, l: "Next cohort" },
                { v: "Mon · Wed · Fri", l: "Live, 8–9pm WAT" },
                { v: PROGRAMME.classesBeginDate, l: "Classes begin" },
              ].map((cell) => (
                <div key={cell.l} className="px-2 py-4">
                  <p className="font-display text-[13px] font-semibold leading-tight text-white sm:text-[14px]">{cell.v}</p>
                  <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">{cell.l}</p>
                </div>
              ))}
            </div>
            <Link to="/wall" className="group/wall mt-4 flex items-center justify-between gap-3 rounded-xl border border-gold/25 bg-gold/5 px-4 py-3 transition hover:border-gold/45">
              <span className="flex items-center gap-2.5">
                <Trophy size={15} className="shrink-0 text-gold" />
                <span className="text-[11.5px] leading-snug text-white/80">
                  Verified distinctions live on The Wall — the public record of excellence.
                </span>
              </span>
              <ArrowUpRight size={13} className="shrink-0 text-gold transition group-hover/wall:translate-x-0.5 group-hover/wall:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- The skills */}
      <section className="border-y border-white/10 bg-[#0a0312] py-16 sm:py-24">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="eyebrow">02 — The skills</p>
              <h2 className="display display-lg mt-4">Seven crafts. <span className="text-gradient">One standard.</span></h2>
              <p className="lede mt-4">
                Eight weeks per skill, taught live by practitioners who ship client work — every brief, every
                critique, every criterion published. Leave with defended work and a credential anyone can check.
              </p>
            </div>
            <ButtonLink to="/skills" variant="ghost" arrow>
              See all seven skills
            </ButtonLink>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:items-start">
            <ol className="border-b border-white/10">
              {TRACKS.map((track, index) => {
                const status = skillStatus.get(track.key) ?? "waitlist";
                const pill =
                  status === "open"
                    ? { text: "Open", cls: "border-live/40 bg-live/10 text-live", dot: "bg-live" }
                    : status === "waitlist"
                      ? { text: "Waitlist", cls: "border-gold/40 bg-gold/10 text-gold", dot: "bg-gold" }
                      : { text: "Closed", cls: "border-white/12 bg-white/[0.04] text-muted", dot: "bg-white/30" };
                return (
                  <li key={track.key}>
                    <Link
                      to={`/skills/${track.slug}`}
                      className="group grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-t border-white/10 px-2 py-4 transition hover:bg-white/[0.03] focus-visible:outline-none focus-visible:bg-white/[0.05] sm:grid-cols-[2.5rem_1fr_auto_auto] sm:gap-5 sm:py-5"
                    >
                      <span className="font-mono text-[11px] font-semibold text-muted transition group-hover:text-magenta-bright">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-display text-[16px] font-semibold leading-tight text-white/85 transition group-hover:text-white sm:text-[19px]">
                          {track.name}
                        </span>
                        <span className="mt-1 hidden text-[11.5px] text-muted sm:block">{track.tagline}</span>
                      </span>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] ${pill.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${pill.dot}`} />
                        {pill.text}
                      </span>
                      <ArrowRight size={16} className="hidden shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-white sm:block" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ol>

            <figure>
              <div className="group overflow-hidden rounded-2xl border border-white/12 shadow-[0_50px_110px_-60px_rgba(224,38,196,0.45)]">
                <img
                  src="/media/skills-workshop.jpg"
                  alt="A KR8 skills workshop in session — facilitator working alongside students editing and building at a shared table"
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-[1400ms] group-hover:scale-[1.03]"
                />
              </div>
              <figcaption className="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted">
                <span>Inside a live skills session — the work is the curriculum.</span>
                <span className="shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-magenta-bright">KR8 studio</span>
              </figcaption>
            </figure>
          </div>

          <Link
            to="/academics"
            className="group mt-10 flex flex-col gap-3 rounded-2xl border border-cyan/25 bg-cyan/5 px-5 py-4 transition hover:border-cyan/50 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-start gap-3 sm:items-center">
              <GraduationCap size={20} className="mt-0.5 shrink-0 text-cyan sm:mt-0" />
              <span className="text-[13px] leading-snug text-body">
                <span className="font-semibold text-white">Not a craft person — or want more than a craft?</span>{" "}
                KR8 Academics: tuition-free UTME, WAEC and NECO prep, with Next Gen Scholars.
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-semibold text-cyan transition group-hover:gap-2.5">
              Explore Academics <ArrowUpRight size={13} />
            </span>
          </Link>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Academics */}
      <section className="relative overflow-hidden border-b border-white/10">
        <img
          src="/media/academics-evclass.jpg"
          alt="A live KR8 Academics evening class — the facilitator working through WAEC past questions at the whiteboard while students write at their desks"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-[30%_center] sm:object-[34%_center] lg:object-[30%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[#05070d]/97 via-[#05070d]/80 to-[#05070d]/5" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070d]/85 via-transparent to-[#05070d]/25" aria-hidden="true" />
        <div className="shell relative py-20 sm:py-24 lg:py-28">
          <div className="ml-auto max-w-xl">
            <p className="flex items-center gap-3">
              <span className="inline-flex h-7 items-center rounded-full border border-magenta/60 bg-magenta/20 px-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-magenta-bright">
                New
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
                KR8 Academics · with Next Gen Scholars
              </span>
            </p>
            <h2 className="display display-lg mt-5 text-white">
              We didn&rsquo;t stop at skills.<br />
              <span className="text-cyan">Now we do results.</span>
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/85">
              The same standard that took 772+ students to verifiable work now goes into the exam hall —
              tuition-free, live preparation for <span className="font-semibold text-white">UTME/JAMB, WAEC and NECO</span>,
              three nights a week, assignments marked in between.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["UTME / JAMB", "WAEC", "NECO"].map((exam) => (
                <span key={exam} className="rounded-full border border-cyan/35 bg-cyan/15 px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan backdrop-blur-sm">
                  {exam}
                </span>
              ))}
              <span className="rounded-full border border-white/20 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-white/75 backdrop-blur-sm">
                every combination
              </span>
            </div>
            <ul className="mt-6 space-y-2 text-[13px] text-white/85">
              {[
                "Monday, Wednesday & Friday · 8–9pm WAT · January 2027 — join any time",
                "SS1 to SS3, retakers, and anyone not writing an exam yet — all welcome",
                "Verified scores earn KR8 UTME award tiers — on The Wall, publicly",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <Check size={15} className="mt-0.5 shrink-0 text-cyan" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/academics"
                className="inline-flex items-center gap-2 rounded-full bg-cyan px-6 py-3 text-sm font-semibold text-[#04202a] transition hover:bg-[#7decff]"
              >
                Explore KR8 Academics <ArrowRight size={16} />
              </Link>
              <ButtonLink to="/apply?door=academic" variant="light" size="lg">
                Apply for Academics
              </ButtonLink>
            </div>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">
              Delivered with Next Gen Scholars · ₦0 tuition
            </p>
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
              Both doors run the same four moves. They differ only in what you bring — and what you leave with.
            </p>
          </div>

          <ol className="mx-auto mt-12 grid max-w-5xl gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {[
              { n: "01", t: "Apply", d: "Three minutes. No fees, no essay, no gate." },
              { n: "02", t: "Claim your KR8 ID", d: "One identity — grades and craft, same register." },
              { n: "03", t: "Show up, live", d: "Mon · Wed · Fri, 8–9pm WAT, marked work in between." },
              { n: "04", t: "Proof, not promises", d: "A verifiable certificate — or a Wall-worthy score." },
            ].map((step) => (
              <li key={step.n} className="border-t border-white/12 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 lg:first:border-l-0 lg:first:pl-0">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-magenta-bright">Step {step.n}</span>
                <h3 className="mt-2 font-display text-[17px] font-semibold text-white">{step.t}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{step.d}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {/* The Skills door */}
            <div className="flex h-full flex-col rounded-2xl border border-magenta/25 bg-magenta/[0.05] p-6">
              <div className="flex items-center justify-between gap-3 border-b border-magenta/20 pb-4">
                <span className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-magenta-fill text-white">
                    <Rocket size={18} />
                  </span>
                  <span>
                    <span className="block font-display text-[15px] font-semibold text-white">The Skills door</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-magenta-bright">Seven crafts · 3 May 2027</span>
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-gold">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" /> Waitlist
                </span>
              </div>
              <ul className="mt-4 space-y-2 text-[12.5px] text-body">
                {[
                  "Eight weeks, portfolio first — every brief marked",
                  "Live Mon · Wed · Fri, 8–9pm WAT · 40 seats per skill",
                  "Graphic, video, web — plus front-end, content, social, marketing",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check size={13} className="mt-0.5 shrink-0 text-magenta-bright" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/skills" className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[12px] font-semibold text-magenta-bright hover:underline">
                Explore the seven skills <ArrowRight size={12} />
              </Link>
            </div>

            {/* The Exam door */}
            <div className="flex h-full flex-col rounded-2xl border border-cyan/25 bg-cyan/[0.05] p-6">
              <div className="flex items-center justify-between gap-3 border-b border-cyan/20 pb-4">
                <span className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan/90 text-[#04202a]">
                    <GraduationCap size={18} />
                  </span>
                  <span>
                    <span className="block font-display text-[15px] font-semibold text-white">The Exam door</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan">UTME · WAEC · NECO · Jan 2027</span>
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" /> Open
                </span>
              </div>
              <ul className="mt-4 space-y-2 text-[12.5px] text-body">
                {[
                  "English & Maths core — science or arts combination",
                  "January 2027 start · join any time · marked assignments",
                  "UTME award tiers on The Wall for verified scores",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check size={13} className="mt-0.5 shrink-0 text-cyan" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/academics" className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[12px] font-semibold text-cyan hover:underline">
                Explore KR8 Academics <ArrowRight size={12} />
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
