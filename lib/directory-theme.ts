import type { DirectoryId } from "@/types";

/**
 * Presentation-only theming.
 *
 * Colour values live in `app/globals.css` under `[data-direction="…"]` blocks, so
 * any subtree can inherit a direction's accent by carrying the attribute. This
 * module only holds the small pieces JavaScript genuinely needs: the attribute
 * helper, motion character, and short descriptive words for mood panels.
 *
 * None of this touches directory data, schemas, or stored projects.
 */

export interface DirectoryMotion {
  /** Seconds. Suspense is slower, fantasy flows, product is crisp. */
  duration: number;
  ease: [number, number, number, number];
  /** Entrance stagger between sibling items, in seconds. */
  stagger: number;
}

export interface DirectoryTheme {
  id: DirectoryId;
  /** Production-label style tag shown on cards. */
  label: string;
  /** One-word mood descriptors for the moodboard panel. */
  moodWords: [string, string, string];
  motion: DirectoryMotion;
}

export const DIRECTORY_THEMES: Record<DirectoryId, DirectoryTheme> = {
  "nonlinear-suspense": {
    id: "nonlinear-suspense",
    label: "Low-key · Withheld",
    moodWords: ["cold", "withheld", "deliberate"],
    motion: { duration: 0.5, ease: [0.16, 0.84, 0.24, 1], stagger: 0.07 },
  },
  "whimsical-fantasy": {
    id: "whimsical-fantasy",
    label: "Warm · Flowing",
    moodWords: ["golden", "drifting", "alive"],
    motion: { duration: 0.42, ease: [0.22, 0.61, 0.36, 1], stagger: 0.06 },
  },
  "documentary-realism": {
    id: "documentary-realism",
    label: "Available light · Observed",
    moodWords: ["grounded", "honest", "unstyled"],
    motion: { duration: 0.38, ease: [0.33, 0.7, 0.4, 1], stagger: 0.05 },
  },
  "premium-product-film": {
    id: "premium-product-film",
    label: "Controlled · Precise",
    moodWords: ["clean", "measured", "material"],
    motion: { duration: 0.34, ease: [0.4, 0.75, 0.3, 1], stagger: 0.05 },
  },
};

export function directoryTheme(id: DirectoryId): DirectoryTheme {
  return DIRECTORY_THEMES[id];
}

/**
 * Spread onto any element to scope a direction's CSS custom properties to it.
 * Kept as a helper so the attribute name is written in exactly one place.
 */
export function directionAttr(id: DirectoryId): { "data-direction": DirectoryId } {
  return { "data-direction": id };
}
