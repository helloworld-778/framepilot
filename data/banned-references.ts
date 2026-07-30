/**
 * Reference-safety lexicon.
 *
 * This file deliberately contains no real names. Naming directors, studios,
 * franchises, or brands in order to detect them would put exactly the content
 * we forbid into the codebase. Instead we detect the *shape* of a borrowed-style
 * request — the phrasing and the category words that signal style emulation or
 * protected property.
 */

export type ReferenceTier = "hard" | "soft";

export interface BannedReferencePattern {
  id: string;
  tier: ReferenceTier;
  /** Case-insensitive; keep patterns narrow so original copy never trips them. */
  pattern: RegExp;
  /** Shown to the user when the pattern matches their brief. */
  guidance: string;
}

export const BANNED_REFERENCE_PATTERNS: BannedReferencePattern[] = [
  {
    id: "style-of",
    tier: "hard",
    pattern: /\bin the style of\b/i,
    guidance:
      "Describe the look itself — lens, contrast, palette, movement — instead of borrowing someone's style.",
  },
  {
    id: "styled-after",
    tier: "hard",
    pattern: /\bstyled (?:after|like)\b/i,
    guidance: "Replace the comparison with the specific lighting and framing you want.",
  },
  {
    id: "shot-like",
    tier: "hard",
    pattern: /\bshot like\b/i,
    guidance: "Name the camera behaviour you want: lens length, move, and speed.",
  },
  {
    id: "looks-like-title",
    tier: "hard",
    pattern: /\blooks? like (?:a|the|that) (?:movie|film series|franchise|show|series|advert|commercial)\b/i,
    guidance: "Describe the mood and craft directly rather than pointing at an existing title.",
  },
  {
    id: "same-as",
    tier: "hard",
    pattern: /\bsame (?:vibe|style|look|feel) as\b/i,
    guidance: "Say what the vibe is made of — palette, pace, sound — not what it resembles.",
  },
  {
    id: "inspired-by-title",
    tier: "hard",
    pattern: /\binspired by (?:the )?(?:movie|film series|franchise|show|series|album|novel|book)\b/i,
    guidance: "Keep the intent, drop the source. Describe the feeling you are after.",
  },
  {
    id: "creator-style",
    tier: "hard",
    pattern: /\b(?:director|filmmaker|cinematographer|photographer|artist|studio)(?:'s|s')\s+(?:style|look|aesthetic|signature)\b/i,
    guidance: "Translate that into concrete craft: how it is lit, framed, and cut.",
  },
  {
    id: "franchise",
    tier: "hard",
    pattern: /\b(?:franchise|cinematic universe|expanded universe)\b/i,
    guidance: "Existing properties are out of scope. Build the world from your own brief.",
  },
  {
    id: "protected-property",
    tier: "hard",
    pattern: /\b(?:copyrighted|trademarked|licensed character|brand mascot)\b/i,
    guidance: "Use original characters and marks you own.",
  },
  {
    id: "likeness",
    tier: "hard",
    pattern: /\b(?:celebrity|lookalike|look-alike|body double|deepfake)\b/i,
    guidance: "Cast a described person — role, age range, wardrobe — not a recognisable individual.",
  },
  {
    id: "recognisable-logo",
    tier: "hard",
    pattern: /\b(?:logo of|branded packaging|brand logo|company logo)\b/i,
    guidance: "Keep packaging unbranded, or use your own original mark.",
  },
  {
    id: "vague-cinematic",
    tier: "soft",
    pattern: /\b(?:cinematic vibes?|movie magic|hollywood(?:-| )?style|epic like)\b/i,
    guidance: "Swap the shorthand for something a camera operator could act on.",
  },
  {
    id: "vague-famous",
    tier: "soft",
    pattern: /\b(?:iconic|famous|legendary) (?:scene|shot|look|style)\b/i,
    guidance: "Describe the shot you actually want rather than calling it iconic.",
  },
];

/** Fields exempt from the sweep: naming an exclusion is the point of a negative prompt. */
export const REFERENCE_SWEEP_EXEMPT_FIELDS = ["negativePrompt"] as const;
