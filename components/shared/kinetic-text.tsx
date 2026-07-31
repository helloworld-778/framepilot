"use client";

import { useEffect, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A restrained phrase-by-phrase reveal, used at exactly two moments: the landing
 * headline and the arrival of a freshly generated project title.
 *
 * Implemented in CSS rather than JavaScript on purpose:
 *   - the text is in the initial DOM and readable even if JS never runs, because
 *     the animation ends at the natural state and uses `both` fill
 *   - there is no hydration-sensitive state and no setState in an effect
 *   - reduced motion is handled by the global media query, which collapses the
 *     animation to its final frame immediately
 *
 * `revealKey` makes the reveal a one-time event per browser session: a seed that
 * has already played renders statically, so editing a shot, saving, switching
 * tabs, or reopening a saved project never replays it.
 */

const revealedKeys = new Set<string>();

export function hasRevealed(key: string): boolean {
  return revealedKeys.has(key);
}

/** Test-only reset so session memory does not leak between cases. */
export function resetRevealMemory(): void {
  revealedKeys.clear();
}

export function KineticText({
  children,
  revealKey,
  className,
}: {
  children: ReactNode;
  /** Omit to reveal once per mount, e.g. the landing headline. */
  revealKey?: string;
  className?: string;
}) {
  const alreadyRevealed = revealKey !== undefined && revealedKeys.has(revealKey);

  useEffect(() => {
    if (revealKey !== undefined) {
      revealedKeys.add(revealKey);
    }
  }, [revealKey]);

  return (
    <span className={cn("block", !alreadyRevealed && "fp-reveal", className)}>
      {children}
    </span>
  );
}

/** One phrase or line of a reveal. Never a single character. */
export function KineticPhrase({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("block", className)}>{children}</span>;
}
