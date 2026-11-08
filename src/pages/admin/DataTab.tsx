import { useState } from "react";
import { Download, FileJson, History, RotateCcw, Upload } from "lucide-react";
import { useDb } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import {
  exportDatabase,
  exportNewsletterCsv,
  exportStudentsCsv,
  exportWaitlistCsv,
  listNewsletterSubscribers,
  importDatabase,
  restoreHistory,
  saveVersion,
  storageSizeKb,
} from "../../lib/store";
import { download, formatDateTime, timeAgo } from "../../lib/utils";
import { Input, Modal } from "../../components/ui";

export default function DataTab() {
  const db = useDb();
  const toast = useToast();
  const [importText, setImportText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [versionLabel, setVersionLabel] = useState("");
  const [restoreId, setRestoreId] = useState<string | null>(null);

  function backupNow() {
    download(`kr8-academy-backup-${new Date().toISOString().slice(0, 10)}.json`, exportDatabase());
    toast.success("Backup downloaded", `${storageSizeKb()} KB — keep it somewhere safe.`);
  }

  function restoreFromText(json: string, label: string) {
    const result = importDatabase(json);
    if (!result.ok) return toast.error("Restore failed", result.error ?? "That file could not be read.");
    toast.success("Restored", `${label} imported. A safety snapshot was saved to Version history first.`);
    setImportText("");
    setFileName(null);
  }

  return (
    <div className="space-y-5">
      {/* Backup / restore */}
      <div className="card p-5">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          <FileJson size={12} className="text-live" /> Backup & restore
        </p>
        <p className="mt-1.5 max-w-xl text-[12px] leading-relaxed text-muted">
          A backup is the entire academy — students, attendance, scores, certificates, awards, everything — as one JSON
          file. Download one before every risky change. Restoring upgrades older backups automatically and saves a safety
          snapshot first.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button className="btn btn-primary btn-sm" onClick={backupNow}><Download size={13} /> Download backup</button>
          <a className="btn btn-ghost btn-sm" href={`mailto:${db.settings.supportEmail}?subject=KR8%20Academy%20backup`}>Email it to yourself</a>
          <span className="text-[11px] text-muted">Current size: {storageSizeKb()} KB</span>
        </div>
        <div className="mt-4 rounded-xl border border-white/10 bg-sunken p-4">
          <p className="field-label">Restore from a file</p>
          <input
            type="file"
            accept=".json,application/json"
            className="mt-1.5 block text-[12px] text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-magenta-fill file:px-3 file:py-2 file:text-[12px] file:font-semibold file:text-white hover:file:bg-magenta-deep"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setFileName(file.name);
              const reader = new FileReader();
              reader.onload = () => restoreFromText(String(reader.result ?? ""), file.name);
              reader.readAsText(file);
            }}
          />
          <p className="field-label mt-3">…or paste the JSON</p>
          <textarea
            className="textarea mt-1.5 font-mono !text-[11px]"
            rows={3}
            placeholder='{"version": 3, …}'
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <button className="btn btn-ghost btn-sm mt-2" disabled={!importText.trim()} onClick={() => restoreFromText(importText, fileName ?? "pasted backup")}>
            <Upload size={13} /> Restore pasted backup
          </button>
        </div>
      </div>

      {/* CSV exports */}
      <div className="card p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Exports for the academy office</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => download(`kr8-students-${new Date().toISOString().slice(0, 10)}.csv`, exportStudentsCsv(), "text/csv;charset=utf-8")}><Download size={13} /> Students (CSV)</button>
          <button className="btn btn-ghost btn-sm" onClick={() => download(`kr8-waitlist-${new Date().toISOString().slice(0, 10)}.csv`, exportWaitlistCsv(), "text/csv;charset=utf-8")}><Download size={13} /> Waitlist (CSV)</button>
          <button className="btn btn-ghost btn-sm" onClick={() => download(`kr8-newsletter-${new Date().toISOString().slice(0, 10)}.csv`, exportNewsletterCsv(), "text/csv;charset=utf-8")}><Download size={13} /> Newsletter ({listNewsletterSubscribers().length}) (CSV)</button>
        </div>
        <p className="mt-2 text-[10px] text-muted">Files never leave your browser until you send or upload them. Treat them as personal data.</p>
      </div>

      {/* Version history */}
      <div className="card p-5">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          <History size={12} className="text-warn" /> Version history & undo
        </p>
        <p className="mt-1.5 max-w-xl text-[12px] leading-relaxed text-muted">
          Automatic safety snapshots are taken before imports and restores. You can also save named save points — e.g.
          before a cohort grading session — and jump back to any of them. Snapshots are kept in the academy backup history (up to 10).
        </p>
        <div className="mt-3 flex gap-2">
          <Input placeholder="Label this save point (e.g. Before Grand Finale grading)" value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { saveVersion(versionLabel, "Admin"); setVersionLabel(""); toast.success("Save point stored", "Find it below."); } }} />
          <button className="btn btn-primary" onClick={() => { saveVersion(versionLabel, "Admin"); setVersionLabel(""); toast.success("Save point stored", "Find it below."); }}>
            Save point
          </button>
        </div>
        {db.history.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-white/12 px-4 py-5 text-center text-[12px] text-muted">No save points yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-white/8 overflow-hidden rounded-xl border border-white/10">
            {db.history.map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 bg-sunken px-4 py-3">
                <div>
                  <p className="text-[12px] font-semibold">{entry.label || "Save point"}</p>
                  <p className="mt-0.5 text-[10px] text-muted">{formatDateTime(entry.at)} · {timeAgo(entry.at)} · {entry.actor}</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setRestoreId(entry.id)} disabled={!entry.snapshot}>
                  <RotateCcw size={13} /> Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restore confirm */}
      <Modal
        open={!!restoreId}
        onClose={() => setRestoreId(null)}
        title="Restore this version?"
        description="The entire academy — students, scores, certificates, awards — goes back to this save point. Whatever exists now is replaced (a fresh safety snapshot is taken first)."
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setRestoreId(null)}>Keep current</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!restoreId) return;
                const result = restoreHistory(restoreId, "Admin");
                if (!result.ok) toast.error("Restore failed", result.error ?? "Unknown error.");
                else toast.success("Restored", "The academy is back at that save point.");
                setRestoreId(null);
              }}
            >
              Restore now
            </button>
          </>
        }
      >
        {restoreId && (() => {
          const entry = db.history.find((h) => h.id === restoreId);
          return (
            <p className="text-[13px] text-muted">
              Restoring to <span className="font-semibold text-white">{entry?.label}</span> from {entry ? formatDateTime(entry.at) : ""}.
            </p>
          );
        })()}
      </Modal>
    </div>
  );
}
