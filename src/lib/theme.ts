/* KR8 Academy automatic day/night theme. An explicit toggle choice is temporary
 * until the visitor cycles back to Auto. In Auto, local daylight is 06:00–18:59. */

export type Theme = "light" | "dark";
const KEY = "kr8.theme.v1";
export const THEME_EVENT = "kr8:themechange";

export function storedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

/** Local daylight window: 06:00 inclusive → 19:00 exclusive. */
export function isDaytime(date = new Date()): boolean {
  const hour = date.getHours() + date.getMinutes() / 60;
  return hour >= 6 && hour < 19;
}

export function resolveTheme(): Theme {
  return storedTheme() ?? (isDaytime() ? "light" : "dark");
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#f7f2ea" : "#0d0015");
}

function announce(theme: Theme) {
  try {
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
  } catch {
    /* non-fatal */
  }
}

/** Re-evaluate the clock only while Auto is active (called on focus and each minute). */
export function refreshAutomaticTheme() {
  if (storedTheme()) return;
  const theme = isDaytime() ? "light" : "dark";
  if (currentTheme() !== theme) {
    applyTheme(theme);
    announce(theme);
  }
}

/** Called before first paint via index.html and again by React. */
export function initTheme(): Theme {
  const theme = resolveTheme();
  applyTheme(theme);
  return theme;
}

export function setTheme(theme: Theme, persist = true) {
  if (persist) {
    try {
      window.localStorage.setItem(KEY, theme);
    } catch {
      /* private mode — still apply for this session */
    }
  }
  applyTheme(theme);
  announce(theme);
}

export function toggleTheme() {
  setTheme(currentTheme() === "light" ? "dark" : "light");
}

export function currentTheme(): Theme {
  const value = document.documentElement.dataset.theme;
  return value === "light" || value === "dark" ? value : resolveTheme();
}

/** Clear an explicit choice — the time-of-day schedule takes over immediately. */
export function clearThemeChoice() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
  const theme = isDaytime() ? "light" : "dark";
  applyTheme(theme);
  announce(theme);
}
