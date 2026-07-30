import { Lightbulb } from "lucide-react";

import type { DirectorOutput } from "@/types";

export function SuggestionsPanel({ output }: { output: DirectorOutput }) {
  if (output.suggestions.length === 0) {
    return (
      <section
        aria-labelledby="suggestions-heading"
        className="rounded-lg border border-signal-success/30 bg-signal-success/5 p-5"
      >
        <h2
          id="suggestions-heading"
          className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-signal-success"
        >
          Improvements
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Nothing outstanding. Every check passed, so this brief is ready to hand to a generator.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="suggestions-heading"
      className="rounded-lg border border-hairline bg-surface/60 p-5"
    >
      <div className="flex items-center gap-2">
        <Lightbulb aria-hidden className="size-3.5 text-highlight" />
        <h2
          id="suggestions-heading"
          className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-faint"
        >
          Improve this plan
        </h2>
      </div>

      <ol className="mt-3 space-y-2.5">
        {output.suggestions.map((suggestion, index) => (
          <li key={suggestion} className="flex gap-2.5 text-[0.82rem] leading-snug text-ink-muted">
            <span className="font-mono text-[0.7rem] text-highlight">{index + 1}</span>
            {suggestion}
          </li>
        ))}
      </ol>
    </section>
  );
}
