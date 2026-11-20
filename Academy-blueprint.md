# KR8 Academy — Build Blueprint (Consolidated from 25h Conversation)

**Destination:** `academy.kr8digitals.com`  
**Repository:** `KR8-Academy` (branch `arena/d68c81d4-kr8-academy` → merge to `main` after verification)  
**Source:** 25+ hours of Q&A from 2026-11-19 to 2026-11-20, cloned repos `kr8-digitals-enhancer`, `KR8-Digitals-Website`, `KR8-Academy`, and live reference `kr8digitals.vercel.app`  
**Status:** Requirements record. Merge and production activation are separate. Do not publish sample student results, expose service secrets, or migrate a live register without review.

---

## 1. One school, distinct destinations

- **KR8 Digitals** (`kr8digitals.com`) = company / studio / work enquiries.
- **KR8 Academy** (`academy.kr8digitals.com`) = tuition-free school: choose skill, enrol, attend, submit, get feedback, earn verifiable credential.
- **KR8 Tribe** = community & events. Mindset Shift lives under Tribe but is compulsory for Academy students.
- **KR8FOLIO** = separate future AI portfolio/outreach product. Academy will not build an internal portfolio builder; it will celebrate work via coach commendations and optional verification publishing.
- **NextGen Scholars** = academic partner (UTME/WAEC/NECO prep). Academy explains the programme and refers to NextGen; Academy does not handle their registration. A KR8 referral must remain identifiable.

No agency storefront, no paid upsell inside cohort application, no WhatsApp automation required at launch. Company/Tribe sites remain untouched until Academy is verified; hand over architecture and integration guide afterwards.

**Design direction:** Use the live `kr8digitals.vercel.app` system — ink background `#0a0614`, magenta `#ff2d9b`, violet `#7c3aed`, textured gradients, Montserrat + Sora, dark studio surfaces, motion that respects `prefers-reduced-motion`. One muted graduate video at a time on homepage (captions where verified, explicit play/sound controls, poster fallback). Never invent graduate claims; later add consented before→feedback→after stories. Later pages must share the same system — not a generic texture.

**Guest navigation:** Skills · NextGen Academics · Verify · Private Coaching · Team · Partnerships. Staff can publish course samples, outcomes and site copy without a deploy; copy cannot change policy.

---

## 2. Discover → Apply → Onboard

### Cohort calendar (single source)
- 8 weeks = 4 beginner + 4 advanced.
- Classes: **Monday, Wednesday, Friday 8:00–9:00pm WAT**.
- Assignments: **Tuesday, Thursday, Saturday** (instruction + submission on WhatsApp; redemption of acknowledgement code on Academy).
- Mindset Shift: usually Sunday, 7–11pm WAT, attendance window 10–11pm WAT (counts separately).
- **5th Cohort:** registration open through **30 April 2027 23:59 WAT** inclusive. Onboarding/Graduation **30 April 2027**. Classes begin **3 May 2027**. From **1 May** new applicants enrol in next cohort. The visitor sees cohort name before submitting.

Per-skill intake can be manually paused: show “Explore open skills” or “Notify me when applications open” (email + chosen skill, not a reservation or KR8 ID). Catalogue, application and calls to action must agree.

### What the applicant provides
Split form into two short steps:
1. **Your enrolment:** confirm skill + device, enter official name (label: “This is how your name will appear on your certificate”), unique student email, password, WhatsApp number (editable country code, normalise e.g. Nigeria `0803 123 4567` → `+2348031234567`; validate format, not activity), date of birth, device selection.
2. **Help us understand who we’re teaching:** country + state/region (do not infer residence from phone prefix; if inferred, label “estimated”), “How did you hear about KR8?” (if “A person” → optional name/referral code), changeable volunteer/team interest (“Volunteer”, “Explore long-term role”, “Maybe later”, “Not interested”), optional current experience level. Leave sex off unless a specific use is defined; if needed, private + optional + “Prefer not to say”.

Additional required: unique student email per child (one account per learner). Siblings may share a guardian contact email for consent/notices, but guardians get consent/confirmation notices — not access. Location field removed; phone country code not treated as location proof.

Before “Confirm enrolment” show the **cohort pledge** in first person, typed by applicant in their official name (not prefilled), versioned and timestamped:

> My cohort pledge: I’m choosing this skill for myself. I understand tuition is free and earning a certificate takes work. I commit to attending classes, submitting every assignment, taking part in Mindset Shift, and acting on my coach’s feedback. I’ve read the timetable and graduation requirements, and I’m ready to make time for them.

Beside it show actual standard: ≥80% class attendance; 100% assignments submitted & acknowledged; 4 Mindset Shift sessions or 3 + pardon; final grade ≥80%. Keep pledge distinct from privacy/public-profile notice; save version + acceptance time.

Registration gives **instant enrolment** (not staff approval). Show permanent KR8 ID with copy button, correct WhatsApp group link immediately, and dates (onboarding 30 Apr, first class 3 May). Email verification follows — does not block enrolment. Login with ID or email + password.

### Phone & access
Ask which devices they can use (phone/laptop/both) and explain match:
- **Phone only:** Graphic Design (GD), Video Editing & Animation (VE) — taught on phone.
- **Laptop required:** Front-End Development (FD).
- **Phone sufficient, laptop welcome:** Website Development (WD), Social Media Management (SMM), Content Creation (CC), Digital Marketing (DM).
Show labels on both skill cards and detail pages. Prevent broken numbers via country-code normalisation.

### Onboarding day (30 April) — handover between cohorts
- Ada (new) joins her skill’s WhatsApp classroom immediately; later joins general onboarding WhatsApp space for cross-skill connections.
- Actual graduation → onboarding event is **live on YouTube**; same link on Academy site, student profile and onboarding group. Host walks through example of class vs assignment code redemption.
- **Important correction:** Signed ≠ released. ID-card generation is a separate window: admin opens it on onboarding day, students see notice in profile, upload photo, generate card with QR + downloadable file + optional social copy. Cohort-wide catch-up window if admin closed early. Previously generated cards replaced automatically on skill switch; anyone scanning old card redirects to updated record. Never expose contact details on public cards.

For freshers, onboarding attendance is a separate record (not part of 80%). Must catch up, submit proof via direct contact with coach/admin, receive individual code, redeem on Academy. Coach *may* suspend after 2 days without recorded attendance; Academy auto-suspends after 3 unresolved days with reason + appeal instructions. Appeal includes ₦2,000 transfer receipt (finance checks bank record; payment alone does not restore; staff decision grants new grace). No fee for Academy error corrections. Fee disclosure must appear before onboarding warning (not inside skill registration) — registration stays free, but warning states consequence. Returning graduates exempt; missing onboarding not a barrier for them (show “What’s changed” notice). Enrolments after livestream on 30 April get same deadline and see: “Live welcome has ended. You can still join this cohort. Complete onboarding catch-up by [date/time WAT].”

International payments: offer “Paying from outside Nigeria?” → opens official KR8 Finance WhatsApp chat with purpose/reference prefilled (NextGen number not used). Later replace with configurable Selar checkout; receipt returns for verification. Let payer choose, don’t infer from country code.

---

## 3. Identity and Switching

- **Permanent identity key** independent of public aliases. Format: `KR8` + registration year + secure random letters/numbers + skill suffix. Example `KR82026R73HDGD` (brand + year + random `R73HD` + `GD`). Registration year, not cohort year. Random part prevents enumeration; password still protects account.
- **Adding a skill after certification:** append new suffix to original alias: `GD` → `GDWD` → `GDDM`. Any alias signs into one account; original opens full public record, extended alias filters to that skill then offers “View full public record”. Private-coaching records linked but not auto-published.
- **Enrolment code per cohort/skill** distinct from permanent ID. One free skill per cohort; no concurrent free skills. Repeat same skill = fresh attempt from week one (old attempt retained, not counted).
- **Switch:** replaces suffix; old identifier redirects without conferring old credential. Pre-start: original skill admin verifies WhatsApp departure, issues single-use, student/destination-bound code by email; redeem closes old enrolment and activates new before revealing new class link. Critical mid-cohort approved switch → starts next cohort from week one. No auto new suffix on repeat.

---

## 4. Learning, Attendance & Recovery

- **Today dashboard:** class link + next action distinct by day type (class vs assignment vs Mindset Shift vs onboarding). Notices for class reminders, deadline notices, schedule changes in profile + email now, WhatsApp DMs later.
- **Per-session batch:** coach clicks once → individual, expiring codes, searchable roster by name/ID/email/phone, “Open WhatsApp chat” + “Copy message” (only that student’s code, purpose, expiry in WAT). Not present until redeemed. Class default 9pm–midnight WAT adjustable; assignment window midnight→midnight with optional earlier issuance cutoff (e.g. 10pm) — show both “Issuance ends 10pm · Redeem by midnight”. Replacement class counts once; optional extra does not affect denominator. After cutoff, coach may still send already-generated code if available; or reissue personal code with new expiry mapped to original session date (no double credit; redemption time ≠ punctuality proof).
- **Reminders:** 8am WAT agenda + 1-hour nudge (e.g. 9pm for 10pm issuance cutoff); skip if assignment code already redeemed. Campaign log with retries/dedup.
- **Graduation thresholds:** 80% regular class attendance (20/24 if all 24 held), 100% assignments acknowledged & redeemed, Mindset Shift 4 or 3 + own skill admin pardon. Assignment code = acknowledgement, not grade. Score one student at a time before/after code; independent written feedback. Authorised transcription appears immediately; record assessor + data-entry actor. Missing marks = “Awaiting grade” not zero. Revision bonus by coach (max revised 100), track original + extra + “Acted on feedback” linked to original submission. Flag errors anytime; provisional result + 72h review triggered when last required mark lands; grade change restarts window (early acceptance allowed). One-week make-up after 8 weeks, then same-skill repeat from zero. Published phase checkpoints + general warnings; personal accountability partners later. Removed learner must request coach clearance to return. Onboarding suspension flow as above.

---

## 5. Graduation & Public Proof

- **Eligibility allows reservation** for next skill; activate at result release if before that skill’s first class. Late result → individual release after review/sign-off; never cut review short.
- **Mandatory experience video** received manually on WhatsApp; distinct optional publication permissions (Academy site, KR8 social, public livestream). No forced praise; declining does not affect title. Play at graduation requires explicit choice.
- **Titles:** coach awards Completion or rare Professionalism (endorsement KR8 can defend anywhere). Both require coach + Ultimate Admin approval on named graduation list (you can leave rows pending). Match verified actual signatures to template without doubling preprinted artwork; preview before issue. Admin uploads missing signature artwork; future change does not rewrite past certificates. Freeze signed artifact + approvers. Grade/title change before release → both re-approvals; spelling authorised by Ultimate Admin → their fresh sign-off. Name corrections only for student-entered spelling, requested before result.
- **Release:** scheduled exact WAT unlocks public proof + delivery. New skills without bespoke art use official reusable master.
- **QR:** certificate QR → verified copy of that exact certificate with live status (valid/revoked). ID QR → student record. Revocation by coach or Ultimate Admin alone; appeal to Ultimate Admin if coach revoked, to Board if owner revoked. Hold subsequent certificates during review, not current class access.
- **Accountability report:** week-by-week class attendance + assignment completion (e.g. “Week 3: 3/3 classes; 3/3 acknowledged”). Replacement credit counts as completion, not punctuality.

---

## 6. Directory, Privacy & Historical Records

- **Searchable directory** by name/skill/ID, indexable. For confirmed adults: admission status, honours, commendations → released credential, weekly report, coach note, final grade. Keep assignment marks + private contacts restricted.
- **Minors:** all ages may enrol. Parent-led registration, one email per child + shared guardian contact for notices. Your preference is “everything public with parent consent or fallback to 1-on-1” — recorded, but launch must pass child-privacy legal review under Nigeria Data Protection Act before indexing any minor. Until cleared, minors private by default with shareable verification link via guardian. Adult final grade public at issuance; individual assignment marks private always.
- **Historical records:** you will upload/provide. Enter individually or bulk for review before publishing. Old IDs/codes honoured as aliases; if collision, flag for review; missing fields omitted, not inferred as absence/zero. No sample video → graduate record.

---

## 7. Private Coaching

- Available to anyone, including current free students in a different skill. No second cohort classroom access; linking records does not merge grades or publish private work.
- **Default visibility:** private, exact-code/QR verification + opt-in public listing.
- **Flow:** guest enquiry → central coordinator matches to coach (goal-aware) → agree exact dates/times/durations offline (WhatsApp/phone ok) → coordinator records schedule → invite to private learner profile + written copy → payment. Each date priced separately: full hours ₦2,500, remaining minutes at ₦50 capped at ₦2,500 (55 min = ₦2,500). Total itemised. Slot held until start; teaching only after Finance verifies bank transfer. Learner can confirm before paying; “Payment under review” if transfer pending. Reschedule free with 24h notice; shorter by staff review. Substitute coach if original unavailable; else reschedule; refund affected session if no agreement.
- **Learning:** personalised schedule/assessments; Mindset Shift optional. Coach submits learning summary + selected work; independent approval then certificate (same dual signature, not auto-granted by payment). Profiles linked only after learner confirms + admin approves; no publishing of private records.

---

## 8. People, Partners & Cross-Site Ownership

- **Dedicated Supabase** (`academy` schema). RLS + server-authorised scopes. Ultimate Admin `kr8digitals01@gmail.com` (ownership verification required; no elevation by email claim alone). Skill super admins oversee skill admins/assign coaches; delegated permission subsets scoped to skill/cohort; suspend downstream grants when parent loses permission.
- **Student reps:** distribute classmates’ codes + prepare corrections only; no own actions, grading or appointments.
- **Finance:** only central admin/designated finance officer can mark paid after checking bank record; finance role does not grant grade/certificate access.
- **General Manager:** Academy-wide operational overview (progress, missed deadlines, workload, unresolved issues) — not unlimited edits.
- **Staff MFA:** everyone with staff access; authenticator app optional — support passkeys/security keys + recovery.
- **Invites:** one-use, expiring, recipient-bound unique links. Applications alone grant no access.
- **Editors:** maintain public copy (descriptions, skill pages, FAQs, announcements) without code changes; notified of others’ announcements, can moderate/correct with history. They cannot change policy (e.g. 80% pass mark).
- **Join Team vs Partner vs Student:** three distinct routes. Shared role catalogue visible from any KR8 site; same application experience + terms. General Manager screens and publishes public vacancies; team leaders request openings or invite privately within authority (no public vacancy creation). Visitors can pitch contribution or request vacancy alerts (no payment).
- **Long-term team path:** free application → GM shortlist → disclosed documentation fee (min ₦5,000, configurable per role/period) → KR8-sponsored 30-day Consistency Drill (verified certificate or organiser confirmation) → Board 1–30 rotations with actionable feedback after each → 31–60 ownership of assigned role + trial placement review (demonstrate KR8 contribution + personal project) → Board appointment → announcement across sites + separate permission assignment. No guaranteed appointment/salary; non-completion/change of mind = no refund (policy disclosed before payment; legal review required for edge cases). Part-time volunteer = no fee, probation set by leader. Vault benefits include mentorship, real experience, public credit, leadership, project support — not promised employment.
- **Partners:** submit proposal → team investigates → Board evaluates offline, agrees terms/exceptions → both sign → partnerships lead confirms agreement reference/effective date → editors coordinate releases across sites (lead site gets full coverage, others link). Track actual publication per destination. NextGen interim: WhatsApp `+2349048997121` with editable referral text; later partner registration link + “How did you hear about us? → KR8 Academy” + periodic programme reports (no individual performance feed).

---

## 9. Implementation & Launch Gates

- **Stack:** Browser UI → authenticated service → Supabase Postgres/Storage (RLS + server-authorised scopes). Modules: identities & enrolments, admissions, learning events & redemptions, grades & appeals, certificate snapshots & release jobs, public projections, bookings & finance, delegated grants, editorial & cross-site publication, recruitment & partner desk. Atomic redemption, UTC stored / WAT displayed, versioned audit logs, rate limits, private media buckets, idempotent Resend jobs. Never make browser storage authoritative for grades, payments, access or verification.
- **Acceptance:** exercise actual flows with disposable accounts; test cross-student/staff scope denial, role loss, code expiry/reissue/double-spend, WAT deadlines, review resets, batch co-sign + delayed release, QR verification as anonymous visitor, reminder dedup, private profile isolation, media consent, mobile/offline fallback.
- **Ops before enabling production:** confirm hosting/DNS, Supabase + Resend setup, private finance/group/stream links, signer identity, provider terms, minor/guardian policy, and fee disclosures. Preserve old site until replacement audited. Publish architecture, config inventory, migrations, staff guide and rollback plan with release.

---

**Open items carried forward:** guardian confirmation method for minors (deferred), visual first impression refinement (you asked to decide later → studio outside/school inside), fee wording legal review, tie/no-session handling for monthly overall award.

