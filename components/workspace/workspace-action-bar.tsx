"use client";

import { Download, FolderOpen, Pencil, RotateCcw, Save } from "lucide-react";
import Link from "next/link";

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
  onPrimarySave: () => void;
  onSaveAsProject: () => void;
  onRenameProject: (title: string) => void;
  onDownload: () => void;
  onResetDemo: () => void;
}

export function WorkspaceActionBar({
  output,
  hasUnsavedEdits,
  mode,
  projectTitle,
  onPrimarySave,
  onSaveAsProject,
  onRenameProject,
  onDownload,
  onResetDemo,
}: WorkspaceActionBarProps) {
  const isProject = mode === "project";

  return (
    <div className="sticky top-16 z-30 -mx-5 border-b border-hairline bg-canvas/90 px-5 py-3 backdrop-blur-sm sm:-mx-8 sm:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton value={output.masterPrompt} label="Copy prompt" />
        <CopyButton value={output.negativePrompt} label="Copy negative prompt" />

        <Button type="button" variant="outline" size="sm" onClick={onDownload}>
          <Download aria-hidden className="size-3.5" />
          Download JSON
        </Button>

        <Button type="button" size="sm" onClick={onPrimarySave}>
          <Save aria-hidden className="size-3.5" />
          {isProject ? "Save changes" : "Save draft"}
        </Button>

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
          <Button type="button" variant="outline" size="sm" onClick={onSaveAsProject}>
            <FolderOpen aria-hidden className="size-3.5" />
            Save as project
          </Button>
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
            onConfirm={onResetDemo}
          />
        </div>
      </div>
    </div>
  );
}
