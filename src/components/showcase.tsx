import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Camera,
  Code2,
  LayoutTemplate,
  Megaphone,
  Palette,
  Play,
  Quote,
  Search,
  TrendingUp,
  Video,
  X,
} from "lucide-react";
import type { Track } from "../data/academy";
import { MENTORS, TESTIMONIALS, trackName, type Mentor, type Testimonial } from "../data/academy";
import { findCertificate, findStudentByIdentifier, getCertificates, getStudent } from "../lib/store";
import { useDb, useLockBodyScroll } from "../lib/hooks";
import { cn, formatDate } from "../lib/utils";
import { Avatar, Pill } from "./ui";

const ICONS = {
  palette: Palette,
  video: Video,
  code: Code2,
  layout: LayoutTemplate,
  camera: Camera,
  megaphone: Megaphone,
  trending: TrendingUp,
} as const;

export function TrackIcon({ track, size = 18 }: { track: Track; size?: number }) {
  const Icon = ICONS[track.icon];
  return <Icon size={size} strokeWidth={1.8} />;
}

export function TrackCard({ track, index }: { track: Track; index: number }) {
  const mentor = MENTORS.find((m) => m.key === track.mentorKey);
  return (
    <Link
      to={`/tracks/${track.slug}`}
      className="group card card-lift relative flex flex-col overflow-hidden p-5 sm:p-6"
    >
      <span
        className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: track.accent }}
      />
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid h-11 w-11 place-items-center rounded-xl text-white shadow-sm"
          style={{ background: track.accent }}
        >
          <TrackIcon track={track} size={19} />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          {String(index + 1).padStart(2, "0")} / {track.code}
        </span>
      </div>

      <h3 className="display mt-5 text-xl leading-tight">{track.name}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">{track.tagline}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Pill>{track.duration}</Pill>
        <Pill>{track.level}</Pill>
        <Pill tone={track.registrationOpen ? "live" : "default"}>
          {track.registrationOpen ? "Open" : "Waitlist"}
        </Pill>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink/8 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          {mentor && <Avatar name={mentor.name} src={mentor.photo} size={26} />}
          <span className="truncate text-[11px] text-muted">{mentor?.shortName ?? "KR8 Practitioner"}</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink">
          Curriculum
          <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function MentorCard({ mentor, compact }: { mentor: Mentor; compact?: boolean }) {
  return (
    <article className="group">
      <div className="photo-frame relative aspect-[4/5] w-full">
        <img src={mentor.photo} alt={mentor.name} loading="lazy" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent p-4">
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-semibold text-paper">{mentor.shortName}</p>
            <p className="truncate text-[10px] uppercase tracking-[0.1em] text-paper/65">{mentor.role}</p>
          </div>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper/15 text-paper backdrop-blur">
            <ArrowRight size={13} />
          </span>
        </div>
      </div>
      {!compact && (
        <>
          <h3 className="mt-3 font-display text-base font-semibold">{mentor.name}</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">{mentor.title}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {mentor.trackKeys.map((key) => (
              <span key={key} className="rounded-full bg-ink/[0.05] px-2 py-0.5 text-[10px] font-medium text-ink/60">
                {trackName(key)}
              </span>
            ))}
          </div>
        </>
      )}
    </article>
  );
}

export function TestimonialWall({ limit, items }: { limit?: number; items?: Testimonial[] }) {
  const [video, setVideo] = useState<Testimonial | null>(null);
  const [showAll, setShowAll] = useState(false);
  useLockBodyScroll(!!video);

  const source = items ?? TESTIMONIALS;
  const list = useMemo(() => {
    if (limit && !showAll) return source.slice(0, limit);
    return source;
  }, [limit, showAll, source]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((testimonial) => (
          <figure
            key={testimonial.id}
            className="group card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-40px_rgba(20,15,26,0.5)]"
          >
            <div className="flex gap-4 p-4">
              <button
                type="button"
                onClick={() => setVideo(testimonial)}
                className="relative h-[92px] w-[64px] shrink-0 overflow-hidden rounded-lg bg-sand"
                aria-label={`Open ${testimonial.name}'s story`}
              >
                <img src={testimonial.img} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                {testimonial.video && (
                  <span className="absolute inset-0 grid place-items-center bg-ink/25 opacity-0 transition group-hover:opacity-100">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-paper text-ink">
                      <Play size={11} fill="currentColor" />
                    </span>
                  </span>
                )}
              </button>
              <div className="min-w-0">
                <Quote size={14} className="text-magenta" />
                <blockquote className="mt-1.5 line-clamp-4 text-[12.5px] leading-relaxed text-ink/80">
                  {testimonial.caption}
                </blockquote>
                <figcaption className="mt-2.5">
                  <p className="truncate text-[12px] font-semibold">{testimonial.name}</p>
                  <p className="truncate text-[10px] uppercase tracking-[0.08em] text-muted">{testimonial.skill}</p>
                </figcaption>
              </div>
            </div>
            {testimonial.video && (
              <button
                type="button"
                onClick={() => setVideo(testimonial)}
                className="flex w-full items-center gap-1.5 border-t border-ink/8 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-magenta"
              >
                <Play size={10} fill="currentColor" /> Watch the story
              </button>
            )}
          </figure>
        ))}
      </div>

      {limit && source.length > limit && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Show fewer stories" : `Read all ${source.length} graduate stories`}
          </button>
        </div>
      )}

      {video && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setVideo(null)} />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-cream shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-ink/10 p-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold">{video.name}</p>
                <p className="truncate text-[10px] uppercase tracking-[0.1em] text-muted">{video.skill}</p>
              </div>
              <button
                type="button"
                onClick={() => setVideo(null)}
                className="grid h-8 w-8 place-items-center rounded-full border border-ink/12"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
            {video.video ? (
              <video key={video.id} src={video.video} poster={video.img} controls playsInline className="aspect-[9/16] w-full bg-ink object-cover" />
            ) : (
              <div className="p-5">
                <img src={video.img} alt={video.name} className="mx-auto w-32 rounded-lg" />
                <blockquote className="mt-4 text-sm leading-relaxed text-ink/80">“{video.caption}”</blockquote>
              </div>
            )}
            <p className="border-t border-ink/10 px-4 py-2.5 text-[10px] uppercase tracking-[0.1em] text-muted">
              KR8 Academy graduate story
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export function VerifyWidget({ compact = false }: { compact?: boolean }) {
  const db = useDb();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<
    | { kind: "certificate"; studentName: string; track: string; tier: string; code: string; issuedAt: number; revoked?: boolean }
    | { kind: "student"; name: string; id: string; track: string; status: string; certs: number }
    | { kind: "none" }
    | null
  >(null);

  function run(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) {
      setResult({ kind: "none" });
      return;
    }
    const certificate = findCertificate(value);
    if (certificate) {
      const owner = getStudent(certificate.studentId);
      setResult({
        kind: "certificate",
        studentName: certificate.studentNameSnapshot || owner?.name || "Graduate",
        track: trackName(certificate.trackKey),
        tier: certificate.tier,
        code: certificate.code,
        issuedAt: certificate.issuedAt,
        revoked: certificate.revoked,
      });
      return;
    }
    const student = findStudentByIdentifier(value);
    if (student) {
      const certs = getCertificates(student.id).filter((c) => !c.revoked);
      setResult({
        kind: "student",
        name: student.name,
        id: student.id,
        track: trackName(student.trackKey),
        status: student.status,
        certs: certs.length,
      });
      return;
    }
    setResult({ kind: "none" });
  }

  return (
    <div className={cn("card p-5 sm:p-6", compact && "p-4")}>
      <div className="flex items-center gap-2">
        <BadgeCheck size={16} className="text-magenta" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Verify a KR8 credential</p>
      </div>
      <form onSubmit={run} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="verify-input">KR8 ID or certificate code</label>
        <input
          id="verify-input"
          className="input"
          placeholder="KR8-2026-GD-0001 or KR8-CERT-…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary shrink-0">
          <Search size={15} /> Verify
        </button>
      </form>

      {result && (
        <div className="mt-4 rounded-xl border border-ink/10 bg-paper/70 p-4 text-sm">
          {result.kind === "certificate" && (
            <div>
              <p className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em]", result.revoked ? "text-red-600" : "text-emerald-700")}>
                <Award size={13} /> {result.revoked ? "Certificate revoked" : "Verified certificate"}
              </p>
              <p className="mt-2 font-display text-lg font-semibold leading-tight">{result.studentName}</p>
              <p className="mt-0.5 text-[13px] text-muted">{result.tier} · {result.track}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted">
                <span>{result.code}</span>
                <span className="opacity-40">·</span>
                <span>Issued {formatDate(result.issuedAt)}</span>
              </div>
              <Link to={`/certificate/${encodeURIComponent(result.code)}`} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-magenta">
                View the full certificate <ArrowRight size={12} />
              </Link>
            </div>
          )}
          {result.kind === "student" && (
            <div>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-700">
                <BadgeCheck size={13} /> Enrolled student
              </p>
              <p className="mt-2 font-display text-lg font-semibold leading-tight">{result.name}</p>
              <p className="mt-0.5 text-[13px] text-muted">{result.track} · {result.status}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted">
                <span>{result.id}</span>
                <span className="opacity-40">·</span>
                <span>{result.certs} certificate{result.certs === 1 ? "" : "s"}</span>
              </div>
              <Link to={`/verify/${encodeURIComponent(result.id)}`} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-magenta">
                Open the public profile <ArrowRight size={12} />
              </Link>
            </div>
          )}
          {result.kind === "none" && (
            <p className="text-[13px] text-muted">
              No record found for “{query}”. Check the KR8 ID or certificate code, or{" "}
              <a className="font-semibold text-magenta" href={`mailto:${db.settings.supportEmail}`}>contact the academy</a>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
