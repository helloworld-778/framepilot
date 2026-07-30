import {
  NEGATIVE_PROMPT_BASE,
  NEGATIVE_PROMPT_BY_ASPECT,
  NEGATIVE_PROMPT_BY_PURPOSE,
} from "@/data/negative-prompt-base";
import type { BriefSignals } from "@/lib/brief-signals";
import { PURPOSE_LABELS } from "@/lib/constants";
import type { Rng } from "@/lib/prng";
import type {
  CreativeDirectory,
  SceneBrief,
  StoryboardShot,
} from "@/types";

export interface TemplateSlots {
  subject: string;
  setting: string;
  texture: string;
  action: string;
  audience: string;
  text: string;
}

const SLOT_PATTERN = /\{(subject|setting|texture|action|audience|text)\}/g;

export function fillTemplate(template: string, slots: TemplateSlots): string {
  return template.replace(SLOT_PATTERN, (_match, key: keyof TemplateSlots) => slots[key]);
}

export function sentenceCase(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function composeProjectTitle(
  directory: CreativeDirectory,
  slots: TemplateSlots,
  rng: Rng,
): string {
  const pattern = rng.pick(directory.titlePatterns);
  return sentenceCase(fillTemplate(pattern, slots));
}

const DURATION_WORDS: Record<number, string> = {
  8: "Eight seconds",
  15: "Fifteen seconds",
  30: "Thirty seconds",
};

export function composeLogline(
  brief: SceneBrief,
  directory: CreativeDirectory,
  slots: TemplateSlots,
  shotCount: number,
  rng: Rng,
): string {
  const durationWord = DURATION_WORDS[brief.duration] ?? `${brief.duration} seconds`;
  const purpose = PURPOSE_LABELS[brief.purpose].toLowerCase();
  const options = [
    `${durationWord}, ${shotCount} shots: ${slots.subject} in ${slots.setting}, cut as ${purpose} with ${directory.pacing} pacing.`,
    `A ${brief.duration}-second ${purpose} cut — ${slots.subject} in ${slots.setting}, built across ${shotCount} shots at ${brief.aspectRatio}.`,
    `${durationWord} of ${directory.pacing} direction: ${shotCount} shots on ${slots.subject}, shot in ${slots.setting}.`,
  ];
  return sentenceCase(rng.pick(options));
}

export function composeRationale(
  directory: CreativeDirectory,
  slots: TemplateSlots,
  rng: Rng,
): string {
  return fillTemplate(rng.pick(directory.rationaleTemplates), slots);
}

/**
 * A single copyable block. Structured labels beat prose here: generators parse
 * them more reliably, and a human can scan the sequence at a glance.
 */
export function composeMasterPrompt(
  brief: SceneBrief,
  directory: CreativeDirectory,
  signals: BriefSignals,
  shots: StoryboardShot[],
  slots: TemplateSlots,
): string {
  const sequence = shots
    .map(
      (shot) =>
        `  ${shot.order}. [${shot.durationSeconds}s] ${shot.shotType} — ${shot.visualDirection} Camera: ${shot.camera}. Light: ${shot.lighting}.`,
    )
    .join("\n");

  const palette = directory.palette
    .map((swatch) => `${swatch.label} ${swatch.hex}`)
    .join(", ");

  const onScreenText =
    brief.onScreenText.trim().length > 0
      ? `"${brief.onScreenText.trim()}"`
      : "none — leave clean negative space in the final shot";

  return [
    `DIRECTION: ${directory.name} — ${directory.tagline}`,
    `SUBJECT: ${slots.subject}`,
    `SETTING: ${slots.setting}${signals.interiority !== "unspecified" ? ` (${signals.interiority})` : ""}`,
    `AUDIENCE: ${slots.audience}`,
    `SEQUENCE (${shots.length} shots, ${brief.duration}s total):`,
    sequence,
    `CAMERA: ${directory.cameraGrammar.join("; ")}`,
    `LIGHTING: ${directory.lightingRules.join("; ")}`,
    `COMPOSITION: ${directory.compositionRules.join("; ")}`,
    `PALETTE: ${palette}`,
    `TEXTURE: ${signals.textures.slice(0, 4).join(", ")}`,
    `SOUND: ${directory.soundSignature.join("; ")}`,
    `TRANSITIONS: ${directory.transitionVocabulary.join("; ")}`,
    `ON-SCREEN TEXT: ${onScreenText}`,
    `FORMAT: ${brief.aspectRatio} aspect ratio, ${brief.duration}s total runtime, 24fps feel`,
    `RULES: ${directory.principles.join(" ")}`,
  ].join("\n");
}

export function composeNegativePrompt(
  brief: SceneBrief,
  directory: CreativeDirectory,
): string {
  const terms = [
    ...NEGATIVE_PROMPT_BASE,
    ...directory.negativeEmphasis,
    ...NEGATIVE_PROMPT_BY_PURPOSE[brief.purpose],
    ...NEGATIVE_PROMPT_BY_ASPECT[brief.aspectRatio],
  ];
  const deduped = terms.filter(
    (term, index, list) => list.indexOf(term) === index,
  );
  return deduped.join(", ");
}
