import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { db, readSession, subscribe } from "./store";

/* Re-render whenever the persisted academy data changes (same tab or another). */
let version = 0;
subscribe(() => {
  version += 1;
});
function getSnapshot() {
  return version;
}
function getServerSnapshot() {
  return 0;
}

export function useDb() {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return db();
}

export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px", ...options }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return { ref, visible };
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = () => setMatches(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [locked]);
}

export function useSession() {
  const [studentId, setStudentId] = useState<string | null>(() => readSession()?.studentId ?? null);

  const refresh = useCallback(() => {
    setStudentId(readSession()?.studentId ?? null);
  }, []);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("kr8:session", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("kr8:session", handler);
      window.removeEventListener("storage", handler);
    };
  }, [refresh]);

  return { studentId, refresh };
}

export function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return { value, start };
}
