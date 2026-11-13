import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "../lib/utils";
import { clearThemeChoice, currentTheme, refreshAutomaticTheme, setTheme, storedTheme, THEME_EVENT } from "../lib/theme";

/** Cycles through the two manual looks and the automatic day/night schedule. */
export function ThemeToggle({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const [theme, setThemeState] = useState<"light" | "dark">(() => currentTheme());
  const [chosen, setChosen] = useState<boolean>(() => !!storedTheme());

  useEffect(() => {
    const onChange = () => {
      setThemeState(currentTheme());
      setChosen(!!storedTheme());
    };
    const syncAuto = () => refreshAutomaticTheme();
    window.addEventListener(THEME_EVENT, onChange);
    window.addEventListener("focus", syncAuto);
    const timer = window.setInterval(syncAuto, 60_000);
    return () => {
      window.removeEventListener(THEME_EVENT, onChange);
      window.removeEventListener("focus", syncAuto);
      window.clearInterval(timer);
    };
  }, []);

  const next = !chosen ? "light" : theme === "light" ? "dark" : "auto";
  function cycleTheme() {
    if (!chosen) setTheme("light");
    else if (theme === "light") setTheme("dark");
    else clearThemeChoice();
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={!chosen ? "Choose a manual light or dark theme" : next === "auto" ? "Return to automatic theme" : `Switch to the ${next} theme`}
      title={chosen ? `Manual ${theme} theme · click to ${next === "auto" ? "return to Auto: Light by day · Dark by night" : `switch to ${next}`}` : "Auto: Light by day · Dark by night · click to choose a manual theme"}
      className={cn(
        "theme-toggle relative inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
        theme === "light"
          ? "border-plum/15 bg-white text-plum shadow-[0_2px_10px_-4px_rgba(43,26,61,0.35)] hover:border-plum/30"
          : "border-white/12 bg-raised text-gold hover:border-gold/40 hover:shadow-[0_0_18px_-8px_rgba(240,198,116,0.6)]",
        className
      )}
    >
      {theme === "light" ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
      {showLabel && <span className="sr-only">{chosen ? `Manual ${theme} theme` : "Auto: light by day, dark by night"}</span>}
      <span className="sr-only">{!chosen ? "Automatic by time of day" : "Manual theme selected"}</span>
    </button>
  );
}
