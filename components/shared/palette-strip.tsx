import type { PaletteSwatch } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Palette rendered as inline swatches. Colours come from directory data, so
 * they are set as inline styles rather than utility classes.
 */
export function PaletteStrip({
  palette,
  className,
}: {
  palette: PaletteSwatch[];
  className?: string;
}) {
  return (
    <ul className={cn("flex items-center gap-1.5", className)}>
      {palette.map((swatch) => (
        <li key={swatch.hex} className="flex items-center gap-1.5">
          <span
            aria-hidden
            style={{ backgroundColor: swatch.hex }}
            className="size-3.5 rounded-[3px] ring-1 ring-inset ring-white/10"
          />
          <span className="sr-only">{`${swatch.label} ${swatch.hex}`}</span>
        </li>
      ))}
    </ul>
  );
}
