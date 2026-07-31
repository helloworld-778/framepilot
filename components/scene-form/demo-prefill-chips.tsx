"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DEMO_BRIEFS, type DemoBrief } from "@/data/demo-projects";

export function DemoPrefillChips({
  onSelect,
  activeSlug,
}: {
  onSelect: (demo: DemoBrief) => void;
  activeSlug?: string;
}) {
  return (
    <div className="fp-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-slate text-ink-muted">
          <Sparkles aria-hidden className="size-3.5 text-brand-soft" />
          Start from a demo brief
        </p>
        <span aria-hidden className="fp-perf hidden h-1.5 flex-1 opacity-60 sm:block" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {DEMO_BRIEFS.map((demo) => (
          <Button
            key={demo.slug}
            type="button"
            size="sm"
            variant={activeSlug === demo.slug ? "secondary" : "outline"}
            onClick={() => onSelect(demo)}
            aria-pressed={activeSlug === demo.slug}
          >
            {demo.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
