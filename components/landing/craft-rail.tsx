const CRAFT_WORDS = [
  "FRAME",
  "LIGHT",
  "MOTION",
  "COMPOSITION",
  "PACING",
  "SOUND",
] as const;

/**
 * Decorative vocabulary rail. It drifts slowly for users who allow motion and
 * sits still for everyone else — the CSS handles that, so there is no JS here.
 */
export function CraftRail() {
  const sequence = [...CRAFT_WORDS, ...CRAFT_WORDS];

  return (
    <div
      aria-hidden
      className="relative overflow-hidden border-y border-hairline/70 bg-canvas-deep/60 py-2.5"
    >
      <div className="fp-rail-track flex w-max items-center gap-8 whitespace-nowrap will-change-transform">
        {sequence.map((word, index) => (
          <span key={`${word}-${index}`} className="flex items-center gap-8">
            <span className="text-[0.68rem] uppercase tracking-slate text-ink-faint">
              {word}
            </span>
            <span className="size-1 rounded-full bg-brand/50" />
          </span>
        ))}
      </div>

      {/* Edge fades so the rail dissolves rather than being cut off. */}
      <span className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-canvas to-transparent" />
      <span className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-canvas to-transparent" />
    </div>
  );
}
