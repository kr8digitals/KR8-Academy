import { Link } from "react-router-dom";
import { CalendarClock, Check, Clock, GraduationCap, Laptop, Mail, MapPin, Users, X } from "lucide-react";
import { ADMISSION_STEPS, TRACKS } from "../data/academy";
import { useDb } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { addDays, daysRemaining, formatDate } from "../lib/utils";
import { ButtonLink, Pill, SectionHead } from "../components/ui";
import { CtaBand, Countdown, Faq, Reveal, SectionIndex, StickyToc } from "../components/sections";

const FAQS = [
  { q: "Who can apply?", a: "Anyone 16 or older with a laptop or capable phone and 6–8 hours a week. We do not screen for grades, certificates or portfolio — most students arrive with none." },
  { q: "Is there an application fee?", a: "No. There is no application fee, no tuition, no exam fee and no certificate fee. If anyone asks you to pay for a KR8 Academy seat, report it to academy@kr8digitals.com immediately." },
  { q: "How are seats allocated?", a: "Applications are reviewed in the order received, with priority for people who can attend the live Monday, Wednesday and Friday classes. Each track has 40 seats." },
  { q: "What if I am not accepted this cohort?", a: "You keep your application on file. We release waitlist seats when accepted students do not confirm within 72 hours, and you are prioritised for the next cohort." },
  { q: "Can I switch tracks?", a: "Yes — once, before the first assignment is due. After week two you are committed so the cohort critique stays stable." },
  { q: "Do I need to be in Nigeria?", a: "No. Classes run 8:00–9:00pm WAT, which works across Africa, the UK and Europe. Students in the Americas usually catch the recordings." },
  { q: "I want exam prep, not a creative track — what should I do?", a: "Take the academic door: KR8 Academics, delivered with Next Gen Scholars, is tuition-free live preparation for UTME/JAMB, WAEC and NECO — Monday, Wednesday and Friday, 8–9pm WAT, starting January 2027, open to SS1, SS3, retakers and students not writing an exam yet. See /academics, or apply through the academic option on the application page." },
];

const TOC = [
  { id: "doors", label: "Two doors" },
  { id: "process", label: "The process" },
  { id: "dates", label: "Dates & deadlines" },
  { id: "cost", label: "What it costs" },
  { id: "requirements", label: "Requirements" },
  { id: "faq", label: "Questions" },
];

export default function Admissions() {
  const db = useDb();
  const days = daysRemaining(addDays(db.settings.cohortStart, -1).toISOString());

  useSeo({
    title: "Admissions — apply to the free cohort",
    description:
      "How KR8 Academy admissions work — both doors: seven tuition-free digital-skill cohorts (waitlist opens March–April 2027) and KR8 Academics with Next Gen Scholars (open now — tuition-free live UTME, WAEC and NECO preparation from January 2027). Zero tuition, zero fees.",
    path: "/admissions",
  });

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 starfield opacity-70" aria-hidden="true" />
        <div className="shell relative py-12 sm:py-16">
          <SectionIndex index="Admissions" label={db.settings.cohortName} />
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="display display-xl max-w-[15ch]">
                {db.settings.registrationOpen ? "Your seat is free. Take it." : "Join the waitlist."}
              </h1>
              <p className="lede mt-5 max-w-xl">
                Three minutes to apply. Eight weeks to build something real. The only thing we ask for is that
                you show up.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <ButtonLink to="/apply" variant="primary" size="lg" arrow>
                  {db.settings.registrationOpen ? "Start my application" : "Join the waitlist"}
                </ButtonLink>
                <ButtonLink href={db.settings.whatsappUrl} variant="ghost" size="lg">
                  Ask a question
                </ButtonLink>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Pill tone="live">{db.settings.cohortName}</Pill>
                <Pill>Onboarding {formatDate(addDays(db.settings.cohortStart, -1), { day: "numeric", month: "long", year: "numeric" })}</Pill>
                <Pill>40 seats / track</Pill>
              </div>
            </div>

            <div className="ink-panel rounded-2xl p-6">
              <div className="flex items-center gap-2 text-white/60">
                <CalendarClock size={14} />
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Onboarding countdown</p>
              </div>
              <p className="mt-3 font-display text-2xl font-semibold text-white">
                {days > 0 ? `${days} days to go` : "Onboarding is live"}
              </p>
              <div className="mt-4">
                <Countdown to={addDays(db.settings.cohortStart, -1).toISOString()} />
              </div>
              <div className="mt-5 space-y-2.5 border-t border-white/12 pt-4 text-[12px]">
                <p className="flex items-center justify-between text-white/60">
                  <span>Applications close</span>
                  <span className="font-semibold text-white">{formatDate(db.settings.applicationDeadline)}</span>
                </p>
                <p className="flex items-center justify-between text-white/60">
                  <span>Decision window</span>
                  <span className="font-semibold text-white">48 hours</span>
                </p>
                <p className="flex items-center justify-between text-white/60">
                  <span>Fee to accept</span>
                  <span className="font-semibold text-white">₦0.00</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ————— Two doors ————— */}
      <section id="doors" className="shell scroll-mt-28 pt-12">
        <SectionHead
          eyebrow="Two doors, one standard"
          title="Pick the door that matches your ambition."
          body="Both are ₦0 tuition. Both end in proof. Both are the same school."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="flex h-full flex-col rounded-2xl border border-white/12 bg-raised p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                <Laptop size={13} /> Door 1 — Digital skills
              </span>
              <span className="rounded-full border border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                {db.settings.registrationOpen ? "Registration open" : "Waitlist opens Mar–Apr 2027"}
              </span>
            </div>
            <h3 className="mt-4 font-display text-[22px] font-semibold leading-tight">The seven craft cohorts</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Eight weeks, one of seven tracks — design, video, web, front-end, content, social or marketing.
              Live classes, weekly briefs, a portfolio you can defend.
            </p>
            <ul className="mt-4 space-y-2 text-[12px] text-body">
              <li className="flex items-start gap-2"><Check size={13} className="mt-0.5 shrink-0 text-magenta-bright" /> Classes begin 3 May 2027 · Mon · Wed · Fri · 8:00–9:00pm WAT</li>
              <li className="flex items-start gap-2"><Check size={13} className="mt-0.5 shrink-0 text-magenta-bright" /> 40 seats per track · reviewed in order of application</li>
              <li className="flex items-start gap-2"><Check size={13} className="mt-0.5 shrink-0 text-magenta-bright" /> {db.settings.registrationOpen ? "Applications reviewed in order of receipt" : "Waitlist members get a priority window before the public doors open"}</li>
            </ul>
            <div className="mt-6 flex-1" />
            <ButtonLink to="/apply?door=skill" variant="ghost" size="lg" arrow full className="mt-4">
              {db.settings.registrationOpen ? "Apply to a skills track" : "Join the skills waitlist"}
            </ButtonLink>
          </div>

          <div className="relative flex h-full flex-col rounded-2xl border border-cyan/30 bg-[#0b111c] p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan">
                <GraduationCap size={13} /> Door 2 — KR8 Academics
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-cyan">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" /> Open now
              </span>
            </div>
            <h3 className="mt-4 font-display text-[22px] font-semibold leading-tight">
              UTME · WAEC · NECO — tuition-free
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              With <span className="text-white">Next Gen Scholars</span>: live exam preparation three nights a week,
              assignments in between, and awards on The Wall for verified scores. SS1 to retakers.
            </p>
            <ul className="mt-4 space-y-2 text-[12px] text-body">
              <li className="flex items-start gap-2"><Check size={13} className="mt-0.5 shrink-0 text-cyan" /> Starts January 2027 — and join any time after</li>
              <li className="flex items-start gap-2"><Check size={13} className="mt-0.5 shrink-0 text-cyan" /> Mon · Wed · Fri · 8:00–9:00pm WAT · recordings included</li>
              <li className="flex items-start gap-2"><Check size={13} className="mt-0.5 shrink-0 text-cyan" /> KR8 UTME Merit Scholar → Legend award tiers for verified scores</li>
            </ul>
            <div className="mt-6 flex-1" />
            <ButtonLink to="/apply?door=academic" variant="primary" size="lg" arrow full className="mt-4">
              Apply for Academics — free
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="shell flex gap-12 py-12">
        <StickyToc items={TOC} />
        <div className="min-w-0 flex-1">
          <section id="process" className="scroll-mt-28">
            <SectionHead eyebrow="01 — The process" title="Four steps, no gauntlet." />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {ADMISSION_STEPS.map((step, index) => (
                <Reveal key={step.step} delay={index * 50}>
                  <div className="card flex h-full gap-4 p-5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-magenta-fill font-display text-[12px] font-semibold text-white">
                      {step.step}
                    </span>
                    <div>
                      <h3 className="font-display text-[15px] font-semibold">{step.title}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{step.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          <section id="dates" className="mt-14 scroll-mt-28">
            <SectionHead eyebrow="02 — Dates" title="The cohort calendar." />
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-raised">
              {[
                { label: "Applications open", value: "Now", icon: Check },
                { label: "Applications close", value: formatDate(db.settings.applicationDeadline), icon: Clock },
                { label: "Decisions sent", value: "Within 48 hours of applying", icon: Mail },
                { label: "Onboarding", value: formatDate(addDays(db.settings.cohortStart, -1), { weekday: "long", day: "numeric", month: "long", year: "numeric" }), icon: MapPin },
                { label: "Classes begin", value: formatDate(db.settings.cohortStart, { weekday: "long", day: "numeric", month: "long", year: "numeric" }), icon: GraduationCap },
                { label: "Live classes", value: "Mon, Wed & Fri · 8:00–9:00pm WAT", icon: CalendarClock },
                { label: "Graduation", value: formatDate(new Date(new Date(db.settings.cohortStart).getTime() + 56 * 86400000), { day: "numeric", month: "long", year: "numeric" }), icon: GraduationCap },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center gap-3 border-b border-white/8 px-4 py-3.5 last:border-0 sm:px-5">
                    <Icon size={15} className="shrink-0 text-magenta-bright" />
                    <span className="text-[13px] text-muted">{row.label}</span>
                    <span className="ml-auto text-right text-[13px] font-medium">{row.value}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="cost" className="mt-14 scroll-mt-28">
            <SectionHead eyebrow="03 — Cost" title="What it costs. And what it doesn't." />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="card relative p-5">
                <span
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-live/60 to-transparent"
                  aria-hidden="true"
                />
                <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-live">
                  <span className="h-1.5 w-1.5 rounded-full bg-live" aria-hidden="true" />
                  Included, free
                </p>
                <ul className="mt-3 space-y-2">
                  {["All 8 weeks of live teaching", "Weekly assignment reviews", "Dashboard + KR8 ID", "Certificate (PDF + PNG)", "Public verification page", "Tribe community access"].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] leading-relaxed text-body">
                      <Check size={13} className="mt-[3px] shrink-0 text-live" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card relative p-5">
                <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-2" aria-hidden="true" />
                  Not included
                </p>
                <ul className="mt-3 space-y-2">
                  {["Paid software subscriptions (free tiers exist)", "Data / internet costs", "Hardware — bring your own device", "Optional 1-on-1 coaching (separate, paid)"].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] leading-relaxed text-muted">
                      <X size={13} className="mt-[3px] shrink-0 text-muted-2/70" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[11px] leading-relaxed text-muted">
                  KR8 Academy is funded by the KR8 Digitals agency. Tuition is not a marketing discount — it is
                  the model.
                </p>
              </div>
            </div>
          </section>

          <section id="requirements" className="mt-14 scroll-mt-28">
            <SectionHead eyebrow="04 — Requirements" title="What you actually need." />
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { title: "A device", body: "A laptop is ideal. A capable Android or iPhone works for the content and SMM tracks.", icon: Users },
                { title: "8 weeks, 2 levels", body: "Weeks 1–4 are beginner, weeks 5–8 are advanced. Classes hold Monday, Wednesday and Friday, 8–9pm WAT.", icon: Clock },
                { title: "A written goal", body: "One or two sentences about what you want to do with the skill. That is the whole application.", icon: GraduationCap },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="card p-5">
                    <Icon size={17} className="text-magenta-bright" />
                    <h3 className="mt-3 font-display text-[15px] font-semibold">{item.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{item.body}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {TRACKS.map((track) => (
                <Link
                  key={track.key}
                  to={`/apply?track=${track.key}`}
                  className="rounded-full border border-white/15 bg-raised px-3 py-1.5 text-[12px] font-medium transition hover:border-magenta/50 hover:text-magenta-bright"
                >
                  {track.name}
                </Link>
              ))}
            </div>
          </section>

          <section id="faq" className="mt-14 scroll-mt-28">
            <SectionHead eyebrow="05 — Questions" title="Before you apply." />
            <div className="mt-6">
              <Faq items={FAQS} />
            </div>
          </section>
        </div>
      </div>

      <CtaBand
        title="The only thing left is the application."
        body="It takes about three minutes. You will know your KR8 ID before the day ends."
        primaryLabel="Apply free"
        secondaryLabel="See the tracks"
        secondaryTo="/tracks"
      />
    </>
  );
}
