import { useMemo, useState } from "react";
import {
  Award,
  BadgeCheck,
  Check,
  Eye,
  FileImage,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { useDb } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import {
  decideAwardGrant,
  deleteAwardTier,
  markAwardTiersReviewed,
  reviewUtmeSlip,
  saveAwardTier,
  toggleGrantPublished,
} from "../../lib/store";
import { meetsUtmeParticipation, participationPct } from "../../lib/scoring";
import { cn, timeAgo } from "../../lib/utils";
import { Field, Input, Modal, Pill } from "../../components/ui";
import type { AwardTier } from "../../lib/types";

export default function AwardsTab() {
  const db = useDb();
  const toast = useToast();
  const [viewer, setViewer] = useState<{ slipId: string } | null>(null);
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingTier, setEditingTier] = useState<AwardTier | null>(null);

  const pendingSlips = db.utmeSlips.filter((s) => s.status === "pending").sort((a, b) => a.submittedAt - b.submittedAt);
  const verifiedSlips = db.utmeSlips.filter((s) => s.status === "verified").length;
  const grants = [...db.awardGrants].sort((a, b) => b.createdAt - a.createdAt);
  const tiers = [...db.awardTiers].filter((t) => t.scope === "utme").sort((a, b) => a.order - b.order);
  const anyPendingReview = tiers.some((t) => t.pendingReview);
  const studentById = useMemo(() => new Map(db.students.map((s) => [s.id, s])), [db.students]);
  const tierById = useMemo(() => new Map(db.awardTiers.map((t) => [t.id, t])), [db.awardTiers]);

  function verify(slipId: string, approve: boolean) {
    const slip = db.utmeSlips.find((s) => s.id === slipId);
    if (!slip) return;
    const student = studentById.get(slip.studentId);
    if (approve && student && !meetsUtmeParticipation(db, student.id)) {
      toast.info(
        "Verified with a flag",
        `${student.name} is at ${participationPct(db, student.id)}% participation (minimum ${db.settings.jambMinParticipationPct}%) — the slip can be authentic, but no prize may be approved until participation is met.`
      );
    }
    setBusyId(slipId);
    const result = reviewUtmeSlip(slipId, approve, reviewNote[slipId] ?? "", "Admin");
    setBusyId(null);
    if (!result.ok) return toast.error("Not done", result.error ?? "Could not record that.");
    toast.success(
      approve ? "Slip verified" : "Slip rejected",
      approve
        ? "Award eligibility unlocked. The award itself stays Pending until you approve it below."
        : "Candidate notified by the record; no award is possible from this slip."
    );
    setViewer(null);
  }

  function decide(grantId: string, decision: "approved" | "paid" | "rejected") {
    if (decision === "approved") {
      const grant = db.awardGrants.find((g) => g.id === grantId);
      const student = grant ? studentById.get(grant.studentId) : undefined;
      if (grant && student && !meetsUtmeParticipation(db, student.id)) {
        toast.error(
          "Prize refused — participation too low",
          `${student.name} is at ${participationPct(db, student.id)}% (minimum ${db.settings.jambMinParticipationPct}%). Verification records the slip; prize approval requires the participation bar.`
        );
        return;
      }
    }
    const result = decideAwardGrant(grantId, decision, "Timfire");
    if (!result.ok) return toast.error("Could not update", result.error ?? "Try again.");
    toast.success(
      decision === "approved" ? "Award approved" : decision === "paid" ? "Marked paid" : "Award rejected",
      decision === "approved" ? "You can now publish it to the Recognition Wall." : "Logged in the audit trail."
    );
  }

  function saveTier() {
    if (!editingTier) return;
    const result = saveAwardTier(
      {
        ...editingTier,
        amount: Math.max(0, Math.round(Number(editingTier.amount) || 0)),
        min: Math.round(Number(editingTier.min) || 0),
        max: Math.round(Number(editingTier.max) || 0),
        order: Number(editingTier.order) || 1,
      },
      "Timfire"
    );
    if (!result.ok) return toast.error("Tier not saved", result.error ?? "Check the boundaries.");
    toast.success("Tier saved", "Grading, awards and certificates updated everywhere.");
    setEditingTier(null);
  }

  const fmt = (t: AwardTier) => (t.amount > 0 ? `${t.currency === "NGN" ? "₦" : `${t.currency} `}${t.amount.toLocaleString()}` : "—");

  return (
    <div className="space-y-5">
      {/* UTME verification queue */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            <ShieldCheck size={12} className="text-cyan" /> UTME result slips — verification queue
          </p>
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <span className="rounded-full bg-warn/15 px-2.5 py-1 font-semibold text-warn">{pendingSlips.length} pending</span>
            <span className="rounded-full bg-live/12 px-2.5 py-1 font-semibold text-live">{verifiedSlips} verified</span>
          </div>
        </div>
        <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-muted">
          Only the official UTME score counts. Awards stay pending until the slip is verified against the candidate's
          details, the student holds a KR8 ID, and participation is at least {db.settings.jambMinParticipationPct}% of
          classes and assignments. Certificate threshold: {db.settings.utmeCertificateThreshold}+.
        </p>

        {pendingSlips.length === 0 ? (
          <p className="mt-4 rounded-xl border border-white/8 bg-sunken px-4 py-6 text-center text-[12px] text-muted">The queue is clear.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {pendingSlips.map((slip) => {
              const student = studentById.get(slip.studentId);
              const participation = student ? participationPct(db, student.id) : 0;
              const participationOk = participation >= db.settings.jambMinParticipationPct;
              return (
                <div key={slip.id} className="rounded-2xl border border-white/10 bg-sunken p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/12 bg-raised"
                        onClick={() => setViewer({ slipId: slip.id })}
                        title="Open the slip"
                      >
                        {slip.dataUrl.startsWith("data:image") ? (
                          <img src={slip.dataUrl} alt="UTME slip" className="h-full w-full object-cover" />
                        ) : (
                          <FileImage size={22} className="text-muted" />
                        )}
                      </button>
                      <div>
                        <p className="text-[13px] font-semibold leading-tight">{student?.name ?? slip.studentId}</p>
                        <p className="font-mono text-[10px] text-muted">{slip.studentId}</p>
                        <p className="mt-1 text-[11px] text-muted">Submitted {timeAgo(slip.submittedAt)} · score candidate claims: <span className="font-mono font-semibold text-white">{slip.score}</span></p>
                        {slip.note && <p className="mt-1 max-w-md text-[10.5px] italic text-muted">“{slip.note}”</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-mono text-[11px] font-semibold", participationOk ? "text-live" : "text-danger")}>
                        Participation {participation}%
                      </p>
                      <p className="text-[9.5px] text-muted">min {db.settings.jambMinParticipationPct}%</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      className="input flex-1 !w-auto min-w-[180px]"
                      placeholder="Note for the record (optional)"
                      value={reviewNote[slip.id] ?? ""}
                      onChange={(e) => setReviewNote((n) => ({ ...n, [slip.id]: e.target.value }))}
                    />
                    <button className="btn btn-ghost btn-sm" onClick={() => setViewer({ slipId: slip.id })}><Eye size={13} /> View slip</button>
                    <button className="btn btn-ghost btn-sm !border-danger/40 !text-danger" disabled={busyId === slip.id} onClick={() => verify(slip.id, false)}><X size={13} /> Reject</button>
                    <button className="btn btn-primary btn-sm" disabled={busyId === slip.id} onClick={() => verify(slip.id, true)}>
                      {busyId === slip.id ? <Loader2 size={13} className="spin" /> : <Check size={13} />} Approve & verify
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Award grants */}
      {grants.length > 0 && (
        <div className="card p-5">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            <Trophy size={12} className="text-gold" /> Awards — pending verification to paid
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="data-table text-[12px]">
              <thead>
                <tr><th>Student</th><th>Tier</th><th>Score</th><th>Status</th><th>Wall</th><th></th></tr>
              </thead>
              <tbody>
                {grants.map((grant) => {
                  const student = studentById.get(grant.studentId);
                  const tier = tierById.get(grant.tierId);
                  return (
                    <tr key={grant.id}>
                      <td>
                        <p className="font-medium leading-tight">{student?.name ?? grant.studentId}</p>
                        <p className="font-mono text-[9.5px] text-muted">{grant.studentId}</p>
                      </td>
                      <td>{tier?.name ?? grant.tierId}</td>
                      <td className="font-mono">{grant.scoreUsed}</td>
                      <td>
                        {grant.status === "pending" && <Pill className="!border-warn/40 !text-warn">Pending</Pill>}
                        {grant.status === "approved" && <Pill tone="live">Approved</Pill>}
                        {grant.status === "paid" && <Pill tone="magenta">Paid</Pill>}
                        {grant.status === "rejected" && <Pill className="!border-danger/40 !text-danger">Rejected</Pill>}
                      </td>
                      <td>
                        {(grant.status === "approved" || grant.status === "paid") ? (
                          <button
                            className={cn("rounded-full border px-2.5 py-1 text-[10px] font-semibold transition", grant.published ? "border-gold/50 bg-gold/15 text-gold" : "border-white/12 text-muted hover:text-white")}
                            onClick={() => toggleGrantPublished(grant.id, "Admin")}
                          >
                            {grant.published ? "On wall" : "Add to wall"}
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted">—</span>
                        )}
                      </td>
                      <td className="text-right">
                        {grant.status === "pending" && (
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <button className="btn btn-ghost btn-sm" onClick={() => decide(grant.id, "rejected")}><X size={12} /> Reject</button>
                            <button className="btn btn-primary btn-sm" onClick={() => decide(grant.id, "approved")}><Check size={12} /> Approve</button>
                          </div>
                        )}
                        {grant.status === "approved" && (
                          <button className="btn btn-ghost btn-sm" onClick={() => decide(grant.id, "paid")}><BadgeCheck size={12} /> Mark paid</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] text-muted">Awards stay pending until verified. Amounts are never shown publicly; the wall shows names, tiers and the year only.</p>
        </div>
      )}

      {/* Award tiers editor */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            <Award size={12} className="text-gold" /> UTME award tiers — seeded for your review
          </p>
          {anyPendingReview && (
            <button className="btn btn-ghost btn-sm !border-gold/40 !text-gold" onClick={() => { markAwardTiersReviewed("Timfire"); toast.success("All tiers marked reviewed", "The programme is now final until you edit it again."); }}>
              <BadgeCheck size={13} /> I've reviewed the award amounts
            </button>
          )}
        </div>
        <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-muted">
          Boundaries are lower-bound inclusive and cannot overlap — the dashboard refuses any edit that breaks that.
          <span className="text-gold"> Every seeded amount is a starter value pending your review, not a promise.</span> Change
          amounts, artifacts, names, certificate variants and bounds freely; grading and certificates follow automatically.
        </p>
        <div className="mt-3 space-y-2">
          {tiers.map((tier) => (
            <div key={tier.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-sunken px-3 py-2.5">
              <div className="min-w-[150px] flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[12.5px] font-semibold leading-tight">
                  {tier.name}
                  {tier.pendingReview && <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.1em] text-gold">Pending Timfire's review</span>}
                  {!tier.active && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[8.5px] font-bold uppercase text-muted">Inactive</span>}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-muted">{tier.min}–{tier.max} · {tier.variant}</p>
              </div>
              <div className="min-w-[130px] flex-1 text-[11px] leading-snug text-muted">
                {tier.reward}<br />
                <span className="text-[10px]">{tier.artifact}</span>
              </div>
              <p className="w-24 text-right font-mono text-[12px] font-semibold text-gold">{fmt(tier)}</p>
              <div className="flex items-center gap-1.5">
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingTier({ ...tier })}>Edit</button>
                <button className="rounded-md p-1.5 text-muted transition hover:bg-danger/10 hover:text-danger" onClick={() => { if (window.confirm(`Delete the "${tier.name}" tier?`)) { deleteAwardTier(tier.id, "Timfire"); toast.success("Tier removed", tier.name); } }} aria-label="Delete tier">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          className="btn btn-ghost btn-sm mt-3"
          onClick={() =>
            setEditingTier({
              id: "",
              scope: "utme",
              name: "New UTME tier",
              min: 240,
              max: 249,
              reward: "Reward description",
              artifact: "Artifact",
              amount: 0,
              currency: "NGN",
              variant: "utme_merit",
              order: tiers.length + 1,
              active: true,
              pendingReview: true,
            })
          }
        >
          <Plus size={13} /> Add a tier
        </button>
      </div>

      {/* Slip viewer modal */}
      <Modal open={!!viewer} onClose={() => setViewer(null)} title="Official UTME result slip" size="lg"
        description="Verify: candidate name matches the KR8 profile, JAMB registration number is visible, and the score matches what the student entered. Look closely at watermarks and print quality — photocopies of photocopies are a red flag.">
        {viewer && (() => {
          const slip = db.utmeSlips.find((s) => s.id === viewer.slipId);
          if (!slip) return null;
          const student = studentById.get(slip.studentId);
          return (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-sunken p-3 text-[12px]">
                <div>
                  <p className="font-semibold">{student?.name}</p>
                  <p className="font-mono text-[10px] text-muted">{slip.studentId} · {student?.country}</p>
                </div>
                <p className="font-mono text-lg font-bold text-white">{slip.score}<span className="text-[11px] text-muted"> / 400</span></p>
              </div>
              {slip.dataUrl.startsWith("data:image") ? (
                <img src={slip.dataUrl} alt="UTME slip" className="max-h-[60vh] w-full rounded-xl border border-white/10 object-contain bg-sunken" />
              ) : (
                <p className="rounded-xl border border-white/10 bg-sunken p-6 text-center text-[12px] text-muted">{slip.fileName} — open the file to inspect it.</p>
              )}
              <div className="flex justify-end gap-2">
                <button className="btn btn-ghost !border-danger/40 !text-danger" onClick={() => verify(slip.id, false)}><X size={14} /> Reject</button>
                <button className="btn btn-primary" onClick={() => verify(slip.id, true)}><Check size={14} /> Approve & verify</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Tier editor modal */}
      <Modal open={!!editingTier} onClose={() => setEditingTier(null)} title={editingTier?.id ? "Edit award tier" : "Add award tier"} size="lg"
        description="Lower-bound inclusive. Tiers must not overlap — the system will refuse an overlapping save. Certificates, the wall and grading all follow these rules.">
        {editingTier && (
          <div className="space-y-3">
            <Field label="Tier name" htmlFor="tierName"><Input id="tierName" value={editingTier.name} onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From (inclusive)" htmlFor="tierMin"><Input id="tierMin" type="number" value={String(editingTier.min)} onChange={(e) => setEditingTier({ ...editingTier, min: Number(e.target.value) })} /></Field>
              <Field label="To (inclusive)" htmlFor="tierMax"><Input id="tierMax" type="number" value={String(editingTier.max)} onChange={(e) => setEditingTier({ ...editingTier, max: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Reward" htmlFor="tierReward"><Input id="tierReward" value={editingTier.reward} onChange={(e) => setEditingTier({ ...editingTier, reward: e.target.value })} /></Field>
            <Field label="Physical artifact" htmlFor="tierArtifact"><Input id="tierArtifact" value={editingTier.artifact} onChange={(e) => setEditingTier({ ...editingTier, artifact: e.target.value })} /></Field>
            <div className="grid grid-cols-[1fr_110px_130px] gap-3">
              <Field label="Amount" htmlFor="tierAmount"><Input id="tierAmount" type="number" value={String(editingTier.amount)} onChange={(e) => setEditingTier({ ...editingTier, amount: Number(e.target.value) })} /></Field>
              <Field label="Currency" htmlFor="tierCurrency"><Input id="tierCurrency" value={editingTier.currency} onChange={(e) => setEditingTier({ ...editingTier, currency: e.target.value.toUpperCase() })} /></Field>
              <Field label="Order" htmlFor="tierOrder"><Input id="tierOrder" type="number" value={String(editingTier.order)} onChange={(e) => setEditingTier({ ...editingTier, order: Number(e.target.value) })} /></Field>
            </div>
            <label className="flex items-center gap-2 text-[12px] text-muted"><input type="checkbox" className="h-4 w-4 accent-[#3d1250]" checked={editingTier.active} onChange={(e) => setEditingTier({ ...editingTier, active: e.target.checked })} /> Active (lowers award eligibility when unchecked)</label>
            <label className="flex items-center gap-2 text-[12px] text-warn"><input type="checkbox" className="h-4 w-4 accent-[#3d1250]" checked={editingTier.pendingReview} onChange={(e) => setEditingTier({ ...editingTier, pendingReview: e.target.checked })} /> Still pending Timfire's review</label>
            <div className="flex justify-end gap-2 pt-1">
              <button className="btn btn-ghost" onClick={() => setEditingTier(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveTier}><Check size={14} /> Save tier</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
