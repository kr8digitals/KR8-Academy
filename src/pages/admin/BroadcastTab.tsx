import { useEffect, useMemo, useRef, useState } from "react";
import {
  Megaphone, Send, Download, Info, Users, CheckCircle2, AlertTriangle,
  Inbox, ChevronDown, ChevronUp, History, Wifi, WifiOff, Sparkles,
} from "lucide-react";
import { TRACKS } from "../../data/academy";
import {
  DEFAULT_SEGMENT,
  resolveAudience,
  audienceLabel,
  renderBroadcastTemplate,
  learningGroupFor,
  runBroadcast,
  listBroadcasts,
  pendingOutboxCount,
  listOutbox,
  flushOutbox,
  exportContactsCsv,
  type BroadcastSegment,
} from "../../lib/store";
import { whatsappStatus } from "../../lib/whatsapp";
import { useDb } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Button, Pill, Select } from "../../components/ui";
import { cn, download, timeAgo } from "../../lib/utils";

const TOKENS = [
  { token: "{first}", label: "First name / nickname" },
  { token: "{name}", label: "Full name" },
  { token: "{id}", label: "KR8 ID" },
  { token: "{track}", label: "Track" },
  { token: "{cohort}", label: "Cohort" },
  { token: "{group}", label: "Their group link" },
] as const;

const PRESETS: Array<{ id: string; label: string; body: string }> = [
  { id: "custom", label: "Write from scratch", body: "" },
  { id: "welcome", label: "Welcome & introductions", body: "Karibu, {first} — welcome to KR8 Academy. Your KR8 ID is {id}. Your {track} learning group is here: {group}. See you Mon · Wed · Fri · 8–9pm WAT. — KR8 Academy" },
  { id: "missed", label: "Missed class nudge", body: "Hey {first} — you missed the last live session. Everything okay? Log in and check the schedule; the work won't do itself, but we will push you. — KR8 Academy" },
  { id: "deadline", label: "Assignment deadline", body: "Hey {first} — assignments close this week. Submit something — even a draft — and get feedback. Your KR8 ID {id} is only worth as much as the work behind it. — KR8 Academy" },
  { id: "spotlight", label: "Spotlight shoutout", body: "Hey {first} — the monthly spotlight goes to the most consistent person in the room. You are closer than you think. Keep showing up. — KR8 Academy" },
  { id: "certificate", label: "Certificate push", body: "Hey {first} — you are within reach of your certificate. One more strong week and it is yours. Log in; let's finish what you started. — KR8 Academy" },
  { id: "graduation", label: "Graduation heads-up", body: "Hey {first} — final steps are on the table for {cohort}. Bring your best work to Friday's class; graduation is earned, not attended. — KR8 Academy" },
  { id: "announcement", label: "General announcement", body: "Hey {first} — an announcement from KR8 Academy: " },
];

function Segmented<T extends string>({
  value, onChange, options, ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
            value === opt.value
              ? "border-magenta/60 bg-magenta/15 text-magenta-bright shadow-[0_0_0_1px_rgba(224,38,196,0.35)]"
              : "border-white/12 text-muted hover:border-white/25 hover:text-white"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function BroadcastTab({ actor }: { actor: string }) {
  const db = useDb();
  const toast = useToast();
  const [segment, setSegment] = useState<BroadcastSegment>({ ...DEFAULT_SEGMENT });
  const [template, setTemplate] = useState(PRESETS[1].body);
  const [alsoInApp, setAlsoInApp] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ configured: boolean; detail?: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<null | { sent: number; queued: number; failed: number; audience: string }>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    void whatsappStatus().then(setStatus);
  }, []);

  const audience = useMemo(() => resolveAudience(segment), [segment, db]);
  const label = useMemo(() => audienceLabel(segment), [segment]);
  const history = useMemo(() => listBroadcasts(8), [db]);
  const pending = pendingOutboxCount();
  const outbox = useMemo(() => listOutbox(5).filter((m) => m.status === "queued"), [db]);
  const previewTarget = audience[0];
  const preview = previewTarget
    ? renderBroadcastTemplate(template || "…", previewTarget, learningGroupFor(previewTarget.trackKey, previewTarget.side ?? "skill")?.url)
    : "Pick an audience first.";

  const set = <K extends keyof BroadcastSegment>(key: K, value: BroadcastSegment[K]) =>
    setSegment((prev) => ({ ...prev, [key]: value }));

  const insertToken = (token: string) => {
    const el = textareaRef.current;
    setTemplate((current) => {
      if (!el) return current + token;
      const start = el.selectionStart ?? current.length;
      const end = el.selectionEnd ?? current.length;
      const next = current.slice(0, start) + token + current.slice(end);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + token.length;
        el.setSelectionRange(pos, pos);
      });
      return next;
    });
  };

  const send = async () => {
    const n = audience.length;
    const willQueue = status ? !status.configured : true;
    const ok = window.confirm(
      willQueue
        ? `WhatsApp delivery is not connected yet.\n\nThis will QUEUE ${n} personalized message${n === 1 ? "" : "s"} (${label}) — nothing is sent until WHATSAPP_TOKEN is set. Each will also land in their in-app feeds.\n\nQueue them?`
        : `Send this message to ${n} ${n === 1 ? "person" : "people"}?\n\nAudience: ${label}\n\nEvery message is personalized with their name or nickname, KR8 ID and group link. This cannot be unsent.`
    );
    if (!ok) return;
    setBusy(true);
    const result = await runBroadcast({ segment, template, actor, alsoInApp });
    setBusy(false);
    if (!result.ok || !result.record) {
      toast.error("Not sent", result.error ?? "Check the message and audience.");
      return;
    }
    const r = result.record;
    setLastResult({ sent: r.sent, queued: r.queued, failed: r.failed, audience: r.audienceLabel });
    toast.success(
      r.queued > 0 ? "Messages queued" : "Messages sent",
      `${r.sent} sent · ${r.queued} queued · ${r.failed} failed — ${r.audienceLabel}`
    );
    if (r.queued > 0) void whatsappStatus().then(setStatus);
  };

  const flush = async () => {
    setBusy(true);
    const result = await flushOutbox();
    setBusy(false);
    toast.success("Outbox flushed", `${result.sent} sent · ${result.failed} failed · ${result.remaining} still queued.`);
  };

  const exportSegment = () => {
    download(`kr8-contacts-${segment.trackKey}-${Date.now()}.csv`, exportContactsCsv(segment), "text/csv");
    toast.success("CSV exported", `${audience.length} contacts — ${label}`);
  };
  const exportEveryone = () => {
    download(`kr8-contacts-everyone-${Date.now()}.csv`, exportContactsCsv(), "text/csv");
    toast.success("CSV exported", "Every contact in the academy.");
  };

  const canSend = template.trim().length >= 10 && audience.length > 0 && !busy;

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow flex items-center gap-2"><Megaphone size={12} /> Bulk WhatsApp</p>
        <h1 className="display display-md mt-2">One tap. The whole room.</h1>
        <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted">
          Pick who hears it — everyone, one track, one band, one list — write it once, and every message goes out
          personalized: their name or nickname, their KR8 ID, their group link. Nobody ever gets a bare “Dear
          student”.
        </p>
      </div>

      {lastResult && (
        <div className="flex items-start gap-2 rounded-xl border border-live/35 bg-live/8 px-4 py-3 text-[11.5px] leading-relaxed text-live">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          <span>
            Last run — <strong>{lastResult.sent} sent</strong> · <strong>{lastResult.queued} queued</strong> · <strong>{lastResult.failed} failed</strong>
            <span className="text-live/70"> ({lastResult.audience})</span>
          </span>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        {/* ============ Compose column ============ */}
        <div className="space-y-5">
          {/* Audience */}
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                <Users size={12} /> Who receives this
              </p>
              <span className="inline-flex items-center gap-2 rounded-full border border-magenta/45 bg-magenta/10 px-3 py-1 font-display text-[13px] font-bold text-magenta-bright tabular-nums">
                {audience.length} <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-magenta-bright/80">will receive it</span>
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-2">Group</p>
                <Segmented
                  ariaLabel="Side"
                  value={segment.side}
                  onChange={(v) => set("side", v)}
                  options={[
                    { value: "all", label: "Everyone" },
                    { value: "skill", label: "Creative skills" },
                    { value: "academic", label: "Academics" },
                  ]}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-2">Track</p>
                  <Select value={segment.trackKey} onChange={(e) => set("trackKey", e.target.value)} aria-label="Track">
                    <option value="all">All tracks</option>
                    {TRACKS.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
                  </Select>
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-2">Account status</p>
                  <Select value={segment.status} onChange={(e) => set("status", e.target.value as BroadcastSegment["status"])} aria-label="Status">
                    <option value="all">Any (not suspended)</option>
                    <option value="active">Active only</option>
                    <option value="paused">Paused only</option>
                    <option value="pending">Pending only</option>
                  </Select>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-2">Showing up?</p>
                <Segmented
                  ariaLabel="Attendance band"
                  value={segment.band}
                  onChange={(v) => set("band", v)}
                  options={[
                    { value: "all", label: "Anyone" },
                    { value: "showing", label: "Showing up (≥6 classes)" },
                    { value: "flagged", label: "Off the radar (<6)" },
                  ]}
                />
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-2">Special list</p>
                <Segmented
                  ariaLabel="Special list"
                  value={segment.special}
                  onChange={(v) => set("special", v)}
                  options={[
                    { value: "none", label: "None" },
                    { value: "spotlight", label: "Spotlight winners" },
                    { value: "certificate-ready", label: "Graduation-ready" },
                    { value: "graduates", label: "Graduates" },
                  ]}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-white/8 pt-3">
                <p className="mr-auto text-[11px] leading-snug text-muted">{label}</p>
                <button type="button" onClick={exportSegment} className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-2.5 py-1.5 text-[10.5px] font-semibold text-muted transition hover:border-white/25 hover:text-white">
                  <Download size={11} /> This list
                </button>
                <button type="button" onClick={exportEveryone} className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-2.5 py-1.5 text-[10.5px] font-semibold text-muted transition hover:border-white/25 hover:text-white">
                  <Download size={11} /> Everyone
                </button>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                <Sparkles size={12} /> What you say
              </p>
              <Select
                aria-label="Start from a preset"
                className="!h-8 !w-auto !text-[11px]"
                value="welcome"
                onChange={(e) => {
                  const preset = PRESETS.find((p) => p.id === e.target.value);
                  if (preset) setTemplate(preset.body);
                }}
              >
                {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </Select>
            </div>
            <textarea
              ref={textareaRef}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={5}
              placeholder="Karibu, {first} — …"
              className="textarea mt-3"
              aria-label="Broadcast message"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TOKENS.map(({ token, label: hint }) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => insertToken(token)}
                  title={hint}
                  className="rounded-md border border-cyan/30 bg-cyan/8 px-2 py-1 font-mono text-[10px] font-semibold text-cyan transition hover:border-cyan/55"
                >
                  {token}
                </button>
              ))}
            </div>

            {/* Live preview — how it lands in their WhatsApp */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b1f1a] p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-live/70">Preview — {previewTarget ? `as ${previewTarget.name.split(" ")[0]} receives it` : "nobody selected"}</p>
              <div className="mt-2 max-w-md rounded-xl rounded-tl-sm bg-[#005c4b] px-3 py-2 text-[12px] leading-relaxed text-[#e9fce9] shadow-md">
                <p className="whitespace-pre-wrap">{preview}</p>
                <p className="mt-1 text-right text-[8.5px] text-[#9fd3bd]">20:00 ✓✓</p>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="card p-5">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Delivery</p>
            <div className="mt-2 flex items-start gap-2 text-[11.5px] leading-relaxed">
              {status === null ? (
                <span className="text-muted">Checking WhatsApp delivery…</span>
              ) : status.configured ? (
                <span className="flex items-start gap-2 text-live"><Wifi size={14} className="mt-0.5 shrink-0" /> Automatic WhatsApp is connected — this goes out for real, right now.</span>
              ) : (
                <span className="flex items-start gap-2 text-warn"><WifiOff size={14} className="mt-0.5 shrink-0" /> WhatsApp delivery is not connected yet — pressing send <strong>queues</strong> {audience.length} personalized message{audience.length === 1 ? "" : "s"} to the outbox. Nothing is lost or faked; they fire the moment WHATSAPP_TOKEN is set. Everyone still gets the in-app copy.</span>
              )}
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-[11.5px] text-muted">
              <input type="checkbox" className="h-4 w-4 accent-[#e026c4]" checked={alsoInApp} onChange={(e) => setAlsoInApp(e.target.checked)} />
              Also post this to their in-app notification feeds
            </label>
            <Button variant="primary" size="lg" className="mt-3 w-full" onClick={() => void send()} disabled={!canSend} loading={busy} icon={status?.configured ? <Send size={16} /> : <Inbox size={16} />}>
              {status?.configured ? `Send to ${audience.length} now` : `Queue ${audience.length} message${audience.length === 1 ? "" : "s"}`}
            </Button>
            {pending > 0 && (
              <div className="mt-3 rounded-xl border border-warn/40 bg-warn/10 px-4 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] leading-snug text-warn"><strong>{pending}</strong> message{pending === 1 ? " is" : "s"} waiting in the outbox.</p>
                  <button type="button" onClick={() => void flush()} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-warn/50 px-2.5 py-1.5 text-[10.5px] font-semibold text-warn transition hover:bg-warn/10">
                    <Send size={11} /> Try sending now
                  </button>
                </div>
                <ul className="mt-1.5 space-y-0.5 text-[9.5px] text-warn/80">
                  {outbox.slice(0, 3).map((m) => (
                    <li key={m.id} className="truncate">→ {m.to}: {m.text.replaceAll("\n", " ").slice(0, 72)}…</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-2 flex items-start gap-1.5 text-[9.5px] leading-relaxed text-muted-2">
              <Info size={11} className="mt-0.5 shrink-0" /> WhatsApp Business policy: messages to people outside their 24-hour service window must use an approved template — the academy's template strategy is in the setup guide. Broadcasts respect it automatically once connected.
            </p>
          </div>
        </div>

        {/* ============ History column ============ */}
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"><History size={12} /> Every run, on record</p>
          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/12 px-5 py-8 text-center">
              <Megaphone size={20} className="mx-auto text-muted-2" />
              <p className="mt-2 text-[12.5px] font-semibold">Nothing sent yet</p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-muted">Your first broadcast — even a queue — shows up here with per-person delivery.</p>
            </div>
          ) : (
            history.map((record) => (
              <div key={record.id} className="rounded-2xl border border-white/10 bg-raised p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-bold">{record.audienceLabel}</p>
                    <p className="mt-0.5 text-[9.5px] text-muted-2">{timeAgo(record.at)} · by {record.actor} · {record.audienceCount} picked</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => (v === record.id ? null : record.id))}
                    className="shrink-0 rounded-lg p-1.5 text-muted transition hover:text-white"
                    aria-label={expanded === record.id ? "Collapse recipients" : "Show recipients"}
                  >
                    {expanded === record.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Pill tone="live">{record.sent} sent</Pill>
                  <Pill tone="dark">{record.queued} queued</Pill>
                  <Pill tone="dark">{record.failed} failed</Pill>
                  {record.skipped > 0 && <Pill tone="dark">{record.skipped} no number</Pill>}
                </div>
                <p className="mt-2 line-clamp-2 text-[10.5px] leading-relaxed text-muted">{record.template}</p>
                {expanded === record.id && (
                  <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-xl border border-white/8 bg-base p-2">
                    {record.recipients.slice(0, 40).map((r) => (
                      <li key={r.studentId} className="flex items-center justify-between gap-2 text-[10px]">
                        <span className="truncate text-muted">{r.name}</span>
                        <span className={cn(
                          "shrink-0 font-semibold uppercase",
                          r.status === "sent" && "text-live",
                          r.status === "queued" && "text-warn",
                          r.status === "failed" && "text-danger",
                          r.status === "no-number" && "text-muted-2",
                        )} title={r.error}>
                          {r.status === "no-number" ? "no #" : r.status}
                        </span>
                      </li>
                    ))}
                    {record.recipients.length > 40 && (
                      <li className="pt-1 text-center text-[9px] text-muted-2">+{record.recipients.length - 40} more — export CSV for the full list</li>
                    )}
                  </ul>
                )}
              </div>
            ))
          )}
          <div className="rounded-2xl border border-white/8 bg-base px-4 py-3 text-[9.5px] leading-relaxed text-muted-2">
            <AlertTriangle size={11} className="mr-1 inline text-warn" />
            Personal data in every recipient cell stays in this console. Exported CSVs go to the WhatsApp Business broadcast tool — handle them like the student list they are.
          </div>
        </div>
      </div>
    </div>
  );
}
