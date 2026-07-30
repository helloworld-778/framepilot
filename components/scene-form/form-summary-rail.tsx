"use client";

import { PaletteStrip } from "@/components/shared/palette-strip";
import { DIRECTORY_BY_ID } from "@/data/directories";
import {
  ASPECT_LABELS,
  DURATION_LABELS,
  PURPOSE_LABELS,
  SHOT_COUNT_BY_DURATION,
} from "@/lib/constants";
import type { SceneBrief } from "@/types";

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="text-right text-xs font-medium text-ink-muted">{value}</dd>
    </div>
  );
}

export function FormSummaryRail({ brief }: { brief: SceneBrief }) {
  const directory = DIRECTORY_BY_ID[brief.directoryId];
  const words = brief.description.trim().split(/\s+/).filter(Boolean).length;
  const shotCount = SHOT_COUNT_BY_DURATION[brief.duration];

  return (
    <aside
      aria-label="Brief summary"
      className="fp-edge-light rounded-lg border border-hairline bg-surface/60 p-5 lg:sticky lg:top-24"
    >
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-faint">
        This plan will be
      </p>

      <h2 className="mt-3 text-base font-medium text-ink">{directory.name}</h2>
      <p className="mt-1 text-sm text-brand-soft">{directory.tagline}</p>
      <PaletteStrip palette={directory.palette} className="mt-3" />

      <dl className="mt-5 divide-y divide-hairline border-t border-hairline">
        <LabelValue label="Purpose" value={PURPOSE_LABELS[brief.purpose]} />
        <LabelValue label="Runtime" value={DURATION_LABELS[brief.duration]} />
        <LabelValue label="Format" value={ASPECT_LABELS[brief.aspectRatio]} />
        <LabelValue label="Shots" value={`${shotCount} ordered shots`} />
        <LabelValue
          label="Description"
          value={words === 0 ? "Not written yet" : `${words} words`}
        />
        <LabelValue
          label="Subject"
          value={brief.primarySubject.trim() || "Not named yet"}
        />
      </dl>

      <p className="mt-5 border-t border-hairline pt-4 text-xs leading-relaxed text-ink-faint">
        Direction is generated locally from this brief. The same brief always produces the same
        plan, so you can iterate one field at a time.
      </p>
    </aside>
  );
}
