import { ShieldAlert } from "lucide-react";

export function LocalOnlyNotice({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      className={`flex gap-3 rounded-2xl border border-warn/30 bg-warn/8 text-left ${compact ? "p-3" : "p-4"}`}
      role="note"
      aria-label="Local-only preview notice"
    >
      <ShieldAlert size={18} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
      <div>
        <p className="text-[12px] font-semibold text-ink">Local-only preview</p>
        <p className="mt-1 text-[11px] leading-relaxed text-body">
          Data stays in this browser profile and does not sync to other devices. Browser-only accounts and role checks are not production security; IDs and certificates are local records, not globally trusted credentials or independent verification. Do not enter sensitive student data here.
        </p>
      </div>
    </aside>
  );
}
