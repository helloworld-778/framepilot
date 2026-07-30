import type { SceneBrief } from "@/types";

/**
 * Deterministic seeding.
 *
 * The seed is a pure function of the brief's meaning: whitespace, casing, and
 * key order never change it, but any real edit does. No clock, no randomness.
 */

/** FNV-1a, 32-bit. Small, fast, and stable across runtimes. */
export function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    // 16777619 via shifts to stay in 32-bit integer space.
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    hash >>>= 0;
  }
  return hash >>> 0;
}

export function hashToHex(hash: number): string {
  return hash.toString(16).padStart(8, "0");
}

/** Hash an arbitrary label into a 32-bit integer, for per-shot sub-streams. */
export function hashString(input: string): number {
  return fnv1a32(input);
}

function normaliseText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Stable string form of a brief. Keys are written in a fixed order rather than
 * relying on object insertion order.
 */
export function canonicaliseBrief(brief: SceneBrief): string {
  return [
    `aspectRatio=${brief.aspectRatio}`,
    `description=${normaliseText(brief.description)}`,
    `directoryId=${brief.directoryId}`,
    `duration=${brief.duration}`,
    `onScreenText=${normaliseText(brief.onScreenText)}`,
    `primarySubject=${normaliseText(brief.primarySubject)}`,
    `purpose=${brief.purpose}`,
    `targetAudience=${normaliseText(brief.targetAudience)}`,
  ].join("|");
}

export function seedForBrief(brief: SceneBrief): string {
  return hashToHex(fnv1a32(canonicaliseBrief(brief)));
}
