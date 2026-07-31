"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Media queries read as external stores rather than through effects, so there is
 * no setState-in-effect cascade and no hydration mismatch: the server snapshot
 * is always `false`, and React re-checks immediately after hydration.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (listener: () => void) => {
      if (typeof window === "undefined" || !window.matchMedia) {
        return () => {};
      }
      const list = window.matchMedia(query);
      list.addEventListener("change", listener);
      return () => list.removeEventListener("change", listener);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION_QUERY);
}

/**
 * True only for a hover-capable, precise pointer. Pointer-tracking effects are
 * never attached on touch or coarse pointers.
 */
export function useFinePointer(): boolean {
  return useMediaQuery(FINE_POINTER_QUERY);
}

/** Pointer-driven embellishments run only when both conditions hold. */
export function usePointerMotionEnabled(): boolean {
  const finePointer = useFinePointer();
  const reducedMotion = usePrefersReducedMotion();
  return finePointer && !reducedMotion;
}
