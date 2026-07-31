"use client";

import { useMemo, type PointerEvent as ReactPointerEvent } from "react";

import { usePointerMotionEnabled } from "@/lib/use-media-query";

/**
 * Shared interactive-card behaviour.
 *
 * One implementation for every clickable card in the product. The bloom is drawn
 * by `.fp-card-interactive` in `globals.css` from `--dir-accent` when the card
 * sits inside a `[data-direction]` subtree, and from the semantic violet
 * otherwise. All this hook does is tell the CSS where the pointer is.
 *
 * Deliberate choices:
 *   - the position is written straight onto the element as a custom property, so
 *     pointer movement never touches React state or re-renders the card
 *   - handlers are only returned for a hover-capable fine pointer with motion
 *     allowed; touch and reduced-motion users get the static hover/focus state
 *   - focus-visible styling lives entirely in CSS, so keyboard users get the
 *     same clear border and halo without any pointer position
 */

export interface PointerBloomHandlers {
  onPointerMove?: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerLeave?: (event: ReactPointerEvent<HTMLElement>) => void;
}

export function usePointerBloom(): PointerBloomHandlers {
  const enabled = usePointerMotionEnabled();

  return useMemo<PointerBloomHandlers>(() => {
    if (!enabled) {
      return {};
    }

    return {
      onPointerMove: (event) => {
        const element = event.currentTarget;
        const bounds = element.getBoundingClientRect();
        if (bounds.width === 0 || bounds.height === 0) {
          return;
        }
        const x = ((event.clientX - bounds.left) / bounds.width) * 100;
        const y = ((event.clientY - bounds.top) / bounds.height) * 100;
        element.style.setProperty("--bloom-x", `${x.toFixed(1)}%`);
        element.style.setProperty("--bloom-y", `${y.toFixed(1)}%`);
      },
      onPointerLeave: (event) => {
        const element = event.currentTarget;
        element.style.removeProperty("--bloom-x");
        element.style.removeProperty("--bloom-y");
      },
    };
  }, [enabled]);
}

/** The class every interactive card shares. Kept here so it is written once. */
export const INTERACTIVE_CARD_CLASS = "fp-card-interactive";
