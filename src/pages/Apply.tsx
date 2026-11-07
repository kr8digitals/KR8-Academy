import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  GraduationCap,
  Hourglass,
  Loader2,
  Lock,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { TRACKS, MENTORS, trackByKey } from "../data/academy";
import { useAuth } from "../lib/auth";
import { useDb } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { useToast } from "../lib/toast";
import { joinWaitlist } from "../lib/store";
import type { AcademicCombination, AcademicExam, RegistrationSide } from "../lib/types";
import { ageFromDob, cn, copyToClipboard, isValidEmail, isValidPhone, passwordStrength } from "../lib/utils";
import { Avatar, ButtonLink, Field, Input, Pill, Select, Textarea } from "../components/ui";
import { Countdown, SectionIndex } from "../components/sections";
import type { Track } from "../data/academy";

const COUNTRIES = [
  { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬" },
  { code: "GH", name: "Ghana", dial: "+233", flag: "🇬🇭" },
  { code: "KE", name: "Kenya", dial: "+254", flag: "🇰🇪" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦" },
  { code: "CM", name: "Cameroon", dial: "+237", flag: "🇨🇲" },
  { code: "CI", name: "Côte d'Ivoire", dial: "+225", flag: "🇨🇮" },
  { code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "IE", name: "Ireland", dial: "+353", flag: "🇮🇪" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "OTHER", name: "Other country", dial: "+", flag: "🌍" },
];

const EXPERIENCE = ["Complete beginner", "Some self-taught basics", "I have a small portfolio", "I already freelance"];

const CLASS_LEVELS = ["SS1", "SS2", "SS3", "Finished secondary", "University / other"];
const EXAM_OPTIONS: Array<{ value: AcademicExam; label: string }> = [
  { value: "utme", label: "UTME / JAMB" },
  { value: "waec", label: "WAEC" },
  { value: "neco", label: "NECO" },
  { value: "other", label: "Another exam" },
  { value: "not_writing", label: "Not writing an exam yet" },
];
const COMBINATION_OPTIONS: Array<{ value: AcademicCombination; label: string; blurb: string }> = [
  { value: "science", label: "Science", blurb: "Maths, English + science subjects" },
  { value: "arts", label: "Arts", blurb: "English + arts & humanities subjects" },
  { value: "general", label: "Not sure / general", blurb: "Still exploring — we will help you choose" },
];
const SCIENCE_SUBJECTS = [
  "Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Further Mathematics",
  "Agriculture", "Economics", "Geography", "Technical Drawing", "Computer Studies", "Government", "Commerce",
];
const ARTS_SUBJECTS = [
  "English Language", "Literature in English", "Government", "Christian Religious Studies", "Islamic Studies",
  "Economics", "Commerce", "History", "Geography", "French", "Yorùbá", "Igbo", "Hausa", "Music", "Fine Art",
];
const ALL_SUBJECTS = Array.from(new Set([...SCIENCE_SUBJECTS, ...ARTS_SUBJECTS]));

type Draft = {
  name: string;
  email: string;
  dial: string;
  phone: string;
  country: string;
  city: string;
  trackKey: string;
  experience: string;
  motivation: string;
  dob: string;
  password: string;
  confirm: string;
  terms: boolean;
  academicClassLevel: string;
  academicExam: AcademicExam;
  academicOtherExam: string;
  combination: AcademicCombination;
  subjects: string[];
};

const EMPTY: Draft = {
  name: "",
  email: "",
  dial: "+234",
  phone: "",
  country: "NG",
  city: "",
  trackKey: "",
  experience: EXPERIENCE[0],
  motivation: "",
  dob: "",
  password: "",
  confirm: "",
  terms: false,
  academicClassLevel: "",
  academicExam: "utme",
  academicOtherExam: "",
  combination: "science",
  subjects: [],
};

const DRAFT_KEY = "kr8.academy.apply.draft";

type Errors = Partial<Record<keyof Draft, string> & Record<"academicClassLevel" | "academicOtherExam" | "subjects", string>>;

export default function Apply() {
  const [params] = useSearchParams();
  const db = useDb();
  const { student, signUp } = useAuth();
  const toast = useToast();

  useSeo({
    title: "Apply for a free seat",
    description:
      "Apply for a free seat in the next KR8 Academy cohort. Three minutes, no fees, and a verifiable KR8 ID if your application is accepted.",
    path: "/apply",
  });

  const [draft, setDraft] = useState<Draft>(() => {
    /* A track link (?track=web) always wins over a draft saved earlier, so
       "Apply for this track" never silently enrols someone elsewhere. */
    const requested = params.get("track") ?? "";
    const fromLink = trackByKey(requested) ? requested : "";
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = { ...EMPTY, ...(JSON.parse(raw) as Draft) };
        return fromLink ? { ...saved, trackKey: fromLink } : saved;
      }
    } catch {
      /* noop */
    }
    return { ...EMPTY, trackKey: fromLink };
  });
  const doorParam = params.get("door");
  const [side, setSide] = useState<RegistrationSide | null>(() => {
    if (doorParam === "academic") return "academic";
    if (doorParam === "skill") return "skill";
    if (params.get("track")) return "skill";
    return null;
  });
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState<{ id: string; pending: boolean; side: RegistrationSide } | null>(null);
  const [waitlist, setWaitlist] = useState<{ busy: boolean; joined: boolean; duplicate: boolean; error: string | null }>({
    busy: false,
    joined: false,
    duplicate: false,
    error: null,
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* noop */
    }
  }, [draft]);

  const selectedTrack: Track | undefined = useMemo(() => trackByKey(draft.trackKey), [draft.trackKey]);
  const strength = passwordStrength(draft.password);
  const programmeFor = (key: string) => db.programmes.find((programme) => programme.key === key);
  const skillProgramme = draft.trackKey ? programmeFor(draft.trackKey) : undefined;
  const skillRegistrationBlocked = side === "skill" && !!skillProgramme && skillProgramme.status !== "open";
  const subjectPool =
    draft.academicExam === "not_writing"
      ? ALL_SUBJECTS
      : draft.combination === "arts"
        ? ARTS_SUBJECTS
        : draft.combination === "science"
          ? SCIENCE_SUBJECTS
          : ALL_SUBJECTS;

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validateStep(current: number): boolean {
    const next: Errors = {};
    if (current === 1) {
      if (draft.name.trim().length < 3) next.name = "Enter your full name.";
      if (!isValidEmail(draft.email)) next.email = "Enter a valid email address.";
      if (!isValidPhone(`${draft.dial}${draft.phone}`)) next.phone = "Enter a valid phone number.";
      if (!draft.country) next.country = "Select your country.";
    }
    if (current === 2) {
      if (side === "academic") {
        if (!draft.academicClassLevel) next.academicClassLevel = "Select your class level.";
        if (draft.academicExam === "other" && draft.academicOtherExam.trim().length < 2)
          next.academicOtherExam = "Tell us the exam you are preparing for.";
        if (draft.academicExam !== "not_writing" && draft.subjects.length === 0)
          next.subjects = "Pick at least one subject.";
        if (draft.motivation.trim().length < 20) next.motivation = "Tell us at least a sentence or two (20+ characters).";
      } else {
        if (!draft.trackKey) {
          next.trackKey = "Choose the track you want to join.";
        } else if (skillRegistrationBlocked && skillProgramme?.status === "waitlist") {
          next.trackKey = undefined; // selecting is fine — the waitlist panel handles it
        }
        if (draft.motivation.trim().length < 20) next.motivation = "Tell us at least a sentence or two (20+ characters).";
      }
    }
    if (current === 3) {
      if (!draft.dob) next.dob = "Add your date of birth.";
      else {
        const age = ageFromDob(draft.dob);
        if (age === null || age < 16) next.dob = "You must be 16 or older to join.";
        if (age !== null && age > 90) next.dob = "That date does not look right.";
      }
      if (draft.password.length < 8) next.password = "Use at least 8 characters.";
      if (draft.confirm !== draft.password) next.confirm = "Passwords do not match.";
      if (!draft.terms) next.terms = "Please accept the academy terms.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    if (step === 2 && skillRegistrationBlocked) {
      toast.info(
        "This track is on the waitlist",
        "Join the waitlist below — you will hear first when registration opens around March–April 2027."
      );
      return;
    }
    setStep((s) => Math.min(3, s + 1));
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!validateStep(3)) return;
    setBusy(true);
    const phone = `${draft.dial}${draft.phone.replace(/^0+/, "")}`;
    const result = await signUp({
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone,
      country: draft.country,
      trackKey: side === "academic" ? "academic" : draft.trackKey,
      dob: draft.dob,
      password: draft.password,
      motivation: draft.motivation.trim(),
      experience: side === "academic" ? "Preparing for exams" : draft.experience,
      city: draft.city.trim(),
      side: side ?? "skill",
      academic:
        side === "academic"
          ? {
              classLevel: draft.academicClassLevel,
              exam: draft.academicExam,
              otherExam: draft.academicExam === "other" ? draft.academicOtherExam.trim() : undefined,
              combination: draft.combination,
              subjects: draft.subjects,
            }
          : undefined,
    });
    setBusy(false);
    if (!result.ok || !result.student) {
      if (result.waitlist) {
        toast.info("You are on the waitlist", result.error ?? "Registration for this track opens around March–April 2027.");
        return;
      }
      toast.error("Application not submitted", result.error ?? "Please check your details and try again.");
      setErrors({ email: result.error?.toLowerCase().includes("email") ? result.error : undefined, phone: result.error?.toLowerCase().includes("phone") ? result.error : undefined });
      return;
    }
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* noop */
    }
    setDone({ id: result.student.id, pending: result.student.status === "pending", side: side ?? "skill" });
    toast.success("Application received", "Your KR8 ID has been issued.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function joinTrackWaitlist() {
    if (!validateStep(1)) {
      toast.error("Complete step 1 first", "We need your name, email, WhatsApp number and country for the waitlist.");
      setStep(1);
      return;
    }
    if (!draft.trackKey) return;
    setWaitlist((w) => ({ ...w, busy: true, error: null }));
    const result = joinWaitlist({
      name: draft.name.trim(),
      email: draft.email.trim(),
      whatsapp: `${draft.dial}${draft.phone.replace(/^0+/, "")}`,
      country: draft.country,
      trackKey: draft.trackKey,
      side: "skill",
    });
    setWaitlist({
      busy: false,
      joined: result.ok,
      duplicate: !!result.duplicate,
      error: result.ok ? null : result.error ?? "Could not join the waitlist.",
    });
    if (result.ok) toast.success(result.duplicate ? "Already on the list" : "You are on the waitlist", "We will email you when registration opens.");
  }

  if (student && !done) {
    return (
      <section className="shell py-20 text-center">
        <CheckCircle2 size={30} className="mx-auto text-magenta-bright" />
        <h1 className="display display-md mt-4">You already have a seat.</h1>
        <p className="lede mx-auto mt-3 max-w-md">
          You are signed in as <span className="font-semibold text-white">{student.name}</span> ({student.id}). Head to your dashboard to
          continue the cohort.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <ButtonLink to="/dashboard" variant="primary">Open dashboard</ButtonLink>
          <ButtonLink to="/tracks" variant="ghost">Browse tracks</ButtonLink>
        </div>
      </section>
    );
  }

  if (done) {
    const track = trackByKey(draft.trackKey);
    return (
      <section className="shell py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-white/10 bg-raised p-6 shadow-[0_30px_80px_-60px_rgba(20,15,26,0.6)] sm:p-9">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-live/15 text-live">
              <Check size={22} strokeWidth={2.5} />
            </span>
            <h1 className="display display-lg mt-5">
              {done.pending ? "You’re on the list." : "You’re in."}
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              {done.side === "academic" ? (
                <>
                  Welcome to <span className="font-semibold text-white">KR8 Academics</span>, delivered with{" "}
                  <span className="font-semibold text-white">{db.settings.partnerName}</span>. Training starts in{" "}
                  <span className="font-semibold text-white">January</span> and you can join at any time — even years
                  before you sit your exam. Your onboarding details arrive by email and WhatsApp.
                </>
              ) : done.pending ? (
                "Admissions are currently paused, so your seat is on the waitlist. You can already sign in — we will activate your cohort access as soon as a seat opens."
              ) : (
                `Your seat on the ${track?.name ?? "cohort"} track is confirmed. Onboarding is ${new Date(new Date(db.settings.cohortStart).getTime() - 86400000).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} and classes begin ${new Date(db.settings.cohortStart).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.`
              )}
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-base p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Your KR8 ID</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="font-mono text-lg font-semibold tracking-tight">{done.id}</p>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={async () => {
                    await copyToClipboard(done.id);
                    toast.success("KR8 ID copied");
                  }}
                >
                  <Copy size={13} /> Copy
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                This is your permanent student identity. It appears on your dashboard, your certificate and the
                public verification page.{done.side === "academic" ? " UTME awards and certificates are only awarded to verified KR8 identity holders." : ""}
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              {[
                "Check your inbox for the welcome note (and your spam folder, just in case).",
                "Join the cohort WhatsApp community for session links and reminders.",
                "Come to onboarding with a laptop and one sentence about what you want to build.",
              ].map((item, index) => (
                <div key={item} className="flex gap-2.5 text-[12.5px]">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-magenta-fill text-[10px] font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="text-body">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              <ButtonLink to="/dashboard" variant="primary" arrow>
                Open my dashboard
              </ButtonLink>
              <ButtonLink href={db.settings.whatsappUrl} variant="ghost">
                Join the WhatsApp community
              </ButtonLink>
            </div>
          </div>

          <p className="mt-5 text-center text-[11px] text-muted">
            Need to change something? Email{" "}
            <a className="font-semibold text-magenta-bright" href={`mailto:${db.settings.supportEmail}`}>{db.settings.supportEmail}</a>.
          </p>
        </div>
      </section>
    );
  }

  /* The first question — "What do you want to register for?" Two doors, one standard. */
  if (side === null) {
    const skillsOpen = TRACKS.some((track) => (db.programmes.find((p) => p.key === track.key)?.status ?? "waitlist") === "open");
    return (
      <section className="shell py-12 sm:py-16">
        <SectionIndex index="Registration" label="Two doors, one standard" />
        <h1 className="display display-lg mt-4 max-w-[22ch]">What do you want to register for?</h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
          Everything KR8 Academy offers is tuition-free and ends in a verifiable certificate — never a participation
          ribbon. Pick the door that fits you. You can take the other door later.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {/* Digital skills door */}
          <button
            type="button"
            onClick={() => setSide("skill")}
            className="group flex flex-col rounded-3xl border border-white/10 bg-raised p-6 text-left transition hover:border-magenta/50 hover:bg-cream-lift sm:p-7"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-magenta/15 text-magenta-bright transition group-hover:scale-105">
              <Rocket size={22} />
            </span>
            <span className="mt-5 flex flex-wrap items-center gap-2">
              <span className="display text-xl font-semibold leading-tight">A digital skill</span>
              <span className={cn("rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em]", skillsOpen ? "bg-live/15 text-live" : "bg-warn/15 text-warn")}>
                {skillsOpen ? "Open now" : "Waitlist open"}
              </span>
            </span>
            <span className="mt-2.5 text-[13.5px] leading-relaxed text-muted">
              Video editing, graphic design and website design — the three tracks in the next intake. Full
              registration opens around <span className="font-semibold text-white">March–April 2027</span>; classes
              begin <span className="font-semibold text-white">3 May 2027</span>. Join the waitlist now and you hear
              first — with a priority window before the public.
            </span>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-magenta-bright">
              Take the skills door <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>

          {/* Academics door */}
          <button
            type="button"
            onClick={() => setSide("academic")}
            className="group flex flex-col rounded-3xl border border-white/10 bg-raised p-6 text-left transition hover:border-cyan/40 hover:bg-cream-lift sm:p-7"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan/10 text-cyan transition group-hover:scale-105">
              <GraduationCap size={22} />
            </span>
            <span className="mt-5 flex flex-wrap items-center gap-2">
              <span className="display text-xl font-semibold leading-tight">Academics</span>
              <span className="rounded-full bg-live/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-live">
                Open now · starts January
              </span>
            </span>
            <span className="mt-2.5 text-[13.5px] leading-relaxed text-muted">
              For students preparing for <span className="font-semibold text-white">UTME/JAMB, WAEC, NECO</span> or any
              other exam — and for anyone not writing one yet. In SS1? Join now and get ahead of your SS3 exam.
              Delivered with <span className="font-semibold text-white">{db.settings.partnerName}</span>; classes run
              Monday, Wednesday and Friday, 8–9pm WAT.
            </span>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-cyan">
              Take the academics door <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        </div>

        <p className="mt-8 max-w-md text-[11px] leading-relaxed text-muted">
          KR8 is not limited to Nigeria or any city — students join from anywhere. No fees, no exceptions. If anyone
          asks you to pay, it is not us.
        </p>
      </section>
    );
  }

  const headline = side === "academic" ? "Apply for Academics." : "Apply for your free seat.";
  const lede =
    side === "academic"
      ? "Three short steps. Choose your class level, the exam you are preparing for and your subjects — we will take it from there. Open to SS1 through university graduates retaking exams."
      : "Three short steps. No fee, no test, no portfolio needed — just tell us who you are and what you want to build.";

  return (
    <section className="shell py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div>
          <SectionIndex index="Application" label={side === "academic" ? `KR8 Academics · ${db.settings.partnerName}` : db.settings.cohortName} />
          <h1 className="display display-lg mt-4 max-w-[16ch]">{headline}</h1>
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-muted">{lede}</p>
          {side === "academic" && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
              <GraduationCap size={12} className="text-cyan" /> Delivered with {db.settings.partnerName}
            </p>
          )}
          <h1 className="display display-lg mt-4 max-w-[16ch]">Apply for your free seat.</h1>
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-muted">
            Three short steps. No fee, no test, no portfolio needed — just tell us who you are and what you want
            to build.
          </p>

          {/* Stepper */}
          <div className="mt-7 flex items-center gap-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold transition",
                    item < step ? "bg-magenta-fill text-white" : item === step ? "bg-magenta-fill text-white" : "border border-white/15 text-muted-2"
                  )}
                >
                  {item < step ? <Check size={13} /> : item}
                </span>
                <span className={cn("hidden text-[11px] font-medium sm:block", item === step ? "text-white" : "text-muted")}>
                  {item === 1 ? "About you" : item === 2 ? "Your track" : "Secure it"}
                </span>
                {item < 3 && <span className={cn("h-px flex-1", item < step ? "bg-magenta-fill" : "bg-white/10")} />}
              </div>
            ))}
          </div>

          <form onSubmit={submit} className="mt-7">
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" htmlFor="name" error={errors.name}>
                    <Input id="name" value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Amaka Obi" autoComplete="name" error={!!errors.name} />
                  </Field>
                  <Field label="Email address" htmlFor="email" error={errors.email}>
                    <Input id="email" type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" autoComplete="email" error={!!errors.email} />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
                  <Field label="Dial code" htmlFor="dial">
                    <Select id="dial" value={draft.dial} onChange={(e) => set("dial", e.target.value)}>
                      {COUNTRIES.map((country) => (
                        <option key={`${country.code}-${country.dial}`} value={country.dial}>
                          {country.code} {country.dial}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Phone (WhatsApp preferred)" htmlFor="phone" error={errors.phone} hint="Used for session reminders. Never shared publicly.">
                    <Input id="phone" value={draft.phone} onChange={(e) => set("phone", e.target.value.replace(/[^\d\s]/g, ""))} placeholder="812 345 6789" inputMode="tel" autoComplete="tel" error={!!errors.phone} />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Country" htmlFor="country" error={errors.country}>
                    <Select id="country" value={draft.country} onChange={(e) => {
                      const country = COUNTRIES.find((c) => c.code === e.target.value);
                      set("country", e.target.value);
                      if (country) set("dial", country.dial);
                    }}>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.code === "OTHER" ? country.name : `${country.code} · ${country.name}`}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="City" htmlFor="city" optional>
                    <Input id="city" value={draft.city} onChange={(e) => set("city", e.target.value)} placeholder="Aba" autoComplete="address-level2" />
                  </Field>
                </div>
              </div>
            )}

            {step === 2 && side === "skill" && (
              <div className="space-y-4">
                <div>
                  <p className="field-label">Pick your track</p>
                  {errors.trackKey && <p className="mb-2 text-xs font-medium text-danger">{errors.trackKey}</p>}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {TRACKS.map((track) => {
                      const active = draft.trackKey === track.key;
                      const programme = programmeFor(track.key);
                      const status = programme?.status ?? "open";
                      const selectable = status !== "closed";
                      return (
                        <button
                          key={track.key}
                          type="button"
                          disabled={!selectable}
                          onClick={() => set("trackKey", track.key)}
                          className={cn(
                            "flex items-start gap-2.5 rounded-xl border p-3 text-left transition",
                            !selectable && "cursor-not-allowed opacity-45",
                            active ? "border-magenta bg-magenta/10 ring-1 ring-magenta/25" : "border-white/12 bg-raised hover:border-white/30"
                          )}
                        >
                          <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full" style={{ background: track.accent }} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[12.5px] font-semibold leading-tight">{track.name}</span>
                            <span className="mt-0.5 block text-[10px] text-muted">{track.duration} · {track.level}</span>
                            <span
                              className={cn(
                                "mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]",
                                status === "open" && "bg-live/15 text-live",
                                status === "waitlist" && "bg-warn/15 text-warn",
                                status === "closed" && "bg-white/10 text-muted"
                              )}
                            >
                              {status === "open" ? "Open" : status === "waitlist" ? "Waitlist" : "Not in next intake"}
                            </span>
                          </span>
                          <span className={cn("mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border", active ? "border-magenta bg-magenta-fill text-white" : "border-white/25")}>
                            {active && <Check size={10} strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {!db.settings.registrationOpen && (
                    <p className="mt-2 rounded-lg bg-warn/12 px-3 py-2 text-[11px] text-warn">
                      Admissions are paused — your application will join the waitlist and keep priority for the next
                      intake.
                    </p>
                  )}
                </div>


                {skillRegistrationBlocked && skillProgramme && (
                  <div className="rounded-2xl border border-warn/30 bg-warn/8 p-4">
                    <p className="flex items-center gap-2 text-[12px] font-semibold text-warn">
                      <Hourglass size={14} /> {skillProgramme.status === "waitlist" ? "This track is on the waitlist" : "This track is closed"}
                    </p>
                    {skillProgramme.opensAt && (
                      <div className="mt-3">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-warn/80">Registration opens in</p>
                        <Countdown to={skillProgramme.opensAt} />
                      </div>
                    )}
                    <p className="mt-3 text-[11.5px] leading-relaxed text-body">{skillProgramme.note}</p>
                    {skillProgramme.status === "waitlist" &&
                      (waitlist.joined ? (
                        <p className="mt-3 flex items-center gap-2 rounded-lg bg-live/10 px-3 py-2 text-[12px] font-semibold text-live">
                          <CheckCircle2 size={14} />
                          {waitlist.duplicate
                            ? "You are already on the waitlist."
                            : "You are on the waitlist. We will email you the moment registration opens."}
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          <button type="button" className="btn btn-primary btn-sm" disabled={waitlist.busy} onClick={joinTrackWaitlist}>
                            {waitlist.busy ? <Loader2 size={14} className="spin" /> : <Hourglass size={13} />}
                            Join the waitlist{draft.name.trim() ? ` — ${draft.name.trim().split(" ")[0]}` : ""}
                          </button>
                          <p className="text-[10px] leading-relaxed text-muted">
                            Name, email and WhatsApp from step 1 are used. Waitlisted students get a priority window of{" "}
                            {db.settings.waitlistPriorityHours} hours before the public.
                          </p>
                          {waitlist.error && <p className="text-[11px] font-medium text-danger">{waitlist.error}</p>}
                        </div>
                      ))}
                  </div>
                )}

                <Field label="Where are you starting from?" htmlFor="experience">
                  <Select id="experience" value={draft.experience} onChange={(e) => set("experience", e.target.value)}>
                    {EXPERIENCE.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="What do you want to build with this skill?"
                  htmlFor="motivation"
                  error={errors.motivation}
                  hint="One or two honest sentences. This is the whole application."
                >
                  <Textarea
                    id="motivation"
                    value={draft.motivation}
                    onChange={(e) => set("motivation", e.target.value)}
                    placeholder="I want to design brand identities for small businesses in my city and eventually work with clients abroad."
                    maxLength={600}
                    error={!!errors.motivation}
                  />
                </Field>
                <p className="text-right text-[10px] text-muted">{draft.motivation.length}/600</p>
              </div>
            )}


            {step === 2 && side === "academic" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Class level" htmlFor="classLevel" error={errors.academicClassLevel} hint="SS1 to SS3 — join any time.">
                    <Select id="classLevel" value={draft.academicClassLevel} onChange={(e) => set("academicClassLevel", e.target.value)} error={!!errors.academicClassLevel}>
                      <option value="">Select your level…</option>
                      {CLASS_LEVELS.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Exam you are preparing for" htmlFor="exam">
                    <Select id="exam" value={draft.academicExam} onChange={(e) => set("academicExam", e.target.value as AcademicExam)}>
                      {EXAM_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
                {draft.academicExam === "other" && (
                  <Field label="Which exam?" htmlFor="otherExam" error={errors.academicOtherExam}>
                    <Input id="otherExam" value={draft.academicOtherExam} onChange={(e) => set("academicOtherExam", e.target.value)} placeholder="e.g. Post-UTME screening…" error={!!errors.academicOtherExam} />
                  </Field>
                )}

                <div>
                  <p className="field-label">Your combination</p>
                  <div className="grid grid-cols-3 gap-2">
                    {COMBINATION_OPTIONS.map((option) => {
                      const active = draft.combination === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => set("combination", option.value)}
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-left transition",
                            active ? "border-cyan bg-cyan/10 ring-1 ring-cyan/30" : "border-white/12 bg-raised hover:border-white/30"
                          )}
                        >
                          <span className="block text-[12px] font-semibold">{option.label}</span>
                          <span className="mt-1 block text-[9.5px] leading-snug text-muted">{option.blurb}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="field-label">
                    {draft.academicExam === "not_writing" ? "Subjects you want to strengthen" : "Your subjects"}{" "}
                    <span className="font-normal text-muted">· up to 4{draft.academicExam === "not_writing" ? ", optional" : ""}</span>
                  </p>
                  {errors.subjects && <p className="mb-2 text-xs font-medium text-danger">{errors.subjects}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {subjectPool.map((subject) => {
                      const active = draft.subjects.includes(subject);
                      const disabled = !active && draft.subjects.length >= 4;
                      return (
                        <button
                          key={subject}
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            set(
                              "subjects",
                              active ? draft.subjects.filter((item) => item !== subject) : [...draft.subjects, subject]
                            )
                          }
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-[11px] transition",
                            active
                              ? "border-cyan bg-cyan/15 font-semibold text-cyan"
                              : disabled
                                ? "cursor-not-allowed border-white/8 text-muted-2/50"
                                : "border-white/12 text-muted hover:border-white/30 hover:text-white"
                          )}
                        >
                          {subject}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Field
                  label="What do you want to achieve here?"
                  htmlFor="motivation"
                  error={errors.motivation}
                  hint="One or two honest sentences — UTME, WAEC, NECO, or building a strong foundation ahead of your exam."
                >
                  <Textarea
                    id="motivation"
                    value={draft.motivation}
                    onChange={(e) => set("motivation", e.target.value)}
                    placeholder="I want to score 300+ in UTME and get into Medicine. I'm in SS2 now and I don't want to cram in SS3."
                    maxLength={600}
                    error={!!errors.motivation}
                  />
                </Field>
                <p className="text-right text-[10px] text-muted">{draft.motivation.length}/600</p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Date of birth" htmlFor="dob" error={errors.dob} hint="You must be 16 or older.">
                    <Input id="dob" type="date" value={draft.dob} onChange={(e) => set("dob", e.target.value)} max={new Date().toISOString().slice(0, 10)} error={!!errors.dob} />
                  </Field>
                  <div className="rounded-xl border border-white/10 bg-raised p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">You are applying for</p>
                    <p className="mt-1 text-[13px] font-semibold">
                      {side === "academic" ? `Academics · ${db.settings.partnerName}` : selectedTrack?.name ?? "—"}
                    </p>
                    <p className="text-[11px] text-muted">{side === "academic" ? "Starts January · ₦0 tuition" : `${db.settings.cohortName} · ₦0 tuition`}</p>
                  </div>
                </div>

                <Field label="Create a password" htmlFor="password" error={errors.password} hint="At least 8 characters. You will use this to sign in.">
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      value={draft.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="pr-11"
                      error={!!errors.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-2 hover:bg-white/8 hover:text-white"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>

                {draft.password && (
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={cn("h-1 flex-1 rounded-full", n <= strength.score ? "bg-magenta-fill" : "bg-white/10")} />
                      ))}
                    </div>
                    <span className="text-[10px] font-medium text-muted">{strength.label}</span>
                  </div>
                )}

                <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
                  <Input
                    id="confirm"
                    type={showPw ? "text" : "password"}
                    value={draft.confirm}
                    onChange={(e) => set("confirm", e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    error={!!errors.confirm}
                  />
                </Field>

                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/10 bg-raised p-3">
                  <input
                    type="checkbox"
                    checked={draft.terms}
                    onChange={(e) => set("terms", e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#3d1250]"
                  />
                  <span className="text-[11.5px] leading-relaxed text-body">
                    I commit to attending the live sessions, submitting weekly work, and using what I learn
                    honestly. I understand that tuition is free and my seat can be released for non-attendance.
                  </span>
                </label>
                {errors.terms && <p className="text-xs font-medium text-danger">{errors.terms}</p>}
              </div>
            )}

            <div className="mt-7 flex items-center justify-between gap-3">
              {step > 1 ? (
                <button type="button" className="btn btn-ghost" onClick={goBack}>
                  <ArrowLeft size={15} /> Back
                </button>
              ) : (
                <Link to="/tracks" className="text-[12px] font-medium text-muted hover:text-white">
                  Cancel
                </Link>
              )}

              {step < 3 ? (
                <button type="button" className="btn btn-primary" onClick={goNext}>
                  Continue <ArrowRight size={15} />
                </button>
              ) : (
                <button type="submit" className="btn btn-accent" disabled={busy}>
                  {busy ? <Loader2 size={16} className="spin" /> : <Lock size={15} />}
                  Submit application
                </button>
              )}
            </div>
          </form>

          <p className="mt-5 flex items-center gap-1.5 text-[11px] text-muted">
            <ShieldCheck size={12} /> Your details stay private. No third-party tracking.
          </p>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="ink-panel rounded-2xl p-6">
            <div className="flex items-center gap-2 text-white/60">
              <Sparkles size={14} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">What happens next</p>
            </div>
            <div className="mt-4 space-y-4">
              {(side === "academic"
                ? [
                    { title: "Your KR8 ID, instantly", body: "The moment you submit, your permanent student identity is issued — awards and certificates are only given to verified KR8 IDs." },
                    { title: "Join in January", body: "Academic training begins in January and students may join any time — even years before SS3." },
                    { title: "Your weekly rhythm", body: "Classes Monday, Wednesday and Friday 8–9pm WAT; assignments Tuesday, Thursday and Saturday. Attendance and assignments are recorded and visible to you and your coach." },
                  ]
                : [
                    { title: "Your KR8 ID, instantly", body: "The moment you submit, your permanent student identity is issued." },
                    { title: "A 48-hour decision", body: "Applications are reviewed in order. If seats are open, you are in." },
                    { title: "Onboarding", body: "Live onboarding with your mentor and cohort on 30 April, before classes begin on 3 May." },
                  ]).map((item, index) => (
                <div key={item.title} className="flex gap-3">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/12 text-[10px] font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[12.5px] font-medium text-white">{item.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-white/55">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-white/12 bg-white/[0.05] p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white">
                <BadgeCheck size={13} className="text-magenta-bright" /> 100% free, always
              </p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-white/55">
                No tuition, no graduation fee, no certificate fee. If anyone asks you to pay for a seat, report it.
              </p>
            </div>
          </div>

          {selectedTrack && side === "skill" && (
            <div className="mt-4 card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Your mentor</p>
              <div className="mt-2.5 flex items-center gap-2.5">
                <Avatar
                  name={MENTORS.find((m) => m.key === selectedTrack.mentorKey)?.name ?? "KR8"}
                  src={MENTORS.find((m) => m.key === selectedTrack.mentorKey)?.photo}
                  size={38}
                />
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold">
                    {MENTORS.find((m) => m.key === selectedTrack.mentorKey)?.shortName}
                  </p>
                  <p className="truncate text-[10px] text-muted">
                    {MENTORS.find((m) => m.key === selectedTrack.mentorKey)?.role}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Pill>{selectedTrack.duration}</Pill>
                <Pill>{selectedTrack.level}</Pill>
                <Pill tone="live">Free</Pill>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
