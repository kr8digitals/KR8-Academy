import { beforeEach, describe, expect, it } from "vitest";
import { emptyRegistrationDetails, buildCloudRegistration } from "../src/lib/registration";
import { exportRegistrationRecords, importRegistrationRecords, isRegistrationRecords, listRegistrations, saveRegistration, updateRegistrationStatus } from "../src/lib/registrar";

function makeRegistration(name = "Amina Okafor") {
  const details = {
    ...emptyRegistrationDetails(),
    name,
    dob: "2002-05-10",
    email: `${name.toLowerCase().replaceAll(" ", ".")}@example.com`,
    phone: "8012345678",
    city: "Aba",
    state: "Abia",
    lga: "Aba South",
    country: "NG",
    skills: ["graphic"],
    deviceAccess: ["smartphone"],
    consentTerms: true,
    consentPrivacy: true,
  };
  return buildCloudRegistration(details, "skill", `KR8-2026-${name.slice(0, 4).toUpperCase()}`);
}

beforeEach(() => window.localStorage.clear());

describe("registration desk", () => {
  it("saves and lists a full registration packet", async () => {
    const result = await saveRegistration(makeRegistration());
    const listed = await listRegistrations({ search: "Aba" });
    expect(result.saved).toBe(true);
    expect(listed.rows).toHaveLength(1);
    expect(listed.rows[0]).toMatchObject({ full_name: "Amina Okafor", city: "Aba", status: "new" });
  });

  it("filters by pathway and status and persists pipeline changes", async () => {
    await saveRegistration(makeRegistration());
    const [row] = (await listRegistrations()).rows;
    await updateRegistrationStatus(row.id, "contacted");
    expect((await listRegistrations({ status: "new" })).rows).toHaveLength(0);
    expect((await listRegistrations({ category: "skill", status: "contacted" })).rows[0]?.status).toBe("contacted");
    expect((await listRegistrations({ category: "academic" })).rows).toHaveLength(0);
  });

  it("does not add a duplicate email or phone record", async () => {
    await saveRegistration(makeRegistration());
    await saveRegistration(makeRegistration("Amina Okafor"));
    expect((await listRegistrations()).rows).toHaveLength(1);
  });

  it("includes the registration desk in export and restore bundles", async () => {
    await saveRegistration(makeRegistration());
    const records = exportRegistrationRecords();
    expect(isRegistrationRecords(records)).toBe(true);
    window.localStorage.clear();
    expect(importRegistrationRecords(records)).toBe(true);
    expect((await listRegistrations()).rows).toHaveLength(1);
    expect(importRegistrationRecords({ malformed: true })).toBe(false);
  });
});
