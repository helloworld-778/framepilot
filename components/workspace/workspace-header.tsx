import { Clock, Frame, Target, Users } from "lucide-react";

import { KineticPhrase, KineticText } from "@/components/shared/kinetic-text";
import { DIRECTORY_BY_ID } from "@/data/directories";
import {
  DURATION_LABELS,
  PURPOSE_LABELS,
  readinessBandFor,
} from "@/lib/constants";
import { directoryTheme } from "@/lib/directory-theme";
import type { DirectorOutput } from "@/types";

/**
 * Project strip: the director's desk header. Direction badge, metadata, and the
 * score at a glance, over the direction's own atmosphere.
 */
export function WorkspaceHeader({
  output,
  projectTitle,
}: {
  output: DirectorOutput;
  projectTitle?: string;
}) {
  const directory = DIRECTORY_BY_ID[output.directoryId];
  const theme = directoryTheme(output.directoryId);
  const band = readinessBandFor(output.readinessScore);

  const facts = [
    { icon: Clock, label: DURATION_LABELS[output.brief.duration] },
    { icon: Frame, label: output.brief.aspectRatio },
    { icon: Target, label: PURPOSE_LABELS[output.brief.purpose] },
    {
      icon: Users,
      label: output.brief.targetAudience.trim() || "Audience not set",
    },
  ];

  return (
    <div className="fp-panel fp-panel-tinted relative overflow-hidden">
      <div aria-hidden className="fp-grain absolute inset-0" />

      {/* Palette band as the direction signature. */}
      <div aria-hidden className="relative flex h-1 w-full">
        {directory.palette.map((swatch) => (
          <span key={swatch.hex} className="flex-1" style={{ backgroundColor: swatch.hex }} />
        ))}
      </div>

      <div className="relative flex flex-wrap items-start justify-between gap-x-8 gap-y-5 p-5 sm:p-6">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-dir/40 bg-dir/12 px-2.5 py-0.5 text-[0.68rem] font-medium text-dir-soft">
              {directory.name}
            </span>
            <span className="fp-slate text-[0.6rem] uppercase">{theme.label}</span>
          </div>

          <h1 className="mt-3.5 text-2xl font-semibold leading-tight text-ink sm:text-3xl">
            {/*
              Revealed once, keyed by the generated seed: a newly directed scene
              gets the reveal, while editing, saving, or reopening does not.
            */}
            <KineticText revealKey={`workspace-title-${output.meta.seed}`}>
              <KineticPhrase>{projectTitle ?? output.projectTitle}</KineticPhrase>
            </KineticText>
          </h1>
          {projectTitle && projectTitle !== output.projectTitle ? (
            <p className="mt-1 text-xs text-ink-muted">
              Generated title: {output.projectTitle}
            </p>
          ) : null}
          <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-[0.95rem]">
            {output.logline}
          </p>

          <ul className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            {facts.map((fact) => (
              <li
                key={fact.label}
                className="flex items-center gap-1.5 rounded-md border border-hairline bg-canvas-deep/60 px-2 py-1 text-xs text-ink-muted"
              >
                <fact.icon aria-hidden className="size-3.5 text-ink-faint" />
                {fact.label}
              </li>
            ))}
            <li className="font-mono text-[0.7rem] text-ink-faint">seed {output.meta.seed}</li>
          </ul>
        </div>

        {/* Score chip: the same number as the instrument, read at a glance. */}
        <div className="rounded-lg border border-hairline bg-canvas-deep/70 px-4 py-3 text-right">
          <p className="text-[0.62rem] uppercase tracking-slate text-ink-faint">Readiness</p>
          <p className="mt-1 font-mono text-2xl leading-none text-ink">
            {output.readinessScore}
            <span className="text-sm text-ink-faint">/100</span>
          </p>
          <p className="mt-1.5 text-[0.68rem] text-dir-soft">{band.label}</p>
        </div>
      </div>
    </div>
  );
}
