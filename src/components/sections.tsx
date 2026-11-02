import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
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
        "marquee marquee-soft py-4",
        tone === "light" && "bg-chip/60",
        className
      )}
    >
      <div className="marquee__track">
        {group.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex items-center gap-3 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a794c6] sm:text-[11px]"
          >
            {item}
            <span className="text-gradient text-[13px] leading-none" aria-hidden="true">
              ◆
            </span>
          </span>
        ))}
      </div>
      <div className="marquee__track" aria-hidden="true">
        {group.map((item, index) => (
          <span
            key={`dup-${item}-${index}`}
            className="flex items-center gap-3 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a794c6] sm:text-[11px]"
          >
            {item}
            <span className="text-gradient text-[13px] leading-none" aria-hidden="true">
              ◆
            </span>
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
        <div key={cell.label} className="min-w-[46px] rounded-lg border border-white/15 bg-white/[0.06] px-2 py-1.5 text-center">
          <p className="font-display text-base font-semibold leading-none tabular-nums text-white">
            {String(cell.value).padStart(2, "0")}
          </p>
          <p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-white/65">{cell.label}</p>
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
    <section className="shell pb-16 pt-6 sm:pb-24">
      <div className="panel-glow starfield relative px-6 py-14 text-center sm:px-12 sm:py-20">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-64 w-2/3 rounded-full bg-[radial-gradient(circle,rgba(224,38,196,0.28),transparent_70%)] blur-2xl"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-2xl">
          <p className="eyebrow">{open ? "Admissions open" : "Waitlist open"}</p>
          <h2 className="display display-lg mt-5 text-white">{title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/75">{body}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink to={open ? primaryTo : "/admissions"} variant="primary" size="lg" arrow>
              {primaryLabel ?? (open ? "Apply free" : "Join the waitlist")}
            </ButtonLink>
            <ButtonLink to={secondaryTo} variant="ghost" size="lg">
              {secondaryLabel}
            </ButtonLink>
          </div>

          <dl className="mx-auto mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 border-t border-white/10 pt-7 text-left sm:grid-cols-4">
            {[
              { k: "Cohort", v: db.settings.cohortName },
              { k: "Onboarding", v: "30 April" },
              { k: "Classes begin", v: "1 May" },
              { k: "Class nights", v: "Mon · Wed · Fri" },
            ].map((item) => (
              <div key={item.k}>
                <dt className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/50">{item.k}</dt>
                <dd className="mt-1 font-display text-[13px] font-semibold text-white">{item.v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-[11px] text-white/55">
            {formatDate(db.settings.cohortStart, { day: "numeric", month: "long", year: "numeric" })} · 8:00–9:00pm
            WAT · {daysUntil(db.settings.cohortStart) > 0 ? `${daysRemaining(db.settings.cohortStart)} days to go` : "In session"}
          </p>
        </div>
      </div>
    </section>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-white/10 border-t border-white/10">
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
              <span className={cn("mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/15 transition", isOpen && "rotate-45 bg-magenta-fill text-white")}>
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
      <span className="inline-flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-full border border-white/15 px-2 font-mono text-[10px] leading-none text-muted">
        {index}
      </span>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{label}</span>
      <span className="h-px flex-1 bg-white/10" />
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
      <ul className="mt-3 space-y-1 border-l border-white/10">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "-ml-px block border-l-2 py-1.5 pl-3 text-[13px] transition",
                active === item.id
                  ? "border-magenta font-semibold text-white"
                  : "border-transparent text-muted-2 hover:text-white"
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
      <a href="/apply" className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-semibold text-magenta-bright">
        Apply for this cohort <ArrowRight size={13} />
      </a>
    </nav>
  );
}
