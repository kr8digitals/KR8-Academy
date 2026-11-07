import { CalendarClock, Check, ChevronRight, Radio, Sparkles, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useSeo } from "../lib/seo";
import { ButtonLink, Pill, SectionHead } from "../components/ui";
import { Faq, Reveal, SectionIndex } from "../components/sections";

const WHO_IT_IS_FOR = [
  {
    title: "SS1 & SS2 students",
    body: "Start building the habit two years early. Students who walk into SS3 already fluent in the syllabus do not panic in the exam hall — they just write.",
    tag: "Join now, glide through SS3",
  },
  {
    title: "SS3 students",
    body: "The final push, done properly: timed past questions, honest feedback, the JAMB syllabus front to back, and a class that meets three times a week until you are ready.",
    tag: "Registration open",
  },
  {
    title: "Graduates & direct entry",
    body: "Retaking the UTME? Writing a post-UTME or JUPEB screening? The same live classes, the same marking, the same standard — built for people who are done with cramming and ready to be taught.",
    tag: "Retakers welcome",
  },
  {
    title: "Not writing an exam yet",
    body: "You do not need to be sitting anything to belong here. Learn how to study, how to think and how to perform — before the paper ever reaches you.",
    tag: "No exam required",
  },
];

const SCIENCE_HIGHLIGHTS = [
  "Mathematics", "English Language", "Physics", "Chemistry", "Biology",
  "Further Mathematics", "Economics", "Geography", "Technical Drawing", "Computer Studies",
];
const ARTS_HIGHLIGHTS = [
  "English Language", "Literature in English", "Government", "CRS / IRS", "Economics",
  "Commerce", "History", "Geography", "French", "Music",
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Apply through the academic door",
    body: "Three minutes. Tell us your level, your exam (if any) and your subject combination. No fee, no test, no gate.",
  },
  {
    step: "02",
    title: "You join in January — and any time after",
    body: "Training starts in January 2027. There is no late-join penalty: every class is live, recorded and posted to your dashboard.",
  },
  {
    step: "03",
    title: "Learn three times a week",
    body: "Monday, Wednesday and Friday, 8:00–9:00pm WAT. Assignments land on Tuesday, Thursday and Saturday. Show up, submit, get marked.",
  },
  {
    step: "04",
    title: "Sit the exam with receipts",
    body: "Past-question drills, mock exams and marking schemes through the final weeks — so the real paper feels like the tenth practice run.",
  },
];

const RECOGNITION_TIERS = [
  { tier: "KR8 UTME Merit Scholar", range: "240–249", blurb: "Where distinction begins — certificate only." },
  { tier: "KR8 UTME Scholar", range: "250–279", blurb: "Scholar-level UTME results." },
  { tier: "KR8 UTME Distinction Scholar", range: "280–299", blurb: "Distinction-grade scores, honoured publicly." },
  { tier: "KR8 UTME Pinnacle Scholar", range: "300–349", blurb: "Pinnacle scores — the cohort's high-water mark." },
  { tier: "KR8 UTME Legend", range: "350–400", blurb: "The rarest result on the board. Reserved for legends." },
];

const FAQS = [
  { q: "Is KR8 Academics really free?", a: "Yes. No tuition, no registration fee, no exam-fee contribution and no certificate charge. The academic programme is funded the same way the seven digital-skill cohorts are — by the KR8 agency side and by partners like Next Gen Scholars, never by your pocket." },
  { q: "Which exams do you prepare students for?", a: "UTME/JAMB, WAEC and NECO — and other Nigerian and international examinations on request. If you are preparing for something specific, tell us in the application and we will scope it honestly." },
  { q: "I am in SS1. Is it too early?", a: "It is the perfect time. You will build the study system before the pressure arrives, and you will walk into SS3 owning the syllabus instead of meeting it for the first time." },
  { q: "How are the UTME awards decided?", a: "By verified result slips — never by self-reporting. Awards are recognition, not participation ribbons: the tiers are KR8 UTME Merit Scholar (240+), Scholar (250+), Distinction Scholar (280+), Pinnacle Scholar (300+) and Legend (350+). Amounts and criteria for each cohort are announced with the results, and the names of verified achievers appear on The Wall." },
  { q: "Can I do both the academic programme and a digital skill?", a: "Yes, if you can hold 6–8 hours a week for the skill and the academic schedule. Tell us in your application; we will help you pick a realistic combination rather than an heroic one." },
];

export default function Academics() {
  useSeo({
    title: "KR8 Academics — free UTME, WAEC & NECO preparation with Next Gen Scholars",
    description:
      "Tuition-free live preparation for UTME/JAMB, WAEC and NECO, delivered with Next Gen Scholars. Monday, Wednesday and Friday, 8–9pm WAT. Starting January 2027 — join any time. SS1, SS2, SS3, graduates and pre-exam students welcome.",
    path: "/academics",
  });

  return (
    <>
      {/* ————— Hero ————— */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 starfield opacity-70" aria-hidden="true" />
        <div className="shell relative grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <SectionIndex index="KR8 Academics" label="With Next Gen Scholars" />
            <h1 className="display display-xl mt-5 max-w-[17ch]">
              Same zero tuition. Same obsession. Now for your results.
            </h1>
            <p className="lede mt-5 max-w-xl">
              KR8 Academics is tuition-free, live exam preparation — UTME/JAMB, WAEC, NECO and beyond —
              delivered with <span className="font-semibold text-white">Next Gen Scholars</span>. Monday,
              Wednesday and Friday, 8:00–9:00pm WAT. Training starts January 2027, and you can join any time.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink to="/apply?door=academic" variant="primary" size="lg" arrow>
                Apply for Academics — free
              </ButtonLink>
              <ButtonLink to="/partner" variant="ghost" size="lg">
                Partner with us
              </ButtonLink>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Pill tone="magenta">Open now — join any time</Pill>
              <Pill>₦0 tuition, forever</Pill>
              <Pill>Next Gen Scholars</Pill>
            </div>
          </div>

          {/* Live timetable card */}
          <div className="ink-panel relative rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white/60">
                <Radio size={14} />
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">The academic week</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/30 bg-cyan/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-cyan">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" /> Live
              </span>
            </div>
            <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
              {[
                { day: "Monday", what: "Live class · full syllabus drill", time: "8:00–9:00pm WAT" },
                { day: "Wednesday", what: "Live class · past-question session", time: "8:00–9:00pm WAT" },
                { day: "Friday", what: "Live class · marking & clinic", time: "8:00–9:00pm WAT" },
              ].map((row) => (
                <div key={row.day} className="flex items-center gap-4 py-3.5">
                  <span className="w-20 shrink-0 font-display text-[12px] font-semibold text-cyan">{row.day}</span>
                  <span className="min-w-0 flex-1 text-[12px] leading-snug text-white/80">{row.what}</span>
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-wide text-white/45">{row.time}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2.5 text-[12px] text-white/65">
              <p className="flex items-start gap-2">
                <Check size={13} className="mt-0.5 shrink-0 text-cyan" />
                Assignments every Tuesday, Thursday and Saturday — marked, not just collected.
              </p>
              <p className="flex items-start gap-2">
                <Check size={13} className="mt-0.5 shrink-0 text-cyan" />
                Recordings + resources live in your dashboard the moment class ends.
              </p>
              <p className="flex items-start gap-2">
                <Check size={13} className="mt-0.5 shrink-0 text-cyan" />
                Mock exams in the final weeks — so exam day is routine, not a shock.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-gold/25 bg-gold/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="shrink-0 text-gold" />
                <p className="text-[11px] leading-snug text-white/75">
                  Verified UTME distinctions earn KR8 awards — and a place on The Wall.
                </p>
              </div>
              <Link to="/wall" className="shrink-0 text-[11px] font-semibold text-gold hover:text-gold/80">
                See The Wall →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ————— Inside the classroom ————— */}
      <section className="shell pt-10">
        <figure className="overflow-hidden rounded-2xl border border-cyan/20">
          <img
            src="/media/academics-evening-class.jpg"
            alt="KR8 Academics evening session — students working through past questions at desks while their facilitator explains at the whiteboard"
            loading="lazy"
            className="aspect-[21/9] w-full object-cover object-[50%_28%]"
          />
          <figcaption className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#0b111c] px-5 py-3 text-[11px] text-muted">
            <span>Evening class, three nights a week — the same room, every Monday, Wednesday and Friday.</span>
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-cyan">KR8 × Next Gen Scholars</span>
          </figcaption>
        </figure>
      </section>

      {/* ————— Who it's for ————— */}
      <section className="shell py-14">
        <SectionHead
          eyebrow="01 — Who it's for"
          title="Four kinds of students. One standard."
          body="Whatever your level, the deal is the same: live teaching, real marking, zero money."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {WHO_IT_IS_FOR.map((item, index) => (
            <Reveal key={item.title} delay={index * 50}>
              <div className="card flex h-full flex-col p-5">
                <span className="inline-flex w-fit rounded-full border border-cyan/25 bg-cyan/5 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-cyan">
                  {item.tag}
                </span>
                <h3 className="mt-3 font-display text-[17px] font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ————— Subjects & combinations ————— */}
      <section className="border-y border-white/10 bg-raised py-14">
        <div className="shell">
          <SectionHead
            eyebrow="02 — Subjects"
            title="English and Mathematics are non-negotiable. The rest is your combination."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan" /> Science combination
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SCIENCE_HIGHLIGHTS.map((subject) => (
                  <span key={subject} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-body">
                    {subject}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan" /> Arts & humanities combination
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ARTS_HIGHLIGHTS.map((subject) => (
                  <span key={subject} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-body">
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-[13px] leading-relaxed text-muted">
            Not sure which subjects are yours yet? Choose <span className="text-white">“Not sure / general”</span> at
            registration — your subject list is set inside your dashboard, and our advisers will help you lock the
            right combination before your first mock.
          </p>
        </div>
      </section>

      {/* ————— How it works ————— */}
      <section className="shell py-14">
        <SectionHead eyebrow="03 — How it works" title="Four steps from sign-up to sit-down." />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item, index) => (
            <Reveal key={item.step} delay={index * 50}>
              <div className="card flex h-full flex-col p-5">
                <span className="font-display text-2xl font-semibold text-muted-2/70">{item.step}</span>
                <h3 className="mt-3 font-display text-[14.5px] font-semibold leading-snug">{item.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-muted">
          <span className="flex items-center gap-2"><CalendarClock size={14} className="text-cyan" /> Mon · Wed · Fri · 8:00–9:00pm WAT</span>
          <span className="flex items-center gap-2"><Users size={14} className="text-cyan" /> Live classes, capped cohorts</span>
          <span className="flex items-center gap-2"><Sparkles size={14} className="text-cyan" /> Ships with your KR8 ID and dashboard</span>
        </div>
      </section>

      {/* ————— Recognition ————— */}
      <section className="shell pb-14">
        <div className="rounded-2xl border border-gold/20 bg-gold/[0.04] p-6 sm:p-8">
          <SectionHead
            eyebrow="04 — Recognition, not ribbons"
            title="Verified results get celebrated in public."
            body="Awards are decided by verified UTME result slips — never by self-reporting or effort alone. Five tiers are recognised; amounts and criteria are announced with each cohort’s verified results."
            action={<ButtonLink to="/wall" variant="ghost" arrow>Browse The Wall</ButtonLink>}
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {RECOGNITION_TIERS.map((item) => (
              <div key={item.tier} className="rounded-xl border border-gold/20 bg-black/20 p-4">
                <Trophy size={16} className="text-gold" />
                <p className="mt-2 font-display text-[14px] font-semibold text-gold">{item.tier}</p>
                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/60">{item.range}</p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{item.blurb}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[11.5px] text-muted">
            Participation is tracked and honoured too — students who hold attendance at 80%+ are recorded in the
            cohort register. Prizes, however, are reserved for verified scores. That is the whole point.
          </p>
        </div>
      </section>

      {/* ————— FAQ ————— */}
      <section className="shell pb-16">
        <SectionHead eyebrow="05 — Questions" title="The honest answers." />
        <div className="mt-6 max-w-3xl">
          <Faq items={FAQS} />
        </div>
      </section>

      {/* ————— Built with partners ————— */}
      <section className="shell pb-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-raised p-6 sm:flex-row sm:items-center sm:p-7">
          <div>
            <p className="eyebrow">Delivered with</p>
            <p className="mt-2 font-display text-[17px] font-semibold">Next Gen Scholars × KR8 Digitals</p>
            <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted">
              Academic teaching comes from Next Gen Scholars; the cohort machinery, verification and the wall
              come from KR8. Want to bring your own programme to these students?
            </p>
          </div>
          <ButtonLink to="/partner" variant="ghost" size="md" arrow>
            See how to partner
          </ButtonLink>
        </div>
      </section>

      {/* ————— Final CTA ————— */}
      <section className="shell pb-16 pt-6 sm:pb-24">
        <div className="panel-glow starfield relative px-6 py-14 text-center sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-64 w-2/3 rounded-full bg-[radial-gradient(circle,rgba(56,224,255,0.22),transparent_70%)] blur-2xl"
            aria-hidden="true"
          />
          <div className="relative z-10 mx-auto max-w-2xl">
            <p className="eyebrow">Academics open now</p>
            <h2 className="display display-lg mt-5 text-white">January is closer than it feels.</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/75">
              Applications for KR8 Academics are open now. Three minutes to apply — and a teacher who marks
              your work like it matters, because it does.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink to="/apply?door=academic" variant="primary" size="lg" arrow>
                Apply for Academics
              </ButtonLink>
              <ButtonLink to="/skills" variant="ghost" size="lg">
                See the digital-skill tracks
              </ButtonLink>
            </div>
            <p className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/55">
              <CalendarClock size={12} /> Training starts January 2027 · Mon · Wed · Fri · 8:00–9:00pm WAT
              <ChevronRight size={12} /> join any time
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
