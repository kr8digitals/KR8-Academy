import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Loader2, ShieldCheck, Copy, RotateCcw, CheckCircle2 } from "lucide-react";
import { Field, Input, Button } from "./ui";
import {
  requestWhatsAppOtp,
  verifyWhatsAppOtp,
  secondsUntilWaResend,
  formatWaPhone,
  clearWaOtp,
} from "../lib/wa-otp";
import { waDigits } from "../lib/whatsapp";
import { copyToClipboard } from "../lib/utils";

/**
 * Phone-first WhatsApp one-time-code panel shared by sign-in and sign-up.
 * Delivery rides the WhatsApp Business Cloud API in /api/send-whatsapp; until
 * Meta credentials are set the code is shown inline, clearly, on screen — so
 * nobody is ever stuck at this screen. The same code step retries, counts
 * attempts honestly, and offers a full reset for mistyped numbers.
 */
export function WhatsAppOtpForm({
  initialPhone = "",
  onAuthed,
  autoFocus = true,
}: {
  initialPhone?: string;
  onAuthed: (phone: string) => void;
  autoFocus?: boolean;
}) {
  const [phone, setPhone] = useState(initialPhone);
  const [confirmed, setConfirmed] = useState<string | null>(null); /* digits of the number we sent to */
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inlineCode, setInlineCode] = useState<string | null>(null);
  const [sentLive, setSentLive] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [copied, setCopied] = useState(false);
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

  const detected = waDigits(phone);

  const send = async () => {
    setError(null);
    const result = await requestWhatsAppOtp(phone);
    if (!result.ok) {
      setError(result.error ?? "Could not send the code.");
      if (result.cooldownSec) startCooldown(result.cooldownSec);
      return;
    }
    setBusy(false);
    setStep("code");
    setConfirmed(result.phone ?? null);
    setSentLive(!!result.sent);
    setInlineCode(result.inlineCode ?? null);
    setCode("");
    startCooldown(secondsUntilWaResend() || 30);
  };

  const verify = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    const result = await verifyWhatsAppOtp(confirmed ?? phone, code);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "That code is not right.");
      return;
    }
    onAuthed(confirmed ?? phone);
  };

  const startOver = () => {
    clearWaOtp();
    setStep("phone");
    setCode("");
    setInlineCode(null);
    setConfirmed(null);
    setError(null);
  };

  if (step === "phone") {
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          void send();
        }}
      >
        <Field label="Your WhatsApp number" htmlFor="wa-phone">
          <Input
            id="wa-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0803 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoFocus={autoFocus}
            required
          />
        </Field>
        {phone.length >= 7 && (
          <p className="text-[10.5px] text-muted-2">
            {detected ? (
              <>
                Code will go to <span className="font-semibold text-white/85">{formatWaPhone(phone)}</span> on
                WhatsApp.
              </>
            ) : (
              "Hmm — that does not look like a complete number yet."
            )}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-lg border border-danger/40 bg-danger/12 px-3 py-2.5 text-[12px] text-danger">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" className="w-full" disabled={busy || !detected}>
          {busy ? <Loader2 size={16} className="spin" /> : <MessageCircle size={15} />}
          {busy ? "Sending your code…" : "Send my code on WhatsApp"}
        </Button>
        <p className="text-[10.5px] leading-relaxed text-muted-2">
          No password one day at a time. The code arrives in under a minute and expires in 10 — and if WhatsApp is not
          cooperating, we will show it right here.
        </p>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={startOver}
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted hover:text-white"
      >
        <ArrowLeft size={12} /> Wrong number? Start over
      </button>

      <div className="rounded-xl border border-white/10 bg-base px-4 py-3 text-[12px] text-muted">
        Code sent to <span className="font-semibold text-white">{confirmed ? formatWaPhone(confirmed) : phone}</span> on
        WhatsApp.{" "}
        {sentLive ? (
          <span className="inline-flex items-center gap-1 text-live"><CheckCircle2 size={12} /> delivered</span>
        ) : null}
      </div>

      {inlineCode && (
        <div className="rounded-xl border border-warn/45 bg-warn/10 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-warn">WhatsApp is not delivering yet</p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/85">
            No stress — your code is shown here so you can carry on. (Once the academy's WhatsApp delivery is
            connected, codes arrive silently in your chat.)
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="font-mono text-[26px] font-bold tracking-[0.35em] text-warn">{inlineCode}</span>
            <button
              type="button"
              onClick={() => {
                void copyToClipboard(inlineCode);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-warn/40 px-2.5 py-1.5 text-[10.5px] font-semibold text-warn transition hover:bg-warn/10"
            >
              {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy code"}
            </button>
          </div>
        </div>
      )}

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void verify();
        }}
      >
        <Field label="The 6-digit code" htmlFor="wa-code">
          <Input
            id="wa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            autoFocus
            className="font-mono text-lg tracking-[0.4em]"
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

      <div className="rounded-xl border border-white/8 bg-base px-4 py-3 text-[11px] leading-relaxed text-muted">
        <p className="font-semibold text-white/85">Not getting the code?</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          <li>Check this is the WhatsApp number you use — not a SIM that is offline.</li>
          <li>Look for a message from <span className="text-white/85">KR8 Academy</span>; it can take up to a minute.</li>
          <li>Still stuck? Resend below — or use Google instead and it takes one tap.</li>
        </ul>
        <button
          type="button"
          disabled={cooldown > 0}
          onClick={() => void send()}
          className="mt-2 inline-flex items-center gap-1.5 font-semibold text-magenta-bright transition enabled:hover:text-white disabled:opacity-50"
        >
          <RotateCcw size={12} /> {cooldown > 0 ? `Resend code in 0:${String(cooldown).padStart(2, "0")}` : "Resend the code"}
        </button>
      </div>
    </div>
  );
}
