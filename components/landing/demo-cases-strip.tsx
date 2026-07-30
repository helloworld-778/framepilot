import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { DEMO_BRIEFS } from "@/data/demo-projects";
import { SectionHeading } from "@/components/shared/section-heading";
import { DIRECTORY_BY_ID } from "@/data/directories";
import { DURATION_LABELS } from "@/lib/constants";

export function DemoCasesStrip() {
  return (
    <section className="mx-auto w-full max-w-[88rem] px-5 py-16 sm:px-8">
      <SectionHeading
        eyebrow="Try it with a real case"
        title="Four briefs, one click each"
        description="Every example is original and local in scale — the kind of work this is actually for."
      />

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DEMO_BRIEFS.map((demo) => {
          const directory = DIRECTORY_BY_ID[demo.brief.directoryId];
          return (
            <li key={demo.slug} className="flex">
              <Link
                href={{ pathname: "/create", query: { demo: demo.slug } }}
                aria-label={`Open the ${demo.label} demo brief`}
                className="group flex h-full w-full flex-col justify-between rounded-lg border border-hairline bg-surface/60 p-5 transition-[color,background-color,border-color,box-shadow,transform] duration-200 hover:border-brand/60 hover:bg-surface-raised/70 hover:shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)] focus-visible:border-brand/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-safe:hover:-translate-y-0.5"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{demo.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{demo.blurb}</p>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-hairline pt-3 text-[0.7rem] text-ink-faint">
                  <span>
                    {directory.name} · {DURATION_LABELS[demo.brief.duration]} ·{" "}
                    {demo.brief.aspectRatio}
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="size-3.5 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand-soft"
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
