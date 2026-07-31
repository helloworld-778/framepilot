"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

import { usePointerMotionEnabled } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

/** Maximum displacement in either axis, in pixels. Deliberately small. */
const DEFAULT_STRENGTH = 5;

const SPRING = { stiffness: 240, damping: 20, mass: 0.35 } as const;

/**
 * Adds a slight magnetic pull toward the pointer for high-intent calls to
 * action. It is a presentation wrapper only:
 *
 *   - the child stays the real interactive element, so no control is nested
 *     inside another control and semantics/focus are untouched
 *   - movement is capped at a few pixels and never scales the footprint
 *   - listeners are attached only for a hover-capable fine pointer with motion
 *     allowed; touch and reduced-motion users get a plain static wrapper
 *   - position is held in motion values, so pointer movement never re-renders
 */
export function MagneticCta({
  children,
  strength = DEFAULT_STRENGTH,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const enabled = usePointerMotionEnabled();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);

  function handlePointerMove(event: ReactPointerEvent<HTMLSpanElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) {
      return;
    }
    const offsetX = (event.clientX - (bounds.left + bounds.width / 2)) / (bounds.width / 2);
    const offsetY = (event.clientY - (bounds.top + bounds.height / 2)) / (bounds.height / 2);
    x.set(Math.max(-1, Math.min(1, offsetX)) * strength);
    y.set(Math.max(-1, Math.min(1, offsetY)) * strength);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  if (!enabled) {
    return <span className={cn("inline-flex", className)}>{children}</span>;
  }

  return (
    <motion.span
      className={cn("inline-flex", className)}
      style={{ x: springX, y: springY }}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      // Losing the pointer mid-press should settle too.
      onBlur={reset}
    >
      {children}
    </motion.span>
  );
}
