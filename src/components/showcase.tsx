import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  Code2,
  LayoutTemplate,
  Megaphone,
  Palette,
  Play,
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

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/8 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          {mentor && <Avatar name={mentor.name} src={mentor.photo} size={26} />}
          <span className="truncate text-[11px] text-muted">{mentor?.shortName ?? "KR8 Practitioner"}</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white">
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
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4">
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-semibold text-white">{mentor.shortName}</p>
            <p className="truncate text-[10px] uppercase tracking-[0.1em] text-white/65">{mentor.role}</p>
          </div>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur">
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
              <span key={key} className="rounded-full bg-magenta/10 px-2 py-0.5 text-[10px] font-medium text-muted">
                {trackName(key)}
              </span>
            ))}
          </div>
        </>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Graduate stories — every filmed testimonial, playable               */
/* ------------------------------------------------------------------ */

function clock(seconds: number) {
  if (!seconds || Number.isNaN(seconds)) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function StoryPlayer({
  story,
  index,
  total,
  queue,
  onClose,
  onStep,
  onSelect,
}: {
  story: Testimonial;
  index: number;
  total: number;
  queue: Testimonial[];
  onClose: () => void;
  onStep: (direction: 1 | -1) => void;
  onSelect: (story: Testimonial) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useLockBodyScroll(true);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onStep(1);
      if (event.key === "ArrowLeft") onStep(-1);
    };
    document.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => closeRef.current?.focus(), 40);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [onClose, onStep]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    const attempt = node.play();
    if (attempt) attempt.catch(() => undefined);
  }, [story.id]);

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${story.name} — graduate story`}
    >
      <div className="absolute inset-0 bg-black/88 backdrop-blur-md" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 flex w-full max-w-[min(96vw,1000px)] flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-magenta-bright">
            <span className="h-1.5 w-1.5 rounded-full bg-live" /> Graduate story
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => onStep(-1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white transition hover:border-magenta-bright hover:bg-white/10"
              aria-label="Previous story"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => onStep(1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white transition hover:border-magenta-bright hover:bg-white/10"
              aria-label="Next story"
            >
              <ChevronRight size={16} />
            </button>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#1a0326] transition hover:bg-magenta-fill hover:text-white"
              aria-label="Close video"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="grid gap-3 overflow-hidden rounded-2xl border border-white/12 bg-[#0a0411]/95 md:grid-cols-[minmax(0,320px)_1fr]">
          <div className="relative bg-black">
            <video
              ref={videoRef}
              key={story.id}
              src={story.video}
              poster={story.img}
              controls
              controlsList="nodownload"
              playsInline
              preload="metadata"
              className="mx-auto block max-h-[46vh] w-full bg-black object-contain md:max-h-[68vh]"
            >
              <track
                kind="captions"
                src={story.video.replace(/\.mp4$/, ".vtt")}
                srcLang="en"
                label="English"
              />
            </video>
          </div>

          <div className="flex flex-col gap-4 p-5 md:p-6">
            <div>
              <h3 className="text-[19px] font-semibold leading-tight text-white md:text-[22px]">{story.name}</h3>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-magenta-bright">
                {story.skill}
              </p>
              <p className="mt-0.5 text-[12px] text-muted">{story.role}</p>
              <blockquote className="mt-4 border-l-2 border-magenta/60 pl-3 text-[13.5px] leading-relaxed text-body">
                “{story.caption}”
              </blockquote>
            </div>

            {queue.length > 0 && (
              <div className="mt-auto hidden md:block">
                <p className="mb-2 text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-2">More graduate stories</p>
                <div className="grid grid-cols-3 gap-2">
                  {queue.map((next) => (
                    <button
                      key={next.id}
                      type="button"
                      onClick={() => onSelect(next)}
                      className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 text-left transition hover:border-magenta-bright/70"
                    >
                      <img
                        src={next.img}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover object-[center_25%] transition duration-500 group-hover:scale-105"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" aria-hidden="true" />
                      <span className="absolute inset-x-0 bottom-0 block truncate p-1.5 text-[9.5px] font-semibold text-white">
                        {next.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className="pill pill-live">
                <Video size={10} /> {clock(story.duration)}
              </span>
              <span className="pill">Captions on</span>
              <span className="ml-auto hidden text-[10.5px] font-medium text-muted-2 sm:inline">
                Story {index + 1} of {total}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TestimonialWall({ limit, items }: { limit?: number; items?: Testimonial[] }) {
  const source = items ?? TESTIMONIALS;
  const [showAll, setShowAll] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);

  const list = useMemo(() => (limit && !showAll ? source.slice(0, limit) : source), [limit, showAll, source]);
  const active = playing === null ? null : source[playing];
  const close = useCallback(() => setPlaying(null), []);
  const step = useCallback(
    (direction: 1 | -1) => setPlaying((current) => (current === null ? null : (current + direction + source.length) % source.length)),
    [source.length]
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((story) => (
          <figure key={story.id} className="card card-lift group overflow-hidden">
            <button
              type="button"
              onClick={() => setPlaying(source.indexOf(story))}
              className="relative block w-full overflow-hidden"
              aria-label={`Play ${story.name}'s filmed testimonial`}
            >
              <span className="relative block aspect-[16/10] w-full">
                <img
                  src={story.img}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover object-[center_28%] transition duration-[900ms] group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/25 to-transparent" aria-hidden="true" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur">
                  <Video size={9} /> {clock(story.duration)}
                </span>
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white/95 text-[#1a0326] shadow-xl transition duration-300 group-hover:scale-110 group-hover:bg-magenta-fill group-hover:text-white">
                    <Play size={15} fill="currentColor" />
                  </span>
                </span>
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-white">{story.name}</span>
                    <span className="block truncate text-[10px] text-white/75">{story.role}</span>
                  </span>
                  <span className="shrink-0 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur">
                    {story.skill}
                  </span>
                </span>
              </span>
            </button>
            <figcaption className="p-3.5">
              <blockquote className="line-clamp-3 text-[12.5px] leading-relaxed text-body">“{story.caption}”</blockquote>
            </figcaption>
          </figure>
        ))}
      </div>

      {limit && source.length > limit && (
        <div className="mt-6 flex justify-center">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show fewer stories" : `Watch all ${source.length} graduate stories`}
          </button>
        </div>
      )}

      {active && <StoryPlayer
          story={active}
          index={playing ?? 0}
          total={source.length}
          queue={[1, 2, 3].map((offset) => source[((playing ?? 0) + offset) % source.length]).filter((next) => next && next.id !== active.id).slice(0, 3)}
          onClose={close}
          onStep={step}
          onSelect={(next) => setPlaying(source.indexOf(next))}
        />}
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
        <BadgeCheck size={16} className="text-magenta-bright" />
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
        <div className="mt-4 rounded-xl border border-white/10 bg-white/70 p-4 text-sm">
          {result.kind === "certificate" && (
            <div>
              <p className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em]", result.revoked ? "text-danger" : "text-live")}>
                <Award size={13} /> {result.revoked ? "Certificate revoked" : "Verified certificate"}
              </p>
              <p className="mt-2 font-display text-lg font-semibold leading-tight">{result.studentName}</p>
              <p className="mt-0.5 text-[13px] text-muted">{result.tier} · {result.track}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted">
                <span>{result.code}</span>
                <span className="opacity-40">·</span>
                <span>Issued {formatDate(result.issuedAt)}</span>
              </div>
              <Link to={`/certificate/${encodeURIComponent(result.code)}`} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-magenta-bright">
                View the full certificate <ArrowRight size={12} />
              </Link>
            </div>
          )}
          {result.kind === "student" && (
            <div>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-live">
                <BadgeCheck size={13} /> Enrolled student
              </p>
              <p className="mt-2 font-display text-lg font-semibold leading-tight">{result.name}</p>
              <p className="mt-0.5 text-[13px] text-muted">{result.track} · {result.status}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted">
                <span>{result.id}</span>
                <span className="opacity-40">·</span>
                <span>{result.certs} certificate{result.certs === 1 ? "" : "s"}</span>
              </div>
              <Link to={`/verify/${encodeURIComponent(result.id)}`} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-magenta-bright">
                Open the public profile <ArrowRight size={12} />
              </Link>
            </div>
          )}
          {result.kind === "none" && (
            <p className="text-[13px] text-muted">
              No record found for “{query}”. Check the KR8 ID or certificate code, or{" "}
              <a className="font-semibold text-magenta-bright" href={`mailto:${db.settings.supportEmail}`}>contact the academy</a>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
