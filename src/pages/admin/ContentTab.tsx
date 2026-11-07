import { useMemo, useState } from "react";
import { Check, Mail, Megaphone, RotateCcw } from "lucide-react";
import { useDb } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import {
  discardContentDraft,
  publishContent,
  resetContentKey,
  resetEmailTemplate,
  saveDraftContent,
  saveEmailTemplate,
} from "../../lib/store";
import { CONTENT_FIELDS, DEFAULT_CONTENT, draftContent, publishedContent } from "../../lib/content";
import { DEFAULT_EMAIL_TEMPLATES } from "../../lib/email";
import { cn } from "../../lib/utils";
import { Field, Input, Textarea } from "../../components/ui";

export default function ContentTab() {
  const db = useDb();
  const toast = useToast();
  const [tab, setTab] = useState<"site" | "emails">("site");

  const groups = useMemo(() => {
    const map = new Map<string, typeof CONTENT_FIELDS>();
    for (const field of CONTENT_FIELDS) {
      const list = map.get(field.group) ?? [];
      list.push(field);
      map.set(field.group, list);
    }
    return Array.from(map.entries());
  }, []);

  const hasDraft =
    JSON.stringify(db.content.draft) !== JSON.stringify({ ...db.content.published });

  const templateKeys = Object.keys(DEFAULT_EMAIL_TEMPLATES);

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              <Megaphone size={12} className="text-magenta-bright" /> Content studio
            </p>
            <p className="mt-1.5 max-w-lg text-[12px] leading-relaxed text-muted">
              Every headline, paragraph and template below is live on the site after you publish. Nothing here is
              hard-coded. Edit freely — <em>Publish</em> flips everything live at once; <em>Discard draft</em> throws
              your edits away and keeps what visitors see.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => { discardContentDraft("Admin"); toast.success("Draft discarded", "The published site is untouched."); }}>Discard draft</button>
            <button className="btn btn-primary btn-sm" onClick={() => { const result = publishContent("Admin"); toast.success("Published", `${result.changed} change(s) are now live.`); }}><Check size={13} /> Publish</button>
          </div>
        </div>
        {hasDraft && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-warn/12 px-3 py-1.5 text-[10.5px] font-semibold text-warn">
            Unpublished changes — visitors still see the previous version until you publish.
          </p>
        )}
        <div className="mt-4 flex gap-1.5 border-b border-white/8 pb-3">
          {[
            { id: "site" as const, label: "Site content" },
            { id: "emails" as const, label: "Email templates" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition",
                tab === item.id ? "bg-magenta-fill text-white" : "text-muted hover:bg-white/8 hover:text-white"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "site" &&
        groups.map(([group, fields]) => (
          <div key={group} className="card p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{group}</p>
            <div className="mt-3 space-y-4">
              {fields.map((field) => {
                const draft = draftContent(db, field.key);
                const published = publishedContent(db, field.key) || DEFAULT_CONTENT[field.key] || "";
                const dirty = draft !== published;
                return (
                  <div key={field.key}>
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor={`content-${field.key}`} className="field-label !mb-1.5">
                        {field.label}
                        {dirty && <span className="ml-2 rounded-full bg-warn/15 px-2 py-0.5 align-middle text-[8px] font-bold uppercase text-warn">edited</span>}
                      </label>
                      <button className="text-[10px] font-semibold text-muted hover:text-white" onClick={() => { resetContentKey(field.key, "Admin"); toast.success("Reset", "Back to the built-in default."); }}>
                        <span className="inline-flex items-center gap-1"><RotateCcw size={11} /> Default</span>
                      </button>
                    </div>
                    {field.kind === "textarea" ? (
                      <Textarea id={`content-${field.key}`} rows={2} value={draft} onChange={(e) => saveDraftContent(field.key, e.target.value)} />
                    ) : (
                      <Input id={`content-${field.key}`} value={draft} onChange={(e) => saveDraftContent(field.key, e.target.value)} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      {tab === "emails" && (
        <div className="card p-5">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            <Mail size={12} className="text-cyan" /> Email templates — sent when Resend is configured
          </p>
          <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-muted">
            Variables: <code className="rounded bg-white/8 px-1">{"{{firstName}}"}</code> <code className="rounded bg-white/8 px-1">{"{{name}}"}</code> <code className="rounded bg-white/8 px-1">{"{{track}}"}</code> <code className="rounded bg-white/8 px-1">{"{{kr8Id}}"}</code> <code className="rounded bg-white/8 px-1">{"{{score}}"}</code> <code className="rounded bg-white/8 px-1">{"{{tier}}"}</code> <code className="rounded bg-white/8 px-1">{"{{cohortStart}}"}</code> <code className="rounded bg-white/8 px-1">{"{{onboarding}}"}</code> <code className="rounded bg-white/8 px-1">{"{{partnerName}}"}</code> <code className="rounded bg-white/8 px-1">{"{{supportEmail}}"}</code> <code className="rounded bg-white/8 px-1">{"{{priorityHours}}"}</code> <code className="rounded bg-white/8 px-1">{"{{registerUrl}}"}</code> <code className="rounded bg-white/8 px-1">{"{{verifyUrl}}"}</code> <code className="rounded bg-white/8 px-1">{"{{reason}}"}</code>
          </p>
          <div className="mt-4 space-y-4">
            {templateKeys.map((key) => {
              const template = db.emailTemplates[key] ?? DEFAULT_EMAIL_TEMPLATES[key];
              return (
                <div key={key} className="rounded-2xl border border-white/10 bg-sunken p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-[11px] font-semibold text-cyan">{key}</p>
                    <button className="text-[10px] font-semibold text-muted hover:text-white" onClick={() => { resetEmailTemplate(key, "Admin"); toast.success("Template reset", key); }}>
                      <span className="inline-flex items-center gap-1"><RotateCcw size={11} /> Default</span>
                    </button>
                  </div>
                  <Field label="Subject" htmlFor={`tpl-subject-${key}`} className="mt-2">
                    <Input id={`tpl-subject-${key}`} value={template.subject} onChange={(e) => saveEmailTemplate(key, { subject: e.target.value }, "Admin")} />
                  </Field>
                  <Field label="Body (HTML)" htmlFor={`tpl-body-${key}`} className="mt-2">
                    <Textarea id={`tpl-body-${key}`} rows={6} className="font-mono !text-[11px]" value={template.body} onChange={(e) => saveEmailTemplate(key, { body: e.target.value }, "Admin")} />
                  </Field>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
