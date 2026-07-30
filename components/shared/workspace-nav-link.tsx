"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  getDraftSnapshot,
  getServerDraftSnapshot,
  parseDraftSnapshot,
  subscribeToDraft,
} from "@/lib/draft-store";
import {
  getProjectsSnapshot,
  getServerProjectsSnapshot,
  parseProjectsSnapshot,
  subscribeToProjects,
} from "@/lib/project-store";

/**
 * Workspace points at the current draft when there is one, and at the brief form
 * when there is not, so the link is never a dead end.
 */
export function WorkspaceNavLink() {
  const raw = useSyncExternalStore(
    subscribeToDraft,
    getDraftSnapshot,
    getServerDraftSnapshot,
  );
  const draft = useMemo(() => parseDraftSnapshot(raw), [raw]);
  const hasDraft = draft.status === "ok";

  return (
    <Button asChild variant="ghost" size="sm" className="text-ink-muted hover:text-ink">
      <Link href={hasDraft ? "/workspace" : "/create"}>Workspace</Link>
    </Button>
  );
}

/** Saved-project count doubles as a hint that anything is stored at all. */
export function ProjectsNavLink() {
  const raw = useSyncExternalStore(
    subscribeToProjects,
    getProjectsSnapshot,
    getServerProjectsSnapshot,
  );
  const parsed = useMemo(() => parseProjectsSnapshot(raw), [raw]);
  const count = parsed.projects.length;

  return (
    <Button asChild variant="ghost" size="sm" className="text-ink-muted hover:text-ink">
      <Link href="/projects">
        Projects
        {count > 0 ? (
          <span
            aria-hidden
            className="ml-1 rounded-full border border-hairline-strong bg-surface-raised px-1.5 py-0.5 font-mono text-[0.65rem] text-brand-soft"
          >
            {count}
          </span>
        ) : null}
        <span className="sr-only">{count > 0 ? `, ${count} saved` : ""}</span>
      </Link>
    </Button>
  );
}
