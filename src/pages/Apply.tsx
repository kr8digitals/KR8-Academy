import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { saveRegistration } from "../lib/registrar";
import type { AcademicExam } from "../lib/types";
import {
  buildCloudRegistration,
  emptyRegistrationDetails,
  normalizeRegisterPhone,
  REGISTRATION_DRAFT_KEY,
  validateAdditional,
  validateEducation,
  validateIdentity,
  validateLocation,
  validatePathway,
  type RegistrationDetails,
} from "../lib/registration";
import { cn, copyToClipboard, passwordStrength } from "../lib/utils";
import { Avatar, ButtonLink, Field, Input, Pill } from "../components/ui";
import {
  RegistrationAcademicFields,
  RegistrationAdditionalFields,
  RegistrationEducationFields,
  RegistrationIdentityFields,
  RegistrationLocationFields,
  RegistrationObjectivesField,
  RegistrationSkillFields,
  RegSection,
} from "../components/registration";
import { Countdown, SectionIndex } from "../components/sections";
import { Laptop, UserRound } from "lucide-react";
import type { Track } from "../data/academy";
import type { RegistrationSide } from "../lib/registration";

export default function Apply() {
  const [params] = useSearchParams();
  const db = useDb();
  const { student, signUp } = useAuth();
  const toast = useToast();

  useSeo({
    title: "Register — free seat at KR8 Academy",
    description:
      "Register for the next KR8 Academy cohort. Two doors — digital skills or academics — one standard: tuition-free, verifiable certificate.",
    path: "/apply",
  });

  const doorParam = params.get("door");
  const [side, setSide] = useState<RegistrationSide | null>(() => {
    if (doorParam === "academic") return "academic";
    if (doorParam === "skill") return "skill";
    if (params.get("track")) return "skill";
    return null;
  });
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<RegistrationDetails>(() => {
    const requested = params.get("track") ?? "";
    const fromLink = trackByKey(requested) ? [requested] : [];
    try {
      /* One-time migration: sweep the pre-rebuild draft so stale copies never resurrect. */
      window.sessionStorage.removeItem("kr8.academy.apply.draft");
      const raw = window.sessionStorage.getItem(REGISTRATION_DRAFT_KEY);
      if (raw) {
        const saved = { ...emptyRegistrationDetails(), ...(JSON.parse(raw) as Partial<RegistrationDetails>) };
        return fromLink.length ? { ...saved, skills: fromLink } : saved;
      }
    } catch {
      /* noop */
    }
    return { ...emptyRegistrationDetails(), skills: fromLink };
  });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState<{ id: string; pending: boolean; waitlisted: boolean; side: RegistrationSide } | null>(null);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(REGISTRATION_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* noop */
    }
  }, [draft]);

  const programmeFor = (key: string) => db.programmes.find((programme) => programme.key === key);
  const primaryTrack: Track | undefined = useMemo(
    () => (draft.skills[0] ? trackByKey(draft.skills[0]) : undefined),
    [draft.skills]
  );
  const strength = passwordStrength(password);
  const skillWaitlisted =
    side === "skill" && draft.skills.length > 0 && draft.skills.every((key) => programmeFor(key)?.status === "waitlist");
  const waitlistOpensAt = draft.skills.map((key) => programmeFor(key)?.opensAt).find(Boolean);

  function set<K extends keyof RegistrationDetails>(key: K, value: RegistrationDetails[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  const STEP_LABELS = side === "academic" ? ["You", "Education", "Academics", "Secure it"] : ["You", "Education", "Skills", "Secure it"];

  function validateStep(current: number): boolean {
    let found: Record<string, string> = {};
    if (current === 1) found = { ...validateIdentity(draft), ...validateLocation(draft) };
    else if (current === 2) found = validateEducation(draft);
    else if (current === 3) found = validatePathway(draft, side ?? "skill");
    else {
      found = { ...validateAdditional(draft) };
      if (password.length < 8) found.password = "Use at least 8 characters.";
      if (confirm !== password) found.confirm = "Passwords do not match.";
    }
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) {
      toast.error("A few details are missing", "Check the highlighted fields and try again.");
      return;
    }
    setStep((s) => Math.min(4, s + 1));
    window.scrollTo({ top: 96, behavior: "smooth" });
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 96, behavior: "smooth" });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!validateStep(4)) {
      toast.error("A few details are missing", "Check the highlighted fields and try again.");
      return;
    }
    setBusy(true);
    const phone = normalizeRegisterPhone(draft.dial, draft.phone);
    const result = await signUp({
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone,
      country: draft.country,
      trackKey: side === "academic" ? "academic" : draft.skills[0],
      dob: draft.dob,
      password,
      motivation: draft.learningObjectives.trim(),
      experience: side === "academic" ? "Preparing for exams" : draft.experienceLevel,
      city: draft.city.trim(),
      side: side ?? "skill",
      allowWaitlist: true,
      academic:
        side === "academic"
          ? {
              classLevel: draft.academicClassLevel,
              exam: (draft.examTargets[0] ?? "other") as AcademicExam,
              otherExam: draft.examTargets.includes("other") ? draft.otherExam.trim() : undefined,
              combination: draft.combination,
              subjects: draft.subjects,
            }
          : undefined,
    });

    if (!result.ok || !result.student) {
      setBusy(false);
      toast.error("Registration not completed", result.error ?? "Please check your details and try again.");
      const message = result.error ?? "";
      const nextErrors: Record<string, string> = {};
      if (message.toLowerCase().includes("email")) nextErrors.email = message;
      if (message.toLowerCase().includes("phone")) nextErrors.phone = message;
      setErrors(nextErrors);
      return;
    }

    /* Save the full application packet alongside the student account. */
    const row = buildCloudRegistration(draft, side ?? "skill", result.student.id);
    const { saved } = await saveRegistration(row);

    try {
      window.sessionStorage.removeItem(REGISTRATION_DRAFT_KEY);
    } catch {
      /* non-fatal */
    }
    setBusy(false);
    setDone({
      id: result.student.id,
      pending: result.student.status === "pending",
      waitlisted: Boolean(side === "skill" && primaryTrack && programmeFor(primaryTrack.key)?.status === "waitlist"),
      side: side ?? "skill",
    });
    if (saved) {
      toast.success("Application received", "Your details are saved and your KR8 ID is ready.");
    } else {
      toast.error("Application needs attention", "Your KR8 ID is ready, but we couldn't save the full application packet. Please contact the Academy team.");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* Already signed in — no duplicate registrations. */
  if (student && !done) {
    return (
      <section className="shell py-20 text-center">
        <CheckCircle2 size={30} className="mx-auto text-magenta-bright" />
        <h1 className="display display-md mt-4">You already have a seat.</h1>
        <p className="lede mx-auto mt-3 max-w-md">
          You are signed in as <span className="font-semibold text-ink">{student.name}</span> ({student.id}). Head to your dashboard to
          continue the cohort.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <ButtonLink to="/dashboard" variant="primary">Open dashboard</ButtonLink>
          <ButtonLink to="/skills" variant="ghost">Browse the skills</ButtonLink>
        </div>
      </section>
    );
  }

  if (done) {
    const track = done.side === "skill" ? trackByKey(draft.skills[0] ?? "") : undefined;
    return (
      <section className="shell py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="card-xl p-6 sm:p-9">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-live/15 text-live">
              <Check size={22} strokeWidth={2.5} />
            </span>
            <h1 className="display display-lg mt-5">
              {done.pending ? "You're on the list." : "You're in."}
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-body">
              {done.side === "academic" ? (
                <>
                  Welcome to <span className="font-semibold text-ink">KR8 Academics</span>, delivered with{" "}
                  <span className="font-semibold text-ink">{db.settings.partnerName}</span>. Training starts in{" "}
                  <span className="font-semibold text-ink">January</span> and you can join at any time — even years
                  before you sit your exam. Your onboarding details arrive by email and WhatsApp.
                </>
              ) : done.pending ? (
                "Admissions are currently paused, so your seat is on the waitlist. You can already sign in — we will activate your cohort access as soon as a seat opens."
              ) : done.waitlisted ? (
                <>
                  Your registration is recorded, <span className="font-semibold text-ink">{draft.name.trim().split(" ")[0]}</span>. Skills
                  registration opens around <span className="font-semibold text-ink">March–April 2027</span> — you are
                  ahead of the public queue, and onboarding links, class times and your track allocation arrive by
                  email, SMS and WhatsApp.
                </>
              ) : (
                `Your seat on the ${track?.name ?? "cohort"} track is confirmed. Onboarding and classes follow the cohort calendar.`
              )}
            </p>

            <div className="mt-6 rounded-2xl border border-line bg-cream p-4">
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
                This is your permanent student identity. It appears on your dashboard, your certificate and the public
                verification page.{done.side === "academic" ? " UTME awards and certificates are only awarded to verified KR8 identity holders." : ""}
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

  /* The two doors — unmistakable CTAs, never decorative cards. */
  if (side === null) {
    const skillsOpen = TRACKS.some((track) => (db.programmes.find((p) => p.key === track.key)?.status ?? "waitlist") === "open");
    return (
      <section className="relative overflow-hidden on-dark">
        <img
          src="/media/hero-apply.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[58%_38%]"
        />
        <div className="absolute inset-0 bg-[#07050f]/62" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07050f]/85 via-[#07050f]/20 to-[#07050f]/35" aria-hidden="true" />
        <div className="shell relative py-16 sm:py-24">
          <SectionIndex index="Registration" label="Two doors, one standard" />
          <h1 className="display display-lg mt-4 max-w-[22ch] text-white">What do you want to register for?</h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/72">
            Everything KR8 Academy offers is tuition-free and ends in a verifiable certificate — never a participation
            ribbon. Pick the door that fits you; both are the same registration, just pointed at different rooms.
          </p>

          <div className="door-grid mt-10">
            {/* ——— Digital Skills ——— */}
            <button
              type="button"
              onClick={() => setSide("skill")}
              className="door-cta door-cta-skill group"
              aria-label="Register for Digital Skills"
            >
              <span className="door-seal" aria-hidden="true">
                <Rocket size={30} strokeWidth={1.6} />
              </span>
              <span className="door-kicker">Digital Skills · three tracks</span>
              <span className="door-title">A digital skill</span>
              <span className="door-desc">
                Video editing, graphic design and website design — the three skills in the next intake. Registration
                opens around <span className="door-desc-strong">March–April 2027</span>; classes begin{" "}
                <span className="door-desc-strong">3 May 2027</span>. Register now and be first through the door —
                ahead of the public queue.
              </span>
              <span className="door-meta">
                <span className="door-chip door-chip-waitlist">{skillsOpen ? "Open now" : "Opens Mar–Apr 2027"}</span>
                <span className="door-chip">₦0 tuition</span>
                <span className="door-chip">Verifiable certificate</span>
              </span>
              <span className="door-foot">
                Continue to Digital Skills
                <ArrowRight size={18} strokeWidth={2} className="door-arrow" aria-hidden="true" />
              </span>
            </button>

            {/* ——— Academics ——— */}
            <button
              type="button"
              onClick={() => setSide("academic")}
              className="door-cta door-cta-academic group"
              aria-label="Register for Academics"
            >
              <span className="door-seal" aria-hidden="true">
                <GraduationCap size={30} strokeWidth={1.6} />
              </span>
              <span className="door-kicker">Academics · UTME · WAEC · NECO</span>
              <span className="door-title">Academic excellence</span>
              <span className="door-desc">
                Coaching for <span className="door-desc-strong">UTME/JAMB, WAEC, NECO</span> and the school you are
                already in — any class level, even SS1, even if you are not writing yet. Delivered with{" "}
                <span className="door-desc-strong">{db.settings.partnerName}</span>; live every week.
              </span>
              <span className="door-meta">
                <span className="door-chip door-chip-open">Open now · starts January</span>
                <span className="door-chip">₦0 tuition</span>
                <span className="door-chip">Mon · Wed · Fri 8–9pm WAT</span>
              </span>
              <span className="door-foot">
                Continue to Academics
                <ArrowRight size={18} strokeWidth={2} className="door-arrow" aria-hidden="true" />
              </span>
            </button>
          </div>

          <p className="mt-8 max-w-md text-[11px] leading-relaxed text-white/55">
            KR8 is not limited to Nigeria or any city — students join from anywhere. No fees, no exceptions. If anyone
            asks you to pay, it is not us.
          </p>
        </div>
      </section>
    );
  }

  const headline = side === "academic" ? "Register for Academics." : "Register for your free seat.";
  const lede =
    side === "academic"
      ? "Four short sections. Your details, your education, the exam you are preparing for — we will take it from there. Open to SS1 through graduates retaking exams."
      : "Four short sections. No fee, no test, no portfolio — just tell us who you are and what you want to build. Registrations for the next skills intake are queued, not lost.";

  return (
    <section className="shell py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div>
          <SectionIndex index="Registration" label={side === "academic" ? `KR8 Academics · ${db.settings.partnerName}` : db.settings.cohortName} />
          <h1 className="display display-lg mt-4 max-w-[18ch]">{headline}</h1>
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-muted">{lede}</p>
          {side === "academic" && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
              <GraduationCap size={12} className="text-cyan" /> Delivered with {db.settings.partnerName}
            </p>
          )}

          {/* Stepper */}
          <div className="mt-7 flex items-center gap-2" aria-label="Registration progress">
            {STEP_LABELS.map((label, item) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold transition",
                    item + 1 <= step ? "bg-magenta-fill text-white" : "border border-line-strong text-muted-2"
                  )}
                >
                  {item + 1 < step ? <Check size={13} /> : item + 1}
                </span>
                <span className={cn("hidden text-[11px] font-medium sm:block", item + 1 === step ? "text-ink" : "text-muted")}>
                  {label}
                </span>
                {item < STEP_LABELS.length - 1 && <span className={cn("h-px flex-1", item + 1 < step ? "bg-magenta-fill" : "bg-line")} />}
              </div>
            ))}
          </div>

          <form onSubmit={submit} className="mt-7" noValidate>
            {step === 1 && (
              <div className="space-y-5">
                <RegistrationIdentityFields d={draft} set={set} errors={errors} />
                <RegistrationLocationFields d={draft} set={set} errors={errors} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <RegistrationEducationFields d={draft} set={set} errors={errors} />
              </div>
            )}

            {step === 3 && side === "skill" && (
              <div className="space-y-5">
                <RegistrationSkillFields
                  d={draft}
                  set={set}
                  errors={errors}
                  tracks={TRACKS.filter((t) => (t as { side?: string }).side !== "academic").map((t) => ({ key: t.key, name: t.name, tagline: t.duration }))}
                  programmeStatus={(key) => programmeFor(key)?.status}
                />
                {skillWaitlisted && (
                  <div className="rounded-2xl border border-warn/30 bg-warn/8 p-4">
                    <p className="flex items-center gap-2 text-[12px] font-semibold text-warn">
                      Skills intake opens March–April 2027
                    </p>
                    {waitlistOpensAt && (
                      <div className="mt-3">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-warn/80">Registration opens in</p>
                        <Countdown to={waitlistOpensAt} />
                      </div>
                    )}
                    <p className="mt-3 text-[11.5px] leading-relaxed text-body">
                      No waiting list and no separate form — registering now is how you secure priority. We will reach
                      out with onboarding before the public announcement.
                    </p>
                  </div>
                )}
                <RegistrationObjectivesField d={draft} set={set} errors={errors} side="skill" />
              </div>
            )}

            {step === 3 && side === "academic" && (
              <div className="space-y-5">
                <RegistrationAcademicFields d={draft} set={set} errors={errors} />
                <RegistrationObjectivesField d={draft} set={set} errors={errors} side="academic" />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <RegistrationAdditionalFields
                  d={draft}
                  set={set}
                  errors={errors}
                  termsLabel={
                    <span>
                      I commit to attending live sessions, submitting weekly work, and using what I learn honestly. I
                      understand tuition is free and my seat can be released for non-attendance.
                    </span>
                  }
                />

                <RegSection index="F" icon={UserRound} title="Secure your account" hint="One password, one KR8 ID — use it for the dashboard, verification and every cohort.">
                  <Field label="Create a password" htmlFor="password" error={errors.password} hint="At least 8 characters. You will use this to sign in.">
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="pr-11"
                        error={Boolean(errors.password)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-ink/5 hover:text-ink"
                        aria-label={showPw ? "Hide password" : "Show password"}
                      >
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </Field>
                  {password && (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex flex-1 gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span key={n} className={cn("h-1 flex-1 rounded-full", n <= strength.score ? "bg-magenta-fill" : "bg-ink/10")} />
                        ))}
                      </div>
                      <span className="text-[10px] font-medium text-muted">{strength.label}</span>
                    </div>
                  )}
                  <Field label="Confirm password" htmlFor="confirm" error={errors.confirm} className="mt-4">
                    <Input
                      id="confirm"
                      type={showPw ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      error={Boolean(errors.confirm)}
                    />
                  </Field>

                  <div className="mt-4 rounded-xl border border-line bg-cream p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">You are registering for</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                      {side === "academic" ? (
                        <><GraduationCap size={14} className="text-cyan" /> Academics · {db.settings.partnerName}</>
                      ) : (
                        <><Laptop size={14} className="text-magenta-bright" /> {primaryTrack?.name ?? "Digital Skills"}{draft.skills.length > 1 ? ` + ${draft.skills.length - 1} more` : ""}</>
                      )}
                    </p>
                    <p className="text-[11px] text-muted">₦0 tuition · KR8 ID issued instantly</p>
                  </div>
                </RegSection>
              </div>
            )}

            <div className="mt-7 flex items-center justify-between gap-3">
              {step > 1 ? (
                <button type="button" className="btn btn-ghost" onClick={goBack}>
                  <ArrowLeft size={15} /> Back
                </button>
              ) : (
                <button type="button" className="text-[12px] font-medium text-muted hover:text-ink" onClick={() => setSide(null)}>
                  ← Choose the other door
                </button>
              )}

              {step < 4 ? (
                <button type="button" className="btn btn-primary" onClick={goNext}>
                  Continue <ArrowRight size={15} />
                </button>
              ) : (
                <button type="submit" className="btn btn-accent" disabled={busy}>
                  {busy ? <Loader2 size={16} className="spin" /> : <Lock size={15} />}
                  Submit — get my KR8 ID
                </button>
              )}
            </div>
          </form>

          <p className="mt-5 flex items-center gap-1.5 text-[11px] text-muted">
            <ShieldCheck size={12} /> Your details stay private — stored with row-level security; never sold, never shared.
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
                    { title: "Your KR8 ID, instantly", body: "The moment you register, your permanent student identity is issued — no waiting, no approval queue." },
                    { title: "Ahead of the queue", body: "Skills registration opens March–April 2027. Registered students are onboarded before the public announcement." },
                    { title: "Classes begin 3 May 2027", body: "Three live classes a week, a project every week, a certificate when you ship. Free, always." },
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
                No tuition, no graduation fee, no certificate fee. If anyone asks you to pay for a seat, report it — it is not us.
              </p>
            </div>
          </div>

          {side === "skill" && primaryTrack && (
            <div className="card mt-4 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Your primary track</p>
              <div className="mt-2.5 flex items-center gap-2.5">
                <Avatar
                  name={MENTORS.find((m) => m.key === primaryTrack.mentorKey)?.name ?? "KR8"}
                  src={MENTORS.find((m) => m.key === primaryTrack.mentorKey)?.photo}
                  size={38}
                />
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold">
                    {MENTORS.find((m) => m.key === primaryTrack.mentorKey)?.shortName}
                  </p>
                  <p className="truncate text-[10px] text-muted">
                    {MENTORS.find((m) => m.key === primaryTrack.mentorKey)?.role}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Pill>{primaryTrack.duration}</Pill>
                <Pill>{primaryTrack.level}</Pill>
                <Pill tone="live">Free</Pill>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
