import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, BadgeCheck, Check, Loader2, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useDb } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import {
  moveScoringComponent,
  recordOverride,
  removeOverride,
  removeScoringComponent,
  setComponentScore,
  setScoringComponentActive,
  upsertScoringComponent,
} from "../../lib/store";
import { computeFinalScore, overrideFor } from "../../lib/scoring";
import { sendEmail, renderSubject, renderTemplate, templateVars } from "../../lib/email";
import { activeComponents } from "../../lib/scoring";
import { TRACKS, trackName } from "../../data/academy";
import { cn } from "../../lib/utils";
import { Field, Input, Modal, Pill, Textarea } from "../../components/ui";

export default function ScoresTab() {
  const db = useDb();
  const toast = useToast();
  const [newComponent, setNewComponent] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [overrideTarget, setOverrideTarget] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [busy, setBusy] = useState(false);

  const components = useMemo(() => [...db.components].sort((a, b) => a.order - b.order), [db.components]);
  const active = useMemo(() => activeComponents(db), [db]);

  const students = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.students
      .filter((s) => s.role === "student")
      .filter((s) => trackFilter === "all" || s.trackKey === trackFilter)
      .filter((s) => !q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [db.students, trackFilter, query]);

  function addComponent() {
    const result = upsertScoringComponent({ name: newComponent }, "Admin");
    if (!result.ok) return toast.error("Component not added", result.error ?? "Check the name.");
    setNewComponent("");
    toast.success("Component added", "Every student now has this component, marked out of 100.");
  }

  async function submitOverride() {
    if (!overrideTarget) return;
    setBusy(true);
    const result = recordOverride(overrideTarget, overrideReason, "Timfire");
    setBusy(false);
    if (!result.ok) return toast.error("Override refused", result.error ?? "Not allowed.");
    const student = db.students.find((s) => s.id === overrideTarget);
    const tpl = db.emailTemplates.override_recorded;
    if (student && tpl) {
      const vars = templateVars(db, {
        name: student.name,
        firstName: student.name.split(" ")[0],
        reason: overrideReason.trim(),
        score: String(Math.round((computeFinalScore(db, student.id).average ?? 0) * 10) / 10),
      });
      const sent = await sendEmail({ to: student.email, subject: renderSubject(tpl.subject, vars), html: renderTemplate(tpl.body, vars) });
      toast.success(
        "Override recorded",
        sent.ok ? "Who and why are on the record, and the student was emailed." : "Who and why are on the record. The email layer is not configured yet, so no student email went out."
      );
    } else {
      toast.success("Override recorded", "Who and why are on the record.");
    }
    setOverrideTarget(null);
    setOverrideReason("");
  }

  const threshold = db.settings.skillsCertificateThreshold;
  const floor = db.settings.skillsGraceFloor;

  return (
    <div className="space-y-5">
      {/* Components manager */}
      <div className="card p-5">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          <BadgeCheck size={12} className="text-live" /> Scored components — every one out of 100
        </p>
        <p className="mt-1.5 max-w-lg text-[12px] leading-relaxed text-muted">
          The final score is the <strong>average of all scored components</strong>. At {threshold}% the certificate is
          automatic. Between {floor}% and {threshold}% an administrator may graduate a student once — with the reason on
          the record — and below {floor}% nobody can. Add, rename, reorder or remove components; grading, certificates
          and reports follow instantly.
        </p>
        <div className="mt-4 space-y-2">
          {components.map((component, index) => (
            <div key={component.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-sunken px-3 py-2">
              <div className="flex flex-col">
                <button className="text-muted hover:text-white disabled:opacity-25" disabled={index === 0} onClick={() => moveScoringComponent(component.id, -1, "Admin")} aria-label="Move up"><ArrowUp size={13} /></button>
                <button className="text-muted hover:text-white disabled:opacity-25" disabled={index === components.length - 1} onClick={() => moveScoringComponent(component.id, 1, "Admin")} aria-label="Move down"><ArrowDown size={13} /></button>
              </div>
              <Input
                defaultValue={component.name}
                key={`${component.id}-${component.name}`}
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value.trim() !== component.name) {
                    upsertScoringComponent({ id: component.id, name: e.target.value }, "Admin");
                    toast.success("Renamed", `${component.name} → ${e.target.value.trim()}`);
                  }
                }}
                className="!py-1.5 text-[12px]"
              />
              <button
                className={cn("rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] transition", component.active ? "bg-live/15 text-live" : "bg-white/10 text-muted")}
                onClick={() => setScoringComponentActive(component.id, !component.active, "Admin")}
              >
                {component.active ? "Active" : "Off"}
              </button>
              <button
                className="rounded-md p-1.5 text-muted transition hover:bg-danger/10 hover:text-danger"
                title="Remove this component (its scores are deleted)"
                onClick={() => {
                  if (window.confirm(`Remove "${component.name}" and its saved scores? This cannot be undone.`)) {
                    removeScoringComponent(component.id, "Admin");
                    toast.success("Component removed", component.name);
                  }
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Add a component (e.g. Portfolio review)"
            value={newComponent}
            onChange={(e) => setNewComponent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addComponent()}
          />
          <button className="btn btn-primary" onClick={addComponent}><Plus size={14} /> Add</button>
        </div>
      </div>

      {/* Score entry grid */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Score entry — out of 100</p>
          <div className="flex flex-wrap items-center gap-2">
            <select className="input !w-auto" value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)}>
              <option value="all">All tracks</option>
              {TRACKS.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
              <option value="academic">Academics</option>
            </select>
            <Input placeholder="Search student or KR8 ID…" value={query} onChange={(e) => setQuery(e.target.value)} className="!w-52" />
          </div>
        </div>
        <p className="mt-1.5 text-[11px] text-muted">Values save on blur. A student with no scores in a component simply has no mark there yet — the average is taken over entered components.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="data-table text-[12px]">
            <thead>
              <tr>
                <th>Student</th>
                {active.map((c) => <th key={c.id} className="!text-right" title={c.name}>{c.name.length > 14 ? `${c.name.slice(0, 13)}…` : c.name}</th>)}
                <th className="!text-right">Final</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr><td colSpan={active.length + 3} className="text-center text-muted">No students match.</td></tr>
              )}
              {students.map((student) => {
                const final = computeFinalScore(db, student.id);
                const override = overrideFor(db, student.id);
                return (
                  <tr key={student.id}>
                    <td>
                      <p className="font-medium leading-tight">{student.name}{student.vip && <span className="ml-1.5 rounded bg-gold/20 px-1.5 text-[9px] font-bold uppercase text-gold">VIP</span>}</p>
                      <p className="font-mono text-[9.5px] text-muted">{student.id} · {trackName(student.trackKey)}</p>
                    </td>
                    {active.map((component) => {
                      const existing = db.scores.find((s) => s.studentId === student.id && s.componentId === component.id);
                      return (
                        <td key={component.id} className="!text-right">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.5"
                            defaultValue={existing ? String(existing.score) : ""}
                            key={`${student.id}-${component.id}-${existing?.enteredAt ?? "new"}`}
                            className="w-16 rounded-md border border-white/12 bg-sunken px-2 py-1.5 text-right font-mono text-[12px] outline-none focus:border-magenta"
                            placeholder="—"
                            onBlur={(e) => {
                              const raw = e.target.value.trim();
                              const value = raw === "" ? null : Number(raw);
                              if (value !== null && (!Number.isFinite(value) || value < 0 || value > 100)) {
                                toast.error("Out of range", "Scores are out of 100.");
                                return;
                              }
                              if ((existing?.score ?? null) === value) return;
                              setComponentScore(student.id, component.id, value, "Admin");
                            }}
                          />
                        </td>
                      );
                    })}
                    <td className="!text-right font-mono font-semibold">
                      {final.average === null ? "—" : final.average.toFixed(1)}
                    </td>
                    <td className="text-right">
                      {override ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Pill tone="magenta">Override</Pill>
                          <button className="text-[10px] text-muted hover:text-danger" onClick={() => { removeOverride(student.id, "Admin"); toast.success("Override removed", student.name); }}>undo</button>
                        </span>
                      ) : final.eligibility === "certificate" ? (
                        <Pill tone="live">Eligible</Pill>
                      ) : final.eligibility === "grace" ? (
                        <button className="btn btn-ghost btn-sm !text-warn" onClick={() => setOverrideTarget(student.id)} title={`${floor}%–${threshold}%: one-off grace with a recorded reason`}>
                          <ShieldAlert size={12} /> Grace override
                        </button>
                      ) : final.eligibility === "ineligible" ? (
                        <span className="text-[10px] font-semibold uppercase text-muted">Below {floor}</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override modal */}
      <Modal
        open={!!overrideTarget}
        onClose={() => setOverrideTarget(null)}
        title="Record a graduation override"
        description="Only possible between the grace floor and the certificate threshold. This is logged with your name and cannot be edited later — the reason you write here is the record."
      >
        {overrideTarget && (() => {
          const student = db.students.find((s) => s.id === overrideTarget);
          const final = student ? computeFinalScore(db, student.id) : null;
          return (
            <div className="space-y-4">
              <div className="rounded-xl border border-warn/30 bg-warn/8 p-3 text-[12px] leading-relaxed text-warn">
                <p className="font-semibold text-white">{student?.name}</p>
                <p className="mt-1">Current average: <span className="font-mono font-semibold">{final?.average?.toFixed(1)}%</span> · certificate at {threshold}% · grace floor {floor}%</p>
              </div>
              <Field label="Why is this override justified?" htmlFor="overrideReason" hint="Minimum 10 characters. Be specific: medical, family, circumstances, evidence reviewed.">
                <Textarea id="overrideReason" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="e.g. Consistent high performance in class; missed the final by 3% due to illness documented on 12 March. Strong before/after portfolio evidence reviewed with the coach." rows={4} />
              </Field>
              <div className="flex justify-end gap-2">
                <button className="btn btn-ghost" onClick={() => setOverrideTarget(null)}>Cancel</button>
                <button className="btn btn-primary" disabled={busy || overrideReason.trim().length < 10} onClick={submitOverride}>
                  {busy ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Record override
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
