"use client";

import { ArrowUpRight, Clock, Frame, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import type { ActionOutcome } from "@/components/shared/action-feedback-button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePointerBloom } from "@/components/shared/interactive-card";
import { PaletteStrip } from "@/components/shared/palette-strip";
import { RenameProjectDialog } from "@/components/projects/rename-project-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIRECTORY_BY_ID } from "@/data/directories";
import { DURATION_LABELS, readinessBandFor } from "@/lib/constants";
import { directionAttr } from "@/lib/directory-theme";
import { formatRelative } from "@/lib/format";
import type { ReadinessBand, SavedProject } from "@/types";

const TONE_TEXT: Record<ReadinessBand["tone"], string> = {
  strong: "text-signal-success",
  steady: "text-dir-soft",
  caution: "text-signal-warning",
  weak: "text-signal-danger",
};

interface ProjectCardProps {
  project: SavedProject;
  onRename: (id: string, title: string) => ActionOutcome;
  onDelete: (id: string) => ActionOutcome;
}

export function ProjectCard({ project, onRename, onDelete }: ProjectCardProps) {
  const directory = DIRECTORY_BY_ID[project.output.directoryId];
  const band = readinessBandFor(project.output.readinessScore);
  const bloom = usePointerBloom();

  return (
    <article
      {...directionAttr(project.output.directoryId)}
      {...bloom}
      className="fp-panel fp-panel-tinted fp-card-interactive group relative flex w-full flex-col overflow-hidden"
    >
      {/* A single palette bar as the visual cue for the direction. */}
      <div aria-hidden className="flex h-1 overflow-hidden">
        {directory.palette.map((swatch) => (
          <span
            key={swatch.hex}
            className="flex-1"
            style={{ backgroundColor: swatch.hex }}
          />
        ))}
      </div>

      {/* Folder tab strip, so a saved project reads like a call sheet. */}
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-2.5">
        <span className="fp-slate text-[0.6rem] uppercase">Saved plan</span>
        <span aria-hidden className="fp-perf h-1.5 w-16 opacity-60" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Titles run to the rename limit and may contain one unbroken run of
              characters, so the heading wraps instead of clipping or scrolling.
              Nothing is truncated: the whole title stays readable. */}
          <h3 className="min-w-0 flex-1 text-base font-medium leading-snug text-ink break-words [overflow-wrap:anywhere]">
            <Link
              href={`/projects/${project.id}`}
              className="rounded-sm transition-colors hover:text-dir-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {project.title}
            </Link>
          </h3>
          <Badge
            variant="outline"
            className="shrink-0 border-dir/40 bg-dir/10 text-[0.65rem] uppercase tracking-slate text-dir-soft"
          >
            {directory.name}
          </Badge>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Runtime</dt>
            <Clock aria-hidden className="size-3.5 text-ink-faint" />
            <dd className="text-ink-muted">{DURATION_LABELS[project.brief.duration]}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Aspect ratio</dt>
            <Frame aria-hidden className="size-3.5 text-ink-faint" />
            <dd className="text-ink-muted">{project.brief.aspectRatio}</dd>
          </div>
          <div className="col-span-2 flex items-baseline gap-2">
            <dt className="text-ink-faint">Readiness</dt>
            <dd className={`font-mono text-sm ${TONE_TEXT[band.tone]}`}>
              {project.output.readinessScore}
              <span className="text-ink-faint">/100</span>
              <span className="ml-2 font-sans text-xs text-ink-muted">{band.label}</span>
            </dd>
          </div>
          <div className="col-span-2 flex items-baseline gap-2">
            <dt className="text-ink-faint">Updated</dt>
            <dd className="text-ink-muted">
              <time dateTime={project.updatedAt}>{formatRelative(project.updatedAt)}</time>
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
          <PaletteStrip palette={directory.palette} />

          <div className="flex flex-wrap items-center gap-1">
            <RenameProjectDialog
              currentTitle={project.title}
              onRename={(title) => onRename(project.id, title)}
              trigger={
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-ink-muted hover:text-ink"
                  aria-label={`Rename ${project.title}`}
                >
                  <Pencil aria-hidden className="size-3.5" />
                  Rename
                </Button>
              }
            />

            <ConfirmDialog
              title="Delete this project?"
              description={`"${project.title}" will be removed from this browser. This cannot be undone.`}
              confirmLabel="Delete project"
              workingLabel="Deleting…"
              successLabel="Deleted"
              onConfirm={() => onDelete(project.id)}
              trigger={
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-ink-muted hover:text-signal-danger"
                  aria-label={`Delete ${project.title}`}
                >
                  <Trash2 aria-hidden className="size-3.5" />
                  Delete
                </Button>
              }
            />

            <Button asChild size="sm" variant="outline">
              <Link href={`/projects/${project.id}`} aria-label={`Open ${project.title}`}>
                Open
                <ArrowUpRight aria-hidden className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
