import {
  ASPECT_RATIOS,
  DESCRIPTION_MAX,
  DIRECTORY_IDS,
  SCENE_DURATIONS,
  SCENE_PURPOSES,
} from "@/lib/schemas";
import type {
  AspectRatio,
  DirectoryId,
  ReadinessBand,
  SceneBrief,
  SceneDuration,
  ScenePurpose,
} from "@/types";

/** Typed option lists for form controls and exhaustive tests. */
export const SCENE_DURATION_LIST: readonly SceneDuration[] = SCENE_DURATIONS;
export const ASPECT_RATIO_LIST: readonly AspectRatio[] = ASPECT_RATIOS;
export const SCENE_PURPOSE_LIST: readonly ScenePurpose[] = SCENE_PURPOSES;
export const DIRECTORY_ID_LIST: readonly DirectoryId[] = DIRECTORY_IDS;

export const APP_NAME = "FramePilot";
export const APP_TAGLINE = "Direct the scene before you generate it.";
export const GENERATOR_VERSION = "mock-1.0.0";

/** localStorage keys. Version lives in the key and inside the payload. */
export const STORAGE_KEYS = {
  draft: "framepilot:draft:v1",
  projects: "framepilot:projects:v1",
  preferences: "framepilot:prefs:v1",
  schemaVersion: "framepilot:schema-version",
} as const;

/** Mirrors `DESCRIPTION_MAX` for the form's character counter. */
export const DESCRIPTION_LIMIT = DESCRIPTION_MAX;

export const PROJECT_CAP = 25;
export const PROJECT_CAP_WARNING_AT = 20;

/** Shot count is driven by duration; each directory supplies its own archetypes. */
export const SHOT_COUNT_BY_DURATION: Record<SceneDuration, number> = {
  8: 3,
  15: 4,
  30: 5,
};

export const MIN_SHOT_SECONDS = 2;

export const DEFAULT_SCENE_BRIEF: SceneBrief = {
  description: "",
  directoryId: "documentary-realism",
  purpose: "promotion",
  duration: 15,
  aspectRatio: "9:16",
  primarySubject: "",
  targetAudience: "",
  onScreenText: "",
};

export const PURPOSE_LABELS: Record<ScenePurpose, string> = {
  promotion: "Promotion",
  invitation: "Invitation",
  awareness: "Awareness",
  "short-story": "Short story",
};

export const PURPOSE_HINTS: Record<ScenePurpose, string> = {
  promotion: "Sell a specific offer or product moment.",
  invitation: "Get people to show up at a time and place.",
  awareness: "Shift understanding or behaviour on an issue.",
  "short-story": "Carry a small narrative with a turn in it.",
};

export const DURATION_LABELS: Record<SceneDuration, string> = {
  8: "8 sec",
  15: "15 sec",
  30: "30 sec",
};

export const DURATION_HINTS: Record<SceneDuration, string> = {
  8: "One idea, three shots.",
  15: "A short arc with room for a detail beat.",
  30: "Full arc with context and resolve.",
};

export const ASPECT_LABELS: Record<AspectRatio, string> = {
  "9:16": "9:16 vertical",
  "16:9": "16:9 landscape",
  "1:1": "1:1 square",
};

export const ASPECT_HINTS: Record<AspectRatio, string> = {
  "9:16": "Phone-first feeds and stories.",
  "16:9": "Web embeds, screens, and long-form.",
  "1:1": "Grid posts and mixed placements.",
};

/** Aspect ratios that suit each purpose. Used by the readiness rubric. */
export const PREFERRED_ASPECTS: Record<ScenePurpose, AspectRatio[]> = {
  promotion: ["9:16", "1:1"],
  invitation: ["9:16", "1:1"],
  awareness: ["16:9", "9:16"],
  "short-story": ["16:9", "1:1"],
};

export const READINESS_BANDS: ReadinessBand[] = [
  { label: "Ready to generate", min: 85, tone: "strong" },
  { label: "Nearly ready", min: 65, tone: "steady" },
  { label: "Needs sharpening", min: 40, tone: "caution" },
  { label: "Rework the brief", min: 0, tone: "weak" },
];

export function readinessBandFor(score: number): ReadinessBand {
  const band = READINESS_BANDS.find((candidate) => score >= candidate.min);
  return band ?? { label: "Rework the brief", min: 0, tone: "weak" };
}
