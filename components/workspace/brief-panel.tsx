"use client";

import { ChevronDown, FileText } from "lucide-react";
import { useId, useState } from "react";

import { DIRECTORY_BY_ID } from "@/data/directories";
import {
  ASPECT_LABELS,
  DURATION_LABELS,
  PURPOSE_LABELS,
} from "@/lib/constants";
import type { SceneBrief } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Read-only echo of the brief that produced the plan on screen.
 *
 * Values come straight from the canonical `output.brief`, so this can never
 * disagree with what was actually directed. Collapsed by default: it is for
 * checking, not for working in, and it is identical for the working draft and a
 * reopened saved project.
 */
export function BriefPanel({ brief }: { brief: SceneBrief }) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const directory = DIRECTORY_BY_ID[brief.directoryId];

  const optional = [
    { label: "Primary subject", value: brief.primarySubject.trim() },
    { label: "Target audience", value: brief.targetAudience.trim() },
    { label: "On-screen text", value: brief.onScreenText.trim() },
  ].filter((row) => row.value.length > 0);

  const facts = [
    { label: "Creative direction", value: directory.name },
    { label: "Purpose", value: PURPOSE_LABELS[brief.purpose] },
    { label: "Runtime", value: DURATION_LABELS[brief.duration] },
    { label: "Aspect ratio", value: ASPECT_LABELS[brief.aspectRatio] },
    ...optional,
  ];

  return (
    <section aria-labelledby={`${bodyId}-heading`} className="fp-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-3">
        <div className="flex items-center gap-2">
          <FileText aria-hidden className="size-3.5 text-dir" />
          <h2
            id={`${bodyId}-heading`}
            className="text-[0.7rem] font-medium uppercase tracking-slate text-ink-muted"
          >
            Brief
          </h2>
          <span className="text-[0.68rem] text-ink-faint">
            What this plan was directed from
          </span>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.68rem] text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {open ? "Hide brief" : "Show brief"}
          <ChevronDown
            aria-hidden
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      <div id={bodyId} hidden={!open} className="px-5 py-4">
        <dl className="space-y-4">
          <div>
            <dt className="text-[0.62rem] uppercase tracking-slate text-ink-faint">
              Scene description
            </dt>
            <dd className="mt-1 text-sm leading-relaxed break-words text-ink">
              {brief.description}
            </dd>
          </div>

          <div className="grid gap-x-6 gap-y-3 border-t border-hairline pt-4 sm:grid-cols-2">
            {facts.map((fact) => (
              <div key={fact.label} className="min-w-0">
                <dt className="text-[0.62rem] uppercase tracking-slate text-ink-faint">
                  {fact.label}
                </dt>
                <dd className="mt-0.5 text-[0.82rem] leading-snug break-words text-ink-muted">
                  {fact.value}
                </dd>
              </div>
            ))}
          </div>
        </dl>
      </div>
    </section>
  );
}
