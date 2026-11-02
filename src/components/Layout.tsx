import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
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

const PRIMARY_LINKS = [
  { to: "/tracks", label: "Tracks" },
  { to: "/mentors", label: "Mentors" },
  { to: "/admissions", label: "Admissions" },
  { to: "/verify", label: "Verify" },
  { to: "/leaderboard", label: "Leaderboard" },
];

export function Nav() {
  const { student, isAdmin, signOut } = useAuth();
  const db = useDb();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tracksOpen, setTracksOpen] = useState(false);
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
    setTracksOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  const openTracks = db.settings.registrationOpen;

  return (
    <>
      <div className="relative z-50 overflow-hidden border-b border-white/10 bg-[#0a0312] text-white">
        <div className="shell flex h-9 items-center justify-between gap-4 text-[11px]">
          <p className="flex min-w-0 items-center gap-2">
            <span className="ticker-dot shrink-0" />
            <span className="truncate">
              <span className="font-semibold text-[#f6cdef]">{db.settings.cohortName}</span>
              <span className="mx-2 text-white/25">/</span>
              <span className="text-white/70">
                {openTracks ? "Registration open" : "Waitlist open"}
                <span className="hidden xs:inline sm:inline"> — onboarding 30 April 2027</span>
              </span>
            </span>
          </p>
          <div className="hidden shrink-0 items-center gap-4 text-white/55 sm:flex">
            <a className="transition hover:text-white" href="https://www.kr8digitals.com" target="_blank" rel="noreferrer">
              kr8digitals.com
            </a>
            <span className="text-white/25">|</span>
            <a className="transition hover:text-white" href={`mailto:${db.settings.supportEmail}`}>
              {db.settings.supportEmail}
            </a>
          </div>
        </div>
      </div>

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

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            <div
              className="relative"
              onMouseEnter={() => setTracksOpen(true)}
              onMouseLeave={() => setTracksOpen(false)}
            >
              <button
                type="button"
                onClick={() => setTracksOpen((v) => !v)}
                aria-expanded={tracksOpen}
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition",
                  location.pathname.startsWith("/tracks") ? "text-white" : "text-muted hover:text-white"
                )}
              >
                Tracks
                <ChevronDown size={14} className={cn("transition", tracksOpen && "rotate-180")} />
              </button>
              {tracksOpen && (
                <div className="absolute left-1/2 top-full w-[560px] -translate-x-1/2 pt-2">
                  <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-raised p-2 shadow-[0_30px_80px_-40px_rgba(20,15,26,0.5)]">
                    {TRACKS.map((track) => (
                      <Link
                        key={track.slug}
                        to={`/tracks/${track.slug}`}
                        className="group flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-magenta/10"
                      >
                        <span
                          className="mt-0.5 h-8 w-1 rounded-full transition group-hover:h-10"
                          style={{ background: track.accent }}
                        />
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold leading-tight text-white">{track.name}</span>
                          <span className="mt-0.5 block truncate text-[11px] text-muted">{track.duration} · {track.level}</span>
                        </span>
                      </Link>
                    ))}
                    <Link
                      to="/tracks"
                      className="col-span-2 mt-1 flex items-center justify-between rounded-xl bg-magenta-fill px-3 py-2.5 text-[12px] font-semibold text-white transition hover:bg-magenta-fill"
                    >
                      Compare all tracks
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {PRIMARY_LINKS.filter((l) => l.to !== "/tracks").map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3 py-2 text-sm font-medium transition",
                    isActive ? "text-white" : "text-muted hover:text-white"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
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
                className="hidden rounded-full px-3 py-2 text-sm font-medium text-body transition hover:text-white sm:block"
              >
                Sign in
              </Link>
            )}

            <ButtonLink to={student ? "/dashboard" : "/apply"} size="sm" variant="primary" arrow className="hidden sm:inline-flex">
              {student ? "Dashboard" : openTracks ? "Apply free" : "Join waitlist"}
            </ButtonLink>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/12 lg:hidden"
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
  const db = useDb();
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
      className="fixed inset-0 z-[80] flex flex-col bg-base lg:hidden"
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
          <Link to="/dashboard" onClick={onClose} className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-raised p-3">
            <Avatar name={student.name} src={student.avatar} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{student.name}</span>
              <span className="block truncate font-mono text-[10px] text-muted">{student.id}</span>
            </span>
            <ArrowRight size={16} className="text-muted-2" />
          </Link>
        )}
        <p className="eyebrow mb-3">Tracks</p>
        <div className="grid gap-1">
          {TRACKS.map((track) => (
            <Link
              key={track.slug}
              to={`/tracks/${track.slug}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition active:bg-white/8"
            >
              <span className="h-7 w-1 rounded-full" style={{ background: track.accent }} />
              <span className="flex-1 text-sm font-medium">{track.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted">{track.duration}</span>
            </Link>
          ))}
        </div>
        <div className="my-5 rule" />
        <div className="grid gap-1">
          {[...PRIMARY_LINKS.filter((l) => l.to !== "/tracks"), { to: "/about", label: "About the academy" }].map((link) => (
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
        <div className="flex flex-col gap-2">
          <ButtonLink to={student ? "/dashboard" : "/apply"} variant="primary" full onClick={onClose} arrow>
            {student ? "Go to dashboard" : db.settings.registrationOpen ? "Apply free" : "Join the waitlist"}
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
              The tuition-free school of KR8 Digitals. Eight-week cohorts, live practitioners, verifiable proof —
              built so that talent, not money, decides who gets trained.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <span className="pill">
                <Sparkles size={12} /> {db.settings.cohortName}
              </span>
              <span className="pill pill-magenta">100% free</span>
            </div>
          </div>

          <FooterColumn title="Learn">
            <FooterLink to="/tracks">All tracks</FooterLink>
            <FooterLink to="/tracks/graphic-design">Graphic Design</FooterLink>
            <FooterLink to="/tracks/video-editing">Video & Animation</FooterLink>
            <FooterLink to="/tracks/frontend-development">Front-End Development</FooterLink>
          </FooterColumn>

          <FooterColumn title="Academy">
            <FooterLink to="/about">Our story</FooterLink>
            <FooterLink to="/mentors">Mentors</FooterLink>
            <FooterLink to="/admissions">Admissions</FooterLink>
            <FooterLink to="/leaderboard">Leaderboard</FooterLink>
            <FooterLink to="/verify">Verify a graduate</FooterLink>
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
              <span className="h-1.5 w-1.5 rounded-full bg-live" /> All systems local-first
            </span>
            <Link className="transition hover:text-white" to="/verify">Certificate verification</Link>
            <span className="opacity-60">Privacy · Terms</span>
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
