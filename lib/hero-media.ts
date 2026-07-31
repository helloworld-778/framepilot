import type { DirectoryId } from "@/types";

/**
 * Hero media manifest.
 *
 * The mapping from creative direction to clip is explicit and static. Nothing in
 * the UI ever inspects media content to work out which clip it is looking at —
 * it reads this table. Paths point at files that already exist in
 * `public/media/hero/` and must not be renamed or moved.
 */

export interface HeroClip {
  /** WebM is offered first; MP4 is the fallback source. */
  webm: string;
  mp4: string;
  /** Short numbered label used by the showreel, e.g. "01 Suspense". */
  shortLabel: string;
  index: number;
  /** Rough loop length, shown only as a small indicator. */
  loopLabel: string;
}

export const HERO_CLIPS: Record<DirectoryId, HeroClip> = {
  "nonlinear-suspense": {
    webm: "/media/hero/suspense-loop.webm",
    mp4: "/media/hero/suspense-loop.mp4",
    shortLabel: "Suspense",
    index: 1,
    loopLabel: "05s loop",
  },
  "whimsical-fantasy": {
    webm: "/media/hero/fantasy-loop.webm",
    mp4: "/media/hero/fantasy-loop.mp4",
    shortLabel: "Fantasy",
    index: 2,
    loopLabel: "05s loop",
  },
  "documentary-realism": {
    webm: "/media/hero/realism-loop.webm",
    mp4: "/media/hero/realism-loop.mp4",
    shortLabel: "Realism",
    index: 3,
    loopLabel: "05s loop",
  },
  "premium-product-film": {
    webm: "/media/hero/product-loop.webm",
    mp4: "/media/hero/product-loop.mp4",
    shortLabel: "Product",
    index: 4,
    loopLabel: "05s loop",
  },
};

export function heroClipFor(id: DirectoryId): HeroClip {
  return HERO_CLIPS[id];
}

/** Showreel order, driven by the manifest rather than object key order. */
export const HERO_SHOWREEL_ORDER: DirectoryId[] = (
  Object.keys(HERO_CLIPS) as DirectoryId[]
).sort((a, b) => HERO_CLIPS[a].index - HERO_CLIPS[b].index);

/** "01 Suspense" — zero-padded, so the reel reads like a contact sheet. */
export function heroFrameLabel(id: DirectoryId): string {
  const clip = HERO_CLIPS[id];
  return `${String(clip.index).padStart(2, "0")} ${clip.shortLabel}`;
}
