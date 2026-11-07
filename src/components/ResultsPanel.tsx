import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  ShieldCheck,
  Timer,
  Trophy,
  Upload,
} from "lucide-react";
import { useDb } from "../lib/hooks";
import { useToast } from "../lib/toast";
import {
  computeFinalScore,
  kr8ExamResult,
  meetsUtmeParticipation,
  overrideFor,
  participationPct,
  utmeCertificateEligible,
} from "../lib/scoring";
import {
  db as readDb,
  startExamAttempt,
  submitExamAttempt,
  submitUtmeSlip,
} from "../lib/store";
import type { AwardGrant, ExamModule, ExamAttempt, Student } from "../lib/types";
import { cn, formatDateTime, timeAgo } from "../lib/utils";
import { Field, Input, Pill, Progress, Textarea } from "./ui";

export function ResultsPanel({ student }: { student: Student }) {
  const db = useDb();
  const toast = useToast();
  const isAcademic = student.side === "academic" || !!student.academic;

  const final = computeFinalScore(db, student.id);
  const override = overrideFor(db, student.id);
  const participation = participationPct(db, student.id);
  const participationOk = meetsUtmeParticipation(db, student.id);
  const verifiedSlip = db.utmeSlips.find((s) => s.studentId === student.id && s.status === "verified") ?? null;
  const pendingSlip = db.utmeSlips.find((s) => s.studentId === student.id && s.status === "pending") ?? null;
  const slipEligibility = utmeCertificateEligible(db, student.id);
  const myGrants = db.awardGrants
    .filter((g) => g.studentId === student.id)
    .sort((a, b) => b.createdAt - a.createdAt);
  const threshold = db.settings.skillsCertificateThreshold;
  const floor = db.settings.skillsGraceFloor;

  const [slipScore, setSlipScore] = useState("");
  const [slipFile, setSlipFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [slipNote, setSlipNote] = useState("");
  const [slipBusy, setSlipBusy] = useState(false);

  function onSlipFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Too large", "Slip images must be under 4 MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSlipFile({ name: file.name, dataUrl: String(reader.result ?? "") });
    reader.readAsDataURL(file);
  }

  async function submitSlip() {
    if (!slipFile) return toast.error("Attach the slip", "A photo or scan of your official result slip is required.");
    const score = Number(slipScore);
    setSlipBusy(true);
    const result = submitUtmeSlip(student.id, { score, fileName: slipFile.name, dataUrl: slipFile.dataUrl, note: slipNote });
    setSlipBusy(false);
    if (!result.ok) return toast.error("Not submitted", result.error ?? "Check the slip details.");
    toast.success("Slip received", "The academy verifies every slip against the candidate's details before any prize is approved.");
    setSlipScore("");
    setSlipFile(null);
    setSlipNote("");
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Results & awards</p>
        <h1 className="display display-md mt-2">Where you stand.</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">
          {isAcademic
            ? "Your UTME record — participation, your verified slip and any awards — lives here. Attendance and assignments are recorded; only the official, verified result decides your certificate and prizes."
            : `Your track score is the average of every component marked out of 100. ${threshold} averages a certificate; the academy may graduate ${floor}–${threshold - 0.01} by documented override — never below ${floor}.`}
        </p>
      </div>

      {/* Skills track record */}
      {!isAcademic && (
        <div className="card p-5">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            <BookOpenCheck size={12} className="text-magenta-bright" /> Skill track score
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="data-table text-[12px]">
              <thead>
                <tr><th>Component</th><th className="text-right">Score /100</th></tr>
              </thead>
              <tbody>
                {final.components.map((component) => (
                  <tr key={component.id}>
                    <td>{component.name}</td>
                    <td className="text-right font-semibold tabular-nums">{component.score ?? "—"}</td>
                  </tr>
                ))}
                {final.components.length === 0 && (
                  <tr><td colSpan={2} className="text-center text-muted">No components configured yet.</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td className="font-semibold">Average ({final.scoredCount} of {final.components.length} marked)</td>
                  <td className="text-right font-display text-[15px] font-semibold tabular-nums">{final.average ?? "—"}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {final.eligibility === "certificate" && <Pill tone="live"><CheckCircle2 size={10} /> Certificate eligible — average ≥ {threshold}</Pill>}
            {final.eligibility === "grace" && <Pill className="!border-warn/40 !text-warn">Within the {floor}–{Math.floor(threshold)} grace band — the academy may graduate you by override</Pill>}
            {final.eligibility === "ineligible" && <Pill tone="default">Below the {floor} floor — no award</Pill>}
            {final.eligibility === "none" && <Pill tone="default">No marks recorded yet</Pill>}
            {override && (
              <Pill tone="magenta"><BadgeCheck size={10} /> Graduated by override — {timeAgo(override.at)}</Pill>
            )}
          </div>
          {override && (
            <p className="mt-2 rounded-lg bg-magenta/8 p-3 text-[11px] leading-relaxed text-body">
              Override recorded by {override.actor} at {override.finalScoreAtOverride}%: “{override.reason}”
            </p>
          )}
        </div>
      )}

      {/* UTME academic record */}
      {isAcademic && (
        <div className="card p-5">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            <ShieldCheck size={12} className="text-live" /> Your UTME record
          </p>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-sunken p-4">
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Participation</p>
              <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums">{participation}%</p>
              <div className="mt-2"><Progress value={participation} /></div>
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
                Classes + assignments against the cohort expectations. Minimum {db.settings.jambMinParticipationPct}% before any prize may be approved.
              </p>
              {participationOk
                ? <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-live"><CheckCircle2 size={11} /> Participation bar met</p>
                : <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-danger">Below the minimum — keep attending</p>}
            </div>

            <div className="rounded-xl border border-white/10 bg-sunken p-4">
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Official result slip</p>
              {verifiedSlip ? (
                <>
                  <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums">{verifiedSlip.score}<span className="text-[12px] font-normal text-muted"> / 400</span></p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-live"><BadgeCheck size={11} /> Verified by the academy</p>
                  <p className="mt-1.5 text-[10.5px] text-muted">Certificate threshold: {db.settings.utmeCertificateThreshold}. {slipEligibility.ok ? "You are eligible." : slipEligibility.reason}</p>
                </>
              ) : pendingSlip ? (
                <>
                  <p className="mt-1.5 font-display text-lg font-semibold">Awaiting verification</p>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-muted">You submitted a slip showing <strong className="text-white">{pendingSlip.score}</strong> on {formatDateTime(pendingSlip.submittedAt)}. The academy cross-checks it against your details before anything is approved — usually within one working day.</p>
                </>
              ) : (
                <>
                  <p className="mt-1.5 font-display text-lg font-semibold">Not submitted yet</p>
                  <p className="mt-1 text-[10.5px] text-muted">Upload a photo or scan of your official UTME result slip once you sit the exam.</p>
                </>
              )}
            </div>
          </div>

          {!verifiedSlip && (
            <div className="mt-4 rounded-xl border border-dashed border-white/15 p-4">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted"><Upload size={12} /> {pendingSlip ? "Replace your slip" : "Upload your UTME slip"}</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-[140px_1fr]">
                <Field label="Score on slip" htmlFor="slip-score">
                  <Input id="slip-score" type="number" min={0} max={400} inputMode="numeric" placeholder="e.g. 268" value={slipScore} onChange={(e) => setSlipScore(e.target.value)} />
                </Field>
                <div>
                  <Field label="Photo / scan of slip" htmlFor="slip-file" hint="JPG, PNG or PDF · under 4 MB">
                    <input id="slip-file" type="file" accept="image/*,.pdf" onChange={onSlipFile} className="block w-full text-[11px] text-muted file:mr-2 file:rounded-md file:border-0 file:bg-magenta-fill file:px-2.5 file:py-1.5 file:text-[11px] file:font-semibold file:text-white" />
                  </Field>
                  {slipFile && <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-live"><FileText size={10} /> {slipFile.name}</p>}
                </div>
              </div>
              <Field label="Note for the verifier (optional)" htmlFor="slip-note" className="mt-2">
                <Textarea id="slip-note" rows={1} value={slipNote} onChange={(e) => setSlipNote(e.target.value)} placeholder="Anything we should know — e.g. name spelling on the slip differs slightly." />
              </Field>
              <button type="button" className="btn btn-primary btn-sm mt-2" disabled={slipBusy} onClick={submitSlip}>
                {slipBusy ? <Loader2 size={13} className="spin" /> : <Upload size={13} />} Submit for verification
              </button>
            </div>
          )}
        </div>
      )}

      {/* KR8's own exam */}
      <ExamSection student={student} />

      {/* Awards */}
      <div className="card p-5">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          <Trophy size={12} className="text-gold" /> Awards & recognition
        </p>
        {myGrants.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-white/12 px-4 py-6 text-center text-[12px] leading-relaxed text-muted">
            No awards yet — finish your assignments, stay consistent, and keep your results ready when the exam comes.
          </p>
        ) : (
          <div className="mt-3 grid gap-2">
            {myGrants.map((grant) => {
              const tier = db.awardTiers.find((t) => t.id === grant.tierId);
              return (
                <div key={grant.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3">
                  <Award size={16} className="shrink-0 text-gold" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold">{tier?.name ?? "KR8 Scholar"}{grant.scope === "utme" ? " · UTME" : " · KR8 exam"}</p>
                    <p className="text-[10px] text-muted">Score used {grant.scoreUsed} · earned {timeAgo(grant.createdAt)}{grant.published ? " · shown on the wall" : ""}</p>
                  </div>
                  <GrantStatus grant={grant} />
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-3 text-[10.5px] text-muted">
          Verified, approved and paid awards are celebrated on the <Link to="/wall" className="font-semibold text-magenta-bright hover:underline">recognition wall</Link>.
        </p>
      </div>
    </div>
  );
}

function GrantStatus({ grant }: { grant: AwardGrant }) {
  if (grant.status === "paid") return <Pill tone="live">Paid</Pill>;
  if (grant.status === "approved") return <Pill tone="magenta">Approved</Pill>;
  if (grant.status === "rejected") return <Pill tone="default">Not awarded</Pill>;
  return <Pill className="!border-warn/40 !text-warn">Awaiting approval</Pill>;
}

/* ------------------------------------------------------------------ */
/* KR8 exam                                                            */
/* ------------------------------------------------------------------ */

function ExamSection({ student }: { student: Student }) {
  const db = useDb();
  const toast = useToast();
  const activeModules = db.examModules.filter((m) => m.active);
  const [session, setSession] = useState<{ module: ExamModule; attempt: ExamAttempt } | null>(null);

  const myAttempts = useMemo(
    () => db.examAttempts.filter((a) => a.studentId === student.id && a.submittedAt > 0),
    [db.examAttempts, student.id]
  );

  if (session) {
    return <ExamRunner module={session.module} attempt={session.attempt} onDone={() => setSession(null)} />;
  }

  return (
    <div className="card p-5">
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        <BookOpenCheck size={12} className="text-cyan" /> KR8 examination
      </p>
      <p className="mt-1.5 max-w-2xl text-[11.5px] leading-relaxed text-muted">
        For WAEC / NECO candidates not yet sitting UTME, and for anyone whose slip is not yet due. Passing the KR8
        exam (default mark {db.settings.kr8ExamPassMark}) earns the certificate; it decides nothing about prizes — those
        follow the UTME result alone.
      </p>

      {activeModules.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-white/12 px-4 py-6 text-center text-[12px] text-muted">No KR8 exam is open right now — the academy will announce when one goes live.</p>
      ) : (
        <div className="mt-3 grid gap-3">
          {activeModules.map((module) => {
            const best = kr8ExamResult(db, module.id, student.id);
            const open = db.examAttempts.find((a) => a.moduleId === module.id && a.studentId === student.id && a.submittedAt === 0);
            return (
              <div key={module.id} className="rounded-xl border border-white/10 bg-sunken p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold">{module.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-3 text-[10px] text-muted">
                      <span className="inline-flex items-center gap-1"><Clock size={10} /> {module.durationMin} min</span>
                      <span>{module.questions.length} questions</span>
                      <span>Pass mark {module.passMark}%</span>
                    </p>
                    {module.instructions && <p className="mt-1.5 max-w-lg text-[11px] leading-relaxed text-muted">{module.instructions}</p>}
                    {best && (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold">
                        {best.passed
                          ? <span className="inline-flex items-center gap-1 text-live"><CheckCircle2 size={11} /> Passed · best {best.scorePct}%</span>
                          : <span className="text-danger">Not yet · best {best.scorePct}% (needs {module.passMark}%)</span>}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm shrink-0"
                    onClick={() => {
                      if (open) {
                        setSession({ module, attempt: open });
                        return;
                      }
                      const result = startExamAttempt(module.id, student.id);
                      if (!result.ok) return toast.error("Not open", result.error ?? "Try again.");
                      const fresh = readDb().examAttempts.find((a) => a.id === result.attemptId);
                      if (fresh) setSession({ module, attempt: fresh });
                      else toast.error("Could not start", "Refresh and try again.");
                    }}
                  >
                    {open ? "Resume exam" : best ? "Retake" : "Start exam"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {myAttempts.length > 0 && <p className="mt-2 text-[10px] text-muted">{myAttempts.length} submitted attempt{myAttempts.length === 1 ? "" : "s"} on record — the academy sees the same history.</p>}
    </div>
  );
}

function ExamRunner({ module, attempt, onDone }: { module: ExamModule; attempt: ExamAttempt; onDone: () => void }) {
  const toast = useToast();
  const [answers, setAnswers] = useState<Array<number | null>>(() => module.questions.map(() => null));
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor(module.durationMin * 60 - (Date.now() - attempt.startedAt) / 1000)));
  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false);

  function finish() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const result = submitExamAttempt(attempt.id, answers);
    if (!result.ok) {
      toast.error("Not submitted", result.error ?? "Try again.");
      submittedRef.current = false;
      return;
    }
    setSubmitted(true);
    toast.success(
      result.passed ? "Passed!" : "Submitted",
      `You scored ${result.scorePct}% — the academy has been notified.`
    );
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.floor(module.durationMin * 60 - (Date.now() - attempt.startedAt) / 1000));
      setRemaining(left);
      if (left === 0 && !submittedRef.current) finish();
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module.durationMin, attempt.startedAt]);

  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  const danger = remaining <= 30;
  const answered = answers.filter((a) => a !== null).length;

  if (submitted) {
    return (
      <div className="card p-6 text-center">
        <CheckCircle2 size={28} className="mx-auto text-live" />
        <h2 className="display display-sm mt-3">Attempt submitted.</h2>
        <p className="mx-auto mt-1.5 max-w-md text-[12.5px] leading-relaxed text-muted">Your answers are recorded. Head back to the exam list to see your standing, or return to the dashboard.</p>
        <button type="button" className="btn btn-primary mt-4" onClick={onDone}>Back to exams</button>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <p className="text-[13px] font-semibold">{module.title}</p>
          <p className="text-[10px] text-muted">{answered}/{module.questions.length} answered</p>
        </div>
        <p className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[13px] font-semibold tabular-nums", danger ? "border-danger/40 bg-danger/10 text-danger" : "border-white/12 text-white")}>
          <Timer size={13} /> {minutes}:{seconds}
        </p>
      </div>
      <p className="mt-2 text-[10.5px] text-muted">The timer runs from the moment your attempt started — it cannot be paused. When it hits zero your answers are submitted automatically.</p>

      <ol className="mt-4 space-y-4">
        {module.questions.map((question, index) => (
          <li key={question.id} className="rounded-xl border border-white/10 p-4">
            <p className="text-[12.5px] font-semibold"><span className="font-mono text-muted">{index + 1}.</span> {question.prompt} <span className="ml-1 text-[10px] font-normal text-muted">({question.points} pt{question.points === 1 ? "" : "s"})</span></p>
            <div className="mt-2 grid gap-1.5">
              {question.options.map((option, optionIndex) => {
                const checked = answers[index] === optionIndex;
                return (
                  <label key={optionIndex} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[12px] transition", checked ? "border-magenta/60 bg-magenta/10" : "border-white/10 hover:border-white/25")}>
                    <input type="radio" name={`q-${question.id}`} className="sr-only" checked={checked} onChange={() => setAnswers((prev) => prev.map((a, i) => (i === index ? optionIndex : a)))} />
                    <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-full border", checked ? "border-magenta-bright bg-magenta-fill" : "border-white/30")}>
                      {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    {option}
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
        <p className="text-[11px] text-muted">{module.questions.length - answered} unanswered</p>
        <button type="button" className="btn btn-primary" onClick={finish}>Submit exam</button>
      </div>
    </div>
  );
}
