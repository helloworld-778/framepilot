"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useId } from "react";

import { StatusPill } from "@/components/shared/status-pill";
import { readinessBandFor } from "@/lib/constants";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import type { DirectorOutput, ReadinessBand } from "@/types";
import { cn } from "@/lib/utils";

const TONE_COLOUR: Record<ReadinessBand["tone"], string> = {
  strong: "var(--fp-success)",
  steady: "var(--dir-accent-soft)",
  caution: "var(--fp-warning)",
  weak: "var(--fp-danger)",
};

/**
 * Instrument-style dial: conic ring, tick marks, direction-aware glow. The score
 * and the checks come straight from the rubric — nothing here changes them.
 *
 * The count and the ring are driven by a motion value rather than React state,
 * so animating the number never triggers a re-render.
 */
function ScoreDial({ score, band }: { score: number; band: ReadinessBand }) {
  const reducedMotion = usePrefersReducedMotion();
  const colour = TONE_COLOUR[band.tone];
  const explanationId = useId();

  const value = useMotionValue(score);
  const rounded = useTransform(value, (current) => Math.round(current));
  const ring = useTransform(
    value,
    (current) =>
      `conic-gradient(${colour} ${current * 3.6}deg, color-mix(in oklab, var(--fp-hairline) 90%, transparent) ${current * 3.6}deg)`,
  );

  useEffect(() => {
    const controls = animate(value, score, {
      duration: reducedMotion ? 0 : 0.6,
      ease: [0.22, 0.61, 0.36, 1],
    });
    return () => controls.stop();
  }, [value, score, reducedMotion]);

  return (
    <div className="flex items-center gap-4">
      <motion.div
        role="img"
        aria-label={`Production readiness ${score} out of 100. ${band.label}.`}
        // Ties the score to the sentence that says what it does and does not mean.
        aria-describedby={explanationId}
        className="relative grid size-24 shrink-0 place-items-center rounded-full"
        style={{
          background: ring,
          boxShadow: `0 0 30px -12px ${colour}`,
        }}
      >
        {/* Tick marks, drawn with a repeating conic gradient. */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full opacity-45"
          style={{
            background:
              "repeating-conic-gradient(from 0deg, rgb(0 0 0 / 0.75) 0deg 1.4deg, transparent 1.4deg 9deg)",
            mask: "radial-gradient(circle, transparent 76%, #000 77%, #000 100%)",
          }}
        />
        <span className="relative grid size-[4.9rem] place-items-center rounded-full bg-surface shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05)]">
          <motion.span className="font-mono text-2xl font-medium leading-none text-ink">
            {rounded}
          </motion.span>
          <span className="mt-1 font-mono text-[0.55rem] uppercase tracking-slate text-ink-faint">
            / 100
          </span>
        </span>
      </motion.div>

      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: colour }}>
          {band.label}
        </p>
        {/* Always visible: no tooltip, no disclosure, no hover. */}
        <p id={explanationId} className="mt-1 text-xs leading-snug text-balance text-ink-muted">
          This scores how ready the brief and plan are to hand to a generator — not the quality
          of the finished video.
        </p>
      </div>
    </div>
  );
}

export function ReadinessPanel({ output }: { output: DirectorOutput }) {
  const band = readinessBandFor(output.readinessScore);

  return (
    <section
      aria-labelledby="readiness-heading"
      className="fp-panel fp-panel-tinted overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3">
        <h2
          id="readiness-heading"
          className="text-[0.7rem] font-medium uppercase tracking-slate text-ink-muted"
        >
          Production readiness
        </h2>
        <span className="fp-slate text-[0.6rem] uppercase">Instrument</span>
      </div>

      <div className="px-5 py-5">
        <ScoreDial score={output.readinessScore} band={band} />
      </div>

      <ul className="divide-y divide-hairline border-t border-hairline">
        {output.readinessChecks.map((check) => (
          <li key={check.id} className="px-5 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.82rem] font-medium text-ink">{check.label}</p>
                <p className="mt-1 text-xs leading-snug text-ink-muted">{check.detail}</p>
                {check.suggestion ? (
                  <p
                    className={cn(
                      "mt-1.5 text-xs leading-snug",
                      check.status === "fail" ? "text-signal-danger" : "text-signal-warning",
                    )}
                  >
                    {check.suggestion}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusPill status={check.status} />
                <span className="font-mono text-[0.65rem] text-ink-faint">{check.weight} pts</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
