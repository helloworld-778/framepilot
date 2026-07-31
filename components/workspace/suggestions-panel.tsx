import { CheckCircle2, NotebookPen } from "lucide-react";

import type { DirectorOutput } from "@/types";

/** Improvement suggestions, presented as director notes with clear priority. */
export function SuggestionsPanel({ output }: { output: DirectorOutput }) {
  if (output.suggestions.length === 0) {
    return (
      <section
        aria-labelledby="suggestions-heading"
        className="rounded-lg border border-signal-success/30 bg-signal-success/5 p-5"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 aria-hidden className="size-3.5 text-signal-success" />
          <h2
            id="suggestions-heading"
            className="text-[0.7rem] font-medium uppercase tracking-slate text-signal-success"
          >
            Director notes
          </h2>
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          Nothing outstanding. Every check passed, so this brief is ready to hand to a generator.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="suggestions-heading" className="fp-panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3">
        <div className="flex items-center gap-2">
          <NotebookPen aria-hidden className="size-3.5 text-highlight" />
          <h2
            id="suggestions-heading"
            className="text-[0.7rem] font-medium uppercase tracking-slate text-ink-muted"
          >
            Director notes
          </h2>
        </div>
        <span className="rounded-full border border-highlight/40 bg-highlight/10 px-2 py-0.5 font-mono text-[0.62rem] text-highlight">
          {output.suggestions.length}
        </span>
      </div>

      <ol className="divide-y divide-hairline">
        {output.suggestions.map((suggestion, index) => (
          <li key={suggestion} className="flex gap-3 px-5 py-3">
            <span className="fp-slate mt-0.5 shrink-0 text-[0.65rem]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="text-[0.82rem] leading-snug text-ink-muted">{suggestion}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
