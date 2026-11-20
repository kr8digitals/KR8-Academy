# KR8 Academy — Delivery Plan (Spec v255, 16 sections)

**Branch:** `arena/d68c81d4-kr8-academy` → `main` → `academy.kr8digitals.com`  
**Visual contract:** ink #0a0614 · magenta #ff2d9b · violet #7c3aed · Sora/Montserrat · hero-aurora/starfield · kr8digitals.vercel.app as reference  
**Cohort:** 5th Cohort · onboarding 30 Apr 2027 11:59pm WAT · first class 3 May 2027 · 24 classes Mon/Wed/Fri 8-9pm WAT · assignments Tue/Thu/Sat

## Completed (verified + pushed)
- [x] §16 Visual contract — Home.tsx rebuilt with hero-aurora, starfield, stat cards, reveal motion
- [x] §2 Device rules — Track.device enum (Phone only / Phone sufficient, laptop welcome / Laptop required) + short codes GD/VE/WD/FD/CC/SMM/DM
- [x] §2 Courses grid with cover + code/duration + device pill (Smartphone/Monitor/Laptop)
- [x] Motionverse proof (Home + Mentors) — fetch real designs from Pinterest/motion-verse.com, 5 images in `public/img/motionverse/`, display vs proof decision: Mentors = proof gallery (coach standard), Home = display (Professionalism vs Completion), TrackDetail = syllabus outcome
- [x] §4 ID generation — KR82026R73HDGD = KR8 + 2026 + 5-char random (no I/L/O/0/1) + skill suffix; helpers for extended (append) and replacement (switch)
- [x] §3 Cohort catalogue — all 7 skills open, programme notes with device + dates, admin can pause one skill without closing others
- [x] Build verified — `npm run build` clean (4.x s) on each step

## In Progress / Next (one at a time, verify → commit → push)
- [ ] §3/5 Registration flow — Apply.tsx device question (phone/laptop/both) + show matches/mismatches, pledge typed-name signature, duplicate checks (email/phone/name+DOB), guardian flow, immediate KR8 ID + WhatsApp link before email verification
- [ ] §6 ID card window — admin opens generation on onboarding day, upload photo + QR to public record, cohort-wide catch-up, auto-replace on switch
- [ ] §7 Onboarding — general onboarding WhatsApp group + YouTube livestream, 2-day coach suspension / 3-day auto-suspend, ₦2000 appeal with receipt upload, email + in-profile notices
- [ ] §8 Attendance/codes — personal code per student per session, window 21:00–00:00 WAT (extendable), single-person reissue, Today panel (next class/time/group link/code entry), Today is student home
- [ ] §9 Scoring — coach grades on WhatsApp, 70/30 pass 80%, improvement bonus (coach decides), 72h review with fresh clock on change, make-up week, monthly honours (60/15/15/10)
- [ ] §10 Certificates — Completion vs Professionalism (coach decides), dual signatures (coach + Ultimate Admin kr8digitals01@gmail.com), hold until scheduled release, QR to verified copy, revocation with audit
- [ ] §11 Directory/privacy — public search by name/ID/skill, crawlable, minor gate (legal review), private coaching private by default
- [ ] §12 Private coaching — ₦2500/hr + ₦50/min pricing, Finance verification, Selar fallback
- [ ] §13 Staff/delegation — nested permissions, MFA every staff, invite links
- [ ] §14 Vacancies — GM maintains openings, document fee ₦5000, Consistency Drill, Board 60 days
- [ ] §15 Partnerships/NextGen — proposal vetting, bilateral signing, Academics referral WhatsApp +2349048997121, own site later

## Engineering & Handover (§16 constraints)
- [x] Supabase project `kr8academy` (kwlyvtfuavfaivvrddpd) ACTIVE_HEALTHY eu-west-1, 5 migrations applied, academy schema with 12 tables (students, enrolments, credentials etc.)
- [ ] Supabase client wiring — replace localStorage mock with RPC + RLS, atomic redemption, WAT timestamps, audit
- [ ] Resend branded emails — server-side via /api/send-email, log delivery/retries/dedup, never auto-send attendance codes
- [ ] Admin CMS — extend skills/suffixes, cohort dates, skill pauses, group links, signatures/templates, release times, role titles, vacancy fees without code
- [ ] Content inventory — verify `src/data/curriculum.ts`, `public/media/testimonials` (21 videos), `public/signatures/` (5 PNGs), `public/cert/` templates
- [ ] Acceptance checks 1–7 — disposable adult/returning learners across Apr30/May1 WAT boundary, onboarding catch-up, coach/student code flow, 72h grade review, anonymous search, private pricing, staff delegation
- [ ] Vercel preview → production, env (SUPABASE_URL/ANON_KEY/SERVICE_ROLE, RESEND_API_KEY), DNS academy.kr8digitals.com, rollback guide

## Motionverse Fetch Log (display vs proof decisions)
- Source: Pinterest search "Stevenson Motionverse brand identity" → motion-verse.com/portfolio-1 (3D Animation mark pink bg) + brandspired.co.nz/portfolio/stevenson
- Fetched 5 images via image_search 20 Nov 17:02, copied to public/img/motionverse/
- Use 1: Home Motionverse proof panel (display — what Professionalism means)
- Use 2-5: Mentors page (proof — real coach work, 2x2 grid, link to Graphic Design syllabus)
- Next fetch: on TrackDetail for video/web skill galleries when building those pages

## Commits (visible)
- ab51d76 docs: add full consolidated Academy spec (16 sections)
- c7c7795 feat(home): rebuild with kr8digitals reference design + correct catalogue
- 719c0b4 feat(catalogue): device rules + Motionverse proof context
- 2d4da7e feat(mentors): embed Motionverse real work as coach proof
- 3243b50 feat(id): implement KR82026R73HDGD spec §4 ID generation
- 658b053 feat(programmes): open all 7 skills per spec §2 launch catalogue
