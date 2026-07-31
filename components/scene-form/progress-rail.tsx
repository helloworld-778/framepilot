import { cn } from "@/lib/utils";

const STEPS = [
  { id: "brief", label: "Brief" },
  { id: "direction", label: "Direction" },
  { id: "storyboard", label: "Storyboard" },
  { id: "refine", label: "Refine" },
] as const;

export type ProgressStepId = (typeof STEPS)[number]["id"];

/**
 * Where the user is in the flow. Later steps are shown as upcoming, never as
 * already completed, so the rail never overstates progress.
 */
export function ProgressRail({ current }: { current: ProgressStepId }) {
  const currentIndex = STEPS.findIndex((step) => step.id === current);

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 sm:gap-x-3">
        {STEPS.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isPast = index < currentIndex;

          return (
            <li key={step.id} className="flex items-center gap-2 sm:gap-3">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-2.5 py-1 text-[0.68rem] transition-colors",
                  isCurrent
                    ? "border-dir/60 bg-dir/12 text-ink"
                    : isPast
                      ? "border-hairline-strong bg-surface/70 text-ink-muted"
                      : "border-hairline bg-surface/40 text-ink-faint",
                )}
              >
                <span className="fp-slate text-[0.6rem]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {step.label}
                {isCurrent ? (
                  <span className="sr-only">(current step)</span>
                ) : index > currentIndex ? (
                  <span className="sr-only">(upcoming)</span>
                ) : null}
              </span>

              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "h-px w-4 sm:w-8",
                    index < currentIndex ? "bg-hairline-strong" : "bg-hairline",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
