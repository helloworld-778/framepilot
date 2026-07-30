import { extractSignals } from "@/lib/brief-signals";
import { PREFERRED_ASPECTS } from "@/lib/constants";
import { scanForBannedReferences } from "@/lib/ip-safety";
import type {
  CheckStatus,
  CreativeDirectory,
  ReadinessCheck,
  SceneBrief,
  StoryboardShot,
} from "@/types";

export interface ReadinessResult {
  score: number;
  checks: ReadinessCheck[];
  suggestions: string[];
}

const STATUS_FACTOR: Record<CheckStatus, number> = {
  pass: 1,
  warn: 0.5,
  fail: 0,
};

const DIRECTION_FIELDS = [
  "shotType",
  "visualDirection",
  "camera",
  "lighting",
  "composition",
  "sound",
  "transition",
] as const;

const THIN_FIELD_LENGTH = 12;

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Production-readiness rubric. Weights sum to 100 and every non-pass check
 * carries a specific, actionable suggestion — no generic "add more detail".
 */
export function evaluateReadiness(
  brief: SceneBrief,
  shots: StoryboardShot[],
  directory: CreativeDirectory,
): ReadinessResult {
  const signals = extractSignals(brief, directory);
  const checks: ReadinessCheck[] = [];

  /* 1. Scene specificity — 20 */
  const descriptionWords = countWords(brief.description);
  const concrete = signals.hasConcreteAction && signals.hasConcreteNoun;
  checks.push(
    (() => {
      if (descriptionWords >= 18 && concrete) {
        return {
          id: "scene-specificity",
          label: "Scene specificity",
          status: "pass" as CheckStatus,
          detail: `${descriptionWords} words with a concrete subject and an action the camera can see.`,
          weight: 20,
        };
      }
      if (descriptionWords >= 10) {
        return {
          id: "scene-specificity",
          label: "Scene specificity",
          status: "warn" as CheckStatus,
          detail: concrete
            ? `${descriptionWords} words — enough to work with, but thin for a full sequence.`
            : `${descriptionWords} words, and no physical action the camera could film.`,
          suggestion:
            "Add one thing that physically happens — a pour, a hand pressing cloth, a shutter coming down — plus the surface it happens on.",
          weight: 20,
        };
      }
      return {
        id: "scene-specificity",
        label: "Scene specificity",
        status: "fail" as CheckStatus,
        detail: `${descriptionWords} words. There is not enough here to direct from.`,
        suggestion:
          "Write two sentences: where this happens, and what physically moves in the frame.",
        weight: 20,
      };
    })(),
  );

  /* 2. Subject clarity — 15 */
  const subjectWords = countWords(brief.primarySubject);
  checks.push({
    id: "subject-clarity",
    label: "Subject clarity",
    status: subjectWords >= 2 ? "pass" : subjectWords === 1 ? "warn" : "fail",
    detail:
      subjectWords >= 2
        ? `Primary subject named: ${brief.primarySubject}.`
        : subjectWords === 1
          ? `"${brief.primarySubject}" is a single word, so framing decisions stay guesswork.`
          : "No primary subject given, so the generator has to choose what the shot is about.",
    suggestion:
      subjectWords >= 2
        ? undefined
        : "Name the subject the way you would to a camera operator, for example \"hand block-printed cloth\" rather than \"cloth\".",
    weight: 15,
  });

  /* 3. Audience defined — 10 */
  const audienceWords = countWords(brief.targetAudience);
  checks.push({
    id: "audience-defined",
    label: "Audience defined",
    status: audienceWords >= 2 ? "pass" : audienceWords === 1 ? "warn" : "fail",
    detail:
      audienceWords >= 2
        ? `Written for ${brief.targetAudience}.`
        : audienceWords === 1
          ? "The audience is one word, which is not enough to set tone."
          : "No audience given, so tone and pacing default to the directory.",
    suggestion:
      audienceWords >= 2
        ? undefined
        : "Say who this is for in a short phrase, for example \"evening shoppers near the market\".",
    weight: 10,
  });

  /* 4. Duration and shot fit — 15 */
  const totalShotSeconds = shots.reduce((sum, shot) => sum + shot.durationSeconds, 0);
  const averageShot = shots.length > 0 ? totalShotSeconds / shots.length : 0;
  const comfortable =
    averageShot >= directory.comfortableShotSeconds.min &&
    averageShot <= directory.comfortableShotSeconds.max;
  const durationExact = totalShotSeconds === brief.duration;
  checks.push({
    id: "duration-fit",
    label: "Duration and shot fit",
    status: durationExact ? (comfortable ? "pass" : "warn") : "fail",
    detail: durationExact
      ? `${shots.length} shots totalling ${totalShotSeconds}s, averaging ${averageShot.toFixed(1)}s per shot.`
      : `Shot lengths total ${totalShotSeconds}s against a ${brief.duration}s target.`,
    suggestion: durationExact
      ? comfortable
        ? undefined
        : `${directory.name} reads best between ${directory.comfortableShotSeconds.min}s and ${directory.comfortableShotSeconds.max}s per shot. Try a longer total runtime, or accept a faster cut than the direction wants.`
      : "Regenerate the sequence so the shot lengths add back up to the chosen runtime.",
    weight: 15,
  });

  /* 5. Format fit for purpose — 10 */
  const preferred = PREFERRED_ASPECTS[brief.purpose];
  const aspectFits = preferred.includes(brief.aspectRatio);
  checks.push({
    id: "format-fit",
    label: "Format fit for purpose",
    status: aspectFits ? "pass" : "warn",
    detail: aspectFits
      ? `${brief.aspectRatio} suits a ${brief.purpose.replace("-", " ")} cut.`
      : `${brief.aspectRatio} is unusual for a ${brief.purpose.replace("-", " ")} cut.`,
    suggestion: aspectFits
      ? undefined
      : `Most ${brief.purpose.replace("-", " ")} work lands better at ${preferred.join(" or ")}. Keep ${brief.aspectRatio} only if you know where it is being placed.`,
    weight: 10,
  });

  /* 6. On-screen text discipline — 10 */
  const textWords = countWords(brief.onScreenText);
  checks.push(
    (() => {
      if (textWords === 0) {
        const wantsText = brief.purpose === "promotion" || brief.purpose === "invitation";
        return {
          id: "onscreen-text",
          label: "On-screen text discipline",
          status: (wantsText ? "warn" : "pass") as CheckStatus,
          detail: wantsText
            ? "No on-screen text, and this cut is asking the viewer to act."
            : "No on-screen text, which suits a cut that carries itself.",
          suggestion: wantsText
            ? "Add a short line with the offer or the time and place — under eight words so it survives a small screen."
            : undefined,
          weight: 10,
        };
      }
      if (textWords > 14) {
        return {
          id: "onscreen-text",
          label: "On-screen text discipline",
          status: "fail" as CheckStatus,
          detail: `${textWords} words of on-screen text will not be readable at this length.`,
          suggestion: "Cut it to one line of eight words or fewer and let the visuals carry the rest.",
          weight: 10,
        };
      }
      if (textWords > 8) {
        return {
          id: "onscreen-text",
          label: "On-screen text discipline",
          status: "warn" as CheckStatus,
          detail: `${textWords} words is long for on-screen text at ${brief.aspectRatio}.`,
          suggestion: "Trim to eight words or fewer, or split it across two shots.",
          weight: 10,
        };
      }
      return {
        id: "onscreen-text",
        label: "On-screen text discipline",
        status: "pass" as CheckStatus,
        detail: `${textWords} words — short enough to read on a phone.`,
        weight: 10,
      };
    })(),
  );

  /* 7. Direction coverage — 10 */
  const emptyFields: string[] = [];
  const thinFields: string[] = [];
  for (const shot of shots) {
    for (const field of DIRECTION_FIELDS) {
      const value = shot[field].trim();
      if (value.length === 0) {
        emptyFields.push(`shot ${shot.order} ${field}`);
      } else if (value.length < THIN_FIELD_LENGTH) {
        thinFields.push(`shot ${shot.order} ${field}`);
      }
    }
  }
  checks.push({
    id: "direction-coverage",
    label: "Direction coverage",
    status: emptyFields.length > 0 ? "fail" : thinFields.length > 0 ? "warn" : "pass",
    detail:
      emptyFields.length > 0
        ? `Missing direction: ${emptyFields.slice(0, 3).join(", ")}.`
        : thinFields.length > 0
          ? `Very short direction on ${thinFields.slice(0, 3).join(", ")}.`
          : `All ${shots.length} shots carry camera, lighting, composition, sound, and transition notes.`,
    suggestion:
      emptyFields.length > 0
        ? "Fill the empty fields back in — a generator will invent something worse than you would."
        : thinFields.length > 0
          ? "Expand the short fields into a full instruction so the intent survives handoff."
          : undefined,
    weight: 10,
  });

  /* 8. Originality and IP safety — 10 */
  const referenceHits = scanForBannedReferences(
    `${brief.description} ${brief.primarySubject} ${brief.onScreenText}`,
  );
  const hardHit = referenceHits.find((hit) => hit.tier === "hard");
  const softHit = referenceHits.find((hit) => hit.tier === "soft");
  checks.push({
    id: "ip-safety",
    label: "Originality and IP safety",
    status: hardHit ? "fail" : softHit ? "warn" : "pass",
    detail: hardHit
      ? `The brief points at existing work ("${hardHit.matched}").`
      : softHit
        ? `"${softHit.matched}" is shorthand rather than direction.`
        : "No borrowed styles or protected references in the brief.",
    suggestion: hardHit?.guidance ?? softHit?.guidance,
    weight: 10,
  });

  const score = Math.round(
    checks.reduce((total, check) => total + check.weight * STATUS_FACTOR[check.status], 0),
  );

  const suggestions = checks
    .filter((check) => check.status !== "pass" && check.suggestion)
    .map((check) => check.suggestion as string);

  return {
    score: Math.max(0, Math.min(100, score)),
    checks,
    suggestions,
  };
}
