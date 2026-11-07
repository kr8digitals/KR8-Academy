import { useMemo, useState } from "react";
import { Check, Download, Loader2, Mail, Send, Trash2, Users } from "lucide-react";
import { useDb } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { exportWaitlistCsv, markWaitlistNotified, removeWaitlistEntry } from "../../lib/store";
import { notifyWaitlist } from "../../lib/email";
import { trackName } from "../../data/academy";
import { download, formatDateTime, timeAgo } from "../../lib/utils";
import { Pill } from "../../components/ui";

export default function WaitlistTab() {
  const db = useDb();
  const toast = useToast();
  const [trackFilter, setTrackFilter] = useState<string>("all");
  const [notifying, setNotifying] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof notifyWaitlist>> | null>(null);

  const rows = useMemo(
    () =>
      [...db.waitlist]
        .filter((w) => trackFilter === "all" || w.trackKey === trackFilter)
        .sort((a, b) => b.createdAt - a.createdAt),
    [db.waitlist, trackFilter]
  );
  const unnotified = rows.filter((r) => !r.notifiedAt);
  const tracksInList = useMemo(() => Array.from(new Set(db.waitlist.map((w) => w.trackKey))), [db.waitlist]);

  function exportCsv() {
    download(`kr8-waitlist-${new Date().toISOString().slice(0, 10)}.csv`, exportWaitlistCsv(), "text/csv;charset=utf-8");
  }

  async function notifyAll() {
    if (unnotified.length === 0) {
      toast.info("Nothing to send", "Everyone on this view has already been notified.");
      return;
    }
    setNotifying(true);
    setResult(null);
    const outcome = await notifyWaitlist(db, trackFilter === "all" ? "the programmes" : trackName(trackFilter), unnotified);
    setNotifying(false);
    setResult(outcome);
    if (outcome.via === "api") {
      markWaitlistNotified(unnotified.map((w) => w.id), "Admin");
      toast.success("Waitlist notified", outcome.detail);
    } else {
      toast.info("Drafts ready — nothing sent automatically", outcome.detail);
    }
  }

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              <Users size={12} className="text-warn" /> Registration waitlist
            </p>
            <p className="mt-1.5 max-w-md text-[12px] leading-relaxed text-muted">
              Everyone who asked to hear first. When registration opens, notify this list a priority window before the
              public — they get {db.settings.waitlistPriorityHours} hours' head start. Emails go through Resend once
              RESEND_API_KEY is set; until then you get pre-filled drafts you send yourself. Rows never leave this
              device unless you export them.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-ghost btn-sm" onClick={exportCsv}><Download size={13} /> Export CSV</button>
            <button className="btn btn-primary btn-sm" onClick={notifyAll} disabled={notifying || unnotified.length === 0}>
              {notifying ? <Loader2 size={13} className="spin" /> : <Send size={13} />}
              Notify {unnotified.length} waiting
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-4 rounded-xl border border-white/10 bg-sunken p-4 text-[12px] leading-relaxed">
            <p className="font-semibold text-white">{result.detail}</p>
            {result.via !== "api" && result.mailtoLinks.length > 0 && (
              <div className="mt-2">
                <p className="text-muted">Open each draft and press send — recipients are BCC'd so nobody's address is exposed:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.mailtoLinks.map((link, i) => (
                    <a key={i} className="btn btn-ghost btn-sm" href={link}>
                      <Mail size={13} /> Draft {i + 1}
                    </a>
                  ))}
                </div>
                <button
                  className="btn btn-ghost btn-sm mt-2"
                  onClick={() => {
                    markWaitlistNotified(unnotified.map((w) => w.id), "Admin");
                    toast.success("Marked as notified", "You told us the drafts were sent — rows marked notified.");
                  }}
                >
                  <Check size={13} /> I sent these myself — mark all as notified
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <span className="text-[11px] text-muted">Filter:</span>
          <select className="input !w-auto" value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)}>
            <option value="all">All tracks ({db.waitlist.length})</option>
            {tracksInList.map((key) => (
              <option key={key} value={key}>{trackName(key)}</option>
            ))}
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card p-8 text-center text-[13px] text-muted">The waitlist is empty — the registration page collects names automatically.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>WhatsApp</th><th>Country</th><th>Skill</th><th>Joined</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr key={entry.id}>
                  <td className="font-medium">{entry.name}</td>
                  <td className="font-mono text-[11px]">{entry.email}</td>
                  <td className="font-mono text-[11px]">{entry.whatsapp}</td>
                  <td>{entry.country}</td>
                  <td>{trackName(entry.trackKey)}</td>
                  <td title={formatDateTime(entry.createdAt)}>{timeAgo(entry.createdAt)}</td>
                  <td>
                    {entry.notifiedAt ? (
                      <Pill tone="live">Notified</Pill>
                    ) : (
                      <Pill className="!border-warn/40 !text-warn">Waiting</Pill>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      className="rounded-md p-1.5 text-muted transition hover:bg-danger/10 hover:text-danger"
                      title="Remove from waitlist"
                      onClick={() => {
                        if (window.confirm(`Remove ${entry.name} (${entry.email}) from the waitlist?`)) {
                          removeWaitlistEntry(entry.id, "Admin");
                          toast.success("Removed", entry.email);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
