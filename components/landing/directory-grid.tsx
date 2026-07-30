import { CREATIVE_DIRECTORIES } from "@/data/directories";
import { DirectoryCard } from "@/components/landing/directory-card";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";

export function DirectoryGrid() {
  return (
    <section
      id="directions"
      className="border-y border-hairline/70 bg-surface-sunken/40 py-16"
    >
      <div className="mx-auto w-full max-w-[88rem] px-5 sm:px-8">
        <SectionHeading
          eyebrow="Creative directions"
          title="Four directions, four different films"
          description="Each direction carries its own shot structure, not just a different set of adjectives. The same brief produces a genuinely different sequence in each one."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CREATIVE_DIRECTORIES.map((directory, index) => (
            <Reveal key={directory.id} delay={index * 0.06} className="h-full">
              <DirectoryCard directory={directory} className="h-full" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
