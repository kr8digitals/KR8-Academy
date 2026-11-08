import { useEffect, useState } from "react";
import { Link2, Plus, Save, Trash2, Info, CheckCircle2, ExternalLink } from "lucide-react";
import { TRACKS, trackName } from "../../data/academy";
import {
  listLearningGroups,
  upsertLearningGroup,
  deleteLearningGroup,
} from "../../lib/store";
import type { LearningGroup, LearningGroupKind } from "../../lib/types";
import { useDb } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Button, Field, Input, Pill, Select } from "../../components/ui";
import { cn } from "../../lib/utils";

const KIND_OPTIONS: Array<{ value: LearningGroupKind; label: string }> = [
  { value: "general", label: "General — everyone" },
  { value: "academic", label: "Academics (Next Gen Scholars)" },
  { value: "track", label: "Skill track" },
  { value: "cohort", label: "Cohort / intake" },
  { value: "program", label: "Program" },
  { value: "event", label: "Event" },
];

const KIND_TONE: Record<LearningGroupKind, "magenta" | "live" | "dark" | "default"> = {
  general: "live",
  academic: "magenta",
  track: "magenta",
  cohort: "dark",
  program: "default",
  event: "default",
};

/**
 * Admin → Groups & links. Every learning group, class, programme and event the
 * academy runs — one row each, one paste-and-save each. These links power the
 * automatic onboarding welcome message and the {group} token in broadcasts, so
 * a link edited here is the link every student receives next.
 */
export default function GroupsTab({ actor }: { actor: string }) {
  const db = useDb();
  const toast = useToast();
  const groups = listLearningGroups();
  const [drafts, setDrafts] = useState<Record<string, { joinUrl: string; name: string; active: boolean }>>({});
  const [adding, setAdding] = useState(false);
  const [newKind, setNewKind] = useState<LearningGroupKind>("track");
  const [newName, setNewName] = useState("");
  const [newTrack, setNewTrack] = useState("graphic");
  const [newUrl, setNewUrl] = useState("");

  /* Re-prime draft rows whenever the stored groups change shape. */
  useEffect(() => {
    setDrafts((prev) => {
      const next: typeof prev = {};
      for (const g of groups) next[g.id] = prev[g.id] ?? { joinUrl: g.joinUrl, name: g.name, active: g.active };
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  const save = (group: LearningGroup) => {
    const draft = drafts[group.id];
    if (!draft) return;
    const result = upsertLearningGroup(
      {
        id: group.id,
        kind: group.kind,
        name: draft.name,
        trackKey: group.trackKey,
        cohort: group.cohort,
        joinUrl: draft.joinUrl,
        note: group.note,
        active: draft.active,
      },
      actor
    );
    if (result.ok) toast.success("Group saved", "New sign-ups and broadcasts will use this link.");
    else toast.error("Could not save", result.error ?? "Check the link and try again.");
  };

  const remove = (group: LearningGroup) => {
    if (!window.confirm(`Remove “${group.name}”? Students already inside keep their link; new sign-ups will fall back to the academy-wide link.`)) return;
    deleteLearningGroup(group.id, actor);
    toast.success("Group removed", group.name);
  };

  const add = () => {
    const name = newName.trim() || (newKind === "track" ? `${trackName(newTrack)} — Cohort Group` : "");
    const result = upsertLearningGroup(
      {
        kind: newKind,
        name,
        trackKey: newKind === "track" ? newTrack : newKind === "academic" ? "academic" : undefined,
        joinUrl: newUrl,
      },
      actor
    );
    if (result.ok) {
      toast.success("Group added", name);
      setNewName("");
      setNewUrl("");
      setAdding(false);
    } else {
      toast.error("Could not add", result.error ?? "Check the fields and try again.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow flex items-center gap-2"><Link2 size={12} /> Groups &amp; links</p>
          <h1 className="display display-md mt-2">Everyone lands in the room.</h1>
          <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-muted">
            These are the WhatsApp learning groups behind every track, class, programme and event. The link you set here
            is the link that goes out automatically — in the welcome message the moment a student creates their KR8 ID, and
            in every broadcast that uses the <code className="font-mono text-[11px]">{"{group}"}</code> token.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => setAdding((v) => !v)}>
          {adding ? "Close" : "Add a group"}
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-cyan/25 bg-cyan/6 px-4 py-3 text-[11px] leading-relaxed text-cyan">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          A blank link falls back to the academy-wide group. Track links are used for that track's students; everything
          else falls back gracefully — nobody ever gets nothing.
        </span>
      </div>

      {adding && (
        <div className="card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">New group</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <Field label="Kind" htmlFor="ng-kind">
                <Select id="ng-kind" value={newKind} onChange={(e) => setNewKind(e.target.value as LearningGroupKind)}>
                  {KIND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </Field>
            </div>
            {newKind === "track" ? (
              <div className="sm:col-span-3">
                <Field label="Track" htmlFor="ng-track">
                  <Select id="ng-track" value={newTrack} onChange={(e) => setNewTrack(e.target.value)}>
                    {TRACKS.filter((t) => (t as { side?: string }).side !== "academic").map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
                  </Select>
                </Field>
              </div>
            ) : (
              <div className="sm:col-span-3">
                <Field label="Name" htmlFor="ng-name">
                  <Input id="ng-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Next Gen Scholars — WAEC Morning Batch" />
                </Field>
              </div>
            )}
            <div className="sm:col-span-5">
              <Field label="WhatsApp group link" htmlFor="ng-url">
                <Input id="ng-url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://chat.whatsapp.com/…" inputMode="url" />
              </Field>
            </div>
            <div className="flex items-end sm:col-span-1">
              <Button variant="primary" className="w-full" onClick={add} icon={<Plus size={14} />}>Add</Button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="hidden grid-cols-12 gap-3 border-b border-white/10 bg-raised px-4 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted md:grid">
          <span className="col-span-3">Group</span>
          <span className="col-span-6">WhatsApp invite link</span>
          <span className="col-span-1 text-center">Live</span>
          <span className="col-span-2 text-right">Save</span>
        </div>
        <ul className="divide-y divide-white/8">
          {groups.map((group) => {
            const draft = drafts[group.id] ?? { joinUrl: group.joinUrl, name: group.name, active: group.active };
            const dirty = draft.joinUrl !== group.joinUrl || draft.name !== group.name || draft.active !== group.active;
            const set = (patch: Partial<typeof draft>) => setDrafts((prev) => ({ ...prev, [group.id]: { ...draft, ...patch } }));
            return (
              <li key={group.id} className="grid grid-cols-1 gap-2 px-4 py-3 md:grid-cols-12 md:items-center md:gap-3">
                <div className="min-w-0 md:col-span-3">
                  <div className="flex items-center gap-2">
                    <Pill tone={KIND_TONE[group.kind]}>{group.kind}</Pill>
                    {group.joinUrl ? (
                      <a href={group.joinUrl} target="_blank" rel="noreferrer" className="text-muted-2 transition hover:text-white" title="Open group link">
                        <ExternalLink size={12} />
                      </a>
                    ) : null}
                  </div>
                  <Input
                    aria-label="Group name"
                    value={draft.name}
                    onChange={(e) => set({ name: e.target.value })}
                    className="mt-1.5 !h-8 !border-transparent !bg-transparent !px-0 !text-[12.5px] !font-semibold focus:!border-white/15 focus:!px-2"
                  />
                  {group.note && <p className="mt-0.5 truncate text-[9.5px] text-muted-2">{group.note}</p>}
                </div>
                <div className="min-w-0 md:col-span-6">
                  <Input
                    aria-label="WhatsApp invite link"
                    value={draft.joinUrl}
                    onChange={(e) => set({ joinUrl: e.target.value })}
                    placeholder="https://chat.whatsapp.com/… (blank = use academy-wide link)"
                    className="font-mono !text-[11px]"
                    inputMode="url"
                    spellCheck={false}
                  />
                </div>
                <div className="flex items-center justify-between md:col-span-3 md:justify-end md:gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-muted md:col-span-1">
                    <input type="checkbox" className="h-4 w-4 accent-[#e026c4]" checked={draft.active} onChange={(e) => set({ active: e.target.checked })} />
                    <span className="md:sr-only">Live</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => save(group)}
                    disabled={!dirty}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition",
                      dirty
                        ? "border-magenta/50 bg-magenta/15 text-magenta-bright hover:border-magenta/70"
                        : "border-white/10 text-muted-2"
                    )}
                  >
                    {dirty ? <Save size={12} /> : <CheckCircle2 size={12} />}
                    {dirty ? "Save" : "Saved"}
                  </button>
                  {group.kind !== "general" && (
                    <button
                      type="button"
                      onClick={() => remove(group)}
                      className="rounded-lg p-1.5 text-muted-2 transition hover:bg-danger/10 hover:text-danger"
                      aria-label={`Remove ${group.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
