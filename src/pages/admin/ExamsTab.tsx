import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ClipboardEdit,
  FileQuestion,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useDb } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { deleteExamModule, saveExamModule, setExamModuleActive } from "../../lib/store";
import type { ExamModule, ExamQuestion } from "../../lib/types";
import { cn, formatDateTime, uid } from "../../lib/utils";
import { Field, Input, Textarea } from "../../components/ui";

export default function ExamsTab() {
  const db = useDb();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(db.examModules[0]?.id ?? null);
  const module = db.examModules.find((m) => m.id === selectedId) ?? null;

  // Local editable copy of the selected module (saved explicitly for module-level fields).
  const [draft, setDraft] = useState<ExamModule | null>(module);
  useEffect(() => {
    setDraft(module ? { ...module, questions: module.questions.map((q) => ({ ...q, options: [...q.options] })) } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, module?.id]);

  const attempts = useMemo(
    () => db.examAttempts.filter((a) => a.submittedAt > 0 && a.moduleId === selectedId).sort((a, b) => b.submittedAt - a.submittedAt),
    [db.examAttempts, selectedId]
  );
  const studentById = useMemo(() => new Map(db.students.map((s) => [s.id, s])), [db.students]);

  function persistQuestions(questions: ExamQuestion[]) {
    if (!draft) return;
    setDraft({ ...draft, questions });
    saveExamModule({ id: draft.id, title: draft.title, instructions: draft.instructions, durationMin: draft.durationMin, passMark: draft.passMark, active: draft.active, questions }, "Admin");
  }

  function saveModule() {
    if (!draft) return;
    const result = saveExamModule({ id: draft.id, title: draft.title, instructions: draft.instructions, durationMin: draft.durationMin, passMark: draft.passMark, active: draft.active, questions: draft.questions }, "Admin");
    if (!result.ok) return toast.error("Not saved", result.error ?? "Check the fields.");
    toast.success("Exam saved", draft.title);
  }

  function createModule() {
    const result = saveExamModule(
      { title: "New KR8 exam", instructions: "Read every question carefully. You have the timer shown. 80% is required for the certificate.", durationMin: 60, passMark: 80, active: false, questions: [] },
      "Admin"
    );
    if (result.ok) {
      setSelectedId(result.id ?? null);
      toast.success("Exam created", "Inactive by default — add questions, then activate it.");
    }
  }

  function addQuestion() {
    if (!draft) return;
    persistQuestions([
      ...draft.questions,
      { id: uid("Q"), prompt: "", options: ["", "", "", ""], correctIndex: 0, points: 10 },
    ]);
  }

  function updateQuestion(index: number, patch: Partial<ExamQuestion>) {
    if (!draft) return;
    const questions = draft.questions.map((q, i) => (i === index ? { ...q, ...patch } : q));
    persistQuestions(questions);
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    if (!draft) return;
    const questions = [...draft.questions];
    const swap = index + direction;
    if (swap < 0 || swap >= questions.length) return;
    [questions[index], questions[swap]] = [questions[swap], questions[index]];
    persistQuestions(questions);
  }

  function removeQuestion(index: number) {
    if (!draft) return;
    if (!window.confirm("Remove this question?")) return;
    persistQuestions(draft.questions.filter((_, i) => i !== index));
  }

  const totalPoints = draft ? draft.questions.reduce((sum, q) => sum + (q.points || 0), 0) : 0;

  return (
    <div className="space-y-5">
      {/* Module picker */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              <FileQuestion size={12} className="text-cyan" /> KR8's own exam — questions, timing & results
            </p>
            <p className="mt-1.5 max-w-xl text-[12px] leading-relaxed text-muted">
              For students preparing for WAEC, NECO or any other exam — and for those not writing one yet. The
              certificate threshold is {db.settings.kr8ExamPassMark}% (editable per module). UTME students do not sit this
              for their headline certificate — their official score decides that.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={createModule}><Plus size={13} /> New exam</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {db.examModules.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition",
                selectedId === m.id ? "border-magenta bg-magenta/10" : "border-white/12 bg-sunken hover:border-white/30"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", m.active ? "bg-live" : "bg-warn")} />
              <span>
                <span className="block text-[12px] font-semibold">{m.title}</span>
                <span className="block text-[9.5px] text-muted">{m.questions.length} questions · {m.durationMin} min · pass {m.passMark}%</span>
              </span>
            </button>
          ))}
          {db.examModules.length === 0 && <p className="text-[12px] text-muted">No exams yet — create one.</p>}
        </div>
      </div>

      {draft && (
        <>
          {/* Module editor */}
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Exam settings</p>
              <div className="flex items-center gap-2">
                <button
                  className={cn("rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition", draft.active ? "border-live/40 bg-live/10 text-live" : "border-warn/40 bg-warn/10 text-warn")}
                  onClick={() => setExamModuleActive(draft.id, !draft.active, "Admin")}
                >
                  {draft.active ? "Live for students" : "Inactive — hidden"}
                </button>
                <button className="btn btn-ghost btn-sm !text-danger" onClick={() => { if (window.confirm(`Delete "${draft.title}" and its questions?`)) { deleteExamModule(draft.id, "Admin"); setSelectedId(null); toast.success("Exam deleted", draft.title); } }}><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Title" htmlFor="examTitle" className="sm:col-span-2"><Input id="examTitle" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
              <Field label="Duration (minutes)" htmlFor="examDur"><Input id="examDur" type="number" value={String(draft.durationMin)} onChange={(e) => setDraft({ ...draft, durationMin: Number(e.target.value) })} /></Field>
              <Field label="Pass mark (%)" htmlFor="examPass"><Input id="examPass" type="number" value={String(draft.passMark)} onChange={(e) => setDraft({ ...draft, passMark: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Instructions shown to students" htmlFor="examInstr" className="mt-3">
              <Textarea id="examInstr" rows={2} value={draft.instructions} onChange={(e) => setDraft({ ...draft, instructions: e.target.value })} />
            </Field>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10.5px] text-muted">{draft.questions.length} questions · {totalPoints} total points · changes to questions save instantly</p>
              <button className="btn btn-primary btn-sm" onClick={saveModule}><Save size={13} /> Save settings</button>
            </div>
          </div>

          {/* Question editor */}
          <div className="card p-5">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              <ClipboardEdit size={12} className="text-warn" /> Questions
            </p>
            <div className="mt-3 space-y-4">
              {draft.questions.map((q, index) => (
                <div key={q.id} className="rounded-2xl border border-white/10 bg-sunken p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <span className="font-mono text-[11px] font-bold text-muted">Q{index + 1}</span>
                      <button className="text-muted hover:text-white disabled:opacity-25" disabled={index === 0} onClick={() => moveQuestion(index, -1)} aria-label="Move up"><ArrowUp size={13} /></button>
                      <button className="text-muted hover:text-white disabled:opacity-25" disabled={index === draft.questions.length - 1} onClick={() => moveQuestion(index, 1)} aria-label="Move down"><ArrowDown size={13} /></button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Textarea rows={2} placeholder="Question" value={q.prompt} onChange={(e) => updateQuestion(index, { prompt: e.target.value })} />
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {q.options.map((option, oi) => (
                          <label key={oi} className={cn("flex items-center gap-2 rounded-xl border px-2.5 py-2 transition", q.correctIndex === oi ? "border-live/50 bg-live/8" : "border-white/10")}>
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              className="h-4 w-4 accent-[#0f8a5f]"
                              checked={q.correctIndex === oi}
                              onChange={() => updateQuestion(index, { correctIndex: oi })}
                              aria-label={`Mark option ${oi + 1} correct`}
                            />
                            <input
                              className="w-full bg-transparent text-[12px] outline-none placeholder:text-muted-2"
                              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                              value={option}
                              onChange={(e) => {
                                const options = [...q.options];
                                options[oi] = e.target.value;
                                updateQuestion(index, { options });
                              }}
                            />
                          </label>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-[10.5px] text-muted">
                          Points
                          <input type="number" min={1} className="w-16 rounded-md border border-white/12 bg-raised px-2 py-1.5 font-mono text-[11px] outline-none" value={String(q.points)} onChange={(e) => updateQuestion(index, { points: Math.max(1, Number(e.target.value) || 1) })} />
                        </label>
                        <button className="text-[10.5px] font-semibold text-muted hover:text-danger" onClick={() => removeQuestion(index)}>Remove question</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {draft.questions.length === 0 && <p className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-[12px] text-muted">No questions yet — add the first one below.</p>}
            </div>
            <button className="btn btn-primary btn-sm mt-3" onClick={addQuestion}><Plus size={13} /> Add question</button>
          </div>

          {/* Results */}
          <div className="card p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Attempts & results</p>
            {attempts.length === 0 ? (
              <p className="mt-3 text-[12px] text-muted">No attempts yet.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="data-table text-[12px]">
                  <thead>
                    <tr><th>Student</th><th>Score</th><th>Result</th><th>Submitted</th></tr>
                  </thead>
                  <tbody>
                    {attempts.map((a) => {
                      const student = studentById.get(a.studentId);
                      return (
                        <tr key={a.id}>
                          <td><p className="font-medium leading-tight">{student?.name ?? a.studentId}</p><p className="font-mono text-[9.5px] text-muted">{a.studentId}</p></td>
                          <td className="font-mono font-semibold">{a.scorePct.toFixed(1)}%</td>
                          <td>{a.passed ? <span className="font-semibold text-live">Pass</span> : <span className="font-semibold text-danger">Below {draft.passMark}%</span>}</td>
                          <td className="text-muted">{formatDateTime(a.submittedAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
