import type { Metadata } from "next";

import { DirectoryCard } from "@/components/landing/directory-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { CREATIVE_DIRECTORIES } from "@/data/directories";

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

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {CREATIVE_DIRECTORIES.map((directory) => (
          <div key={directory.id} className="flex flex-col gap-4">
            <DirectoryCard directory={directory} showPrinciples={false} />

            <div className="grid gap-4 rounded-lg border border-hairline bg-surface/40 p-5 sm:grid-cols-2">
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
                  <h4 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-faint">
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
          </div>
        ))}
      </div>
    </div>
  );
}

