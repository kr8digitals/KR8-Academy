import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Copy,
  GraduationCap,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { TRACKS } from "../data/academy";
import { useAuth } from "../lib/auth";
import { useSeo } from "../lib/seo";
import { useToast } from "../lib/toast";
import {
  db,
  registerStudent,
  pushNotifications,
  updateProfile,
  commitSession,
  learningGroupFor,
  queueOutboxMessage,
} from "../lib/store";
import { sendWhatsApp } from "../lib/whatsapp";
import { saveRegistration } from "../lib/registrar";
import {
  buildCloudRegistration,
  emptyRegistrationDetails,
  normalizeRegisterPhone,
  validateAdditional,
  validateEducation,
  validateIdentity,
  validateLocation,
  validatePathway,
  type RegistrationDetails,
} from "../lib/registration";
import { isValidEmail, cn, copyToClipboard } from "../lib/utils";
import { COUNTRIES } from "../lib/registration";
import type { AcademicExam, RegistrationSide } from "../lib/types";
import { ButtonLink, Input } from "../components/ui";
import {
  RegistrationAcademicFields,
  RegistrationAdditionalFields,
  RegistrationEducationFields,
  RegistrationIdentityFields,
  RegistrationLocationFields,
  RegistrationObjectivesField,
  RegistrationSkillFields,
} from "../components/registration";

type ProviderDraft = {
  name: string;
  email: string;
  phone?: string;
  picture?: string;
  via: "google" | "whatsapp" | "email";
  at: number;
};

type Result = {
  kind: "registered";
  id: string;
  name: string;
  groupLabel: string;
  groupUrl: string | null;
  delivered: "sent" | "queued";
  messageOptIn: boolean;
};

export default function Onboard() {
  const { student, ready, refresh } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [draft] = useState<ProviderDraft | null>(() => {
    try {
      const raw = window.sessionStorage.getItem("kr8.onboard.draft");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ProviderDraft;
      const via = parsed?.via === "whatsapp" ? "whatsapp" : "google";
      if (via === "google" && !parsed?.email) return null;
      if (via === "whatsapp" && !parsed?.phone) return null;
      return { ...parsed, via };
    } catch {
      return null;
    }
  });

  const viaWhatsapp = draft?.via === "whatsapp";
  const [side, setSide] = useState<RegistrationSide>("skill");
  const [details, setDetails] = useState<RegistrationDetails>(() => {
    const base = emptyRegistrationDetails();
    if (!draft) return base;
    if (viaWhatsapp && draft.phone) {
      const raw = draft.phone.replace(/\s+/g, "");
      const known = COUNTRIES.find((c) => c.code !== "OTHER" && c.dial.length > 1 && raw.startsWith(c.dial));
      const dial = known?.dial ?? "+234";
      return {
        ...base,
        name: draft.name ?? "",
        email: "",
        dial,
        phone: raw.startsWith(dial) ? raw.slice(dial.length) : raw,
      };
    }
    return {
      ...base,
      name: draft.name ?? "",
      email: draft.email ?? "",
    };
  });
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>(draft?.picture);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useSeo({
    title: "Complete your KR8 profile",
    description: "One short form, one KR8 ID — your permanent, verifiable student identity.",
    path: "/onboard",
  });

  useEffect(() => {
    if (ready && student && !result) navigate("/dashboard", { replace: true });
  }, [ready, student, navigate, result]);

  const skillTracks = useMemo(
    () =>
      TRACKS.filter((t) => (t as { side?: string }).side !== "academic").map((t) => ({
        key: t.key,
        name: t.name,
        tagline: t.duration,
      })),
    []
  );

  if (!ready) return null;
  if (student) return <Navigate to="/dashboard" replace />;
  if (!db().settings.registrationOpen) return <Navigate to="/apply" replace />;
  if (!draft) return <Navigate to="/join" replace />;

  const dbState = db();
  const programmeStatus = (key: string) => dbState.programmes.find((p) => p.key === key)?.status;

  const set = <K extends keyof RegistrationDetails>(key: K, value: RegistrationDetails[K]) => {
    setDetails((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

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
    if (!draft) return;
    const found: Record<string, string> = {
      ...validateIdentity(details),
      ...validateLocation(details),
      ...validateEducation(details),
      ...validatePathway(details, side),
      ...validateAdditional(details),
    };
    /* Location section stores the national number part; validate as full E.164-ish. */
    if (viaWhatsapp && !isValidEmail(details.email)) found.email = "Enter a valid email — we use it for certificates and receipts.";
    if (viaWhatsapp) delete found.phone; // WhatsApp drafts carry the number with the dial code
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("A few details are missing", "Check the highlighted fields and try again.");
      return;
    }
    setBusy(true);

    const cleanEmail = details.email.trim().toLowerCase();
    const phone = normalizeRegisterPhone(details.dial, details.phone);

    const password = `KR8#${crypto.getRandomValues(new Uint32Array(2))[0].toString(36)}${Date.now().toString(36)}`;
    const res = await registerStudent({
      name: details.name.trim(),
      nickname: nickname.trim() || undefined,
      email: cleanEmail,
      phone,
      country: details.country,
      trackKey: side === "academic" ? "academic" : details.skills[0],
      dob: details.dob,
      password,
      motivation: details.learningObjectives.trim() || undefined,
      experience: side === "academic" ? "Preparing for exams" : details.experienceLevel,
      city: details.city.trim(),
      side,
      allowWaitlist: true,
      academic:
        side === "academic"
          ? {
              classLevel: details.academicClassLevel,
              exam: (details.examTargets[0] ?? "other") as AcademicExam,
              otherExam: details.examTargets.includes("other") ? details.otherExam.trim() : undefined,
              combination: details.combination,
              subjects: details.subjects,
            }
          : undefined,
    });

    if (!res.ok || !res.student) {
      setBusy(false);
      const nextErrors: Record<string, string> = {};
      if ((res.error ?? "").toLowerCase().includes("email")) nextErrors.email = res.error ?? "That email is already registered.";
      setErrors(nextErrors);
      return;
    }

    /* Keep the full onboarding packet with the student's academy record. */
    const registrationRow = buildCloudRegistration({ ...details, email: cleanEmail }, side, res.student.id);
    const { saved: registrationSaved } = await saveRegistration(registrationRow);

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

    const trackKey = side === "academic" ? "academic" : details.skills[0];
    const group = learningGroupFor(trackKey, side);
    const greet = nickname.trim() || details.name.trim().split(" ")[0];
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
    let deliveredChannel: "sent" | "queued" = "queued";
    if (details.consentComms) {
      try {
        const send = await sendWhatsApp({ to: res.student.phone, text: welcomeText });
        if (send.ok) deliveredChannel = "sent";
        else queueOutboxMessage({ to: res.student.phone, text: welcomeText, kind: "welcome", meta: res.student.id, detail: send.error });
      } catch {
        queueOutboxMessage({ to: res.student.phone, text: welcomeText, kind: "welcome", meta: res.student.id });
      }
    }
    if (!registrationSaved) {
      toast.error("Your profile is ready", "We couldn't save the full application packet. Please contact the Academy team so we can help.");
    }

    try {
      window.sessionStorage.removeItem("kr8.onboard.draft");
    } catch {
      /* non-fatal */
    }
    setBusy(false);
    setResult({
      kind: "registered",
      id: res.student.id,
      name: greet,
      groupLabel: group?.label ?? "KR8 Academy community",
      groupUrl: group?.url ?? null,
      delivered: deliveredChannel,
      messageOptIn: details.consentComms,
    });
  };

  /* ---------- Result screen ---------- */
  if (result) {
    return (
      <section className="shell flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-lg text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-gold/40 bg-gold/15 text-gold">
            <GraduationCap size={28} strokeWidth={1.6} />
          </span>
          <h1 className="display display-lg mt-6">Karibu, {result.name}.</h1>
          <p className="lede mt-2">Your seat at KR8 Academy is confirmed. Here is your identity — keep it safe.</p>
          <div className="card-xl mt-6 p-6 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Your KR8 ID</p>
            <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight">{result.id}</p>
            <button
              className="btn btn-ghost btn-sm mt-3"
              onClick={async () => {
                await copyToClipboard(result.id);
                toast.success("KR8 ID copied");
              }}
            >
              <Copy size={13} /> Copy ID
            </button>
            <div className="mt-4 border-t border-line pt-4 text-[12px] leading-relaxed text-muted">
              <p className="flex items-start gap-2">
                <Check size={13} className="mt-0.5 shrink-0 text-live" /> Permanent — never changes, even if you change tracks.
              </p>
              <p className="mt-1.5 flex items-start gap-2">
                <Check size={13} className="mt-0.5 shrink-0 text-live" /> Verifiable — employers and exam bodies can check it publicly.
              </p>
              <p className="mt-1.5 flex items-start gap-2">
                <Check size={13} className="mt-0.5 shrink-0 text-live" /> Yours — printed on every certificate KR8 issues.
              </p>
            </div>
            {result.groupUrl && (
              <a href={result.groupUrl} target="_blank" rel="noreferrer" className="btn btn-primary mt-4 w-full justify-center">
                Join {result.groupLabel} <ArrowRight size={15} />
              </a>
            )}
            <p className="mt-3 text-center text-[10.5px] text-muted">
              {!result.messageOptIn
                ? "No messages were sent. You can still use your dashboard and join the learning group above."
                : result.delivered === "sent"
                  ? "A welcome message with your group link just landed on your WhatsApp."
                  : "Your welcome message is queued and will be sent when the channel is available."}
            </p>
          </div>
          <ButtonLink to="/dashboard" variant="ghost" className="mt-5" arrow>
            Open my dashboard
          </ButtonLink>
        </div>
      </section>
    );
  }

  const firstName = draft.name?.trim().split(" ")[0] || "there";

  return (
    <section className="shell py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">One more minute</p>
            <h1 className="display display-lg mt-2">Karibu, {firstName}.</h1>
            <p className="lede mt-2 max-w-md">You are {viaWhatsapp ? "verified on WhatsApp" : "signed in with Google"} — we just need the full picture before we print your KR8 ID.</p>
          </div>
          <label className="group relative grid h-20 w-20 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-line-strong text-muted transition hover:border-magenta hover:text-magenta-bright">
            {avatar ? (
              <img src={avatar} alt="Your photo" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.12em]">
                <Upload size={16} /> Photo
              </span>
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => onAvatar(e.target.files?.[0])} />
          </label>
        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-live/30 bg-live/10 px-3 py-1.5 text-[11px] font-semibold text-live">
          <BadgeCheck size={12} /> {viaWhatsapp ? `WhatsApp verified · ${draft.phone}` : `Google verified · ${draft.email}`}
        </div>

        {/* The two doors */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {(
            [
              { side: "skill" as const, title: "A digital skill", blurb: "Video, design or web — skills intake March–April 2027. Register now, onboard first." },
              { side: "academic" as const, title: "Academics", blurb: "UTME, WAEC, NECO coaching with Next Gen Scholars — open now." },
            ]
          ).map((door) => (
            <button
              key={door.side}
              type="button"
              onClick={() => setSide(door.side)}
              aria-pressed={side === door.side}
              className={cn(
                "rounded-2xl border p-4 text-left transition",
                side === door.side ? "border-magenta bg-magenta/8 ring-1 ring-magenta/30" : "border-line bg-white hover:border-line-strong"
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold text-ink">{door.title}</span>
                {side === door.side && <Check size={15} className="text-magenta-bright" />}
              </span>
              <span className="mt-1 block text-[11px] leading-snug text-muted">{door.blurb}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-5">
          <RegistrationIdentityFields d={details} set={set} errors={errors} />
          {viaWhatsapp && (
            <div className="-mt-2 rounded-xl border border-cyan/30 bg-cyan/5 p-3">
              <label className="field-label" htmlFor="onb-email">Email (required — for certificates)</label>
              <Input
                id="onb-email"
                type="email"
                value={details.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
                error={Boolean(errors.email)}
                className="mt-1.5"
              />
              {errors.email && <p className="mt-1.5 text-xs font-medium text-danger">{errors.email}</p>}
            </div>
          )}
          <RegistrationLocationFields d={details} set={set} errors={errors} />
          <RegistrationEducationFields d={details} set={set} errors={errors} />
          {side === "skill" ? (
            <RegistrationSkillFields d={details} set={set} errors={errors} tracks={skillTracks} programmeStatus={programmeStatus} />
          ) : (
            <RegistrationAcademicFields d={details} set={set} errors={errors} />
          )}
          <RegistrationObjectivesField d={details} set={set} errors={errors} side={side} />
          <RegistrationAdditionalFields
            d={details}
            set={set}
            errors={errors}
            termsLabel={
              <span>
                I commit to attending live sessions, submitting weekly work, and using what I learn honestly. I understand tuition is free.
              </span>
            }
          />
        </div>

        {/* Nickname kept personal */}
        <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label className="field-label" htmlFor="onb-nick">What should your class call you? <span className="font-normal normal-case text-muted">(optional)</span></label>
            <Input id="onb-nick" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Chia" autoComplete="off" className="mt-1.5" />
          </div>
        </div>

        <button className="btn btn-accent btn-lg mt-6 w-full justify-center disabled:opacity-60" onClick={submit} disabled={busy}>
          {busy ? <Loader2 size={17} className="spin" /> : <Sparkles size={17} />}
          {busy ? "Printing your KR8 ID…" : "Complete setup — get my KR8 ID"}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
          <ShieldCheck size={12} /> One permanent ID. No payment, ever.
        </p>
      </div>
    </section>
  );
}
