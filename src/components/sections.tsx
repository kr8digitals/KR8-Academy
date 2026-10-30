import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, CalendarClock, Sparkles } from "lucide-react";
import { useReveal } from "../lib/hooks";
import { cn, daysRemaining, daysUntil, formatDate } from "../lib/utils";
import { ButtonLink } from "./ui";
import { useDb } from "../lib/hooks";

export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const Component = Tag as React.ElementType;
  return (
    <Component
      ref={ref}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Component>
  );
}

export function Marquee({
  items,
  className,
  tone = "dark",
}: {
  items: string[];
  className?: string;
  tone?: "dark" | "light";
}) {
  const group = [...items, ...items];
  return (
    <div
      className={cn(
        "marquee border-y py-3",
        tone === "dark" ? "border-ink/10 bg-plum-deep text-paper" : "border-ink/10 bg-sand/60 text-ink",
        className
      )}
    >
      <div className="marquee__track">
        {group.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-2.5 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em]">
            <Sparkles size={11} className={tone === "dark" ? "text-magenta" : "text-plum"} />
            {item}
          </span>
        ))}
      </div>
      <div className="marquee__track" aria-hidden="true">
        {group.map((item, index) => (
          <span key={`dup-${item}-${index}`} className="flex items-center gap-2.5 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em]">
            <Sparkles size={11} className={tone === "dark" ? "text-magenta" : "text-plum"} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const target = new Date(to).getTime();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  const cells = [
    { value: days, label: "days" },
    { value: hours, label: "hrs" },
    { value: minutes, label: "min" },
    { value: seconds, label: "sec" },
  ];
  return (
    <div className="flex items-center gap-1.5" aria-label={`Cohort starts in ${days} days`}>
      {cells.map((cell) => (
        <div key={cell.label} className="min-w-[46px] rounded-lg border border-paper/15 bg-paper/[0.06] px-2 py-1.5 text-center">
          <p className="font-display text-base font-semibold leading-none tabular-nums text-paper">
            {String(cell.value).padStart(2, "0")}
          </p>
          <p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-paper/45">{cell.label}</p>
        </div>
      ))}
    </div>
  );
}

export function CtaBand({
  title = "Your craft is waiting. The tuition isn’t.",
  body = "Applications for the next cohort are open now. Three minutes to apply, eight weeks to change what you are capable of.",
  primaryLabel,
  primaryTo = "/apply",
  secondaryLabel = "Explore the tracks",
  secondaryTo = "/tracks",
}: {
  title?: string;
  body?: string;
  primaryLabel?: string;
  primaryTo?: string;
  secondaryLabel?: string;
  secondaryTo?: string;
}) {
  const db = useDb();
  const open = db.settings.registrationOpen;
  return (
    <section className="shell py-16 sm:py-20">
      <div className="ink-panel grain relative overflow-hidden rounded-[26px] px-6 py-12 sm:px-12 sm:py-16">
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow text-paper/55">Admissions</p>
            <h2 className="display display-lg mt-4 max-w-xl text-paper">{title}</h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-paper/70">{body}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink to={open ? primaryTo : "/admissions"} variant="light" size="lg" arrow>
                {primaryLabel ?? (open ? "Apply free" : "Join the waitlist")}
              </ButtonLink>
              <ButtonLink to={secondaryTo} variant="outline-light" size="lg">
                {secondaryLabel}
              </ButtonLink>
            </div>
          </div>
          <div className="rounded-2xl border border-paper/15 bg-paper/[0.06] p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-paper/60">
              <CalendarClock size={14} />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">{db.settings.cohortName}</p>
            </div>
            <p className="mt-3 font-display text-lg font-semibold text-paper">
              Starts {formatDate(db.settings.cohortStart, { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p className="mt-1 text-xs text-paper/55">
              {daysUntil(db.settings.cohortStart) > 0
                ? `${daysRemaining(db.settings.cohortStart)} days until orientation`
                : "Orientation is live — late seats are limited"}
            </p>
            <div className="mt-4">
              <Countdown to={db.settings.cohortStart} />
            </div>
            <div className="mt-5 space-y-2 border-t border-paper/12 pt-4 text-[12px] text-paper/65">
              <p className="flex items-center justify-between"><span>Tuition</span><span className="font-semibold text-paper">₦0.00</span></p>
              <p className="flex items-center justify-between"><span>Seats per track</span><span className="font-semibold text-paper">40</span></p>
              <p className="flex items-center justify-between"><span>Certificate</span><span className="font-semibold text-paper">Included</span></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-ink/10 border-t border-ink/10">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-start gap-5 py-5 text-left"
            >
              <span className="mt-1 font-mono text-[10px] text-muted">{String(index + 1).padStart(2, "0")}</span>
              <span className="flex-1 font-display text-[17px] font-semibold leading-snug">{item.q}</span>
              <span className={cn("mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-ink/15 transition", isOpen && "rotate-45 bg-ink text-paper")}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </span>
            </button>
            <div className={cn("grid transition-all duration-300", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
              <div className="overflow-hidden">
                <p className="pb-5 pl-9 pr-10 text-[14px] leading-relaxed text-muted">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SectionIndex({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-7 w-7 place-items-center rounded-full border border-ink/15 font-mono text-[10px] text-ink/60">{index}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{label}</span>
      <span className="h-px flex-1 bg-ink/10" />
    </div>
  );
}

export function StickyToc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, [items]);

  return (
    <nav className="sticky top-24 hidden w-52 shrink-0 lg:block" aria-label="On this page">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">On this page</p>
      <ul className="mt-3 space-y-1 border-l border-ink/10">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "-ml-px block border-l-2 py-1.5 pl-3 text-[13px] transition",
                active === item.id
                  ? "border-magenta font-semibold text-ink"
                  : "border-transparent text-ink/50 hover:text-ink"
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
      <a href="/apply" className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-semibold text-magenta">
        Apply for this cohort <ArrowRight size={13} />
      </a>
    </nav>
  );
}
