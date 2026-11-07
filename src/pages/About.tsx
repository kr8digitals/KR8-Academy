import { Link } from "react-router-dom";
import { ArrowUpRight, Heart, Quote, ShieldCheck, Sparkles } from "lucide-react";
import { MENTORS } from "../data/academy";
import { useDb } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { ButtonLink, Pill, SectionHead } from "../components/ui";
import { CtaBand, Marquee, Reveal, SectionIndex } from "../components/sections";
import { TestimonialWall } from "../components/showcase";

const TIMELINE = [
  { year: "2023", title: "A WhatsApp group and a promise", body: "KR8 Digitals starts teaching design and video to a handful of friends who could not afford bootcamps." },
  { year: "2024", title: "The first structured cohort", body: "The eight-week model is written down: live drills, weekly deliverables, live critique. Tuition stays at zero." },
  { year: "2025", title: "772+ students, seven skills", body: "Design, video, web, front-end, content, social and marketing cohorts run side by side under one standard." },
  { year: "2026", title: "Proof becomes public", body: "KR8 Academy launches verifiable KR8 IDs and QR-checked certificates — a credential employers can actually test." },
];

export default function About() {
  const db = useDb();

  useSeo({
    title: "About — the story behind the free school",
    description:
      "KR8 Academy is the tuition-free school of KR8 Digitals: a creative institution that has trained 772+ students across Africa — and, with partner Next Gen Scholars, now prepares students tuition-free for UTME, WAEC and NECO through KR8 Academics.",
    path: "/about",
  });

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <img
          src="/media/work-afristem.jpg"
          alt="A KR8 Digitals digital-science school session with young learners and a facilitator at a shared table"
          className="absolute inset-0 h-full w-full object-cover object-[50%_28%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07050f]/97 via-[#07050f]/80 to-[#07050f]/18" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07050f]/88 via-[#07050f]/12 to-[#07050f]/40" aria-hidden="true" />
        <div className="shell relative grid gap-10 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <SectionIndex index="About" label="Why we exist" />
            <h1 className="display display-xl mt-5 max-w-[17ch]">
              Talent is everywhere. Access is not.
            </h1>
            <p className="lede mt-5 max-w-xl">
              KR8 Academy exists because a generation of creative talent is being priced out of the skills that
              would change their lives. We removed the price. Not the standard. Not the critique. Just the price.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Pill>Founded by KR8 Digitals</Pill>
              <Pill tone="magenta">772+ students trained</Pill>
              <Pill>Nigeria · Africa · Global</Pill>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="photo-frame col-span-2 aspect-[16/9]">
              <img src="/media/work-afristem.jpg" alt="KR8 Digitals running a digital science school session" loading="lazy" />
            </div>
            <div className="photo-frame aspect-square">
              <img src="/team/founder-timfire.jpg" alt="Kenneth Timothy Iziogo, founder" />
            </div>
            <div className="photo-frame aspect-square">
              <img src="/media/p-elizabeth.jpg" alt="Elizabeth Oyejobi, a KR8 Academy graduate" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <Marquee
        tone="light"
        items={["Zero tuition", "Proof over paper", "Belong deeply", "Build for real", "Train free", "One standard"]}
      />

      <section className="shell py-16">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionIndex index="01" label="The thesis" />
            <h2 className="display display-lg mt-5 max-w-sm">A free school with a studio's standards.</h2>
          </div>
          <div className="space-y-5 text-[15px] leading-relaxed text-body">
            <p>
              Most free training fails for the same reason: nobody is accountable to anyone. Content gets
              uploaded, encouragement gets posted, and eight weeks later almost no one has a portfolio.
            </p>
            <p>
              KR8 Academy was designed backwards from the only outcome that matters — a graduate who can take a
              brief and deliver. That means live critique, a submitted deliverable every week, published
              graduation criteria, and a certificate that carries a QR code instead of a claim.
            </p>
            <p>
              The academy sits inside KR8 Digitals, which also runs a community (the Tribe) and a paid agency.
              That structure is what keeps tuition at zero: the agency funds the school, and the school feeds the
              agency with vetted talent.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "The Academy", link: "/skills", note: "Free, cohort-based training" },
                { label: "The Tribe", link: "https://www.kr8digitals.com/tribe", note: "An unbroken creative family" },
                { label: "The Agency", link: db.settings.agencyUrl, note: "Graduate-powered client work" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.link}
                  target={item.link.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="group rounded-xl border border-white/10 bg-raised p-4 transition hover:border-magenta/40"
                >
                  <p className="flex items-center gap-1 text-[13px] font-semibold">
                    {item.label} <ArrowUpRight size={12} className="opacity-40 transition group-hover:opacity-100" />
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">{item.note}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-raised py-16">
        <div className="shell">
          <SectionHead eyebrow="02 — The timeline" title="How a promise became an institution." />
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {TIMELINE.map((item, index) => (
              <Reveal key={item.year} delay={index * 60}>
                <div className="relative h-full rounded-2xl border border-white/10 bg-raised p-5">
                  <span className="font-mono text-[11px] text-muted">{item.year}</span>
                  <h3 className="mt-3 font-display text-[15px] font-semibold leading-snug">{item.title}</h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="shell py-16">
        <SectionHead
          eyebrow="03 — The people"
          title="Founder-led, studio-run."
          body="KR8 Academy is run by the founders of KR8 Digitals and a small faculty of working practitioners."
          action={<ButtonLink to="/mentors" variant="ghost" arrow>Meet the faculty</ButtonLink>}
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="photo-frame aspect-[4/5] max-w-sm">
            <img src="/team/founder-timfire.jpg" alt="Kenneth Timothy Iziogo (Timfire), founder of KR8 Digitals" />
          </div>
          <div>
            <Quote size={22} className="text-magenta-bright" />
            <blockquote className="mt-4 display display-md max-w-xl">
              “If the only thing standing between you and a creative career is money, then money should not be
              the answer.”
            </blockquote>
            <p className="mt-4 text-[13px] font-semibold">{MENTORS[0].name}</p>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted">{MENTORS[0].title}</p>
            <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-muted">{MENTORS[0].bio}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {MENTORS.slice(1, 5).map((mentor) => (
                <div key={mentor.key} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <img
                    src={mentor.photo}
                    alt={mentor.name}
                    loading="lazy"
                    className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-white/15"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold text-white">{mentor.shortName}</p>
                    <p className="truncate text-[10px] uppercase tracking-[0.1em] text-muted">{mentor.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-[12px] text-muted">
                <Heart size={14} className="text-magenta-bright" /> Tuition-free since day one
              </div>
              <div className="flex items-center gap-2 text-[12px] text-muted">
                <ShieldCheck size={14} className="text-magenta-bright" /> Verifiable certificates
              </div>
              <div className="flex items-center gap-2 text-[12px] text-muted">
                <Sparkles size={14} className="text-gold" /> 7 active skills
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell pb-16">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-cyan/25 bg-[#0b111c] p-6 sm:flex-row sm:items-center sm:p-7">
          <div>
            <p className="eyebrow text-cyan">Powered by partners</p>
            <h2 className="display display-md mt-3 max-w-md text-white">KR8 does not do it alone — that is the point.</h2>
            <p className="mt-3 max-w-md text-[13px] leading-relaxed text-white/70">
              KR8 Academics — tuition-free UTME, WAEC and NECO preparation — is delivered with our partner
              <span className="font-semibold text-white"> Next Gen Scholars</span>. This is how the academy stays free:
              institutions and individuals who believe in the mission build it with us.
            </p>
          </div>
          <ButtonLink to="/partner" variant="ghost" size="md" arrow className="shrink-0 border-cyan/30 text-cyan hover:border-cyan/60">
            Become a partner
          </ButtonLink>
        </div>
      </section>

      <section className="shell pb-16">
        <SectionHead eyebrow="05 — Values" title="Four rules we do not break." />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            { title: "Free is not a promotion", body: "It is the model. There is no hidden upsell to graduate, and no certificate ransom at the end." },
            { title: "Feedback is the product", body: "Anyone can hand out lessons. We hand out critique — specific, written, and attached to your work." },
            { title: "Proof beats promises", body: "Every claim we make about a graduate is checkable: portfolio, KR8 ID, certificate, verification page." },
            { title: "Nobody grows alone", body: "Cohorts, not courses. The people beside you are part of the curriculum." },
          ].map((value, index) => (
            <Reveal key={value.title} delay={index * 50}>
              <div className="card flex h-full gap-4 p-5">
                <span className="font-display text-2xl font-semibold text-muted-2/70">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-display text-[15px] font-semibold">{value.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{value.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-raised py-16">
        <div className="shell">
          <SectionHead
            eyebrow="05 — Voices"
            title="The only review that matters."
            body="Graduates, in their own words. Real footage recorded after real cohorts."
          />
          <div className="mt-10">
            <TestimonialWall limit={6} />
          </div>
          <div className="mt-8">
            <Link to="/verify" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-magenta-bright">
              Check a graduate's credential yourself <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      <CtaBand
        title="Be part of the next 772."
        body="The next cohort is forming now. One application, eight weeks, zero tuition."
        primaryLabel="Apply free"
        secondaryLabel="Explore the skills"
        secondaryTo="/skills"
      />
    </>
  );
}
