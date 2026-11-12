/* Registration desk — review applications, contact learners and manage the intake pipeline. */

import { useCallback, useEffect, useState } from "react";
import {
  Copy,
  Download,
  Inbox,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
} from "lucide-react";
import { useToast } from "../../lib/toast";
import { useSeo } from "../../lib/seo";
import { trackByKey } from "../../data/academy";
import {
  defaultWhatsAppGreeting,
  listRegistrations,
  updateRegistrationStatus,
  waLink,
  type RegistrationRow,
  type RegistrationQuery,
} from "../../lib/registrar";
import { cn, copyToClipboard, formatDate, timeAgo } from "../../lib/utils";
import { Input, Modal, Pill, Select } from "../../components/ui";

const SKILL_NAME = (key: string) => trackByKey(key)?.name ?? key;

const STATUS_META: Record<RegistrationRow["status"], { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-magenta/12 text-magenta-bright" },
  contacted: { label: "Contacted", cls: "bg-cyan/12 text-cyan" },
  converted: { label: "Converted", cls: "bg-live/15 text-live" },
  dropped: { label: "Dropped", cls: "bg-white/10 text-muted" },
};

export default function RegistrationsTab() {
  useSeo({ title: "Registrations — Admin", description: "Review and manage academy registrations.", path: "/admin/registrations", noindex: true });
  const toast = useToast();
  const [rows, setRows] = useState<RegistrationRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState<RegistrationQuery>({ search: "", category: "", status: "" });
  const [selected, setSelected] = useState<RegistrationRow | null>(null);
  const [savingStatus, setSavingStatus] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await listRegistrations(query);
    setLoading(false);
    setRows(result.rows);
  }, [query]);

  useEffect(() => {
    void load();
    const refreshRows = () => void load();
    window.addEventListener("storage", refreshRows);
    window.addEventListener("kr8:registrations:change", refreshRows);
    return () => {
      window.removeEventListener("storage", refreshRows);
      window.removeEventListener("kr8:registrations:change", refreshRows);
    };
  }, [load]);

  /* Debounced search */
  useEffect(() => {
    const t = window.setTimeout(() => void load(), 320);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.search, query.category, query.status]);

  const filtered = rows ?? [];
  const counts = {
    new: filtered.filter((r) => r.status === "new").length,
    contacted: filtered.filter((r) => r.status === "contacted").length,
    converted: filtered.filter((r) => r.status === "converted").length,
    dropped: filtered.filter((r) => r.status === "dropped").length,
  };

  const exportCsv = () => {
    const header = [
      "id","created_at","full_name","dob","gender","email","phone","whatsapp_number","country","state","lga","city","community",
      "education_level","institution","course_of_study","class_level","occupation","category","skills","experience_level",
      "device_access","learning_objectives","exam_targets","academic_class","subject_combination","subjects",
      "how_heard","preferred_contact","notes","consent_terms","consent_privacy","consent_comms","kr8_id","status",
    ];
    const esc = (value: unknown) => {
      const raw = Array.isArray(value) ? value.join("; ") : value === null || value === undefined ? "" : String(value);
      return `"${raw.replace(/"/g, '""')}"`;
    };
    const lines = [header.join(",")];
    for (const row of filtered) {
      lines.push(header.map((key) => esc((row as unknown as Record<string, unknown>)[key])).join(","));
    }
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kr8-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export ready", `${filtered.length} registration${filtered.length === 1 ? "" : "s"} downloaded.`);
  };

  const setStatus = async (row: RegistrationRow, status: RegistrationRow["status"]) => {
    setSavingStatus(row.id);
    const result = await updateRegistrationStatus(row.id, status);
    setSavingStatus(null);
    if (!result.ok) {
      toast.error("Could not update", result.error);
      return;
    }
    setRows((current) => current?.map((r) => (r.id === row.id ? { ...r, status } : r)) ?? null);
    setSelected((current) => (current?.id === row.id ? { ...current, status } : current));
    toast.success("Status updated", `${row.full_name.split(" ")[0]} → ${STATUS_META[status].label}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow flex items-center gap-1.5"><Inbox size={12} /> Registrations</p>
          <h1 className="display display-md mt-2">The registration desk.</h1>
          <p className="mt-1 max-w-md text-[12px] leading-relaxed text-muted">
            Review new applications, reach learners on WhatsApp, move each record through the pipeline, and export the ledger any time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download size={13} /> Export CSV
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void load()} disabled={loading} aria-label="Refresh">
            <RefreshCw size={13} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <label className="relative min-w-[200px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            value={query.search ?? ""}
            onChange={(e) => setQuery((q) => ({ ...q, search: e.target.value }))}
            placeholder="Search name, email, phone, KR8 ID, city, state…"
            aria-label="Search registrations"
            className="pl-9"
          />
        </label>
        <Select aria-label="Pathway" value={query.category ?? ""} onChange={(e) => setQuery((q) => ({ ...q, category: e.target.value as RegistrationQuery["category"] }))} className="w-40">
          <option value="">All pathways</option>
          <option value="skill">Digital Skills</option>
          <option value="academic">Academics</option>
        </Select>
        <Select aria-label="Status" value={query.status ?? ""} onChange={(e) => setQuery((q) => ({ ...q, status: e.target.value as RegistrationQuery["status"] }))} className="w-40">
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="dropped">Dropped</option>
        </Select>
        <span className="ml-auto hidden text-[11px] tabular-nums text-muted sm:block">
          {counts.new} new · {counts.contacted} contacted · {counts.converted} converted · {counts.dropped} dropped
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="no-scrollbar overflow-x-auto">
          <table className="reg-table w-full min-w-[760px] text-left">
            <thead>
              <tr>
                <th>Registered</th>
                <th>Name</th>
                <th>Pathway</th>
                <th>Reach</th>
                <th>KR8 ID</th>
                <th>Status</th>
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-[12px] text-muted"><Loader2 className="spin mx-auto mb-2" size={18} /> Loading registrations…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-[12px] text-muted">No registrations match — try clearing the filters.</td></tr>
              )}
              {filtered.map((row) => (
                <tr key={row.id} className="reg-row cursor-pointer" onClick={() => setSelected(row)}>
                  <td className="whitespace-nowrap text-[11px] text-muted">{timeAgo(new Date(row.created_at).getTime())}</td>
                  <td>
                    <span className="block text-[12.5px] font-semibold leading-tight">{row.full_name}</span>
                    <span className="block text-[10px] text-muted">{row.city ? `${row.city}${row.state ? `, ${row.state}` : ""}` : row.country}</span>
                  </td>
                  <td>
                    {row.category === "academic" ? (
                      <Pill className="!border-cyan/30 !bg-cyan/10 !text-cyan">Academics</Pill>
                    ) : (
                      <Pill className="!border-magenta/30 !bg-magenta/10 !text-magenta-bright">Skills</Pill>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    <a
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-body hover:text-ink"
                      href={waLink(row.whatsapp_number ?? row.phone, defaultWhatsAppGreeting(row, row.skills?.[0] ? SKILL_NAME(row.skills[0]) : undefined))}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircle size={13} className="text-live" /> {row.whatsapp_number ?? row.phone}
                    </a>
                  </td>
                  <td className="whitespace-nowrap font-mono text-[11px] text-body">{row.kr8_id ?? "—"}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <Select
                      aria-label={`Status for ${row.full_name}`}
                      className="reg-status-select"
                      value={row.status}
                      disabled={savingStatus === row.id}
                      onChange={(e) => void setStatus(row, e.target.value as RegistrationRow["status"])}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Converted</option>
                      <option value="dropped">Dropped</option>
                    </Select>
                  </td>
                  <td className="text-right text-muted">→</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} size="lg" title={selected?.full_name ?? ""}>
        {selected && (
          <RegistrationDetail row={selected} onStatus={(status) => void setStatus(selected, status)} saving={savingStatus === selected.id} />
        )}
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Full detail view                                                     */
/* ------------------------------------------------------------------ */

function Row({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className={cn("mt-0.5 text-[12px] leading-snug text-ink", mono && "font-mono")}>{value?.trim() ? value : "—"}</dd>
    </div>
  );
}

function RegistrationDetail({
  row,
  onStatus,
  saving,
}: {
  row: RegistrationRow;
  onStatus: (status: RegistrationRow["status"]) => void;
  saving: boolean;
}) {
  const toast = useToast();
  const trackLabel = (row.skills ?? []).map(SKILL_NAME).filter(Boolean).join(", ");
  const examLabel = (row.exam_targets ?? []).map((t) => ({ utme: "UTME/JAMB", waec: "WAEC", neco: "NECO", other: "Other exam", not_writing: "Not writing yet" }[t as string] ?? t)).join(", ");
  const message = defaultWhatsAppGreeting(row, row.skills?.[0] ? SKILL_NAME(row.skills[0]) : undefined);

  const copyEverything = async () => {
    const lines = [
      `KR8 Registration #${row.id} · ${formatDate(new Date(row.created_at))}`,
      `Name: ${row.full_name}`,
      `DOB: ${row.dob ?? "—"} · Gender: ${row.gender ?? "—"}`,
      `Email: ${row.email}`,
      `Phone: ${row.phone} · WhatsApp: ${row.whatsapp_number ?? row.phone}`,
      `Location: ${[row.community, row.city, row.lga && `${row.lga} LGA`, row.state, row.country].filter(Boolean).join(", ")}`,
      `Education: ${row.education_level ?? "—"}${row.institution ? ` · ${row.institution}` : ""}${row.course_of_study ? ` · ${row.course_of_study}` : ""}${row.class_level ? ` · ${row.class_level}` : ""}${row.occupation ? ` · ${row.occupation}` : ""}`,
      `Pathway: ${row.category === "academic" ? `Academics · ${examLabel || "exam TBC"}${row.academic_class ? ` · ${row.academic_class}` : ""}${row.subjects?.length ? ` · Subjects: ${row.subjects.join(", ")}` : ""}${row.subject_combination ? ` · ${row.subject_combination}` : ""}` : `Skills · ${trackLabel || "—"}${row.experience_level ? ` · ${row.experience_level}` : ""}${row.device_access?.length ? ` · Devices: ${row.device_access.join(", ")}` : ""}`}`,
      `Objectives: ${row.learning_objectives ?? "—"}`,
      `How heard: ${row.how_heard ?? "—"} · Preferred contact: ${row.preferred_contact ?? "—"}`,
      `Notes: ${row.notes ?? "—"}`,
      `Consents: terms ${row.consent_terms ? "yes" : "no"} · privacy ${row.consent_privacy ? "yes" : "no"} · comms ${row.consent_comms ? "yes" : "no"}`,
      `KR8 ID: ${row.kr8_id ?? "—"} · Status: ${row.status}`,
    ];
    await copyToClipboard(lines.join("\n"));
    toast.success("Copied", "The full record is on your clipboard.");
  };

  return (
    <div className="max-h-[75vh] overflow-y-auto">
      {/* Identity hero */}
      <div className="rounded-2xl border border-line bg-cream p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{row.category === "academic" ? "Academics · Next Gen Scholars" : "Digital Skills"}</p>
            <h3 className="mt-1 font-display text-xl font-semibold leading-tight text-ink">{row.full_name}</h3>
            <p className="mt-1 font-mono text-[12px] text-muted">{row.kr8_id ?? "KR8 ID pending"}</p>
          </div>
          <span className={cn("rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]", STATUS_META[row.status].cls)}>
            {STATUS_META[row.status].label}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <a className="btn btn-primary btn-sm justify-center" href={waLink(row.whatsapp_number ?? row.phone, message)} target="_blank" rel="noreferrer">
            <MessageCircle size={14} /> WhatsApp
          </a>
          <a className="btn btn-ghost btn-sm justify-center" href={`tel:${(row.whatsapp_number ?? row.phone).replace(/\s+/g, "")}`}>
            <Phone size={14} /> Call
          </a>
          <a className="btn btn-ghost btn-sm justify-center" href={`mailto:${row.email}`}>
            <Mail size={14} /> Email
          </a>
        </div>
      </div>

      {/* Status pipeline */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Pipeline</span>
        {(["new", "contacted", "converted", "dropped"] as const).map((status) => (
          <button
            key={status}
            type="button"
            disabled={saving || row.status === status}
            onClick={() => onStatus(status)}
            aria-pressed={row.status === status}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
              row.status === status ? "border-transparent bg-magenta-fill text-white" : "border-line text-muted hover:border-line-strong hover:text-ink"
            )}
          >
            {STATUS_META[status].label}
          </button>
        ))}
      </div>

      <dl className="reg-detail-grid mt-5">
        <Row label="Full name" value={row.full_name} />
        <Row label="Date of birth" value={row.dob ? formatDate(new Date(row.dob)) : null} />
        <Row label="Gender" value={row.gender === "prefer_not" ? "Prefer not to say" : row.gender} />
        <Row label="Email" value={row.email} />
        <Row label="Phone" value={row.phone} mono />
        <Row label="WhatsApp" value={row.whatsapp_number ?? row.phone} mono />
        <Row label="Country" value={row.country} />
        <Row label="State" value={row.state} />
        <Row label="LGA" value={row.lga} />
        <Row label="City / town" value={row.city} />
        <Row label="Community" value={row.community} />
        <Row label="Preferred contact" value={row.preferred_contact} />
        <Row label="How they heard" value={row.how_heard} />
        <Row label="Educational level" value={row.education_level} />
        <Row label="School / institution" value={row.institution} />
        <Row label="Course of study" value={row.course_of_study} />
        <Row label="Class / level" value={row.class_level} />
        <Row label="Occupation" value={row.occupation} />
        <Row label="Category" value={row.category === "academic" ? "Academics" : "Digital Skills"} />
        {row.category === "academic" ? (
          <>
            <Row label="Exam targets" value={examLabel || null} />
            <Row label="Class level" value={row.academic_class} />
            <Row label="Combination" value={row.subject_combination} />
            <Row label="Subjects" value={row.subjects?.join(", ")} />
          </>
        ) : (
          <>
            <Row label="Skills (primary first)" value={trackLabel || null} />
            <Row label="Experience" value={row.experience_level} />
            <Row label="Devices" value={row.device_access?.join(", ")} />
          </>
        )}
        <Row label="Consents" value={`Terms ${row.consent_terms ? "✓" : "✗"} · Privacy ${row.consent_privacy ? "✓" : "✗"} · Comms ${row.consent_comms ? "✓" : "✗"}`} />
        <Row label="Registered" value={formatDate(new Date(row.created_at))} />
      </dl>

      <div className="mt-4 rounded-xl border border-line bg-white p-3">
        <dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Learning objectives</dt>
        <dd className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-ink">{row.learning_objectives ?? "—"}</dd>
      </div>
      {row.notes && (
        <div className="mt-3 rounded-xl border border-line bg-white p-3">
          <dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Notes from them</dt>
          <dd className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-ink">{row.notes}</dd>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-[10px] text-muted">Record #{row.id} · created {timeAgo(new Date(row.created_at).getTime())}</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={copyEverything}>
          <Copy size={13} /> Copy everything
        </button>
      </div>
    </div>
  );
}
