import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; title: string; body?: string };

type ToastApi = {
  push: (kind: ToastKind, title: string, body?: string) => void;
  success: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
  info: (title: string, body?: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, title: string, body?: string) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((list) => [...list.slice(-3), { id, kind, title, body }]);
      window.setTimeout(() => dismiss(id), 5200);
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (title, body) => push("success", title, body),
      error: (title, body) => push("error", title, body),
      info: (title, body) => push("info", title, body),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-white/10 bg-ink px-4 py-3.5 text-paper shadow-[0_24px_60px_-24px_rgba(20,15,26,0.7)]"
          >
            <span className="mt-0.5 shrink-0">
              {toast.kind === "success" && <CheckCircle2 size={18} className="text-emerald-300" />}
              {toast.kind === "error" && <TriangleAlert size={18} className="text-rose-300" />}
              {toast.kind === "info" && <Info size={18} className="text-sky-300" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{toast.title}</p>
              {toast.body && <p className="mt-1 text-xs leading-relaxed text-paper/70">{toast.body}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded-full p-1 text-paper/50 transition hover:bg-white/10 hover:text-paper"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
