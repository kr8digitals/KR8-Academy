/* Admin console smoke tests — each v3 tab renders for an owner without crashing. */
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import App from "../src/App";
import { AuthProvider } from "../src/lib/auth";
import { ToastProvider } from "../src/lib/toast";
import { reseed } from "../src/lib/store";

beforeEach(() => {
  window.localStorage.clear();
  reseed();
});

function renderApp(path: string) {
  window.history.pushState({}, "", path);
  return render(
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

async function signInAsAdmin(user: ReturnType<typeof userEvent.setup>) {
  const view = renderApp("/login");
  await user.type(await screen.findByLabelText(/KR8 ID, email or phone/i), "kr8digitals01@gmail.com");
  await user.type(screen.getByLabelText(/^password$/i), "KR8@Academy2026");
  await user.click(screen.getByRole("button", { name: /^sign in$/i }));
  await screen.findByText(/The academy at a glance/i, {}, { timeout: 8000 });
  view.unmount(); // session persists in localStorage; the tab tree restores it
}

describe("admin console v3 tabs", () => {
  const tabs: Array<{ path: string; anchor: RegExp }> = [
    { path: "/admin/programmes", anchor: /Digital skills — next intake/i },
    { path: "/admin/waitlist", anchor: /Registration waitlist/i },
    { path: "/admin/scores", anchor: /Score entry — out of 100/i },
    { path: "/admin/awards", anchor: /result slips — verification queue/i },
    { path: "/admin/exams", anchor: /KR8's own exam — questions/i },
    { path: "/admin/content", anchor: /Content studio/i },
    { path: "/admin/data", anchor: /Backup & restore/i },
    { path: "/admin/security", anchor: /Two-factor authentication/i },
  ];

  it.each(tabs)("%s renders for the owner", async ({ path, anchor }) => {
    const user = userEvent.setup();
    await signInAsAdmin(user);
    renderApp(path);
    expect(await screen.findByText(anchor, {}, { timeout: 8000 })).toBeInTheDocument();
  });
});
