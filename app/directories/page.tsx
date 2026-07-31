import type { Metadata } from "next";

import { DirectoryCard } from "@/components/landing/directory-card";
import { DirectionCanvas } from "@/components/shared/direction-canvas";
import { SectionHeading } from "@/components/shared/section-heading";
import { CREATIVE_DIRECTORIES } from "@/data/directories";
import { directionAttr, directoryTheme } from "@/lib/directory-theme";

export const metadata: Metadata = {
  title: "Creative directions",
  description:
    "The four original creative directions FramePilot directs with, including camera grammar, lighting rules, sound signature, and shot structure.",
};

export default function DirectoriesPage() {
  return (
    <div className="mx-auto w-full max-w-[88rem] px-5 py-14 sm:px-8">
      <SectionHeading
        as="h1"
        eyebrow="Reference"
        title="The four creative directions"
        description="Each direction is a small ruleset: how the camera behaves, where the light comes from, what the sound does, and how the shots are ordered. All original, with no reference to existing work."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {CREATIVE_DIRECTORIES.map((directory) => {
          const theme = directoryTheme(directory.id);
          return (
            <section
              key={directory.id}
              {...directionAttr(directory.id)}
              aria-labelledby={`treatment-${directory.id}`}
              className="flex flex-col gap-4"
            >
              {/* Treatment header: the direction's atmosphere, stated visually. */}
              <div className="fp-panel relative h-28 overflow-hidden">
                <DirectionCanvas seed={directory.name.length} />
                <div className="absolute inset-0 flex items-end justify-between gap-3 p-4">
                  <div>
                    <p className="fp-slate text-[0.6rem] uppercase tracking-slate">
                      Treatment · {theme.label}
                    </p>
                    <h2
                      id={`treatment-${directory.id}`}
                      className="mt-1 text-lg font-semibold text-ink"
                    >
                      {directory.name}
                    </h2>
                  </div>
                  <ul className="flex items-center gap-1.5">
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
                </div>
              </div>

              <DirectoryCard directory={directory} showPrinciples={false} />

              <div className="fp-panel grid gap-5 p-5 sm:grid-cols-2">
                {(
                  [
                    ["Working principles", directory.principles],
                    ["Camera grammar", directory.cameraGrammar],
                    ["Lighting rules", directory.lightingRules],
                    ["Composition", directory.compositionRules],
                    ["Sound signature", directory.soundSignature],
                    ["Transitions", directory.transitionVocabulary],
                  ] as const
                ).map(([label, items]) => (
                  <div key={label}>
                    <h4 className="flex items-center gap-2 text-[0.65rem] font-medium uppercase tracking-slate text-ink-faint">
                      <span aria-hidden className="h-px w-3 bg-dir" />
                      {label}
                    </h4>
                    <ul className="mt-2 space-y-1.5">
                      {items.map((item) => (
                        <li key={item} className="text-[0.82rem] leading-snug text-ink-muted">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
