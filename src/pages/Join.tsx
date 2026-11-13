import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, MessageCircle, Sparkles, Loader2, ChevronLeft } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useSeo } from "../lib/seo";
import { useToast } from "../lib/toast";
import { signInWithGoogle, isGoogleConfigured } from "../lib/google";
import { commitSession, db, findStudentByEmail, findStudentByIdentifier } from "../lib/store";
import { Logo } from "../components/ui";
import { WhatsAppOtpForm } from "../components/WhatsAppOtpForm";

export default function Join() {
  const { student, ready, refresh } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<"choose" | "whatsapp">(searchParams.get("step") === "whatsapp" ? "whatsapp" : "choose");
  const [busy, setBusy] = useState<"google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useSeo({
    title: "Create your KR8 Academy account",
    description: "Sign up with Google or your WhatsApp number. Two minutes, no tuition — and a verifiable KR8 ID that is yours for life.",
    path: "/join",
  });

  useEffect(() => {
    if (ready && student) navigate("/dashboard", { replace: true });
  }, [ready, student, navigate]);

  const draftAndContinue = (draft: Record<string, unknown>) => {
    try {
      window.sessionStorage.setItem("kr8.onboard.draft", JSON.stringify({ ...draft, at: Date.now() }));
    } catch {
      /* quota — onboarding still works, just unprefilled */
    }
    navigate("/onboard");
  };

  const finishGoogle = (name: string, email: string, picture?: string) => {
    const clean = email.trim().toLowerCase();
    const existing = findStudentByEmail(clean);
    if (existing) {
      commitSession(existing.id);
      refresh();
      toast.success("Welcome back", "Signed you in.");
      navigate("/dashboard", { replace: true });
      return;
    }
    draftAndContinue({ name, email: clean, picture, via: "google" });
  };

  const finishWhatsApp = (phone: string) => {
    const existing = findStudentByIdentifier(phone);
    if (existing) {
      commitSession(existing.id);
      refresh();
      toast.success("Welcome back", "Signed you in.");
      navigate("/dashboard", { replace: true });
      return;
    }
    draftAndContinue({ name: "", email: "", phone, via: "whatsapp" });
  };

  const google = async () => {
    setError(null);
    setBusy("google");
    try {
      const profile = await signInWithGoogle();
      finishGoogle(profile.name, profile.email, profile.picture);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in did not complete.");
    } finally {
      setBusy(null);
    }
  };

  if (!ready) return null;
  if (student) return <Navigate to="/dashboard" replace />;
  if (!db().settings.registrationOpen) return <Navigate to="/apply" replace />;

  return (
    <section className="shell grid gap-8 py-10 lg:grid-cols-[0.95fr_1fr] lg:items-stretch lg:py-14">
      {/* Story panel */}
      <div className="relative hidden overflow-hidden rounded-[26px] border border-white/12 lg:block on-dark">
        <img
          src="/media/hero-apply.jpg"
          alt="Morning light on a fresh KR8 Academy application — pen and form on the studio desk"
          className="absolute inset-0 h-full w-full object-cover object-[50%_40%]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0613]/84 via-[#0a0613]/45 to-[#0a0613]/78" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-between p-8">
          <Logo dark />
          <div>
            <blockquote className="display text-[26px] leading-[1.15] text-white">
              “The skill that changes your life will not choose you. Show up — that is where it starts.”
            </blockquote>
            <p className="mt-4 text-[12px] text-white/65">KR8 Academy · 5th cohort · Mon · Wed · Fri · 8–9pm WAT</p>
            <ul className="mt-6 grid gap-2 border-t border-white/15 pt-6 text-[12.5px] text-white/85">
              {[
                "Two minutes to create your account — no fees, ever",
                "A permanent KR8 ID, yours for life, employers can verify",
                "Monthly spotlight prizes for the most consistent builders",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Sparkles size={13} className="mt-0.5 shrink-0 text-gold" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="mx-auto flex w-full max-w-md flex-col justify-center lg:max-w-lg">
        {step === "choose" ? (
          <>
            <p className="eyebrow">Create your account</p>
            <h1 className="display display-lg mt-3">Start here.</h1>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted">
              One account. One permanent KR8 ID. Everything the academy does — your classes, your submissions, your
              certificates — lives behind it.
            </p>

            <Link to="/apply" className="btn btn-primary btn-lg mt-6 w-full justify-center">
              Start with the application <ArrowRight size={16} />
            </Link>
            <p className="mt-4 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-2">Or continue with an account</p>
            <div className="mt-3 space-y-3">
              <button
                type="button"
                onClick={() => void google()}
                disabled={busy !== null}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white px-4 py-3 text-[14px] font-semibold text-[#1f1a2e] transition hover:bg-white/90 disabled:opacity-60"
              >
                {busy === "google" ? (
                  <Loader2 size={18} className="spin text-[#1f1a2e]" />
                ) : (
                  <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
                    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.2 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.2 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                    <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.3 35.4 26.8 36.5 24 36.5c-5.2 0-9.6-3.4-11.2-8L6 33.7C9.3 40 16.1 44 24 44z" />
                    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.3 5.2c-.4.4 7-5.1 7-14.8 0-1.3-.1-2.6-.4-3.9z" />
                  </svg>
                )}
                Continue with Google
              </button>

              <button
                type="button"
                onClick={() => setStep("whatsapp")}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#25D366]/45 bg-[#25D366]/10 px-4 py-3 text-[14px] font-semibold text-[#4be07f] transition hover:border-[#25D366]/70 hover:text-white"
              >
                <MessageCircle size={18} />
                Continue with WhatsApp
              </button>
            </div>

            {error && (
              <p role="alert" className="mt-3 rounded-lg border border-danger/40 bg-danger/12 px-3 py-2.5 text-[12px] text-danger">
                {error}
              </p>
            )}
            {!isGoogleConfigured() && (
              <p className="mt-2 text-[10.5px] leading-relaxed text-muted-2">
                Google sign-in is being connected — WhatsApp codes work fully right now, shown right on this screen.
              </p>
            )}

            <p className="mt-6 text-[12px] text-muted">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-magenta-bright hover:text-white">
                Sign in <ArrowRight size={11} className="inline" />
              </Link>
            </p>

            <p className="mt-6 border-t border-white/8 pt-4 text-[10.5px] leading-relaxed text-muted-2">
              By continuing you agree to the academy terms. During setup, you can choose whether to receive optional
              programme messages from KR8 Academy.
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep("choose")}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted hover:text-white"
            >
              <ChevronLeft size={12} /> Other ways to continue
            </button>
            <p className="eyebrow mt-3">Create your account</p>
            <h1 className="display display-lg mt-3">WhatsApp it is.</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              We send one 6-digit code to your WhatsApp. That is your key into the academy — no password to remember.
            </p>
            <div className="mt-6">
              <WhatsAppOtpForm onAuthed={finishWhatsApp} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
