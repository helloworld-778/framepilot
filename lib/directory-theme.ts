import type { DirectoryId } from "@/types";

/**
 * Presentation-only theming.
 *
 * Colour values live in `app/globals.css` under `[data-direction="…"]` blocks, so
 * any subtree can inherit a direction's accent by carrying the attribute. This
 * module only holds the small pieces JavaScript genuinely needs: the attribute
 * helper and short descriptive words for mood panels. Motion timing is not
 * direction-specific — it lives in the shared stagger/kinetic primitives.
 *
 * None of this touches directory data, schemas, or stored projects.
 */

export interface DirectoryTheme {
  id: DirectoryId;
  /** Production-label style tag shown on cards. */
  label: string;
  /** One-word mood descriptors for the moodboard panel. */
  moodWords: [string, string, string];
}

export const DIRECTORY_THEMES: Record<DirectoryId, DirectoryTheme> = {
  "nonlinear-suspense": {
    id: "nonlinear-suspense",
    label: "Low-key · Withheld",
    moodWords: ["cold", "withheld", "deliberate"],
  },
  "whimsical-fantasy": {
    id: "whimsical-fantasy",
    label: "Warm · Flowing",
    moodWords: ["golden", "drifting", "alive"],
  },
  "documentary-realism": {
    id: "documentary-realism",
    label: "Available light · Observed",
    moodWords: ["grounded", "honest", "unstyled"],
  },
  "premium-product-film": {
    id: "premium-product-film",
    label: "Controlled · Precise",
    moodWords: ["clean", "measured", "material"],
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
