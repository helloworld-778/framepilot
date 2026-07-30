import type { ZodType } from "zod";

import { STORAGE_KEYS } from "@/lib/constants";
import {
  draftEnvelopeSchema,
  preferencesSchema,
  projectsEnvelopeSchema,
} from "@/lib/schemas";
import type {
  DirectorOutput,
  DraftEnvelope,
  Preferences,
  ProjectsEnvelope,
  SavedProject,
  SceneBrief,
} from "@/types";

/**
 * Browser persistence.
 *
 * Rules that hold for every accessor here:
 *  - never touch `window` without a guard, so prerender cannot break
 *  - never trust what comes back: everything is re-validated with Zod
 *  - never throw at the caller: corrupt data is quarantined and reported
 */

export type ReadResult<T> =
  | { status: "ok"; value: T }
  | { status: "empty" }
  | { status: "recovered"; reason: string };

export type WriteResult =
  | { status: "ok" }
  | { status: "failed"; reason: "unavailable" | "quota" | "unknown" };

const DEFAULT_PREFERENCES: Preferences = { schemaVersion: 1 };

export function isStorageAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const probe = "framepilot:probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** Move unreadable data aside instead of deleting it, then carry on. */
function quarantine(key: string, raw: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(`framepilot:corrupt:${key}:${Date.now()}`, raw);
  } catch {
    // If we cannot even park it, dropping it is still better than crashing.
  }
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore: the next read will quarantine again at worst.
  }
}

function writeRaw(key: string, value: unknown): WriteResult {
  if (typeof window === "undefined") {
    return { status: "failed", reason: "unavailable" };
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem(STORAGE_KEYS.schemaVersion, "1");
    return { status: "ok" };
  } catch (error) {
    const isQuota =
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");
    return { status: "failed", reason: isQuota ? "quota" : "unknown" };
  }
}

function readValidated<T>(key: string, schema: ZodType<T>): ReadResult<T> {
  if (typeof window === "undefined") {
    return { status: "empty" };
  }

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return { status: "recovered", reason: "Local storage is blocked in this browser." };
  }

  if (raw === null || raw.length === 0) {
    return { status: "empty" };
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(raw);
  } catch {
    quarantine(key, raw);
    return {
      status: "recovered",
      reason: "Saved data could not be read, so it was set aside and cleared.",
    };
  }

  const result = schema.safeParse(candidate);
  if (!result.success) {
    quarantine(key, raw);
    return {
      status: "recovered",
      reason: "Saved data did not match the current format, so it was set aside.",
    };
  }

  return { status: "ok", value: result.data };
}

/* ------------------------------------------------------------------ *
 * Draft — the single in-progress scene
 * ------------------------------------------------------------------ */

export function readDraft(): ReadResult<DraftEnvelope> {
  return readValidated(STORAGE_KEYS.draft, draftEnvelopeSchema);
}

export function writeDraft(
  brief: SceneBrief,
  output: DirectorOutput,
  now: string,
): WriteResult {
  const envelope: DraftEnvelope = {
    schemaVersion: 1,
    updatedAt: now,
    brief,
    output,
  };

  // Validate on the way out too: a bad write is worse than a failed one.
  const parsed = draftEnvelopeSchema.safeParse(envelope);
  if (!parsed.success) {
    return { status: "failed", reason: "unknown" };
  }

  return writeRaw(STORAGE_KEYS.draft, parsed.data);
}

export function clearDraft(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEYS.draft);
  } catch {
    // Nothing useful to do; the draft simply stays.
  }
}

/* ------------------------------------------------------------------ *
 * Saved projects
 * ------------------------------------------------------------------ */

export function readProjectsEnvelope(): ReadResult<ProjectsEnvelope> {
  return readValidated(STORAGE_KEYS.projects, projectsEnvelopeSchema);
}

export function writeProjectsEnvelope(projects: SavedProject[]): WriteResult {
  const envelope: ProjectsEnvelope = { schemaVersion: 1, projects };
  const parsed = projectsEnvelopeSchema.safeParse(envelope);
  if (!parsed.success) {
    return { status: "failed", reason: "unknown" };
  }
  return writeRaw(STORAGE_KEYS.projects, parsed.data);
}

/* ------------------------------------------------------------------ *
 * Preferences — small conveniences, never required
 * ------------------------------------------------------------------ */

export function readPreferences(): Preferences {
  const result = readValidated(STORAGE_KEYS.preferences, preferencesSchema);
  return result.status === "ok" ? result.value : DEFAULT_PREFERENCES;
}

export function writePreferences(patch: Omit<Preferences, "schemaVersion">): WriteResult {
  const next: Preferences = { ...readPreferences(), ...patch, schemaVersion: 1 };
  const parsed = preferencesSchema.safeParse(next);
  if (!parsed.success) {
    return { status: "failed", reason: "unknown" };
  }
  return writeRaw(STORAGE_KEYS.preferences, parsed.data);
}

/**
 * Used by Reset Demo. Clears the draft and every saved project, and nothing
 * else: preferences are a convenience, not user work, so they survive. Other
 * origins' keys are never touched.
 */
export function clearDraftAndProjects(): void {
  if (typeof window === "undefined") {
    return;
  }
  for (const key of [STORAGE_KEYS.draft, STORAGE_KEYS.projects]) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Best effort only.
    }
  }
}
