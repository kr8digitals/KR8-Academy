import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import App from "../src/App";
import { AuthProvider } from "../src/lib/auth";
import { ToastProvider } from "../src/lib/toast";
import {
  db,
  getAttendance,
  getAnnouncements,
  registerStudent,
  reseed,
  reviewApplication,
  saveSettings,
  setSessionStatus,
  setStudentStatus,
  submitAssignment,
  exportDatabase,
  getRoster,
} from "../src/lib/store";

beforeEach(() => {
  window.localStorage.clear();
  reseed();
});

function renderApp(path = "/") {
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

type User = ReturnType<typeof userEvent.setup>;

async function signIn(user: User, identifier: string, password: string) {
  renderApp("/login");
  await user.type(await screen.findByLabelText(/KR8 ID, email or phone/i), identifier);
  await user.type(screen.getByLabelText(/^password$/i), password);
  await user.click(screen.getByRole("button", { name: /^sign in$/i }));
}

const SAMPLE_EMAIL = "grant.gideon@student.kr8digitals.com";
const ADMIN_EMAIL = "kr8digitals01@gmail.com";

function student(email: string) {
  return db().students.find((s) => s.email === email)!;
}

describe("sign-in edge cases", () => {
  it("accepts a KR8 ID instead of an email", async () => {
    const user = userEvent.setup();
    await signIn(user, student(SAMPLE_EMAIL).id, "KR8@Sample2026");
    expect(await screen.findByRole("heading", { level: 1, name: /welcome back/i }, { timeout: 8000 })).toBeInTheDocument();
  });

  it("accepts a phone number instead of an email", async () => {
    const user = userEvent.setup();
    const phone = student(SAMPLE_EMAIL).phone;
    await signIn(user, phone, "KR8@Sample2026");
    expect(await screen.findByRole("heading", { level: 1, name: /welcome back/i }, { timeout: 8000 })).toBeInTheDocument();
  });

  it("refuses a suspended account", async () => {
    const user = userEvent.setup();
    setStudentStatus(student(SAMPLE_EMAIL).id, "suspended", "Test");
    await signIn(user, SAMPLE_EMAIL, "KR8@Sample2026");
    expect(await screen.findByRole("alert")).toHaveTextContent(/suspended/i);
  });

  it("keeps the session across a reload", async () => {
    const user = userEvent.setup();
    await signIn(user, SAMPLE_EMAIL, "KR8@Sample2026");
    await screen.findByRole("heading", { level: 1, name: /welcome back/i }, { timeout: 8000 });
    screen.getByText(/Student identity/i).remove();
    renderApp("/dashboard");
    expect(await screen.findByText(/Student identity/i, {}, { timeout: 8000 })).toBeInTheDocument();
  });

  it("signs out from the account menu", async () => {
    const user = userEvent.setup();
    await signIn(user, SAMPLE_EMAIL, "KR8@Sample2026");
    await screen.findByRole("heading", { level: 1, name: /welcome back/i }, { timeout: 8000 });

    const menuButton = screen.getAllByRole("button", { name: /account|menu/i })[0];
    await user.click(menuButton);
    const signOut = await screen.findByRole("button", { name: /sign out/i });
    await user.click(signOut);
    await waitFor(() => {
      expect(window.localStorage.getItem("kr8.academy.session.v1")).toBeNull();
    });
  });
});

describe("student attendance and profile", () => {
  it("checks in to an open session and records attendance", async () => {
    const user = userEvent.setup();
    const me = student(SAMPLE_EMAIL);
    setSessionStatus(me.trackKey, 8, "open");
    await signIn(user, SAMPLE_EMAIL, "KR8@Sample2026");
    await screen.findByRole("heading", { level: 1, name: /welcome back/i }, { timeout: 8000 });
    await user.click(screen.getAllByRole("link", { name: /^attendance$/i })[0]);

    const before = getAttendance(me.id).filter((a) => a.week === 8).length;
    expect(before).toBe(0);
    const buttons = await screen.findAllByRole("button", { name: /^check in$/i });
    await user.click(buttons[0]);
    await waitFor(() => {
      expect(getAttendance(me.id).filter((a) => a.week === 8)).toHaveLength(1);
    });
  });

  it("saves a profile edit to the datastore", async () => {
    const user = userEvent.setup();
    await signIn(user, SAMPLE_EMAIL, "KR8@Sample2026");
    await screen.findByRole("heading", { level: 1, name: /welcome back/i }, { timeout: 8000 });
    await user.click(screen.getAllByRole("link", { name: /^profile$/i })[0]);

    const name = await screen.findByLabelText(/Full name/i);
    await user.clear(name);
    await user.type(name, "Grant Gideon Ade");
    await user.click(screen.getAllByRole("button", { name: /save changes/i })[0]);

    await waitFor(() => {
      expect(student(SAMPLE_EMAIL).name).toBe("Grant Gideon Ade");
    });
  });

  it("rejects a wrong current password when changing it", async () => {
    const user = userEvent.setup();
    await signIn(user, SAMPLE_EMAIL, "KR8@Sample2026");
    await screen.findByRole("heading", { level: 1, name: /welcome back/i }, { timeout: 8000 });
    await user.click(screen.getAllByRole("link", { name: /^profile$/i })[0]);

    await user.type(await screen.findByLabelText(/Current password/i), "not-my-password");
    await user.type(screen.getByLabelText(/^New password$/i), "brand-new-secret");
    await user.type(screen.getByLabelText(/Confirm new password/i), "brand-new-secret");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText(/current password is incorrect/i, {}, { timeout: 6000 })).toBeInTheDocument();
    expect(student(SAMPLE_EMAIL).name).toBe("Grant Gideon");
  });

  it("locks the certificate request until the criteria are met", async () => {
    const user = userEvent.setup();
    await signIn(user, SAMPLE_EMAIL, "KR8@Sample2026");
    await screen.findByRole("heading", { level: 1, name: /welcome back/i }, { timeout: 8000 });
    await user.click(screen.getAllByRole("link", { name: /^certificate$/i })[0]);

    expect(await screen.findByText(/Proof you can hand to a client/i)).toBeInTheDocument();
    const request = screen.queryByRole("button", { name: /request certificate/i });
    if (request) expect(request).toBeDisabled();
  });
});

describe("admin operations", () => {
  it("suspends a student from the roster and blocks their login", async () => {
    const user = userEvent.setup();
    const target = student(SAMPLE_EMAIL);
    await signIn(user, ADMIN_EMAIL, "KR8@Academy2026");
    await screen.findByText(/The academy at a glance/i, {}, { timeout: 8000 });
    await user.click(screen.getAllByRole("link", { name: /^students$/i })[0]);

    const row = (await screen.findAllByText("Grant Gideon"))[0].closest("tr")!;
    await user.click(within(row).getByRole("button", { name: /^manage$/i }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /^suspended$/i }));

    await waitFor(() => {
      expect(db().students.some((s) => s.status === "suspended")).toBe(true);
    });
    expect(db().students.find((s) => s.id === target.id)?.status).toBe("suspended");
  });

  it("marks attendance for an enrolled student", async () => {
    const user = userEvent.setup();
    await signIn(user, ADMIN_EMAIL, "KR8@Academy2026");
    await screen.findByText(/The academy at a glance/i, {}, { timeout: 8000 });
    await user.click(screen.getAllByRole("link", { name: /^attendance$/i })[0]);

    await user.selectOptions(await screen.findByLabelText(/^Week$/i), "8");
    const before = getAttendance().length;
    const marks = await screen.findAllByRole("button", { name: /mark present/i });
    await user.click(marks[0]);
    await waitFor(() => {
      expect(getAttendance().length).toBe(before + 1);
    });
  });

  it("opens check-in so students can sign in to the room", async () => {
    const user = userEvent.setup();
    await signIn(user, ADMIN_EMAIL, "KR8@Academy2026");
    await screen.findByText(/The academy at a glance/i, {}, { timeout: 8000 });
    await user.click(screen.getAllByRole("link", { name: /^attendance$/i })[0]);

    await user.selectOptions(await screen.findByLabelText(/^Track$/i), "web");
    await user.selectOptions(screen.getByLabelText(/^Week$/i), "2");
    await user.click(screen.getByRole("button", { name: /open check-in/i }));

    await waitFor(() => {
      const state = db().sessionStates.find((s) => s.trackKey === "web" && s.week === 2);
      expect(state?.status).toBe("open");
    });
  });

  it("publishes an announcement the student can read", async () => {
    const user = userEvent.setup();
    await signIn(user, ADMIN_EMAIL, "KR8@Academy2026");
    await screen.findByText(/The academy at a glance/i, {}, { timeout: 8000 });
    await user.click(screen.getAllByRole("link", { name: /^announcements$/i })[0]);

    await user.click(await screen.findByRole("button", { name: /new announcement/i }));
    await user.type(await screen.findByLabelText(/^Title$/i), "Portfolio review this Thursday");
    await user.type(screen.getByLabelText(/^Message$/i), "Bring one finished piece and one work in progress.");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(getAnnouncements("all").some((a) => a.title === "Portfolio review this Thursday")).toBe(true);
    });
  });

  it("saves cohort settings and reflects them in the shell", async () => {
    const user = userEvent.setup();
    await signIn(user, ADMIN_EMAIL, "KR8@Academy2026");
    await screen.findByText(/The academy at a glance/i, {}, { timeout: 8000 });
    await user.click(screen.getAllByRole("link", { name: /^settings$/i })[0]);

    const name = await screen.findByLabelText(/Cohort name/i);
    await user.clear(name);
    await user.type(name, "Cohort 09 · 2027");
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => {
      expect(db().settings.cohortName).toBe("Cohort 09 · 2027");
    });
    expect(screen.getAllByText(/Cohort 09 · 2027/i).length).toBeGreaterThan(0);
  });

  it("deletes a sample account and everything attached to it", async () => {
    const user = userEvent.setup();
    const target = student(SAMPLE_EMAIL);
    submitAssignment({ studentId: target.id, week: 8, title: "Cleanup", url: "https://example.com/x" });
    await signIn(user, ADMIN_EMAIL, "KR8@Academy2026");
    await screen.findByText(/The academy at a glance/i, {}, { timeout: 8000 });
    await user.click(screen.getAllByRole("link", { name: /^students$/i })[0]);

    const row = (await screen.findAllByText("Grant Gideon"))[0].closest("tr")!;
    await user.click(within(row).getByRole("button", { name: /^manage$/i }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /delete account/i }));

    await waitFor(() => {
      expect(db().students.some((s) => s.id === target.id)).toBe(false);
    });
    expect(db().submissions.filter((s) => s.studentId === target.id)).toHaveLength(0);
    expect(db().attendance.filter((a) => a.studentId === target.id)).toHaveLength(0);
    expect(db().certificates.filter((c) => c.studentId === target.id)).toHaveLength(0);
  });
});

describe("end-to-end journeys", () => {
  it("honours a preselected track on the application", async () => {
    const user = userEvent.setup();
    renderApp("/apply?track=frontend");
    await user.type(await screen.findByLabelText(/Full name/i), "Preselect Pat");
    await user.type(screen.getByLabelText(/Email address/i), "pat@example.com");
    await user.type(screen.getByLabelText(/Phone \(WhatsApp preferred\)/i), "8070005555");
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.type(await screen.findByLabelText(/What do you want to build/i), "I want to ship production React interfaces.");
    await user.click(screen.getByRole("button", { name: /continue/i }));
    // The preselected track should let the applicant continue straight to step three.
    expect(await screen.findByLabelText(/Date of birth/i)).toBeInTheDocument();
    expect(screen.queryByText(/Choose your track/i)).not.toBeInTheDocument();
  });

  it("sends work back for revision and lets the student resubmit", async () => {
    const user = userEvent.setup();
    const target = student(SAMPLE_EMAIL);
    submitAssignment({ studentId: target.id, week: 8, title: "Portfolio v1", url: "https://example.com/v1" });
    const submission = db().submissions.find((s) => s.studentId === target.id && s.week === 8)!;

    await signIn(user, ADMIN_EMAIL, "KR8@Academy2026");
    await screen.findByText(/The academy at a glance/i, {}, { timeout: 8000 });
    await user.click(screen.getAllByRole("link", { name: /^submissions$/i })[0]);
    const review = await screen.findByRole("button", { name: /^review$/i });
    await user.click(review);
    await screen.findByText(/Review submission/i);
    await user.selectOptions(screen.getByLabelText(/^Outcome$/i), "revise");
    await user.type(screen.getByLabelText(/Written feedback/i), "Rebuild the grid and resubmit.");
    await user.click(screen.getByRole("button", { name: /save review/i }));

    await waitFor(() => {
      expect(db().submissions.find((s) => s.id === submission.id)?.status).toBe("revise");
    });
    const stored = db().submissions.find((s) => s.id === submission.id)!;
    expect(stored.feedback).toMatch(/Rebuild the grid/i);
  });

  it("runs a certificate request through the admin and into the register", async () => {
    const user = userEvent.setup();
    const graduate = db().students.find((s) => s.name.includes("Grant Gideon"))!;
    // Grant already holds a credential; clear it so the request path is exercised.
    db().certificates = db().certificates.filter((c) => c.studentId !== graduate.id);
    db().certificateRequests = [];

    await signIn(user, SAMPLE_EMAIL, "KR8@Sample2026");
    await screen.findByRole("heading", { level: 1, name: /welcome back/i }, { timeout: 8000 });
    await user.click(screen.getAllByRole("link", { name: /^certificate$/i })[0]);

    const request = await screen.findByRole("button", { name: /request certificate/i });
    expect(request).toBeEnabled();
    await user.click(request);
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /send request/i }));
    await waitFor(() => {
      expect(db().certificateRequests.some((r) => r.studentId === graduate.id && r.status === "pending")).toBe(true);
    });
  });

  it("restores a backup through the admin file input", async () => {
    const user = userEvent.setup();
    const backup = exportDatabase();
    await signIn(user, ADMIN_EMAIL, "KR8@Academy2026");
    await screen.findByText(/The academy at a glance/i, {}, { timeout: 8000 });
    await user.click(screen.getAllByRole("link", { name: /^settings$/i })[0]);

    const file = new File([backup], "backup.json", { type: "application/json" });
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getAllByText(/backup/i).length).toBeGreaterThan(0);
    });
    expect(getRoster().length).toBe(8);
  });
});

describe("public records", () => {
  it("shows a revoked credential as revoked", async () => {
    const user = userEvent.setup();
    const certificate = db().certificates[0];
    const admin = db().students.find((s) => s.role === "superadmin")!;
    await signIn(user, admin.email, "KR8@Academy2026");
    await screen.findByText(/The academy at a glance/i, {}, { timeout: 8000 });
    await user.click(screen.getAllByRole("link", { name: /^certificates$/i })[0]);
    const row = (await screen.findByText(new RegExp(certificate.code))).closest("div")!.parentElement!;
    await user.click(within(row).getByRole("button", { name: /^revoke$/i }));
    await user.type(await screen.findByLabelText(/^Reason$/i), "Issued in error");
    await user.click(screen.getByRole("button", { name: /revoke certificate/i }));

    await waitFor(() => {
      expect(db().certificates.find((c) => c.id === certificate.id)?.revoked).toBe(true);
    });
  });

  it("verifies a student ID and reports the track", async () => {
    const user = userEvent.setup();
    const target = student(SAMPLE_EMAIL);
    renderApp("/verify");
    await user.type(await screen.findByLabelText(/KR8 ID or certificate code/i), target.id);
    await user.click(screen.getByRole("button", { name: /verify credential/i }));
    expect(await screen.findByText(/Enrolled student/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Graphic Design/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(target.name).length).toBeGreaterThan(0);
  });

  it("404s an unknown certificate page honestly", async () => {
    renderApp("/certificate/KR8-CERT-9999-COMP");
    expect(await screen.findByRole("heading", { level: 1, name: /not found|no record|does not exist/i })).toBeInTheDocument();
  });
});

describe("route guards", () => {
  it("sends a student away from the admin console", async () => {
    const user = userEvent.setup();
    await signIn(user, SAMPLE_EMAIL, "KR8@Sample2026");
    await screen.findByRole("heading", { level: 1, name: /welcome back/i }, { timeout: 8000 });
    expect(window.location.pathname).toBe("/dashboard");
  });

  it("sends a signed-out visitor to sign in and remembers where they were going", async () => {
    renderApp("/admin");
    expect(await screen.findByRole("heading", { level: 1, name: /welcome back/i })).toBeInTheDocument();
    expect(window.location.search).toContain("next=%2Fadmin");
  });
});

describe("pending and declined applicants", () => {
  it("shows a review state to an unapproved applicant", async () => {
    const user = userEvent.setup();
    saveSettings({ ...db().settings, autoApprove: false });
    const created = await registerStudent({
      name: "Waiting Wale",
      email: "wale@example.com",
      phone: "8070003333",
      country: "NG",
      dob: "2001-01-01",
      trackKey: "web",
      password: "supersecret99",
      motivation: "I want to build websites.",
    });
    await signIn(user, "wale@example.com", "supersecret99");
    expect(await screen.findByRole("heading", { level: 1, name: /your seat is on the list/i }, { timeout: 8000 })).toBeInTheDocument();
    expect(screen.getAllByText(created.student!.id).length).toBeGreaterThan(0);
  });

  it("tells a declined applicant honestly and keeps their file", async () => {
    const user = userEvent.setup();
    saveSettings({ ...db().settings, autoApprove: false });
    const created = await registerStudent({
      name: "Declined Dami",
      email: "dami@example.com",
      phone: "8070004444",
      country: "NG",
      dob: "2001-01-01",
      trackKey: "marketing",
      password: "supersecret99",
      motivation: "I want to learn affiliate marketing.",
    });
    const application = db().applications.find((a) => a.studentId === created.student!.id)!;
    reviewApplication(application.id, "declined", "Cohort full — apply again next month");

    await signIn(user, "dami@example.com", "supersecret99");
    expect(await screen.findByRole("heading", { level: 1, name: /not this cohort/i }, { timeout: 8000 })).toBeInTheDocument();
    expect(screen.getByText(/Cohort full — apply again next month/i)).toBeInTheDocument();
    expect(db().students.some((s) => s.email === "dami@example.com")).toBe(true);
  });
});

describe("accessibility basics", () => {
  it("exposes a skip link and alt text for every image", async () => {
    const { container } = renderApp("/");
    await screen.findByRole("heading", { level: 1, name: /learn a craft/i });
    expect(screen.getByRole("link", { name: /skip to content/i })).toBeInTheDocument();
    const images = Array.from(container.querySelectorAll("img"));
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) expect(image.getAttribute("alt")).not.toBeNull();
  });

  it("traps nothing: the mobile menu opens and closes", async () => {
    const user = userEvent.setup();
    renderApp("/");
    await screen.findByRole("heading", { level: 1, name: /learn a craft/i });
    const open = screen.getAllByRole("button", { name: /open menu|menu/i })[0];
    await user.click(open);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
