import { getDirectory } from "@/data/directories";
import { generateMockDirection, type GenerateOptions } from "@/lib/mock-director";
import { evaluateReadiness } from "@/lib/quality-check";
import type { DirectorOutput, SceneBrief, StoryboardShot } from "@/types";

/**
 * The one seam the rest of the app is allowed to call.
 *
 * Today this delegates to the deterministic mock generator. When a server-side
 * model route replaces it, the signature and the `DirectorOutput` contract stay
 * exactly the same, so no UI or test has to change.
 */
export function generateDirection(
  brief: SceneBrief,
  options: GenerateOptions = {},
): DirectorOutput {
  return generateMockDirection(brief, options);
}

/**
 * Recompute readiness after a local shot edit. Kept here so the workspace never
 * has to know which generator produced the output.
 */
export function rescoreDirection(
  output: DirectorOutput,
  shots: StoryboardShot[],
): DirectorOutput {
  const directory = getDirectory(output.directoryId);
  const readiness = evaluateReadiness(output.brief, shots, directory);

  return {
    ...output,
    shots,
    readinessScore: readiness.score,
    readinessChecks: readiness.checks,
    suggestions: readiness.suggestions,
    meta: {
      ...output.meta,
      totalDurationSeconds: shots.reduce((sum, shot) => sum + shot.durationSeconds, 0),
    },
  };
}

export type { GenerateOptions };
