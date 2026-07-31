"use client";

import { Ban, PackageCheck, Terminal } from "lucide-react";

import { CopyButton } from "@/components/shared/copy-button";
import type { DirectorOutput } from "@/types";

/**
 * Export deck. FramePilot hands the plan off to a generator — it does not
 * generate video itself, and the labels say so plainly.
 */
export function PromptPanel({ output }: { output: DirectorOutput }) {
  return (
    <section aria-labelledby="prompts-heading" className="fp-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-3">
        <div className="flex items-center gap-2">
          <PackageCheck aria-hidden className="size-3.5 text-dir" />
          <h2
            id="prompts-heading"
            className="text-[0.7rem] font-medium uppercase tracking-slate text-ink-muted"
          >
            Export deck
          </h2>
        </div>
        <p className="text-[0.68rem] text-ink-faint">Hand off to any generator</p>
      </div>

      <div className="space-y-4 p-5">
        <div className="overflow-hidden rounded-lg border border-hairline bg-canvas-deep/70">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Terminal aria-hidden className="size-3.5 text-dir-soft" />
              <h3 className="text-[0.7rem] font-medium uppercase tracking-slate text-ink-muted">
                Generator-ready prompt
              </h3>
            </div>
            <CopyButton value={output.masterPrompt} label="Copy prompt" />
          </div>
          <pre className="max-h-96 overflow-auto px-4 py-3.5 font-mono text-[0.72rem] leading-relaxed whitespace-pre-wrap break-words text-ink-muted">
            {output.masterPrompt}
          </pre>
        </div>

        <div className="overflow-hidden rounded-lg border border-hairline bg-canvas-deep/70">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Ban aria-hidden className="size-3.5 text-signal-danger" />
              <h3 className="text-[0.7rem] font-medium uppercase tracking-slate text-ink-muted">
                Production constraints
              </h3>
            </div>
            <CopyButton value={output.negativePrompt} label="Copy negative prompt" />
          </div>
          <p className="px-4 py-3.5 font-mono text-[0.72rem] leading-relaxed break-words text-ink-muted">
            {output.negativePrompt}
          </p>
        </div>
      </div>
    </section>
  );
}
