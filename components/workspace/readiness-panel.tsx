import { StatusPill } from "@/components/shared/status-pill";
import { readinessBandFor } from "@/lib/constants";
import type { DirectorOutput, ReadinessBand } from "@/types";
import { cn } from "@/lib/utils";

const TONE_COLOUR: Record<ReadinessBand["tone"], string> = {
  strong: "var(--fp-success)",
  steady: "var(--fp-accent-soft)",
  caution: "var(--fp-warning)",
  weak: "var(--fp-danger)",
};

/** Score dial drawn with a conic gradient — no charting dependency. */
function ScoreDial({ score, band }: { score: number; band: ReadinessBand }) {
  const colour = TONE_COLOUR[band.tone];
  return (
    <div className="flex items-center gap-4">
      <div
        role="img"
        aria-label={`Production readiness ${score} out of 100. ${band.label}.`}
        className="relative grid size-20 shrink-0 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${colour} ${score * 3.6}deg, var(--fp-hairline) ${score * 3.6}deg)`,
        }}
      >
        <span className="grid size-[4.1rem] place-items-center rounded-full bg-surface">
          <span className="font-mono text-xl font-medium text-ink">{score}</span>
        </span>
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: colour }}>
          {band.label}
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          {score} of 100 across eight production checks.
        </p>
      </div>
    </div>
  );
}

export function ReadinessPanel({ output }: { output: DirectorOutput }) {
  const band = readinessBandFor(output.readinessScore);

  return (
    <section
      aria-labelledby="readiness-heading"
      className="rounded-lg border border-hairline bg-surface/60 p-5"
    >
      <h2
        id="readiness-heading"
        className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-faint"
      >
        Production readiness
      </h2>

      <div className="mt-4">
        <ScoreDial score={output.readinessScore} band={band} />
      </div>

      <ul className="mt-5 divide-y divide-hairline border-t border-hairline">
        {output.readinessChecks.map((check) => (
          <li key={check.id} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.82rem] font-medium text-ink">{check.label}</p>
                <p className="mt-1 text-xs leading-snug text-ink-muted">{check.detail}</p>
                {check.suggestion ? (
                  <p
                    className={cn(
                      "mt-1.5 text-xs leading-snug",
                      check.status === "fail" ? "text-signal-danger" : "text-signal-warning",
                    )}
                  >
                    {check.suggestion}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusPill status={check.status} />
                <span className="font-mono text-[0.65rem] text-ink-faint">{check.weight} pts</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
