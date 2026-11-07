import { useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  Compass,
  GraduationCap,
  Loader2,
  MapPin,
  MonitorPlay,
  Music,
  Laptop,
  Megaphone,
  Rocket,
  Handshake,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useSeo } from "../lib/seo";
import { isValidEmail } from "../lib/utils";
import { sendEmail } from "../lib/email";
import { useDb } from "../lib/hooks";
import { Field, Input, Pill, SectionHead, Select, Textarea } from "../components/ui";
import { Faq, Reveal, SectionIndex } from "../components/sections";

const WHY = [
  {
    icon: Users,
    title: "Your name travels with the results",
    body: "Partners are publicly credited wherever the outcome lands — the certificate, The Wall, the cohort report. Recognition with substance, not a logo wall nobody reads.",
  },
  {
    icon: ShieldCheck,
    title: "Outcomes you can actually verify",
    body: "Every KR8 certificate carries a public verification code. When you sponsor, fund or hire through us, the proof of what your support produced is one click away — forever.",
  },
  {
    icon: MonitorPlay,
    title: "A talent funnel you can watch forming",
    body: "Eight weeks of weekly submissions and live critique. By the time graduates leave, you have watched them work — no rehearsed interviews, no guessing from a CV.",
  },
  {
    icon: Handshake,
    title: "Zero-fee integrity, always",
    body: "You never underwrite a fee system or a profit margin. Every naira you put in buys seats, teaching, tools and awards — nothing else, ever.",
  },
];

const WAYS = [
  {
    icon: Rocket,
    title: "Sponsor a cohort",
    who: "Companies · foundations · agencies",
    body: "Underwrite a full skill end-to-end — curriculum, practitioners, tools and critique. Naming on the skill, a kickoff with the cohort, and an honest report every Friday for eight weeks.",
  },
  {
    icon: GraduationCap,
    title: "Fund seats & UTME awards",
    who: "Individuals · alumni · companies",
    body: "Sponsor students through KR8 Academics, or underwrite a recognition tier for verified UTME achievers. Benefactors are named on The Wall — or kept private, your choice.",
  },
  {
    icon: Music,
    title: "Bring your skill",
    who: "Practitioners · studios · experts",
    body: "Music production. Fashion design. Fintech. Carpentry. If students should learn it and you do it at a professional level, we can build it as a skill — with your people, your standard and KR8's machinery.",
  },
  {
    icon: Laptop,
    title: "Equip the lab",
    who: "OEMs · telcos · NGOs · individuals",
    body: "Laptops, tablets, data bundles, software seats, power banks, internet. Hardware is what turns access into output — and we will tell you honestly what 40 students actually need.",
  },
  {
    icon: Briefcase,
    title: "Hire the talent",
    who: "Employers · agencies · startups",
    body: "Internships, paid briefs, entry-level roles, graduate programmes. Source from live work — briefs they delivered, critique they survived — not from promises.",
  },
  {
    icon: MapPin,
    title: "Open a hub in your city",
    who: "Churches · schools · community centres",
    body: "Host a cohort or a physical hub where you live. We bring the teaching, the standard and the verification. You bring the room — and the local belief.",
  },
  {
    icon: Megaphone,
    title: "Tell the story",
    who: "Media · creators · publishers",
    body: "Documentaries, press, podcasts, field stories. Put verified, tuition-free African talent in front of the country — we will open every door we can.",
  },
  {
    icon: Compass,
    title: "Advise the standard",
    who: "Veterans · elders · industry councils",
    body: "Curriculum audits, review panels, mentor office-hours, board counsel. Help keep the bar high, honest and unfashionably practical.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Brief us",
    body: "Send one honest email or WhatsApp message: what you do, what you care about, and what you want to move — a cohort, an award, a subject, a city, a hire.",
  },
  {
    step: "02",
    title: "Design it together",
    body: "One scoping call. We put the plan, the recognition, the budget and the terms in writing before anything is announced publicly.",
  },
  {
    step: "03",
    title: "Launch & report",
    body: "Co-announced to the cohort and the public. Weekly reports during delivery, an end-of-cohort review, and your name on The Wall if you want it there.",
  },
];

const ALWAYS = [
  "A written partnership agreement before any announcement",
  "Weekly reports during anything we deliver together",
  "Public credit on The Wall, the certificate or the cohort report — if you want it",
  "First look at each cohort's verified work before graduation",
  "An honest conversation when something is not working — including saying no",
];
const NEVER = [
  "Students' personal data — never, in any format, for any reason",
  "Curriculum control sold to the highest bidder — the standard is non-negotiable",
  "Guaranteed scores or guaranteed hires — only verified results, always",
  "A renaming of KR8 — KR8 stays KR8; your name stands beside it, not instead of it",
  "Anything that turns a free school into a shop floor for your brand",
];

const FAQS = [
  { q: "Is this advertising?", a: "No — it is institution-building. Partners get recognition where results land (the cohort report, The Wall, certificates), never billboards inside lessons. If you want reach, we will talk about what honest reach looks like." },
  { q: "Can a partner run their own curriculum?", a: "Practitioners shape delivery with us — the teaching remains practice-led and KR8 keeps editorial control of what ships. If you want to teach your craft under the KR8 standard, you will never be 'bought', and if KR8's approach stops serving students, either side can walk with dignity." },
  { q: "How much does sponsoring a cohort cost?", a: "Every partnership is scoped in writing, and costs vary by skill, city and ambition — there is no rate card. We will tell you honestly what the money buys, what it does not, and whether it is the right use of it. If it is not, we will say so." },
  { q: "Can individuals partner, or only companies?", a: "Both. Alumni, parents, working professionals and retirees partner all the time — seats, awards, equipment, mentoring, advice. A company is not a requirement; conviction is." },
  { q: "What if I want to partner on something we haven't listed?", a: "That is the best kind of enquiry. Tell us what you are imagining — the 'weird' ones are usually the ones that become the model for everyone else. The only condition: it must serve students, and it must be free for them." },
];

const LANES = [
  "Sponsor a cohort",
  "Fund seats & UTME awards",
  "Bring my skill (a new one)",
  "Equip the lab",
  "Hire the talent",
  "Open a hub in my city",
  "Tell the story (media)",
  "Advise the standard",
  "Something else entirely",
];

type FormState = {
  name: string;
  org: string;
  email: string;
  whatsapp: string;
  lane: string;
  message: string;
};
const EMPTY_FORM: FormState = { name: "", org: "", email: "", whatsapp: "", lane: LANES[0], message: "" };

export default function Partner() {
  const db = useDb();
  useSeo({
    title: "Partner with KR8 Academy — build the school Africa deserved",
    description:
      "Partner with KR8 Academy: sponsor a cohort, fund UTME awards, bring your skill as a new discipline (from music to fintech), equip the lab, hire verified graduates, open a hub in your city, or advise the standard. Written terms, verified outcomes, public credit on The Wall.",
    path: "/partner",
  });

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [fallbackHref, setFallbackHref] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    if (form.name.trim().length < 2) next.name = "Tell us your name.";
    if (!isValidEmail(form.email)) next.email = "Enter a working email address.";
    if (form.message.trim().length < 20) next.message = "A sentence or two more, please (20+ characters).";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    setFallbackHref(null);
    const html = `<p><strong>Partnership enquiry via kr8academy.vercel.app/partner</strong></p>
<p>Name: ${form.name.trim()}<br/>Organisation: ${form.org.trim() || "— (individual)"}<br/>Email: ${form.email.trim()}<br/>WhatsApp: ${form.whatsapp.trim() || "—"}<br/>Lane: ${form.lane}</p>
<p>What they are imagining:</p><p>${form.message.trim().replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</p>`;
    const result = await sendEmail({
      to: db.settings.supportEmail,
      subject: `Partnership enquiry — ${form.lane} — ${form.org.trim() || form.name.trim()}`,
      html,
    });
    setBusy(false);
    if (result.ok) {
      setSent(true);
    } else {
      setFallbackHref(result.mailto);
    }
  }

  return (
    <>
      {/* ————— Hero ————— */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 starfield opacity-70" aria-hidden="true" />
        <div className="shell relative grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <SectionIndex index="Partner" label="With KR8 Academy" />
            <h1 className="display display-xl mt-5 max-w-[18ch]">
              Whatever you do — there is a place for it at KR8.
            </h1>
            <p className="lede mt-5 max-w-xl">
              KR8 Academy is tuition-free by design, partner-powered by conviction. Companies, foundations,
              churches, studios, practitioners, individuals — if you make something valuable, you can add it to
              this school: a track, a cohort, a lab full of laptops, or the jobs at the end of it.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href="#start" className="btn btn-primary btn-lg group">
                Start the conversation
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a href="#ways" className="btn btn-ghost btn-lg">
                See the ways to partner
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Pill>Any industry</Pill>
              <Pill>Any scale</Pill>
              <Pill tone="live">Written terms, always</Pill>
            </div>
          </div>

          <div className="ink-panel relative rounded-2xl p-6">
            <div className="flex items-center gap-2 text-white/60">
              <Handshake size={14} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Already in the family</p>
            </div>
            <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
              <div className="py-4">
                <p className="font-display text-[14px] font-semibold text-cyan">Next Gen Scholars · Academics</p>
                <p className="mt-1 text-[12px] leading-relaxed text-white/70">
                  Free live preparation for UTME/JAMB, WAEC and NECO — the academic half of KR8, delivered
                  with Next Gen Scholars, January 2027 and every intake after.
                </p>
              </div>
              <div className="py-4">
                <p className="font-display text-[14px] font-semibold text-gold">The Wall · KR8 Recognition</p>
                <p className="mt-1 text-[12px] leading-relaxed text-white/70">
                  Public, verified proof of what partnership produces — UTME distinctions and award tiers,
                  checked before they are celebrated.
                </p>
              </div>
              <div className="py-4">
                <p className="font-display text-[14px] font-semibold text-magenta-bright">The KR8 register · Graduate verification</p>
                <p className="mt-1 text-[12px] leading-relaxed text-white/70">
                  Every certificate carries a public code. The talent that walks out of KR8 can be verified in
                  one click — hire with confidence.
                </p>
              </div>
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
              Partners → outcomes → verifiers
            </p>
          </div>
        </div>
      </section>

      {/* ————— In the room ————— */}
      <section className="shell pt-10">
        <figure className="overflow-hidden rounded-2xl border border-white/10">
          <img
            src="/media/partner-meeting.jpg"
            alt="A partnership review at KR8 Digitals — the team walking a partner through a sponsorship one-sheet and cohort schedule"
            loading="lazy"
            className="aspect-[21/9] w-full object-cover object-[50%_35%]"
          />
          <figcaption className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-raised px-5 py-3 text-[11px] text-muted">
            <span>Every partnership starts with one honest conversation — ours with Next Gen Scholars did.</span>
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-magenta-bright">Partners with KR8</span>
          </figcaption>
        </figure>
      </section>

      {/* ————— Why partner ————— */}
      <section className="shell py-14">
        <SectionHead
          eyebrow="01 — Why partner"
          title="Goodwill is not the ask. Outcomes are."
          body="Partnering with KR8 is not a donation with a logo attached. It is a deliberate trade: your craft, capital or reach — for proof that it moved real lives."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {WHY.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={index * 50}>
                <div className="card flex h-full gap-4 p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                    <Icon size={19} className="text-magenta-bright" />
                  </span>
                  <div>
                    <h3 className="font-display text-[15px] font-semibold leading-snug">{item.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{item.body}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ————— Ways to partner ————— */}
      <section id="ways" className="scroll-mt-28 border-y border-white/10 bg-raised py-14">
        <div className="shell">
          <SectionHead
            eyebrow="02 — Ways to partner"
            title="Eight doors in. Bring your own door if yours is missing."
            body="Sponsorship is the obvious lane. It is not the only one — and it is not always the best one."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WAYS.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 40}>
                  <div className="card flex h-full flex-col p-5">
                    <Icon size={20} className="text-magenta-bright" />
                    <h3 className="mt-3 font-display text-[15px] font-semibold leading-snug">{item.title}</h3>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">{item.who}</p>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{item.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <p className="mt-6 max-w-2xl text-[13px] leading-relaxed text-muted">
            Notice something? <span className="text-white">None of these is capped at companies.</span> A producer
            who teaches a Saturday music track is as much a KR8 partner as a bank. A parent who furnishes one
            laptop is as much one as a foundation that funds a whole track.
          </p>
        </div>
      </section>

      {/* ————— How it works ————— */}
      <section className="shell py-14">
        <SectionHead
          eyebrow="03 — How it works"
          title="Three steps, in writing, before anything is announced."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((item, index) => (
            <Reveal key={item.step} delay={index * 60}>
              <div className="card flex h-full flex-col p-6">
                <span className="font-display text-2xl font-semibold text-muted-2/70">{item.step}</span>
                <h3 className="mt-3 font-display text-[17px] font-semibold">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Fine print, both sides */}
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-live/25 bg-live/[0.04] p-6">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-live">
              <CheckCircle2 size={14} /> What partners always get
            </p>
            <ul className="mt-4 space-y-2.5">
              {ALWAYS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-body">
                  <Check size={13} className="mt-0.5 shrink-0 text-live" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-danger/25 bg-danger/[0.04] p-6">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-danger">
              <X size={14} /> What you never get — and shouldn't ask for
            </p>
            <ul className="mt-4 space-y-2.5">
              {NEVER.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-body">
                  <X size={13} className="mt-0.5 shrink-0 text-danger" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ————— FAQ ————— */}
      <section className="shell pb-14">
        <SectionHead eyebrow="04 — Questions" title="The honest answers, before you ask." />
        <div className="mt-6 max-w-3xl">
          <Faq items={FAQS} />
        </div>
      </section>

      {/* ————— The form ————— */}
      <section id="start" className="scroll-mt-28 border-t border-white/10">
        <div className="shell grid gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionIndex index="05" label="Start the conversation" />
            <h2 className="display display-lg mt-5">Tell us what you want to move.</h2>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted">
              Two minutes to send. A human — Timfire's team, not a bot — reads every enquiry and replies within
              two business days. Prefer a call? Say so in the message and include your number on WhatsApp.
            </p>
            <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-raised p-5 text-[13px] text-muted">
              <p className="flex items-center gap-2 text-body"><Trophy size={14} className="shrink-0 text-gold" /> Sponsors are credited on The Wall</p>
              <p className="flex items-center gap-2 text-body"><ShieldCheck size={14} className="shrink-0 text-magenta-bright" /> Every agreement is written before launch</p>
              <p className="flex items-center gap-2 text-body"><Users size={14} className="shrink-0 text-magenta-bright" /> Talk to a human within two days</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-raised p-6 sm:p-7">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 size={38} className="text-live" />
                <h3 className="mt-4 font-display text-[20px] font-semibold">Received. Thank you.</h3>
                <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
                  Your enquiry is on its way to <span className="text-white">{db.settings.supportEmail}</span>.
                  Expect a real reply within two business days.
                </p>
                <button type="button" className="btn btn-ghost mt-6" onClick={() => { setSent(false); setForm(EMPTY_FORM); }}>
                  Send another enquiry
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Your name" htmlFor="p-name" error={errors.name}>
                    <Input id="p-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ada Obi" error={!!errors.name} />
                  </Field>
                  <Field label="Organisation" htmlFor="p-org" hint="Leave blank if it's just you.">
                    <Input id="p-org" value={form.org} onChange={(e) => set("org", e.target.value)} placeholder="Company, church, foundation…" />
                  </Field>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Email" htmlFor="p-email" error={errors.email}>
                    <Input id="p-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@company.com" error={!!errors.email} />
                  </Field>
                  <Field label="WhatsApp" htmlFor="p-wa" hint="Optional, but fastest.">
                    <Input id="p-wa" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+234 …" />
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="Which lane fits?" htmlFor="p-lane">
                    <Select id="p-lane" value={form.lane} onChange={(e) => set("lane", e.target.value)}>
                      {LANES.map((lane) => (
                        <option key={lane} value={lane}>{lane}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="What are you imagining?" htmlFor="p-message" error={errors.message}>
                    <Textarea
                      id="p-message"
                      value={form.message}
                      onChange={(e) => set("message", e.target.value)}
                      placeholder="e.g. We want to sponsor the video editing cohort this intake and hire two of the best graduates. Budget conversations can start whenever you're ready…"
                      maxLength={1200}
                      error={!!errors.message}
                    />
                  </Field>
                </div>
                {fallbackHref && (
                  <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4 text-[12px] leading-relaxed text-gold">
                    The email service is not configured yet — your enquiry is ready as a pre-filled email instead.
                    <a href={fallbackHref} className="mt-2 block font-semibold underline underline-offset-2">Press send in your mail app →</a>
                  </div>
                )}
                <button type="submit" className="btn btn-primary btn-lg mt-6 w-full sm:w-auto" disabled={busy}>
                  {busy ? <Loader2 size={16} className="spin" /> : <Handshake size={16} />}
                  Send the enquiry
                </button>
              </>
            )}
          </form>
        </div>
      </section>
    </>
  );
}
