import { getDirectory } from "@/data/directories";
import { extractSignals } from "@/lib/brief-signals";
import { GENERATOR_VERSION } from "@/lib/constants";
import { allocateDurations } from "@/lib/duration-plan";
import { createRng } from "@/lib/prng";
import {
  composeLogline,
  composeMasterPrompt,
  composeNegativePrompt,
  composeProjectTitle,
  composeRationale,
  fillTemplate,
  sentenceCase,
  type TemplateSlots,
} from "@/lib/prompt-composer";
import { evaluateReadiness } from "@/lib/quality-check";
import { hashString, seedForBrief } from "@/lib/seed";
import type {
  CreativeDirectory,
  DirectorOutput,
  SceneBrief,
  ShotArchetype,
  StoryboardShot,
} from "@/types";

/**
 * Deterministic mock director.
 *
 * Pure by construction: no `Date`, no `Math.random`, no `window`, no network.
 * The same brief always produces the same direction, and the timestamp is
 * injected by the caller rather than read from a clock.
 */

export interface GenerateOptions {
  /** ISO timestamp recorded in `meta.createdAt`. Omit for reproducible tests. */
  now?: string;
}

/** Stable placeholder so output stays comparable when no clock is supplied. */
const FIXED_TIMESTAMP = "1970-01-01T00:00:00.000Z";

function archetypeFor(
  directory: CreativeDirectory,
  role: ShotArchetype["role"],
): ShotArchetype {
  const archetype = directory.archetypes.find((candidate) => candidate.role === role);
  if (!archetype) {
    throw new Error(
      `Directory "${directory.id}" has no archetype for role "${role}". Directory data is inconsistent.`,
    );
  }
  return archetype;
}

function rotate(items: string[], index: number, fallback: string): string {
  if (items.length === 0) {
    return fallback;
  }
  return items[index % items.length] ?? fallback;
}

export function generateMockDirection(
  brief: SceneBrief,
  options: GenerateOptions = {},
): DirectorOutput {
  const directory = getDirectory(brief.directoryId);
  const seed = seedForBrief(brief);
  const signals = extractSignals(brief, directory);

  const beats = directory.shotPlan[brief.duration];
  const durations = allocateDurations(
    brief.duration,
    beats.map((beat) => beat.weight),
  );

  const shots: StoryboardShot[] = beats.map((beat, index) => {
    const archetype = archetypeFor(directory, beat.role);
    // A per-shot stream keeps each shot's choices stable and independent.
    const rng = createRng(hashString(`${seed}:${index}:${beat.role}`));

    const slots: TemplateSlots = {
      subject: signals.subject,
      setting: signals.setting,
      texture: rotate(signals.textures, index, "the surface in frame"),
      action: rotate(signals.actions, index, "holding still while the light changes"),
      audience: signals.audience,
      text: signals.onScreenText,
    };

    return {
      id: `${seed}-s${index + 1}`,
      order: index + 1,
      role: beat.role,
      title: sentenceCase(fillTemplate(rng.pick(archetype.titleTemplates), slots)),
      durationSeconds: durations[index] ?? 1,
      shotType: rng.pick(archetype.shotTypes),
      visualDirection: sentenceCase(fillTemplate(rng.pick(archetype.visualTemplates), slots)),
      camera: rng.pick(archetype.cameraMoves),
      lighting: rng.pick(archetype.lightingNotes),
      composition: rng.pick(archetype.compositionNotes),
      sound: rng.pick(archetype.soundNotes),
      transition: rng.pick(archetype.transitions),
      edited: false,
    };
  });

  const metaRng = createRng(hashString(`${seed}:meta`));
  const slots: TemplateSlots = {
    subject: signals.subject,
    setting: signals.setting,
    texture: rotate(signals.textures, 0, "the surface in frame"),
    action: rotate(signals.actions, 0, "holding still while the light changes"),
    audience: signals.audience,
    text: signals.onScreenText,
  };

  const readiness = evaluateReadiness(brief, shots, directory);

  return {
    schemaVersion: 1,
    projectTitle: composeProjectTitle(directory, slots, metaRng),
    logline: composeLogline(brief, directory, slots, shots.length, metaRng),
    directoryId: directory.id,
    brief,
    creativeRationale: composeRationale(directory, slots, metaRng),
    shots,
    masterPrompt: composeMasterPrompt(brief, directory, signals, shots, slots),
    negativePrompt: composeNegativePrompt(brief, directory),
    readinessScore: readiness.score,
    readinessChecks: readiness.checks,
    suggestions: readiness.suggestions,
    meta: {
      generator: "mock",
      generatorVersion: GENERATOR_VERSION,
      seed,
      totalDurationSeconds: shots.reduce((sum, shot) => sum + shot.durationSeconds, 0),
      createdAt: options.now ?? FIXED_TIMESTAMP,
    },
  };
}
