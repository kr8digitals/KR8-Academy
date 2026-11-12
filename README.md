# KR8 Academy

<!-- build v9 -->

The tuition-free school of **KR8 Digitals** — a complete, production-ready web application for the academy side of the brand.

**Live:** https://kr8academy.vercel.app

---

## What this is

A seven-track, cohort-based creative academy web application:

- **Public site** — home, track catalogue, track detail with the full 8-week curriculum, faculty, admissions, story, leaderboard and public credential verification.
- **Registration** — two doors (**Digital Skills** / **Academics**) at `/apply`, a guided registration (identity & location with Nigeria state→LGA dropdowns, education, skills **or** academics, consents), and instant KR8 ID issuance. The complete application packet is available to the in-app registration desk. A `?track=` link pre-selects that track, even if the visitor already started a draft.
- **Student dashboard** — weeks, assignments (submit + feedback), live-session check-in, XP/level/rank, announcements, certificate request and download.
- **Admin console** — students, applications, submission review, attendance control, certificate issuance/revocation, announcements, cohort settings and JSON backup/restore.
- **Daylight theme** — a warm paper-light theme chosen from the visitor's local clock (06:00–18:59 = light) or a tap in the header; photographic and jewel surfaces keep their dark grade in both, every other surface re-inks itself for paper.
- **Outreach** — Admin → **Groups & links** holds every track/cohort/programme link (one edit each, used on welcome messages and profiles); Admin → **Broadcast** sends personalised (`{first}`, `{name}`, `{id}`, `{track}`, `{cohort}`, `{group}`) messages to filtered audiences with a live preview, in-app fan-out, delivery status and CSV export. Duplicate sign-ups (same email, WhatsApp number or name + date of birth) are rejected up front.
- **Certificate engine** — renders the **real KR8 certificate artwork** with the student's name, tier, track, issue date and a scannable QR code; exports PDF and PNG.
- **Verification centre** — anyone can check a KR8 ID or certificate code and see a public, tamper-honest record.

## Programme facts (the single source of truth)

| Fact | Value |
| --- | --- |
| Current intake | **5th Cohort** — registration open |
| Onboarding | **30 April** |
| Classes begin | **3 May** |
| Length | **8 weeks** — weeks 1–4 beginner, weeks 5–8 advanced |
| Classes | **Monday, Wednesday, Friday · 8:00–9:00pm WAT** |
| Assignments | **Tuesday, Thursday, Saturday** — every class is followed by an assignment |

These live in `src/data/academy.ts` (`PROGRAMME`) and `src/lib/store.ts` (`DEFAULT_SETTINGS`), so no page hard-codes a date or a schedule.

The academy data layer lives in `src/lib/store.ts`; the full registration packet is handled by `src/lib/registrar.ts`. Screens use these modules instead of accessing persistence directly, keeping a future hosted-backend migration contained.

---

## Quick start

```bash
npm ci
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
npm test           # 162 unit + integration tests
```

### Seeded accounts

| Role | Login | Password |
| --- | --- | --- |
| Academy admin (founder) | `kr8digitals01@gmail.com` | `KR8@Academy2026` |
| Sample student (graduate) | `grant.gideon@student.kr8digitals.com` | `KR8@Sample2026` |
| Seven more sample students | see **Admin → Students** | `KR8@Sample2026` |

The admin password is seeded for first access only — sign in, then change it under **Dashboard → Profile → Security**.

---

## Architecture

```
src/
  main.tsx                 providers + router
  App.tsx                  routes, lazy loading, auth guards, error boundary
  styles.css               design tokens + component layer (Tailwind v4)
  data/
    academy.ts             tracks, mentors, testimonials, real people & copy
    curriculum.ts          the real 8-week curricula, extracted from the KR8 platform
  lib/
    types.ts               domain model
    store.ts               data layer: auth, XP, certificates, admin ops
    certificate.ts         canvas certificate renderer + QR + PDF (pdf-lib)
    auth.tsx               AuthProvider (session, sign in/up/out)
    hooks.ts               useDb, useReveal, useMediaQuery, …
    seo.ts                 per-route title/meta/canonical/JSON-LD
    toast.tsx              accessible toast system
    utils.ts               dates, validation, levels, clipboard
  components/              Nav/Footer, UI kit, certificate preview, sections, showcase
  pages/                   Home, Tracks, TrackDetail, Mentors, Admissions, About, Verify,
                           CertificatePage, Leaderboard, Login, Apply, Dashboard, Admin, 404
tests/                     store (32) + application (20) + flow (28) + registration (21) + admin tabs, growth & whatsapp tests
public/                    real team photos, certificate artwork, signatures, media, brand
```

### Design system

Warm editorial paper (`#F7F3EC`) with deep plum (`#240730`) and brand magenta (`#D62A9C`), Bricolage Grotesque display type over Inter. Tokens and every reusable class live in `src/styles.css`; there are no one-off colour values in components.

### Data model

`src/lib/store.ts` holds one versioned object under a single key:

```ts
{ version, students, applications, submissions, attendance,
  sessionStates, certificates, certificateRequests, announcements,
  auditLog, settings }
```

Writes are centralised and emit a change event, so every view updates live. Corrupt data falls back to a clean seed. Imports reject backups from a newer schema, migrate older ones, and repair any duplicate certificate codes rather than overwriting accounts.

### XP & graduation

`XP = base + weeks×120 + accepted×80 + attendance×60 + referrals×40` → Newcomer → Apprentice → Practitioner → Craftsperson → Specialist → Master. Certificate eligibility requires ~75% weeks, accepted assignments and live attendance, with the criteria printed on every track page.

### Certificate rendering

Uses the production artwork in `public/cert/` (protected tracks have bespoke templates, newer tracks use the official reusable master). Geometry follows the original production spec — name centred at 41.85% width on the 51.16% baseline, QR badge bottom-right, certificate code and issue date in the footer — then exports lossless PNG and a print-ready PDF.

Every certificate carries a unique serial from a single global register (`KR8-CERT-0001-PROF`, `KR8-CERT-0002-PROF`, …). Serials are never reused, revoked codes stay reserved, and the schema-2 migration repairs duplicate codes in place instead of resetting accounts.

---

## Deployment

`vercel.json` configures the Vite build, SPA rewrites, immutable asset caching and baseline security headers.

```bash
npm run build
npx vercel --prod
```

- Project: `kr8academy` (Vercel), connected to `kr8digitals/KR8-Academy`, build `npm run build`, output `dist`.
- Production branch: `main`; every push rebuilds.
- Live preview: https://kr8academy.vercel.app — `academy.kr8digitals.com` can be attached to the project when ready.

---

## Content provenance

- Team photographs, certificate artwork and signature images come from the KR8 Digitals production repository.
- Curricula, track codes, certification criteria and graduate testimonials are the real KR8 Digitals content.
- Studio and lifestyle photography in `public/img/` was produced for this build.

## Notes & limits

- Export a JSON backup before making major changes; imports reject backups from a newer schema.
- Passwords are salted and hashed with SHA-256 for storage hygiene; this is **not** a substitute for server-side auth. Move authentication to a backend before storing any real personal data.
- Payments/1-on-1 coaching are intentionally out of scope — the academy itself is free.

---

## Registration workflow

Applications are created as learner records and full application packets, then reviewed through Admin → **Registrations**. The registration desk supports search, pathway/status filters, WhatsApp/phone/email contact shortcuts, pipeline changes and CSV export. No database is provisioned for this iteration. The Vercel preview keeps data within the browser profile that created it and does not synchronize accounts or applications across devices; do not use the preview for sensitive real-world applications. Export a backup before clearing browser data.

## Growth, messaging & integrations

These features ship built but switch on with environment keys — nothing here pretends to be live before it is.

### Sign-in & onboarding
- `/join` — create an account with **Google** or a **WhatsApp one-time code**; `/onboard` collects the profile (real name as it should appear on the certificate, date of birth, nickname optional), mints the permanent KR8 ID (`KR8-YY-XXXXX`), and respects the learner's optional programme-message consent. Google sign-ups are asked for their WhatsApp number; WhatsApp sign-ups are asked for their email. Certificates carry the real name.
- **Google sign-in** needs a Google Cloud OAuth **Web application** client. Set `VITE_GOOGLE_CLIENT_ID` in the Vercel project env and redeploy. Without it, Google sign-in is unavailable; visitors can use WhatsApp sign-in or go straight to the application form — the UI never fakes a login.
- **WhatsApp codes** ride `POST /api/send-whatsapp` (Meta WhatsApp Cloud API). Set `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` to deliver them; until then the code is shown inline on screen so the flow is fully usable, and every send is queued to the outbox instead of going into the void.
- **Transactional email** (waitlist/application/certificate confirmations) rides `POST /api/send-email` (Resend). Set `RESEND_API_KEY` and verify the sending domain to deliver; until then messages report exactly that and fall back to a pre-filled mailto — never a fake “sent”.

### Notifications & nudges
- In-app feed everywhere (dashboard → Notifications, bell in the header). Admins send nudges from **Overview → Who is showing up** or with the Nudge panel; `{first}` personalises each message.
- **WhatsApp deep links** (always on): one tap opens WhatsApp with the message pre-filled to the student's registered number.
- **Automatic WhatsApp**: set `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` (Meta for Developers → WhatsApp Cloud API — free tier exists; business-initiated sends need a 24h window or an approved template) to enable `POST /api/send-whatsapp`. The admin sees its live status under Admin → Security → Messaging & delivery.

### Monthly spotlight (Designer/Editor/Builder of the Month)
Published criteria: ≥6 class attendances and ≥4 assignment submissions in the month. Admin → **Spotlight** crowns the discipline winner; the cohort is notified, an announcement is pinned, and the name shows up on their profile, the leaderboard, and The Wall.

### Newsletter
Optional programme messages are only sent when the learner opts in. Newsletter subscriptions are not automatic.
