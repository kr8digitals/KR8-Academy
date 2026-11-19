# KR8 Academy — Deep Audit

**Auditor:** Senior director / full-stack & UX review
**Date:** 13 November 2026
**Commit audited:** `866f31b` (branch `arena/9b506e39-kr8-academy`)
**Scope:** frontend architecture, backend & data layer, UI system, UX flows, content, responsive behaviour, accessibility, performance, security, SEO, ops.
**Method:** full source read (26,747 LOC across `src/`, `api/`, `tests/`), production build, full test run, dependency and bundle analysis, WCAG contrast computation on the real token values, live dev-server route probing.

---

## 1. Executive summary

This is **not** a brochure site with a form bolted on. It is a genuinely ambitious product: 21 routes, 12 admin surfaces, a real certificate engine (canvas + QR + PDF), a TOTP second factor, a role/capability matrix, an offline-first data layer with schema migrations, and 163 passing tests. The craft in the CSS and copywriting is well above what most agencies ship.

But there are **five findings that must be treated as blocking before this handles a single real applicant**, and they are architectural, not cosmetic:

| # | Finding | Severity |
|---|---|---|
| 1 | **Authentication, authorisation, and all personal data live in `localStorage`.** Any visitor can mint themselves an `owner` account from the browser console in about 20 seconds. | 🔴 Blocker |
| 2 | **The WhatsApp OTP — the primary sign-in mechanism — is not an authentication control.** The code is written to `localStorage` and displayed on screen when the API isn't configured. The identity you "prove" is whatever phone number you typed. | 🔴 Blocker |
| 3 | **The public "verify a credential" page returns data from the visitor's own browser, not a central register.** A certificate is only "verified" on the device that issued it. The entire trust claim on the homepage is currently unfalsifiable. | 🔴 Blocker |
| 4 | **The owner password and an admin demo login are printed on the public `/login` page**, alongside the founder's personal phone number in the seed. | 🔴 Blocker |
| 5 | **The site ships 107 MB of media**, including 21 testimonial videos (~100 MB) that are all eagerly declared in the JS bundle. First paint on a 3G connection is effectively broken. | 🟠 Critical |

Everything else in this document is graded below that line. The good news: findings 1–3 are a *migration*, not a rewrite — the data layer is already cleanly isolated behind `src/lib/store.ts`, the domain model is well-typed in `src/lib/types.ts`, and the UI never talks to persistence directly. That discipline was the expensive part; honour it now.

**Overall grade: B− as a portfolio / demo. D as a production system that takes real applications.**

---

## 2. Scorecard

| Area | Grade | One-line verdict |
|---|---|---|
| Architecture & code organisation | **A−** | Outstanding separation of concerns for a repo this size; a few god-files. |
| Type safety & build hygiene | **A** | `tsc -b` clean, strict project refs, zero `any` leakage in app code, no TODOs, no stray `console.log`. |
| Test coverage | **B+** | 163 tests, fast, meaningful — but all jsdom. No browser, no E2E, no visual regression, no CI gate. |
| Backend / data layer | **F** (as a backend) | There is no backend. `api/` is 3 stateless proxies; everything real is client-side. |
| Security & privacy | **F** | Client-side auth, client-side authz, plaintext DB in `localStorage`, no CSRF/rate-limit story, secrets-in-UI. |
| UI craft & design system | **A−** | Strong tokens, consistent radii, real typographic hierarchy. Undermined by three competing visual languages. |
| UX flows | **B** | The two-door apply flow and admin console are genuinely well designed. Registration friction and copy contradictions hurt. |
| Content & copywriting | **A−** for voice, **C** for consistency | The writing is the best asset on the site. The facts contradict each other in ~8 places. |
| Responsiveness | **B** | Mobile-first rules are thorough; a few overflow and stacking risks. |
| Accessibility | **C+** | Real effort (skip link, `sr-only`, `role=alert`, a11y-aware modals) with systemic gaps (focus trap, `aria-describedby`, `role=tab` misuse, contrast). |
| Performance | **D** | 511 KB gzip JS+CSS on first load, 107 MB media, no `srcset`, no image dimensions, 384 KB of fonts. |
| SEO | **B** | Good titles/meta/JSON-LD/sitemap. Client-rendered HTML means crawlers see an empty shell; `/apply` has 4 `<h1>`s. |
| **Production readiness** | **F** | Cannot be launched as-is for real applicants. See §1. |

---

## 3. What is genuinely excellent (keep it)

1. **The data layer boundary.** `src/lib/store.ts` is the only module that touches persistence. `useDb()` subscribes via `useSyncExternalStore`, writes emit a change event, and every view is live. This is exactly the abstraction that makes the migration in §5 tractable. Do not let pages start calling `localStorage` directly.

2. **Schema migration discipline.** `SCHEMA_VERSION = 3`, a `PRE_V3_BACKUP_KEY` safety copy before migration, `fillV3()` repairs partial/older payloads, duplicate certificate serials are repaired *in place* rather than resetting accounts, and imports reject a newer schema. Most teams do not think this hard until after their first data-loss incident.

3. **The certificate engine.** Real artwork per track, a documented geometry spec (name at 41.85% width on the 51.16% baseline), a global monotonic serial register (`KR8-CERT-0001-PROF`), lossless PNG + print-ready PDF via `pdf-lib`, and a QR that resolves to the verification page. This is production-grade thinking.

4. **The role/capability matrix** (`src/lib/permissions.ts`) is clean and legible — owner/admin/coach/reviewer/editor with a documented capability list and a "two owners minimum" rule. The UI, however, doesn't enforce it (see §6.4).

5. **Honest failure states.** The email and WhatsApp adapters answer `501 { configured: false }` and the UI *says so* rather than faking a "sent" tick. The `/api/stats` endpoint emits `pendingReview: true` instead of inventing numbers. That ethic is rare and should be protected.

6. **Design tokens.** A real token map (`--color-*` ladder) declared in `@theme`, with a computed light theme that re-inks every semantic surface. `html[data-theme="light"] :is(.on-dark, .ink-panel, …)` re-declaring tokens so photographic surfaces keep their dark grade is a genuinely clever technique.

7. **Accessibility intent.** Skip link, `useLockBodyScroll`, Escape handlers on modals, focus-to-first-field on open, `role="alert"` on errors, `aria-live` toasts, `<track kind="captions">` on testimonial videos with 21 real `.vtt` files. The intent is there — the execution has gaps (§9).

---

## 4. Backend & data layer

### 4.1 There is no backend — and the README says otherwise

`api/` contains exactly three files:

| File | What it actually does |
|---|---|
| `send-email.ts` | Stateless proxy → Resend. No auth, no rate limit. |
| `send-whatsapp.ts` | Stateless proxy → Meta Graph API. No auth, no rate limit. |
| `stats.ts` | Reads three env vars and returns them. |

There is **no database, no session store, no identity provider, no server-side authorisation, no audit trail that a user cannot delete.** `grep -r supabase` returns nothing. The `supabase` connector is enabled on this conversation but the code has no Supabase client, no schema, no migrations, no RLS policies. The Vercel + Supabase stack is available and unused.

The README's own "Notes & limits" is refreshingly candid about this ("this is **not** a substitute for server-side auth… do not use the preview for sensitive real-world applications") — but the *product* does not behave that way. It presents a working admin console, a working certificate register, and a working verification centre, then quietly stores all of it in one browser.

### 4.2 The whole database is 40 KB of plaintext JSON

I instrumented the live seed:

```
DB JSON bytes: 39,803  ≈ 0.04 MB
students: 9   submissions: 33   attendance: 43
certificates: 3   applications: 8
```

It lives at `localStorage["kr8.academy.db.v1"]` — readable by any script on the origin, by anyone with devtools, and by anyone who can get a user to run a snippet. Every password hash, salt, date of birth, phone number, motivation essay and certificate record is in that blob.

Two more consequences:

- **The "database" is per-browser-profile.** An admin on a laptop cannot see an application submitted on a phone. Import/export JSON is the only sync mechanism, and it is manual.
- **It will not scale past a few hundred records.** `localStorage` caps around 5 MB per origin. At roughly 650 bytes per student plus submissions and attendance, you hit the ceiling in the low thousands of records — and every `mutate()` re-serialises the *entire* database and dispatches a global event that re-renders every subscribed view. That is O(n) writes and O(n) renders per click.

### 4.3 Authentication is theatre

```ts
// src/lib/store.ts
const modern = await hashPassword(password, student.passwordSalt); // SHA-256("kr8::salt::password")
const legacy = hashSyncSeed(password, student.passwordSalt);      // FNV-1a, 3 rounds
if (modern !== student.passwordHash && legacy !== student.passwordHash) return { ok: false, … };
```

Specific problems:

- **Unsalted-per-iteration SHA-256** with a single round. GPU-bruteforceable at billions/sec. (Documented as "storage hygiene", which is honest, but it is the only line of defence.)
- **A legacy FNV-1a fallback is accepted forever** and produces a 64-char hex string. It is *weaker than SHA-256* and is still honoured for every account. Remove it after one forced reset.
- **Sessions are a bare `studentId` in `localStorage`:**
  ```ts
  localStorage.setItem("kr8.academy.session.v1", JSON.stringify({ studentId, issuedAt }))
  ```
  No signature, no expiry check on read (`issuedAt` is written but never validated), no rotation. Setting that key to `"KR8-FOUNDER-TIMFIRE"` makes you the owner. There is no `httpOnly` cookie, no CSRF token, no re-auth for destructive actions.
- **Authorisation is a React `if`:**
  ```tsx
  if (admin && !isAdmin) return <Navigate to="/dashboard" replace />;
  ```
  This is UI, not access control. The admin console, the JSON export of every applicant, the certificate issuer and the "delete student" action are all reachable by calling the store functions directly.
- **`mustChangePassword` is a banner, not a gate.** It is read once (`Dashboard.tsx:182`) and never enforced; there is no route that requires it to be cleared.

### 4.4 The OTP flow is not an authentication control

`src/lib/wa-otp.ts` is well written for what it is — SHA-256 code hash, 10-minute TTL, 5 attempts, 30-second resend cooldown, all stored in `localStorage`. But:

- The record is **client-side**, so attempts and TTL are advisory. Clearing storage resets the attempt counter.
- **When WhatsApp is not configured, the code is returned inline and rendered on screen** (`inlineCode`) so "nobody is stranded". For a *demo* that's thoughtful. For *authentication* it means anyone can log in as any phone number they know — including `+2348125687509`, the founder's number in the seed.
- The code is derived from `crypto.getRandomValues` — fine — but the binding between "I received this code" and "I am this person" is only as strong as the delivery channel, and the delivery channel is bypassable by design.

### 4.5 The public API endpoints are unauthenticated relay services

```ts
// api/send-whatsapp.ts — no auth of any kind
const to = String(body.to ?? "").replace(/\D/g, "");
const text = String(body.text ?? "").trim();
… fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, …)
```

Once `WHATSAPP_TOKEN` is set, **`POST /api/send-whatsapp` is an open SMS/WhatsApp gateway.** Anyone can send arbitrary text to any number from KR8's verified business account, burning the paid conversation quota and — far worse — phishing under the KR8 name with a real KR8 sender ID. There is no origin check, no shared secret, no rate limit, no per-IP cap, no template allowlist.

`api/send-email.ts` has the same shape: no auth, up to **100 recipients per call**, arbitrary `subject` and up to 100 KB of arbitrary `html`. That is an open relay for branded phishing from `academy@kr8digitals.com`, and a fast way to get the sending domain blacklisted.

Minimum fix, today, before any env key is set: require a shared secret header AND an `Origin` allowlist AND a per-IP token-bucket AND a template allowlist (server renders the bodies, client passes `{template, vars}` only).

### 4.6 `api/stats.ts` has a documented key that isn't used

`.env.example` declares `STATS_API_KEY`, but `stats.ts` never reads it — it's wide open with `Access-Control-Allow-Origin: *`. Harmless for aggregate counters, confusing for whoever wires it up next. Either remove the var or use it.

### 4.7 Environment & secrets

- `.env.example` is correct and `.env*` is gitignored. Good.
- `VITE_GOOGLE_CLIENT_ID` is a public value — fine — but the Google flow (`src/lib/google.ts`) is client-only, so there is no code-exchange, no server-side ID-token verification, no nonce. It is decorative until moved behind a backend.
- **The founder's personal mobile (`+2348125687509`) and email (`kr8digitals01@gmail.com`) are in the seed** and rendered on public pages (`Login` demo panel, mentor card mailto).
- **The `DEFAULT_SETTINGS` seed date functions are calendar-hardcoded:**
  ```ts
  function nextCohortStartISO() { … new Date(…, 4, 3, 20, 0, …) } // 3 May
  function nextOnboardingISO() { … }                              // 30 April
  ```
  These silently roll forward a year each May, so the site will keep saying "classes begin 3 May" forever with the *wrong* year in the "5th Cohort" label.

---

## 5. The migration you should actually do

The good news: because the store is isolated, this is a bounded piece of work. Recommended shape, in order:

1. **Supabase schema + RLS.** Tables: `profiles`, `students`, `applications`, `submissions`, `attendance`, `certificates`, `announcements`, `settings`, `audit_log`. Row-level security keyed on `auth.uid()`; admin policies driven by a `role` column read from `profiles`. This single step kills findings 1, 2, 3, 5, 6, 7 in one move.
2. **Move `store.ts` behind an async repository interface.** It is already the only module touching persistence. Change its signatures to `Promise`-returning (some already are) and keep `useDb()` as the subscriber — the pages don't need to change.
3. **Certificates: move verification server-side.** `GET /api/verify/:code` reads the `certificates` table. A revoked code returns 410. The current page will barely change; what changes is that it becomes *true*.
4. **Sessions → Supabase Auth**, with the existing TOTP re-implemented as a Supabase MFA factor (or keep your `totp.ts` and store the secret server-side).
5. **One-time import path** for any existing `localStorage` payload, admin-only, with the existing JSON backup as the transport.

Realistic effort: **2–3 focused weeks.** Everything after this section becomes polish.

---

## 6. Frontend architecture

### 6.1 Structure — strong, with three god-files

```
src/  13 components · 21 pages · 12 admin tabs · 21 lib modules
```

Clean layering (`pages → components → lib → data`), lazy-loaded routes, per-route `manualChunks`, an `ErrorBoundary` around everything, and a `RequireAuth` guard component. Genuinely tidy.

The exceptions:

| File | LOC | Problem |
|---|---|---|
| `src/lib/store.ts` | **2,795** | Auth + students + submissions + attendance + certificates + awards + exams + waitlist + groups + broadcast + content + settings + migration + seed. Split into `store/{auth,students,learning,credentials,ops,migrate}.ts`. |
| `src/pages/Admin.tsx` | **1,349** | 12 of the 19 admin tabs are inline here while 12 others live in `pages/admin/`. Inconsistent and unwieldy. |
| `src/pages/Dashboard.tsx` | **1,278** | Same pattern; the student dashboard is one file doing everything. |
| `src/styles.css` | **1,765** | 387 hex literals, 173 unique. See §7.2. |

### 6.2 Bundle: 511 KB gzip before a single byte of content

```
index (app shell)          411 KB → 126 KB gz
documents (pdf-lib+qrcode) 456 KB → 188 KB gz   ← in the static import graph
Admin                      190 KB →  46 KB gz
react                      52 KB →  18 KB gz
CSS                       167 KB →  28 KB gz
fonts (13 woff2)             384 KB raw        ← 3 families, 5 subsets each
```

Note that `documents` (456 KB) is listed as its own chunk but **`CertificatePreview` is statically imported by `Verify.tsx`, which is a public route** — so `pdf-lib` + `qrcode` are pulled into the initial graph for anyone who opens the verification page. `manualChunks` splits the *file*, not the *load*. Fix: `const CertificatePreview = lazy(() => …)` inside Verify.

Also: `tailwind-merge` is a dependency but `cn()` is a naive `parts.filter(Boolean).join(" ")` — you're paying for a package you don't use (and you have no class-conflict resolution, which is why there are `!important` escape hatches in the CSS).

### 6.3 Data-fetching and state

`useSyncExternalStore` over a module-level `version` counter is a clean, modern choice. Two caveats:

- **Every mutation re-renders every subscriber** (the counter increments globally), including admin pages that are subscribed but off-screen. Fine at 9 students; not fine at 900.
- `useDb()` returns the whole `Db` object, so no component can memoise on a slice. A selector API (`useDb(s => s.students)`) would be a cheap win.

### 6.4 Authorisation matrix exists but is never consulted

`src/lib/permissions.ts` defines a beautiful capability matrix and `TAB_CAPABILITY` map. **`grep` shows it is imported in exactly one place — `auth.tsx`, for `isStaffRole` only.** Consequences:

- A `coach` (attendance + submissions *only*) sees and uses **Security**, **Backup & restore**, **Settings**, **Certificates**, **Awards**, **Content** — all 19 tabs.
- A `reviewer` (read-only) can issue certificates.
- The only real gate is `isAdmin` (any non-student role) at the route level, plus `isOwner` on two student-management buttons.

This is a 30-line fix (`SECTIONS.filter(s => can(role, TAB_CAPABILITY[s.id]))` + a guard in the render switch) that the code was already designed for.

### 6.5 Error handling

`ErrorBoundary` catches render errors and shows a friendly screen — good. But:

- **No error reporting.** No Sentry, no LogRocket, no `window.onerror` beacon. A user-facing crash emails you nothing; the message literally tells the user "Your account data is safe — try again", which you cannot know.
- **No offline/network handling** anywhere. `fetch` failures in `email.ts` / `whatsapp.ts` are caught and turned into messages, which is fine, but there is no global "you're offline" state.
- **No analytics at all.** No GA4, no Plausible, no Vercel Analytics. You cannot answer "how many people started the application and dropped at step 3?" — which is the single most valuable number this site could produce.

---

## 7. UI & design system

### 7.1 What works

The typographic system is confident: Fraunces display for editorial voice, Inter for UI, Bricolage as fallback, `text-wrap: balance` on headings, optical sizing on, real `display-xl / -lg / -md / -sm` scale, `eyebrow` micro-caps with a leading rule, and a restrained radius ladder (`--radius-card: 18px`, `999px` pills). The dark "jewel" palette (obsidian → plum → magenta → cyan) is distinctive and clearly brand-owned. The certificate surface is deliberately protected from theme switching — a nice piece of long-term thinking.

### 7.2 There are three visual languages fighting

1. **Brand jewel** (dark plum, magenta, Fraunces) — dashboard, admin, skill pages, verification.
2. **Warm paper** (`#f7f2ea`, plum ink, magenta accents) — the light theme, applied globally.
3. **Editorial studio** (cream `#f5f2e9`, ink `#17201b`, **acid lime `#d8fa52`**, Georgia serif) — the homepage.

The third is a *different brand*. It introduces a colour (`#d8fa52`) and a typeface (Georgia/Times) that appear nowhere else, and `styles.css` then has to **retrofit the global nav onto it with `!important`**:

```css
.academy-nav { color: #17201b !important; background: #f5f2e9 !important; … }
.academy-nav .text-white { color: #17201b !important; }
.academy-nav .theme-toggle { … !important; }
```

That block (lines 1685–1693) is a warning sign: the homepage is overriding the design system instead of using it. Add to that:

- **The dark theme has no effect on the homepage.** `.home-reimagined` hardcodes `--hr-paper: #f5f2e9` and there is **zero** `html[data-theme="dark"] .home-*` rule. Tap the theme toggle on `/` in dark mode: the nav flips to lime-on-cream and the page body stays light. The toggle looks broken.
- **387 hex literals / 173 unique colours** in one stylesheet, against a documented "no one-off colour values" claim in the README. The 900-pixel block of theme overrides exists precisely because the component styles bypass the tokens.
- **Homepage body copy is below AA**: `--hr-muted: #68726a` on `#f5f2e9` = **4.46:1** (fails 4.5 for body text), `#718044` track category on white = **4.24:1**, and the search placeholder `#879187` = **2.92:1** (fails everything).

**Recommendation:** pick one. Either the homepage becomes a tokenised "paper" variant of the brand system (recommended — the editorial voice survives, the lime becomes `--color-accent`), or the whole site adopts the studio palette. Do not keep two.

### 7.3 Contrast audit (computed on real token values)

| Pair | Ratio | Verdict |
|---|---|---|
| `#e4dbef` body on `#0d0015` base | 15.25:1 | ✅ |
| `#b9adcb` muted on base | 9.63:1 | ✅ |
| `#9c8fb0` muted-2 on raised `#160829` | 6.33:1 | ✅ |
| `#ff5bd8` magenta-bright on base | 7.53:1 | ✅ |
| white on `btn-primary` gradient start `#cf1cae` | 4.74:1 | ✅ (just) |
| white on gradient mid `#b429c9` | 5.12:1 | ✅ |
| light `#6b5a78` muted on paper | 5.61:1 | ✅ |
| light **`#85749a` muted-2 on paper** | **3.80:1** | ⚠️ fails AA for text |
| light **`#85749a` muted-2 on white card** | **4.23:1** | ⚠️ fails AA |
| light **cyan `#0e7c93` on paper** | **4.36:1** | ⚠️ fails AA |
| home **`#68726a` muted on `#f5f2e9`** | **4.46:1** | ⚠️ fails AA (body copy) |
| home **`#718044` category on white** | **4.24:1** | ⚠️ fails AA (small caps) |
| home **search placeholder `#879187`** | **2.92:1** | 🔴 fails |

The dark theme is disciplined. **The light theme and the homepage are where contrast breaks** — and light is the *default during the day* (06:00–18:59 by the visitor's clock), so the majority of daytime visitors get the weaker palette.

### 7.4 Component-level gaps

- **`Field` never wires errors to inputs.** It renders `<p class="text-danger">{error}</p>` but there is no `id`, no `aria-describedby`, no `role="alert"`. The `Input` sets `aria-invalid` but a screen reader announces a broken field with no explanation. This is a one-line fix per component and affects every form on the site.
- **`Modal` has no focus trap.** It focuses the first control on open (nice) and closes on Escape (nice), but Tab walks straight out of the dialog into the page behind it. Same for `MobileMenu` and the testimonial lightbox.
- **`Tabs` breaks the ARIA pattern.** `role="tablist"` + `role="tab"` + `aria-selected` is used, but there is no `role="tabpanel"`, no `aria-controls`, no `id`, and no arrow-key navigation. Half-implemented ARIA is worse than none — screen readers announce a tab interface that doesn't behave like one.
- **No image dimensions.** Only **2 of 47** `<img>` tags have `width`/`height`, and there is **zero** `srcset`/`<picture>` usage. Every image is a layout-shift and a bandwidth gamble.
- **`/apply` has four `<h1>` elements** across its states — technically one per branch, but they are all in the same file so any static crawl or SR outline sees a flat, duplicated heading structure.
- **Duplicate DOM ids**: `id="p-name"` in `Dashboard.tsx` and `Partner.tsx`, `id="password"` in `Apply.tsx` and `Login.tsx`.

### 7.5 Responsive

Mostly good — the homepage has explicit 900px and 640px breakpoints with a documented mobile transform (`home-track-card` flips from stacked card to 38%/1fr horizontal row at ≤640px, which is the right call). Risks I'd verify on a real 320px device:

- `.home-hero h1 { font-size: clamp(64px, 18vw, 96px) }` — at 320px that's 64px for "Make something / real." with `letter-spacing: -.075em`. Tight but probably OK; worth checking for horizontal scroll.
- `.home-hero-note { left: -42px }` (and `-8px` on mobile) sticks outside the visual column. With `.home-reimagined { overflow: hidden }` it's clipped rather than scrollable — acceptable, but the note is half-cropped on small screens.
- The admin console has 19 tabs in a horizontally scrolling pill rail on mobile. It works, but it's a long scroll with no indication of what's off-screen.
- `--hr-marquee` animation is present but correctly disabled under `prefers-reduced-motion` — good.

---

## 8. UX flows

### 8.1 What's excellent

The **two-door `/apply`** is the best UX decision in the product. Instead of a 12-field form, the visitor makes exactly one decision (skill vs academics) with two large cards that state cost, schedule, outcome and deadline. Then a 4-step form with a visual stepper, per-step validation, a password strength meter, an inline "You are registering for…" summary, and a draft persisted to `sessionStorage` so a refresh doesn't lose work. The success state differentiates *four* outcomes (accepted / waitlisted / pending / academic) with honest copy. That's senior-level flow design.

The **admin console** is also well considered: sidebar with live pending-count badges, `ShowUpPanel` for at-risk students, a Nudge composer with `{first}` personalisation, and a JSON backup/restore. Someone actually thought about the operator's day.

### 8.2 Friction and dead ends

| Issue | Detail |
|---|---|
| **Identity split-brain** | There are three ways in — `/apply` (creates a learner account), `/join` (Google or WhatsApp OTP → `/onboard`), `/login` (password / OTP / Google) — and they don't share a story. `/apply` warns "You already have a seat" if signed in; `/join` doesn't check. A user who applied cannot then use Google to sign in as themselves (different identity, no linking). This must be one flow. |
| **Password recovery is a `mailto:`** | `/login` → "Forgot your password?" opens an email client to `academy@kr8digitals.com`. There is no reset token, no reset page, no expiry. For a product that issues credentials, this is a support ticket generator. |
| **No "resume application"** | The draft is in `sessionStorage`, so closing the tab loses it. `localStorage` would survive. |
| **Waitlist vs. registration copy contradicts itself** | The `Programme` model says all three visible skills are `status: "waitlist"` with `opensAt` March–April 2027. The homepage says "**Find your starting point**" and "A seat for you"; `/apply` says "**You're in**" in the success state for the same flow. Which is it? |
| **The availability badge can lie** | `apply` computes `skillsOpen = TRACKS.some(t => programme.status === "open")` and renders it on the *Digital Skills* door — so if **one** of seven tracks opens, the door says "Open now" even when the visitor's three intake tracks are all waitlisted. Should be `every()` over the offered tracks. |
| **Live sessions need an admin to open a room** | `checkIn()` hard-requires `getSessionStatus() === "open"`, and that only happens when an admin clicks "Open check-in". If the admin is late or absent, students physically present in the class cannot mark attendance and it silently costs them certificate eligibility. There is no auto-open by schedule, and the schedule fields (`classDays`, `classStart`, `classAttendanceStart`…) that exist in settings are **never read by any runtime code** — they're configuration theatre. |
| **`mustChangePassword` is advisory** | The owner account ships with a known password and `mustChangePassword: true`, which renders a dismissible banner. Nothing blocks navigation until it's cleared. |
| **Demo credentials on the public login page** | A collapsible "Demo access" panel autofills `KR8@Academy2026` for the seeded owner. On a real deployment that is a printed key to the building. |
| **`Time zone` is not honoured** | `settings.timeZone` exists and is editable in Programmes, but nothing converts times with it. All date/time logic uses the visitor's device clock. A student in London sees Lagos class times as their own. |

### 8.3 Micro-copy that undercuts the brand

The voice is strong — "Make something real", "Showing up is the strategy", "Less scrolling. More making." — but there are self-inflicted wounds:

- **Passwords delivered by email *and* SMS *and* WhatsApp** is promised in the apply success copy. Only email (via Resend, unconfigured) exists.
- Homepage says "**Eight-week** cohorts"; `/academics` says training "starts in **January 2027**"; `PROGRAMME` says onboarding **30 April 2027** / classes **3 May 2027**; the README says **5th Cohort**; the seed note says "**2027**". Four different intake narratives live in the same document tree.
- `About.tsx` claims "**772+ students trained**" and a 2025 milestone "772+ students, seven skills" — but the product only has 9 students, 3 certificates, and is on its fifth cohort. The `ACADEMY_STATS` "Graduates & counting: 772+" also appears in the footer. If 772 is real (past cohorts), say "772 graduates since 2023" and link proof. As written it reads as invented.
- `README` says "**162** unit + integration tests"; the suite is **163**.
- `/legal` is dated "10 November 2026" — three days ago — but still contains the preview disclaimer "do not submit sensitive or confidential information here", directly contradicting the live application form beside it.

---

## 9. Content

**Strengths.** The curricula (`src/data/curriculum.ts`, 555 lines) are the real thing: eight weeks per track, project briefs, deliverables, tooling, certification criteria with numeric thresholds. The mentor profiles are specific and human. Testimonials have real names, institutions, transcripts (`.vtt`) and poster frames. This is not lorem ipsum and it is the single strongest trust asset on the site.

**Weaknesses.**

1. **No single source of truth for dates.** `PROGRAMME` (academy.ts) and `DEFAULT_SETTINGS` (store.ts) both hold cohort facts and **disagree**: `PROGRAMME.classesBeginDate = "3 May 2027"`; `DEFAULT_SETTINGS.cohortStart` is *computed* as "next 3 May". Pages mostly hardcode strings ("March–April 2027", "January 2027") rather than reading either. The README claims "no page hard-codes a date or a schedule" — that is not true; `grep` finds hardcoded years in 10+ files.
2. **Year drift will bite.** Every hardcoded 2027 will be wrong in ~6 months with no mechanism to notice.
3. **Nigerian-Africa specificity is a strength** (state→LGA dropdowns, ₦0 tuition, WAT, JAMB/WAEC/NECO) but location copy is inconsistent: hero says "ABA · LAGOS · ONLINE", footer claims "students join from anywhere", About says "across Africa". Pick a positioning.
4. **No blog/resource surface.** For organic acquisition of a tuition-free school, one or two genuinely useful pages ("How to prepare for JAMB in 6 months") would outperform every paid channel. Currently zero indexable content beyond marketing pages.

---

## 10. Accessibility

**Done well:** skip-to-content link with proper focus styles; `:focus-visible` global rule with a light-theme override; `aria-label` on 59 controls; `role="alert"` on the login/OTP/join errors; `aria-live="polite"` toasts; `aria-modal` + Escape on modals; `sr-only` labels on icon-only buttons; captions on all 21 testimonial videos; `prefers-reduced-motion` blocks (4) that disable the marquee and transitions; semantic `<article>`, `<figure>`, `<blockquote>`, `<nav aria-label>`.

**Systemic gaps:**

| Gap | Impact |
|---|---|
| No focus trap in `Modal`, `MobileMenu`, testimonial lightbox | Keyboard users tab into the obscured page behind the overlay. |
| No `aria-describedby` / `aria-errormessage` on any form error | Every validation message is invisible to screen readers. |
| `role="tab"` without `tabpanel`/`aria-controls`/arrow keys | Broken tab semantics in two admin surfaces. |
| `role="menu"` / `role="menuitem"` without arrow-key roving focus | The user dropdown menu doesn't behave like a menu. |
| Light-theme contrast failures (§7.3) | Body copy on the default daytime theme fails AA. |
| Two nested `<main>` on the homepage | `App.tsx` renders `<main id="main">` and `Home.tsx` renders another `<main>`. Invalid landmark structure — and the skip link targets the outer one. |
| No dark-theme coverage of the homepage | Theme toggle appears broken on `/`. |
| Font sizes as small as `8px`/`9px` (`home-kicker`, `home-image-label`, `home-track-category`, `text-[9.5px]`) | Below any readable minimum, especially on the mid-range Android devices this audience uses. |

I would expect a WCAG 2.2 AA audit to fail on **1.4.3 (contrast)**, **2.1.1/2.1.2 (keyboard/focus)**, **3.3.1 (error identification)** and **4.1.2 (name/role/value)** across the forms.

---

## 11. Performance

Measured, not guessed:

| Metric | Value | Comment |
|---|---|---|
| JS + CSS (gzip) | **511 KB** | Before a single image. |
| Largest chunk | `documents` 456 KB (188 KB gz) | `pdf-lib` + `qrcode`, in the graph for public `/verify`. |
| App shell chunk | 411 KB (126 KB gz) | Too much for "first screen". |
| CSS | 167 KB (28 KB gz) | Reasonable; 173 unique hex literals inflate it. |
| Fonts | **384 KB** across 13 `.woff2` | Inter + Fraunces + Bricolage × subsets. Bricolage is imported but essentially unused (Fraunces is the actual `--font-display`). |
| `public/media` | **102 MB** | 21 testimonial MP4s = ~95 MB. |
| `public/` total | **107 MB** | Plus a **104 MB `.git` pack** (the videos are in history). |
| Largest image | 312 KB at 1408×768 | No `srcset`, no WebP/AVIF, no dimensions. |
| `srcset` usage | **0** | Every image is one size for all devices. |
| `loading="lazy"` | 24 of 47 images | The rest, including several below-fold hero images, are eager. |
| Route code-splitting | ✅ | Every page except `Home` is `lazy()`. |
| Preconnects / font-display | ❌ | No `<link rel="preconnect">`; `@fontsource` defaults are used. |

**What I'd do first, in order:**

1. `lazy()` the `CertificatePreview` so `pdf-lib` leaves the public graph (−188 KB gz for most visitors).
2. Convert hero art to AVIF/WebP with `srcset` (1408px → 640/960/1408) and add `width`/`height`. Expect −60% image bytes and zero CLS.
3. Drop Bricolage entirely; subset Fraunces + Inter to Latin only. Expect −200 KB of fonts.
4. Pre-generate poster images for testimonial videos (they exist) and never ship the 21 MP4s in the initial graph — they aren't in `src` today, so this is fine, but check they're not swept into `dist` unnecessarily. **They are: `dist` is 109 MB.** Move video to a CDN bucket or Mux/Cloudflare Stream and reference by URL.
5. `git` history carries ~104 MB of video. Convert to Git LFS or (better) move media out of the repo entirely.

---

## 12. SEO & discoverability

**Good:** per-route `useSeo` with title/description/canonical/OG/Twitter, `EducationalOrganization` JSON-LD on the homepage, a real `sitemap.xml` (16 URLs), a `robots.txt` that disallows `/dashboard`, `/admin`, `/login`, `noindex` on dashboard/admin/404/certificate, and a `<noscript>` fallback with a contact address.

**Problems:**

- **It's a client-rendered SPA.** `curl` on the production URL returns a shell `<title>` and an empty `#root`. Googlebot renders JS (eventually), but Bing, LinkedIn, WhatsApp, Slack, X and Facebook previews do **not** — they will all show the static `index.html` OG tags for **every** route. Sharing `/skills/graphic-design` on WhatsApp (the primary channel for this audience!) produces the generic homepage card. Fix: prerender the 16 public routes at build time (`vite-plugin-ssg` / `react-snap`) or move to Next/Remix. This is arguably the highest-ROI marketing change available.
- **No `hreflang`**, no `FAQPage` JSON-LD (you have a real FAQ component on `/academics` and `/admissions` — free rich results going unused), no `Course`/`EducationalOccupationalProgram` schema for the seven tracks, no `BreadcrumbList`.
- **`/apply` has 4 `<h1>`s**; `SectionIndex` renders a generic `01`-style label as a `<span>` rather than a heading, so section structure is flat.
- **`/certificate/:code` is `noindex`** — correct for privacy, but it means the one genuinely linkable artefact per graduate can't accumulate authority. Consider an opt-in public profile instead.
- **`og:image` is a single static 1200×630**; per-track OG images would lift click-through from every share.
- `robots.txt` disallows `/login` but not `/join`, `/onboard`, `/register`, `/leaderboard`, `/wall` — inconsistent.

---

## 13. Prioritised remediation plan

### P0 — block production (do before any real applicant)
1. **Stop advertising "verify a graduate" as a working public register** until §5 step 3 ships, or move it now. It is the site's central trust claim and it is currently untrue across devices.
2. **Remove the demo-credentials panel and the seeded owner password from the client.** Force a first-run setup flow.
3. **Lock down `/api/send-whatsapp` and `/api/send-email`** with a shared secret + `Origin` allowlist + rate limit + template allowlist — *before* setting any env keys.
4. **Remove the legacy FNV password path** and invalidate all seeded sessions.
5. **Enforce the capability matrix** (`TAB_CAPABILITY`) so `coach`/`reviewer`/`editor` cannot reach security, backup, or certificate issuance.

### P1 — before public launch
6. Supabase migration (§5) — auth, RLS, server-side certificate register, real sessions.
7. Fix the theme system: dark coverage for `/`; retire the third visual language or tokenise it.
8. Contrast pass on the light theme and the homepage (target ≥4.5:1 for all body text).
9. `Field` → `aria-describedby`/`role="alert"`; focus trap in `Modal`/`MobileMenu`/lightbox; drop the half-built `role="tab"`.
10. Prerender the 16 public routes; add per-route OG images; add `FAQPage` JSON-LD.
11. Unify the identity story: one `/join`, one `/login`, password reset with a token.

### P2 — quality & growth
12. Split `store.ts`, `Admin.tsx`, `Dashboard.tsx`; delete `tailwind-merge` or use it.
13. `srcset` + `width`/`height` + AVIF; move video to a CDN; drop Bricolage.
14. Make the schedule real: auto-open check-in from `classDays`/`classStart`/`classAttendanceStart` in `settings.timeZone`, or delete those fields.
15. Make one fact store: `PROGRAMME` **or** `settings`, never both; derive every date string from it.
16. Add analytics + error reporting. Add Playwright E2E for the apply, verify and admin-review paths. Add a CI workflow (there is none).
17. Fix copy contradictions: waitlist vs open, 772 vs 9, January vs May, "SMS" promises.

---

## 14. Closing assessment

As a piece of engineering craft, this is the work of someone who cares — the migration logic, the certificate spec, the capability matrix, the honest 501s, and a beautiful two-door application flow are all things I'd expect from a senior team, not a solo build. The writing is better than most funded edtech sites.

As a *system*, it has a hole where the backend should be, and the marketing is currently making promises the architecture cannot keep. The single most important decision now is not a design tweak — it is: **move identity, authorisation and the certificate register to Supabase, and let everything else you've built shine on top of it.** The code is already organised to make that a migration rather than a rewrite. That is a rare and valuable position to be in.

Fix the five blockers in §1 and this moves from "impressive demo" to "real institution."
