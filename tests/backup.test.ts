import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedTestAcademy } from "./fixtures";
import { BACKUP_FORMAT, restoreBackupText } from "../src/lib/backup";
import { buildCloudRegistration, emptyRegistrationDetails } from "../src/lib/registration";
import { exportRegistrationRecords, saveRegistration } from "../src/lib/registrar";
import { exportDatabase, STORAGE_KEY } from "../src/lib/store";

const REGISTRATIONS_KEY = "kr8.academy.registrations.v1";

async function addRegistration(name: string, email: string) {
  const details = {
    ...emptyRegistrationDetails(),
    name,
    email,
    phone: "8012345678",
    country: "NG",
    state: "Abia",
    lga: "Aba South",
    city: "Aba",
    skills: ["graphic"],
    consentTerms: true,
    consentPrivacy: true,
  };
  return saveRegistration(buildCloudRegistration(details, "skill", `KR8-${name.replaceAll(" ", "-")}`));
}

function backupWith(academy: unknown, registrations: unknown): string {
  return JSON.stringify({ format: BACKUP_FORMAT, academy, registrations });
}

function incomingAcademy() {
  const academy = JSON.parse(exportDatabase());
  academy.settings.cohortName = "Restored local workspace";
  // The importer removes known demo/sample accounts even from current-schema backups.
  academy.students = academy.students.map((student: { sample?: boolean }) => ({ ...student, sample: false }));
  return academy;
}

beforeEach(async () => {
  await seedTestAcademy();
});

describe("local backup restore", () => {
  it("applies a complete bundle after validating both stores", async () => {
    await addRegistration("Current Applicant", "current@example.test");
    const imported = incomingAcademy();
    imported.settings.cohortName = "Imported cohort";
    const sourceRows = exportRegistrationRecords().map((row) => ({ ...row, id: row.id + 100, full_name: "Backup Applicant", email: "backup@example.test" }));

    const result = restoreBackupText(backupWith(imported, sourceRows));

    expect(result.ok).toBe(true);
    expect(exportDatabase() && JSON.parse(exportDatabase()).settings.cohortName).toBe("Imported cohort");
    expect(exportRegistrationRecords().map((row) => row.email)).toEqual(["backup@example.test"]);
    expect(result.safetySnapshotSaved).toBe(true);
  });

  it("rejects malformed academy data before touching registration records", async () => {
    await addRegistration("Current Applicant", "current@example.test");
    const previousDb = exportDatabase();
    const previousRegistrationStorage = window.localStorage.getItem(REGISTRATIONS_KEY);
    const imported = incomingAcademy();
    imported.settings.cohortName = "Should not be applied";
    imported.students[0].prefs = "bad-shape";
    const incomingRows = exportRegistrationRecords().map((row) => ({ ...row, full_name: "Changed Applicant", email: "changed@example.test" }));

    const result = restoreBackupText(backupWith(imported, incomingRows));

    expect(result.ok).toBe(false);
    expect(exportDatabase()).toBe(previousDb);
    expect(window.localStorage.getItem(REGISTRATIONS_KEY)).toBe(previousRegistrationStorage);
  });

  it("rejects a malformed registration table before importing the academy", async () => {
    const previousDb = exportDatabase();
    const imported = incomingAcademy();
    imported.settings.cohortName = "Should not be applied";
    const result = restoreBackupText(backupWith(imported, [{ id: 1, full_name: "Missing required fields" }]));

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/incomplete or invalid/i);
    expect(exportDatabase()).toBe(previousDb);
    expect(window.localStorage.getItem(REGISTRATIONS_KEY)).toBeNull();
  });

  it("rolls back registration writes when the Academy storage write fails", async () => {
    await addRegistration("Current Applicant", "current@example.test");
    const previousDb = exportDatabase();
    const previousRegistrationStorage = window.localStorage.getItem(REGISTRATIONS_KEY);
    const imported = incomingAcademy();
    imported.settings.cohortName = "Should not be applied";
    const sourceRows = exportRegistrationRecords().map((row) => ({ ...row, id: row.id + 100, email: "backup@example.test" }));
    const realSetItem = window.localStorage.setItem.bind(window.localStorage);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === STORAGE_KEY) throw new DOMException("Storage quota exceeded", "QuotaExceededError");
      return realSetItem(key, value);
    });

    const result = restoreBackupText(backupWith(imported, sourceRows));

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/could not save/i);
    expect(exportDatabase()).toBe(previousDb);
    expect(window.localStorage.getItem(REGISTRATIONS_KEY)).toBe(previousRegistrationStorage);
  });

  it("applies the 5 MB limit to the full outer backup", () => {
    const previousDb = exportDatabase();
    const result = restoreBackupText("x".repeat(5_000_001));

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/5 MB/i);
    expect(exportDatabase()).toBe(previousDb);
  });
});
