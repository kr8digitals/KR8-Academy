import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "../lib/utils";
import { currentTheme, toggleTheme, THEME_EVENT, storedTheme } from "../lib/theme";

/**
 * One-tap theme switch. Always shows what you will get you: the icon of the
 * mode it will bring. An explicit choice (tap = explicit) is remembered; to go
 * back to the clock you can flip twice or clear it in Settings.
 */
export function ThemeToggle({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const [theme, setTheme] = useState<"light" | "dark">(() => currentTheme());
  const [chosen, setChosen] = useState<boolean>(() => !!storedTheme());

  useEffect(() => {
    const onChange = () => {
      setTheme(currentTheme());
      setChosen(!!storedTheme());
    };
    window.addEventListener(THEME_EVENT, onChange);
    return () => window.removeEventListener(THEME_EVENT, onChange);
  }, []);

  const next = theme === "light" ? "dark" : "light";
  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      aria-label={`Switch to the ${next} theme`}
      title={`Switch to the ${next} theme${chosen ? " (your default)" : " (currently automatic by time of day)"}`}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
        theme === "light"
          ? "border-plum/15 bg-white text-plum shadow-[0_2px_10px_-4px_rgba(43,26,61,0.35)] hover:border-plum/30"
          : "border-white/12 bg-raised text-gold hover:border-gold/40 hover:shadow-[0_0_18px_-8px_rgba(240,198,116,0.6)]",
        className
      )}
    >
      {theme === "light" ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
      {showLabel && <span className="sr-only">{theme === "light" ? "Light theme (tap for dark)" : "Dark theme (tap for light)"}</span>}
    </button>
  );
}
