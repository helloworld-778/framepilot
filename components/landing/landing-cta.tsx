import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { MagneticCta } from "@/components/shared/magnetic-cta";
import { Button } from "@/components/ui/button";

const CALL_SHEET = [
  { label: "Runs in", value: "This browser tab" },
  { label: "Accounts", value: "None required" },
  { label: "Model calls", value: "Zero" },
  { label: "Output", value: "Storyboard + prompt" },
];

/** Final CTA styled as a call sheet: a header strip, four rows, one action. */
export function LandingCta() {
  return (
    <section className="border-t border-hairline/70 bg-canvas-deep/50">
      <div className="mx-auto w-full max-w-[88rem] px-5 py-16 sm:px-8">
        <div className="fp-panel fp-panel-tinted fp-vignette relative overflow-hidden">
          <div aria-hidden className="fp-atmosphere opacity-60" />
          <div aria-hidden className="fp-grain absolute inset-0" />

          <div className="relative flex items-center justify-between gap-3 border-b border-hairline px-5 py-3 sm:px-7">
            <p className="fp-slate text-[0.62rem] uppercase tracking-slate">Call sheet</p>
            <p className="font-mono text-[0.62rem] text-ink-faint">FramePilot · v1</p>
          </div>

          <div className="relative grid gap-8 px-5 py-8 sm:px-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-ink sm:text-3xl">
                Bring an idea. Leave with a plan.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted sm:text-base">
                Everything runs in this browser tab. No sign-in, no uploads, no generation
                costs — just the direction work that makes generation worth doing.
              </p>
              <MagneticCta className="mt-7">
                <Button asChild size="lg">
                  <Link href="/create">
                    Create a scene
                    <ArrowRight aria-hidden className="fp-cta-arrow size-4" />
                  </Link>
                </Button>
              </MagneticCta>
            </div>

            <dl className="divide-y divide-hairline rounded-lg border border-hairline bg-canvas-deep/60">
              {CALL_SHEET.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 px-4 py-3">
                  <dt className="text-[0.7rem] uppercase tracking-slate text-ink-faint">
                    {row.label}
                  </dt>
                  <dd className="text-right text-sm text-ink-muted">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
