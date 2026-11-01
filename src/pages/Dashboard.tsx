import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Award,
  Bell,
  BookOpen,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Link2,
  Loader2,
  LockKeyhole,
  MailX,
  LogOut,
  Pencil,
  Quote,
  Send,
  Sparkles,
  Trophy,
  Upload,
  UserRound,
} from "lucide-react";
import { MENTORS, TRACKS, trackByKey, trackName } from "../data/academy";
import { useAuth } from "../lib/auth";
import { useDb } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { useToast } from "../lib/toast";
import {
  changePassword,
  checkIn,
  getAnnouncements,
  getAttendance,
  getCertificates,
  getLeaderboard,
  getSessionStatus,
  getSubmissions,
  progressFor,
  requestCertificate,
  submitAssignment,
  toggleWeek,
  updateProfile,
  updateSubmission,
} from "../lib/store";
import { addDays, cn, copyToClipboard, formatDate, formatDateTime, levelFor, timeAgo, xpFor } from "../lib/utils";
import type { Student, Submission } from "../lib/types";
import { Avatar, ButtonLink, Card, EmptyState, Field, Input, Modal, Pill, Progress, Ring, Select, Textarea } from "../components/ui";
import { CertificatePreview } from "../components/CertificatePreview";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "curriculum", label: "Curriculum", icon: BookOpen },
  { id: "assignments", label: "Assignments", icon: Send },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "certificate", label: "Certificate", icon: Award },
  { id: "profile", label: "Profile", icon: UserRound },
];

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { student, signOut } = useAuth();
  const db = useDb();

  useSeo({
    title: "Student dashboard",
    description: "Your KR8 Academy dashboard: weeks, assignments, attendance, XP and certificates.",
    path: "/dashboard",
    noindex: true,
  });

  const active = SECTIONS.find((s) => location.pathname === `/dashboard/${s.id}`)?.id ?? "overview";

  if (!student) return null;

  if (student.status === "pending") return <PendingState student={student} />;

  const progress = progressFor(student);
  const track = trackByKey(student.trackKey);
  const mentor = MENTORS.find((m) => m.key === track?.mentorKey);

  return (
    <div className="min-h-screen bg-base">
      <div className="shell py-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-8">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card overflow-hidden">
              <div className="flex items-center gap-3 border-b border-white/8 p-4">
                <Avatar name={student.name} src={student.avatar} size={42} ring />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{student.name.split(" ").slice(0, 2).join(" ")}</p>
                  <p className="truncate font-mono text-[9.5px] text-muted">{student.id}</p>
                </div>
              </div>
              <nav className="hidden p-2 lg:block" aria-label="Dashboard">
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isActive = active === section.id;
                  return (
                    <Link
                      key={section.id}
                      to={`/dashboard/${section.id}`}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition",
                        isActive ? "bg-magenta-fill text-white" : "text-muted hover:bg-white/8 hover:text-white"
                      )}
                    >
                      <Icon size={15} />
                      {section.label}
                      {isActive && <ChevronRight size={13} className="ml-auto" />}
                    </Link>
                  );
                })}
                <div className="my-2 rule" />
                <Link to="/leaderboard" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-muted transition hover:bg-white/8 hover:text-white">
                  <Trophy size={15} /> Leaderboard
                </Link>
                {student.role !== "student" && (
                  <Link to="/admin" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-magenta-bright transition hover:bg-magenta/10">
                    <LockKeyhole size={15} /> Admin console
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    navigate("/");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-danger transition hover:bg-danger/12"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </nav>
            </div>

            <div className="mt-3 hidden rounded-xl border border-white/10 bg-raised p-3.5 lg:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Cohort</p>
              <p className="mt-1 text-[12.5px] font-semibold">{db.settings.cohortName}</p>
              <p className="mt-0.5 text-[11px] text-muted">{track?.name}</p>
              <div className="mt-3">
                <Progress value={progress.overall} label="Overall" tone="magenta" />
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            {/* Mobile section tabs */}
            <div className="no-scrollbar -mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1 lg:hidden">
              {SECTIONS.map((section) => {
                const isActive = active === section.id;
                return (
                  <Link
                    key={section.id}
                    to={`/dashboard/${section.id}`}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-2 text-[12px] font-medium transition",
                      isActive ? "bg-magenta-fill text-white" : "border border-white/12 bg-raised text-muted"
                    )}
                  >
                    {section.label}
                  </Link>
                );
              })}
            </div>

            {student.mustChangePassword && <PasswordBanner />}

            {active === "overview" && <Overview student={student} />}
            {active === "curriculum" && <Curriculum student={student} />}
            {active === "assignments" && <Assignments student={student} />}
            {active === "attendance" && <Attendance student={student} />}
            {active === "certificate" && <Certificates student={student} />}
            {active === "profile" && <Profile student={student} />}

            {mentor && active !== "profile" && (
              <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-raised p-4">
                <Avatar name={mentor.name} src={mentor.photo} size={34} />
                <p className="text-[12px] text-muted">
                  Your track mentor is <span className="font-semibold text-white">{mentor.shortName}</span> — bring
                  work, not questions you could have searched.
                </p>
                <Link to="/mentors" className="ml-auto text-[11px] font-semibold text-magenta-bright">
                  Faculty →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pending state                                                       */
/* ------------------------------------------------------------------ */

function PendingState({ student }: { student: Student }) {
  const db = useDb();
  const { signOut } = useAuth();
  const application = [...db.applications]
    .filter((a) => a.studentId === student.id)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  const declined = application?.status === "declined";

  return (
    <div className="shell py-16">
      <div className="mx-auto max-w-xl text-center">
        <span
          className={cn(
            "mx-auto grid h-12 w-12 place-items-center rounded-full",
            declined ? "bg-magenta/15 text-magenta-bright" : "bg-warn/15 text-warn"
          )}
        >
          {declined ? <MailX size={20} /> : <Loader2 size={20} className="spin" />}
        </span>
        <h1 className="display display-md mt-5">
          {declined ? "Not this cohort — but not never." : "Your seat is on the list."}
        </h1>
        <p className="lede mt-3">
          {declined
            ? application?.note
              ? `The team noted: “${application.note}”. Your application stays on file, and you are prioritised for the next cohort.`
              : "This cohort filled before your application reached the front of the queue. Your application stays on file, and you are prioritised for the next cohort."
            : db.settings.registrationOpen
              ? "Your application is with the academy team. Seats are released in order, usually within 48 hours."
              : "Admissions are paused, so your seat is on the waitlist. You will be activated the moment the next cohort opens."}
        </p>
        <div className="mx-auto mt-6 max-w-sm rounded-xl border border-white/10 bg-raised p-4 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Your KR8 ID</p>
          <p className="mt-1 font-mono text-[13px] font-semibold">{student.id}</p>
          <p className="mt-2 text-[11px] text-muted">Track · {trackName(student.trackKey)}</p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {declined && (
            <ButtonLink to="/apply" variant="primary" arrow>
              Apply for the next cohort
            </ButtonLink>
          )}
          <ButtonLink href={db.settings.whatsappUrl} variant={declined ? "ghost" : "primary"}>
            Message the team
          </ButtonLink>
          <button type="button" className="btn btn-ghost" onClick={signOut}>Sign out</button>
        </div>
      </div>
    </div>
  );
}

function PasswordBanner() {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-warn/40 bg-warn/12 p-3.5">
      <LockKeyhole size={16} className="text-warn" />
      <p className="flex-1 text-[12px] text-warn">
        You are using the seeded admin password. Change it in <Link to="/dashboard/profile" className="font-semibold underline">Profile → Security</Link>.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

function QrBadge({ value }: { value: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { margin: 1, width: 220, color: { dark: "#240730", light: "#ffffff" } })
      .then((url) => alive && setSrc(url))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [value]);
  return src ? <img src={src} alt="QR code linking to your public student record" className="h-full w-full rounded-md" /> : <div className="skeleton h-full w-full rounded-md" />;
}

function Overview({ student }: { student: Student }) {
  const db = useDb();
  const progress = progressFor(student);
  const leaderboard = getLeaderboard();
  const rank = leaderboard.findIndex((row) => row.student.id === student.id) + 1;
  const xp = xpFor(student, {
    accepted: progress.accepted,
    attendance: progress.attendance,
    referrals: db.students.filter((s) => s.referredBy === student.id).length,
  });
  const level = levelFor(xp);
  const track = trackByKey(student.trackKey);
  const announcements = getAnnouncements(student.trackKey).slice(0, 3);
  const nextWeek = Math.min((track?.curriculum.length ?? 8), student.weeksDone.length + 1);
  const nextSessionDate = addDays(db.settings.cohortStart, (nextWeek - 1) * 7);
  const sessionOpen = getSessionStatus(student.trackKey, nextWeek) === "open";
  const profileUrl = `${window.location.origin}/verify/${encodeURIComponent(student.id)}`;
  const toast = useToast();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Week {nextWeek} of {track?.curriculum.length ?? 8}</p>
          <h1 className="display display-md mt-2">Welcome back, {student.name.split(" ")[0]}.</h1>
          <p className="mt-1.5 text-[13px] text-muted">
            {track?.name} · {db.settings.cohortName}
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink to="/dashboard/assignments" variant="primary" size="sm" arrow>Submit work</ButtonLink>
          <ButtonLink to="/dashboard/curriculum" variant="ghost" size="sm">Open curriculum</ButtonLink>
        </div>
      </div>

      {/* ID card + progress */}
      <div className="grid gap-4 md:grid-cols-[1.35fr_1fr]">
        <div className="ink-panel relative overflow-hidden rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/65">KR8 Academy · Student identity</p>
              <p className="mt-2 font-display text-xl font-semibold text-white">{student.name}</p>
              <p className="mt-0.5 font-mono text-[11px] text-white/60">{student.id}</p>
            </div>
            <div className="h-[74px] w-[74px] shrink-0 overflow-hidden rounded-lg bg-white p-1">
              <QrBadge value={profileUrl} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/12 pt-3 text-[10px]">
            <div><p className="text-white/60">Track</p><p className="mt-0.5 font-medium text-white">{track?.code}</p></div>
            <div><p className="text-white/60">Cohort</p><p className="mt-0.5 font-medium text-white">{db.settings.cohortName.split("·")[1]?.trim()}</p></div>
            <div><p className="text-white/60">Status</p><p className="mt-0.5 font-medium capitalize text-white">{student.status}</p></div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await copyToClipboard(student.id);
                toast.success("KR8 ID copied");
              }}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-white/80 transition hover:bg-white/20"
            >
              <Copy size={10} /> Copy ID
            </button>
            <Link to={`/verify/${encodeURIComponent(student.id)}`} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-white/80 transition hover:bg-white/20">
              <ExternalLink size={10} /> Public record
            </Link>
          </div>
        </div>

        <div className="card flex items-center gap-4 p-5">
          <Ring value={progress.overall} size={86} label="complete" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Cohort progress</p>
            <div className="mt-2 space-y-2">
              <Progress value={progress.weekPct} label="Weeks" />
              <Progress value={progress.submissionPct} label="Assignments" tone="magenta" />
              <Progress value={progress.attendancePct} label="Attendance" tone="gold" />
            </div>
          </div>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "XP earned", value: xp.toLocaleString(), note: level.current.name, icon: Sparkles },
          { label: "Rank", value: rank > 0 ? `#${rank}` : "—", note: `of ${leaderboard.length}`, icon: Trophy },
          { label: "Accepted", value: String(progress.accepted), note: `${progress.pending} in review`, icon: CheckCircle2 },
          { label: "Sessions", value: String(progress.attendance), note: "attended", icon: Flame },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="card p-4">
              <Icon size={15} className="text-magenta-bright" />
              <p className="mt-2 font-display text-xl font-semibold leading-none tabular-nums">{item.value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted">{item.label}</p>
              <p className="mt-0.5 text-[10px] text-muted/80">{item.note}</p>
            </div>
          );
        })}
      </div>

      {/* Next session + announcements */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Next live session</p>
            <Pill tone={sessionOpen ? "live" : "default"}>{sessionOpen ? "Check-in open" : "Scheduled"}</Pill>
          </div>
          <p className="mt-3 font-display text-lg font-semibold leading-tight">
            Week {nextWeek}: {track?.curriculum[nextWeek - 1]?.title ?? "Live drill"}
          </p>
          <p className="mt-1.5 text-[12px] text-muted">
            {formatDate(nextSessionDate, { weekday: "long", day: "numeric", month: "long" })} · 7:00pm WAT
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {sessionOpen ? (
              <ButtonLink to="/dashboard/attendance" variant="accent" size="sm">Check in now</ButtonLink>
            ) : (
              <ButtonLink to="/dashboard/attendance" variant="ghost" size="sm">View schedule</ButtonLink>
            )}
            <ButtonLink href={db.settings.whatsappUrl} variant="ghost" size="sm">Session link</ButtonLink>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Announcements</p>
            <Bell size={13} className="text-muted-2/70" />
          </div>
          <div className="mt-3 space-y-3">
            {announcements.length === 0 && <p className="text-[12px] text-muted">Nothing new right now.</p>}
            {announcements.map((item) => (
              <div key={item.id} className="border-l-2 border-magenta/40 pl-2.5">
                <p className="text-[12px] font-semibold leading-snug">{item.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted">{item.body}</p>
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-muted/70">{timeAgo(item.createdAt)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Curriculum                                                          */
/* ------------------------------------------------------------------ */

function Curriculum({ student }: { student: Student }) {
  const db = useDb();
  const track = trackByKey(student.trackKey);
  const submissions = getSubmissions(student.id);
  const toast = useToast();
  if (!track) return null;

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Curriculum</p>
        <h1 className="display display-md mt-2">{track.name}, week by week.</h1>
        <p className="mt-1.5 text-[13px] text-muted">
          Tick a week when you have attended the live session and submitted the deliverable. Your mentor verifies
          the submissions.
        </p>
      </div>

      <div className="space-y-3">
        {track.curriculum.map((week, index) => {
          const weekNumber = index + 1;
          const done = student.weeksDone.includes(weekNumber);
          const submission = submissions.find((s) => s.week === weekNumber);
          const isCurrent = weekNumber === Math.min(track.curriculum.length, student.weeksDone.length + 1);
          return (
            <div
              key={week.week}
              className={cn(
                "card overflow-hidden transition",
                isCurrent && "ring-1 ring-magenta/30",
                done && "bg-emerald-50/40"
              )}
            >
              <div className="flex flex-wrap items-start gap-3 p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => {
                    toggleWeek(student.id, weekNumber, !done);
                    toast.success(done ? `Week ${weekNumber} reopened` : `Week ${weekNumber} complete`, done ? undefined : "+120 XP added to your total.");
                  }}
                  className={cn(
                    "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border transition",
                    done ? "border-live bg-live text-white" : "border-white/20 bg-raised text-muted-2/70 hover:border-magenta-bright hover:text-magenta-bright"
                  )}
                  aria-label={done ? `Mark week ${weekNumber} incomplete` : `Mark week ${weekNumber} complete`}
                >
                  <Check size={16} strokeWidth={3} />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{week.week}</p>
                    {isCurrent && <Pill tone="magenta">This week</Pill>}
                    {submission && (
                      <Pill tone={submission.status === "accepted" ? "live" : "default"}>
                        {submission.status === "accepted" ? "Accepted" : submission.status === "revise" ? "Revise" : "In review"}
                      </Pill>
                    )}
                  </div>
                  <h3 className="mt-1 font-display text-[16px] font-semibold leading-snug">{week.title}</h3>
                  <ul className="mt-2 space-y-1.5">
                    {week.points.map((point) => (
                      <li key={point} className="flex gap-2 text-[12.5px] leading-relaxed text-body">
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-magenta/60" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="ml-auto shrink-0">
                  {submission ? (
                    <Link to="/dashboard/assignments" className="btn btn-ghost btn-sm">View submission</Link>
                  ) : (
                    <Link to={`/dashboard/assignments?week=${weekNumber}`} className="btn btn-primary btn-sm">
                      Submit <ChevronRight size={13} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Card className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Graduation criteria</p>
        <p className="mt-2 text-[12.5px] leading-relaxed text-body">{track.criteria}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Progress value={progressFor(student).weekPct} label="Weeks" />
          <Progress value={progressFor(student).submissionPct} label="Assignments" tone="magenta" />
          <Progress value={progressFor(student).attendancePct} label="Attendance" tone="gold" />
        </div>
        <p className="mt-3 text-[11px] text-muted">Sessions run {db.settings.cohortName} · Tue & Thu, 7:00pm WAT.</p>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Assignments                                                         */
/* ------------------------------------------------------------------ */

function Assignments({ student }: { student: Student }) {
  const track = trackByKey(student.trackKey);
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const submissions = getSubmissions(student.id);
  const [week, setWeek] = useState(() => {
    const requested = Number(params.get("week"));
    if (requested) return requested;
    const done = student.weeksDone.length;
    return Math.min(track?.curriculum.length ?? 8, done + 1);
  });
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Submission | null>(null);
  const toast = useToast();

  const existing = submissions.find((s) => s.week === week);

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Assignments</p>
        <h1 className="display display-md mt-2">Submit the work. Get the critique.</h1>
        <p className="mt-1.5 text-[13px] text-muted">
          One submission per week. Accepted deliverables feed your certificate eligibility and +80 XP.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <Card className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">New submission</p>
          <div className="mt-3 space-y-3.5">
            <Field label="Week" htmlFor="week">
              <Select
                id="week"
                value={week}
                onChange={(event) => {
                  setWeek(Number(event.target.value));
                  setTitle("");
                  setUrl("");
                  setNote("");
                }}
              >
                {(track?.curriculum ?? []).map((item, index) => (
                  <option key={item.week} value={index + 1}>
                    Week {index + 1} — {item.title}
                  </option>
                ))}
              </Select>
            </Field>

            {existing ? (
              <div className="rounded-xl border border-white/10 bg-raised p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Already submitted</p>
                <p className="mt-1 text-[12.5px] font-medium">{existing.title}</p>
                <a href={existing.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 break-all text-[11px] text-magenta-bright">
                  <Link2 size={11} /> {existing.url}
                </a>
                <p className="mt-2 text-[11px] text-muted">
                  Status: <span className="font-semibold capitalize text-white">{existing.status}</span>
                  {existing.score !== undefined && ` · ${existing.score}/100`}
                </p>
                {existing.feedback && (
                  <p className="mt-2 rounded-lg bg-raised p-2.5 text-[11px] leading-relaxed text-body">“{existing.feedback}”</p>
                )}
                {existing.status !== "accepted" && (
                  <button type="button" className="btn btn-ghost btn-sm mt-3" onClick={() => {
                    setEditing(existing);
                    setUrl(existing.url);
                    setNote(existing.note ?? "");
                  }}>
                    <Pencil size={12} /> Update submission
                  </button>
                )}
              </div>
            ) : (
              <>
                <Field label="Deliverable title" htmlFor="sub-title">
                  <Input id="sub-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={track?.curriculum[week - 1]?.title} />
                </Field>
                <Field label="Link to your work" htmlFor="sub-url" hint="Drive, Figma, Behance, deployed URL — anything we can open.">
                  <Input id="sub-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" type="url" />
                </Field>
                <Field label="Notes for your mentor" htmlFor="sub-note" optional>
                  <Textarea id="sub-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What you struggled with, what you want critiqued." className="min-h-[88px]" />
                </Field>
                <button
                  type="button"
                  className="btn btn-primary w-full"
                  disabled={busy}
                  onClick={() => {
                    if (!url.trim() || !/^https?:\/\//i.test(url.trim())) {
                      toast.error("Add a working link", "The submission needs a URL your mentor can open.");
                      return;
                    }
                    setBusy(true);
                    const result = submitAssignment({
                      studentId: student.id,
                      week,
                      title: title.trim() || track?.curriculum[week - 1]?.title || `Week ${week}`,
                      url: url.trim(),
                      note: note.trim(),
                    });
                    setBusy(false);
                    if (!result.ok) {
                      toast.error("Could not submit", result.error);
                      return;
                    }
                    toast.success("Submission received", "Your mentor will review it before the next session.");
                    setTitle("");
                    setUrl("");
                    setNote("");
                  }}
                >
                  <Upload size={15} /> Submit week {week}
                </button>
              </>
            )}
          </div>
        </Card>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Your submissions</p>
            <span className="text-[11px] text-muted">{submissions.length} total</span>
          </div>
          {submissions.length === 0 ? (
            <div className="mt-3">
              <EmptyState icon={<Send size={18} />} title="No submissions yet" body="Your first deliverable unlocks the review loop — and +80 XP when accepted." />
            </div>
          ) : (
            <div className="mt-3 space-y-2.5">
              {[...submissions].sort((a, b) => b.week - a.week).map((submission) => (
                <div key={submission.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/6 font-mono text-[11px] font-semibold">
                      W{submission.week}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{submission.title}</p>
                      <p className="mt-0.5 text-[10.5px] text-muted">
                        Submitted {timeAgo(submission.submittedAt)} ·{" "}
                        <a href={submission.url} target="_blank" rel="noreferrer" className="text-magenta-bright hover:underline">open deliverable</a>
                      </p>
                      {submission.feedback && (
                        <p className="mt-2 rounded-lg bg-base p-2.5 text-[11.5px] leading-relaxed text-body">
                          <Quote size={11} className="mr-1 inline text-magenta-bright" />
                          {submission.feedback}
                        </p>
                      )}
                    </div>
                    <Pill tone={submission.status === "accepted" ? "live" : submission.status === "revise" ? "default" : "magenta"}>
                      {submission.status === "accepted" ? "Accepted" : submission.status === "revise" ? "Revise" : "In review"}
                    </Pill>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Update your submission"
        description="You can revise until your mentor accepts it."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!editing) return;
                if (!/^https?:\/\//i.test(url.trim())) {
                  toast.error("Add a working link");
                  return;
                }
                updateSubmission(editing.id, { url: url.trim(), note: note.trim() });
                toast.success("Submission updated");
                setEditing(null);
              }}
            >
              Save changes
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Link" htmlFor="edit-url">
            <Input id="edit-url" value={url} onChange={(e) => setUrl(e.target.value)} />
          </Field>
          <Field label="Notes" htmlFor="edit-note" optional>
            <Textarea id="edit-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Attendance                                                          */
/* ------------------------------------------------------------------ */

function Attendance({ student }: { student: Student }) {
  const db = useDb();
  const track = trackByKey(student.trackKey);
  const attendance = getAttendance(student.id);
  const toast = useToast();
  const total = track?.curriculum.length ?? 8;
  const attendedPct = Math.round((attendance.length / total) * 100);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Attendance</p>
          <h1 className="display display-md mt-2">Show up. That is the whole trick.</h1>
          <p className="mt-1.5 text-[13px] text-muted">
            Check-in opens when your mentor starts the room. Each session is +60 XP and counts toward graduation.
          </p>
        </div>
        <Ring value={attendedPct} size={72} label="attended" />
      </div>

      <div className="space-y-2.5">
        {Array.from({ length: total }, (_, index) => index + 1).map((week) => {
          const checked = attendance.some((a) => a.week === week);
          const status = getSessionStatus(student.trackKey, week);
          const date = addDays(db.settings.cohortStart, (week - 1) * 7);
          return (
            <div key={week} className="card flex flex-wrap items-center gap-3 p-4">
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full border font-mono text-[11px] font-semibold", checked ? "border-live bg-live text-white" : "border-white/15 text-muted-2")}>
                {checked ? <Check size={15} strokeWidth={3} /> : String(week).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">Week {week} · {track?.curriculum[week - 1]?.title}</p>
                <p className="text-[11px] text-muted">
                  {formatDate(date, { weekday: "long", day: "numeric", month: "long" })} · 7:00pm WAT
                </p>
              </div>
              {checked ? (
                <Pill tone="live"><CheckCircle2 size={11} /> Attended</Pill>
              ) : status === "open" ? (
                <button
                  type="button"
                  className="btn btn-accent btn-sm"
                  onClick={() => {
                    const result = checkIn(student.id, student.trackKey, week);
                    if (!result.ok) toast.error("Check-in failed", result.error);
                    else toast.success("Checked in", "Attendance recorded — +60 XP.");
                  }}
                >
                  Check in
                </button>
              ) : status === "closed" ? (
                <Pill>Closed</Pill>
              ) : (
                <span className="text-[11px] text-muted">Not yet open</span>
              )}
            </div>
          );
        })}
      </div>

      <Card className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Attendance history</p>
        {attendance.length === 0 ? (
          <p className="mt-2 text-[12px] text-muted">No sessions logged yet. Your first check-in will appear here.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {[...attendance].sort((a, b) => b.at - a.at).map((record) => (
              <div key={record.id} className="flex items-center justify-between border-b border-white/8 pb-2 text-[12px] last:border-0">
                <span className="text-body">Week {record.week} · {trackName(record.trackKey)}</span>
                <span className="text-muted">{formatDateTime(record.at)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Certificate                                                         */
/* ------------------------------------------------------------------ */

function Certificates({ student }: { student: Student }) {
  const track = trackByKey(student.trackKey);
  const progress = progressFor(student);
  const certificates = getCertificates(student.id);
  const [tier, setTier] = useState<"Completion" | "Professionalism">("Professionalism");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toast = useToast();
  const requested = useMemo(
    () => getCertificates(student.id).length > 0,
    [student.id, certificates.length]
  );

  if (!track) return null;

  const eligible = progress.eligible;

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Certification</p>
        <h1 className="display display-md mt-2">Proof you can hand to a client.</h1>
        <p className="mt-1.5 text-[13px] text-muted">
          Certificates are issued by the academy against published criteria, then become publicly verifiable.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Eligibility</p>
            <Pill tone={eligible ? "live" : "default"}>{eligible ? "Criteria met" : "In progress"}</Pill>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex items-center justify-between text-[11px]"><span className="text-muted">Weeks completed</span><span className="font-semibold">{progress.weeksDone}/{progress.weeks}</span></div>
              <Progress className="mt-1" value={progress.weekPct} />
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px]"><span className="text-muted">Assignments accepted</span><span className="font-semibold">{progress.accepted}/{Math.max(6, progress.weeks - 1)}</span></div>
              <Progress className="mt-1" value={progress.submissionPct} tone="magenta" />
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px]"><span className="text-muted">Live sessions attended</span><span className="font-semibold">{progress.attendance}/{progress.weeks}</span></div>
              <Progress className="mt-1" value={progress.attendancePct} tone="gold" />
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-base p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Criteria</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">{track.criteria}</p>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Request your certificate</p>
          {certificates.length > 0 ? (
            <div className="mt-3">
              <p className="text-[13px] font-semibold">Certificate issued</p>
              <p className="mt-1 text-[12px] text-muted">
                {certificates[0].tier} · {formatDate(certificates[0].issuedAt)}
              </p>
              <Link to={`/certificate/${encodeURIComponent(certificates[0].code)}`} className="btn btn-primary btn-sm mt-3">
                View & download
              </Link>
            </div>
          ) : requested ? (
            <p className="mt-3 rounded-lg bg-warn/12 p-3 text-[12px] text-warn">
              Your request is with the academy team. You will be notified once it is issued.
            </p>
          ) : (
            <>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                {eligible
                  ? "You have met the criteria. Choose a tier and send your request to the academy."
                  : "Keep submitting and attending — the request button unlocks when you meet the criteria."}
              </p>
              <div className="mt-3">
                <Field label="Tier" htmlFor="tier">
                  <Select id="tier" value={tier} onChange={(e) => setTier(e.target.value as "Completion" | "Professionalism")} disabled={!eligible}>
                    <option value="Professionalism">Certificate of Professionalism</option>
                    <option value="Completion">Certificate of Completion</option>
                  </Select>
                </Field>
              </div>
              <button type="button" className="btn btn-primary mt-3 w-full" disabled={!eligible} onClick={() => setConfirmOpen(true)}>
                <Award size={15} /> Request certificate
              </button>
              {!eligible && <p className="mt-2 text-[10.5px] text-muted">Locked until criteria are met.</p>}
            </>
          )}
        </Card>
      </div>

      {certificates.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Your credential</p>
          <div className="mt-3">
            <CertificatePreview
              input={{
                studentName: student.name,
                trackKey: student.trackKey,
                tier: certificates[0].tier,
                code: certificates[0].code,
                kr8Id: student.id,
                issuedAt: certificates[0].issuedAt,
                verifyUrl: `${window.location.origin}/certificate/${encodeURIComponent(certificates[0].code)}`,
              }}
              filename={`KR8-${student.name.replace(/\s+/g, "-")}-${certificates[0].tier}`}
            />
          </div>
        </div>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Send certificate request?"
        description="The academy reviews eligibility before issuing. You will keep access to your work while it is reviewed."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>Not yet</button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const result = requestCertificate(student.id, tier);
                setConfirmOpen(false);
                if (!result.ok) toast.error("Request failed", result.error);
                else toast.success("Request sent", "The academy will issue your certificate shortly.");
              }}
            >
              Send request
            </button>
          </>
        }
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

function Profile({ student }: { student: Student }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(student.name);
  const [phone, setPhone] = useState(student.phone);
  const [city, setCity] = useState(student.city ?? "");
  const [bio, setBio] = useState(student.bio ?? "");
  const [avatar, setAvatar] = useState(student.avatar ?? "");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("That is not an image");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image too large", "Choose a file under 4MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const min = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
        setAvatar(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Profile</p>
        <h1 className="display display-md mt-2">Your record.</h1>
        <p className="mt-1.5 text-[13px] text-muted">
          This is what appears on your public student record and your certificate name.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <Card className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Identity</p>
          <div className="mt-4 flex items-center gap-3">
            <Avatar name={name} src={avatar} size={64} ring />
            <div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
                <Upload size={13} /> Change photo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <p className="mt-1.5 text-[10px] text-muted">Square images look best. Under 4MB.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <Field label="Full name" htmlFor="p-name">
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Phone" htmlFor="p-phone">
                <Input id="p-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field label="City" htmlFor="p-city" optional>
                <Input id="p-city" value={city} onChange={(e) => setCity(e.target.value)} />
              </Field>
            </div>
            <Field label="Short bio" htmlFor="p-bio" optional hint="Shown on your public record.">
              <Textarea id="p-bio" value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[80px]" maxLength={240} />
            </Field>
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => {
                const result = updateProfile(student.id, { name, phone, city, bio, avatar });
                if (!result.ok) toast.error("Could not save", result.error);
                else toast.success("Profile updated");
              }}
            >
              Save changes
            </button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Security</p>
            <div className="mt-3 space-y-3">
              <Field label="Current password" htmlFor="pw-current">
                <Input id="pw-current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
              </Field>
              <Field label="New password" htmlFor="pw-new" hint="At least 8 characters.">
                <Input id="pw-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
              </Field>
              <Field label="Confirm new password" htmlFor="pw-confirm">
                <Input id="pw-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
              </Field>
              <button
                type="button"
                className="btn btn-ghost w-full"
                disabled={busy}
                onClick={async () => {
                  if (next !== confirm) {
                    toast.error("Passwords do not match");
                    return;
                  }
                  setBusy(true);
                  const result = await changePassword(student.id, current, next);
                  setBusy(false);
                  if (!result.ok) toast.error("Could not change password", result.error);
                  else {
                    toast.success("Password updated");
                    setCurrent("");
                    setNext("");
                    setConfirm("");
                  }
                }}
              >
                {busy ? <Loader2 size={14} className="spin" /> : <LockKeyhole size={14} />} Update password
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Account</p>
            <div className="mt-3 space-y-2 text-[12px]">
              <p className="flex justify-between gap-3"><span className="text-muted">KR8 ID</span><span className="font-mono text-[11px]">{student.id}</span></p>
              <p className="flex justify-between gap-3"><span className="text-muted">Email</span><span className="truncate">{student.email}</span></p>
              <p className="flex justify-between gap-3"><span className="text-muted">Track</span><span>{trackName(student.trackKey)}</span></p>
              <p className="flex justify-between gap-3"><span className="text-muted">Joined</span><span>{formatDate(student.createdAt)}</span></p>
              <p className="flex justify-between gap-3"><span className="text-muted">Referral code</span><span className="font-mono text-[11px]">{student.referralCode}</span></p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm mt-3 w-full"
              onClick={async () => {
                await copyToClipboard(`${window.location.origin}/apply?ref=${student.referralCode}`);
                toast.success("Referral link copied", "Share it — you earn XP when they graduate.");
              }}
            >
              <Copy size={12} /> Copy referral link
            </button>
          </Card>

          <Card className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Notifications</p>
            <label className="mt-3 flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={student.prefs.emailUpdates}
                onChange={(event) => updateProfile(student.id, { prefs: { ...student.prefs, emailUpdates: event.target.checked } })}
                className="mt-0.5 h-4 w-4 accent-[#3d1250]"
              />
              <span className="text-[12px] text-body">Email me session reminders and review results</span>
            </label>
            <label className="mt-2.5 flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={student.prefs.whatsappUpdates}
                onChange={(event) => updateProfile(student.id, { prefs: { ...student.prefs, whatsappUpdates: event.target.checked } })}
                className="mt-0.5 h-4 w-4 accent-[#3d1250]"
              />
              <span className="text-[12px] text-body">WhatsApp me cohort announcements</span>
            </label>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <ButtonLink to="/leaderboard" variant="ghost" size="sm"><Trophy size={13} /> Leaderboard</ButtonLink>
        <ButtonLink to="/verify" variant="ghost" size="sm"><GraduationCap size={13} /> Verification centre</ButtonLink>
        <ButtonLink to="/tracks" variant="ghost" size="sm"><BookOpen size={13} /> Explore other tracks</ButtonLink>
        {TRACKS.length > 0 && null}
      </div>
    </div>
  );
}
