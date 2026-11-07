import { Link } from "react-router-dom";
import {
  CalendarClock,
  Check,
  Clock,
  GraduationCap,
  Laptop,
  Mail,
  MapPin,
} from "lucide-react";
import { ADMISSION_STEPS, TRACKS } from "../data/academy";
import { useDb } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { addDays, daysRemaining, formatDate, cn } from "../lib/utils";
import { ButtonLink, Pill, SectionHead } from "../components/ui";
import { Countdown, Faq, Reveal, SectionIndex, StickyToc } from "../components/sections";
import type { ProgrammeStatus } from "../lib/types";

const SKILL_STEPS = ADMISSION_STEPS;

const ACADEMIC_STEPS = [
  { step: "01", title: "Apply in 2 minutes", body: "Tell us your level, your exam and your subject combination. No fees, no tests, no gate." },
  { step: "02", title: "Claim your KR8 ID", body: "One identity for both doors — your academic register and your skill record, unified." },
  { step: "03", title: "Join in January", body: "Training starts in January 2027 — and students may join any time after. Live, not recorded-only." },
  { step: "04", title: "Sit the exam with receipts", body: "Mocks, marking and clinics through the final weeks. Verified scores earn award tiers on The Wall." },
];

const FAQS = [
  { q: "Who can apply?", a: "Anyone 16 or older for the skills door (with a laptop or capable phone and 6–8 hours a week). For the academic door: SS1 through graduates — and students not writing an exam yet. We do not screen for grades, certificates or portfolio on either door." },
  { q: "Is there an application fee?", a: "No — on either door. There is no application fee, no tuition, no exam fee and no certificate fee. If anyone asks you to pay for a KR8 seat or place, report it to academy@kr8digitals.com immediately." },
  { q: "Which door should I choose?", a: "Want to get paid for a craft? Skills door. Preparing for UTME/JAMB, WAEC or NECO — or want to think better before you sit anything? Academic door. Want both? Choose both at application; we will help you pick a realistic rhythm." },
  { q: "How are seats allocated?", a: "Skills: applications are reviewed in the order received, with priority for people who can attend the live Monday, Wednesday and Friday classes. Each skill has 40 seats; this intake covers graphic design, video editing and website development, with other skills returning in later intakes." },
  { q: "What if I am not accepted this cohort?", a: "You keep your application on file. Waitlist seats are released when accepted students do not confirm within 72 hours, and you are prioritised for the next intake. Academic applicants have no such cut-off — registration is continuous." },
  { q: "Can I switch doors or skills?", a: "Yes — once, before the first assignment is due. After week two you are committed so the cohort critique stays stable. Switching between doors is even easier: just tell us before your classes begin." },
  { q: "Do I need to be in Nigeria?", a: "No. Classes run 8:00–9:00pm WAT, which works across Africa, the UK and Europe. Students in the Americas usually catch the recordings. Academic classes follow the same clock." },
  { q: "I want exam prep, not a craft skill — what should I do?", a: "Take the academic door: KR8 Academics, delivered with Next Gen Scholars, is tuition-free live preparation for UTME/JAMB, WAEC and NECO — Monday, Wednesday and Friday, 8–9pm WAT, starting January 2027, open to SS1, SS3, retakers and students not writing an exam yet. See /academics, or pick Academics at application." },
];

const TOC = [
  { id: "doors", label: "The status board" },
  { id: "process", label: "The process" },
  { id: "dates", label: "Dates & deadlines" },
  { id: "cost", label: "What it costs" },
  { id: "requirements", label: "Requirements" },
  { id: "faq", label: "Questions" },
];

function StatusPill({ status }: { status: ProgrammeStatus }) {
  const map: Record<ProgrammeStatus, { label: string; cls: string; dot: string }> = {
    open: { label: "Open", cls: "border-live/40 bg-live/10 text-live", dot: "bg-live" },
    waitlist: { label: "Waitlist", cls: "border-gold/40 bg-gold/10 text-gold", dot: "bg-gold" },
    closed: { label: "Closed", cls: "border-white/15 bg-white/[0.04] text-muted", dot: "bg-white/30" },
  };
  const t = map[status];
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em]", t.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", t.dot, status === "open" && "animate-pulse")} />
      {t.label}
    </span>
  );
}

export default function Admissions() {
  const db = useDb();
  const days = daysRemaining(addDays(db.settings.cohortStart, -1).toISOString());
  const programmeFor = (key: string) => db.programmes.find((programme) => programme.key === key);
  const academicProgramme = programmeFor("academic");
  const skillsWaitlist = TRACKS.filter((t) => programmeFor(t.key)?.status === "waitlist");
  const skillsOpen = TRACKS.filter((t) => programmeFor(t.key)?.status === "open");
  const skillsClosed = TRACKS.filter((t) => programmeFor(t.key)?.status === "closed");
  const skillsStatus: ProgrammeStatus = skillsOpen.length > 0 ? "open" : skillsWaitlist.length > 0 ? "waitlist" : "closed";
  const skillsStatusLabel = skillsStatus === "open" ? "Open now" : skillsStatus === "waitlist" ? "Waitlist — opens March–April 2027" : "Closed";

  useSeo({
    title: "Admissions — one page, two doors, zero fees",
    description:
      "Register for KR8 Academy — both doors, one page: seven tuition-free digital-skill cohorts (status shown per skill) and KR8 Academics with Next Gen Scholars (open now — tuition-free live UTME, WAEC and NECO preparation from January 2027). Zero tuition, zero fees.",
    path: "/admissions",
  });

  return (
    <>
      {/* ————————————— Hero + live status board ————————————— */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 starfield opacity-70" aria-hidden="true" />
        <div className="shell relative py-12 sm:py-16">
          <SectionIndex index="Admissions" label="Two doors, one standard" />
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <h1 className="display display-xl max-w-[15ch]">
                Two doors. One school. Zero fees.
              </h1>
              <p className="lede mt-5 max-w-xl">
                Skills or exams — it is the same academy, the same live-class standard and the same verifiable
                KR8 ID. Here is the status of each door right now, so you can decide in one minute.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <ButtonLink to="/apply" variant="primary" size="lg" arrow>
                  Start my application
                </ButtonLink>
                <ButtonLink href={db.settings.whatsappUrl} variant="ghost" size="lg">
                  Ask a question
                </ButtonLink>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Pill>₦0 tuition</Pill>
                <Pill>Live, three nights a week</Pill>
                <Pill>Verifiable KR8 ID</Pill>
              </div>
            </div>

            {/* Live status panel */}
            <div className="ink-panel rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-white/60">
                  <CalendarClock size={14} />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Status right now</p>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">Live register</span>
              </div>
              <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
                <div className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-display text-[15px] font-semibold text-white">KR8 Academics</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-white/60">Next Gen Scholars · starts January 2027 · join any time</p>
                  </div>
                  <StatusPill status={academicProgramme?.status ?? "open"} />
                </div>
                <div className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-display text-[15px] font-semibold text-white">Digital skills</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-white/60">
                      {db.settings.cohortName} · full registration opens around March–April 2027
                    </p>
                  </div>
                  <StatusPill status={skillsStatus} />
                </div>
              </div>
              <p className="mt-4 font-display text-lg font-semibold text-white">
                {days > 0 ? `${days} days to skills onboarding` : "Skills onboarding is live"}
              </p>
              <div className="mt-3">
                <Countdown to={addDays(db.settings.cohortStart, -1).toISOString()} />
              </div>
              <div className="mt-4 space-y-2 border-t border-white/12 pt-4 text-[12px] text-white/60">
                <p className="flex items-center justify-between">
                  <span>Skills classes begin</span>
                  <span className="font-semibold text-white">{formatDate(db.settings.cohortStart)}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Academic registration</span>
                  <span className="font-semibold text-white">Open — join any time</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Fee to accept</span>
                  <span className="font-semibold text-white">₦0.00</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ————————————— 01 — The status board ————————————— */}
      <section id="doors" className="shell scroll-mt-28 pt-12">
        <SectionHead
          eyebrow="01 — The status board"
          title="Both doors, every skill, live status."
          body="This is the actual register, not a brochure. If a skill is not open this intake, it says so — and the waitlist is the priority lane."
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* Door 1 — Skills */}
          <div className="flex h-full flex-col rounded-2xl border border-white/12 bg-raised p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                <Laptop size={13} /> Door 1 — Digital skills
              </span>
              <StatusPill status={skillsStatus} />
            </div>
            <h2 className="mt-4 font-display text-[22px] font-semibold leading-tight">The seven craft skills</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Eight weeks each — live classes, weekly briefs, a portfolio you can defend. This intake:
            </p>
            <ul className="mt-4 divide-y divide-white/8 border-y border-white/8">
              {TRACKS.map((track) => {
                const programme = programmeFor(track.key);
                const status = programme?.status ?? "closed";
                return (
                  <li key={track.key} className="flex items-center justify-between gap-4 py-2.5">
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-body">{track.name}</span>
                      {programme?.note && status !== "open" && (
                        <span className="mt-0.5 hidden text-[10.5px] text-muted sm:block">{programme.note.split(".")[0]}.</span>
                      )}
                    </span>
                    <StatusPill status={status} />
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 rounded-xl border border-gold/25 bg-gold/5 px-4 py-3 text-[11px] leading-relaxed text-gold">
              Waitlist priority: join now and you get a 72-hour head start before the public doors open in March–April 2027.
            </div>
            <div className="mt-auto pt-5">
              <ButtonLink to="/apply?door=skill" variant="ghost" size="lg" arrow full>
                {skillsOpen.length > 0 ? "Apply to a skill" : "Join the skills waitlist"}
              </ButtonLink>
            </div>
          </div>

          {/* Door 2 — Academics */}
          <div className="relative flex h-full flex-col rounded-2xl border border-cyan/30 bg-[#0b111c] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan">
                <GraduationCap size={13} /> Door 2 — KR8 Academics
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" /> Open now
              </span>
            </div>
            <h2 className="mt-4 font-display text-[22px] font-semibold leading-tight">UTME · WAEC · NECO — tuition-free</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              With <span className="text-white">Next Gen Scholars</span>: live exam preparation three nights a week,
              assignments marked in between, and award tiers on The Wall for verified scores. Open to SS1 through
              graduates — and to anyone not writing an exam yet.
            </p>
            <ul className="mt-4 space-y-2 text-[12px] text-body">
              <li className="flex items-start gap-2"><Check size={13} className="mt-0.5 shrink-0 text-cyan" /> Training starts January 2027 — register now, join any time</li>
              <li className="flex items-start gap-2"><Check size={13} className="mt-0.5 shrink-0 text-cyan" /> Mon · Wed · Fri · 8:00–9:00pm WAT · assignments Tue, Thu, Sat</li>
              <li className="flex items-start gap-2"><Check size={13} className="mt-0.5 shrink-0 text-cyan" /> English + Mathematics core · science or arts combination</li>
              <li className="flex items-start gap-2"><Check size={13} className="mt-0.5 shrink-0 text-cyan" /> KR8 UTME award tiers for verified scores — Merit Scholar to Legend</li>
            </ul>
            <Link
              to="/apply?door=academic"
              className="group relative mt-5 block overflow-hidden rounded-xl border border-cyan/20"
            >
              <img
                src="/media/academics-evclass.jpg"
                alt="KR8 Academics evening class — students working through past questions while a facilitator explains at the whiteboard"
                loading="lazy"
                className="aspect-[16/8] w-full object-cover object-[28%_18%] transition-transform duration-[1200ms] group-hover:scale-[1.03]"
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050a12]/90 via-[#050a12]/25 to-transparent" />
              <span className="pointer-events-none absolute bottom-2 left-3 font-mono text-[9px] uppercase tracking-[0.18em] text-cyan">
                Evening class · live · Next Gen Scholars
              </span>
            </Link>
            <div className="mt-auto pt-5">
              <ButtonLink to="/apply?door=academic" variant="primary" size="lg" arrow full>
                Apply for Academics — free
              </ButtonLink>
              <Link to="/academics" className="mt-2 block text-center text-[11.5px] font-medium text-cyan hover:underline">
                Full details on the KR8 Academics page →
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-4 text-[11px] text-muted">
          {skillsWaitlist.length} of the seven skills are on waitlist this intake{skillsClosed.length > 0 ? `; ${skillsClosed.length} return in later intakes` : ""}. Academic seats are not capped per intake — registration is continuous.
        </p>
      </section>

      <div className="shell flex gap-12 py-12">
        <StickyToc items={TOC} />
        <div className="min-w-0 flex-1">
          {/* ————————————— 02 — Process (both doors) ————————————— */}
          <section id="process" className="scroll-mt-28">
            <SectionHead eyebrow="02 — The process" title="Four steps on either door." />
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {[
                { label: "The skills door", tone: "magenta" as const, steps: SKILL_STEPS },
                { label: "The academic door", tone: "cyan" as const, steps: ACADEMIC_STEPS },
              ].map((door) => (
                <div key={door.label} className={cn("rounded-2xl border p-5", door.tone === "magenta" ? "border-magenta/25 bg-magenta/[0.04]" : "border-cyan/25 bg-cyan/[0.04]")}>
                  <p className={cn("font-mono text-[10px] font-semibold uppercase tracking-[0.18em]", door.tone === "magenta" ? "text-magenta-bright" : "text-cyan")}>
                    {door.label}
                  </p>
                  <ol className="mt-4 space-y-4">
                    {door.steps.map((step, index) => (
                      <Reveal key={step.step} delay={index * 50}>
                        <li className="flex items-start gap-3">
                          <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-[10.5px] font-semibold", door.tone === "magenta" ? "bg-magenta-fill text-white" : "bg-cyan/90 text-[#04202a]")}>
                            {step.step}
                          </span>
                          <span>
                            <span className="block font-display text-[13.5px] font-semibold">{step.title}</span>
                            <span className="mt-1 block text-[11.5px] leading-relaxed text-muted">{step.body}</span>
                          </span>
                        </li>
                      </Reveal>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>

          {/* ————————————— 03 — Dates (both doors) ————————————— */}
          <section id="dates" className="mt-14 scroll-mt-28">
            <SectionHead eyebrow="03 — Dates" title="Two calendars, side by side." />
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-raised">
                <p className="border-b border-white/8 bg-raised/60 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-magenta-bright">
                  Skills — {db.settings.cohortName}
                </p>
                {[
                  { label: "Applications", value: skillsStatusLabel, icon: Check },
                  { label: "Applications close", value: formatDate(db.settings.applicationDeadline), icon: Clock },
                  { label: "Decisions sent", value: "Within 48 hours of applying", icon: Mail },
                  { label: "Onboarding", value: formatDate(addDays(db.settings.cohortStart, -1), { weekday: "long", day: "numeric", month: "long", year: "numeric" }), icon: MapPin },
                  { label: "Classes begin", value: formatDate(db.settings.cohortStart, { weekday: "long", day: "numeric", month: "long", year: "numeric" }), icon: GraduationCap },
                  { label: "Live classes", value: "Mon, Wed & Fri · 8:00–9:00pm WAT", icon: CalendarClock },
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
              <div className="overflow-hidden rounded-2xl border border-cyan/20 bg-[#0b111c]">
                <p className="border-b border-white/8 bg-cyan/5 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan">
                  Academics — January 2027
                </p>
                {[
                  { label: "Registration", value: "Open now — join any time", icon: Check },
                  { label: "Training starts", value: "January 2027", icon: GraduationCap },
                  { label: "Late joiners", value: "Welcome — classes are live and recorded", icon: CalendarClock },
                  { label: "Live classes", value: "Mon, Wed & Fri · 8:00–9:00pm WAT", icon: CalendarClock },
                  { label: "Assignments", value: "Tue, Thu & Sat — marked, not just collected", icon: Check },
                  { label: "Mocks & marking", value: "Weeks before your paper — UTME, WAEC, NECO", icon: Clock },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.label} className="flex items-center gap-3 border-b border-white/8 px-4 py-3.5 last:border-0 sm:px-5">
                      <Icon size={15} className="shrink-0 text-cyan" />
                      <span className="text-[13px] text-muted">{row.label}</span>
                      <span className="ml-auto text-right text-[13px] font-medium">{row.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ————————————— 04 — Cost ————————————— */}
          <section id="cost" className="mt-14 scroll-mt-28">
            <SectionHead eyebrow="04 — Cost" title="What it costs. On both doors, nothing." />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="card relative p-5">
                <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-live/60 to-transparent" aria-hidden="true" />
                <p className="eyebrow">Skills door</p>
                <p className="mt-2 font-display text-2xl font-semibold text-live">₦0.00</p>
                <ul className="mt-3 space-y-1.5 text-[12px] text-body">
                  {["No application fee", "No tuition", "No graduation fee", "No certificate fee"].map((t) => (
                    <li key={t} className="flex items-center gap-2"><Check size={12} className="shrink-0 text-live" />{t}</li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] leading-relaxed text-muted">Funded by the KR8 agency and our partners — never by you.</p>
              </div>
              <div className="card relative p-5">
                <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/60 to-transparent" aria-hidden="true" />
                <p className="eyebrow text-cyan">Academic door</p>
                <p className="mt-2 font-display text-2xl font-semibold text-live">₦0.00</p>
                <ul className="mt-3 space-y-1.5 text-[12px] text-body">
                  {["No registration fee", "No tuition", "No exam-fee contribution", "Awards are earned — never bought"].map((t) => (
                    <li key={t} className="flex items-center gap-2"><Check size={12} className="shrink-0 text-cyan" />{t}</li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] leading-relaxed text-muted">Delivered with Next Gen Scholars — funded by the agency and our partners.</p>
              </div>
            </div>
          </section>

          {/* ————————————— 05 — Requirements ————————————— */}
          <section id="requirements" className="mt-14 scroll-mt-28">
            <SectionHead eyebrow="05 — Requirements" title="What you actually need." />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-raised p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-magenta-bright">Skills door</p>
                <ul className="mt-3 space-y-2 text-[12px] text-body">
                  {["16 or older", "A laptop or a capable phone", "A stable internet connection", "6–8 hours a week", "No portfolio, no experience — we start from zero"].map((t) => (
                    <li key={t} className="flex items-start gap-2"><Check size={12} className="mt-0.5 shrink-0 text-magenta-bright" />{t}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-cyan/20 bg-[#0b111c] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan">Academic door</p>
                <ul className="mt-3 space-y-2 text-[12px] text-body">
                  {["SS1 to SS3, graduate or retaker", "Or not writing an exam yet — still welcome", "English + Mathematics, plus your combination", "Mon · Wed · Fri attendance, 8–9pm WAT", "Submit assignments Tue, Thu, Sat — we mark them"].map((t) => (
                    <li key={t} className="flex items-start gap-2"><Check size={12} className="mt-0.5 shrink-0 text-cyan" />{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ————————————— 06 — FAQ ————————————— */}
          <section id="faq" className="mt-14 scroll-mt-28">
            <SectionHead eyebrow="06 — Questions" title="The honest answers." />
            <div className="mt-6">
              <Faq items={FAQS} />
            </div>
          </section>
        </div>
      </div>

      {/* ————————————— Final CTA ————————————— */}
      <section className="shell pb-16 pt-2 sm:pb-24">
        <div className="panel-glow starfield relative px-6 py-14 text-center sm:py-16">
          <p className="eyebrow">Two doors — pick yours</p>
          <h2 className="display display-lg mx-auto mt-5 max-w-2xl text-white">The seat is free. The standard is not.</h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/75">
            Three minutes to apply on either door. One KR8 ID, one standard of teaching, and proof you can show.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink to="/apply?door=skill" variant="primary" size="lg" arrow>
              I want a skill
            </ButtonLink>
            <ButtonLink to="/apply?door=academic" variant="light" size="lg" arrow>
              I want the exam prep
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
