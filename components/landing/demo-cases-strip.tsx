"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { usePointerBloom } from "@/components/shared/interactive-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { StaggerGroup, StaggerItem } from "@/components/shared/stagger";
import { DIRECTORY_BY_ID } from "@/data/directories";
import { DEMO_BRIEFS } from "@/data/demo-projects";
import { directionAttr } from "@/lib/directory-theme";
import { DURATION_LABELS } from "@/lib/constants";

/** Demo briefs presented as mini production briefs, one card per case. */
export function DemoCasesStrip() {
  const bloom = usePointerBloom();

  return (
    <section className="mx-auto w-full max-w-[88rem] px-5 py-16 sm:px-8">
      <SectionHeading
        eyebrow="Try it with a real case"
        title="Four briefs, one click each"
        description="Every example is original and local in scale — the kind of work this is actually for."
      />

      <StaggerGroup
        className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        stagger={0.07}
      >
        {DEMO_BRIEFS.map((demo, index) => {
          const directory = DIRECTORY_BY_ID[demo.brief.directoryId];
          return (
            <StaggerItem key={demo.slug} className="flex h-full">
              <div {...directionAttr(demo.brief.directoryId)} className="flex w-full">
                <Link
                  href={{ pathname: "/create", query: { demo: demo.slug } }}
                  aria-label={`Open the ${demo.label} demo brief`}
                  {...bloom}
                  className="fp-panel fp-panel-tinted fp-card-interactive group flex h-full w-full flex-col justify-between overflow-hidden p-5 transition-[color,background-color,border-color,box-shadow,transform] duration-200 hover:border-brand/60 focus-visible:border-brand/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-safe:hover:-translate-y-0.5"
                >
                  {/* Scene-number motif with a short film-strip rule. */}
                  <div className="mb-4 flex items-center gap-2">
                    <span className="fp-slate rounded border border-dir/40 bg-dir/10 px-1.5 py-0.5 text-[0.6rem]">
                      SC {String(index + 1).padStart(2, "0")}
                    </span>
                    <span aria-hidden className="fp-perf h-1.5 flex-1 opacity-70" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-ink">{demo.label}</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{demo.blurb}</p>
                  </div>

                  <div className="mt-5 space-y-2 border-t border-hairline pt-3">
                    <p className="text-[0.7rem] text-dir-soft">{directory.name}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[0.68rem] text-ink-faint">
                        {DURATION_LABELS[demo.brief.duration]} · {demo.brief.aspectRatio}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-ink-muted transition-colors group-hover:text-ink">
                        Open brief
                        <ArrowRight
                          aria-hidden
                          className="fp-cta-arrow size-3.5 transition-transform group-hover:translate-x-0.5"
                        />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </section>
  );
}
