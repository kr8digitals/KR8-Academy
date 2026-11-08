/* Registration — shared domain logic for the KR8 Academy fallback registration.

   "Fallback" means: no third-party identity provider, no codes, no gates — the
   registration simply completes once the visitor supplies their details, and
   the full packet lands in the shared cloud registrar (public.registrations)
   with a local copy in the student database. If the network is down, the
   payload waits in a local outbox and retries automatically. */

import type { AcademicCombination } from "./types";
import { isValidEmail, isValidPhone, ageFromDob } from "./utils";

export type RegistrationSide = "skill" | "academic";
export type PreferredContact = "whatsapp" | "call" | "sms" | "email";

export const COUNTRIES = [
  { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬" },
  { code: "GH", name: "Ghana", dial: "+233", flag: "🇬🇭" },
  { code: "KE", name: "Kenya", dial: "+254", flag: "🇰🇪" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦" },
  { code: "CM", name: "Cameroon", dial: "+237", flag: "🇨🇲" },
  { code: "CI", name: "Côte d'Ivoire", dial: "+225", flag: "🇨🇮" },
  { code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "IE", name: "Ireland", dial: "+353", flag: "🇮🇪" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "OTHER", name: "Other country", dial: "+", flag: "🌍" },
] as const;

export const GENDERS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "prefer_not", label: "Prefer not to say" },
] as const;

export const EDUCATION_LEVELS = [
  "Still in primary school",
  "Junior secondary (JSS)",
  "Senior secondary (SS1–SS3)",
  "Finished secondary school",
  "OND / NCE / Diploma",
  "HND",
  "Bachelor's degree (in view)",
  "Bachelor's degree",
  "Master's degree or higher",
  "Not currently in school",
  "Other",
];

export const CURRENT_LEVELS = [
  "SS1", "SS2", "SS3", "Finished secondary", "100 level", "200 level", "300 level",
  "400 level", "500 level", "HND / Diploma year", "NYSC / gap year", "Not in school",
];

export const EXPERIENCE = [
  "Complete beginner",
  "Some self-taught basics",
  "I have a small portfolio",
  "I already freelance",
];

export const DEVICES = [
  { value: "smartphone", label: "Smartphone" },
  { value: "laptop", label: "Laptop" },
  { value: "desktop", label: "Desktop computer" },
  { value: "tablet", label: "Tablet" },
  { value: "shared", label: "Shared / borrowed device" },
] as const;

export const HOW_HEARD = [
  "WhatsApp",
  "Instagram",
  "TikTok",
  "X (Twitter)",
  "YouTube",
  "Facebook",
  "Friend or family",
  "School, church or mosque",
  "Community centre / event",
  "KR8 Digitals agency",
  "Flyer or poster",
  "Google / search",
  "Other",
];

export const PREFERRED_CONTACT: Array<{ value: PreferredContact; label: string }> = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "call", label: "Phone call" },
  { value: "sms", label: "Text message (SMS)" },
  { value: "email", label: "Email" },
];

export const EXAM_TARGETS = [
  { value: "utme", label: "UTME / JAMB" },
  { value: "waec", label: "WAEC" },
  { value: "neco", label: "NECO" },
  { value: "other", label: "Another exam" },
  { value: "not_writing", label: "Not writing an exam yet" },
] as const;
export type ExamTarget = (typeof EXAM_TARGETS)[number]["value"];

export const CLASS_LEVELS = ["SS1", "SS2", "SS3", "Finished secondary", "University / other"];

export interface RegistrationDetails {
  /* Section A — personal */
  name: string;
  dob: string;
  gender: string; // "" | "female" | "male" | "prefer_not"
  email: string;
  dial: string;
  phone: string;
  sameWhatsapp: boolean;
  whatsappDial: string;
  whatsapp: string;
  /* Section B — location */
  country: string;
  state: string;
  lga: string;
  city: string;
  community: string;
  /* Section C — education */
  educationLevel: string;
  institution: string;
  courseOfStudy: string;
  currentLevel: string; // class / level, e.g. SS3, 200 level, HND year 1
  occupation: string;
  /* Section D (skills) */
  skills: string[]; // track keys, first = primary
  experienceLevel: string;
  deviceAccess: string[];
  /* Section D (academic) */
  academicClassLevel: string;
  examTargets: ExamTarget[];
  otherExam: string;
  combination: AcademicCombination;
  subjects: string[];
  /* Section D (shared) */
  learningObjectives: string;
  /* Section E — additional */
  howHeard: string;
  preferredContact: PreferredContact;
  notes: string;
  /* Consents */
  consentTerms: boolean;
  consentPrivacy: boolean;
  consentComms: boolean;
}

export function emptyRegistrationDetails(): RegistrationDetails {
  return {
    name: "",
    dob: "",
    gender: "",
    email: "",
    dial: "+234",
    phone: "",
    sameWhatsapp: true,
    whatsappDial: "+234",
    whatsapp: "",
    country: "NG",
    state: "",
    lga: "",
    city: "",
    community: "",
    educationLevel: "",
    institution: "",
    courseOfStudy: "",
    currentLevel: "",
    occupation: "",
    skills: [],
    experienceLevel: EXPERIENCE[0],
    deviceAccess: [],
    academicClassLevel: "",
    examTargets: ["utme"],
    otherExam: "",
    combination: "science",
    subjects: [],
    learningObjectives: "",
    howHeard: "",
    preferredContact: "whatsapp",
    notes: "",
    consentTerms: false,
    consentPrivacy: false,
    consentComms: true,
  };
}

export const REGISTRATION_DRAFT_KEY = "kr8.academy.registration.v1";

export function normalizeRegisterPhone(dial: string, national: string): string {
  return `${dial}${national.replace(/^0+/, "").replace(/\s+/g, "")}`;
}

export type RegistrationErrors = Record<string, string>;

export function validateIdentity(d: RegistrationDetails): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (d.name.trim().length < 3) errors.name = "Enter your full name — as it should appear on your certificate.";
  if (!d.dob) errors.dob = "Add your date of birth.";
  else {
    const age = ageFromDob(d.dob);
    if (age === null || age < 16) errors.dob = "You must be 16 or older to join.";
    else if (age > 90) errors.dob = "That date does not look right.";
  }
  if (!isValidEmail(d.email)) errors.email = "Enter a valid email address.";
  if (!isValidPhone(normalizeRegisterPhone(d.dial, d.phone))) errors.phone = "Enter a valid phone number.";
  if (!d.sameWhatsapp && !isValidPhone(normalizeRegisterPhone(d.whatsappDial, d.whatsapp)))
    errors.whatsapp = "Enter a valid WhatsApp number (or tick “same as my phone”).";
  return errors;
}

export function validateLocation(d: RegistrationDetails): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (!d.country) errors.country = "Select your country.";
  if (d.country === "NG") {
    if (!d.state) errors.state = "Select your state.";
    if (!d.lga) errors.lga = "Select your LGA.";
    if (d.city.trim().length < 2) errors.city = "Enter your city or town.";
  } else {
    if (d.city.trim().length < 2) errors.city = "Enter your city.";
  }
  return errors;
}

export function validateEducation(d: RegistrationDetails): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (!d.educationLevel) errors.educationLevel = "Select your current educational level.";
  return errors;
}

export function validatePathway(d: RegistrationDetails, side: RegistrationSide): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (side === "skill") {
    if (d.skills.length === 0) errors.skills = "Pick the skill you want to learn — your first choice is your main track.";
    if (!d.experienceLevel) errors.experienceLevel = "Choose your experience level.";
    if (d.deviceAccess.length === 0) errors.deviceAccess = "Tell us what you will use to learn.";
  } else {
    if (!d.academicClassLevel) errors.academicClassLevel = "Select your class level.";
    if (d.examTargets.length === 0) errors.examTargets = "Pick at least one exam — or “Not writing an exam yet”.";
    if (d.examTargets.includes("other") && d.otherExam.trim().length < 2)
      errors.otherExam = "Tell us the exam you are preparing for.";
    if (!d.examTargets.includes("not_writing") && d.subjects.length === 0)
      errors.subjects = "Pick at least one subject.";
  }
  if (d.learningObjectives.trim().length < 20)
    errors.learningObjectives = "Tell us at least a sentence or two (20+ characters).";
  return errors;
}

export function validateAdditional(d: RegistrationDetails): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (!d.preferredContact) errors.preferredContact = "Choose how we should reach you.";
  if (!d.consentTerms) errors.consentTerms = "Please accept the academy terms.";
  if (!d.consentPrivacy) errors.consentPrivacy = "Please accept the privacy notice.";
  return errors;
}

export function validateRegistration(
  d: RegistrationDetails,
  side: RegistrationSide
): { errors: RegistrationErrors; firstSection: 1 | 2 | 3 | null } {
  const merged: RegistrationErrors = {};
  const identity = validateIdentity(d);
  const location = validateLocation(d);
  const education = validateEducation(d);
  const pathway = validatePathway(d, side);
  const additional = validateAdditional(d);
  Object.assign(merged, identity, location, education, pathway, additional);
  const keys = Object.keys(merged);
  if (keys.length === 0) return { errors: {}, firstSection: null };
  let firstSection: 1 | 2 | 3 = 1;
  const section1 = ["name", "dob", "email", "phone", "whatsapp", "country", "state", "lga", "city", "community", "educationLevel", "institution", "courseOfStudy", "currentLevel", "occupation"];
  const section2 = ["skills", "experienceLevel", "deviceAccess", "academicClassLevel", "examTargets", "otherExam", "subjects", "learningObjectives"];
  if (section1.some((k) => keys.includes(k))) firstSection = 1;
  else if (section2.some((k) => keys.includes(k))) firstSection = 2;
  else firstSection = 3;
  return { errors: merged, firstSection };
}

export interface CloudRegistration {
  id: number;
  created_at: string;
  updated_at: string;
  full_name: string;
  dob: string | null;
  gender: string | null;
  email: string;
  phone: string;
  whatsapp_number: string | null;
  country: string;
  state: string | null;
  lga: string | null;
  city: string | null;
  community: string | null;
  education_level: string | null;
  institution: string | null;
  course_of_study: string | null;
  class_level: string | null;
  occupation: string | null;
  category: string;
  skills: string[] | null;
  experience_level: string | null;
  device_access: string[] | null;
  learning_objectives: string | null;
  exam_targets: string[] | null;
  academic_class: string | null;
  subject_combination: string | null;
  subjects: string[] | null;
  how_heard: string | null;
  preferred_contact: string | null;
  notes: string | null;
  consent_terms: boolean;
  consent_privacy: boolean;
  consent_comms: boolean;
  kr8_id: string | null;
  status: "new" | "contacted" | "converted" | "dropped";
}

/** Maps the form payload to the public.registrations column layout. */
export function buildCloudRegistration(
  d: RegistrationDetails,
  side: RegistrationSide,
  kr8Id?: string
): Omit<CloudRegistration, "id" | "created_at" | "updated_at" | "status"> & { status: "new" } {
  const phone = normalizeRegisterPhone(d.dial, d.phone);
  const whatsapp = d.sameWhatsapp
    ? phone
    : normalizeRegisterPhone(d.whatsappDial, d.whatsapp);
  const isNg = d.country === "NG";
  return {
    full_name: d.name.trim().replace(/\s+/g, " "),
    dob: d.dob || null,
    gender: d.gender || null,
    email: d.email.trim().toLowerCase(),
    phone,
    whatsapp_number: whatsapp,
    country: d.country,
    state: isNg ? d.state : null,
    lga: isNg ? d.lga : null,
    city: d.city.trim(),
    community: d.community.trim() || null,
    education_level: d.educationLevel,
    institution: d.institution.trim() || null,
    course_of_study: d.courseOfStudy.trim() || null,
    class_level: d.currentLevel || (side === "academic" ? d.academicClassLevel : null),
    occupation: d.occupation.trim() || null,
    category: side,
    skills: side === "skill" ? [...d.skills] : null,
    experience_level: side === "skill" ? d.experienceLevel : null,
    device_access: side === "skill" ? [...d.deviceAccess] : null,
    learning_objectives: d.learningObjectives.trim(),
    exam_targets: side === "academic" ? [...d.examTargets] : null,
    academic_class: side === "academic" ? d.academicClassLevel : null,
    subject_combination: side === "academic" ? d.combination : null,
    subjects: side === "academic" ? [...d.subjects] : null,
    how_heard: d.howHeard || null,
    preferred_contact: d.preferredContact,
    notes: d.notes.trim() || null,
    consent_terms: d.consentTerms,
    consent_privacy: d.consentPrivacy,
    consent_comms: d.consentComms,
    kr8_id: kr8Id ?? null,
    status: "new",
  };
}
