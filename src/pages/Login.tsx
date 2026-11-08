import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck, Sparkles, ArrowLeft, MessageCircle, ChevronLeft } from "lucide-react";
import { signInWithGoogle, isGoogleConfigured } from "../lib/google";
import { commitSession, findStudentByEmail, findStudentByIdentifier } from "../lib/store";
import { WhatsAppOtpForm } from "../components/WhatsAppOtpForm";
import { useAuth } from "../lib/auth";
import { useDb } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { useToast } from "../lib/toast";
import { ButtonLink, Field, Input, Logo, Pill } from "../components/ui";
import { SectionIndex } from "../components/sections";

export default function Login() {
  const { student, signIn, completeTotp, cancelTotp, pendingTotp, ready, refresh } = useAuth();
  const db = useDb();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") ?? "";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [mode, setMode] = useState<"password" | "whatsapp">("password");
  const [googleBusy, setGoogleBusy] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [totpBusy, setTotpBusy] = useState(false);
  const [totpError, setTotpError] = useState<string | null>(null);

  useSeo({
    title: "Sign in to your academy dashboard",
    description: "Sign in to KR8 Academy to track your weeks, submit assignments, check in to live sessions and download your certificate.",
    path: "/login",
    noindex: true,
  });

  useEffect(() => {
    if (ready && student) {
      navigate(next || (student.role !== "student" ? "/admin" : "/dashboard"), { replace: true });
    }
  }, [ready, student, navigate, next]);

  if (ready && student) return <Navigate to={next || "/dashboard"} replace />;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError("Enter your KR8 ID (or email) and your password.");
      return;
    }
    setBusy(true);
    const result = await signIn(identifier.trim(), password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not sign you in.");
      return;
    }
    if (result.needsTotp) {
      setTotpCode("");
      setTotpError(null);
      return; // the 2FA panel takes over below
    }
    toast.success("Welcome back", "Your dashboard is ready.");
    navigate(next || (result.student && result.student.role !== "student" ? "/admin" : "/dashboard"), { replace: true });
  }

  async function submitTotp(event: React.FormEvent) {
    event.preventDefault();
    setTotpError(null);
    if (!totpCode.trim()) {
      setTotpError("Enter the 6-digit code from your authenticator, or a recovery code.");
      return;
    }
    setTotpBusy(true);
    const result = await completeTotp(totpCode);
    setTotpBusy(false);
    if (!result.ok) {
      setTotpError(result.error ?? "That code did not match.");
      return;
    }
    toast.success("Verified", "Second factor accepted.");
    navigate(next || "/admin", { replace: true });
  }

  const stashDraft = (draft: Record<string, unknown>) => {
    try {
      window.sessionStorage.setItem("kr8.onboard.draft", JSON.stringify({ ...draft, at: Date.now() }));
    } catch {
      /* quota — onboarding still works, just unprefilled */
    }
  };

  const finishGoogle = (name: string, email: string, picture?: string) => {
    const clean = email.trim().toLowerCase();
    const existing = findStudentByEmail(clean);
    if (existing) {
      commitSession(existing.id);
      refresh();
      toast.success("Welcome back", "Signed you in.");
      return;
    }
    stashDraft({ name: name || clean.split("@")[0], email: clean, picture, via: "google" });
    navigate("/onboard");
  };

  const finishWhatsApp = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    const normalized = phone.startsWith("+") ? `+${digits}` : digits.length === 11 && digits.startsWith("0") ? `+234${digits.slice(1)}` : `+${digits}`;
    const existing = findStudentByIdentifier(normalized) ?? findStudentByIdentifier(phone);
    if (existing) {
      commitSession(existing.id);
      refresh();
      toast.success("Welcome back", "Signed you in.");
      return;
    }
    stashDraft({ name: "", email: "", phone: normalized, via: "whatsapp" });
    navigate("/onboard");
  };

  const google = async () => {
    setError(null);
    setGoogleBusy(true);
    try {
      const profile = await signInWithGoogle();
      finishGoogle(profile.name, profile.email, profile.picture);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in did not complete.");
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <section className="shell grid gap-10 py-10 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-16">
      <div className="mx-auto w-full max-w-md">
        {pendingTotp ? (
          <div>
            <SectionIndex index="Verification" label="Admin two-factor" />
            <h1 className="display display-lg mt-5">One more step.</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Hi {pendingTotp.name.split(" ")[0]} — this device has two-factor authentication enabled for admin
              accounts. Open your authenticator and enter the 6-digit code for{" "}
              <span className="font-semibold text-white">KR8 Academy</span>.
            </p>
            <form onSubmit={submitTotp} className="mt-7 space-y-4">
              <Field label="Authentication code" htmlFor="totp" error={totpError ?? undefined} hint="Codes refresh every 30 seconds. A recovery code works too.">
                <Input
                  id="totp"
                  value={totpCode}
                  onChange={(event) => setTotpCode(event.target.value.replace(/[^\dA-Za-z-]/g, "").slice(0, 16))}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  error={!!totpError}
                  className="tracking-[0.3em]"
                />
              </Field>
              {totpError && (
                <div className="rounded-lg border border-danger/40 bg-danger/12 px-3 py-2.5 text-[12px] text-danger" role="alert">
                  {totpError}
                </div>
              )}
              <button type="submit" className="btn btn-primary w-full" disabled={totpBusy}>
                {totpBusy ? <Loader2 size={16} className="spin" /> : <ShieldCheck size={15} />}
                Verify and sign in
              </button>
            </form>
            <button
              type="button"
              onClick={() => cancelTotp()}
              className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-white"
            >
              <ArrowLeft size={13} /> Sign in as a different account
            </button>
          </div>
        ) : (
        <>
        <SectionIndex index="Sign in" label="Student & admin access" />
        <h1 className="display display-lg mt-5">Welcome back.</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Sign in with your KR8 ID or WhatsApp number. Everything you have submitted, attended and earned is
          waiting inside.
        </p>

        {mode === "whatsapp" ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setMode("password")}
              className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted hover:text-white"
            >
              <ChevronLeft size={12} /> Other ways to continue
            </button>
            <WhatsAppOtpForm onAuthed={finishWhatsApp} />
          </div>
        ) : (
          <>
        <div className="mt-7 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void google()}
            disabled={googleBusy}
            className="flex items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white px-3 py-2.5 text-[13px] font-semibold text-[#1f1a2e] transition hover:bg-white/92 disabled:opacity-60"
          >
            {googleBusy ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <svg viewBox="0 0 48 48" width="16" height="16" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.2 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.2 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.3 35.4 26.8 36.5 24 36.5c-5.2 0-9.6-3.4-11.2-8L6 33.7C9.3 40 16.1 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.3 5.2c-.4.4 7-5.1 7-14.8 0-1.3-.1-2.6-.4-3.9z" />
              </svg>
            )}
            Google
          </button>
          <button
            type="button"
            onClick={() => setMode("whatsapp")}
            className="flex items-center justify-center gap-2.5 rounded-xl border border-[#25D366]/45 bg-[#25D366]/10 px-3 py-2.5 text-[13px] font-semibold text-[#4be07f] transition hover:border-[#25D366]/70 hover:text-white"
          >
            <MessageCircle size={16} /> WhatsApp
          </button>
        </div>
        {!isGoogleConfigured() && (
          <p className="mt-1.5 text-[10px] text-muted-2">Google is being connected — the email code path works fully today.</p>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <Field label="KR8 ID or WhatsApp number" htmlFor="identifier">
            <Input
              id="identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="KR8-2026-GD-0001"
              autoComplete="username"
              error={!!error}
            />
          </Field>

          <Field label="Password" htmlFor="password">
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                className="pr-11"
                error={!!error}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-2 transition hover:bg-white/8 hover:text-white"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>

          {error && (
            <div className="rounded-lg border border-danger/40 bg-danger/12 px-3 py-2.5 text-[12px] text-danger" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : <Lock size={15} />}
            Sign in
          </button>
        </form>

          </>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-[12px]">
          <p className="text-muted">
            New here?{" "}
            <Link to="/join" className="font-semibold text-magenta-bright">
              Create your account
            </Link>
          </p>
          <a href={`mailto:${db.settings.supportEmail}?subject=KR8%20Academy%20account%20recovery`} className="font-medium text-muted hover:text-white">
            Forgot your password?
          </a>
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-raised p-4">
          <button
            type="button"
            onClick={() => setShowDemo((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted"
          >
            <span className="inline-flex items-center gap-1.5"><KeyRound size={12} /> Demo access</span>
            <span className="text-muted-2">{showDemo ? "Hide" : "Show"}</span>
          </button>
          {showDemo && (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] leading-relaxed text-muted">
                Demo access — two seeded accounts:
              </p>
              <div className="grid gap-2">
                <button
                  type="button"
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-raised px-3 py-2 text-left text-[11px] transition hover:border-white/25"
                  onClick={() => {
                    const demo = db.students.find((st) => st.email === "grant.gideon@student.kr8digitals.com");
                    setIdentifier(demo?.id ?? "KR8 ID");
                    setPassword("KR8@Sample2026");
                  }}
                >
                  <span>
                    <span className="block font-semibold">Sample student</span>
                    <span className="font-mono text-[10px] text-muted">Sample student · password KR8@Sample2026</span>
                  </span>
                  <Sparkles size={13} className="text-magenta-bright" />
                </button>
                <button
                  type="button"
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-raised px-3 py-2 text-left text-[11px] transition hover:border-white/25"
                  onClick={() => {
                    setIdentifier("KR8-FOUNDER-TIMFIRE");
                    setPassword("KR8@Academy2026");
                  }}
                >
                  <span>
                    <span className="block font-semibold">Academy admin</span>
                    <span className="font-mono text-[10px] text-muted">Owner · KR8-FOUNDER-TIMFIRE</span>
                  </span>
                  <ShieldCheck size={13} className="text-magenta-bright" />
                </button>
              </div>
              <p className="text-[10px] leading-relaxed text-muted">
                Change the admin password from Settings after your first sign-in.
              </p>
            </div>
          )}
        </div>
        </>
        )}
        </div>

      <div className="relative hidden overflow-hidden rounded-[26px] border border-white/12 p-8 lg:block on-dark">
        <img
          src="/media/hero-home.jpg"
          alt="Morning light across the KR8 Academy studio — mentors and students around long work tables"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-[50%_35%]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0613]/84 via-[#0a0613]/48 to-[#0a0613]/80" aria-hidden="true" />
        <div className="relative z-10">
          <Logo dark />
          <blockquote className="display mt-10 text-[26px] leading-tight text-white">
            “The only thing standing between you and a creative career should not be money — or a login screen.”
          </blockquote>
          <p className="mt-4 text-[12px] text-white/55">KR8 Academy · {db.settings.cohortName}</p>

          <div className="mt-10 space-y-3 border-t border-white/12 pt-6">
            {[
              { label: "Weeks, submissions and attendance", note: "Tracked automatically in your dashboard" },
              { label: "Certificate eligibility", note: "Published criteria, live progress bars" },
              { label: "Verifiable KR8 ID", note: "One code employers can actually check" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2.5">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-magenta-bright" />
                <div>
                  <p className="text-[12.5px] font-medium text-white">{item.label}</p>
                  <p className="text-[11px] text-white/50">{item.note}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Pill tone="dark">8-week cohort</Pill>
            <Pill tone="dark">No tuition</Pill>
            <Pill tone="dark">Verifiable</Pill>
          </div>

          <div className="mt-8">
            <ButtonLink to="/skills" variant="outline-light" size="sm" arrow>
              Browse the tracks
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
