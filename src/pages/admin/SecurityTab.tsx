import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Crown,
  KeyRound,
  Loader2,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import QRCode from "qrcode";
import { useAuth } from "../../lib/auth";
import { useDb } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import {
  beginTotpSetup,
  disableTotp,
  setStudentRole,
  setTemporaryPassword,
  recoveryCodesRemaining,
  verifyAndEnableTotp,
} from "../../lib/store";
import { otpauthUri } from "../../lib/totp";
import { ROLE_DESCRIPTION, ROLE_LABEL } from "../../lib/permissions";
import { copyToClipboard } from "../../lib/utils";
import { whatsappStatus } from "../../lib/whatsapp";
import { Field, Input, Modal, Pill } from "../../components/ui";
import type { Role } from "../../lib/types";

const STAFF_ROLES: Array<Exclude<Role, "student">> = ["owner", "admin", "coach", "reviewer", "editor"];

export default function SecurityTab() {
  const db = useDb();
  const { student: me, isOwner } = useAuth();
  const toast = useToast();

  // 2FA state machine: idle → setup (secret shown) → recovery (codes shown once) → enabled
  const [stage, setStage] = useState<"idle" | "setup" | "recovery">("idle");
  const [secret, setSecret] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [disableCode, setDisableCode] = useState("");
  const [tempPwTarget, setTempPwTarget] = useState<string | null>(null);
  const [tempPw, setTempPw] = useState("");

  useEffect(() => {
    let alive = true;
    if (stage === "setup" && secret && me) {
      QRCode.toDataURL(otpauthUri(secret, me.email), { width: 180, margin: 1, color: { dark: "#1a0b2e", light: "#ffffff" } })
        .then((url) => alive && setQrDataUrl(url))
        .catch(() => alive && setQrDataUrl(null));
    }
    return () => {
      alive = false;
    };
  }, [stage, secret, me]);

  async function startSetup() {
    const result = beginTotpSetup(me?.name ?? "Owner");
    setSecret(result.secret);
    setTotpCode("");
    setStage("setup");
  }

  async function enableTotp() {
    setBusy(true);
    const result = await verifyAndEnableTotp(totpCode, me?.name ?? "Owner");
    setBusy(false);
    if (!result.ok) return toast.error("Not verified", result.error ?? "Try the current code again.");
    setRecoveryCodes(result.recoveryCodes ?? []);
    setStage("recovery");
    toast.success("2FA enabled", "Guard your recovery codes — they are shown only once.");
  }

  const owners = db.students.filter((s) => s.role === "owner");
  const staff = db.students.filter((s) => s.role !== "student");
  const recoveryLeft = recoveryCodesRemaining();

  return (
    <div className="space-y-5">
      {/* Messaging & delivery */}
      <MessagingCard />

      {/* Two-factor authentication */}
      <div className="card p-5">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          <Smartphone size={12} className="text-live" /> Two-factor authentication (admin sign-in)
        </p>
        <p className="mt-1.5 max-w-xl text-[12px] leading-relaxed text-muted">
          Protects the admin area with an authenticator app (Google Authenticator, Aegis, 1Password…).
          Students are unaffected. If you lose your phone, any other owner can reset this account — which is why the
          academy keeps two owners at all times.
        </p>

        {db.security.totpEnabled ? (
          <div className="mt-4 rounded-xl border border-live/30 bg-live/8 p-4">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-live"><ShieldCheck size={15} /> Two-factor is on</p>
            <p className="mt-1 text-[11px] text-muted">{recoveryLeft} recovery code{recoveryLeft === 1 ? "" : "s"} left. Each works once.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Input className="!w-40" placeholder="Code to disable" value={disableCode} onChange={(e) => setDisableCode(e.target.value)} />
              <button className="btn btn-ghost btn-sm !text-danger" onClick={async () => {
                const result = await disableTotp(disableCode, me?.name ?? "Owner");
                if (!result.ok) return toast.error("Not disabled", result.error ?? "Enter a valid code.");
                toast.success("2FA disabled", "The admin area now asks for your password only.");
                setDisableCode("");
              }}>Disable 2FA</button>
            </div>
          </div>
        ) : stage === "idle" ? (
          <button className="btn btn-primary btn-sm mt-4" onClick={startSetup}><Smartphone size={13} /> Set up 2FA now</button>
        ) : stage === "setup" && secret ? (
          <div className="mt-4 grid gap-5 rounded-xl border border-white/10 bg-sunken p-4 sm:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center gap-2">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="TOTP QR code" className="rounded-lg border border-white/10" width={180} height={180} />
              ) : (
                <div className="grid h-[180px] w-[180px] place-items-center rounded-lg border border-white/10 text-[11px] text-muted">Generating QR…</div>
              )}
              <p className="max-w-[180px] break-all text-center font-mono text-[9px] leading-snug text-muted">{secret}</p>
            </div>
            <div>
              <ol className="list-decimal space-y-1.5 pl-4 text-[12px] leading-relaxed text-body">
                <li>Scan the QR (or type the key) into your authenticator as a time-based code.</li>
                <li>The app shows KR8 Academy with a 6-digit code that changes every 30 seconds.</li>
                <li>Type the current code below — you will get 8 single-use recovery codes.</li>
              </ol>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Input className="!w-40 tracking-[0.3em]" placeholder="123456" inputMode="numeric" autoFocus value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={(e) => e.key === "Enter" && enableTotp()} />
                <button className="btn btn-primary btn-sm" disabled={busy || totpCode.length !== 6} onClick={enableTotp}>
                  {busy ? <Loader2 size={13} className="spin" /> : <Check size={13} />} Verify & enable
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setStage("idle"); setSecret(null); }}>Cancel</button>
              </div>
            </div>
          </div>
        ) : stage === "recovery" && recoveryCodes ? (
          <div className="mt-4 rounded-xl border border-warn/30 bg-warn/8 p-4">
            <p className="text-[13px] font-semibold text-warn">Save these recovery codes — they are shown exactly once.</p>
            <p className="mt-1 text-[11px] text-muted">Each code signs you in once, then is burned. Store them somewhere offline (a password manager, a sealed envelope, your safe).</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {recoveryCodes.map((code) => (
                <code key={code} className="rounded-lg border border-white/12 bg-sunken px-2.5 py-2 text-center font-mono text-[12px] font-semibold text-white">{code}</code>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn btn-ghost btn-sm" onClick={() => copyToClipboard(recoveryCodes.join("\n")).then(() => toast.success("Copied", "Recovery codes copied to clipboard."))}><Copy size={13} /> Copy all</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setStage("idle"); setRecoveryCodes(null); }}>I saved them</button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Owner accounts */}
      <div className="card p-5">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          <Crown size={12} className="text-gold" /> Owner accounts — two, always
        </p>
        <p className="mt-1.5 max-w-xl text-[12px] leading-relaxed text-muted">
          Owners can reset 2FA, restore backups, manage roles and delete accounts. The system refuses to let the last two
          owners be demoted or deleted, so the academy can never be locked out. Currently {owners.length} owner{owners.length === 1 ? "" : "s"}:
        </p>
        <div className="mt-3 grid gap-2">
          {owners.map((owner) => (
            <div key={owner.id} className="flex items-center justify-between gap-2 rounded-xl border border-gold/20 bg-gold/5 px-4 py-2.5">
              <div>
                <p className="text-[12.5px] font-semibold">{owner.name}</p>
                <p className="font-mono text-[10px] text-muted">{owner.email} · {owner.id}</p>
              </div>
              <Pill tone="magenta">Owner</Pill>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
          Add a second owner below (roles & access). If one owner ever loses everything, the other signs in, restores a
          backup if needed, and issues that account a temporary password.
        </p>
      </div>

      {/* Roles & access */}
      {isOwner && (
        <div className="card p-5">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            <Users size={12} className="text-cyan" /> Roles & access — owner, admin, coach, reviewer, editor
          </p>
          <p className="mt-1.5 max-w-xl text-[12px] leading-relaxed text-muted">
            Every staff role sees only what it needs: <strong>admin</strong> runs everything except owner/security;
            <strong> coach</strong> reviews submissions, attendance and scores; <strong>reviewer</strong> reads and reviews;
            <strong> editor</strong> changes content and announcements only. Demoting an owner below two owners is refused.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="data-table text-[12px]">
              <thead><tr><th>Person</th><th>Role</th><th>Powers (summary)</th><th></th></tr></thead>
              <tbody>
                {staff.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <p className="font-medium leading-tight">{person.name}{person.id === me?.id && <span className="ml-1.5 text-[10px] text-muted">(you)</span>}</p>
                      <p className="font-mono text-[9.5px] text-muted">{person.email}</p>
                    </td>
                    <td>
                      <select
                        className="input !w-auto"
                        value={person.role}
                        onChange={(e) => {
                          const role = e.target.value as Role;
                          const result = setStudentRole(person.id, role);
                          if (!result.ok) {
                            toast.error("Refused", result.error ?? "Could not change that role.");
                            e.target.value = person.role;
                          } else {
                            toast.success("Role updated", `${person.name} → ${ROLE_LABEL[role]}`);
                          }
                        }}
                      >
                        {STAFF_ROLES.map((role) => <option key={role} value={role}>{ROLE_LABEL[role]}</option>)}
                      </select>
                    </td>
                    <td className="max-w-[240px] text-[10.5px] leading-snug text-muted">{ROLE_DESCRIPTION[person.role as Exclude<Role, "student">]}</td>
                    <td className="text-right">
                      <button className="btn btn-ghost btn-sm" onClick={() => setTempPwTarget(person.id)} title="Set a temporary password (lost-access recovery)"><KeyRound size={13} /> Reset</button>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && <tr><td colSpan={4} className="text-center text-muted">No staff yet — promote someone above.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <p className="field-label">Promote a student to staff</p>
            <StaffPromoter />
          </div>
        </div>
      )}

      {/* Lost access playbook */}
      <div className="card p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">If the primary admin loses access</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[12px] leading-relaxed text-body">
          <li>Sign in as the <strong>second owner</strong> (kept at all times — the system enforces this).</li>
          <li>Students → search the locked account → <strong>Reset</strong> → share the temporary password in person or over a verified channel.</li>
          <li>The account is forced to change the password on next sign-in.</li>
          <li>If both owners are locked out, contact {db.settings.supportEmail} from the address the academy was registered with — recovery needs both owners or the hosting account holder (Vercel).</li>
          <li>Certificates and data are never lost: restore from the latest JSON backup (Data tab).</li>
        </ol>
      </div>

      {/* Temporary password modal */}
      <Modal open={!!tempPwTarget} onClose={() => { setTempPwTarget(null); setTempPw(""); }} title="Set a temporary password"
        description="The account must change this on next sign-in. Share it through a channel you trust — never publicly.">
        {tempPwTarget && (() => {
          const target = db.students.find((s) => s.id === tempPwTarget);
          return (
            <div className="space-y-3">
              <p className="text-[12px] text-muted">For <span className="font-semibold text-white">{target?.name}</span> ({target?.id})</p>
              <Field label="Temporary password" htmlFor="tempPw" hint="At least 10 characters. They will be forced to change it.">
                <Input id="tempPw" value={tempPw} onChange={(e) => setTempPw(e.target.value)} autoFocus placeholder="e.g. correct-horse-battery-staple" />
              </Field>
              <div className="flex justify-end gap-2">
                <button className="btn btn-ghost" onClick={() => { setTempPwTarget(null); setTempPw(""); }}>Cancel</button>
                <button className="btn btn-primary" onClick={async () => {
                  const result = await setTemporaryPassword(tempPwTarget, tempPw, me?.name ?? "Owner");
                  if (!result.ok) return toast.error("Not set", result.error ?? "Try again.");
                  toast.success("Temporary password set", "They must change it on next sign-in.");
                  setTempPwTarget(null);
                  setTempPw("");
                }}>Set temporary password</button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

function StaffPromoter() {
  const db = useDb();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Exclude<Role, "student">>("coach");
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return db.students.filter((s) => s.role === "student" && (s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))).slice(0, 6);
  }, [db.students, query]);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Input className="!w-64" placeholder="Find a student by name, email or KR8 ID…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="input !w-auto" value={role} onChange={(e) => setRole(e.target.value as Exclude<Role, "student">)}>
          {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
      </div>
      {matches.length > 0 && (
        <div className="mt-2 divide-y divide-white/8 rounded-xl border border-white/10">
          {matches.map((person) => (
            <div key={person.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <div>
                <p className="text-[12px] font-medium">{person.name}</p>
                <p className="font-mono text-[9.5px] text-muted">{person.id} · {person.email}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                const result = setStudentRole(person.id, role);
                if (!result.ok) return toast.error("Refused", result.error ?? "Could not promote.");
                toast.success("Promoted", `${person.name} is now ${ROLE_LABEL[role]}.`);
                setQuery("");
              }}>Make {ROLE_LABEL[role]}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function MessagingCard() {
  const [status, setStatus] = useState<{ configured: boolean; detail?: string } | null>(null);
  useEffect(() => {
    void whatsappStatus().then(setStatus);
  }, []);
  return (
    <div className="card p-5">
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        Messaging &amp; delivery
      </p>
      <div className="mt-2 grid gap-2 text-[12px] leading-relaxed text-muted">
        <p>
          <span className="font-semibold text-white/85">In-app nudges</span> — always on. Students see them in the
          dashboard feed and the notification bell.
        </p>
        <p>
          <span className="font-semibold text-white/85">WhatsApp deep links</span> — always on. From the Nudge panel,
          one tap opens WhatsApp with your message pre-filled to the student's registered number.
        </p>
        <p>
          <span className="font-semibold text-white/85">Automatic WhatsApp</span> —{" "}
          {status === null ? (
            "checking…"
          ) : status.configured ? (
            <span className="font-semibold text-live">connected.</span>
          ) : (
            <span className="text-white/70">{status.detail ?? "not connected yet."}</span>
          )}
        </p>
        <p>
          <span className="font-semibold text-white/85">Newsletter</span> — every onboarding subscribes; export the list
          any time from Backup &amp; undo.
        </p>
      </div>
    </div>
  );
}
