import {
  BANNED_REFERENCE_PATTERNS,
  type ReferenceTier,
} from "@/data/banned-references";
import type { DirectorOutput } from "@/types";

export interface ReferenceHit {
  id: string;
  tier: ReferenceTier;
  guidance: string;
  matched: string;
}

/**
 * Scan free text for borrowed-style requests and protected-property references.
 * Used both on the user's brief (readiness check) and across generated output
 * (test sweep).
 */
export function scanForBannedReferences(text: string): ReferenceHit[] {
  if (!text) {
    return [];
  }
  const hits: ReferenceHit[] = [];
  for (const entry of BANNED_REFERENCE_PATTERNS) {
    const match = entry.pattern.exec(text);
    if (match) {
      hits.push({
        id: entry.id,
        tier: entry.tier,
        guidance: entry.guidance,
        matched: match[0],
      });
    }
  }
  return hits;
}

/**
 * Every generated string that a user reads as creative direction.
 * `negativePrompt` is excluded on purpose — listing what to exclude is its job,
 * so terms like "no brand marks" belong there.
 */
export function collectGeneratedCreativeText(output: DirectorOutput): string[] {
  return [
    output.projectTitle,
    output.logline,
    output.creativeRationale,
    output.masterPrompt,
    ...output.suggestions,
    ...output.readinessChecks.flatMap((check) => [
      check.label,
      check.detail,
      check.suggestion ?? "",
    ]),
    ...output.shots.flatMap((shot) => [
      shot.title,
      shot.shotType,
      shot.visualDirection,
      shot.camera,
      shot.lighting,
      shot.composition,
      shot.sound,
      shot.transition,
    ]),
  ].filter((value) => value.length > 0);
}
