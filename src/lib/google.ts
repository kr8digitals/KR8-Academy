/* KR8 Academy — Sign in with Google (Google Identity Services).
 *
 * The Google button is fully wired to Google's identity client. It needs one
 * thing at deploy time: an OAuth Client ID (Web application) from Google Cloud
 * Console, published as VITE_GOOGLE_CLIENT_ID in the project's environment.
 * Until that key is present, the button renders and answers with a clear,
 * honest message — it never fakes a Google account. Email sign-in works fully
 * in the meantime.
 */

export type GoogleProfile = { name: string; email: string; picture?: string };

export const GOOGLE_CLIENT_ID: string = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? "";
export const isGoogleConfigured = () => GOOGLE_CLIENT_ID.trim().length > 0;

let loader: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as unknown as { google?: { accounts?: { id?: unknown } } };
  if (w.google?.accounts?.id) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google sign-in could not load. Check your connection and try again."));
    document.head.appendChild(script);
  });
  return loader;
}

function decodeJwtPayload(credential: string): GoogleProfile | null {
  try {
    const part = credential.split(".")[1];
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      Array.from(atob(base64))
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    const payload = JSON.parse(json) as { name?: string; email?: string; picture?: string };
    if (!payload.email) return null;
    return { name: payload.name ?? payload.email.split("@")[0], email: payload.email, picture: payload.picture };
  } catch {
    return null;
  }
}

/** Prompts Google sign-in and resolves with the verified profile. Rejects with a human-readable reason. */
export async function signInWithGoogle(): Promise<GoogleProfile> {
  if (!isGoogleConfigured())
    throw new Error("Google sign-in is being connected — use your email instead.");
  await loadGsi();
  return new Promise<GoogleProfile>((resolve, reject) => {
    const g = (window as unknown as { google?: any }).google;
    if (!g?.accounts?.id) {
      reject(new Error("Google sign-in is unavailable right now. Use your email instead."));
      return;
    }
    g.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: { credential?: string }) => {
        const profile = response?.credential ? decodeJwtPayload(response.credential) : null;
        if (profile) resolve(profile);
        else reject(new Error("Google returned an unreadable sign-in. Please try again."));
      },
      ux_mode: "popup",
    });
    g.accounts.id.prompt((notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment())
        reject(new Error("The Google prompt was blocked or dismissed. Allow popups, or use your email instead."));
    });
  });
}
