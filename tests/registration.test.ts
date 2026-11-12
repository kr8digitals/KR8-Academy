/* Registration system — domain logic + the cloud registrar gateway. */
import { beforeEach, describe, expect, it } from "vitest";
import {
  buildCloudRegistration,
  emptyRegistrationDetails,
  normalizeRegisterPhone,
  validateAdditional,
  validateEducation,
  validateIdentity,
  validateLocation,
  validatePathway,
  validateRegistration,
  type RegistrationDetails,
} from "../src/lib/registration";
import { listRegistrations, saveRegistration, waLink, defaultWhatsAppGreeting } from "../src/lib/registrar";
import { db, reseed, registerStudent } from "../src/lib/store";

function filledDetails(): RegistrationDetails {
  const d = emptyRegistrationDetails();
  d.name = "QA Runner";
  d.dob = "2003-04-18";
  d.gender = "female";
  d.email = "qa.runner@example.com";
  d.dial = "+234";
  d.phone = "08123456789";
  d.sameWhatsapp = true;
  d.country = "NG";
  d.state = "Abia";
  d.lga = "Aba South";
  d.city = "Aba";
  d.community = "Osisioma";
  d.educationLevel = "Senior secondary (SS1–SS3)";
  d.skills = ["video", "graphic"];
  d.experienceLevel = "Complete beginner";
  d.deviceAccess = ["smartphone", "laptop"];
  d.learningObjectives = "I want my first paid client within three months of joining the cohort.";
  d.howHeard = "Instagram";
  d.preferredContact = "whatsapp";
  d.consentTerms = true;
  d.consentPrivacy = true;
  d.consentComms = true;
  return d;
}

beforeEach(() => {
  window.localStorage.clear();
  reseed();
});


describe("validateIdentity", () => {
  it("accepts a complete identity", () => {
    expect(validateIdentity(filledDetails())).toEqual({});
  });
  it("rejects under-16 applicants", () => {
    const d = filledDetails();
    d.dob = "2015-01-01";
    expect(validateIdentity(d).dob).toMatch(/16/);
  });
  it("rejects bad email and bad phone", () => {
    const d = filledDetails();
    d.email = "not-an-email";
    d.phone = "12";
    const errors = validateIdentity(d);
    expect(errors.email).toBeTruthy();
    expect(errors.phone).toBeTruthy();
  });
  it("requires a separate WhatsApp number when not shared", () => {
    const d = filledDetails();
    d.sameWhatsapp = false;
    d.whatsapp = "";
    expect(validateIdentity(d).whatsapp).toBeTruthy();
    d.whatsapp = "901 111 2222";
    d.whatsappDial = "+234";
    expect(validateIdentity(d).whatsapp).toBeUndefined();
  });
});

describe("validateLocation", () => {
  it("requires state and LGA for Nigeria", () => {
    const d = filledDetails();
    d.state = "";
    d.lga = "";
    const errors = validateLocation(d);
    expect(errors.state).toBeTruthy();
    expect(errors.lga).toBeTruthy();
  });
  it("drops state/LGA needs outside Nigeria", () => {
    const d = filledDetails();
    d.country = "GH";
    d.state = "";
    d.lga = "";
    d.city = "Accra";
    expect(validateLocation(d)).toEqual({});
  });
});

describe("validatePathway", () => {
  it("requires a skill, a device and a real objective", () => {
    const d = filledDetails();
    d.skills = [];
    d.deviceAccess = [];
    d.learningObjectives = "short";
    const errors = validatePathway(d, "skill");
    expect(errors.skills).toBeTruthy();
    expect(errors.deviceAccess).toBeTruthy();
    expect(errors.learningObjectives).toBeTruthy();
  });
  it("academics: needs class level, exams and subjects", () => {
    const d = filledDetails();
    d.academicClassLevel = "";
    d.examTargets = [];
    d.subjects = [];
    const errors = validatePathway(d, "academic");
    expect(errors.academicClassLevel).toBeTruthy();
    expect(errors.examTargets).toBeTruthy();
  });
  it("academics: subjects not required when not writing yet", () => {
    const d = filledDetails();
    d.academicClassLevel = "SS2";
    d.examTargets = ["not_writing"];
    d.subjects = [];
    const errors = validatePathway(d, "academic");
    expect(errors.subjects).toBeUndefined();
    expect(errors.learningObjectives).toBeUndefined();
  });
});

describe("validateAdditional + validateRegistration", () => {
  it("consent is required but comms is optional", () => {
    const d = filledDetails();
    d.consentTerms = false;
    d.consentPrivacy = false;
    d.consentComms = false; // explicitly declining marketing is fine
    const errors = validateAdditional(d);
    expect(errors.consentTerms).toBeTruthy();
    expect(errors.consentPrivacy).toBeTruthy();
    expect(errors.consentComms).toBeUndefined();
  });
  it("validateRegistration reports the first incomplete section", () => {
    const d = emptyRegistrationDetails();
    d.consentTerms = true;
    const { firstSection } = validateRegistration(d, "skill");
    expect(firstSection).toBe(1);
  });
});

describe("normalizeRegisterPhone + buildCloudRegistration", () => {
  it("normalises Nigerian numbers", () => {
    expect(normalizeRegisterPhone("+234", "0812 345 6789")).toBe("+2348123456789");
  });
  it("maps the packet to the registrations column layout", () => {
    const d = filledDetails();
    const row = buildCloudRegistration(d, "skill", "KR8-26-TEST1");
    expect(row.full_name).toBe("QA Runner");
    expect(row.email).toBe("qa.runner@example.com");
    expect(row.phone).toBe("+2348123456789");
    expect(row.whatsapp_number).toBe(row.phone);
    expect(row.state).toBe("Abia");
    expect(row.lga).toBe("Aba South");
    expect(row.category).toBe("skill");
    expect(row.skills).toEqual(["video", "graphic"]);
    expect(row.device_access).toEqual(["smartphone", "laptop"]);
    expect(row.learning_objectives).toBe(d.learningObjectives);
    expect(row.consent_terms).toBe(true);
    expect(row.status).toBe("new");
    expect(row.kr8_id).toBe("KR8-26-TEST1");
    expect(row.exam_targets).toBeNull();
    expect(row.subjects).toBeNull();
  });
  it("maps the academic packet and drops skill fields", () => {
    const d = filledDetails();
    d.academicClassLevel = "SS2";
    d.examTargets = ["utme", "waec"];
    d.combination = "science";
    d.subjects = ["Mathematics", "Physics"];
    const row = buildCloudRegistration(d, "academic", "KR8-26-TEST2");
    expect(row.category).toBe("academic");
    expect(row.academic_class).toBe("SS2");
    expect(row.exam_targets).toEqual(["utme", "waec"]);
    expect(row.subjects).toEqual(["Mathematics", "Physics"]);
    expect(row.subject_combination).toBe("science");
    expect(row.skills).toBeNull();
    expect(row.device_access).toBeNull();
  });
});

describe("registerStudent allowWaitlist (fallback registration)", () => {
  it("creates a live account even on a waitlisted track", async () => {
    // video is waitlisted in the seeded programme settings
    expect(db().programmes.find((p) => p.key === "video")?.status).toBe("waitlist");
    const result = await registerStudent({
      name: "Fallback Registrant",
      email: "fallback.registrant@example.com",
      phone: "+2348120000001",
      country: "NG",
      trackKey: "video",
      dob: "2004-06-01",
      password: "Password!2027",
      motivation: "Wants in at the front of the queue.",
      city: "Aba",
      side: "skill",
      allowWaitlist: true,
    });
    expect(result.ok).toBe(true);
    expect(result.student?.status).toBe("active");
    const application = db().applications.find((a) => a.studentId === result.student?.id);
    expect(application?.status).toBe("waitlist");
  });

  it("hard-blocks waitlisted tracks without the fallback flag", async () => {
    const result = await registerStudent({
      name: "Ordinary Registrant",
      email: "ordinary.registrant@example.com",
      phone: "+2348120000002",
      country: "NG",
      trackKey: "video",
      dob: "2004-06-01",
      password: "Password!2027",
      side: "skill",
    });
    expect(result.ok).toBe(false);
    expect(result.waitlist).toBe(true);
  });
});

describe("application registration record", () => {
  it("saves the full packet for the registration desk without a network request", async () => {
    const result = await saveRegistration(buildCloudRegistration(filledDetails(), "skill", "KR8-26-CLOUD1"));
    const listed = await listRegistrations({ search: "KR8-26-CLOUD1" });
    expect(result.saved).toBe(true);
    expect(listed.rows).toHaveLength(1);
    expect(listed.rows[0]?.kr8_id).toBe("KR8-26-CLOUD1");
    expect(listed.rows[0]?.full_name).toBe("QA Runner");
  });
});

describe("deep links", () => {
  it("builds wa.me links with digits only", () => {
    expect(waLink("+234 812-345 6789", "hello")).toBe("https://wa.me/2348123456789?text=hello");
  });
  it("greets by first name and pathway", async () => {
    await saveRegistration(buildCloudRegistration(filledDetails(), "skill", "KR8-26-TEST3"));
    const [row] = (await listRegistrations()).rows;
    expect(defaultWhatsAppGreeting(row, "Video Editing & Animation")).toContain("QA");
    expect(defaultWhatsAppGreeting(row, "Video Editing & Animation")).toContain("Video Editing & Animation");
  });
});
