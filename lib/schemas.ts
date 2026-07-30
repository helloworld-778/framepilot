import { z } from "zod";

/**
 * Single source of truth for every FramePilot domain shape.
 * Types are inferred from these schemas in `types/index.ts` — never re-declared.
 */

export const DIRECTORY_IDS = [
  "nonlinear-suspense",
  "whimsical-fantasy",
  "documentary-realism",
  "premium-product-film",
] as const;

export const SCENE_PURPOSES = [
  "promotion",
  "invitation",
  "awareness",
  "short-story",
] as const;

export const SCENE_DURATIONS = [8, 15, 30] as const;

export const ASPECT_RATIOS = ["9:16", "16:9", "1:1"] as const;

export const SHOT_ROLES = [
  "establish",
  "withhold",
  "fragment",
  "reveal",
  "develop",
  "detail",
  "resolve",
] as const;

export const CHECK_STATUSES = ["pass", "warn", "fail"] as const;

export const PACING_MODES = [
  "deliberate",
  "flowing",
  "observational",
  "precise",
] as const;

export const DESCRIPTION_MIN = 24;
export const DESCRIPTION_MAX = 600;

export const directoryIdSchema = z.enum(DIRECTORY_IDS);
export const scenePurposeSchema = z.enum(SCENE_PURPOSES);
export const aspectRatioSchema = z.enum(ASPECT_RATIOS);
export const shotRoleSchema = z.enum(SHOT_ROLES);
export const checkStatusSchema = z.enum(CHECK_STATUSES);
export const pacingModeSchema = z.enum(PACING_MODES);

export const sceneDurationSchema = z.union([
  z.literal(8),
  z.literal(15),
  z.literal(30),
]);

/* ------------------------------------------------------------------ *
 * Scene brief — the only user-authored shape
 * ------------------------------------------------------------------ */

export const sceneBriefSchema = z.object({
  description: z
    .string()
    .trim()
    .min(
      DESCRIPTION_MIN,
      `Describe the scene in at least ${DESCRIPTION_MIN} characters so the direction has something concrete to work with.`,
    )
    .max(DESCRIPTION_MAX, `Keep the description under ${DESCRIPTION_MAX} characters.`),
  directoryId: directoryIdSchema,
  purpose: scenePurposeSchema,
  duration: sceneDurationSchema,
  aspectRatio: aspectRatioSchema,
  primarySubject: z.string().trim().max(80, "Keep the subject under 80 characters.").default(""),
  targetAudience: z.string().trim().max(80, "Keep the audience under 80 characters.").default(""),
  onScreenText: z.string().trim().max(60, "On-screen text works best under 60 characters.").default(""),
});

/**
 * Same rules as `sceneBriefSchema`, but with no defaults applied, so the form's
 * input and output shapes are identical and React Hook Form stays simply typed.
 */
export const sceneFormSchema = sceneBriefSchema.extend({
  primarySubject: z.string().trim().max(80, "Keep the subject under 80 characters."),
  targetAudience: z.string().trim().max(80, "Keep the audience under 80 characters."),
  onScreenText: z
    .string()
    .trim()
    .max(60, "On-screen text works best under 60 characters."),
});

/* ------------------------------------------------------------------ *
 * Creative directory — curated data, validated in tests
 * ------------------------------------------------------------------ */

export const paletteSwatchSchema = z.object({
  label: z.string().min(1),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Swatch must be a 6-digit hex value."),
});

export const shotArchetypeSchema = z.object({
  role: shotRoleSchema,
  titleTemplates: z.array(z.string().min(1)).min(2),
  shotTypes: z.array(z.string().min(1)).min(2),
  cameraMoves: z.array(z.string().min(1)).min(2),
  lightingNotes: z.array(z.string().min(1)).min(2),
  compositionNotes: z.array(z.string().min(1)).min(2),
  soundNotes: z.array(z.string().min(1)).min(2),
  transitions: z.array(z.string().min(1)).min(2),
  visualTemplates: z.array(z.string().min(1)).min(2),
});

export const shotBeatSchema = z.object({
  role: shotRoleSchema,
  weight: z.number().positive(),
});

export const creativeDirectorySchema = z.object({
  id: directoryIdSchema,
  name: z.string().min(1),
  tagline: z.string().min(1),
  summary: z.string().min(1),
  pacing: pacingModeSchema,
  principles: z.array(z.string().min(1)).min(4),
  palette: z.array(paletteSwatchSchema).length(4),
  cameraGrammar: z.array(z.string().min(1)).min(3),
  lightingRules: z.array(z.string().min(1)).min(3),
  compositionRules: z.array(z.string().min(1)).min(3),
  soundSignature: z.array(z.string().min(1)).min(3),
  transitionVocabulary: z.array(z.string().min(1)).min(3),
  negativeEmphasis: z.array(z.string().min(1)).min(3),
  textureWords: z.array(z.string().min(1)).min(3),
  comfortableShotSeconds: z.object({ min: z.number().int(), max: z.number().int() }),
  rationaleTemplates: z.array(z.string().min(1)).min(2),
  titlePatterns: z.array(z.string().min(1)).min(2),
  /** One archetype per role this directory uses. */
  archetypes: z.array(shotArchetypeSchema).min(3),
  /**
   * Ordered beats per duration. Role order and weights differ by duration and
   * by directory, which is what makes the storyboards structurally distinct.
   */
  shotPlan: z
    .object({
      8: z.array(shotBeatSchema).min(3).max(5),
      15: z.array(shotBeatSchema).min(3).max(5),
      30: z.array(shotBeatSchema).min(3).max(5),
    })
    .superRefine((plan, ctx) => {
      for (const beats of Object.values(plan)) {
        const total = beats.reduce((sum, beat) => sum + beat.weight, 0);
        if (Math.abs(total - 1) > 0.001) {
          ctx.addIssue({
            code: "custom",
            message: `Beat weights must sum to 1, received ${total.toFixed(3)}.`,
          });
        }
      }
    }),
});

/* ------------------------------------------------------------------ *
 * Generated output
 * ------------------------------------------------------------------ */

export const storyboardShotSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  role: shotRoleSchema,
  title: z.string().min(1),
  durationSeconds: z.number().int().min(1),
  shotType: z.string().min(1),
  visualDirection: z.string().min(1),
  camera: z.string().min(1),
  lighting: z.string().min(1),
  composition: z.string().min(1),
  sound: z.string().min(1),
  transition: z.string().min(1),
  edited: z.boolean(),
});

/** The subset of a shot the user may edit in the workspace. */
export const shotEditSchema = z.object({
  title: z.string().trim().min(1, "A shot needs a title."),
  shotType: z.string().trim().min(1, "Shot type cannot be empty."),
  visualDirection: z.string().trim().min(1, "Visual direction cannot be empty."),
  camera: z.string().trim().min(1, "Camera direction cannot be empty."),
  lighting: z.string().trim().min(1, "Lighting direction cannot be empty."),
  composition: z.string().trim().min(1, "Composition note cannot be empty."),
  sound: z.string().trim().min(1, "Sound note cannot be empty."),
  transition: z.string().trim().min(1, "Transition cannot be empty."),
});

export const readinessCheckSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  status: checkStatusSchema,
  detail: z.string().min(1),
  suggestion: z.string().min(1).optional(),
  weight: z.number().int().positive(),
});

export const directorOutputSchema = z.object({
  schemaVersion: z.literal(1),
  projectTitle: z.string().min(1),
  logline: z.string().min(1),
  directoryId: directoryIdSchema,
  brief: sceneBriefSchema,
  creativeRationale: z.string().min(1),
  shots: z.array(storyboardShotSchema).min(3).max(5),
  masterPrompt: z.string().min(1),
  negativePrompt: z.string().min(1),
  readinessScore: z.number().int().min(0).max(100),
  readinessChecks: z.array(readinessCheckSchema).min(1),
  suggestions: z.array(z.string().min(1)),
  meta: z.object({
    generator: z.enum(["mock", "llm"]),
    generatorVersion: z.string().min(1),
    seed: z.string().min(1),
    totalDurationSeconds: z.number().int().positive(),
    createdAt: z.string().min(1),
  }),
});

/* ------------------------------------------------------------------ *
 * Persistence
 * ------------------------------------------------------------------ */

export const savedProjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  brief: sceneBriefSchema,
  output: directorOutputSchema,
});

export const draftEnvelopeSchema = z.object({
  schemaVersion: z.literal(1),
  updatedAt: z.string().min(1),
  brief: sceneBriefSchema,
  output: directorOutputSchema,
});

export const projectsEnvelopeSchema = z.object({
  schemaVersion: z.literal(1),
  projects: z.array(savedProjectSchema),
});

export const preferencesSchema = z.object({
  schemaVersion: z.literal(1),
  lastDirectoryId: directoryIdSchema.optional(),
  lastAspectRatio: aspectRatioSchema.optional(),
  lastDuration: sceneDurationSchema.optional(),
});
