"use client";

import { Aperture, Lightbulb, Music4, Sparkles } from "lucide-react";

import { DirectionCanvas } from "@/components/shared/direction-canvas";
import { DIRECTORY_BY_ID } from "@/data/directories";
import {
  ASPECT_LABELS,
  DURATION_LABELS,
  PURPOSE_LABELS,
  SHOT_COUNT_BY_DURATION,
} from "@/lib/constants";
import { directionAttr, directoryTheme } from "@/lib/directory-theme";
import type { SceneBrief } from "@/types";
import { cn } from "@/lib/utils";

/** Fields that shape the direction; used for the live completeness preview. */
function completeness(brief: SceneBrief): { filled: number; total: number } {
  const checks = [
    brief.description.trim().length >= 24,
    brief.description.trim().split(/\s+/).filter(Boolean).length >= 18,
    brief.primarySubject.trim().length > 0,
    brief.targetAudience.trim().length > 0,
    brief.onScreenText.trim().length > 0,
  ];
  return { filled: checks.filter(Boolean).length, total: checks.length };
}

function SpecRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Aperture;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-2.5 py-2">
      <Icon aria-hidden className="mt-0.5 size-3.5 shrink-0 text-dir" />
      <div className="min-w-0">
        <dt className="text-[0.62rem] uppercase tracking-slate text-ink-faint">{label}</dt>
        <dd className="mt-0.5 text-[0.8rem] leading-snug text-ink-muted">{value}</dd>
      </div>
    </div>
  );
}

/**
 * Director's preview: what the chosen direction will actually do, plus how
 * complete the brief is so far. Reads only from the live form values.
 */
export function LiveMoodboard({ brief }: { brief: SceneBrief }) {
  const directory = DIRECTORY_BY_ID[brief.directoryId];
  const theme = directoryTheme(brief.directoryId);
  const { filled, total } = completeness(brief);
  const shotCount = SHOT_COUNT_BY_DURATION[brief.duration];
  const words = brief.description.trim().split(/\s+/).filter(Boolean).length;

  return (
    <aside
      {...directionAttr(brief.directoryId)}
      aria-label="Director's preview"
      className="fp-panel fp-panel-tinted relative isolate overflow-hidden lg:sticky lg:top-24"
    >
      {/* Direction-inherited atmosphere behind the panel content. */}
      <div aria-hidden className="fp-atmosphere fp-atmosphere-soft rounded-lg" />

      {/* Framing motif: a small CSS mood frame, no imagery. */}
      <div className="relative h-24 overflow-hidden rounded-t-lg border-b border-hairline">
        <DirectionCanvas seed={shotCount + brief.duration} />
        <div className="absolute inset-0 flex items-end justify-between gap-2 p-3">
          <p className="fp-slate text-[0.6rem] uppercase tracking-slate">
            Director&rsquo;s preview
          </p>
          <p className="rounded border border-hairline-strong/70 bg-canvas-deep/70 px-1.5 py-0.5 font-mono text-[0.58rem] text-ink-faint">
            {brief.aspectRatio}
          </p>
        </div>
      </div>

      <div className="p-5">
        <h2 className="text-base font-medium text-ink">{directory.name}</h2>
        <p className="mt-1 text-sm text-dir-soft">{directory.tagline}</p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-dir/40 bg-dir/10 px-2 py-0.5 text-[0.62rem] uppercase tracking-slate text-dir-soft">
            {directory.pacing}
          </span>
          {theme.moodWords.map((word) => (
            <span
              key={word}
              className="rounded-full border border-hairline-strong bg-surface/70 px-2 py-0.5 text-[0.62rem] text-ink-muted"
            >
              {word}
            </span>
          ))}
        </div>

        <ul className="mt-4 flex items-center gap-1.5">
          {directory.palette.map((swatch) => (
            <li key={swatch.hex}>
              <span
                aria-hidden
                style={{ backgroundColor: swatch.hex }}
                className="fp-swatch-glow block size-5 rounded-[5px]"
              />
              <span className="sr-only">{`${swatch.label} ${swatch.hex}`}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 divide-y divide-hairline border-t border-hairline">
          <SpecRow icon={Aperture} label="Camera" value={directory.cameraGrammar[0] ?? "—"} />
          <SpecRow icon={Lightbulb} label="Light" value={directory.lightingRules[0] ?? "—"} />
          <SpecRow icon={Music4} label="Sound" value={directory.soundSignature[0] ?? "—"} />
          <SpecRow
            icon={Sparkles}
            label="Plan"
            value={`${shotCount} shots · ${DURATION_LABELS[brief.duration]} · ${
              PURPOSE_LABELS[brief.purpose]
            } · ${ASPECT_LABELS[brief.aspectRatio]}`}
          />
        </dl>

        {/* Live completeness preview — not the readiness score, which needs a plan. */}
        <div className="mt-5 border-t border-hairline pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[0.62rem] uppercase tracking-slate text-ink-faint">
              Brief detail
            </p>
            <p className="font-mono text-xs text-dir-soft">
              {filled}/{total}
            </p>
          </div>

          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={filled}
            aria-label="Brief detail captured"
            className="mt-2 flex gap-1"
          >
            {Array.from({ length: total }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  index < filled ? "bg-dir" : "bg-hairline",
                )}
              />
            ))}
          </div>

          <p className="mt-2.5 text-xs leading-snug text-ink-faint">
            {words === 0
              ? "Describe the scene to start shaping the direction."
              : filled >= total
                ? "Enough detail for a specific, high-scoring plan."
                : "Each optional field sharpens the direction and raises the readiness score."}
          </p>
        </div>
      </div>
    </aside>
  );
}
