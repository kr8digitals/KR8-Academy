import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Copy,
  GraduationCap,
  Loader2,
  PenLine,
  Sparkles,
  Upload,
} from "lucide-react";
import { TRACKS } from "../data/academy";
import { useAuth } from "../lib/auth";
import { useSeo } from "../lib/seo";
import { useToast } from "../lib/toast";
import { db, joinWaitlist, registerStudent, subscribeNewsletter, pushNotifications, updateProfile, commitSession, learningGroupFor, queueOutboxMessage } from "../lib/store";
import { sendWhatsApp } from "../lib/whatsapp";
import { isValidPhone, normalizePhone, isValidEmail, cn, copyToClipboard } from "../lib/utils";
import type { AcademicCombination, AcademicExam, RegistrationSide } from "../lib/types";
import { Field, Input, Select, Textarea } from "../components/ui";

type Draft = {
  name: string;
  email: string;
  phone?: string;
  picture?: string;
  via: "google" | "whatsapp" | "email";
  at: number;
};

const CLASS_LEVELS = ["SS1", "SS2", "SS3", "Finished secondary", "University / other"];
const EXAM_OPTIONS: Array<{ value: AcademicExam; label: string }> = [
  { value: "utme", label: "UTME / JAMB" },
  { value: "waec", label: "WAEC" },
  { value: "neco", label: "NECO" },
  { value: "other", label: "Another exam" },
  { value: "not_writing", label: "Not writing an exam yet" },
];
const COMBINATIONS: Array<{ value: AcademicCombination; label: string }> = [
  { value: "science", label: "Science" },
  { value: "arts", label: "Arts & Humanities" },
  { value: "general", label: "General studies" },
];
const COUNTRIES = [
  { code: "NG", name: "Nigeria" }, { code: "GH", name: "Ghana" }, { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" }, { code: "CM", name: "Cameroon" }, { code: "CI", name: "Côte d'Ivoire" },
  { code: "EG", name: "Egypt" }, { code: "GB", name: "United Kingdom" }, { code: "US", name: "United States" },
  { code: "CA", name: "Canada" }, { code: "DE", name: "Germany" }, { code: "AE", name: "United Arab Emirates" },
  { code: "OTHER", name: "Other country" },
];

export default function Onboard() {
  const { student, ready, refresh } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [draft] = useState<Draft | null>(() => {
    try {
      const raw = window.sessionStorage.getItem("kr8.onboard.draft");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Draft;
      const via = parsed?.via === "whatsapp" ? "whatsapp" : "google";
      /* Must carry the verified channel's contact — otherwise there is nothing to continue with. */
      if (via === "google" && !parsed?.email) return null;
      if (via === "whatsapp" && !parsed?.phone) return null;
      return { ...parsed, via };
    } catch {
      return null;
    }
  });

  const viaWhatsapp = draft?.via === "whatsapp";
  const [name, setName] = useState(draft?.name ?? "");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState(viaWhatsapp ? "" : (draft?.email ?? ""));
  const [whatsapp, setWhatsapp] = useState(viaWhatsapp ? (draft?.phone ?? "") : "");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("NG");
  const [goal, setGoal] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>(draft?.picture);
  const [side, setSide] = useState<RegistrationSide>("academic");
  const [trackKey, setTrackKey] = useState("graphic");
  const [classLevel, setClassLevel] = useState("SS3");
  const [exam, setExam] = useState<AcademicExam>("utme");
  const [combination, setCombination] = useState<AcademicCombination>("science");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    | { kind: "registered"; id: string; name: string; groupLabel: string; groupUrl: string | null; delivered: "sent" | "queued" }
    | { kind: "waitlist"; name: string; track: string }
    | null
  >(null);

  useSeo({
    title: "Create your KR8 profile",
    description: "Tell us who you are, pick your path, and walk away with your permanent KR8 ID.",
    path: "/onboard",
  });

  useEffect(() => {
    if (ready && student && !result) navigate("/dashboard", { replace: true });
  }, [ready, student, navigate, result]);

  if (!draft) return <Navigate to="/join" replace />;

  const programmes = db().programmes;
  const skillTracks = TRACKS.filter((t) => (t as { side?: string }).side !== "academic");
  const trackGate = (key: string) => programmes.find((p) => p.key === key);
  const chosenGate = trackGate(trackKey);
  const skillWaitlisted = side === "skill" && chosenGate?.status === "waitlist";
  const skillClosed = side === "skill" && chosenGate?.status === "closed";

  const onAvatar = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 300_000) {
      toast.error("Photo too heavy", "Pick something under 300 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setError(null);
    if (!draft) return;
    if (name.trim().length < 2) return setError("Enter your full name — your real one. Certificates carry it.");
    if (!dob) return setError("Enter your date of birth — we need it to keep your record straight.");
    /* The verified channel is already on the draft; the other contact is required here. */
    const normal = normalizePhone(whatsapp);
    const cleanEmail = (viaWhatsapp ? email : draft.email).trim().toLowerCase();
    if (!isValidPhone(whatsapp)) return setError("Enter a valid WhatsApp number — we use it for every reminder and your group link.");
    if (viaWhatsapp && !isValidEmail(cleanEmail)) return setError("Enter a valid email — we use it for certificates and receipts.");
    if (!agree) return setError("Please accept the terms so we can enrol you.");
    setBusy(true);

    subscribeNewsletter({ email: cleanEmail, name: name.trim(), source: "onboarding" });

    if (side === "skill") {
      const track = TRACKS.find((t) => t.key === trackKey);
      if (skillClosed) {
        setBusy(false);
        return setError("That track is not part of the next intake.");
      }
      if (skillWaitlisted) {
        const res = joinWaitlist({ name: name.trim(), email: cleanEmail, whatsapp: normal, country, trackKey, side: "skill" });
        setBusy(false);
        if (!res.ok) return setError(res.error ?? "Could not join the waitlist.");
        return setResult({ kind: "waitlist", name: name.trim().split(" ")[0], track: track?.name ?? "your track" });
      }
    }

    const password = `KR8#${crypto.getRandomValues(new Uint32Array(2))[0].toString(36)}${Date.now().toString(36)}`;
    const res = await registerStudent({
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      email: cleanEmail,
      phone: normal,
      country,
      trackKey,
      dob,
      password,
      motivation: goal.trim() || undefined,
      side,
      academic:
        side === "academic"
          ? { classLevel, exam, combination, subjects: combination === "science" ? ["Mathematics", "Physics", "Chemistry"] : combination === "arts" ? ["Literature", "Government", "Economics"] : ["Mathematics", "English"] }
          : undefined,
    });
    setBusy(false);
    if (!res.ok || !res.student) return setError(res.error ?? "Could not create your account.");

    if (avatar) updateProfile(res.student.id, { avatar });
    pushNotifications([
      {
        studentId: res.student.id,
        kind: "welcome",
        title: "Welcome to KR8 Academy",
        body: "Your seat is warm. Classes run Monday, Wednesday and Friday, 8–9pm WAT. Check your dashboard — your first week is already waiting.",
        actor: "KR8 Academy",
      },
      {
        studentId: res.student.id,
        kind: "system",
        title: "Your KR8 ID is permanent",
        body: `Save it somewhere safe: ${res.student.id}. Employers and exam bodies can verify it at any time on the Verify page.`,
        actor: "KR8 Academy",
      },
    ]);
    commitSession(res.student.id);
    refresh();

    /* Congratulations + learning group link — automatic, right after the ID exists. */
    const group = learningGroupFor(trackKey, side);
    const greet = nickname.trim() || name.trim().split(" ")[0];
    const welcomeText = [
      `Karibu, ${greet} — welcome to KR8 Academy. Your seat is yours.`,
      "",
      `Your KR8 ID: ${res.student.id} — permanent, verifiable, yours for life.`,
      "",
      group
        ? `Join your ${group.specific ? "track" : "academy"} learning group — ${group.label}:`
        : "Your learning group link lands here from your track lead today:",
      ...(group ? [group.url] : []),
      "",
      "Classes run Mon · Wed · Fri · 8–9pm WAT. See you in the room.",
      "— KR8 Academy",
    ].join("\n");
    let delivered: "sent" | "queued" = "queued";
    try {
      const send = await sendWhatsApp({ to: res.student.phone, text: welcomeText });
      if (send.ok) delivered = "sent";
      else queueOutboxMessage({ to: res.student.phone, text: welcomeText, kind: "welcome", meta: res.student.id, detail: send.error });
    } catch {
      queueOutboxMessage({ to: res.student.phone, text: welcomeText, kind: "welcome", meta: res.student.id });
    }

    try {
      window.sessionStorage.removeItem("kr8.onboard.draft");
    } catch {
      /* non-fatal */
    }
    setResult({
      kind: "registered",
      id: res.student.id,
      name: greet,
      groupLabel: group?.label ?? "KR8 Academy community",
      groupUrl: group?.url ?? null,
      delivered,
    });
  };

  /* ---------- Result screens ---------- */
  if (result) {
    return (
      <section className="shell flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-lg text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-gold/40 bg-gold/15 text-gold">
            {result.kind === "registered" ? <BadgeCheck size={30} /> : <Sparkles size={28} />}
          </span>
          {result.kind === "registered" ? (
            <>
              <h1 className="display display-lg mt-6">Welcome in, {result.name}.</h1>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">This is your permanent KR8 ID — yours for life:</p>
              <p className="mx-auto mt-5 w-fit rounded-2xl border border-gold/35 bg-gold/10 px-6 py-4 font-mono text-[26px] font-bold tracking-[0.18em] text-gold sm:text-[32px]">
                {result.id}
              </p>
              <button
                type="button"
                onClick={() => void copyToClipboard(result.id)}
                className="mx-auto mt-3 inline-flex items-center gap-2 text-[12px] font-semibold text-white/75 transition hover:text-white"
              >
                <Copy size={13} /> Copy your ID
              </button>
              {result.groupUrl && (
                <div className="mx-auto mt-6 max-w-md rounded-2xl border border-[#25D366]/35 bg-[#25D366]/8 p-4 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4be07f]">Your learning group</p>
                  <p className="mt-1 text-[12px] font-semibold text-white">{result.groupLabel}</p>
                  <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-white/85">{result.groupUrl}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <a href={result.groupUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[#25D366]/40 px-3 py-1.5 text-[11px] font-semibold text-[#4be07f] transition hover:bg-[#25D366]/10">
                      Open the group <ArrowRight size={12} />
                    </a>
                    <button type="button" onClick={() => void copyToClipboard(result.groupUrl!)} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/70 transition hover:text-white">
                      <Copy size={12} /> Copy link
                    </button>
                  </div>
                  <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
                    {result.delivered === "sent"
                      ? "We also just sent this to your WhatsApp, along with your welcome message."
                      : "WhatsApp delivery is not connected yet — the link above works right now, and your welcome message is queued to send the moment it is."}
                  </p>
                </div>
              )}
              <p className="mt-6 text-[12.5px] leading-relaxed text-muted">
                Classes run Mon · Wed · Fri · 8–9pm WAT. Your first week, assignments and live sessions are already waiting
                in your dashboard — and every class you attend moves you toward the monthly spotlight prize.
              </p>
              <button onClick={() => navigate("/dashboard", { replace: true })} className="btn btn-primary btn-lg mx-auto mt-7">
                Enter the dashboard <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <>
              <h1 className="display display-lg mt-6">You're on the early list, {result.name}.</h1>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                Full registration for {result.track} opens around March–April 2027. We will reach you first, on WhatsApp,
                before it opens to the public. You have also been added to the KR8 newsletter — one or two honest emails a month.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-2">
                <Link to="/skills" className="btn btn-primary btn-lg">Explore the tracks <ArrowRight size={17} /></Link>
                <Link to="/" className="btn btn-ghost btn-lg">Back home</Link>
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  /* ---------- The form ---------- */
  return (
    <section className="shell py-10 lg:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow flex items-center gap-2"><PenLine size={13} /> Step 2 of 2 · Your profile</p>
        <h1 className="display display-lg mt-3">Tell us who you are.</h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted">
          Sixty seconds of real information — your real name, so your certificate means something. This is how we place you, certify you and, when you earn it, announce you.
        </p>

        {/* Identity */}
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-raised p-5 sm:flex-row sm:items-center">
          <label className="group relative grid h-20 w-20 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-white/20 bg-base" title="Add a photo">
            {avatar ? (
              <img src={avatar} alt="Your profile" className="h-full w-full object-cover" />
            ) : (
              <Upload size={20} className="text-muted transition group-hover:text-white" />
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => onAvatar(e.target.files?.[0])} />
          </label>
          <div className="min-w-0 flex-1">
            <Field label="Full name — your real name" htmlFor="ob-name">
              <Input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Adaeze Okafor" autoComplete="name" required />
            </Field>
            <Field label="What should we call you? (nickname, optional)" htmlFor="ob-nick" className="mt-3">
              <Input id="ob-nick" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. Adaeze, Dee, Sunshine — what the room will know you as" autoComplete="nickname" />
            </Field>
            <p className="mt-2 truncate text-[11px] text-muted">
              Joining as <span className="font-semibold text-white/85">{viaWhatsapp ? draft.phone : draft.email}</span>{" "}
              <span className="text-muted-2">· via {viaWhatsapp ? "WhatsApp" : "Google"}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field
            label={viaWhatsapp ? "WhatsApp number — verified" : "WhatsApp number"}
            htmlFor="ob-wa"
            hint={viaWhatsapp ? "Confirmed when your code was verified." : "Required — every reminder and your group link ride on it."}
          >
            <Input
              id="ob-wa"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="0803 000 0000"
              inputMode="tel"
              autoComplete="tel"
              required
              readOnly={viaWhatsapp}
              aria-readonly={viaWhatsapp}
              className={viaWhatsapp ? "opacity-70" : undefined}
            />
          </Field>
          <Field
            label={viaWhatsapp ? "Email address" : "Email — from Google"}
            htmlFor="ob-email"
            hint={viaWhatsapp ? "Required — certificates and official letters go here." : "From your Google account; we don't share it."}
          >
            <Input
              id="ob-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={viaWhatsapp ? email : draft.email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={!viaWhatsapp}
              aria-readonly={!viaWhatsapp}
              className={!viaWhatsapp ? "opacity-70" : undefined}
            />
          </Field>
          <Field label="Date of birth" htmlFor="ob-dob" hint="Required — it anchors your permanent record.">
            <Input id="ob-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().slice(0, 10)} required />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Country" htmlFor="ob-country">
            <Select id="ob-country" value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </Select>
          </Field>
        </div>

        {/* Path */}
        <p className="eyebrow mt-7">Choose your path</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {([
            { id: "academic" as const, title: "Academics", sub: "Next Gen Scholars — UTME/WAEC prep", note: "Open now · join anytime" },
            { id: "skill" as const, title: "Creative skills", sub: "Video · Graphic · Web", note: "Waitlist for the next intake" },
          ]).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSide(opt.id)}
              aria-pressed={side === opt.id}
              className={cn(
                "rounded-2xl border p-4 text-left transition",
                side === opt.id ? "border-magenta/60 bg-magenta/10 shadow-[0_0_0_1px_rgba(224,38,196,0.35)]" : "border-white/12 bg-raised hover:border-white/25"
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[15px] font-bold">{opt.title}</span>
                {side === opt.id && <Check size={16} className="text-magenta-bright" />}
              </span>
              <span className="mt-1 block text-[11.5px] text-muted">{opt.sub}</span>
              <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-cyan">{opt.note}</span>
            </button>
          ))}
        </div>

        {side === "skill" ? (
          <fieldset className="mt-4">
            <legend className="sr-only">Pick your track</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {skillTracks.map((t) => {
                const gate = trackGate(t.key);
                const active = trackKey === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTrackKey(t.key)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-left transition",
                      active ? "border-magenta/60 bg-magenta/10" : "border-white/12 bg-raised hover:border-white/25"
                    )}
                  >
                    <span className="block text-[13px] font-bold leading-snug">{t.name}</span>
                    <span className="mt-1.5 block text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                      {gate?.status === "waitlist" ? "Waitlist · opens ~Mar 2027" : gate?.status === "closed" ? "Not in next intake" : "Open"}
                    </span>
                  </button>
                );
              })}
            </div>
            {(skillWaitlisted || skillClosed) && (
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                This track is on the early-bird list for the next intake — joining records your details and gets you
                notified before it opens. Still worth it.
              </p>
            )}
          </fieldset>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Class level" htmlFor="ob-level">
              <Select id="ob-level" value={classLevel} onChange={(e) => setClassLevel(e.target.value)}>
                {CLASS_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </Select>
            </Field>
            <Field label="Exam" htmlFor="ob-exam">
              <Select id="ob-exam" value={exam} onChange={(e) => setExam(e.target.value as AcademicExam)}>
                {EXAM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </Field>
            <Field label="Combination" htmlFor="ob-combo">
              <Select id="ob-combo" value={combination} onChange={(e) => setCombination(e.target.value as AcademicCombination)}>
                {COMBINATIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </Field>
          </div>
        )}

        <div className="mt-4">
          <Field label="Why you're here (optional)" htmlFor="ob-goal">
            <Textarea id="ob-goal" rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="One honest sentence is enough." />
          </Field>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-raised p-3.5">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#e026c4]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span className="text-[12px] leading-relaxed text-white/85">
            I accept the KR8 Academy terms, and I understand I will also receive the newsletter (one or two honest emails
            a month). Class reminders, nudges and my learning-group link come on WhatsApp — that is how we keep everyone accountable.
          </span>
        </label>

        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-danger/40 bg-danger/12 px-3 py-2.5 text-[12px] text-danger">{error}</p>
        )}

        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy}
          className="btn btn-primary btn-lg mt-5 w-full"
        >
          {busy ? <Loader2 size={18} className="spin" /> : <GraduationCap size={18} />}
          {skillWaitlisted || skillClosed ? "Join the early list" : "Create my account"}
        </button>
        <p className="mt-3 text-center text-[10.5px] text-muted-2">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-magenta-bright hover:text-white">Sign in instead</Link>
        </p>
      </div>
    </section>
  );
}
