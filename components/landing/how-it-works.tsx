import { ClipboardList, Compass, PenLine } from "lucide-react";

import { SectionHeading } from "@/components/shared/section-heading";
import { StaggerGroup, StaggerItem } from "@/components/shared/stagger";

const STEPS = [
  {
    icon: PenLine,
    timecode: "00:00",
    slate: "A / BRIEF",
    title: "Write the brief",
    body: "Two sentences about what happens, who it is for, and how long it runs. Nothing is uploaded.",
  },
  {
    icon: Compass,
    timecode: "00:04",
    slate: "B / DIRECTION",
    title: "Choose a direction",
    body: "Four original directions, each with its own camera grammar, lighting rules, and shot structure.",
  },
  {
    icon: ClipboardList,
    timecode: "00:12",
    slate: "C / STORYBOARD",
    title: "Direct and refine",
    body: "Get a storyboard you can edit shot by shot, plus prompts and readiness checks you can act on.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-[88rem] px-5 py-16 sm:px-8">
      <SectionHeading
        eyebrow="How it works"
        title="Three steps, no model calls"
        description="FramePilot is the layer before the generator. It decides what the shots are, then hands you a prompt worth pasting."
      />

      <StaggerGroup className="mt-10 grid gap-4 md:grid-cols-3" stagger={0.08}>
        {STEPS.map((step, index) => (
          <StaggerItem key={step.title}>
            <article className="fp-panel fp-card-interactive group relative h-full overflow-hidden p-5">
              {/* Slate strip: the production detail that replaces a plain number. */}
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-hairline pb-3">
                <span className="fp-slate text-[0.62rem] uppercase">{step.slate}</span>
                <span className="rounded border border-hairline-strong bg-canvas-deep/70 px-1.5 py-0.5 font-mono text-[0.62rem] text-ink-faint">
                  {step.timecode}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-hairline-strong bg-surface-lifted text-brand-soft shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05)] transition-colors group-hover:border-dir/50 group-hover:text-dir-soft">
                  <step.icon aria-hidden className="size-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-medium text-ink">
                    <span className="mr-2 font-mono text-xs text-ink-faint">
                      0{index + 1}
                    </span>
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
                </div>
              </div>
            </article>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
