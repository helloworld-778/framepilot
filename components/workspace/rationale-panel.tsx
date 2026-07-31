import { Dot, Quote } from "lucide-react";

import { DIRECTORY_BY_ID } from "@/data/directories";
import type { DirectorOutput } from "@/types";

export function RationalePanel({ output }: { output: DirectorOutput }) {
  const directory = DIRECTORY_BY_ID[output.directoryId];

  return (
    <section
      aria-labelledby="rationale-heading"
      className="fp-panel fp-panel-tinted fp-edge-light overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3">
        <div className="flex items-center gap-2">
          <Quote aria-hidden className="size-3.5 text-dir" />
          <h2
            id="rationale-heading"
            className="text-[0.7rem] font-medium uppercase tracking-slate text-ink-muted"
          >
            Creative rationale
          </h2>
        </div>
        <span className="fp-slate text-[0.6rem] uppercase">Why these shots</span>
      </div>

      <div className="p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-ink sm:text-[0.95rem]">
          {output.creativeRationale}
        </p>

        <ul className="mt-5 grid gap-2 border-t border-hairline pt-4 sm:grid-cols-2">
          {directory.principles.slice(0, 4).map((principle) => (
            <li key={principle} className="flex gap-1.5 text-xs leading-snug text-ink-muted">
              <Dot aria-hidden className="mt-0.5 size-4 shrink-0 text-dir" />
              {principle}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
