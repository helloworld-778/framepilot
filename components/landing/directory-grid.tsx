import { DirectoryCard } from "@/components/landing/directory-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { StaggerGroup, StaggerItem } from "@/components/shared/stagger";
import { CREATIVE_DIRECTORIES } from "@/data/directories";

export function DirectoryGrid() {
  return (
    <section
      id="directions"
      className="relative overflow-hidden border-y border-hairline/70 bg-canvas-deep/50 py-16"
    >
      <div aria-hidden className="fp-grid-weave opacity-40" />

      <div className="relative mx-auto w-full max-w-[88rem] px-5 sm:px-8">
        <SectionHeading
          eyebrow="Creative directions"
          title="Four directions, four different films"
          description="Each direction carries its own shot structure, not just a different set of adjectives. The same brief produces a genuinely different sequence in each one."
        />

        <StaggerGroup
          className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          stagger={0.07}
        >
          {CREATIVE_DIRECTORIES.map((directory) => (
            <StaggerItem key={directory.id} className="h-full">
              <DirectoryCard directory={directory} className="h-full" />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
