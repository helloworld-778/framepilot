import type { z } from "zod";

import type {
  aspectRatioSchema,
  checkStatusSchema,
  creativeDirectorySchema,
  directorOutputSchema,
  directoryIdSchema,
  draftEnvelopeSchema,
  pacingModeSchema,
  paletteSwatchSchema,
  preferencesSchema,
  projectsEnvelopeSchema,
  readinessCheckSchema,
  savedProjectSchema,
  sceneBriefSchema,
  sceneDurationSchema,
  scenePurposeSchema,
  shotArchetypeSchema,
  shotBeatSchema,
  shotEditSchema,
  shotRoleSchema,
  storyboardShotSchema,
} from "@/lib/schemas";

/**
 * Every domain type is inferred from the Zod schema that validates it.
 * If a shape needs to change, change the schema — not this file.
 */

export type DirectoryId = z.infer<typeof directoryIdSchema>;
export type ScenePurpose = z.infer<typeof scenePurposeSchema>;
export type SceneDuration = z.infer<typeof sceneDurationSchema>;
export type AspectRatio = z.infer<typeof aspectRatioSchema>;
export type ShotRole = z.infer<typeof shotRoleSchema>;
export type CheckStatus = z.infer<typeof checkStatusSchema>;
export type PacingMode = z.infer<typeof pacingModeSchema>;

export type SceneBrief = z.infer<typeof sceneBriefSchema>;
/** Brief shape before Zod applies defaults — what the form collects. */
export type SceneBriefInput = z.input<typeof sceneBriefSchema>;

export type PaletteSwatch = z.infer<typeof paletteSwatchSchema>;
export type ShotArchetype = z.infer<typeof shotArchetypeSchema>;
export type ShotBeat = z.infer<typeof shotBeatSchema>;
export type CreativeDirectory = z.infer<typeof creativeDirectorySchema>;

export type StoryboardShot = z.infer<typeof storyboardShotSchema>;
export type ShotEdit = z.infer<typeof shotEditSchema>;
export type ReadinessCheck = z.infer<typeof readinessCheckSchema>;
export type DirectorOutput = z.infer<typeof directorOutputSchema>;

export type SavedProject = z.infer<typeof savedProjectSchema>;
export type DraftEnvelope = z.infer<typeof draftEnvelopeSchema>;
export type ProjectsEnvelope = z.infer<typeof projectsEnvelopeSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;

/** Readiness band derived from the score. */
export type ReadinessBand = {
  label: string;
  min: number;
  tone: "strong" | "steady" | "caution" | "weak";
};
