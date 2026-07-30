import { Quote } from "lucide-react";

import { DIRECTORY_BY_ID } from "@/data/directories";
import type { DirectorOutput } from "@/types";

export function RationalePanel({ output }: { output: DirectorOutput }) {
  const directory = DIRECTORY_BY_ID[output.directoryId];

  return (
    <section
      aria-labelledby="rationale-heading"
      className="fp-edge-light rounded-lg border border-hairline bg-surface/60 p-5 sm:p-6"
    >
      <div className="flex items-center gap-2">
        <Quote aria-hidden className="size-3.5 text-brand-soft" />
        <h2
          id="rationale-heading"
          className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-faint"
        >
          Creative rationale
        </h2>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink sm:text-[0.95rem]">
        {output.creativeRationale}
      </p>

      <ul className="mt-5 grid gap-2 border-t border-hairline pt-4 sm:grid-cols-2">
        {directory.principles.slice(0, 4).map((principle) => (
          <li key={principle} className="flex gap-2 text-xs leading-snug text-ink-muted">
            <span aria-hidden className="mt-[0.4rem] size-1 shrink-0 rounded-full bg-brand" />
            {principle}
          </li>
        ))}
      </ul>
    </section>
  );
}
