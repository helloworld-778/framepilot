"use client";

import { Download, FolderOpen, Pencil, PenLine, RotateCcw, Save } from "lucide-react";
import Link from "next/link";

import {
  ActionFeedbackButton,
  type ActionOutcome,
} from "@/components/shared/action-feedback-button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CopyButton } from "@/components/shared/copy-button";
import { RenameProjectDialog } from "@/components/projects/rename-project-dialog";
import { Button } from "@/components/ui/button";
import type { DirectorOutput } from "@/types";

interface WorkspaceActionBarProps {
  output: DirectorOutput;
  hasUnsavedEdits: boolean;
  mode: "draft" | "project";
  projectTitle?: string;
  /** `/create` in edit mode for whichever source this workspace is showing. */
  editBriefHref: string;
  onPrimarySave: () => ActionOutcome;
  onSaveAsProject: () => ActionOutcome;
  onRenameProject: (title: string) => ActionOutcome;
  onDownload: () => ActionOutcome;
  onResetDemo: () => ActionOutcome;
}

export function WorkspaceActionBar({
  output,
  hasUnsavedEdits,
  mode,
  projectTitle,
  editBriefHref,
  onPrimarySave,
  onSaveAsProject,
  onRenameProject,
  onDownload,
  onResetDemo,
}: WorkspaceActionBarProps) {
  const isProject = mode === "project";

  return (
    <div className="sticky top-16 z-30 -mx-5 border-b border-hairline bg-canvas/92 px-5 py-3 shadow-[0_12px_30px_-28px_rgb(0_0_0/0.9)] backdrop-blur-[6px] sm:-mx-8 sm:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={editBriefHref}>
            <PenLine aria-hidden className="size-3.5" />
            Edit brief
          </Link>
        </Button>

        <CopyButton value={output.masterPrompt} label="Copy prompt" />
        <CopyButton value={output.negativePrompt} label="Copy negative prompt" />

        <ActionFeedbackButton
          idleLabel="Download JSON"
          workingLabel="Preparing…"
          successLabel="Downloaded"
          errorLabel="Download failed"
          onAction={onDownload}
          icon={Download}
          announceSuccess="Plan downloaded as JSON to this device"
        />

        <ActionFeedbackButton
          idleLabel={isProject ? "Save changes" : "Save draft"}
          workingLabel="Saving…"
          successLabel="Saved locally"
          errorLabel="Save failed"
          onAction={onPrimarySave}
          icon={Save}
          variant="default"
          announceSuccess={
            isProject
              ? "Project changes saved locally in this browser"
              : "Draft saved locally in this browser"
          }
        />

        {isProject ? (
          <RenameProjectDialog
            currentTitle={projectTitle ?? output.projectTitle}
            onRename={onRenameProject}
            trigger={
              <Button type="button" variant="outline" size="sm">
                <Pencil aria-hidden className="size-3.5" />
                Rename
              </Button>
            }
          />
        ) : (
          <ActionFeedbackButton
            idleLabel="Save as project"
            workingLabel="Saving…"
            successLabel="Saved locally"
            errorLabel="Save failed"
            onAction={onSaveAsProject}
            icon={FolderOpen}
            announceSuccess="Scene saved locally as a project in this browser"
          />
        )}

        {hasUnsavedEdits ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-highlight/40 bg-highlight/10 px-2.5 py-1 text-[0.68rem] text-highlight">
            <span aria-hidden className="size-1.5 rounded-full bg-highlight" />
            Unsaved edits
          </span>
        ) : (
          <span className="text-[0.68rem] text-ink-muted">All edits saved</span>
        )}

        {/* On narrow screens this group simply wraps rather than being pushed. */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button asChild variant="ghost" size="sm" className="text-ink-muted hover:text-ink">
            <Link href="/projects">Saved projects</Link>
          </Button>

          <ConfirmDialog
            trigger={
              <Button type="button" variant="ghost" size="sm" className="text-ink-muted">
                <RotateCcw aria-hidden className="size-3.5" />
                Reset demo
              </Button>
            }
            title="Reset the demo?"
            description="This clears the current draft and every saved project from this browser, then returns you to the scene brief. It cannot be undone."
            confirmLabel="Reset everything"
            workingLabel="Resetting…"
            successLabel="Demo reset"
            onConfirm={onResetDemo}
          />
        </div>
      </div>
    </div>
  );
}
