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
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { TRACKS, MENTORS, trackByKey } from "../data/academy";
import { useAuth } from "../lib/auth";
import { useDb } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { useToast } from "../lib/toast";
import { ageFromDob, cn, copyToClipboard, isValidEmail, isValidPhone, passwordStrength } from "../lib/utils";
import { Avatar, ButtonLink, Field, Input, Pill, Select, Textarea } from "../components/ui";
import { SectionIndex } from "../components/sections";
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
};

const DRAFT_KEY = "kr8.academy.apply.draft";

type Errors = Partial<Record<keyof Draft, string>>;

export default function Apply() {
  const [params] = useSearchParams();
  const db = useDb();
  const { student, signUp } = useAuth();
  const toast = useToast();

  useSeo({
    title: "Apply to KR8 Academy — free cohort application",
    description:
      "Apply for a free seat in the next KR8 Academy cohort. Three minutes, no fees, and a verifiable KR8 ID if your application is accepted.",
    path: "/apply",
  });

  const [draft, setDraft] = useState<Draft>(() => {
    const initial = { ...EMPTY, trackKey: params.get("track") ?? "" };
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Draft) };
    } catch {
      /* noop */
    }
    return initial;
  });
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState<{ id: string; pending: boolean } | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* noop */
    }
  }, [draft]);

  const selectedTrack: Track | undefined = useMemo(() => trackByKey(draft.trackKey), [draft.trackKey]);
  const strength = passwordStrength(draft.password);

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
      if (!draft.trackKey) next.trackKey = "Choose the track you want to join.";
      if (draft.motivation.trim().length < 20) next.motivation = "Tell us at least a sentence or two (20+ characters).";
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
    const result = await signUp({
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: `${draft.dial}${draft.phone.replace(/^0+/, "")}`,
      country: draft.country,
      trackKey: draft.trackKey,
      dob: draft.dob,
      password: draft.password,
      motivation: draft.motivation.trim(),
      experience: draft.experience,
      city: draft.city.trim(),
    });
    setBusy(false);
    if (!result.ok || !result.student) {
      toast.error("Application not submitted", result.error ?? "Please check your details and try again.");
      setErrors({ email: result.error?.toLowerCase().includes("email") ? result.error : undefined, phone: result.error?.toLowerCase().includes("phone") ? result.error : undefined });
      return;
    }
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* noop */
    }
    setDone({ id: result.student.id, pending: result.student.status === "pending" });
    toast.success("Application received", "Your KR8 ID has been issued.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (student && !done) {
    return (
      <section className="shell py-20 text-center">
        <CheckCircle2 size={30} className="mx-auto text-plum" />
        <h1 className="display display-md mt-4">You already have a seat.</h1>
        <p className="lede mx-auto mt-3 max-w-md">
          You are signed in as <span className="font-semibold text-ink">{student.name}</span> ({student.id}). Head to your dashboard to
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
          <div className="rounded-3xl border border-ink/10 bg-cream p-6 shadow-[0_30px_80px_-60px_rgba(20,15,26,0.6)] sm:p-9">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <Check size={22} strokeWidth={2.5} />
            </span>
            <h1 className="display display-lg mt-5">
              {done.pending ? "You’re on the list." : "You’re in."}
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              {done.pending
                ? "Admissions are currently paused, so your seat is on the waitlist. You can already sign in — we will activate your cohort access as soon as a seat opens."
                : `Your seat on the ${track?.name ?? "cohort"} track is confirmed. Orientation starts ${new Date(db.settings.cohortStart).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}.`}
            </p>

            <div className="mt-6 rounded-2xl border border-ink/10 bg-paper p-4">
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
                public verification page.
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              {[
                "Check your inbox for the welcome note (and your spam folder, just in case).",
                "Join the cohort WhatsApp community for session links and reminders.",
                "Come to orientation with a laptop and one sentence about what you want to build.",
              ].map((item, index) => (
                <div key={item} className="flex gap-2.5 text-[12.5px]">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink text-[10px] font-semibold text-paper">
                    {index + 1}
                  </span>
                  <p className="text-ink/75">{item}</p>
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
            <a className="font-semibold text-magenta" href={`mailto:${db.settings.supportEmail}`}>{db.settings.supportEmail}</a>.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="shell py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div>
          <SectionIndex index="Application" label={db.settings.cohortName} />
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
                    item < step ? "bg-plum text-paper" : item === step ? "bg-ink text-paper" : "border border-ink/15 text-ink/40"
                  )}
                >
                  {item < step ? <Check size={13} /> : item}
                </span>
                <span className={cn("hidden text-[11px] font-medium sm:block", item === step ? "text-ink" : "text-muted")}>
                  {item === 1 ? "About you" : item === 2 ? "Your track" : "Secure it"}
                </span>
                {item < 3 && <span className={cn("h-px flex-1", item < step ? "bg-plum" : "bg-ink/12")} />}
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
                          {country.flag} {country.dial}
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
                          {country.flag} {country.name}
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

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <p className="field-label">Pick your track</p>
                  {errors.trackKey && <p className="mb-2 text-xs font-medium text-red-600">{errors.trackKey}</p>}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {TRACKS.map((track) => {
                      const active = draft.trackKey === track.key;
                      return (
                        <button
                          key={track.key}
                          type="button"
                          onClick={() => set("trackKey", track.key)}
                          className={cn(
                            "flex items-start gap-2.5 rounded-xl border p-3 text-left transition",
                            active ? "border-plum bg-plum/[0.05] ring-1 ring-plum/20" : "border-ink/12 bg-cream hover:border-ink/30"
                          )}
                        >
                          <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full" style={{ background: track.accent }} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[12.5px] font-semibold leading-tight">{track.name}</span>
                            <span className="mt-0.5 block text-[10px] text-muted">{track.duration} · {track.level}</span>
                          </span>
                          <span className={cn("mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border", active ? "border-plum bg-plum text-paper" : "border-ink/25")}>
                            {active && <Check size={10} strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {!db.settings.registrationOpen && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                      Admissions are paused — your application will join the waitlist and keep priority for the next
                      intake.
                    </p>
                  )}
                </div>

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

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Date of birth" htmlFor="dob" error={errors.dob} hint="You must be 16 or older.">
                    <Input id="dob" type="date" value={draft.dob} onChange={(e) => set("dob", e.target.value)} max={new Date().toISOString().slice(0, 10)} error={!!errors.dob} />
                  </Field>
                  <div className="rounded-xl border border-ink/10 bg-paper-2 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">You are applying for</p>
                    <p className="mt-1 text-[13px] font-semibold">{selectedTrack?.name ?? "—"}</p>
                    <p className="text-[11px] text-muted">{db.settings.cohortName} · ₦0 tuition</p>
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
                      className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-ink/40 hover:bg-ink/5 hover:text-ink"
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
                        <span key={n} className={cn("h-1 flex-1 rounded-full", n <= strength.score ? "bg-plum" : "bg-ink/10")} />
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

                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-ink/10 bg-cream p-3">
                  <input
                    type="checkbox"
                    checked={draft.terms}
                    onChange={(e) => set("terms", e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#3d1250]"
                  />
                  <span className="text-[11.5px] leading-relaxed text-ink/70">
                    I commit to attending the live sessions, submitting weekly work, and using what I learn
                    honestly. I understand that tuition is free and my seat can be released for non-attendance.
                  </span>
                </label>
                {errors.terms && <p className="text-xs font-medium text-red-600">{errors.terms}</p>}
              </div>
            )}

            <div className="mt-7 flex items-center justify-between gap-3">
              {step > 1 ? (
                <button type="button" className="btn btn-ghost" onClick={goBack}>
                  <ArrowLeft size={15} /> Back
                </button>
              ) : (
                <Link to="/tracks" className="text-[12px] font-medium text-muted hover:text-ink">
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
            <ShieldCheck size={12} /> Your details stay in this browser in this demo build. No third-party tracking.
          </p>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="ink-panel rounded-2xl p-6">
            <div className="flex items-center gap-2 text-paper/60">
              <Sparkles size={14} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">What happens next</p>
            </div>
            <div className="mt-4 space-y-4">
              {[
                { title: "Your KR8 ID, instantly", body: "The moment you submit, your permanent student identity is issued." },
                { title: "A 48-hour decision", body: "Applications are reviewed in order. If seats are open, you are in." },
                { title: "Orientation", body: "Live onboarding with your mentor and cohort before week one begins." },
              ].map((item, index) => (
                <div key={item.title} className="flex gap-3">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-paper/12 text-[10px] font-semibold text-paper">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[12.5px] font-medium text-paper">{item.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-paper/55">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-paper/12 bg-paper/[0.05] p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-paper">
                <BadgeCheck size={13} className="text-magenta" /> 100% free, always
              </p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-paper/55">
                No tuition, no graduation fee, no certificate fee. If anyone asks you to pay for a seat, report it.
              </p>
            </div>
          </div>

          {selectedTrack && (
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
