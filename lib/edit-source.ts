import type { ParsedDraft } from "@/lib/draft-store";
import type { ParsedProjects } from "@/lib/project-store";
import type { DraftEnvelope, SavedProject, SceneBrief } from "@/types";

/**
 * Resolves what `/create` is editing, from the query plus already-validated
 * store snapshots.
 *
 * Only an identifier travels in the URL — never a serialised brief. The brief
 * itself always comes from the canonical local store, so the URL can never
 * fabricate or stale-cache a plan's inputs. Everything here is pure, which keeps
 * the form free of storage reads during render.
 */

export type EditRequest =
  | { mode: "none" }
  | { mode: "draft" }
  | { mode: "project"; id: string };

export type EditSource =
  | { status: "none" }
  /** The current working draft, with its fingerprint at entry time. */
  | { status: "draft"; brief: SceneBrief; fingerprint: string }
  | { status: "project"; brief: SceneBrief; project: SavedProject }
  /** Asked to edit something that is not there, or is not readable. */
  | { status: "missing"; requested: "draft" | "project" };

export const EDIT_PARAM = "edit";
export const EDIT_PROJECT_PARAM = "id";

/** Reads the edit intent from the existing `/create` route's query. */
export function parseEditRequest(params: URLSearchParams): EditRequest {
  const mode = params.get(EDIT_PARAM);
  if (mode === "draft") {
    return { mode: "draft" };
  }
  if (mode === "project") {
    const id = params.get(EDIT_PROJECT_PARAM);
    return id ? { mode: "project", id } : { mode: "project", id: "" };
  }
  return { mode: "none" };
}

/**
 * Identifies a specific stored draft without adding anything to its payload:
 * the generated seed plus the envelope's own timestamp. Used to tell "this is
 * still the draft I opened" from "someone replaced it while I was editing".
 */
export function fingerprintEnvelope(envelope: DraftEnvelope): string {
  return `${envelope.output.meta.seed}:${envelope.updatedAt}`;
}

export function draftFingerprint(draft: ParsedDraft): string | null {
  if (draft.status !== "ok") {
    return null;
  }
  return fingerprintEnvelope(draft.envelope);
}

export function resolveEditSource(
  request: EditRequest,
  draft: ParsedDraft,
  projects: ParsedProjects,
): EditSource {
  if (request.mode === "none") {
    return { status: "none" };
  }

  if (request.mode === "draft") {
    const fingerprint = draftFingerprint(draft);
    if (draft.status !== "ok" || fingerprint === null) {
      return { status: "missing", requested: "draft" };
    }
    return { status: "draft", brief: draft.envelope.brief, fingerprint };
  }

  const project = projects.projects.find((candidate) => candidate.id === request.id);
  if (!project) {
    return { status: "missing", requested: "project" };
  }
  return { status: "project", brief: project.brief, project };
}

/** Where "back to workspace" should return to for a given source. */
export function editSourceReturnHref(source: EditSource): string {
  if (source.status === "project") {
    return `/projects/${source.project.id}`;
  }
  if (source.status === "draft") {
    return "/workspace";
  }
  return "/create";
}

/** Stable key so the form prefills exactly once per source. */
export function editSourceKey(source: EditSource): string | null {
  if (source.status === "draft") {
    return "draft";
  }
  if (source.status === "project") {
    return `project:${source.project.id}`;
  }
  return null;
}
