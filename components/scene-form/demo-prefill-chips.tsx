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
    <div className="rounded-lg border border-hairline bg-surface/40 p-4">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
        <Sparkles aria-hidden className="size-3.5 text-brand-soft" />
        Start from a demo brief
      </p>
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
