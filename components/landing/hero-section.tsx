import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { CraftRail } from "@/components/landing/craft-rail";
import { HeroShowreel } from "@/components/landing/hero-showreel";
import { KineticPhrase, KineticText } from "@/components/shared/kinetic-text";
import { MagneticCta } from "@/components/shared/magnetic-cta";
import { StaggerGroup, StaggerItem } from "@/components/shared/stagger";
import { Button } from "@/components/ui/button";

const PROOF = [
  { value: "3–5", label: "shots per plan" },
  { value: "8 / 15 / 30s", label: "exact runtimes" },
  { value: "100", label: "point readiness score" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-hairline/70">
      <div aria-hidden className="fp-atmosphere" />
      <div aria-hidden className="fp-grid-weave" />

      <div className="relative mx-auto grid w-full max-w-[88rem] gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-14">
        <StaggerGroup inView={false} className="space-y-5" stagger={0.07}>
          <StaggerItem>
            <p className="inline-flex items-center gap-2 rounded-full border border-hairline-strong bg-surface/70 px-3 py-1 text-[0.68rem] uppercase tracking-slate text-brand-soft">
              <span aria-hidden className="size-1.5 rounded-full bg-brand" />
              Pre-production, not generation
            </p>
          </StaggerItem>

          <StaggerItem>
            <h1 className="text-4xl font-semibold leading-[1.04] text-ink sm:text-5xl lg:text-[3.5rem]">
              {/* Phrase reveal, once per page load. Copy and structure unchanged. */}
              <KineticText>
                <KineticPhrase>Direct the scene</KineticPhrase>
                <KineticPhrase className="text-brand-soft">
                  before you generate it.
                </KineticPhrase>
              </KineticText>
            </h1>
          </StaggerItem>

          <StaggerItem>
            <p className="max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
              Describe a rough idea, pick a creative direction, and get a shot-by-shot plan a
              camera operator could follow: framing, light, sound, transitions, a master prompt,
              and the checks that tell you what is still missing.
            </p>
          </StaggerItem>

          <StaggerItem>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Magnetism is reserved for the single highest-intent action. */}
              <MagneticCta>
                <Button asChild size="lg">
                  <Link href="/create">
                    Create a scene
                    <ArrowRight aria-hidden className="fp-cta-arrow size-4" />
                  </Link>
                </Button>
              </MagneticCta>
              <Button asChild size="lg" variant="outline">
                <Link href="/directories">See the four directions</Link>
              </Button>
            </div>
          </StaggerItem>

          <StaggerItem>
            <dl className="mt-4 grid max-w-lg grid-cols-3 gap-4 border-t border-hairline pt-5">
              {PROOF.map((stat) => (
                <div key={stat.label}>
                  <dt className="font-mono text-sm text-brand-soft">{stat.value}</dt>
                  <dd className="mt-1 text-xs leading-snug text-ink-faint">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </StaggerItem>
        </StaggerGroup>

        <StaggerGroup inView={false} delay={0.12}>
          <StaggerItem y={14}>
            <HeroShowreel />
          </StaggerItem>
        </StaggerGroup>
      </div>

      <CraftRail />
    </section>
  );
}
