"use client";

import { ArrowUpRight, Dot } from "lucide-react";
import Link from "next/link";

import { usePointerBloom } from "@/components/shared/interactive-card";
import { Badge } from "@/components/ui/badge";
import { directionAttr, directoryTheme } from "@/lib/directory-theme";
import type { CreativeDirectory } from "@/types";
import { cn } from "@/lib/utils";

/**
 * A creative direction presented as a production label: palette band, pacing
 * tag, working principles, and a clear way to use it.
 */
export function DirectoryCard({
  directory,
  className,
  showPrinciples = true,
}: {
  directory: CreativeDirectory;
  className?: string;
  showPrinciples?: boolean;
}) {
  const theme = directoryTheme(directory.id);
  const bloom = usePointerBloom();

  return (
    <article
      {...directionAttr(directory.id)}
      {...bloom}
      className={cn(
        "fp-panel fp-panel-tinted fp-card-interactive group relative flex h-full flex-col overflow-hidden",
        className,
      )}
    >
      {/* Palette band doubles as the direction's signature. */}
      <div aria-hidden className="flex h-1.5 w-full">
        {directory.palette.map((swatch) => (
          <span key={swatch.hex} className="flex-1" style={{ backgroundColor: swatch.hex }} />
        ))}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-medium text-ink">{directory.name}</h3>
            <p className="mt-1 text-sm text-dir-soft">{directory.tagline}</p>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 border-dir/40 bg-dir/10 text-[0.62rem] uppercase tracking-slate text-dir-soft"
          >
            {directory.pacing}
          </Badge>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-ink-muted">{directory.summary}</p>

        {showPrinciples ? (
          <ul className="mt-4 space-y-1.5 border-t border-hairline pt-4">
            {directory.principles.slice(0, 3).map((principle) => (
              <li
                key={principle}
                className="flex gap-1.5 text-[0.82rem] leading-snug text-ink-muted"
              >
                <Dot aria-hidden className="mt-0.5 size-4 shrink-0 text-dir" />
                {principle}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="fp-slate mb-1.5 text-[0.58rem] uppercase">{theme.label}</p>
            <ul className="flex items-center gap-1.5">
              {directory.palette.map((swatch) => (
                <li key={swatch.hex}>
                  <span
                    aria-hidden
                    style={{ backgroundColor: swatch.hex }}
                    className="fp-swatch-glow block size-4 rounded-[4px]"
                  />
                  <span className="sr-only">{`${swatch.label} ${swatch.hex}`}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href={{ pathname: "/create", query: { direction: directory.id } }}
            className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-xs font-medium text-ink-muted transition-colors hover:border-dir/40 hover:bg-dir/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Use this direction
            <ArrowUpRight aria-hidden className="fp-cta-arrow size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
