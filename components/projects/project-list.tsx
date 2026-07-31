"use client";

import { AlertTriangle, ArrowRight, FolderOpen } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { ProjectCard } from "@/components/projects/project-card";
import type { ActionOutcome } from "@/components/shared/action-feedback-button";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { PROJECT_CAP, PROJECT_CAP_WARNING_AT } from "@/lib/constants";
import {
  deleteProject,
  getProjectsSnapshot,
  getServerProjectsSnapshot,
  parseProjectsSnapshot,
  renameProject,
  subscribeToProjects,
} from "@/lib/project-store";

export function ProjectList() {
  const raw = useSyncExternalStore(
    subscribeToProjects,
    getProjectsSnapshot,
    getServerProjectsSnapshot,
  );
  const parsed = useMemo(() => parseProjectsSnapshot(raw), [raw]);
  const [announcement, setAnnouncement] = useState("");

  const projects = parsed.projects;

  function handleRename(id: string, title: string): ActionOutcome {
    const result = renameProject(id, title, new Date().toISOString());
    if (result.status === "ok") {
      toast.success(`Renamed to “${title}”.`);
      setAnnouncement(`Project renamed to ${title}.`);
      return { ok: true };
    }
    const message =
      result.reason === "quota"
        ? "Browser storage is full. Delete an older project and try again."
        : "That project could not be renamed.";
    toast.error(message);
    setAnnouncement("Rename failed.");
    return { ok: false, message: "Rename failed" };
  }

  function handleDelete(id: string): ActionOutcome {
    const project = projects.find((candidate) => candidate.id === id);
    const result = deleteProject(id);
    if (result.status === "ok") {
      toast.success("Project deleted.");
      setAnnouncement(`${project?.title ?? "Project"} deleted.`);
      return { ok: true };
    }
    toast.error("That project could not be deleted.");
    setAnnouncement("Delete failed.");
    return { ok: false, message: "Delete failed" };
  }

  return (
    <div className="mx-auto w-full max-w-[88rem] px-5 py-12 sm:px-8">
      <SectionHeading
        as="h1"
        eyebrow="Saved projects"
        title={projects.length > 0 ? `${projects.length} saved in this browser` : "Saved projects"}
        description="Projects are kept in this browser only. Reopen one to keep editing its storyboard, or delete it when you are done."
        actions={
          <Button asChild size="sm">
            <Link href="/create">
              New scene
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </Button>
        }
      />

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {parsed.status === "unreadable" ? (
        <p className="mt-6 flex items-start gap-2 rounded-md border border-signal-warning/40 bg-signal-warning/10 p-3 text-xs text-signal-warning">
          <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          Saved projects could not be read, so they were set aside and the list was reset. Nothing
          else was affected.
        </p>
      ) : null}

      {projects.length >= PROJECT_CAP_WARNING_AT ? (
        <p className="mt-6 flex items-start gap-2 rounded-md border border-highlight/40 bg-highlight/10 p-3 text-xs text-highlight">
          <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {projects.length >= PROJECT_CAP
            ? `You are at the ${PROJECT_CAP}-project limit. Saving another will remove the oldest one.`
            : `${projects.length} of ${PROJECT_CAP} projects saved. At the limit, the oldest is removed first.`}
        </p>
      ) : null}

      {projects.length === 0 ? (
        <div className="fp-panel fp-panel-tinted mt-10 p-8 text-center">
          <span className="mx-auto mb-4 flex size-10 items-center justify-center rounded-md border border-hairline-strong bg-surface-raised text-ink-muted">
            <FolderOpen aria-hidden className="size-4" />
          </span>
          <h2 className="text-lg font-medium text-ink">Nothing saved yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
            Direct a scene first, then use Save as project in the workspace to keep it here.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/create">
              Create a scene
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </Button>
        </div>
      ) : (
        // The h1 above already carries the visible count, so the collection gets
        // a screen-reader-only h2 rather than a second large heading. That keeps
        // the card titles at h3 without skipping a level.
        <section aria-labelledby="saved-projects-heading">
          <h2 id="saved-projects-heading" className="sr-only">
            Saved projects
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <li key={project.id} className="flex min-w-0">
                <ProjectCard
                  project={project}
                  onRename={handleRename}
                  onDelete={handleDelete}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

