import { Clock, Frame, Target, Users } from "lucide-react";

import { PaletteStrip } from "@/components/shared/palette-strip";
import { Badge } from "@/components/ui/badge";
import { DIRECTORY_BY_ID } from "@/data/directories";
import { DURATION_LABELS, PURPOSE_LABELS } from "@/lib/constants";
import type { DirectorOutput } from "@/types";

export function WorkspaceHeader({
  output,
  projectTitle,
}: {
  output: DirectorOutput;
  projectTitle?: string;
}) {
  const directory = DIRECTORY_BY_ID[output.directoryId];
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
    <div className="border-b border-hairline pb-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-brand/15 text-brand-soft hover:bg-brand/15">{directory.name}</Badge>
        <PaletteStrip palette={directory.palette} />
      </div>

      <h1 className="mt-4 text-2xl font-semibold leading-tight text-ink sm:text-3xl">
        {projectTitle ?? output.projectTitle}
      </h1>
      {projectTitle && projectTitle !== output.projectTitle ? (
        <p className="mt-1 text-xs text-ink-muted">
          Generated title: {output.projectTitle}
        </p>
      ) : null}
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted sm:text-[0.95rem]">
        {output.logline}
      </p>

      <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        {facts.map((fact) => (
          <li key={fact.label} className="flex items-center gap-1.5 text-xs text-ink-faint">
            <fact.icon aria-hidden className="size-3.5" />
            {fact.label}
          </li>
        ))}
        <li className="font-mono text-[0.7rem] text-ink-faint">seed {output.meta.seed}</li>
      </ul>
    </div>
  );
}
