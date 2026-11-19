import {
  captureRegistrationStorage,
  importRegistrationRecords,
  isRegistrationRecords,
  restoreRegistrationStorage,
} from "./registrar";
import {
  importDatabase,
  MAX_IMPORT_BYTES,
  validateDatabaseImport,
} from "./store";

export const BACKUP_FORMAT = "kr8-academy-backup-v2";

type BackupRestoreResult = {
  ok: boolean;
  error?: string;
  safetySnapshotSaved?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validate an entire restore bundle before changing either localStorage key.
 * If the second write fails, restore the registration key to its exact prior
 * value; the Academy import itself also fails closed when its write is denied. */
export function restoreBackupText(json: string): BackupRestoreResult {
  if (new TextEncoder().encode(json).byteLength > MAX_IMPORT_BYTES) {
    return {
      ok: false,
      error: "This backup exceeds the 5 MB local import limit. Download a smaller backup or remove large attachments first.",
    };
  }

  let academyJson = json;
  let registrations: unknown;
  let isBundle = false;
  try {
    const parsed: unknown = JSON.parse(json);
    if (isRecord(parsed) && parsed.format === BACKUP_FORMAT) {
      isBundle = true;
      if (!Object.prototype.hasOwnProperty.call(parsed, "academy") || !Object.prototype.hasOwnProperty.call(parsed, "registrations") || !isRegistrationRecords(parsed.registrations)) {
        return { ok: false, error: "The academy backup is incomplete or invalid. Nothing was imported." };
      }
      academyJson = JSON.stringify(parsed.academy);
      registrations = parsed.registrations;
    }
  } catch {
    return { ok: false, error: "That file is not valid JSON. The current local workspace was left unchanged." };
  }

  const validation = validateDatabaseImport(academyJson);
  if (!validation.ok) return { ok: false, error: validation.error ?? "That backup could not be validated. Nothing was imported." };

  let previousRegistrationStorage: string | null = null;
  if (isBundle) {
    const snapshot = captureRegistrationStorage();
    if (!snapshot.available) {
      return { ok: false, error: "The browser could not read the current registration records. Nothing was imported." };
    }
    previousRegistrationStorage = snapshot.value;
    if (!importRegistrationRecords(registrations)) {
      return { ok: false, error: "The registration records could not be saved. The current Academy data was left unchanged." };
    }
  }

  const result = importDatabase(academyJson);
  if (!result.ok) {
    if (isBundle && !restoreRegistrationStorage(previousRegistrationStorage)) {
      return {
        ok: false,
        error: `${result.error ?? "The Academy data could not be saved."} Registration records may have changed; reload and check local storage before continuing.`,
      };
    }
    return { ok: false, error: result.error ?? "That backup could not be restored. The current workspace was left unchanged." };
  }

  return { ok: true, safetySnapshotSaved: result.safetySnapshotSaved };
}
