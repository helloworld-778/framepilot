"use client";

import { Ban, Terminal } from "lucide-react";

import { CopyButton } from "@/components/shared/copy-button";
import type { DirectorOutput } from "@/types";

export function PromptPanel({ output }: { output: DirectorOutput }) {
  return (
    <section aria-labelledby="prompts-heading" className="space-y-4">
      <h2 id="prompts-heading" className="sr-only">
        Generator prompts
      </h2>

      <div className="rounded-lg border border-hairline bg-surface/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-3">
          <div className="flex items-center gap-2">
            <Terminal aria-hidden className="size-3.5 text-brand-soft" />
            <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-faint">
              Master prompt
            </h3>
          </div>
          <CopyButton value={output.masterPrompt} label="Copy prompt" />
        </div>
        <pre className="max-h-96 overflow-auto px-5 py-4 font-mono text-[0.72rem] leading-relaxed whitespace-pre-wrap break-words text-ink-muted">
          {output.masterPrompt}
        </pre>
      </div>

      <div className="rounded-lg border border-hairline bg-surface/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-3">
          <div className="flex items-center gap-2">
            <Ban aria-hidden className="size-3.5 text-signal-danger" />
            <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-faint">
              Negative prompt
            </h3>
          </div>
          <CopyButton value={output.negativePrompt} label="Copy negative prompt" />
        </div>
        <p className="px-5 py-4 font-mono text-[0.72rem] leading-relaxed break-words text-ink-muted">
          {output.negativePrompt}
        </p>
      </div>
    </section>
  );
}
