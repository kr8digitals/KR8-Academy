/* KR8 Academy — theme engine.
 *
 * Three rules, in order of authority:
 *   1. A visitor's explicit choice always wins (stored locally, forever, until they change it).
 *   2. Otherwise the clock decides — daylight (06:00–18:59, visitor's own timezone) is light, night is dark.
 *   3. The toggle is always one tap away, and /pre-paint/ everything is set before first paint (see index.html).
 */

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

/** Daylight window in the visitor's local timezone: 06:00 inclusive → 19:00 exclusive. */
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

/** Called before first paint via the inline script in index.html and again by React. */
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
  try {
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
  } catch {
    /* non-fatal */
  }
}

export function toggleTheme() {
  setTheme(currentTheme() === "light" ? "dark" : "light");
}

export function currentTheme(): Theme {
  const value = document.documentElement.dataset.theme;
  return value === "light" || value === "dark" ? value : resolveTheme();
}

/** Clear an explicit choice — the clock takes back over. */
export function clearThemeChoice() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
  const theme = isDaytime() ? "light" : "dark";
  applyTheme(theme);
  try {
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
  } catch {
    /* non-fatal */
  }
}
