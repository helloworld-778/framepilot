import { STORAGE_KEYS } from "@/lib/constants";
import { saveProject, type SaveProjectResult } from "@/lib/project-store";
import { draftEnvelopeSchema } from "@/lib/schemas";
import {
  clearDraft,
  clearDraftAndProjects,
  readDraft,
  writeDraft,
  type WriteResult,
} from "@/lib/storage";
import {
  notifyStorageChanged,
  readRawKey,
  subscribeToStorage,
} from "@/lib/store-events";
import type { DirectorOutput, DraftEnvelope, SceneBrief } from "@/types";

/**
 * localStorage is an external system, so the workspace reads it through
 * `useSyncExternalStore` rather than an effect. The snapshot is the raw string,
 * which keeps it referentially stable across renders; parsing happens in a memo.
 */

export const subscribeToDraft = subscribeToStorage;

export function getDraftSnapshot(): string | null {
  return readRawKey(STORAGE_KEYS.draft);
}

/** Nothing is readable during prerender, and React re-checks after hydration. */
export function getServerDraftSnapshot(): string | null {
  return null;
}

export type ParsedDraft =
  | { status: "empty" }
  | { status: "ok"; envelope: DraftEnvelope }
  | { status: "unreadable" };

export function parseDraftSnapshot(raw: string | null): ParsedDraft {
  if (raw === null || raw.length === 0) {
    return { status: "empty" };
  }
  try {
    const parsed = draftEnvelopeSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return { status: "unreadable" };
    }
    return { status: "ok", envelope: parsed.data };
  } catch {
    return { status: "unreadable" };
  }
}

export function saveDraft(
  brief: SceneBrief,
  output: DirectorOutput,
  now: string,
): WriteResult {
  const result = writeDraft(brief, output, now);
  if (result.status === "ok") {
    notifyStorageChanged();
  }
  return result;
}

export function discardDraft(): void {
  clearDraft();
  notifyStorageChanged();
}

export type ArchiveDraftResult =
  | SaveProjectResult
  | { status: "failed"; reason: "missing" };

/**
 * Saves whatever is *currently stored* in the draft slot as a saved project.
 *
 * Nothing is regenerated: the stored envelope already holds the brief and the
 * generated `DirectorOutput`, including any local shot edits that were saved
 * with it, so both are written through verbatim. The project's own
 * `createdAt`/`updatedAt` record when it became a project; the plan's own
 * provenance (`meta.seed`, `meta.createdAt`) travels inside the payload.
 *
 * Returns `missing` when there is no readable draft — a corrupt draft is left to
 * the existing quarantine path rather than being archived.
 */
export function saveStoredDraftAsProject(now: string): ArchiveDraftResult {
  const stored = readDraft();
  if (stored.status !== "ok") {
    return { status: "failed", reason: "missing" };
  }

  const { brief, output } = stored.value;
  return saveProject(brief, output, now, { title: output.projectTitle });
}

/** Reset Demo: clears the draft and saved projects, keeping preferences. */
export function resetEverything(): void {
  clearDraftAndProjects();
  notifyStorageChanged();
}
