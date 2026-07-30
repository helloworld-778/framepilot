import type { AspectRatio, ScenePurpose } from "@/types";

/** Always excluded, for every brief. Ordered so the IP terms read first. */
export const NEGATIVE_PROMPT_BASE: string[] = [
  "no logos",
  "no brand marks",
  "no recognisable trademarks",
  "no celebrity likeness",
  "no copyrighted characters",
  "no watermark",
  "no signature or credit overlay",
  "no garbled on-screen text",
  "no extra fingers or distorted hands",
  "no melted or warped faces",
  "no duplicated subjects",
  "no plastic skin texture",
  "no oversaturated HDR look",
  "no heavy vignette",
  "no motion smearing",
  "no compression artefacts",
];

/** Added when the brief carries a specific job to do. */
export const NEGATIVE_PROMPT_BY_PURPOSE: Record<ScenePurpose, string[]> = {
  promotion: [
    "no price stickers or sale badges",
    "no crowded product clutter",
    "no stock-photo posing",
  ],
  invitation: [
    "no unreadable dense text blocks",
    "no generic confetti overlays",
    "no empty venue with no sense of occasion",
  ],
  awareness: [
    "no shock imagery",
    "no shaming or accusatory framing",
    "no staged poverty aesthetics",
  ],
  "short-story": [
    "no expository captions",
    "no ambiguous staging that hides the action",
    "no unmotivated slow motion",
  ],
};

/** Framing mistakes specific to each delivery ratio. */
export const NEGATIVE_PROMPT_BY_ASPECT: Record<AspectRatio, string[]> = {
  "9:16": ["no important detail in the outer 8% of frame", "no letterboxed bars"],
  "16:9": ["no cropped subject heads", "no pillarboxed bars"],
  "1:1": ["no off-centre drift out of the square", "no cropped on-screen text"],
};
