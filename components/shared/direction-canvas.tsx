import { cn } from "@/lib/utils";

/**
 * Direction-aware abstract canvas, built only from gradients.
 *
 * Used as the video fallback in the showreel and as texture inside cards, so a
 * failed or unsupported clip still leaves a composed frame rather than a broken
 * media element. Inherits `--dir-*` from the nearest `data-direction` ancestor.
 */
export function DirectionCanvas({
  className,
  seed = 0,
  withVignette = true,
}: {
  className?: string;
  /** Small integer that nudges the light position, so frames are not identical. */
  seed?: number;
  withVignette?: boolean;
}) {
  const x = 26 + ((seed * 17) % 48);
  const y = 18 + ((seed * 11) % 36);
  const tilt = 150 + ((seed * 23) % 60);
  const streak = 78 + ((seed * 31) % 44);
  const massX = 18 + ((seed * 13) % 60);

  return (
    <span
      aria-hidden
      className={cn(
        "fp-mood fp-grain absolute inset-0 block",
        withVignette && "fp-mood-vignette",
        className,
      )}
      style={
        {
          "--mf-x": `${x}%`,
          "--mf-y": `${y}%`,
          "--mf-tilt": `${tilt}deg`,
          "--mf-streak": `${streak}deg`,
          "--mf-mass-x": `${massX}%`,
        } as React.CSSProperties
      }
    />
  );
}
