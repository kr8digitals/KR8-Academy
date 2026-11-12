import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { TRACKS } from "../data/academy";
import { useAuth } from "../lib/auth";
import { useDb, useLockBodyScroll } from "../lib/hooks";
import { cn } from "../lib/utils";
import { Avatar, ButtonLink, Logo } from "./ui";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { unreadNotificationCount as unreadCount } from "../lib/store";

const PRIMARY_LINKS = [
  { to: "/skills", label: "Skills" },
  { to: "/academics", label: "Academics", pip: true },
  { to: "/admissions", label: "Admissions" },
  { to: "/mentors", label: "Mentors" },
  { to: "/partner", label: "Partners" },
  { to: "/about", label: "About" },
  { to: "/verify", label: "Verify" },
];

export function Nav() {
  const { student, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  useLockBodyScroll(mobileOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserOpen(false);
  }, [location.pathname]);


  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-all duration-300",
          scrolled ? "nav-blur border-white/10" : "border-transparent bg-base"
        )}
      >
        <div className="shell flex h-[68px] items-center justify-between gap-3">
          <Link to="/" aria-label="KR8 Digitals' Academy — home">
            <Logo compact />
          </Link>

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
            {PRIMARY_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition",
                    isActive ? "text-white" : "text-muted hover:text-white"
                  )
                }
              >
                {link.label}
                {link.pip && (
                  <>
                    <span
                      aria-hidden="true"
                      className="ml-1.5 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-cyan align-middle shadow-[0_0_8px_rgba(56,224,255,0.9)]"
                    />
                    <span className="sr-only">(new)</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {student && <NotificationBell />}
            {student ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-white/12 bg-raised py-1 pl-1 pr-2.5 transition hover:border-white/25"
                  aria-expanded={userOpen}
                  aria-haspopup="menu"
                >
                  <Avatar name={student.name} src={student.avatar} size={30} />
                  <span className="hidden max-w-[110px] truncate text-[12px] font-semibold sm:block">
                    {student.name.split(" ")[0]}
                  </span>
                  <ChevronDown size={13} className={cn("text-muted-2 transition", userOpen && "rotate-180")} />
                </button>
                {userOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-raised p-1.5 shadow-[0_30px_80px_-40px_rgba(20,15,26,0.55)]"
                  >
                    <div className="border-b border-white/8 px-2.5 pb-2 pt-1.5">
                      <p className="truncate text-[13px] font-semibold">{student.name}</p>
                      <p className="truncate font-mono text-[10px] text-muted">{student.id}</p>
                    </div>
                    <Link to="/dashboard" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition hover:bg-white/8" role="menuitem">
                      <LayoutDashboard size={15} /> My dashboard
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition hover:bg-white/8" role="menuitem">
                        <ShieldCheck size={15} /> Admin console
                      </Link>
                    )}
                    <Link to="/verify" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition hover:bg-white/8" role="menuitem">
                      <ShieldCheck size={15} /> Verify a certificate
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        setUserOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-danger transition hover:bg-danger/12"
                      role="menuitem"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-body transition hover:text-white xl:block"
              >
                Sign in
              </Link>
            )}

            <ButtonLink to={student ? "/dashboard" : "/apply"} size="sm" variant="primary" arrow className="hidden xl:inline-flex">
              {student ? "Dashboard" : "Apply free"}
            </ButtonLink>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/12 xl:hidden"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
    </>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const { student, isAdmin } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("a[href], button")?.focus();
    }, 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Academy menu"
      className="fixed inset-0 z-[80] flex flex-col bg-base xl:hidden"
    >
      <div className="shell flex h-[68px] shrink-0 items-center justify-between border-b border-white/10">
        <Logo />
        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/12"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>
      <div className="shell flex-1 overflow-y-auto py-6">
        {student && (
          <div className="mb-5 grid gap-2">
            <Link to="/dashboard" onClick={onClose} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-raised p-3">
              <Avatar name={student.name} src={student.avatar} size={40} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{student.name}</span>
                <span className="block truncate font-mono text-[10px] text-muted">{student.id}</span>
              </span>
              <ArrowRight size={16} className="text-muted-2" />
            </Link>
            <Link to="/dashboard/notifications" onClick={onClose} className="flex items-center justify-between rounded-2xl border border-magenta/30 bg-magenta/8 px-4 py-3 text-[12.5px] font-semibold text-magenta-bright">
              Notifications {unreadCount(student.id) > 0 && <span className="rounded-full bg-magenta-fill px-2 py-0.5 text-[10px] font-bold text-white">{unreadCount(student.id)} new</span>}
            </Link>
          </div>
        )}
        <p className="eyebrow mb-3">Skills</p>
        <div className="grid gap-1">
          {TRACKS.map((track) => (
            <Link
              key={track.slug}
              to={`/skills/${track.slug}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition active:bg-white/8"
            >
              <span className="h-7 w-1 rounded-full" style={{ background: track.accent }} />
              <span className="flex-1 text-sm font-medium">{track.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted">{track.duration}</span>
            </Link>
          ))}
        </div>
        <Link
          to="/academics"
          onClick={onClose}
          className="mt-4 flex items-center gap-3 rounded-xl border border-cyan/30 bg-cyan/5 px-3 py-3"
        >
          <GraduationCap size={18} className="shrink-0 text-cyan" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-white">KR8 Academics</span>
            <span className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded border border-magenta/60 bg-magenta/15 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-magenta-bright">
                New
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan">
                Open now · with Next Gen Scholars
              </span>
            </span>
          </span>
          <ArrowRight size={14} className="shrink-0 text-cyan" />
        </Link>
        <div className="my-5 rule" />
        <div className="grid gap-1">
          {[
            ...PRIMARY_LINKS.filter((l) => l.to !== "/skills" && l.to !== "/academics" && l.to !== "/about"),
            { to: "/about", label: "About the academy" },
            { to: "/leaderboard", label: "Leaderboard" },
            { to: "/wall", label: "The Wall" },
          ].map((link) => (
            <Link key={link.to} to={link.to} onClick={onClose} className="flex items-center justify-between border-b border-white/8 py-3 text-[15px] font-medium">
              {link.label}
              <ArrowRight size={15} className="text-muted-2/70" />
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" onClick={onClose} className="flex items-center justify-between border-b border-white/8 py-3 text-[15px] font-medium text-magenta-bright">
              Admin console
              <ShieldCheck size={15} />
            </Link>
          )}
        </div>
      </div>
      <div className="shell safe-bottom shrink-0 border-t border-white/10 py-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-muted">Theme</span>
          <ThemeToggle />
        </div>
        <div className="flex flex-col gap-2">
          <ButtonLink to={student ? "/dashboard" : "/apply"} variant="primary" full onClick={onClose} arrow>
            {student ? "Go to dashboard" : "Apply free"}
          </ButtonLink>
          {!student && (
            <ButtonLink to="/login" variant="ghost" full onClick={onClose}>
              Sign in to your account
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  const db = useDb();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-white/10 bg-raised">
      <div className="shell py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              The tuition-free school of KR8 Digitals. Eight-week cohorts, live practitioners, verified proof —
              digital skills with KR8, exam preparation with Next Gen Scholars, and a wall that celebrates both.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <span className="pill">
                <Sparkles size={12} /> {db.settings.cohortName}
              </span>
              <span className="pill pill-magenta">100% free</span>
            </div>
          </div>

          <FooterColumn title="Learn">
            <FooterLink to="/skills">Skills — all seven</FooterLink>
            <FooterLink to="/academics">KR8 Academics</FooterLink>
            <FooterLink to="/skills/graphic-design">Graphic Design</FooterLink>
            <FooterLink to="/skills/video-editing">Video & Animation</FooterLink>
            <FooterLink to="/skills/frontend-development">Front-End Development</FooterLink>
          </FooterColumn>

          <FooterColumn title="Academy">
            <FooterLink to="/admissions">Admissions</FooterLink>
            <FooterLink to="/mentors">Mentors</FooterLink>
            <FooterLink to="/partner">Partners</FooterLink>
            <FooterLink to="/verify">Verify a graduate</FooterLink>
            <FooterLink to="/about">Our story</FooterLink>
            <FooterLink to="/leaderboard">Leaderboard</FooterLink>
            <FooterLink to="/wall">The Wall</FooterLink>
          </FooterColumn>

          <FooterColumn title="Connect">
            <a className="group flex items-center gap-1.5 text-sm text-body transition hover:text-white" href={db.settings.whatsappUrl} target="_blank" rel="noreferrer">
              WhatsApp community <ArrowUpRight size={13} className="opacity-40 transition group-hover:opacity-100" />
            </a>
            <a className="group flex items-center gap-1.5 text-sm text-body transition hover:text-white" href={`mailto:${db.settings.supportEmail}`}>
              <Mail size={13} className="opacity-50" /> {db.settings.supportEmail}
            </a>
            <a className="group flex items-center gap-1.5 text-sm text-body transition hover:text-white" href="https://www.kr8digitals.com" target="_blank" rel="noreferrer">
              kr8digitals.com <ArrowUpRight size={13} className="opacity-40 transition group-hover:opacity-100" />
            </a>
            <a className="group flex items-center gap-1.5 text-sm text-body transition hover:text-white" href={db.settings.agencyUrl} target="_blank" rel="noreferrer">
              Hire the agency <ArrowUpRight size={13} className="opacity-40 transition group-hover:opacity-100" />
            </a>
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} KR8 Digitals. Built for the ones who show up.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-live" /> All systems operational
            </span>
            <Link className="transition hover:text-white" to="/verify">Certificate verification</Link>
            <Link className="transition hover:text-white" to="/privacy">Privacy</Link>
            <Link className="transition hover:text-white" to="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{title}</p>
      <div className="mt-3 flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link className="text-sm text-body transition hover:text-white" to={to}>
      {children}
    </Link>
  );
}
