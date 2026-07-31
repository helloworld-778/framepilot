import { Clapperboard } from "lucide-react";
import Link from "next/link";

import { DemoWorkspaceMenu } from "@/components/shared/demo-workspace-menu";
import { MagneticCta } from "@/components/shared/magnetic-cta";
import {
  NavLink,
  ProjectsNavLink,
  WorkspaceNavLink,
} from "@/components/shared/workspace-nav-link";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/80 bg-canvas/85 backdrop-blur-[6px]">
      {/* Hairline light leak along the top edge. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent"
      />

      <div className="mx-auto flex h-16 w-full max-w-[88rem] items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <span className="flex size-8 items-center justify-center rounded-md border border-hairline-strong bg-surface-lifted text-brand-soft shadow-[inset_0_1px_0_0_rgb(255_255_255/0.06)] transition-colors group-hover:border-brand/50">
            <Clapperboard aria-hidden className="size-4" />
          </span>
          <span className="text-[0.95rem] font-semibold tracking-editorial text-ink">
            {APP_NAME}
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <nav aria-label="Main" className="flex items-center gap-0.5 sm:gap-1">
            <NavLink href="/directories" className="hidden sm:inline-flex">
              Directions
            </NavLink>
            <WorkspaceNavLink />
            <ProjectsNavLink />
          </nav>

          <span aria-hidden className="hidden h-5 w-px bg-hairline sm:block" />

          <DemoWorkspaceMenu />

          <MagneticCta>
            <Button asChild size="sm">
              <Link href="/create">
                <span className="sm:hidden">Create</span>
                <span className="hidden sm:inline">Create a scene</span>
              </Link>
            </Button>
          </MagneticCta>
        </div>
      </div>
    </header>
  );
}
