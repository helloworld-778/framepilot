"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { DirectionCanvas } from "@/components/shared/direction-canvas";
import { DIRECTORY_BY_ID } from "@/data/directories";
import { directoryTheme } from "@/lib/directory-theme";
import type { DirectorOutput } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Collapsible moodboard for wide screens. Built entirely from the selected
 * direction's existing ruleset — no new persisted data, nothing decorative and
 * empty. Below `xl` it sits at the end of the column rather than beside it.
 */
export function MoodboardPanel({ output }: { output: DirectorOutput }) {
  const [open, setOpen] = useState(true);
  const directory = DIRECTORY_BY_ID[output.directoryId];
  const theme = directoryTheme(output.directoryId);

  const sections = [
    { label: "Camera grammar", items: directory.cameraGrammar },
    { label: "Lighting rules", items: directory.lightingRules },
    { label: "Transitions", items: directory.transitionVocabulary },
  ];

  return (
    <section aria-labelledby="moodboard-heading" className="fp-panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3">
        <h2
          id="moodboard-heading"
          className="text-[0.7rem] font-medium uppercase tracking-slate text-ink-muted"
        >
          Moodboard
        </h2>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="moodboard-body"
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.68rem] text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {open ? "Hide" : "Show"}
          <ChevronDown
            aria-hidden
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      <div id="moodboard-body" hidden={!open}>
        <div className="relative h-20 overflow-hidden border-b border-hairline">
          <DirectionCanvas seed={output.shots.length + 2} />
          <div className="absolute inset-0 flex items-end justify-between gap-2 p-3">
            <p className="fp-slate text-[0.6rem] uppercase">{theme.label}</p>
            <p className="font-mono text-[0.58rem] text-ink-faint">{directory.pacing}</p>
          </div>
        </div>

        <div className="p-5">
          <ul className="flex flex-wrap items-center gap-1.5">
            {directory.palette.map((swatch) => (
              <li key={swatch.hex} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  style={{ backgroundColor: swatch.hex }}
                  className="fp-swatch-glow block size-4 rounded-[4px]"
                />
                <span className="text-[0.68rem] text-ink-faint">{swatch.label}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-3 border-t border-hairline pt-4">
            {sections.map((section) => (
              <div key={section.label}>
                <dt className="text-[0.62rem] uppercase tracking-slate text-ink-faint">
                  {section.label}
                </dt>
                <dd className="mt-1 text-[0.78rem] leading-snug text-ink-muted">
                  {section.items.join(" · ")}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
