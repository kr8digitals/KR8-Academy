import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Award,
  BadgeCheck,
  BookOpenCheck,
  CalendarCheck,
  CalendarRange,
  Check,
  CircleSlash,
  ClipboardList,
  DatabaseBackup,
  Download,
  Eye,
  FileUp,
  Gauge,
  GraduationCap,
  Hourglass,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Megaphone,
  PenLine,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  TriangleAlert,
  Trophy,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { MENTORS, TRACKS, trackByKey, trackName } from "../data/academy";
import { useAuth } from "../lib/auth";
import { useDb } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { useToast } from "../lib/toast";
import {
  clearSampleData,
  declineCertificateRequest,
  deleteAnnouncement,
  deleteStudent,
  exportDatabase,
  getAnnouncements,
  getAttendance,
  getLeaderboard,
  getRoster,
  getSessionStatus,
  getStats,
  getStudent,
  getSubmissions,
  importDatabase,
  issueCertificate,
  markAttendanceAdmin,
  reseed,
  resetTrackProgress,
  reviewApplication,
  reviewSubmission,
  revokeCertificate,
  saveAnnouncement,
  saveSettings,
  setSessionStatus,
  setStudentStatus,
  setVip,
  storageSizeKb,
  setStudentRole,
  setTemporaryPassword,
} from "../lib/store";
import ProgrammesTab from "./admin/ProgrammesTab";
import WaitlistTab from "./admin/WaitlistTab";
import ScoresTab from "./admin/ScoresTab";
import AwardsTab from "./admin/AwardsTab";
import ExamsTab from "./admin/ExamsTab";
import SpotlightTab from "./admin/SpotlightTab";
import ContentTab from "./admin/ContentTab";
import DataTab from "./admin/DataTab";
import SecurityTab from "./admin/SecurityTab";
import type { Announcement, CertificateTier, Student } from "../lib/types";
import { cn, download, formatDate, formatDateTime, timeAgo } from "../lib/utils";
import { Avatar, Card, EmptyState, Field, Input, Modal, Pill, Progress, Select, Tabs, Textarea } from "../components/ui";
import { NudgeComposer } from "../components/NudgeComposer";
import { ShowUpPanel } from "../components/ShowUpPanel";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "students", label: "Students", icon: Users },
  { id: "applications", label: "Applications", icon: Inbox },
  { id: "submissions", label: "Submissions", icon: ClipboardList },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "certificates", label: "Certificates", icon: Award },
  { id: "awards", label: "Awards", icon: Trophy },
  { id: "spotlight", label: "Spotlight", icon: Sparkles },
  { id: "scores", label: "Scores", icon: Gauge },
  { id: "exams", label: "Exams", icon: BookOpenCheck },
  { id: "programmes", label: "Programmes", icon: CalendarRange },
  { id: "waitlist", label: "Waitlist", icon: Hourglass },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "content", label: "Content", icon: PenLine },
  { id: "data", label: "Backup & undo", icon: DatabaseBackup },
  { id: "security", label: "Security", icon: KeyRound },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function Admin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { student, signOut, isOwner } = useAuth();
  const db = useDb();

  useSeo({ title: "Admin console", description: "Academy administration.", path: "/admin", noindex: true });

  const active = SECTIONS.find((s) => location.pathname === `/admin/${s.id}`)?.id ?? "overview";
  const stats = getStats();

  if (!student) return null;

  return (
    <div className="min-h-screen bg-base">
      <div className="shell py-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-8">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card overflow-hidden">
              <div className="ink-panel p-4">
                <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/50">
                  <ShieldCheck size={11} /> Admin console
                </p>
                <p className="mt-1.5 truncate font-display text-[13px] font-semibold text-white">{student.name}</p>
                <p className="truncate text-[10px] text-white/50">{db.settings.cohortName}</p>
              </div>
              <nav className="hidden p-2 lg:block" aria-label="Admin">
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isActive = active === section.id;
                  const pendingSlips = db.utmeSlips.filter((slip) => slip.status === "pending").length;
                  const pendingGrants = db.awardGrants.filter((grant) => grant.status === "pending").length;
                  const badge =
                    section.id === "applications" ? stats.pendingApps :
                    section.id === "submissions" ? stats.pendingReviews :
                    section.id === "certificates" ? stats.pendingCerts :
                    section.id === "awards" ? pendingSlips + pendingGrants :
                    section.id === "waitlist" ? db.waitlist.filter((entry) => !entry.notifiedAt).length : 0;
                  return (
                    <Link
                      key={section.id}
                      to={`/admin/${section.id}`}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition",
                        isActive ? "bg-magenta-fill text-white" : "text-muted hover:bg-white/8 hover:text-white"
                      )}
                    >
                      <Icon size={15} />
                      <span className="flex-1">{section.label}</span>
                      {badge > 0 && (
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums", isActive ? "bg-white/20 text-white" : "bg-magenta-fill text-white")}>
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
                <div className="my-2 rule" />
                <Link to="/dashboard" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-muted transition hover:bg-white/8 hover:text-white">
                  <GraduationCap size={15} /> Student view
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    navigate("/");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-danger transition hover:bg-danger/12"
                >
                  <X size={15} /> Sign out
                </button>
              </nav>
            </div>

            <div className="mt-3 hidden rounded-xl border border-white/10 bg-raised p-3.5 lg:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Platform data</p>
              <p className="mt-1 text-[12px] font-semibold">{storageSizeKb()} KB used</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
                Export a backup before making major changes.
              </p>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="no-scrollbar -mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1 lg:hidden">
              {SECTIONS.map((section) => (
                <Link
                  key={section.id}
                  to={`/admin/${section.id}`}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-2 text-[12px] font-medium transition",
                    active === section.id ? "bg-magenta-fill text-white" : "border border-white/12 bg-raised text-muted"
                  )}
                >
                  {section.label}
                </Link>
              ))}
            </div>

            {active === "overview" && <Overview stats={stats} actor={student?.name ?? "Admin"} />}
            {active === "students" && <Students isOwner={isOwner} />}
            {active === "applications" && <Applications />}
            {active === "submissions" && <Submissions />}
            {active === "attendance" && <AttendanceAdmin />}
            {active === "certificates" && <CertificatesAdmin />}
            {active === "awards" && <AwardsTab />}
            {active === "spotlight" && <SpotlightTab actor={student?.name ?? "Admin"} />}
            {active === "scores" && <ScoresTab />}
            {active === "exams" && <ExamsTab />}
            {active === "programmes" && <ProgrammesTab />}
            {active === "waitlist" && <WaitlistTab />}
            {active === "announcements" && <Announcements />}
            {active === "content" && <ContentTab />}
            {active === "data" && <DataTab />}
            {active === "security" && <SecurityTab />}
            {active === "settings" && <SettingsPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Overview({ stats, actor }: { stats: ReturnType<typeof getStats>; actor: string }) {
  const db = useDb();
  const leaderboard = getLeaderboard().slice(0, 5);
  const recent = [...db.auditLog].slice(0, 8);
  const maxTrack = Math.max(1, ...stats.byTrack.map((t) => t.count));
  const [nudge, setNudge] = useState<{ open: boolean; preselect?: string[] }>({ open: false });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="display display-md mt-2">The academy at a glance.</h1>
        </div>
        <Pill tone="live">{db.settings.registrationOpen ? "Admissions open" : "Admissions paused"}</Pill>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Students", value: stats.totalStudents, note: `${stats.active} active`, icon: Users },
          { label: "Applications", value: stats.pendingApps, note: "awaiting review", icon: Inbox },
          { label: "Submissions", value: stats.pendingReviews, note: "to review", icon: ClipboardList },
          { label: "Certificates", value: stats.certs, note: "issued", icon: Award },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="p-4">
              <div className="flex items-center justify-between">
                <Icon size={15} className="text-magenta-bright" />
                <span className="text-[9px] uppercase tracking-[0.1em] text-muted">{item.label}</span>
              </div>
              <p className="mt-3 font-display text-2xl font-semibold leading-none tabular-nums">{item.value}</p>
              <p className="mt-1 text-[10px] text-muted">{item.note}</p>
            </Card>
          );
        })}
      </div>

      <ShowUpPanel
        onNudge={(ids) => setNudge({ open: true, preselect: ids })}
        onNudgeAll={(ids) => setNudge({ open: true, preselect: ids })}
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Enrolment by track</p>
          <div className="mt-4 space-y-2.5">
            {stats.byTrack.map((track) => (
              <div key={track.key}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-body">{track.name}</span>
                  <span className="font-semibold tabular-nums">{track.count}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-magenta-fill" style={{ width: `${(track.count / maxTrack) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/8 pt-3 text-[11px]">
            <div><p className="text-muted">Attendance rate</p><p className="mt-0.5 font-semibold">{stats.attendanceRate}%</p></div>
            <div><p className="text-muted">Cert requests</p><p className="mt-0.5 font-semibold">{stats.pendingCerts}</p></div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Top of the cohort</p>
          <div className="mt-3 space-y-2.5">
            {leaderboard.map((row, index) => (
              <div key={row.student.id} className="flex items-center gap-2.5">
                <span className="w-4 font-mono text-[10px] text-muted">{index + 1}</span>
                <Avatar name={row.student.name} src={row.student.avatar} size={26} />
                <span className="min-w-0 flex-1 truncate text-[12px]">{row.student.name}</span>
                <span className="font-display text-[11px] font-semibold tabular-nums">{row.xp.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Recent activity</p>
          <Activity size={13} className="text-muted-2/70" />
        </div>
        <div className="mt-3 space-y-2.5">
          {recent.length === 0 && <p className="text-[12px] text-muted">No activity yet.</p>}
          {recent.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2.5 border-b border-white/8 pb-2.5 last:border-0">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-magenta-fill" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium">{entry.action.replace(/\./g, " · ")}</p>
                <p className="truncate text-[10.5px] text-muted">{entry.detail}</p>
              </div>
              <span className="shrink-0 text-[9.5px] text-muted">{timeAgo(entry.at)}</span>
            </div>
          ))}
        </div>
      </Card>
      <NudgeComposer open={nudge.open} onClose={() => setNudge({ open: false })} preselect={nudge.preselect} actor={actor} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Students({ isOwner }: { isOwner: boolean }) {
  const toast = useToast();
  const { student: me } = useAuth();
  const [vipNote, setVipNote] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Student | null>(null);
  const [certTier, setCertTier] = useState<CertificateTier>("Professionalism");

  const roster = getRoster().filter((s) => {
    const matchesQuery =
      !query ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.id.toLowerCase().includes(query.toLowerCase()) ||
      s.email.toLowerCase().includes(query.toLowerCase());
    const matchesTrack = track === "all" || s.trackKey === track;
    const matchesStatus = status === "all" || s.status === status;
    return matchesQuery && matchesTrack && matchesStatus;
  });

  const selectedLive = selected ? getStudent(selected.id) ?? selected : null;
  const selectedProgress = selected ? getSubmissions(selected.id) : [];

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Students</p>
        <h1 className="display display-md mt-2">{getRoster().length} enrolled accounts.</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-2/70" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, KR8 ID or email" className="pl-9" />
        </div>
        <Select value={track} onChange={(e) => setTrack(e.target.value)} className="w-auto min-w-[150px]">
          <option value="all">All skills</option>
          {TRACKS.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto min-w-[130px]">
          <option value="all">Any status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="paused">Paused</option>
          <option value="suspended">Suspended</option>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-raised">
        <div className="hidden sm:block">
          <table className="data-table">
            <thead>
              <tr className="bg-raised/60">
                <th className="pl-4">Student</th>
                <th>Skill</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Joined</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {roster.map((student) => {
                const weeks = student.weeksDone.length;
                return (
                  <tr key={student.id}>
                    <td className="pl-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={student.name} src={student.avatar} size={30} />
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-medium">{student.name} {student.sample && <span className="text-[9px] text-muted">(sample)</span>}</p>
                          <p className="truncate font-mono text-[9.5px] text-muted">{student.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-[11.5px]">{trackName(student.trackKey)}</td>
                    <td><StatusPill status={student.status} /></td>
                    <td className="w-28"><Progress value={(weeks / 8) * 100} /></td>
                    <td className="text-[11px] text-muted">{formatDate(student.createdAt)}</td>
                    <td className="pr-4 text-right">
                      <button
                        type="button"
                        title={student.vip ? `VIP — ${student.vipNote ?? "tagged"}` : "Tag as VIP"}
                        aria-pressed={!!student.vip}
                        className="mr-1 rounded-lg p-2 text-muted transition hover:text-gold"
                        onClick={() => setVip(student.id, !student.vip, undefined, "Admin")}
                      >
                        <Star size={15} fill={student.vip ? "currentColor" : "none"} className={student.vip ? "text-gold" : ""} />
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSelected(student); setShowRecovery(false); setTempPassword(""); setVipNote(student.vipNote ?? ""); }}>Manage</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-white/8 sm:hidden">
          {roster.map((student) => (
            <button key={student.id} type="button" className="flex w-full items-center gap-3 p-3 text-left" onClick={() => setSelected(student)}>
              <Avatar name={student.name} src={student.avatar} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium">{student.name}</p>
                <p className="truncate text-[10px] text-muted">{trackName(student.trackKey)} · {student.weeksDone.length}/8 weeks</p>
              </div>
              <StatusPill status={student.status} />
            </button>
          ))}
        </div>

        {roster.length === 0 && (
          <div className="p-6">
            <EmptyState icon={<Users size={18} />} title="No students match" body="Try a different search or filter." />
          </div>
        )}
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selectedLive?.name ?? "Student"}
        description={selectedLive ? `${trackName(selectedLive.trackKey)} · ${selectedLive.id} · ${selectedLive.role}` : undefined}
        size="lg"
      >
        {selectedLive && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Weeks", value: `${selectedLive.weeksDone.length}/8` },
                { label: "Submissions", value: String(selectedProgress.length) },
                { label: "Accepted", value: String(selectedProgress.filter((s) => s.status === "accepted").length) },
                { label: "Attendance", value: String(getAttendance(selectedLive.id).length) },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/10 bg-base p-2.5">
                  <p className="text-[9px] uppercase tracking-[0.08em] text-muted">{item.label}</p>
                  <p className="mt-0.5 font-display text-sm font-semibold">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="field-label">Set status</p>
                <div className="flex flex-wrap gap-1.5">
                  {(["active", "pending", "paused", "suspended"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize", selectedLive.status === value ? "border-white bg-magenta-fill text-white" : "border-white/15 text-muted")}
                      onClick={() => {
                        setStudentStatus(selectedLive.id, value);
                        toast.success("Status updated", `${selectedLive.name} → ${value}`);
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="field-label">Issue certificate</p>
                <div className="flex gap-1.5">
                  <Select value={certTier} onChange={(e) => setCertTier(e.target.value as CertificateTier)} className="py-2 text-[12px]">
                    <option value="Professionalism">Professionalism</option>
                    <option value="Completion">Completion</option>
                  </Select>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm shrink-0"
                    onClick={() => {
                      const result = issueCertificate({ studentId: selectedLive.id, tier: certTier, issuedBy: "KR8 Academy" });
                      if (!result.ok) toast.error("Could not issue", result.error);
                      else toast.success("Certificate issued", result.certificate?.code);
                    }}
                  >
                    Issue
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-white/8 pt-3">
              <Link to={`/verify/${encodeURIComponent(selectedLive.id)}`} className="btn btn-ghost btn-sm"><Eye size={13} /> Public record</Link>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  resetTrackProgress(selectedLive.id);
                  toast.success("Progress reset", "Submissions and attendance cleared.");
                }}
              >
                <RefreshCw size={13} /> Reset progress
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-danger"
                onClick={() => {
                  deleteStudent(selectedLive.id);
                  setSelected(null);
                  toast.success("Account deleted");
                }}
              >
                <Trash2 size={13} /> Delete account
              </button>
            </div>

            <div className="grid gap-3 border-t border-white/8 pt-3 sm:grid-cols-2">
              <div>
                <p className="field-label">VIP tag</p>
                <label className="flex cursor-pointer items-start gap-2 text-[12px]">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#3d1250]" checked={!!selectedLive.vip} onChange={(e) => setVip(selectedLive.id, e.target.checked, vipNote || undefined, "Admin")} />
                  <span>
                    <span className="block font-medium">Priority student</span>
                    <span className="block text-[10.5px] text-muted">Shown in exports and the students table.</span>
                  </span>
                </label>
                {selectedLive.vip && (
                  <Input className="mt-1.5 !py-1.5 text-[11px]" placeholder="VIP note (optional, admins only)" value={vipNote} onChange={(e) => setVipNote(e.target.value)} onBlur={() => setVip(selectedLive.id, true, vipNote || undefined, "Admin")} />
                )}
              </div>
              {isOwner ? (
                <div>
                  <p className="field-label">Access role</p>
                  <Select
                    className="py-2 text-[12px]"
                    value={selectedLive.role}
                    onChange={(e) => {
                      const result = setStudentRole(selectedLive.id, e.target.value as Student["role"]);
                      if (!result.ok) toast.error("Refused", result.error ?? "Could not change that role.");
                      else toast.success("Role updated", `${selectedLive.name} → ${e.target.value}`);
                    }}
                  >
                    {(["owner", "admin", "coach", "reviewer", "editor", "student"] as const).map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </Select>
                  <p className="mt-1 text-[9.5px] text-muted">Owner-only control. Two owners always enforced.</p>
                </div>
              ) : null}
            </div>

            <div className="border-t border-white/8 pt-3">
              <button type="button" className="flex items-center gap-1.5 text-[11px] font-semibold text-muted hover:text-white" onClick={() => setShowRecovery((v) => !v)}>
                <KeyRound size={12} /> {showRecovery ? "Hide account recovery" : "Account recovery (set temporary password)"}
              </button>
              {showRecovery && (
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <Field label="Temporary password" htmlFor="recovery-temp" hint="Min 10 chars · forced change on next sign-in" className="min-w-[220px] flex-1">
                    <Input id="recovery-temp" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} autoComplete="new-password" placeholder="correct-horse-battery-staple" />
                  </Field>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      const result = await setTemporaryPassword(selectedLive.id, tempPassword, me?.name ?? "Admin");
                      if (!result.ok) return toast.error("Not set", result.error ?? "Try again.");
                      toast.success("Temporary password set", `${selectedLive.name} must change it on next sign-in.`);
                      setTempPassword("");
                      setShowRecovery(false);
                    }}
                  >
                    Set & force change
                  </button>
                </div>
              )}
            </div>

            <p className="text-[10.5px] text-muted">
              Contact · {selectedLive.email} · {selectedLive.phone} · joined {formatDate(selectedLive.createdAt)}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StatusPill({ status }: { status: Student["status"] }) {
  const tone = status === "active" ? "live" : status === "suspended" ? "default" : "magenta";
  return <Pill tone={tone as "live" | "magenta" | "default"}>{status}</Pill>;
}

/* ------------------------------------------------------------------ */

function Applications() {
  const db = useDb();
  const toast = useToast();
  const [filter, setFilter] = useState("pending");
  const applications = db.applications.filter((a) => (filter === "all" ? true : a.status === filter));

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Applications</p>
        <h1 className="display display-md mt-2">Admissions queue.</h1>
      </div>

      <Tabs
        value={filter}
        onChange={setFilter}
        tabs={[
          { id: "pending", label: "Pending", count: db.applications.filter((a) => a.status === "pending").length },
          { id: "auto-approved", label: "Auto-approved", count: db.applications.filter((a) => a.status === "auto-approved").length },
          { id: "approved", label: "Approved" },
          { id: "declined", label: "Declined" },
          { id: "all", label: "All" },
        ]}
      />

      <div className="space-y-2.5">
        {applications.length === 0 && (
          <EmptyState icon={<Inbox size={18} />} title="Nothing in this queue" body="Applications appear here the moment a student applies." />
        )}
        {applications.map((application) => {
          const applicant = getStudent(application.studentId);
          return (
            <Card key={application.id} className="p-4">
              <div className="flex flex-wrap items-start gap-3">
                <Avatar name={applicant?.name ?? "Applicant"} src={applicant?.avatar} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{applicant?.name ?? "Unknown applicant"}</p>
                  <p className="truncate text-[10.5px] text-muted">
                    {trackName(application.trackKey)} · {applicant?.email} · applied {formatDate(application.createdAt)}
                  </p>
                  {application.motivation && <p className="mt-2 rounded-lg bg-base p-2.5 text-[11.5px] leading-relaxed text-body">“{application.motivation}”</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill>{application.experience}</Pill>
                    <Pill tone={application.status === "declined" ? "default" : application.status === "pending" ? "magenta" : "live"}>{application.status}</Pill>
                  </div>
                </div>
                {application.status === "pending" && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        reviewApplication(application.id, "approved");
                        toast.success("Application approved", "The student can now access the cohort.");
                      }}
                    >
                      <UserCheck size={13} /> Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        reviewApplication(application.id, "declined", "Cohort full");
                        toast.info("Application declined");
                      }}
                    >
                      <CircleSlash size={13} /> Decline
                    </button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Submissions() {
  const db = useDb();
  const toast = useToast();
  const [filter, setFilter] = useState("submitted");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [score, setScore] = useState(85);
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState<"accepted" | "revise">("accepted");

  const list = db.submissions
    .filter((s) => (filter === "all" ? true : s.status === filter))
    .sort((a, b) => b.submittedAt - a.submittedAt);

  const target = list.find((s) => s.id === reviewing);

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Submissions</p>
        <h1 className="display display-md mt-2">Review queue.</h1>
        <p className="mt-1.5 text-[13px] text-muted">Accepting a submission adds +80 XP and counts toward graduation.</p>
      </div>

      <Tabs
        value={filter}
        onChange={setFilter}
        tabs={[
          { id: "submitted", label: "In review", count: db.submissions.filter((s) => s.status === "submitted").length },
          { id: "accepted", label: "Accepted", count: db.submissions.filter((s) => s.status === "accepted").length },
          { id: "revise", label: "Revise", count: db.submissions.filter((s) => s.status === "revise").length },
          { id: "all", label: "All", count: db.submissions.length },
        ]}
      />

      <div className="space-y-2.5">
        {list.length === 0 && <EmptyState icon={<ClipboardList size={18} />} title="Queue is clear" body="No submissions with this status." />}
        {list.slice(0, 60).map((submission) => {
          const owner = getStudent(submission.studentId);
          return (
            <Card key={submission.id} className="p-4">
              <div className="flex flex-wrap items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/6 font-mono text-[11px] font-semibold">W{submission.week}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{submission.title}</p>
                  <p className="truncate text-[10.5px] text-muted">
                    {owner?.name ?? submission.studentId} · {trackName(submission.trackKey)} · {timeAgo(submission.submittedAt)}
                  </p>
                  <a href={submission.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-[10.5px] text-magenta-bright hover:underline">{submission.url}</a>
                  {submission.note && <p className="mt-1.5 line-clamp-2 text-[11px] text-muted">“{submission.note}”</p>}
                  {submission.feedback && <p className="mt-1.5 rounded bg-base p-2 text-[11px] text-body">Feedback: {submission.feedback}</p>}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Pill tone={submission.status === "accepted" ? "live" : submission.status === "revise" ? "default" : "magenta"}>{submission.status}</Pill>
                  {submission.score !== undefined && <span className="text-[10px] text-muted">{submission.score}/100</span>}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setReviewing(submission.id);
                      setScore(submission.score ?? 85);
                      setFeedback(submission.feedback ?? "");
                      setStatus(submission.status === "revise" ? "revise" : "accepted");
                    }}
                  >
                    Review
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        title="Review submission"
        description={target ? `${target.title} · week ${target.week}` : undefined}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setReviewing(null)}>Cancel</button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!target) return;
                reviewSubmission(target.id, status, feedback.trim(), score, "KR8 Academy");
                toast.success(status === "accepted" ? "Submission accepted" : "Revision requested");
                setReviewing(null);
              }}
            >
              <Check size={14} /> Save review
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Outcome" htmlFor="review-status">
              <Select id="review-status" value={status} onChange={(e) => setStatus(e.target.value as "accepted" | "revise")}>
                <option value="accepted">Accept</option>
                <option value="revise">Request revision</option>
              </Select>
            </Field>
            <Field label={`Score — ${score}/100`} htmlFor="review-score">
              <input id="review-score" type="range" min={0} max={100} value={score} onChange={(e) => setScore(Number(e.target.value))} className="mt-2 w-full accent-[#3d1250]" />
            </Field>
          </div>
          <Field label="Written feedback" htmlFor="review-feedback" hint="Specific, actionable, kind. This is what students remember.">
            <Textarea id="review-feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Strong hierarchy. Push the contrast on the headline and fix the uneven margin on the footer." />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AttendanceAdmin() {
  const db = useDb();
  const toast = useToast();
  const [track, setTrack] = useState(TRACKS[0].key);
  const [week, setWeek] = useState(1);
  const roster = getRoster(track);
  const status = getSessionStatus(track, week);
  const attendance = getAttendance().filter((a) => a.trackKey === track && a.week === week);
  const curriculum = trackByKey(track)?.curriculum ?? [];

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Attendance</p>
        <h1 className="display display-md mt-2">Open the room, mark the room.</h1>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Skill" htmlFor="att-track">
            <Select id="att-track" value={track} onChange={(e) => setTrack(e.target.value)}>
              {TRACKS.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
            </Select>
          </Field>
          <Field label="Week" htmlFor="att-week">
            <Select id="att-week" value={week} onChange={(e) => setWeek(Number(e.target.value))}>
              {curriculum.map((item, index) => <option key={item.week} value={index + 1}>Week {index + 1} — {item.title}</option>)}
            </Select>
          </Field>
          <div className="flex gap-1.5">
            {status !== "open" ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => { setSessionStatus(track, week, "open"); toast.success("Check-in opened"); }}>
                Open check-in
              </button>
            ) : (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSessionStatus(track, week, "closed"); toast.info("Check-in closed"); }}>
                Close check-in
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/8 pt-3 text-[11px]">
          <Pill tone={status === "open" ? "live" : "default"}>Check-in {status}</Pill>
          <span className="text-muted">{attendance.length}/{roster.length} students marked</span>
          <span className="ml-auto text-muted">{db.settings.cohortName}</span>
        </div>
      </Card>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-raised">
        <div className="divide-y divide-white/8">
          {roster.map((student) => {
            const present = attendance.some((a) => a.studentId === student.id);
            return (
              <div key={student.id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar name={student.name} src={student.avatar} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium">{student.name}</p>
                  <p className="truncate font-mono text-[9.5px] text-muted">{student.id}</p>
                </div>
                {present ? (
                  <Pill tone="live"><Check size={10} /> Present</Pill>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      markAttendanceAdmin(student.id, track, week);
                      toast.success("Marked present", student.name);
                    }}
                  >
                    Mark present
                  </button>
                )}
              </div>
            );
          })}
          {roster.length === 0 && <p className="px-4 py-8 text-center text-[12px] text-muted">No students enrolled in this skill.</p>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CertificatesAdmin() {
  const db = useDb();
  const toast = useToast();
  const [issueFor, setIssueFor] = useState("");
  const [tier, setTier] = useState<CertificateTier>("Professionalism");
  const [revoking, setRevoking] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const roster = getRoster();

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Certificates</p>
        <h1 className="display display-md mt-2">The credential register.</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Issue a certificate</p>
          <div className="mt-3 space-y-3">
            <Field label="Student" htmlFor="issue-student">
              <Select id="issue-student" value={issueFor} onChange={(e) => setIssueFor(e.target.value)}>
                <option value="">Select a student…</option>
                {roster.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.id}</option>)}
              </Select>
            </Field>
            <Field label="Tier" htmlFor="issue-tier">
              <Select id="issue-tier" value={tier} onChange={(e) => setTier(e.target.value as CertificateTier)}>
                <option value="Professionalism">Certificate of Professionalism</option>
                <option value="Completion">Certificate of Completion</option>
              </Select>
            </Field>
            <button
              type="button"
              className="btn btn-primary w-full"
              disabled={!issueFor}
              onClick={() => {
                const result = issueCertificate({ studentId: issueFor, tier, issuedBy: "KR8 Academy" });
                if (!result.ok) toast.error("Could not issue", result.error);
                else {
                  toast.success("Certificate issued", result.certificate?.code);
                  setIssueFor("");
                }
              }}
            >
              <Award size={15} /> Issue certificate
            </button>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Requests awaiting approval</p>
          <div className="mt-3 space-y-2">
            {db.certificateRequests.filter((r) => r.status === "pending").length === 0 && (
              <p className="text-[12px] text-muted">No pending requests.</p>
            )}
            {db.certificateRequests.filter((r) => r.status === "pending").map((request) => {
              const owner = getStudent(request.studentId);
              return (
                <div key={request.id} className="flex items-center gap-2 rounded-lg border border-white/10 p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium">{owner?.name}</p>
                    <p className="text-[10px] text-muted">{request.tier} · {trackName(request.trackKey)}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      const result = issueCertificate({ studentId: request.studentId, tier: request.tier, issuedBy: "KR8 Academy" });
                      if (!result.ok) toast.error("Could not issue", result.error);
                      else toast.success("Issued", result.certificate?.code);
                    }}
                  >
                    Issue
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      declineCertificateRequest(request.id, "Criteria not met");
                      toast.info("Request declined");
                    }}
                  >
                    Decline
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-raised">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Issued certificates</p>
          <span className="text-[11px] text-muted">{db.certificates.length}</span>
        </div>
        <div className="divide-y divide-white/8">
          {db.certificates.map((cert) => (
            <div key={cert.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", cert.revoked ? "bg-white/10 text-muted-2" : "bg-magenta-fill text-white")}>
                <Award size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium">{cert.studentNameSnapshot}</p>
                <p className="truncate font-mono text-[9.5px] text-muted">{cert.code} · {trackName(cert.trackKey)}</p>
              </div>
              <Pill tone={cert.revoked ? "default" : "live"}>{cert.revoked ? "Revoked" : cert.tier}</Pill>
              <Link to={`/certificate/${encodeURIComponent(cert.code)}`} className="btn btn-ghost btn-sm">
                <Eye size={12} /> View
              </Link>
              {!cert.revoked && (
                <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => setRevoking(cert.id)}>
                  Revoke
                </button>
              )}
            </div>
          ))}
          {db.certificates.length === 0 && <p className="px-4 py-8 text-center text-[12px] text-muted">No certificates issued yet.</p>}
        </div>
      </div>

      <Modal
        open={!!revoking}
        onClose={() => setRevoking(null)}
        title="Revoke this certificate?"
        description="The verification page will immediately show the credential as invalid."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setRevoking(null)}>Cancel</button>
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => {
                if (!revoking) return;
                revokeCertificate(revoking, reason.trim() || "Revoked by the academy");
                setRevoking(null);
                setReason("");
                toast.success("Certificate revoked");
              }}
            >
              Revoke certificate
            </button>
          </>
        }
      >
        <Field label="Reason" htmlFor="revoke-reason" hint="Shown on the public verification page.">
          <Input id="revoke-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Issued in error" />
        </Field>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Announcements() {
  const toast = useToast();
  const [editing, setEditing] = useState<Announcement | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [track, setTrack] = useState("all");
  const [pinned, setPinned] = useState(false);

  function openNew() {
    setEditing("new");
    setTitle("");
    setBody("");
    setTrack("all");
    setPinned(false);
  }

  function openEdit(item: Announcement) {
    setEditing(item);
    setTitle(item.title);
    setBody(item.body);
    setTrack(item.trackKey);
    setPinned(!!item.pinned);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Announcements</p>
          <h1 className="display display-md mt-2">Talk to the cohort.</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Plus size={15} /> New announcement
        </button>
      </div>

      <div className="space-y-2.5">
        {getAnnouncements().map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-semibold">{item.title}</p>
                  {item.pinned && <Pill tone="magenta">Pinned</Pill>}
                  <Pill>{item.trackKey === "all" ? "All skills" : trackName(item.trackKey)}</Pill>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{item.body}</p>
                <p className="mt-1.5 text-[10px] text-muted">{item.author} · {formatDateTime(item.createdAt)}</p>
              </div>
              <div className="flex gap-1.5">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}><Pencil size={12} /></button>
                <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => { deleteAnnouncement(item.id); toast.success("Announcement deleted"); }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {getAnnouncements().length === 0 && <EmptyState icon={<Megaphone size={18} />} title="No announcements" body="Create one to reach the whole cohort on their dashboard." />}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New announcement" : "Edit announcement"}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!title.trim() || !body.trim()}
              onClick={() => {
                saveAnnouncement({
                  id: editing && editing !== "new" ? editing.id : undefined,
                  title: title.trim(),
                  body: body.trim(),
                  trackKey: track,
                  pinned,
                  author: "KR8 Academy",
                });
                setEditing(null);
                toast.success("Announcement saved");
              }}
            >
              Save
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Title" htmlFor="ann-title">
            <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The 5th Cohort is open for registration" />
          </Field>
          <Field label="Message" htmlFor="ann-body">
            <Textarea id="ann-body" value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Audience" htmlFor="ann-track">
              <Select id="ann-track" value={track} onChange={(e) => setTrack(e.target.value)}>
                <option value="all">All skills</option>
                {TRACKS.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
              </Select>
            </Field>
            <label className="flex items-end gap-2 pb-2 text-[12px]">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-4 w-4 accent-[#3d1250]" />
              Pin to the top
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SettingsPanel() {
  const db = useDb();
  const toast = useToast();
  const [form, setForm] = useState(db.settings);
  const [importText, setImportText] = useState("");
  const [confirmDanger, setConfirmDanger] = useState<"reseed" | "clear" | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Settings</p>
        <h1 className="display display-md mt-2">Cohort configuration.</h1>
      </div>

      <Card className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Cohort</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Cohort name" htmlFor="s-name">
            <Input id="s-name" value={form.cohortName} onChange={(e) => setForm({ ...form, cohortName: e.target.value })} />
          </Field>
          <Field label="Classes begin" htmlFor="s-start">
            <Input id="s-start" type="datetime-local" value={new Date(form.cohortStart).toISOString().slice(0, 16)} onChange={(e) => setForm({ ...form, cohortStart: new Date(e.target.value).toISOString() })} />
          </Field>
          <Field label="Applications close" htmlFor="s-deadline">
            <Input id="s-deadline" type="date" value={new Date(form.applicationDeadline).toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, applicationDeadline: new Date(e.target.value).toISOString() })} />
          </Field>
          <Field label="Seats note" htmlFor="s-seats">
            <Input id="s-seats" value={form.cohortSeatsNote} onChange={(e) => setForm({ ...form, cohortSeatsNote: e.target.value })} />
          </Field>
        </div>

        <div className="mt-4 space-y-2.5 border-t border-white/8 pt-3">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input type="checkbox" checked={form.registrationOpen} onChange={(e) => setForm({ ...form, registrationOpen: e.target.checked })} className="mt-0.5 h-4 w-4 accent-[#3d1250]" />
            <span className="text-[12px] text-body">
              <span className="block font-medium">Admissions open</span>
              <span className="block text-[11px] text-muted">When off, new applications join the waitlist instead of activating instantly.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2.5">
            <input type="checkbox" checked={form.autoApprove} onChange={(e) => setForm({ ...form, autoApprove: e.target.checked })} className="mt-0.5 h-4 w-4 accent-[#3d1250]" />
            <span className="text-[12px] text-body">
              <span className="block font-medium">Auto-approve applications</span>
              <span className="block text-[11px] text-muted">Recommended while seats are open. Turn off to review every applicant.</span>
            </span>
          </label>
        </div>

        <div className="mt-4 grid gap-3 border-t border-white/8 pt-3 sm:grid-cols-2">
          <Field label="Support email" htmlFor="s-email">
            <Input id="s-email" type="email" value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} />
          </Field>
          <Field label="WhatsApp community URL" htmlFor="s-wa">
            <Input id="s-wa" value={form.whatsappUrl} onChange={(e) => setForm({ ...form, whatsappUrl: e.target.value })} />
          </Field>
          <Field label="Agency URL" htmlFor="s-agency">
            <Input id="s-agency" value={form.agencyUrl} onChange={(e) => setForm({ ...form, agencyUrl: e.target.value })} />
          </Field>
          <Field label="Instagram" htmlFor="s-ig">
            <Input id="s-ig" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
          </Field>
        </div>

        <button
          type="button"
          className="btn btn-primary mt-4"
          onClick={() => {
            saveSettings(form);
            toast.success("Settings saved", "The academy now reflects these values.");
          }}
        >
          <Check size={15} /> Save settings
        </button>
      </Card>

      <Card className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Backup & data</p>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          Export a JSON backup of the academy data ({storageSizeKb()} KB) before making major changes, so it can
          be restored at any time.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              download(`kr8-academy-backup-${new Date().toISOString().slice(0, 10)}.json`, exportDatabase());
              toast.success("Backup downloaded");
            }}
          >
            <Download size={13} /> Export backup
          </button>
          <label className="btn btn-ghost btn-sm cursor-pointer">
            <FileUp size={13} /> Import backup
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                const result = importDatabase(text);
                if (!result.ok) toast.error("Import failed", result.error);
                else toast.success("Backup restored");
                event.target.value = "";
              }}
            />
          </label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmDanger("clear")}>
            <Trash2 size={13} /> Clear sample data
          </button>
          <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => setConfirmDanger("reseed")}>
            <RefreshCw size={13} /> Reset entire academy
          </button>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-[11px] font-medium text-muted">Paste a backup instead</summary>
          <textarea className="textarea mt-2 font-mono text-[10px]" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='{"version":1,...}' />
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-2"
            onClick={() => {
              const result = importDatabase(importText);
              if (!result.ok) toast.error("Import failed", result.error);
              else toast.success("Backup restored");
            }}
          >
            Restore from text
          </button>
        </details>
      </Card>

      <Card className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Faculty</p>
        <div className="mt-3 space-y-2">
          {MENTORS.map((mentor) => (
            <div key={mentor.key} className="flex items-center gap-2.5">
              <Avatar name={mentor.name} src={mentor.photo} size={28} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium">{mentor.name}</p>
                <p className="truncate text-[10px] text-muted">{mentor.title}</p>
              </div>
              <BadgeCheck size={13} className="text-magenta-bright" />
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={!!confirmDanger}
        onClose={() => setConfirmDanger(null)}
        title={confirmDanger === "reseed" ? "Reset the entire academy?" : "Clear sample data?"}
        description={
          confirmDanger === "reseed"
            ? "This wipes every account, submission, attendance record and certificate and restores the seeded demo. Export a backup first."
            : "This removes the eight seeded sample students and their records. Real registrations are untouched."
        }
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmDanger(null)}>Cancel</button>
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => {
                if (confirmDanger === "reseed") {
                  reseed();
                  toast.success("Academy reset", "Seeded data restored.");
                } else {
                  clearSampleData();
                  toast.success("Sample data cleared");
                }
                setConfirmDanger(null);
              }}
            >
              <TriangleAlert size={14} /> Yes, continue
            </button>
          </>
        }
      />
    </div>
  );
}

