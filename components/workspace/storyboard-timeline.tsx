"use client";

import { useRef } from "react";

import { DirectionCanvas } from "@/components/shared/direction-canvas";
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

/** Role order nudges the mood-frame light so shots do not look identical. */
const ROLE_SEED: Record<StoryboardShot["role"], number> = {
  establish: 1,
  withhold: 2,
  fragment: 3,
  reveal: 4,
  develop: 5,
  detail: 6,
  resolve: 7,
};

interface StoryboardTimelineProps {
  shots: StoryboardShot[];
  activeShotId: string | null;
  onSelect: (shotId: string) => void;
  totalSeconds: number;
}

/**
 * The primary visual of the workspace: proportional-width mood frames across
 * the chosen runtime. Widths stay truthful to each shot's duration, and the
 * keyboard contract (arrows, Home, End) is unchanged.
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
      className="fp-panel fp-panel-tinted fp-edge-light p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="timeline-heading"
          className="text-[0.7rem] font-medium uppercase tracking-slate text-ink-muted"
        >
          Storyboard timeline
        </h2>
        <p className="font-mono text-[0.7rem] text-dir-soft">
          {shots.length} shots · {totalSeconds}s
        </p>
      </div>

      {/* Sits with the durations it explains; no tooltip, no hover. */}
      <p className="mt-1.5 text-[0.68rem] leading-snug text-ink-muted">
        Shot timings are set by the selected runtime so the storyboard adds up exactly.
      </p>

      <div aria-hidden className="fp-perf mt-3 h-1.5 opacity-60" />

      <div
        role="group"
        aria-label="Shot timeline. Use the arrow keys to move between shots."
        className="mt-3 flex items-stretch gap-1.5 overflow-x-auto pb-1"
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
              className="min-w-[5.5rem] shrink-0 sm:min-w-0 sm:shrink"
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
                  "group relative block w-full overflow-hidden rounded-md border text-left transition-[border-color,box-shadow,transform]",
                  isActive
                    ? "border-dir/70 shadow-[0_0_26px_-10px_color-mix(in_oklab,var(--dir-accent)_60%,transparent)]"
                    : "border-hairline hover:border-hairline-strong",
                )}
              >
                {/* Abstract mood frame: CSS only, varied by role and order. */}
                <span className="relative block h-20 sm:h-24">
                  <DirectionCanvas seed={index * 3 + (ROLE_SEED[shot.role] ?? 1)} />

                  {isActive ? (
                    <>
                      <span aria-hidden className="fp-playhead left-1.5" />
                      <span
                        aria-hidden
                        className="fp-sweep pointer-events-none absolute inset-0 overflow-hidden"
                      />
                    </>
                  ) : null}

                  <span className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-1.5">
                    <span className="fp-slate text-[0.6rem]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "rounded bg-canvas-deep/75 px-1 font-mono text-[0.6rem]",
                        isActive ? "text-dir-soft" : "text-ink-muted",
                      )}
                    >
                      {shot.durationSeconds}s
                    </span>
                  </span>
                </span>

                <span
                  className={cn(
                    "block border-t px-2 py-1.5 transition-colors",
                    isActive
                      ? "border-dir/40 bg-dir/12"
                      : "border-hairline bg-surface-sunken/80",
                  )}
                >
                  <span
                    className={cn(
                      "block truncate text-[0.7rem] font-medium",
                      isActive ? "text-ink" : "text-ink-muted",
                    )}
                  >
                    {ROLE_LABELS[shot.role]}
                  </span>
                  <span className="mt-0.5 block font-mono text-[0.6rem] text-ink-faint">
                    {start}s–{start + shot.durationSeconds}s
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
