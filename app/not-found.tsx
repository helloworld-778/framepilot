import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-24 sm:px-8">
      <div className="fp-panel fp-panel-tinted fp-edge-light relative overflow-hidden p-8 text-center">
        <span className="mx-auto mb-4 flex size-10 items-center justify-center rounded-md border border-hairline-strong bg-surface-raised text-ink-muted">
          <Compass aria-hidden className="size-4" />
        </span>
        <p className="font-mono text-xs text-brand-soft">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">This shot is not in the plan</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
          The page you were looking for does not exist. Everything FramePilot makes starts from a
          scene brief, so that is the fastest way back.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/create">
              Create a scene
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/projects">Saved projects</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="text-ink-muted hover:text-ink">
            <Link href="/">Back to start</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

