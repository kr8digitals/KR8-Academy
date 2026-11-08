import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Megaphone, Sparkles, Info, PartyPopper, CheckCheck, ArrowRight } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useDb } from "../lib/hooks";
import { listNotifications, markNotificationsRead, unreadNotificationCount } from "../lib/store";
import { cn, timeAgo } from "../lib/utils";

const KIND_ICON = {
  nudge: Megaphone,
  award: Sparkles,
  welcome: PartyPopper,
  system: Info,
} as const;

export function NotificationBell() {
  const { student } = useAuth();
  const db = useDb();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const unread = student ? unreadNotificationCount(student.id) : 0;
  const items = useMemo(() => (student ? listNotifications(student.id, 8) : []), [student, db]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!student) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-raised transition hover:border-white/25"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell size={17} className="text-white/85" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-magenta-fill px-1 text-[9px] font-bold text-white shadow-[0_0_12px_rgba(224,38,196,0.8)]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button type="button" aria-hidden="true" tabIndex={-1} className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 top-full z-20 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-white/10 bg-raised shadow-[0_30px_80px_-30px_rgba(20,15,26,0.7)]"
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/8 px-4 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Notifications</p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markNotificationsRead(student.id)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-magenta-bright hover:text-white"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[420px] overflow-y-auto p-2">
              {items.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <Bell size={22} className="mx-auto text-muted-2" />
                  <p className="mt-2 text-[13px] font-medium">All quiet in here.</p>
                  <p className="mt-1 text-[11px] text-muted">Assignment reminders, class nudges and spotlight news will land in this feed.</p>
                </div>
              ) : (
                items.map((item) => {
                  const Icon = KIND_ICON[item.kind] ?? Info;
                  const fresh = !item.readAt;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        markNotificationsRead(student.id, [item.id]);
                        if (item.actionUrl) navigate(item.actionUrl);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/6",
                        fresh && "bg-magenta/5"
                      )}
                    >
                      <span className={cn(
                        "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                        item.kind === "award" ? "bg-gold/15 text-gold" : item.kind === "nudge" ? "bg-magenta/15 text-magenta-bright" : "bg-cyan/12 text-cyan"
                      )}>
                        <Icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[12.5px] font-semibold">{item.title}</span>
                          <span className="shrink-0 text-[9.5px] uppercase tracking-wider text-muted-2">{timeAgo(item.createdAt)}</span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-snug text-muted">{item.body}</span>
                      </span>
                      {fresh && <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-magenta-fill" />}
                    </button>
                  );
                })
              )}
            </div>
            <Link
              to="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 border-t border-white/8 px-4 py-2.5 text-[12px] font-semibold text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              Open notifications <ArrowRight size={13} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
