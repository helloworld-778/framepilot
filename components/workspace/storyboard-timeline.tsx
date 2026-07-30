"use client";

import { motion } from "framer-motion";
import { useRef } from "react";

import type { StoryboardShot } from "@/types";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<StoryboardShot["role"], string> = {
  establish: "Establish",
  withhold: "Withhold",
  fragment: "Fragment",
  reveal: "Reveal",
  develop: "Develop",
  detail: "Detail",
  resolve: "Resolve",
};

interface StoryboardTimelineProps {
  shots: StoryboardShot[];
  activeShotId: string | null;
  onSelect: (shotId: string) => void;
  totalSeconds: number;
}

/**
 * The primary visual of the workspace: proportional-width segments across the
 * chosen runtime. Arrow keys move between segments, and selecting one focuses
 * the matching shot card.
 */
export function StoryboardTimeline({
  shots,
  activeShotId,
  onSelect,
  totalSeconds,
}: StoryboardTimelineProps) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>, index: number) {
    const lastIndex = shots.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = index === lastIndex ? 0 : index + 1;
    } else if (event.key === "ArrowLeft") {
      nextIndex = index === 0 ? lastIndex : index - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      buttons.current[nextIndex]?.focus();
      const shot = shots[nextIndex];
      if (shot) {
        onSelect(shot.id);
      }
    }
  }

  // Cumulative start times, derived rather than accumulated during render.
  const starts = shots.reduce<number[]>((accumulator, shot, index) => {
    const previousStart = accumulator[index - 1] ?? 0;
    const previousDuration = shots[index - 1]?.durationSeconds ?? 0;
    accumulator.push(index === 0 ? 0 : previousStart + previousDuration);
    return accumulator;
  }, []);

  return (
    <section
      aria-labelledby="timeline-heading"
      className="fp-edge-light rounded-lg border border-hairline bg-surface/60 p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="timeline-heading"
          className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-faint"
        >
          Storyboard timeline
        </h2>
        <p className="font-mono text-[0.7rem] text-brand-soft">
          {shots.length} shots · {totalSeconds}s
        </p>
      </div>

      <div
        role="group"
        aria-label="Shot timeline. Use the arrow keys to move between shots."
        className="mt-4 flex items-stretch gap-1.5 overflow-x-auto pb-1"
      >
        {shots.map((shot, index) => {
          const start = starts[index] ?? 0;
          const isActive = shot.id === activeShotId;

          return (
            <div
              key={shot.id}
              // Width is proportional to duration, with a floor so segments
              // stay legible on a 375px screen (the row scrolls if needed).
              style={{ flexGrow: shot.durationSeconds, flexBasis: 0 }}
              className="min-w-[4.75rem] shrink-0 sm:min-w-0 sm:shrink"
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <button
                ref={(element) => {
                  buttons.current[index] = element;
                }}
                type="button"
                onClick={() => onSelect(shot.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "group flex w-full flex-col gap-2 rounded-md border p-2.5 text-left transition-colors",
                  isActive
                    ? "border-brand/70 bg-brand/10"
                    : "border-hairline bg-surface-sunken/70 hover:border-hairline-strong",
                )}
              >
                <span className="flex items-baseline justify-between gap-1">
                  <span className="font-mono text-[0.65rem] text-ink-faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[0.65rem]",
                      isActive ? "text-brand-soft" : "text-ink-faint",
                    )}
                  >
                    {shot.durationSeconds}s
                  </span>
                </span>

                <span className="relative block h-1.5 overflow-hidden rounded-full bg-hairline">
                  <motion.span
                    layout
                    className={cn(
                      "absolute inset-y-0 left-0 w-full rounded-full",
                      isActive ? "bg-brand" : "bg-hairline-strong group-hover:bg-brand/50",
                    )}
                  />
                </span>

                <span
                  className={cn(
                    "truncate text-[0.7rem]",
                    isActive ? "text-ink" : "text-ink-muted",
                  )}
                  title={ROLE_LABELS[shot.role]}
                >
                  {ROLE_LABELS[shot.role]}
                </span>
                <span className="font-mono text-[0.6rem] text-ink-faint">
                  {start}s–{start + shot.durationSeconds}s
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
