import type { Db, EmailTemplate } from "./types";

/* Transactional email layer — Resend, with an honest mailto fallback.
 *
 * The academy site ships without a mail server. Production sends go through a
 * same-origin serverless function (/api/send-email) that reads RESEND_API_KEY
 * from the deployment's environment. Until Timfire creates the Resend account
 * and sets that key, sendEmail() reports exactly that — it never claims a
 * message was sent when it was not — and returns a pre-filled mailto: link so
 * the message can still go out by hand. Once the key exists, the same call
 * path delivers for real with zero code changes.
 */

export type EmailResult =
  | { ok: true; via: "api" }
  | { ok: false; via: "unconfigured"; mailto: string; detail: string }
  | { ok: false; via: "error"; detail: string; mailto: string };

export function renderTemplate(body: string, vars: Record<string, string | number | undefined>): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = vars[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

export function renderSubject(subject: string, vars: Record<string, string | number | undefined>): string {
  return renderTemplate(subject, vars).replace(/\s+/g, " ").trim();
}

export const DEFAULT_EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  waitlist_received: {
    subject: "You're on the KR8 Academy waitlist",
    body: `<p>Hi {{firstName}},</p>
<p>You're on the waitlist for <strong>{{track}}</strong>. We have your name, email, WhatsApp number ({{whatsapp}}) and country ({{country}}).</p>
<p>Digital-skill registration opens around March–April 2027, with classes beginning 3 May 2027. Waitlisted students hear first — you'll get a priority window of {{priorityHours}} hours before the public.</p>
<p>Academic registration is open now with {{partnerName}}, and training starts in January.</p>
<p>— KR8 Academy</p>`,
  },
  waitlist_opening: {
    subject: "Registration is open for {{track}} — your priority window",
    body: `<p>Hi {{firstName}},</p>
<p>Registration for <strong>{{track}}</strong> is open — and because you waited, you go first. Your priority window is <strong>{{priorityHours}} hours</strong>, before the public doors open.</p>
<p>Register here: {{registerUrl}}</p>
<p>Classes begin {{cohortStart}}. Monday, Wednesday and Friday, 8:00–9:00pm West Africa Time.</p>
<p>— KR8 Academy</p>`,
  },
  application_received: {
    subject: "Your KR8 Academy seat is confirmed — {{kr8Id}}",
    body: `<p>Hi {{firstName}},</p>
<p>Welcome to KR8 Academy. Your place on <strong>{{track}}</strong> is confirmed and your KR8 ID is <strong>{{kr8Id}}</strong>.</p>
<p>Onboarding: {{onboarding}}. Classes begin {{cohortStart}} — Monday, Wednesday and Friday, 8:00–9:00pm West Africa Time.</p>
<p>Keep your KR8 ID safe: it appears on your dashboard, your certificate and the public verification page.</p>
<p>— KR8 Academy</p>`,
  },
  academic_received: {
    subject: "Welcome to KR8 Academics — {{kr8Id}}",
    body: `<p>Hi {{firstName}},</p>
<p>Welcome to KR8 Academics, delivered with <strong>{{partnerName}}</strong> for students preparing for UTME/JAMB, WAEC, NECO and other exams — and for anyone not writing an exam yet.</p>
<p>Your KR8 ID is <strong>{{kr8Id}}</strong>. Training starts in January, and you can join any time.</p>
<p>Classes run Monday, Wednesday and Friday, 8:00–9:00pm West Africa Time, with assignments on Tuesday, Thursday and Saturday.</p>
<p>— KR8 Academy</p>`,
  },
  jamb_verified: {
    subject: "Your UTME result has been verified",
    body: `<p>Hi {{firstName}},</p>
<p>Your official UTME result slip (score {{score}}) has been verified by the academy.</p>
<p>{{awardLine}}</p>
<p>— KR8 Academy</p>`,
  },
  award_pending: {
    subject: "Your KR8 award is pending verification",
    body: `<p>Hi {{firstName}},</p>
<p>Your result qualifies you for <strong>{{tier}}</strong>. Awards stay pending until the academy verifies your official UTME slip against your candidate details.</p>
<p>We'll confirm as soon as verification is complete.</p>
<p>— KR8 Academy</p>`,
  },
  award_approved: {
    subject: "Your KR8 award is approved — {{tier}}",
    body: `<p>Hi {{firstName}},</p>
<p>Congratulations. Your award — <strong>{{tier}}</strong> — has been approved after verification.</p>
<p>The academy team will be in touch about collection. Your name will appear on the KR8 Recognition Wall.</p>
<p>— KR8 Academy</p>`,
  },
  override_recorded: {
    subject: "A result override was recorded for you",
    body: `<p>Hi {{firstName}},</p>
<p>An administrator recorded a graduation override for your profile. Reason: {{reason}}.</p>
<p>Your result stands at {{score}}%. If this is unexpected, reply to {{supportEmail}}.</p>
<p>— KR8 Academy</p>`,
  },
  certificate_issued: {
    subject: "Your KR8 Certificate of Professionalism is ready",
    body: `<p>Hi {{firstName}},</p>
<p>Your certificate for <strong>{{track}}</strong> has been issued. Anyone can verify it at {{verifyUrl}} with your certificate code or KR8 ID.</p>
<p>— KR8 Academy</p>`,
  },
};

export function templateVars(db: Db, base: Record<string, string | number | undefined> = {}) {
  const onboarding = new Date(new Date(db.settings.cohortStart).getTime() - 86_400_000);
  return {
    partnerName: db.settings.partnerName,
    supportEmail: db.settings.supportEmail,
    cohortStart: new Date(db.settings.cohortStart).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    onboarding: onboarding.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    priorityHours: db.settings.waitlistPriorityHours,
    verifyUrl: "https://kr8academy.vercel.app/verify",
    registerUrl: "https://kr8academy.vercel.app/register",
    ...base,
  };
}

function buildMailto(to: string, subject: string, html: string, bcc?: string[]): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const params = new URLSearchParams({ subject, body: text });
  if (bcc && bcc.length) params.set("bcc", bcc.join(","));
  const target = to || (bcc && bcc.length ? bcc[0] : "");
  return `mailto:${encodeURIComponent(target).replace(/%40/g, "@")}?${params.toString()}`;
}

export async function sendEmail(input: { to: string; subject: string; html: string }): Promise<EmailResult> {
  const mailto = buildMailto(input.to, input.subject, input.html);
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.status === 501) {
      const body = (await res.json().catch(() => ({}))) as { configured?: boolean; detail?: string };
      return {
        ok: false,
        via: "unconfigured",
        mailto,
        detail:
          body.detail ??
          "Resend is not configured yet. The academy needs a Resend account and RESEND_API_KEY in the deployment environment; until then, send by hand.",
      };
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { detail?: string };
      return { ok: false, via: "error", mailto, detail: body.detail ?? `Email service responded ${res.status}.` };
    }
    return { ok: true, via: "api" };
  } catch {
    return {
      ok: false,
      via: "error",
      mailto,
      detail: "Could not reach the email service (offline or the endpoint is not deployed). A pre-filled draft is ready to send instead.",
    };
  }
}

/* Waitlist notify: one API send per recipient when Resend is configured; a
 * chunked mailto (BCC, 20 per link) otherwise. Never claims delivery silently. */
export async function notifyWaitlist(
  db: Db,
  trackKey: string,
  recipients: Array<{ name: string; email: string; whatsapp: string; country: string }>,
  templateKey: "waitlist_opening" = "waitlist_opening"
): Promise<{ sent: number; failed: number; via: "api" | "mailto" | "mixed"; mailtoLinks: string[]; detail: string }> {
  const template = db.emailTemplates[templateKey] ?? DEFAULT_EMAIL_TEMPLATES[templateKey];
  const varsBase = templateVars(db, { track: trackKey });
  let sent = 0;
  let failed = 0;
  const mailtoLinks: string[] = [];
  let anyApi = false;
  let anyFallback = false;

  for (const person of recipients) {
    const vars = { ...varsBase, firstName: person.name.split(" ")[0], name: person.name, track: trackKey, whatsapp: person.whatsapp, country: person.country };
    const result = await sendEmail({
      to: person.email,
      subject: renderSubject(template.subject, vars),
      html: renderTemplate(template.body, vars),
    });
    if (result.ok) {
      sent += 1;
      anyApi = true;
    } else {
      failed += 1;
      anyFallback = true;
    }
  }

  // mailto fallback links (chunked BCC) for anything not delivered through the API.
  if (failed > 0) {
    const textVars = varsBase;
    const subject = renderSubject(template.subject, textVars);
    for (let i = 0; i < recipients.length; i += 20) {
      const chunk = recipients.slice(i, i + 20);
      mailtoLinks.push(buildMailto("", subject, renderTemplate(template.body, textVars), chunk.map((r) => r.email)));
    }
  }

  const via = anyApi && !anyFallback ? "api" : anyApi ? "mixed" : "mailto";
  const detail =
    via === "api"
      ? `${sent} waitlist email${sent === 1 ? "" : "s"} sent through Resend.`
      : via === "mixed"
        ? `${sent} sent via Resend; ${failed} could not be sent. Use the draft links below for the remainder.`
        : `Resend is not configured, so nothing was sent automatically. Draft links with BCC are ready — the message leaves your own mail client, never our servers.`;
  return { sent, failed, via, mailtoLinks, detail };
}
