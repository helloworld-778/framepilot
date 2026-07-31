"use client";

import { HeroVideoFrame } from "@/components/shared/hero-video-frame";
import { DIRECTORY_BY_ID } from "@/data/directories";
import { HERO_SHOWREEL_ORDER } from "@/lib/hero-media";

/**
 * The living showreel: four tall frames arranged as a contact sheet, one per
 * creative direction, mapped through the static hero manifest.
 */
export function HeroShowreel() {
  return (
    <div className="fp-panel fp-panel-tinted fp-vignette relative overflow-hidden p-3 sm:p-4">
      <div aria-hidden className="fp-grid-weave opacity-30" />

      <div className="relative mb-3 flex items-center justify-between gap-3">
        <p className="fp-slate text-[0.62rem] uppercase tracking-slate">
          Showreel · four directions
        </p>
        <p className="font-mono text-[0.62rem] text-ink-faint">contact sheet</p>
      </div>

      {/* Sprocket rail: a timeline reference rather than a plain border. */}
      <div aria-hidden className="fp-perf relative mb-3 h-1.5 opacity-60" />

      <div className="relative grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-4">
        {HERO_SHOWREEL_ORDER.map((id) => {
          const directory = DIRECTORY_BY_ID[id];
          return (
            <HeroVideoFrame
              key={id}
              directoryId={id}
              caption={directory.tagline}
              className="aspect-[9/14] min-h-[9.5rem] sm:min-h-[12rem]"
            />
          );
        })}
      </div>

      <div aria-hidden className="fp-perf relative mt-3 h-1.5 opacity-60" />

      <p className="relative mt-3 text-[0.68rem] leading-snug text-ink-faint">
        Reference loops for each direction. FramePilot plans the shots — it does not
        generate the video.
      </p>
    </div>
  );
}
