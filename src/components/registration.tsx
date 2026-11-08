/* Shared registration sections — the exact same fields power the /apply
   fallback wizard and the /onboard completion for provider sign-ups, so a
   record is a record no matter how it arrived. */

import { Check, GraduationCap, Laptop, MapPin, NotebookPen, Sparkles, UserRound } from "lucide-react";
import { cn } from "../lib/utils";
import {
  CLASS_LEVELS,
  COUNTRIES,
  CURRENT_LEVELS,
  DEVICES,
  EDUCATION_LEVELS,
  EXAM_TARGETS,
  GENDERS,
  HOW_HEARD,
  PREFERRED_CONTACT,
  type ExamTarget,
  type RegistrationDetails,
  type RegistrationSide,
} from "../lib/registration";
import { NIGERIA_STATE_NAMES, lgasFor } from "../data/nigeria";
import type { AcademicCombination } from "../lib/types";
import { Field, Input, Select, Textarea } from "./ui";

type SetFn = <K extends keyof RegistrationDetails>(key: K, value: RegistrationDetails[K]) => void;
type Errors = Partial<Record<string, string>>;

/* ---------- Section wrapper ---------- */

export function RegSection({
  index,
  title,
  hint,
  icon: Icon,
  children,
}: {
  index: string;
  title: string;
  hint?: string;
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <section className="reg-section">
      <header className="reg-section-head">
        <span className="reg-section-mark" aria-hidden="true">
          {index}
        </span>
        <span className="reg-section-icon" aria-hidden="true">
          <Icon size={17} strokeWidth={1.8} />
        </span>
        <span>
          <h3 className="reg-section-title">{title}</h3>
          {hint ? <p className="reg-section-hint">{hint}</p> : null}
        </span>
      </header>
      <div className="reg-section-body">{children}</div>
    </section>
  );
}

/* ---------- Pill checkbox ---------- */

export function CheckPill({
  checked,
  onToggle,
  children,
  sub,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "reg-pill",
        checked && "reg-pill-on"
      )}
    >
      <span className="reg-pill-box" aria-hidden="true">
        {checked ? <Check size={12} strokeWidth={3.2} /> : null}
      </span>
      <span className="reg-pill-text">
        {children}
        {sub ? <span className="reg-pill-sub">{sub}</span> : null}
      </span>
    </button>
  );
}

function toggleList(list: string[], value: string, max?: number): string[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  if (max && list.length >= max) return list;
  return [...list, value];
}

/* ================================================================== */
/* Section A — Personal                                                */
/* ================================================================== */

export function RegistrationIdentityFields({
  d,
  set,
  errors,
}: {
  d: RegistrationDetails;
  set: SetFn;
  errors: Errors;
}) {
  return (
    <RegSection index="A" icon={UserRound} title="About you" hint="Your real name — it is what certificates and records carry.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name" htmlFor="reg-name" error={errors.name} className="md:col-span-2">
          <Input
            id="reg-name"
            autoComplete="name"
            placeholder="e.g. Chiamaka Obi"
            value={d.name}
            error={Boolean(errors.name)}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="Date of birth" htmlFor="reg-dob" error={errors.dob} hint="You must be 16 or older.">
          <Input
            id="reg-dob"
            type="date"
            autoComplete="bday"
            value={d.dob}
            error={Boolean(errors.dob)}
            onChange={(e) => set("dob", e.target.value)}
          />
        </Field>
        <Field label="Gender" htmlFor="reg-gender" optional>
          <Select id="reg-gender" value={d.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="">Prefer not to say</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Email address" htmlFor="reg-email" error={errors.email}>
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={d.email}
            error={Boolean(errors.email)}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="Phone number" htmlFor="reg-phone" error={errors.phone} hint="WhatsApp-preferred — we send your links here.">
          <div className="flex gap-2">
            <Select
              aria-label="Dial code"
              className="w-28 shrink-0"
              value={d.dial}
              onChange={(e) => {
                set("dial", e.target.value);
                if (d.sameWhatsapp) set("whatsappDial", e.target.value);
              }}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.dial}>{c.flag} {c.dial}</option>
              ))}
            </Select>
            <Input
              id="reg-phone"
              type="tel"
              autoComplete="tel-national"
              inputMode="tel"
              placeholder="801 234 5678"
              value={d.phone}
              error={Boolean(errors.phone)}
              onChange={(e) => set("phone", e.target.value)}
              className="flex-1"
            />
          </div>
        </Field>
        <div className="md:col-span-2">
          <label className="reg-check" htmlFor="reg-same-wa">
            <input
              id="reg-same-wa"
              type="checkbox"
              className="reg-checkbox"
              checked={d.sameWhatsapp}
              onChange={(e) => set("sameWhatsapp", e.target.checked)}
            />
            <span className="reg-check-box" aria-hidden="true">{d.sameWhatsapp ? <Check size={12} strokeWidth={3.4} /> : null}</span>
            <span>My WhatsApp number is the same as my phone number</span>
          </label>
        </div>
        {!d.sameWhatsapp ? (
          <Field label="WhatsApp number" htmlFor="reg-wa" error={errors.whatsapp} className="md:col-span-2">
            <div className="flex gap-2">
              <Select
                aria-label="WhatsApp dial code"
                className="w-28 shrink-0"
                value={d.whatsappDial}
                onChange={(e) => set("whatsappDial", e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.dial}>{c.flag} {c.dial}</option>
                ))}
              </Select>
              <Input
                id="reg-wa"
                type="tel"
                inputMode="tel"
                placeholder="801 234 5678"
                value={d.whatsapp}
                error={Boolean(errors.whatsapp)}
                onChange={(e) => set("whatsapp", e.target.value)}
                className="flex-1"
              />
            </div>
          </Field>
        ) : null}
      </div>
    </RegSection>
  );
}

/* ================================================================== */
/* Section B — Location                                                */
/* ================================================================== */

export function RegistrationLocationFields({
  d,
  set,
  errors,
}: {
  d: RegistrationDetails;
  set: SetFn;
  errors: Errors;
}) {
  const isNg = d.country === "NG";
  const lgas = isNg && d.state ? lgasFor(d.state) : [];
  return (
    <RegSection index="B" icon={MapPin} title="Where you live" hint="Location helps us place you in the right cohort and community.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Country" htmlFor="reg-country" error={errors.country} className={isNg ? "" : "md:col-span-2"}>
          <Select
            id="reg-country"
            value={d.country}
            error={Boolean(errors.country)}
            onChange={(e) => {
              const code = e.target.value;
              set("country", code);
              const c = COUNTRIES.find((x) => x.code === code);
              if (c) {
                set("dial", c.dial === "+" ? "" : c.dial);
                if (d.sameWhatsapp) set("whatsappDial", c.dial === "+" ? "" : c.dial);
              }
              if (code !== "NG") {
                set("state", "");
                set("lga", "");
              }
            }}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </Select>
        </Field>
        {isNg ? (
          <Field label="State" htmlFor="reg-state" error={errors.state}>
            <Select
              id="reg-state"
              value={d.state}
              error={Boolean(errors.state)}
              onChange={(e) => {
                set("state", e.target.value);
                set("lga", "");
              }}
            >
              <option value="">Select state…</option>
              {NIGERIA_STATE_NAMES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
        ) : null}
        {isNg ? (
          <Field label="LGA" htmlFor="reg-lga" error={errors.lga}>
            <Select
              id="reg-lga"
              value={d.lga}
              error={Boolean(errors.lga)}
              disabled={!d.state}
              onChange={(e) => set("lga", e.target.value)}
            >
              <option value="">{d.state ? "Select LGA…" : "Pick a state first"}</option>
              {lgas.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label="City / town" htmlFor="reg-city" error={errors.city}>
          <Input
            id="reg-city"
            autoComplete="address-level2"
            placeholder="e.g. Aba"
            value={d.city}
            error={Boolean(errors.city)}
            onChange={(e) => set("city", e.target.value)}
          />
        </Field>
        <Field label="Community / area" htmlFor="reg-community" optional hint="Neighbourhood, estate or village — helps our field team.">
          <Input
            id="reg-community"
            autoComplete="address-level3"
            placeholder="e.g. Osisioma, Ariaria…"
            value={d.community}
            onChange={(e) => set("community", e.target.value)}
          />
        </Field>
      </div>
    </RegSection>
  );
}

/* ================================================================== */
/* Section C — Education                                               */
/* ================================================================== */

export function RegistrationEducationFields({
  d,
  set,
  errors,
}: {
  d: RegistrationDetails;
  set: SetFn;
  errors: Errors;
}) {
  return (
    <RegSection index="C" icon={GraduationCap} title="Education" hint="No certificates needed at this stage — this just shapes your onboarding.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Current educational level" htmlFor="reg-education" error={errors.educationLevel} className="md:col-span-2">
          <Select
            id="reg-education"
            value={d.educationLevel}
            error={Boolean(errors.educationLevel)}
            onChange={(e) => set("educationLevel", e.target.value)}
          >
            <option value="">Select your level…</option>
            {EDUCATION_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </Select>
        </Field>
        <Field label="School / institution" htmlFor="reg-institution" optional>
          <Input
            id="reg-institution"
            autoComplete="organization"
            placeholder="e.g. Aba Model Science Secondary School"
            value={d.institution}
            onChange={(e) => set("institution", e.target.value)}
          />
        </Field>
        <Field label="Course of study" htmlFor="reg-course" optional hint="Your department, programme or combination.">
          <Input
            id="reg-course"
            placeholder="e.g. Agricultural Science, Computer Science…"
            value={d.courseOfStudy}
            onChange={(e) => set("courseOfStudy", e.target.value)}
          />
        </Field>
        <Field label="Current class / year" htmlFor="reg-level" optional>
          <Select id="reg-level" value={d.currentLevel} onChange={(e) => set("currentLevel", e.target.value)}>
            <option value="">Select…</option>
            {CURRENT_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </Select>
        </Field>
        <Field label="Occupation / what you do now" htmlFor="reg-occupation" optional>
          <Input
            id="reg-occupation"
            autoComplete="organization-title"
            placeholder="e.g. Student, seamstress, rider, self-employed…"
            value={d.occupation}
            onChange={(e) => set("occupation", e.target.value)}
          />
        </Field>
      </div>
    </RegSection>
  );
}

/* ================================================================== */
/* Section D — Skills                                                  */
/* ================================================================== */

export const SCIENCE_SUBJECTS = [
  "Mathematics","English Language","Physics","Chemistry","Biology","Further Mathematics",
  "Agriculture","Economics","Geography","Technical Drawing","Computer Studies","Government","Commerce",
];
export const ARTS_SUBJECTS = [
  "English Language","Literature in English","Government","Christian Religious Studies","Islamic Studies",
  "Economics","Commerce","History","Geography","French","Yorùbá","Igbo","Hausa","Music","Fine Art",
];
export const ALL_SUBJECTS = Array.from(new Set([...SCIENCE_SUBJECTS, ...ARTS_SUBJECTS]));

export function subjectPool(d: RegistrationDetails): string[] {
  if (d.examTargets.includes("not_writing")) return ALL_SUBJECTS;
  if (d.combination === "arts") return ARTS_SUBJECTS;
  if (d.combination === "science") return SCIENCE_SUBJECTS;
  return ALL_SUBJECTS;
}

export function RegistrationSkillFields({
  d,
  set,
  errors,
  tracks,
  programmeStatus,
}: {
  d: RegistrationDetails;
  set: SetFn;
  errors: Errors;
  tracks: Array<{ key: string; name: string; tagline?: string }>;
  programmeStatus?: (key: string) => "open" | "waitlist" | "closed" | undefined;
}) {
  const statusCopy = { open: "Open", waitlist: "Waitlist", closed: "Closed" } as const;
  return (
    <RegSection
      index="D"
      icon={Laptop}
      title="Your Digital Skills path"
      hint="Pick one or more — your first choice becomes your main track. Skills intake opens March–April 2027."
    >
      <div>
        <span className="field-label">Skills you want to learn</span>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Skills">
          {tracks.map((track) => {
            const checked = d.skills.includes(track.key);
            const status = programmeStatus?.(track.key);
            const order = d.skills.indexOf(track.key);
            return (
              <CheckPill
                key={track.key}
                checked={checked}
                onToggle={() => set("skills", toggleList(d.skills, track.key))}
                sub={status ? `${statusCopy[status]}${checked && order === 0 ? " · main" : ""}` : checked && order === 0 ? "main" : undefined}
              >
                {track.name}
              </CheckPill>
            );
          })}
        </div>
        {errors.skills ? <p className="mt-1.5 text-xs font-medium text-danger">{errors.skills}</p> : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Experience level" htmlFor="reg-experience" error={errors.experienceLevel}>
          <Select
            id="reg-experience"
            value={d.experienceLevel}
            error={Boolean(errors.experienceLevel)}
            onChange={(e) => set("experienceLevel", e.target.value)}
          >
            {["Complete beginner","Some self-taught basics","I have a small portfolio","I already freelance"].map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </Select>
        </Field>
        <div>
          <span className="field-label">
            What will you use to learn?{" "}
            <span className="font-normal normal-case tracking-normal text-muted">(pick at least one)</span>
          </span>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Devices">
            {DEVICES.map((device) => (
              <CheckPill
                key={device.value}
                checked={d.deviceAccess.includes(device.value)}
                onToggle={() => set("deviceAccess", toggleList(d.deviceAccess, device.value))}
              >
                {device.label}
              </CheckPill>
            ))}
          </div>
          {errors.deviceAccess ? <p className="mt-1.5 text-xs font-medium text-danger">{errors.deviceAccess}</p> : null}
        </div>
      </div>
    </RegSection>
  );
}

/* ================================================================== */
/* Section D — Academics                                               */
/* ================================================================== */

const COMBINATIONS: Array<{ value: AcademicCombination; label: string; blurb: string }> = [
  { value: "science", label: "Science", blurb: "Maths, English + science subjects" },
  { value: "arts", label: "Arts", blurb: "English + arts & humanities subjects" },
  { value: "general", label: "Not sure / general", blurb: "We will help you choose" },
];

export function RegistrationAcademicFields({
  d,
  set,
  errors,
}: {
  d: RegistrationDetails;
  set: SetFn;
  errors: Errors;
}) {
  const pool = subjectPool(d);
  const toggleExam = (value: ExamTarget) => {
    let next: ExamTarget[];
    if (value === "not_writing") {
      next = d.examTargets.includes("not_writing") ? [] : ["not_writing"];
    } else {
      next = toggleList(d.examTargets as ExamTarget[], value).filter((v) => v !== "not_writing") as ExamTarget[];
    }
    set("examTargets", next);
  };

  return (
    <RegSection
      index="D"
      icon={NotebookPen}
      title="Your Academics path"
      hint="UTME, WAEC and NECO — we coach past questions, timing and nerves, live every week."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Current class level" htmlFor="reg-class" error={errors.academicClassLevel}>
          <Select
            id="reg-class"
            value={d.academicClassLevel}
            error={Boolean(errors.academicClassLevel)}
            onChange={(e) => set("academicClassLevel", e.target.value)}
          >
            <option value="">Select class level…</option>
            {CLASS_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </Select>
        </Field>
        <div>
          <span className="field-label">Which exam(s)?</span>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Exam targets">
            {EXAM_TARGETS.map((t) => (
              <CheckPill key={t.value} checked={d.examTargets.includes(t.value)} onToggle={() => toggleExam(t.value)}>
                {t.label}
              </CheckPill>
            ))}
          </div>
          {errors.examTargets ? <p className="mt-1.5 text-xs font-medium text-danger">{errors.examTargets}</p> : null}
        </div>
        {d.examTargets.includes("other") ? (
          <Field label="Which exam?" htmlFor="reg-other-exam" error={errors.otherExam} className="md:col-span-2">
            <Input
              id="reg-other-exam"
              placeholder="e.g. Post-UTME, Common Entrance…"
              value={d.otherExam}
              error={Boolean(errors.otherExam)}
              onChange={(e) => set("otherExam", e.target.value)}
            />
          </Field>
        ) : null}
      </div>

      {!d.examTargets.includes("not_writing") ? (
        <>
          <div className="mt-5">
            <span className="field-label">Subject combination</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {COMBINATIONS.map((combo) => {
                const active = d.combination === combo.value;
                return (
                  <button
                    key={combo.value}
                    type="button"
                    onClick={() => {
                      set("combination", combo.value);
                      const allowed = combo.value === "arts" ? ARTS_SUBJECTS : combo.value === "science" ? SCIENCE_SUBJECTS : ALL_SUBJECTS;
                      set("subjects", d.subjects.filter((s) => allowed.includes(s)));
                    }}
                    aria-pressed={active}
                    className={cn("reg-combo", active && "reg-combo-active")}
                  >
                    <span className="reg-combo-label">{combo.label}</span>
                    <span className="reg-combo-blurb">{combo.blurb}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-5">
            <span className="field-label">Subjects you are writing</span>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Subjects">
              {pool.map((subject) => (
                <CheckPill key={subject} checked={d.subjects.includes(subject)} onToggle={() => set("subjects", toggleList(d.subjects, subject))}>
                  {subject}
                </CheckPill>
              ))}
            </div>
            {errors.subjects ? <p className="mt-1.5 text-xs font-medium text-danger">{errors.subjects}</p> : null}
          </div>
        </>
      ) : null}
    </RegSection>
  );
}

/* ================================================================== */
/* Section D (shared) — Learning objectives                            */
/* ================================================================== */

export function RegistrationObjectivesField({
  d,
  set,
  errors,
  side,
}: {
  d: RegistrationDetails;
  set: SetFn;
  errors: Errors;
  side: RegistrationSide;
}) {
  return (
    <Field
      label={side === "academic" ? "What do you want out of this?" : "What will you build / why this track?"}
      htmlFor="reg-objectives"
      error={errors.learningObjectives}
      hint="Be specific — it shapes your first week and your check-in calls."
    >
      <Textarea
        id="reg-objectives"
        rows={3}
        placeholder={
          side === "academic"
            ? "e.g. I want to hit 300+ in UTME and gain admission into Medicine at UNILAG…"
            : "e.g. I want to earn my first freelance client within three months and stop depending on my uncle's shop…"
        }
        value={d.learningObjectives}
        error={Boolean(errors.learningObjectives)}
        onChange={(e) => set("learningObjectives", e.target.value)}
      />
    </Field>
  );
}

/* ================================================================== */
/* Section E — Additional + consents                                   */
/* ================================================================== */

export function RegistrationAdditionalFields({
  d,
  set,
  errors,
  termsLabel,
}: {
  d: RegistrationDetails;
  set: SetFn;
  errors: Errors;
  termsLabel: React.ReactNode;
}) {
  return (
    <RegSection index="E" icon={Sparkles} title="Last touches" hint="Two quick things, then you are in.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="How did you hear about us?" htmlFor="reg-how" optional>
          <Select id="reg-how" value={d.howHeard} onChange={(e) => set("howHeard", e.target.value)}>
            <option value="">Select…</option>
            {HOW_HEARD.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </Select>
        </Field>
        <div>
          <span className="field-label">How should we reach you?</span>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Preferred contact">
            {PREFERRED_CONTACT.map((p) => (
              <CheckPill
                key={p.value}
                checked={d.preferredContact === p.value}
                onToggle={() => set("preferredContact", p.value)}
              >
                {p.label}
              </CheckPill>
            ))}
          </div>
          {errors.preferredContact ? <p className="mt-1.5 text-xs font-medium text-danger">{errors.preferredContact}</p> : null}
        </div>
      </div>
      <Field label="Anything else we should know?" htmlFor="reg-notes" optional className="mt-4">
        <Textarea
          id="reg-notes"
          rows={2}
          placeholder="e.g. I work night shifts; best time to reach me is after 6pm…"
          value={d.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </Field>

      <div className="mt-5 grid gap-2.5">
        <label className="reg-check" htmlFor="reg-consent-terms">
          <input id="reg-consent-terms" type="checkbox" className="reg-checkbox" checked={d.consentTerms} onChange={(e) => set("consentTerms", e.target.checked)} />
          <span className="reg-check-box" aria-hidden="true">{d.consentTerms ? <Check size={12} strokeWidth={3.4} /> : null}</span>
          <span>{termsLabel}</span>
        </label>
        {errors.consentTerms ? <p className="-mt-1.5 pl-8 text-xs font-medium text-danger">{errors.consentTerms}</p> : null}
        <label className="reg-check" htmlFor="reg-consent-privacy">
          <input id="reg-consent-privacy" type="checkbox" className="reg-checkbox" checked={d.consentPrivacy} onChange={(e) => set("consentPrivacy", e.target.checked)} />
          <span className="reg-check-box" aria-hidden="true">{d.consentPrivacy ? <Check size={12} strokeWidth={3.4} /> : null}</span>
          <span>
            I have read and accept the{" "}
            <a className="underline underline-offset-2 decoration-line hover:text-ink" href="/privacy" target="_blank" rel="noreferrer">privacy notice</a> — we store my details securely and never sell them.
          </span>
        </label>
        {errors.consentPrivacy ? <p className="-mt-1.5 pl-8 text-xs font-medium text-danger">{errors.consentPrivacy}</p> : null}
        <label className="reg-check" htmlFor="reg-consent-comms">
          <input id="reg-consent-comms" type="checkbox" className="reg-checkbox" checked={d.consentComms} onChange={(e) => set("consentComms", e.target.checked)} />
          <span className="reg-check-box" aria-hidden="true">{d.consentComms ? <Check size={12} strokeWidth={3.4} /> : null}</span>
          <span>Send me onboarding details, class reminders and group links on my preferred channel (you can opt out anytime).</span>
        </label>
      </div>
    </RegSection>
  );
}
