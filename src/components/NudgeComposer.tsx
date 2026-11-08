import { useEffect, useMemo, useState } from "react";
import { Search, Megaphone, Loader2, CheckCheck, Mail, MessageCircle, Users, Flame } from "lucide-react";
import { cn } from "../lib/utils";
import { getRoster, sendNudge, getAttendance, db } from "../lib/store";
import { NUDGE_PRESETS } from "../lib/whatsapp";
import { buildWaLink } from "../lib/whatsapp";
import { Modal, Input, Textarea, Avatar } from "./ui";

export type NudgeComposerProps = {
  open: boolean;
  onClose: () => void;
  preselect?: string[];
  actor: string;
};

/** The admin's nudge desk: pick people, write one honest message, deliver in-app; WhatsApp/email one tap away. */
export function NudgeComposer({ open, onClose, preselect, actor }: NudgeComposerProps) {
  const [query, setQuery] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [selected, setSelected] = useState<string[]>(preselect ?? []);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ sent: number; ids: string[]; title: string; body: string } | null>(null);

  useEffect(() => {
    if (open) {
      setSelected(preselect ?? []);
      setQuery("");
      setFlaggedOnly(false);
      setTitle("");
      setBody("");
      setBusy(false);
      setDone(null);
    }
  }, [open, preselect]);

  const expected = db().settings.expectedClassCount || 16;
  const roster = useMemo(
    () => getRoster().filter((s) => s.role === "student" && s.status !== "suspended"),
    [open]
  );
  const flagged = useMemo(
    () => new Set(roster.filter((s) => getAttendance(s.id).length < expected * 0.5).map((s) => s.id)),
    [roster, expected]
  );
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return roster.filter((s) => {
      if (flaggedOnly && !flagged.has(s.id)) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
    });
  }, [roster, query, flaggedOnly, flagged]);

  const allVisibleSelected = visible.length > 0 && visible.every((s) => selected.includes(s.id));
  const toggleAll = () => {
    setSelected((prev) =>
      allVisibleSelected ? prev.filter((id) => !visible.some((s) => s.id === id)) : Array.from(new Set([...prev, ...visible.map((s) => s.id)]))
    );
  };
  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const firstSelected = roster.find((s) => s.id === selected[0]);
  const previewBody = body.replaceAll("{first}", firstSelected?.name.split(" ")[0] ?? "there");

  const submit = async () => {
    setBusy(true);
    setError(null);
    const result = sendNudge({ studentIds: selected, title, body, actor });
    setBusy(false);
    if (result.ok) setDone({ sent: result.sent, ids: [...selected], title, body });
    else setError(result.error ?? "Could not send the nudge.");
  };

  const recipients = done ? roster.filter((s) => done.ids.includes(s.id)) : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={done ? "Nudge delivered" : "Nudge your students"}
      description={done ? "In-app delivery is done. Use the WhatsApp and email links to reach them where they actually are." : "In-app for everyone. One tap for WhatsApp or email per student."}
      footer={
        done ? (
          <button type="button" onClick={onClose} className="btn btn-primary btn-sm">Done</button>
        ) : (
          <>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
            <button type="button" onClick={() => void submit()} disabled={busy || selected.length === 0 || !title.trim() || !body.trim()} className="btn btn-primary btn-sm">
              {busy ? <Loader2 size={14} className="spin" /> : <Megaphone size={14} />}
              Send to {selected.length || 0} {selected.length === 1 ? "student" : "students"}
            </button>
          </>
        )
      }
    >
      {!done ? (
        <div className="grid gap-4 md:grid-cols-[1fr_1.1fr]">
          {/* Recipients */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Recipients</p>
              <label className="flex cursor-pointer items-center gap-1.5 text-[10.5px] font-semibold text-muted hover:text-white">
                <input type="checkbox" className="accent-[#e026c4]" checked={allVisibleSelected} onChange={toggleAll} />
                Select all
              </label>
            </div>
            <div className="relative mt-2">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or KR8 ID…" className="pl-8 text-[12px]" />
            </div>
            <button
              type="button"
              onClick={() => setFlaggedOnly((v) => !v)}
              className={cn(
                "mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition",
                flaggedOnly ? "border-gold/50 bg-gold/15 text-gold" : "border-white/10 text-muted hover:text-white"
              )}
            >
              <Flame size={11} /> Showing up &lt; 50% ({flagged.size})
            </button>
            <div className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1 md:max-h-64">
              {visible.length === 0 && <p className="px-2 py-6 text-center text-[11px] text-muted">Nobody matches that filter.</p>}
              {visible.map((s) => {
                const checked = selected.includes(s.id);
                const low = flagged.has(s.id);
                return (
                  <label key={s.id} className={cn("flex cursor-pointer items-center gap-2.5 rounded-xl border px-2 py-1.5 transition", checked ? "border-magenta/40 bg-magenta/8" : "border-white/8 hover:border-white/20")}>
                    <input type="checkbox" className="accent-[#e026c4]" checked={checked} onChange={() => toggle(s.id)} />
                    <Avatar name={s.name} src={s.avatar} size={28} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold leading-tight">{s.name}</span>
                      <span className="block truncate font-mono text-[9px] text-muted">{s.id}</span>
                    </span>
                    {low && <span className="shrink-0 rounded-full bg-gold/15 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-gold">Low</span>}
                  </label>
                );
              })}
            </div>
            <p className="mt-1.5 text-[10px] text-muted-2"><Users size={10} className="mr-1 inline" />{selected.length} selected</p>
          </div>

          {/* Compose */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Message</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {NUDGE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setTitle(p.label);
                    setBody(p.body);
                  }}
                  className="rounded-full border border-white/10 bg-raised px-2.5 py-1 text-[10px] font-semibold text-white/80 transition hover:border-magenta/50 hover:text-white"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Subject — e.g. See you in class tonight" className="mt-2 text-[12px]" />
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="{first} — write the message you'd send a kid you actually care about. Use {first} to drop in their name."
              className="mt-2 text-[12px]"
            />
            {error && <p role="alert" className="mt-2 rounded-lg border border-danger/40 bg-danger/12 px-3 py-2 text-[11.5px] text-danger">{error}</p>}
            {previewBody.trim() && (
              <div className="mt-2 rounded-xl border border-cyan/20 bg-cyan/6 p-2.5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan">Preview{firstSelected ? ` — ${firstSelected.name.split(" ")[0]} sees` : ""}</p>
                <p className="mt-1 whitespace-pre-wrap text-[11.5px] leading-relaxed text-white/85">{previewBody}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <p className="flex items-center gap-2 text-[13px] font-semibold text-cyan">
            <CheckCheck size={16} /> Delivered in-app to {done.sent} {done.sent === 1 ? "student" : "students"}.
          </p>
          <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {recipients.map((s) => {
              const wa = (s.prefs?.whatsappUpdates ?? true) ? buildWaLink(s.phone, done.body.replaceAll("{first}", s.name.split(" ")[0])) : null;
              const mailto = (s.prefs?.emailUpdates ?? true)
                ? `mailto:${s.email}?subject=${encodeURIComponent(done.title.replaceAll("{first}", s.name.split(" ")[0]))}&body=${encodeURIComponent(done.body.replaceAll("{first}", s.name.split(" ")[0]))}`
                : null;
              return (
                <div key={s.id} className="flex items-center gap-2.5 rounded-xl border border-white/8 px-2.5 py-2">
                  <Avatar name={s.name} src={s.avatar} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold">{s.name}</span>
                    <span className="block truncate text-[9.5px] text-muted">{s.phone}{s.prefs?.whatsappUpdates === false ? " · WhatsApp off" : ""}</span>
                  </span>
                  {wa && (
                    <a href={wa} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg border border-[#25D366]/35 bg-[#25D366]/10 text-[#25D366] transition hover:bg-[#25D366]/20" title="Send on WhatsApp" aria-label={`WhatsApp ${s.name}`}>
                      <MessageCircle size={15} />
                    </a>
                  )}
                  {mailto && (
                    <a href={mailto} className="grid h-8 w-8 place-items-center rounded-lg border border-white/12 text-white/70 transition hover:bg-white/8 hover:text-white" title="Open email draft" aria-label={`Email ${s.name}`}>
                      <Mail size={15} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}
