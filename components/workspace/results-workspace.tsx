"use client";

import { AlertTriangle, ArrowRight, FileWarning, FolderOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { PromptPanel } from "@/components/workspace/prompt-panel";
import { RationalePanel } from "@/components/workspace/rationale-panel";
import { ReadinessPanel } from "@/components/workspace/readiness-panel";
import { ShotCard } from "@/components/workspace/shot-card";
import { StoryboardTimeline } from "@/components/workspace/storyboard-timeline";
import { SuggestionsPanel } from "@/components/workspace/suggestions-panel";
import { WorkspaceActionBar } from "@/components/workspace/workspace-action-bar";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { PROJECT_CAP, PROJECT_CAP_WARNING_AT } from "@/lib/constants";
import { generateDirection, rescoreDirection } from "@/lib/director";
import {
  getDraftSnapshot,
  getServerDraftSnapshot,
  parseDraftSnapshot,
  resetEverything,
  saveDraft,
  subscribeToDraft,
} from "@/lib/draft-store";
import {
  getProjectsSnapshot,
  getServerProjectsSnapshot,
  parseProjectsSnapshot,
  renameProject,
  saveProject,
  subscribeToProjects,
} from "@/lib/project-store";
import type { DirectorOutput, SavedProject, ShotEdit } from "@/types";

/** Local, unsaved shot edits, keyed by shot id. */
type EditOverlay = Record<string, ShotEdit>;

export type WorkspaceSource =
  | { kind: "draft" }
  | { kind: "project"; id: string };

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "scene"
  );
}

function applyOverlay(output: DirectorOutput, overlay: EditOverlay): DirectorOutput {
  const ids = Object.keys(overlay);
  if (ids.length === 0) {
    return output;
  }
  const shots = output.shots.map((shot) => {
    const edit = overlay[shot.id];
    return edit ? { ...shot, ...edit, edited: true } : shot;
  });
  // Readiness reflects what is on screen, including local edits.
  return rescoreDirection(output, shots);
}

export function ResultsWorkspace({
  source = { kind: "draft" },
}: {
  source?: WorkspaceSource;
}) {
  const router = useRouter();

  const draftRaw = useSyncExternalStore(
    subscribeToDraft,
    getDraftSnapshot,
    getServerDraftSnapshot,
  );
  const projectsRaw = useSyncExternalStore(
    subscribeToProjects,
    getProjectsSnapshot,
    getServerProjectsSnapshot,
  );

  const draft = useMemo(() => parseDraftSnapshot(draftRaw), [draftRaw]);
  const projects = useMemo(() => parseProjectsSnapshot(projectsRaw), [projectsRaw]);

  const [overlay, setOverlay] = useState<EditOverlay>({});
  const [activeShotId, setActiveShotId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const project: SavedProject | undefined =
    source.kind === "project"
      ? projects.projects.find((candidate) => candidate.id === source.id)
      : undefined;

  const stored: DirectorOutput | null =
    source.kind === "project"
      ? (project?.output ?? null)
      : draft.status === "ok"
        ? draft.envelope.output
        : null;

  const output = useMemo(
    () => (stored ? applyOverlay(stored, overlay) : null),
    [stored, overlay],
  );

  const hasUnsavedEdits = Object.keys(overlay).length > 0;

  const handleSaveShot = useCallback((shotId: string, edit: ShotEdit) => {
    setOverlay((current) => ({ ...current, [shotId]: edit }));
    toast.success("Shot updated. Readiness recalculated.");
    setAnnouncement("Shot updated and readiness recalculated.");
  }, []);

  const handleRevertShot = useCallback(
    (shotId: string) => {
      if (!stored) {
        return;
      }
      // Generation is deterministic, so the original direction can be
      // regenerated from the same brief instead of cached anywhere.
      const original = generateDirection(stored.brief);
      const sourceShot = original.shots.find((candidate) => candidate.id === shotId);
      if (!sourceShot) {
        return;
      }
      setOverlay((current) => ({
        ...current,
        [shotId]: {
          title: sourceShot.title,
          shotType: sourceShot.shotType,
          visualDirection: sourceShot.visualDirection,
          camera: sourceShot.camera,
          lighting: sourceShot.lighting,
          composition: sourceShot.composition,
          sound: sourceShot.sound,
          transition: sourceShot.transition,
        },
      }));
      toast.success("Shot reverted to the generated direction.");
      setAnnouncement("Shot reverted to the generated direction.");
    },
    [stored],
  );

  const handleSelectShot = useCallback((shotId: string) => {
    setActiveShotId(shotId);
    document.getElementById(`shot-${shotId}`)?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, []);

  function reportWriteFailure(reason: "quota" | "unavailable" | "unknown" | "missing") {
    const message =
      reason === "quota"
        ? "Browser storage is full. Delete an older project and try again."
        : reason === "missing"
          ? "That project is no longer in this browser."
          : "This browser blocked local storage, so nothing was saved.";
    toast.error(message);
    setAnnouncement(message);
  }

  /** Draft mode: keep local edits in the draft. Project mode: update the record. */
  function handlePrimarySave() {
    if (!output) {
      return;
    }
    const now = new Date().toISOString();

    if (source.kind === "project") {
      if (!project) {
        reportWriteFailure("missing");
        return;
      }
      const result = saveProject(output.brief, output, now, {
        existingId: project.id,
        title: project.title,
      });
      if (result.status === "ok") {
        setOverlay({});
        toast.success("Project updated.");
        setAnnouncement("Project updated.");
        return;
      }
      reportWriteFailure(result.reason);
      return;
    }

    const result = saveDraft(output.brief, output, now);
    if (result.status === "ok") {
      setOverlay({});
      toast.success("Draft saved to this browser.");
      setAnnouncement("Draft saved to this browser.");
      return;
    }
    reportWriteFailure(result.reason);
  }

  function handleSaveAsProject() {
    if (!output) {
      return;
    }
    const now = new Date().toISOString();
    const result = saveProject(output.brief, output, now);

    if (result.status !== "ok") {
      reportWriteFailure(result.reason);
      return;
    }

    setOverlay({});
    if (result.evicted.length > 0) {
      toast.success(
        `Saved. At the ${PROJECT_CAP}-project limit, the oldest project was removed.`,
      );
    } else if (result.total >= PROJECT_CAP_WARNING_AT) {
      toast.success(`Saved as a project. ${result.total} of ${PROJECT_CAP} slots used.`);
    } else {
      toast.success("Saved as a project.");
    }
    setAnnouncement("Scene saved as a project.");
    router.push(`/projects/${result.project.id}`);
  }

  function handleRenameProject(title: string) {
    if (source.kind !== "project" || !project) {
      return;
    }
    const result = renameProject(project.id, title, new Date().toISOString());
    if (result.status === "ok") {
      toast.success(`Renamed to “${title}”.`);
      setAnnouncement(`Project renamed to ${title}.`);
      return;
    }
    reportWriteFailure(result.reason);
  }

  function handleDownload() {
    if (!output) {
      return;
    }
    const blob = new Blob([JSON.stringify(output, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `framepilot-${slugify(output.projectTitle)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Plan downloaded as JSON.");
    setAnnouncement("Plan downloaded as JSON.");
  }

  function handleResetDemo() {
    resetEverything();
    setOverlay({});
    toast.success("Demo reset. Start a new scene whenever you are ready.");
    router.push("/create");
  }

  if (!output) {
    const missingProject = source.kind === "project";
    const unreadable =
      (missingProject && projects.status === "unreadable") ||
      (!missingProject && draft.status === "unreadable");

    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8">
        <div className="rounded-lg border border-hairline bg-surface/60 p-8 text-center">
          <span className="mx-auto mb-4 flex size-10 items-center justify-center rounded-md border border-hairline-strong bg-surface-raised text-ink-muted">
            {missingProject ? (
              <FolderOpen aria-hidden className="size-4" />
            ) : (
              <FileWarning aria-hidden className="size-4" />
            )}
          </span>
          <h1 className="text-xl font-semibold text-ink">
            {missingProject ? "That project is not in this browser" : "No scene in the workspace yet"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
            {unreadable
              ? "The saved data could not be read, so it was set aside. Directing the scene again takes a moment."
              : missingProject
                ? "Projects are stored in the browser that saved them. Check your saved list, or direct a new scene."
                : "Write a short scene brief and FramePilot will direct it. Your plan stays in this browser."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/create">
                Create a scene
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </Button>
            {missingProject ? (
              <Button asChild size="lg" variant="outline">
                <Link href="/projects">Saved projects</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[88rem] px-5 pb-16 sm:px-8">
      <WorkspaceActionBar
        output={output}
        hasUnsavedEdits={hasUnsavedEdits}
        mode={source.kind}
        projectTitle={project?.title}
        onPrimarySave={handlePrimarySave}
        onSaveAsProject={handleSaveAsProject}
        onRenameProject={handleRenameProject}
        onDownload={handleDownload}
        onResetDemo={handleResetDemo}
      />

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="pt-8">
        <WorkspaceHeader output={output} projectTitle={project?.title} />
      </div>

      {hasUnsavedEdits ? (
        <p className="mt-4 flex items-start gap-2 rounded-md border border-highlight/40 bg-highlight/10 p-3 text-xs text-highlight">
          <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          Local edits are not saved yet. Use{" "}
          {source.kind === "project" ? "Save changes" : "Save draft"} to keep them through a reload.
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.85fr)] xl:gap-10">
        <div className="space-y-8">
          <RationalePanel output={output} />

          <StoryboardTimeline
            shots={output.shots}
            activeShotId={activeShotId}
            onSelect={handleSelectShot}
            totalSeconds={output.meta.totalDurationSeconds}
          />

          <section aria-labelledby="shots-heading" className="space-y-4">
            <SectionHeading
              eyebrow="Storyboard"
              title="Shot direction"
              description="Edit any shot in place. Readiness updates as you go."
            />
            <h2 id="shots-heading" className="sr-only">
              Shot cards
            </h2>
            {output.shots.map((shot) => (
              <ShotCard
                key={shot.id}
                shot={shot}
                isActive={shot.id === activeShotId}
                onSave={handleSaveShot}
                onRevert={handleRevertShot}
                onFocus={setActiveShotId}
              />
            ))}
          </section>

          <PromptPanel output={output} />
        </div>

        <div className="space-y-6 xl:sticky xl:top-32 xl:self-start">
          <ReadinessPanel output={output} />
          <SuggestionsPanel output={output} />
        </div>
      </div>
    </div>
  );
}
