"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary. Recovery is a real action: `reset` re-renders the
 * segment, and the brief form is always reachable as a second way out.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-24 sm:px-8">
      <div className="fp-panel relative overflow-hidden border-signal-danger/40 p-8 text-center">
        <span className="mx-auto mb-4 flex size-10 items-center justify-center rounded-md border border-signal-danger/40 bg-signal-danger/10 text-signal-danger">
          <TriangleAlert aria-hidden className="size-4" />
        </span>
        <h1 className="text-2xl font-semibold text-ink">Something broke mid-take</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
          This part of the app stopped rendering. Your saved work is untouched — it lives in this
          browser, not in the page.
        </p>

        {error.digest ? (
          <p className="mt-4 font-mono text-[0.7rem] text-ink-faint">
            Reference: {error.digest}
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" size="lg" onClick={reset}>
            <RefreshCw aria-hidden className="size-4" />
            Try again
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/create">Start a new scene</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="text-ink-muted hover:text-ink">
            <Link href="/projects">Saved projects</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

