import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { PaletteStrip } from "@/components/shared/palette-strip";
import { Badge } from "@/components/ui/badge";
import type { CreativeDirectory } from "@/types";
import { cn } from "@/lib/utils";

export function DirectoryCard({
  directory,
  className,
  showPrinciples = true,
}: {
  directory: CreativeDirectory;
  className?: string;
  showPrinciples?: boolean;
}) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-lg border border-hairline bg-surface/60 p-5 transition-colors hover:border-hairline-strong",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-ink">{directory.name}</h3>
          <p className="mt-1 text-sm text-brand-soft">{directory.tagline}</p>
        </div>
        <Badge
          variant="outline"
          className="shrink-0 border-hairline-strong text-[0.65rem] uppercase tracking-[0.12em] text-ink-faint"
        >
          {directory.pacing}
        </Badge>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-muted">{directory.summary}</p>

      {showPrinciples ? (
        <ul className="mt-4 space-y-1.5 border-t border-hairline pt-4">
          {directory.principles.slice(0, 3).map((principle) => (
            <li key={principle} className="flex gap-2 text-[0.82rem] leading-snug text-ink-muted">
              <span aria-hidden className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-brand" />
              {principle}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3 pt-1">
        <PaletteStrip palette={directory.palette} />
        <Link
          href={{ pathname: "/create", query: { direction: directory.id } }}
          className="inline-flex items-center gap-1 rounded-md text-xs font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Use this direction
          <ArrowUpRight aria-hidden className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}
