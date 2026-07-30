import { STORAGE_KEYS } from "@/lib/constants";
import { draftEnvelopeSchema } from "@/lib/schemas";
import {
  clearDraft,
  clearDraftAndProjects,
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

/** Reset Demo: clears the draft and saved projects, keeping preferences. */
export function resetEverything(): void {
  clearDraftAndProjects();
  notifyStorageChanged();
}
