import { useState } from "react";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LocalOnlyNotice } from "../components/LocalOnlyNotice";
import { ButtonLink, Field, Input, Logo } from "../components/ui";
import { useAuth } from "../lib/auth";
import { createOwnerAccount, ownerSetupRequired } from "../lib/store";
import { useSeo } from "../lib/seo";
import { useToast } from "../lib/toast";

export default function Setup() {
  const { student, signIn } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const needsSetup = ownerSetupRequired();

  useSeo({
    title: "Local owner setup — KR8 Academy",
    description: "Create the first local Academy owner account on this device.",
    path: "/setup",
    noindex: true,
  });

  if (!needsSetup) {
    if (student) return <Navigate to="/admin" replace />;
    return (
      <section className="shell grid min-h-[70vh] place-items-center py-12">
        <div className="card-xl w-full max-w-xl p-6 text-center sm:p-9">
          <ShieldCheck size={28} className="mx-auto text-magenta-bright" aria-hidden="true" />
          <h1 className="display display-md mt-4">This device is set up.</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            An Academy staff account already exists in this browser. Sign in with that account to continue.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <ButtonLink to="/login" variant="primary" arrow>Go to sign in</ButtonLink>
            <ButtonLink to="/" variant="ghost">Back home</ButtonLink>
          </div>
        </div>
      </section>
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const created = await createOwnerAccount({ name, email, password });
      if (!created.ok) {
        setError(created.error ?? "The owner account could not be saved.");
        return;
      }
      const authenticated = await signIn(email, password);
      if (!authenticated.ok) {
        toast.success("Owner account created", "Sign in with your new account to continue.");
        navigate("/login", { replace: true });
        return;
      }
      toast.success("Local owner account created", "Your Academy admin workspace is ready on this device.");
      navigate("/admin", { replace: true });
    } catch {
      setError("The browser could not complete secure setup. Check that local storage is available and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="shell grid min-h-[calc(100vh-72px)] place-items-center py-10 sm:py-14">
      <div className="w-full max-w-xl">
        <Link to="/" className="inline-flex items-center"><Logo /></Link>
        <div className="card-xl mt-6 p-6 sm:p-9">
          <p className="eyebrow">First-run setup</p>
          <h1 className="display display-md mt-3">Create the local Academy owner.</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            This creates the first staff account for this browser only. There is no shared starter login.
          </p>
          <div className="mt-5"><LocalOnlyNotice /></div>

          <form className="mt-6 grid gap-4" onSubmit={submit}>
            <Field label="Your name" htmlFor="owner-name">
              <Input id="owner-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
            </Field>
            <Field label="Email address" htmlFor="owner-email">
              <Input id="owner-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </Field>
            <Field label="Password" htmlFor="owner-password" hint="Use at least 8 characters. This is local browser authentication, not production-grade account security.">
              <Input id="owner-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
            </Field>
            <Field label="Confirm password" htmlFor="owner-confirm">
              <Input id="owner-confirm" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" minLength={8} required />
            </Field>
            {error && <p className="rounded-xl border border-danger/25 bg-danger/8 p-3 text-sm text-danger" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ShieldCheck size={16} aria-hidden="true" />}
              Create local owner account <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>
          <p className="mt-5 text-center text-xs text-muted">
            Already set up? <Link to="/login" className="font-semibold text-magenta-bright">Sign in</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
