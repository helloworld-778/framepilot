"use client";

import { ArrowUpRight, Clock, Frame, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PaletteStrip } from "@/components/shared/palette-strip";
import { RenameProjectDialog } from "@/components/projects/rename-project-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIRECTORY_BY_ID } from "@/data/directories";
import { DURATION_LABELS, readinessBandFor } from "@/lib/constants";
import { formatRelative } from "@/lib/format";
import type { ReadinessBand, SavedProject } from "@/types";

const TONE_TEXT: Record<ReadinessBand["tone"], string> = {
  strong: "text-signal-success",
  steady: "text-brand-soft",
  caution: "text-signal-warning",
  weak: "text-signal-danger",
};

interface ProjectCardProps {
  project: SavedProject;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onRename, onDelete }: ProjectCardProps) {
  const directory = DIRECTORY_BY_ID[project.output.directoryId];
  const band = readinessBandFor(project.output.readinessScore);

  return (
    <article className="group relative flex w-full flex-col rounded-lg border border-hairline bg-surface/60 transition-colors focus-within:border-brand/60 hover:border-hairline-strong">
      {/* A single palette bar as the visual cue for the direction. */}
      <div aria-hidden className="flex h-1 overflow-hidden rounded-t-lg">
        {directory.palette.map((swatch) => (
          <span
            key={swatch.hex}
            className="flex-1"
            style={{ backgroundColor: swatch.hex }}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-medium leading-snug text-ink">
            <Link
              href={`/projects/${project.id}`}
              className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {project.title}
            </Link>
          </h3>
          <Badge
            variant="outline"
            className="shrink-0 border-hairline-strong text-[0.65rem] uppercase tracking-[0.12em] text-ink-muted"
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
