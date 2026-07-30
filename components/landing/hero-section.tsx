import { ArrowRight, Film } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";

/** Decorative storyboard strip, drawn entirely with CSS. No imagery. */
function StoryboardPreview() {
  const panels = [
    { label: "01 · Withhold", seconds: "4s", fill: "42%" },
    { label: "02 · Fragment", seconds: "3s", fill: "28%" },
    { label: "03 · Reveal", seconds: "5s", fill: "58%" },
    { label: "04 · Resolve", seconds: "3s", fill: "34%" },
  ];

  return (
    <div
      aria-hidden
      className="fp-edge-light rounded-xl border border-hairline bg-surface/70 p-4 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)]"
    >
      <div className="mb-3 flex items-center justify-between text-[0.7rem] text-ink-faint">
        <span className="inline-flex items-center gap-1.5">
          <Film className="size-3" /> Storyboard timeline
        </span>
        <span className="font-mono">15s · 9:16</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {panels.map((panel) => (
          <div key={panel.label} className="space-y-2">
            <div className="relative aspect-[9/13] overflow-hidden rounded-md border border-hairline bg-surface-sunken">
              <span
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand/25 to-transparent"
                style={{ height: panel.fill }}
              />
              <span className="fp-filmstrip absolute inset-x-0 top-0 h-2 opacity-60" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[0.6rem] text-ink-faint">{panel.label}</span>
              <span className="font-mono text-[0.6rem] text-brand-soft">{panel.seconds}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-hairline/70">
      <div aria-hidden className="fp-atmosphere" />
      <div aria-hidden className="fp-grid-weave" />

      <div className="relative mx-auto grid w-full max-w-[88rem] gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
        <Reveal>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-hairline-strong bg-surface/70 px-3 py-1 text-[0.7rem] uppercase tracking-[0.16em] text-brand-soft">
            Pre-production, not generation
          </p>
          <h1 className="text-4xl font-semibold leading-[1.06] text-ink sm:text-5xl lg:text-[3.4rem]">
            Direct the scene before you generate it.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            Describe a rough idea, pick a creative direction, and get a shot-by-shot plan a camera
            operator could follow: framing, light, sound, transitions, a master prompt, and the
            checks that tell you what is still missing.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/create">
                Create a scene
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/directories">See the four directions</Link>
            </Button>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-hairline pt-6 text-left">
            {[
              { value: "3–5", label: "shots per plan" },
              { value: "8 / 15 / 30s", label: "exact runtimes" },
              { value: "100", label: "point readiness score" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="font-mono text-sm text-brand-soft">{stat.value}</dt>
                <dd className="mt-1 text-xs leading-snug text-ink-faint">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={0.12}>
          <StoryboardPreview />
        </Reveal>
      </div>
    </section>
  );
}
