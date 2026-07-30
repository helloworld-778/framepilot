import { ClipboardList, Compass, PenLine } from "lucide-react";

import { SectionHeading } from "@/components/shared/section-heading";

const STEPS = [
  {
    icon: PenLine,
    title: "Write the brief",
    body: "Two sentences about what happens, who it is for, and how long it runs. Nothing is uploaded.",
  },
  {
    icon: Compass,
    title: "Choose a direction",
    body: "Four original directions, each with its own camera grammar, lighting rules, and shot structure.",
  },
  {
    icon: ClipboardList,
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

      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="rounded-lg border border-hairline bg-surface/60 p-5 transition-colors hover:border-hairline-strong"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-md border border-hairline-strong bg-surface-raised text-brand-soft">
                <step.icon aria-hidden className="size-4" />
              </span>
              <span className="font-mono text-xs text-ink-faint">0{index + 1}</span>
            </div>
            <h3 className="text-base font-medium text-ink">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
