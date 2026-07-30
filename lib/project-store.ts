import { PROJECT_CAP, STORAGE_KEYS } from "@/lib/constants";
import { projectsEnvelopeSchema, savedProjectSchema } from "@/lib/schemas";
import { readProjectsEnvelope, writeProjectsEnvelope } from "@/lib/storage";
import {
  notifyStorageChanged,
  readRawKey,
  subscribeToStorage,
} from "@/lib/store-events";
import type { DirectorOutput, SavedProject, SceneBrief } from "@/types";

/**
 * Saved-project store. Same contract as the draft store: raw-string snapshots
 * for `useSyncExternalStore`, Zod on every read, and no throwing at callers.
 */

export const subscribeToProjects = subscribeToStorage;

export function getProjectsSnapshot(): string | null {
  return readRawKey(STORAGE_KEYS.projects);
}

export function getServerProjectsSnapshot(): string | null {
  return null;
}

export type ParsedProjects =
  | { status: "empty"; projects: SavedProject[] }
  | { status: "ok"; projects: SavedProject[] }
  | { status: "unreadable"; projects: SavedProject[] };

/** Newest first — the order the list is presented in. */
function byUpdatedDesc(a: SavedProject, b: SavedProject): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

export function parseProjectsSnapshot(raw: string | null): ParsedProjects {
  if (raw === null || raw.length === 0) {
    return { status: "empty", projects: [] };
  }
  try {
    const parsed = projectsEnvelopeSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return { status: "unreadable", projects: [] };
    }
    return { status: "ok", projects: [...parsed.data.projects].sort(byUpdatedDesc) };
  } catch {
    return { status: "unreadable", projects: [] };
  }
}

/** Reads through the validating storage layer, which quarantines bad records. */
export function readProjects(): SavedProject[] {
  const result = readProjectsEnvelope();
  return result.status === "ok" ? [...result.value.projects].sort(byUpdatedDesc) : [];
}

export function findProject(id: string): SavedProject | undefined {
  return readProjects().find((project) => project.id === id);
}

export type SaveProjectResult =
  | { status: "ok"; project: SavedProject; evicted: SavedProject[]; total: number }
  | { status: "failed"; reason: "quota" | "unavailable" | "unknown" };

function projectId(output: DirectorOutput, now: string): string {
  // Seed keeps it tied to the brief; the timestamp keeps repeat saves distinct.
  return `${output.meta.seed}-${Date.parse(now).toString(36)}`;
}

/**
 * Saves a new project, or updates an existing one when `existingId` matches.
 * At the cap, the oldest projects by `updatedAt` are evicted first.
 */
export function saveProject(
  brief: SceneBrief,
  output: DirectorOutput,
  now: string,
  options: { existingId?: string; title?: string } = {},
): SaveProjectResult {
  const current = readProjects();
  const existing = options.existingId
    ? current.find((project) => project.id === options.existingId)
    : undefined;

  const candidate: SavedProject = {
    id: existing?.id ?? projectId(output, now),
    title: options.title?.trim() || existing?.title || output.projectTitle,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    brief,
    output,
  };

  const parsed = savedProjectSchema.safeParse(candidate);
  if (!parsed.success) {
    return { status: "failed", reason: "unknown" };
  }

  const remaining = current.filter((project) => project.id !== candidate.id);
  const next = [parsed.data, ...remaining].sort(byUpdatedDesc);

  const evicted: SavedProject[] = [];
  while (next.length > PROJECT_CAP) {
    const oldest = next.pop();
    if (oldest) {
      evicted.push(oldest);
    }
  }

  const write = writeProjectsEnvelope(next);
  if (write.status === "failed") {
    return { status: "failed", reason: write.reason };
  }

  notifyStorageChanged();
  return { status: "ok", project: parsed.data, evicted, total: next.length };
}

export type MutateProjectResult =
  | { status: "ok"; projects: SavedProject[] }
  | { status: "failed"; reason: "quota" | "unavailable" | "unknown" | "missing" };

export function renameProject(
  id: string,
  title: string,
  now: string,
): MutateProjectResult {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return { status: "failed", reason: "unknown" };
  }

  const current = readProjects();
  if (!current.some((project) => project.id === id)) {
    return { status: "failed", reason: "missing" };
  }

  const next = current.map((project) =>
    project.id === id ? { ...project, title: trimmed, updatedAt: now } : project,
  );

  const write = writeProjectsEnvelope(next);
  if (write.status === "failed") {
    return { status: "failed", reason: write.reason };
  }

  notifyStorageChanged();
  return { status: "ok", projects: [...next].sort(byUpdatedDesc) };
}

export function deleteProject(id: string): MutateProjectResult {
  const current = readProjects();
  const next = current.filter((project) => project.id !== id);
  if (next.length === current.length) {
    return { status: "failed", reason: "missing" };
  }

  const write = writeProjectsEnvelope(next);
  if (write.status === "failed") {
    return { status: "failed", reason: write.reason };
  }

  notifyStorageChanged();
  return { status: "ok", projects: next };
}
