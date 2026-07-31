"use client";

import { useEffect, useRef, useState } from "react";

import { DirectionCanvas } from "@/components/shared/direction-canvas";
import { directionAttr } from "@/lib/directory-theme";
import { heroClipFor, heroFrameLabel } from "@/lib/hero-media";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import type { DirectoryId } from "@/types";
import { cn } from "@/lib/utils";

/**
 * One frame of the hero showreel.
 *
 * The clip comes from the static manifest — nothing here inspects media content.
 * Three states are handled explicitly:
 *   - motion allowed  → muted, looping, inline autoplay
 *   - reduced motion  → the same element with autoplay and loop off, so it rests
 *                       on its opening frame, over the CSS canvas
 *   - load failure    → CSS canvas only, never a broken player or controls
 */
export function HeroVideoFrame({
  directoryId,
  caption,
  className,
  showLoopLabel = true,
}: {
  directoryId: DirectoryId;
  caption: string;
  className?: string;
  showLoopLabel?: boolean;
}) {
  const clip = heroClipFor(directoryId);
  const reducedMotion = usePrefersReducedMotion();
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const label = heroFrameLabel(directoryId);

  /**
   * The server cannot know the motion preference, so the markup ships with
   * autoplay and this syncs the media element once the preference is known:
   * paused on its opening frame for reduced-motion users, playing otherwise.
   */
  useEffect(() => {
    const element = videoRef.current;
    if (!element) {
      return;
    }
    if (reducedMotion) {
      element.pause();
      try {
        element.currentTime = 0;
      } catch {
        // Seeking can throw before metadata loads; the paused frame is enough.
      }
      return;
    }
    // `play()` returns void in some engines, so the promise is optional.
    const played: unknown = element.play();
    if (played instanceof Promise) {
      played.catch(() => {
        // Autoplay can be refused; the CSS canvas underneath still reads as a frame.
      });
    }
  }, [reducedMotion]);

  return (
    <figure
      {...directionAttr(directoryId)}
      className={cn(
        "group relative isolate overflow-hidden rounded-lg border border-hairline bg-canvas-deep",
        "transition-[border-color,box-shadow,transform] duration-300",
        "hover:border-dir/60 focus-within:border-dir/60",
        "motion-safe:hover:-translate-y-0.5",
        className,
      )}
    >
      {/* Always present: the frame never falls back to emptiness. */}
      <DirectionCanvas seed={clip.index} />

      {failed ? null : (
        <video
          ref={videoRef}
          // Decorative texture: the caption below carries the meaning.
          aria-hidden="true"
          tabIndex={-1}
          autoPlay={!reducedMotion}
          loop={!reducedMotion}
          muted
          playsInline
          preload="metadata"
          disablePictureInPicture
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100"
        >
          <source src={clip.webm} type="video/webm" />
          <source src={clip.mp4} type="video/mp4" />
        </video>
      )}

      {/* Contrast overlay so the label stays readable over any frame. */}
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-canvas-deep/92 via-canvas-deep/35 to-transparent"
      />

      {/* Accent perimeter, revealed on hover and keyboard focus. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-transparent transition-[box-shadow,--tw-ring-color] duration-300 group-hover:ring-dir/50 group-focus-within:ring-dir/50"
      />

      <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5 sm:p-3">
        <span className="min-w-0">
          <span className="fp-slate block text-[0.62rem] uppercase sm:text-[0.68rem]">
            {label}
          </span>
          <span
            className={cn(
              "mt-0.5 block truncate text-[0.68rem] leading-snug text-ink-muted",
              "opacity-0 transition-opacity duration-300",
              "group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:opacity-100",
            )}
          >
            {caption}
          </span>
        </span>
        {showLoopLabel ? (
          <span className="shrink-0 rounded-full border border-hairline-strong/80 bg-canvas-deep/70 px-1.5 py-0.5 font-mono text-[0.55rem] text-ink-faint">
            {clip.loopLabel}
          </span>
        ) : null}
      </figcaption>

      {/* Playhead line, animated only for users who allow motion. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-dir-soft/70 transition-transform duration-500 group-hover:scale-x-100 group-focus-within:scale-x-100 motion-reduce:hidden"
      />
    </figure>
  );
}
