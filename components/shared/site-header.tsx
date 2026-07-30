import { Clapperboard } from "lucide-react";
import Link from "next/link";

import {
  ProjectsNavLink,
  WorkspaceNavLink,
} from "@/components/shared/workspace-nav-link";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/80 bg-canvas/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-[88rem] items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <span className="flex size-8 items-center justify-center rounded-md border border-hairline-strong bg-surface-raised text-brand-soft">
            <Clapperboard aria-hidden className="size-4" />
          </span>
          <span className="text-[0.95rem] font-semibold tracking-editorial text-ink">
            {APP_NAME}
          </span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden text-ink-muted hover:text-ink sm:inline-flex"
          >
            <Link href="/directories">Directions</Link>
          </Button>
          <WorkspaceNavLink />
          <ProjectsNavLink />
          <Button asChild size="sm">
            <Link href="/create">
              <span className="sm:hidden">Create</span>
              <span className="hidden sm:inline">Create a scene</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
