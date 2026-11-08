import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mail, Loader2, ShieldCheck, Copy, RotateCcw } from "lucide-react";
import { Field, Input, Button } from "./ui";
import { requestOtp, verifyOtp, secondsUntilResend } from "../lib/otp";
import { isValidEmail } from "../lib/utils";

/**
 * Two-step email + 6-digit-code panel shared by the sign-in and create-account
 * screens. Mail delivery rides the Resend relay in /api/send-email; until the
 * key is configured the code is shown inline so the flow is fully usable.
 */
export function EmailOtpForm({
  initialEmail = "",
  onAuthed,
  autoFocus = true,
}: {
  initialEmail?: string;
  onAuthed: (email: string) => void;
  autoFocus?: boolean;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">(initialEmail ? "email" : "email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inlineCode, setInlineCode] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setCooldown((v) => {
        if (v <= 1) {
          if (timer.current) window.clearInterval(timer.current);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  };

  const send = async () => {
    setError(null);
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy(true);
    const result = await requestOtp(email);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not send the code.");
      if (result.cooldownSec) startCooldown(result.cooldownSec);
      return;
    }
    setStep("code");
    setSent(!!result.sent);
    setInlineCode(result.inlineCode ?? null);
    startCooldown(secondsUntilResend() || 30);
  };

  const verify = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    const result = await verifyOtp(email, code);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "That code is not right.");
      return;
    }
    onAuthed(email.trim().toLowerCase());
  };

  if (step === "email") {
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <Field label="Email address" htmlFor="otp-email">
          <Input
            id="otp-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!error}
            autoFocus={autoFocus}
            required
          />
        </Field>
        {error && (
          <p role="alert" className="rounded-lg border border-danger/40 bg-danger/12 px-3 py-2.5 text-[12px] text-danger">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" className="w-full" disabled={busy}>
          {busy ? <Loader2 size={16} className="spin" /> : <Mail size={15} />}
          {busy ? "Sending your code…" : "Email me a 6-digit code"}
        </Button>
        <p className="text-[10.5px] leading-relaxed text-muted-2">
          No password needed. Your code arrives in under a minute and expires in 10.
        </p>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => {
          setStep("email");
          setCode("");
          setInlineCode(null);
          setError(null);
        }}
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted hover:text-white"
      >
        <ArrowLeft size={12} /> Use a different email
      </button>

      {sent ? (
        <p className="rounded-lg border border-cyan/25 bg-cyan/8 px-3 py-2.5 text-[12px] leading-relaxed text-cyan">
          Code sent to <span className="font-semibold">{email}</span>. Check your inbox (and spam).
        </p>
      ) : (
        inlineCode && (
          <div className="rounded-lg border border-gold/30 bg-gold/8 px-3 py-2.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-gold">Mail is being connected</p>
            <p className="mt-1 text-[12px] leading-relaxed text-white/85">
              Your one-time code is{" "}
              <button
                type="button"
                onClick={() => void navigator.clipboard?.writeText(inlineCode)}
                className="group inline-flex items-center gap-1 font-mono text-[15px] font-bold tracking-[0.25em] text-white underline decoration-gold/60 underline-offset-2"
                title="Copy code"
              >
                {inlineCode}
                <Copy size={12} className="text-white/50 transition group-hover:text-white" />
              </button>
            </p>
          </div>
        )
      )}

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void verify();
        }}
      >
        <Field label="6-digit code" htmlFor="otp-code">
          <Input
            id="otp-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            error={!!error}
            className="text-center font-mono text-lg tracking-[0.4em]"
            autoFocus
            required
          />
        </Field>
        {error && (
          <p role="alert" className="rounded-lg border border-danger/40 bg-danger/12 px-3 py-2.5 text-[12px] text-danger">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" className="w-full" disabled={busy}>
          {busy ? <Loader2 size={16} className="spin" /> : <ShieldCheck size={15} />}
          {busy ? "Checking…" : "Verify and continue"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => void send()}
        disabled={cooldown > 0 || busy}
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted transition enabled:hover:text-white disabled:opacity-50"
      >
        <RotateCcw size={12} /> {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
      </button>
    </div>
  );
}
