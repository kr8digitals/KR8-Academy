import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import App from "../src/App";
import { AuthProvider } from "../src/lib/auth";
import { ToastProvider } from "../src/lib/toast";
import { db, reseed, submitAssignment } from "../src/lib/store";

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

async function signIn(user: ReturnType<typeof userEvent.setup>, identifier: string, password: string) {
  renderApp("/login");
  await user.type(await screen.findByLabelText(/KR8 ID, email or phone/i), identifier);
  await user.type(screen.getByLabelText(/^password$/i), password);
  await user.click(screen.getByRole("button", { name: /^sign in$/i }));
}

const SAMPLE_EMAIL = "grant.gideon@student.kr8digitals.com";

describe("marketing pages", () => {
  it("renders the home page with hero, tracks and the verification widget", async () => {
    renderApp("/");
    expect(await screen.findByRole("heading", { level: 1, name: /learn a craft/i })).toBeInTheDocument();
    expect(screen.getAllByText(/tuition-free school of KR8 Digitals/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Graphic Design/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/KR8 ID or certificate code/i)).toBeInTheDocument();
  });

  it("renders every public route without crashing", async () => {
    const routes: { path: string; heading: RegExp }[] = [
      { path: "/tracks", heading: /pick the craft you want to be paid for/i },
      { path: "/tracks/frontend-development", heading: /front-end development/i },
      { path: "/mentors", heading: /practitioners, not lecturers/i },
      { path: "/admissions", heading: /your seat is free|join the waitlist/i },
      { path: "/about", heading: /talent is everywhere/i },
      { path: "/leaderboard", heading: /showing up is the strategy/i },
      { path: "/verify", heading: /check the credential, not the claim/i },
    ];
    for (const route of routes) {
      const { unmount } = renderApp(route.path);
      expect(await screen.findByRole("heading", { level: 1, name: route.heading })).toBeInTheDocument();
      unmount();
    }
  });

  it("shows the real curriculum on a track page", async () => {
    renderApp("/tracks/graphic-design");
    expect(await screen.findByRole("heading", { level: 1, name: /graphic design/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Design Basics/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/The certificate is earned, not bought/i)).toBeInTheDocument();
  });

  it("renders a branded 404 for unknown routes", async () => {
    renderApp("/this-does-not-exist");
    expect(await screen.findByRole("heading", { level: 1, name: /this room is empty/i })).toBeInTheDocument();
  });
});

describe("authentication", () => {
  it("rejects a wrong password with a visible error", async () => {
    const user = userEvent.setup();
    renderApp("/login");
    await user.type(await screen.findByLabelText(/KR8 ID, email or phone/i), SAMPLE_EMAIL);
    await user.type(screen.getByLabelText(/^password$/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/not correct/i);
  });

  it("signs a student in and opens their dashboard", async () => {
    const user = userEvent.setup();
    await signIn(user, SAMPLE_EMAIL, "KR8@Sample2026");
    expect(await screen.findByRole("heading", { level: 1, name: /welcome back/i }, { timeout: 8000 })).toBeInTheDocument();
    expect(screen.getByText(/KR8 Academy · Student identity/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /^curriculum$/i }).length).toBeGreaterThan(0);
  });

  it("signs the admin in and lands on the admin console", async () => {
    const user = userEvent.setup();
    await signIn(user, "kr8digitals01@gmail.com", "KR8@Academy2026");
    expect(await screen.findByText(/The academy at a glance/i, {}, { timeout: 8000 })).toBeInTheDocument();
    expect(screen.getByText(/Admin console/i)).toBeInTheDocument();
  });

  it("guards the dashboard when signed out", async () => {
    renderApp("/dashboard");
    expect(await screen.findByRole("heading", { level: 1, name: /welcome back/i })).toBeInTheDocument();
    expect(screen.queryByText(/Student identity/i)).not.toBeInTheDocument();
  });
});

describe("student dashboard", () => {
  it("marks a week complete and persists it", async () => {
    const user = userEvent.setup();
    await signIn(user, SAMPLE_EMAIL, "KR8@Sample2026");
    await screen.findByRole("heading", { level: 1, name: /welcome back/i });
    await user.click(screen.getAllByRole("link", { name: /^curriculum$/i })[0]);
    expect(await screen.findByText(/week by week/i)).toBeInTheDocument();

    const before = db().students.find((s) => s.email === SAMPLE_EMAIL)!.weeksDone.length;
    const toggles = screen.getAllByRole("button", { name: /mark week .* incomplete/i });
    await user.click(toggles[toggles.length - 1]);
    await waitFor(() => {
      const after = db().students.find((s) => s.email === SAMPLE_EMAIL)!.weeksDone.length;
      expect(after).toBe(before - 1);
    });
  });

  it("shows the issued certificate in the certificate tab", async () => {
    const user = userEvent.setup();
    await signIn(user, SAMPLE_EMAIL, "KR8@Sample2026");
    await screen.findByRole("heading", { level: 1, name: /welcome back/i });
    await user.click(screen.getAllByRole("link", { name: /^certificate$/i })[0]);
    expect(await screen.findByText(/Proof you can hand to a client/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view & download/i })).toBeInTheDocument();
  });

  it("submits work for a week with no submission yet", async () => {
    const user = userEvent.setup();
    await signIn(user, SAMPLE_EMAIL, "KR8@Sample2026");
    await screen.findByRole("heading", { level: 1, name: /welcome back/i });
    await user.click(screen.getAllByRole("link", { name: /^assignments$/i })[0]);
    expect(await screen.findByText(/Submit the work/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^week$/i), "8");
    await user.type(screen.getByLabelText(/Deliverable title/i), "Final portfolio");
    await user.type(screen.getByLabelText(/Link to your work/i), "https://example.com/final");
    await user.click(screen.getByRole("button", { name: /submit week 8/i }));

    await waitFor(() => {
      const student = db().students.find((s) => s.email === SAMPLE_EMAIL)!;
      expect(db().submissions.filter((s) => s.studentId === student.id && s.week === 8)).toHaveLength(1);
    });
  });
});

describe("application flow", () => {
  it("validates step one before advancing", async () => {
    const user = userEvent.setup();
    renderApp("/apply");
    await user.click(await screen.findByRole("button", { name: /continue/i }));
    expect(screen.getByText(/Enter your full name/i)).toBeInTheDocument();
    expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
  });

  it("completes a full application and issues a KR8 ID", async () => {
    const user = userEvent.setup();
    renderApp("/apply");

    await user.type(await screen.findByLabelText(/Full name/i), "Ada Nwosu");
    await user.type(screen.getByLabelText(/Email address/i), "ada.nwosu@example.com");
    await user.type(screen.getByLabelText(/Phone \(WhatsApp preferred\)/i), "8031234567");
    await user.type(screen.getByLabelText(/^City/i), "Aba");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await user.click(await screen.findByRole("button", { name: /Front-End Development/i }));
    await user.type(screen.getByLabelText(/What do you want to build/i), "I want to build production React interfaces for clients.");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    const dob = await screen.findByLabelText(/Date of birth/i);
    fireEvent.change(dob, { target: { value: "2001-04-12" } });
    await user.type(screen.getByLabelText(/Create a password/i), "supersecret99");
    await user.type(screen.getByLabelText(/Confirm password/i), "supersecret99");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /submit application/i }));

    expect(await screen.findByText(/You.re in\./i, {}, { timeout: 8000 })).toBeInTheDocument();
    const created = db().students.find((s) => s.email === "ada.nwosu@example.com");
    expect(created?.id).toMatch(/^KR8-\d{4}-FEDVFD-\d{4}$/);
    expect(screen.getAllByText(created!.id).length).toBeGreaterThan(0);
  });

  it("blocks a duplicate email with a helpful message", async () => {
    const user = userEvent.setup();
    renderApp("/apply");
    await user.type(await screen.findByLabelText(/Full name/i), "Grant Again");
    await user.type(screen.getByLabelText(/Email address/i), SAMPLE_EMAIL);
    await user.type(screen.getByLabelText(/Phone \(WhatsApp preferred\)/i), "8055555555");
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(await screen.findByRole("button", { name: /Graphic Design/i }));
    await user.type(screen.getByLabelText(/What do you want to build/i), "Testing the duplicate guard on registration.");
    await user.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.change(await screen.findByLabelText(/Date of birth/i), { target: { value: "1999-02-02" } });
    await user.type(screen.getByLabelText(/Create a password/i), "supersecret99");
    await user.type(screen.getByLabelText(/Confirm password/i), "supersecret99");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /submit application/i }));

    expect(await screen.findByText(/already exists/i, {}, { timeout: 8000 })).toBeInTheDocument();
    expect(db().students.filter((s) => s.email === SAMPLE_EMAIL)).toHaveLength(1);
  });
});

describe("verification", () => {
  it("verifies a real certificate code and offers the download", async () => {
    const user = userEvent.setup();
    const certificate = db().certificates[0];
    renderApp("/verify");
    await user.type(await screen.findByLabelText(/KR8 ID or certificate code/i), certificate.code);
    await user.click(screen.getByRole("button", { name: /verify credential/i }));

    expect(await screen.findByText(/Verified by KR8 Academy/i)).toBeInTheDocument();
    expect(screen.getAllByText(certificate.studentNameSnapshot).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /view & download/i })).toBeInTheDocument();
  });

  it("stays honest when a code does not exist", async () => {
    const user = userEvent.setup();
    renderApp("/verify");
    await user.type(await screen.findByLabelText(/KR8 ID or certificate code/i), "KR8-FAKE-0000");
    await user.click(screen.getByRole("button", { name: /verify credential/i }));
    expect(await screen.findByText(/No record found/i)).toBeInTheDocument();
  });

  it("renders the public certificate page for a valid code", async () => {
    const certificate = db().certificates[0];
    renderApp(`/certificate/${encodeURIComponent(certificate.code)}`);
    expect(await screen.findByRole("heading", { level: 1, name: /certificate/i })).toBeInTheDocument();
    const details = screen.getByText(/Credential details/i).closest("div")!;
    expect(within(details).getByText(certificate.code)).toBeInTheDocument();
  });
});

describe("admin console", () => {
  it("renders every admin section for the founder", async () => {
    const user = userEvent.setup();
    await signIn(user, "kr8digitals01@gmail.com", "KR8@Academy2026");
    await screen.findByText(/The academy at a glance/i, {}, { timeout: 8000 });

    const sections: [string, RegExp][] = [
      ["Students", /enrolled accounts/i],
      ["Applications", /Admissions queue/i],
      ["Certificates", /credential register/i],
      ["Announcements", /Talk to the cohort/i],
      ["Settings", /Cohort configuration/i],
    ];
    for (const [label, expected] of sections) {
      const links = screen.getAllByRole("link", { name: new RegExp(`^${label}$`, "i") });
      await user.click(links[0]);
      expect(await screen.findByText(expected, {}, { timeout: 5000 })).toBeInTheDocument();
    }
  });

  it("reviews a pending submission and accepts it", async () => {
    const user = userEvent.setup();
    const student = db().students.find((s) => s.email === SAMPLE_EMAIL)!;
    submitAssignment({ studentId: student.id, week: 8, title: "Pending review item", url: "https://example.com/pending" });
    const pendingBefore = db().submissions.filter((s) => s.status === "submitted").length;
    expect(pendingBefore).toBeGreaterThan(0);

    await signIn(user, "kr8digitals01@gmail.com", "KR8@Academy2026");
    await screen.findByText(/The academy at a glance/i, {}, { timeout: 8000 });

    await user.click(screen.getAllByRole("link", { name: /^Submissions$/i })[0]);
    expect(await screen.findByText(/Review queue/i)).toBeInTheDocument();

    const reviewButtons = await screen.findAllByRole("button", { name: /^review$/i });
    await user.click(reviewButtons[0]);
    expect(await screen.findByText(/Review submission/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Written feedback/i), "Strong work — tighten the margins and resubmit.");
    await user.click(screen.getByRole("button", { name: /save review/i }));

    await waitFor(() => {
      expect(db().submissions.filter((s) => s.status === "submitted").length).toBe(pendingBefore - 1);
    });
  });

  it("issues a certificate from the admin console", async () => {
    const user = userEvent.setup();
    const student = db().students.find((s) => s.sample)!;
    // remove their credentials so a fresh one can be issued
    db().certificates = db().certificates.filter((c) => c.studentId !== student.id);

    await signIn(user, "kr8digitals01@gmail.com", "KR8@Academy2026");
    await screen.findByText(/The academy at a glance/i, {}, { timeout: 8000 });
    await user.click(screen.getAllByRole("link", { name: /^Certificates$/i })[0]);
    expect(await screen.findByText(/The credential register/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^Student$/i), student.id);
    await user.click(screen.getByRole("button", { name: /issue certificate/i }));

    await waitFor(() => {
      const issued = db().certificates.filter((c) => c.studentId === student.id && !c.revoked);
      expect(issued).toHaveLength(1);
    });
  });
});
