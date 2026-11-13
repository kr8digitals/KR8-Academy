import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Clock3, GraduationCap, Laptop, ShieldCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { TRACKS } from "../data/academy";
import { useDb } from "../lib/hooks";
import { joinWaitlist } from "../lib/store";
import { useSeo } from "../lib/seo";
import { Field, Input } from "./ui";

type Side = "skill" | "academic";

export default function PausedIntake() {
  const db = useDb();
  const [params] = useSearchParams();
  const requestedTrack = params.get("track") ?? "";
  const [side, setSide] = useState<Side>(params.get("door") === "academic" ? "academic" : "skill");
  const [trackKey, setTrackKey] = useState(requestedTrack && TRACKS.some((t) => t.key === requestedTrack) ? requestedTrack : "graphic");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useSeo({
    title: "Join the interest list — KR8 Academy",
    description: "New student enrollment is paused. Register interest in a free KR8 Academy skill or academic programme.",
    path: "/apply",
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    const programmeKey = side === "academic" ? "academic" : trackKey;
    const programmeName = side === "academic" ? "KR8 Academics" : TRACKS.find((track) => track.key === trackKey)?.name ?? trackKey;
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "academy@kr8digitals.com",
          subject: `KR8 Academy interest — ${programmeName}`,
          text: `New programme interest\n\nName: ${name.trim()}\nEmail: ${email.trim()}\nWhatsApp: ${phone.trim()}\nCountry: ${country.trim()}\nProgramme: ${programmeName} (${programmeKey})\n\nThis is an interest enquiry, not an application or a reserved place.`,
        }),
      });
      const payload = await response.json().catch(() => ({})) as { ok?: boolean; detail?: string };
      if (!response.ok || !payload.ok) {
        setError(response.status === 501
          ? "The Academy’s interest inbox is not connected yet. Please email academy@kr8digitals.com directly."
          : payload.detail ?? "We couldn’t send your interest just now. Please email academy@kr8digitals.com directly.");
        return;
      }
      const result = joinWaitlist({ name, email, whatsapp: phone, country, trackKey: programmeKey, side });
      if (!result.ok) {
        setError(result.error ?? "Check your details and try again.");
        return;
      }
      setDuplicate(Boolean(result.duplicate));
      setSaved(true);
    } catch {
      setError("We couldn’t reach the Academy’s interest inbox. Please email academy@kr8digitals.com directly.");
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return (
      <main className="interest-page">
        <section className="interest-success shell">
          <span className="interest-success__icon"><CheckCircle2 size={27} /></span>
          <p className="interest-eyebrow">KR8 ACADEMY · INTAKE UPDATE</p>
          <h1>{duplicate ? "You’re already on the list." : "Thanks for raising your hand."}</h1>
          <p>{duplicate ? "You’ve already registered this interest in this browser." : "Your interest has been sent to the KR8 Academy team."} No account is created and no place is reserved. We’ll only use these details to respond to this programme enquiry.</p>
          <div className="interest-success__actions"><Link className="interest-button" to="/skills">Explore the learning paths <ArrowRight size={16} /></Link><Link className="interest-inline" to="/">Back to the Academy</Link></div>
        </section>
      </main>
    );
  }

  return (
    <main className="interest-page">
      <section className="interest-hero">
        <div className="shell interest-hero__grid">
          <div className="interest-story">
            <p className="interest-eyebrow">KR8 ACADEMY · ENROLLMENT UPDATE</p>
            <h1>The door is paused.<br /><em>Your ambition isn’t.</em></h1>
            <p>New student enrollment is temporarily paused while the next intake is prepared. Tell us which programme interests you. This is not an application, an account, or a promise of a seat—and it costs nothing.</p>
            <div className="interest-facts"><span><Clock3 size={16} /> We’ll publish reopening details here</span><span><ShieldCheck size={16} /> No payment or account needed</span><span><Laptop size={16} /> Seven free digital-skill tracks</span></div>
            <div className="interest-current"><GraduationCap size={18} /><span><strong>Already enrolled?</strong><br />Your learning and account are still available.</span><Link to="/login">Sign in <ArrowRight size={14} /></Link></div>
          </div>
          <div className="interest-form-card">
            <div className="interest-form-card__head"><span>01 — YOUR INTEREST</span><span>₦0 · ALWAYS</span></div>
            <h2>Which door are you waiting for?</h2>
            <div className="interest-door-select" role="group" aria-label="Choose a programme">
              <button type="button" aria-pressed={side === "skill"} className={side === "skill" ? "is-active" : ""} onClick={() => setSide("skill")}><Laptop size={17} /><span>Digital skills<small>7 practical tracks</small></span></button>
              <button type="button" aria-pressed={side === "academic"} className={side === "academic" ? "is-active" : ""} onClick={() => setSide("academic")}><GraduationCap size={17} /><span>Academics<small>With Next Gen Scholars</small></span></button>
            </div>
            <form onSubmit={submit} className="interest-form">
              {side === "skill" && <label className="interest-field"><span>Skill you’re interested in</span><select value={trackKey} onChange={(event) => setTrackKey(event.target.value)}>{TRACKS.map((track) => <option value={track.key} key={track.key}>{track.name}</option>)}</select></label>}
              {side === "academic" && <div className="interest-academic-note">Tuition-free UTME, WAEC and NECO preparation with {db.settings.partnerName}.</div>}
              <Field label="Your name" htmlFor="interest-name"><Input id="interest-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" minLength={2} required placeholder="Full name" /></Field>
              <Field label="Email address" htmlFor="interest-email"><Input id="interest-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required placeholder="you@example.com" /></Field>
              <Field label="WhatsApp number" htmlFor="interest-phone" hint="Include your country code if you’re outside Nigeria."><Input id="interest-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" pattern="[+0-9() -]{7,24}" required placeholder="+234 800 000 0000" /></Field>
              <Field label="Country" htmlFor="interest-country"><Input id="interest-country" value={country} onChange={(event) => setCountry(event.target.value)} autoComplete="country-name" required placeholder="Country" /></Field>
              <label className="interest-consent"><input type="checkbox" required /><span>I agree that KR8 Academy may use these details to respond to my programme enquiry. <Link to="/privacy">Privacy notice</Link>.</span></label>
              {error && <p className="interest-error" role="alert">{error}</p>}
              <button className="interest-submit" type="submit" disabled={submitting}>{submitting ? "Sending your interest…" : "Register my interest"} {!submitting && <ArrowRight size={17} />}</button>
              <p className="interest-privacy">Your details are sent to the Academy team by email; they are not stored in a central database. If submission fails, email <a href={`mailto:${db.settings.supportEmail}`}>{db.settings.supportEmail}</a>.</p>
            </form>
          </div>
        </div>
      </section>
      <section className="interest-bottom shell"><p>Already learning with KR8?</p><Link to="/login">Go to student sign in <ArrowRight size={15} /></Link><span>Questions? <a href={`mailto:${db.settings.supportEmail}`}>{db.settings.supportEmail}</a></span></section>
    </main>
  );
}
