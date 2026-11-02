import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Copy, Loader2, X } from "lucide-react";
import { cn, copyToClipboard, initials } from "../lib/utils";
import { useLockBodyScroll } from "../lib/hooks";

/* ------------------------------------------------------------------ */
/* Brand                                                               */
/* ------------------------------------------------------------------ */

export function Logo({
  dark = false,
  compact = false,
  size = "md",
}: {
  dark?: boolean;
  compact?: boolean;
  size?: "md" | "lg";
}) {
  const mark = size === "lg" ? "h-12 w-12" : "h-9 w-9 sm:h-10 sm:w-10";
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <img
        src="/brand/kr8-emblem.png"
        alt=""
        width={512}
        height={512}
        className={cn(
          "shrink-0 rounded-full object-contain",
          mark,
          dark ? "ring-1 ring-white/15" : "drop-shadow-[0_4px_16px_rgba(224,38,196,0.45)]"
        )}
      />
      <span className="min-w-0 leading-none">
        <span
          className={cn(
            "block truncate font-display font-semibold tracking-[-0.015em] text-white",
            size === "lg" ? "text-[21px]" : "text-[14px] sm:text-[17px]"
          )}
        >
          KR8 Digitals&rsquo; <span className="text-gradient">Academy</span>
        </span>
        {!compact && (
          <span
            className={cn(
              "mt-1 block text-[8.5px] font-semibold uppercase tracking-[0.2em] sm:text-[9px]",
              dark ? "text-white/55" : "text-muted"
            )}
          >
            Learn free · build for real
          </span>
        )}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type Variant = "primary" | "accent" | "ghost" | "light" | "outline-light";
type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  accent: "btn-accent",
  ghost: "btn-ghost",
  light: "btn-light",
  "outline-light": "btn-outline-light",
};

const sizeClass: Record<Size, string> = { sm: "btn-sm", md: "", lg: "btn-lg" };

type BaseButtonProps = {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  full?: boolean;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  arrow,
  loading,
  icon,
  full,
  className,
  children,
  ...rest
}: BaseButtonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn("btn", variantClass[variant], sizeClass[size], full && "w-full", className)}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="spin" /> : icon}
      {children}
      {arrow && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
    </button>
  );
}

export function ButtonLink({
  to,
  href,
  variant = "primary",
  size = "md",
  arrow,
  icon,
  full,
  className,
  children,
  onClick,
}: BaseButtonProps & { to?: string; href?: string; onClick?: () => void }) {
  const classes = cn("btn group", variantClass[variant], sizeClass[size], full && "w-full", className);
  const inner = (
    <>
      {icon}
      {children}
      {arrow && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes} onClick={onClick}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className={classes} onClick={onClick}>
      {inner}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export function Card({
  children,
  className,
  hover,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "article" | "section" | "li";
}) {
  return <Tag className={cn("card", hover && "card-lift", className)}>{children}</Tag>;
}

export function SectionHead({
  eyebrow,
  title,
  body,
  align = "left",
  action,
  className,
  dark,
}: {
  eyebrow?: string;
  title: ReactNode;
  body?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        centered
          ? "flex flex-col items-center gap-7 text-center"
          : "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto flex flex-col items-center")}>
        {eyebrow && <p className={cn("eyebrow", dark && "text-white/60")}>{eyebrow}</p>}
        <h2 className={cn("display display-lg mt-4 text-white", dark && "text-white")}>{title}</h2>
        {body && <p className={cn("lede mt-4 max-w-xl", dark ? "text-white/70" : "text-muted", centered && "mx-auto")}>{body}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Pill({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "solid" | "magenta" | "live" | "dark";
  className?: string;
}) {
  const map = {
    default: "pill",
    solid: "pill pill-solid",
    magenta: "pill pill-magenta",
    live: "pill pill-live",
    dark: "pill pill-dark",
  } as const;
  return <span className={cn(map[tone], className)}>{children}</span>;
}

export function Avatar({
  name,
  src,
  size = 40,
  className,
  ring,
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const dim = { width: size, height: size };
  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name}
        style={dim}
        loading="lazy"
        onError={() => setBroken(true)}
        className={cn("shrink-0 rounded-full object-cover", ring && "ring-2 ring-white", className)}
      />
    );
  }
  return (
    <span
      style={{ ...dim, fontSize: Math.max(11, size * 0.34) }}
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-magenta-fill font-display font-semibold text-white",
        className
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function Progress({
  value,
  tone = "plum",
  label,
  className,
}: {
  value: number;
  tone?: "plum" | "magenta" | "gold" | "light";
  label?: string;
  className?: string;
}) {
  const colors = {
    plum: "bg-magenta-fill",
    magenta: "bg-magenta-fill",
    gold: "bg-gold",
    light: "bg-base",
  } as const;
  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.08em]">
          <span className="opacity-70">{label}</span>
          <span className="tabular-nums">{Math.round(value)}%</span>
        </div>
      )}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-700 ease-out", colors[tone])}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export function Ring({ value, size = 84, stroke = 7, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted-2/30" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-magenta-bright transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-center">
        <span className="block font-display text-lg font-semibold leading-none tabular-nums">{Math.round(value)}%</span>
        {label && <span className="mt-0.5 block text-[9px] uppercase tracking-[0.12em] opacity-60">{label}</span>}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Forms                                                               */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
  optional,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  optional?: boolean;
}) {
  return (
    <div className={className}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
        {optional && <span className="ml-1.5 font-normal normal-case tracking-normal text-muted/70">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, error, ...rest }: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return <input className={cn("input", error && "input-error", className)} aria-invalid={error || undefined} {...rest} />;
}

export function Textarea({ className, error, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return <textarea className={cn("textarea", error && "textarea-error", className)} aria-invalid={error || undefined} {...rest} />;
}

export function Select({ className, error, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select className={cn("select", error && "select-error", className)} aria-invalid={error || undefined} {...rest}>
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useLockBodyScroll(open);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        "input, select, textarea, button:not([data-close]), a[href]"
      );
      focusable?.focus();
    }, 40);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-6">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 w-full animate-[sheet-up_0.28s_cubic-bezier(0.22,1,0.36,1)] rounded-t-3xl border border-white/10 bg-raised p-6 shadow-2xl sm:rounded-3xl sm:p-7",
          widths[size]
        )}
        style={{
          animation: "sheet-up 0.28s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id={titleId} className="display text-xl">
              {title}
            </h3>
            {description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>}
          </div>
          <button
            type="button"
            data-close
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-muted transition hover:bg-white/8 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        {children && <div className="mt-5">{children}</div>}
        {footer && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
      <style>{`@keyframes sheet-up { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Accordion                                                           */
/* ------------------------------------------------------------------ */

export function Accordion({
  items,
  defaultOpen = 0,
}: {
  items: { id: string; label: string; meta?: string; body: ReactNode }[];
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  return (
    <div className="divide-y divide-white/10 border-y border-white/10">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 py-4 text-left transition hover:opacity-70"
            >
              <span className="w-16 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                {item.label}
              </span>
              <span className="flex-1 font-display text-[15px] font-semibold leading-snug sm:text-[16px]">{item.meta}</span>
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/15 transition",
                  isOpen && "rotate-45 bg-magenta-fill text-white"
                )}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="pb-5 pl-0 sm:pl-20">{item.body}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await copyToClipboard(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-raised px-2.5 py-1 text-[11px] font-semibold text-body transition hover:border-white/30 hover:text-white"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-raised/60 px-6 py-12 text-center">
      {icon && <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-white/6 text-muted-2">{icon}</div>}
      <p className="font-display text-[16px] font-semibold">{title}</p>
      {body && <p className="mt-1.5 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1", className)} role="tablist">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium transition",
              active ? "bg-magenta-fill text-white shadow-sm" : "text-muted hover:bg-white/8 hover:text-white"
            )}
          >
            {tab.label}
            {typeof tab.count === "number" && (
              <span className={cn("ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums", active ? "bg-white/20" : "bg-white/8")}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Stat({ value, label, dark }: { value: string; label: string; dark?: boolean }) {
  return (
    <div>
      <p className={cn("font-display text-2xl font-semibold leading-none tabular-nums sm:text-3xl", dark ? "text-white" : "text-white")}>
        {value}
      </p>
      <p className={cn("mt-1.5 text-[11px] font-medium uppercase tracking-[0.12em]", dark ? "text-white/50" : "text-muted")}>
        {label}
      </p>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("rule", className)} />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-white/15 bg-base px-1.5 py-0.5 font-mono text-[10px] text-muted">{children}</kbd>
  );
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-magenta-fill px-2 py-1 text-[11px] text-white opacity-0 transition group-hover/tt:opacity-100">
        {label}
      </span>
    </span>
  );
}
