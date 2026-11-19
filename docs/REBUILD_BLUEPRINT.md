# KR8 Academy Rebuild — Audit and Blueprint

**Status:** first local-first rebuild pass implemented on `arena/67305d5c-kr8-academy`; verified with type-check, 173 tests and a production build. Nothing is merged to `main` and no database, Vercel project, or hosted service is connected.

## Scope and guardrails

- Rebuild the Academy, not the KR8 company website.
- Keep all implementation changes in `KR8-Academy`; the other public repositories are read-only references.
- Do not provision, connect, or migrate to a hosted database in this phase. Keep application data on the user's device until the user is satisfied and explicitly creates a database.
- Do not introduce credentials or secret values in source, docs, fixtures, or commits. No public-repository `.env` files were read.
- Preserve existing Academy programme facts and admin-editable settings; do not invent cohort dates, lessons, video URLs, student outcomes, or certificate criteria.

## Repository audit

### Primary references

- **`kr8-digitals-enhancer`** is the richest reference for staff operations, student profiles, attendance, curricula/resources, progress, live rooms, awards, and certificate workflows. It uses Supabase/Postgres and has server-side functions, but its current source must not be copied as a security boundary without redesign. Static review found potentially unsafe executive-role synchronization, privileged fallback paths needing staff checks, WebAuthn verification fallback behavior, and certificate issuance that spans separate writes rather than an atomic transaction. These are code-review findings, not exploit-confirmed results.
- **`KR8-Digitals-Website-`** contains older Academy/credential content and client-side account handling with partial Supabase synchronization. Its client-trusted admin checks and broad public data policies are not suitable to port.
- **`KR8-Company`** is the visual/interaction reference only. It demonstrates a clear audience-first homepage, sticky navigation and mobile sheet, distinct desktop/mobile hero treatments, restrained cinematic lighting, progressive disclosure on small screens, explicit form states, large touch targets, and reduced-motion handling. Its dark obsidian/plum palette, magenta-violet gradients, editorial type, generous section spacing, and daylight theme are references; Academy identity and content remain authoritative.
- **`reg-kr8digitals`** is a supplementary registration reference. Its server-side RPC design locks direct table access behind service-role functions, but registration lookup/reset flows appear to disclose identity details and accept caller-provided proof references without an evident ownership challenge or visible rate limiting. These are static risks, not exploit-tested. The repository tracks a root `.env`; its contents were deliberately not fetched or read. Treat any values in it as exposed and rotate/remove them.
- **`KR8-Academy`** remains the product/content source. It already contains public discovery, application, student, admin, curriculum, attendance, awards, certificate, backup, and notifications flows. Its current persistence and identity are browser-local; it is not cross-device or server-secured.

### Live-site observation

A direct page fetch of the supplied company domain failed in this environment (including a `www` HTTP attempt). No Vercel listing or API was used for this continuation. The `KR8-Company` source was reviewed as requested and used to continue; no claim is made that the live page's rendered appearance or behavior was directly observed.

## Product journeys and requirements

1. **Discover a pathway:** land on the Academy homepage, choose digital skills or academics, search/filter the available tracks, inspect the curriculum, mentor, outcomes, schedule, eligibility, and current intake status, then apply or join the waitlist.
2. **Apply:** complete the multi-step identity, location, education, pathway, goals, and consent form; retain a recoverable draft; validate duplicate contact details; receive a truthful confirmation and local KR8 ID. Programme availability and dates come from existing settings, not hard-coded new claims.
3. **Join and learn:** sign in, view the learner dashboard, follow weekly curriculum, open only resources actually configured by staff, submit work, see review/feedback, record attendance, and follow progress and announcements.
4. **Earn and verify a credential:** see eligibility and request/review status, receive a generated certificate with a unique local record, download it, and view the record in the verification UI. Until a trusted shared backend exists, verification is explicitly local to this browser/device and must not be represented as globally authoritative.
5. **Administer the Academy:** staff use capability-scoped navigation for applications, students, submissions, attendance, curriculum/settings, scores/awards, certificates, announcements, notifications, and data export/restore. Actions should be auditable and display success/error states.
6. **Recover and communicate:** only show email, WhatsApp, Google, or broadcast delivery as successful when a configured integration actually confirms delivery; otherwise show the accurate local/queued/manual-contact state.

### Acceptance requirements

- Mobile-first layouts; keyboard-accessible controls, visible focus, labelled fields, reduced-motion support, meaningful loading/empty/error/success states, and no horizontal overflow at narrow widths.
- Student PII is not exposed on public pages or certificate verification; collect only the data needed by the existing Academy form and policies.
- No fabricated course videos: current Academy curriculum files contain topics and assignments but no verified per-lesson video links. Learning pages may display configured links/embeds and an honest empty state until the owner supplies them.
- Never claim that browser-only passwords, role checks, TOTP, local certificate records, or client-generated identifiers provide server-grade security or global uniqueness.
- No use of external repository auth/policies or credential values as production secrets.

## Architecture and security plan

- Retain the existing React/Vite SPA and domain modules (`types`, `store`, `auth`, registration, awards, and certificate rendering) as the starting point; keep the UI separated from persistence calls.
- No hosted database, server credentials, or new network persistence in this phase. The user confirmed retaining the existing `localStorage` behavior: a versioned application object plus a separate registration key. Keep this local-only store; do not migrate it to IndexedDB, files, or a hosted service.
- Treat local authentication and roles as a prototype convenience only: a visitor controlling the browser can inspect or modify client-side state. Real personal data, authoritative admissions, shared attendance, public credential verification, and production administration require a later server-side identity/authorization and database design.
- Remove any hard-coded starter login, publicly documented demo credential, or real learner PII from production seeds. Use an explicit first-owner setup instead of a shared preset password; retain synthetic fixtures in tests only.
- Validate imported backup shape/version and size before replacement; give a clear backup/export path and warn that local data can be cleared with browser storage.
- Do not reuse the registration repository's reset-proof flow or the Enhancer's privileged fallbacks without server-side ownership and role checks.

## Design blueprint

- Preserve Academy's own content, existing dark/plum and magenta-violet identity, and its current type system. Borrow the Company reference's hierarchy and craft rather than cloning its company-site pages or CMS.
- Public shell: sticky header with clear active states, a compact accessible mobile sheet, an explicit Apply/Sign-in action, and an audience-first discovery section.
- Homepage: concise purpose statement, clear digital-skills and academics doors, searchable track cards, honest intake status, the learning rhythm, learner work, certificate trust explanation, and a final application CTA.
- Course pages: track identity, mentor, outcomes, tools, current schedule/status, an eight-week curriculum, optional verified learning resources, submissions/assessment criteria, and a visible apply/waitlist action.
- Student area: simple course navigation and a focused overview of next lesson, assignments, feedback, attendance, progress, announcements, notifications, and certificates.
- Admin area: responsive operations console with visible capability boundaries, actionable queues, audit context, and explicit confirmation for irreversible actions.
- Use subtle lighting/gradient accents and responsive image crops; avoid heavy 3D or autoplay that obscures content. Long supporting copy can collapse on mobile but must remain available. Motion must respect `prefers-reduced-motion` and never leave content invisible.

## Phase sequence

1. Repository audit — complete.
2. Live-site/technical audit — source-based review complete; direct rendered-site observation unavailable in this environment.
3. Product journeys and requirements — complete from current Academy flows and source content.
4. Architecture/security plan — complete, with local persistence mechanism explicitly unresolved.
5. Design blueprint — complete.
6–14. Foundation, auth/registration, learning, certificates, administration, notifications/settings, UI polish and tests — first pass complete (see below).
15. Documentation — complete for this pass; the README and in-app copy describe the local-only limits.
16. Awaiting explicit authorization before any merge, publication to `main`, deployment, or connection to a hosted database.

## What this pass implemented

- **Empty, first-run store.** No seeded learners, applications, activity, certificates, announcements or exam modules. Schema v4 removes previously marked sample identities together with their linked records and keeps retired demo identities out of recovered history/recovery data.
- **First owner setup.** `/setup` creates the initial Academy owner; there is no shared starter login, and `/admin` redirects to setup while no owner exists. README and sign-in pages no longer disclose demo credentials.
- **Password handling.** PBKDF2 (SHA-256) through Web Crypto — 310,000 iterations in the app, 1,000 in tests. Legacy SHA-256 hashes are upgraded only after a successful verification; there is no weak fallback.
- **Backup and restore.** Admin → Data exports one `kr8-academy-backup-v2` bundle covering both the Academy store and the separate registration key. Restore validates both payloads before writing anything, enforces a 5 MB cap on the whole file, writes registration rows first and rolls them back on a best-effort basis if the Academy write fails. Pre-import safety snapshots are skipped above 2.5 MB and that omission is reported in the UI.
- **Honest credential copy.** Certificate IDs, student records and lookups are described everywhere as records held in this browser — not signed credentials, not a shared register, and not independent verification.

## Verification

- `npm run typecheck` — passes.
- `npm test` — 173 tests in 11 files pass, including migrations, recovery, backup/restore, storage limits and full user journeys.
- `npm run build` — production build succeeds.
- `git diff --check` — clean.

## Known limits

- Cross-key restore is not a transaction. An Academy write failure after registration writes is rolled back best-effort; a rollback failure itself is not directly covered by a test.
- `npm audit` reports 3 advisories (1 moderate, 2 critical) in the dependency tree; no audit fix has been applied yet.
- Everything remains browser-local: accounts, roles, sessions, records and certificate lookups are not authoritative security, are not shared between devices, and can be edited by anyone with access to the browser profile. Do not enter sensitive real student data in this build.
