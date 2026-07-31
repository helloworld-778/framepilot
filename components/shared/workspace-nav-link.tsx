"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useSyncExternalStore, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  getDraftSnapshot,
  getServerDraftSnapshot,
  parseDraftSnapshot,
  subscribeToDraft,
} from "@/lib/draft-store";
import {
  getProjectsSnapshot,
  getServerProjectsSnapshot,
  parseProjectsSnapshot,
  subscribeToProjects,
} from "@/lib/project-store";
import { cn } from "@/lib/utils";

/**
 * Header link with an active treatment: an accent underline plus
 * `aria-current="page"`, so the current section is clear visually and to
 * assistive technology.
 */
export function NavLink({
  href,
  children,
  className,
  matchPrefix,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  /** Also mark active for nested routes, e.g. /projects/[id]. */
  matchPrefix?: string;
}) {
  // `usePathname` can be null outside a route context; treat that as "not active".
  const pathname = usePathname() ?? "";
  const active =
    pathname === href || (matchPrefix ? pathname.startsWith(matchPrefix) : false);

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={cn(
        "relative text-ink-muted hover:text-ink",
        active && "text-ink",
        className,
      )}
    >
      <Link href={href} aria-current={active ? "page" : undefined}>
        {children}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-2.5 -bottom-px h-px origin-center bg-brand-soft/80 transition-transform duration-300",
            active ? "scale-x-100" : "scale-x-0",
          )}
        />
      </Link>
    </Button>
  );
}

/**
 * Workspace points at the current draft when there is one, and at the brief form
 * when there is not, so the link is never a dead end.
 */
export function WorkspaceNavLink() {
  const raw = useSyncExternalStore(
    subscribeToDraft,
    getDraftSnapshot,
    getServerDraftSnapshot,
  );
  const draft = useMemo(() => parseDraftSnapshot(raw), [raw]);
  const hasDraft = draft.status === "ok";

  return <NavLink href={hasDraft ? "/workspace" : "/create"}>Workspace</NavLink>;
}

/** Saved-project count doubles as a hint that anything is stored at all. */
export function ProjectsNavLink() {
  const raw = useSyncExternalStore(
    subscribeToProjects,
    getProjectsSnapshot,
    getServerProjectsSnapshot,
  );
  const parsed = useMemo(() => parseProjectsSnapshot(raw), [raw]);
  const count = parsed.projects.length;

  return (
    <NavLink href="/projects" matchPrefix="/projects">
      Projects
      {count > 0 ? (
        <span
          aria-hidden
          className="ml-1 rounded-full border border-hairline-strong bg-surface-raised px-1.5 py-0.5 font-mono text-[0.65rem] text-brand-soft"
        >
          {count}
        </span>
      ) : null}
      <span className="sr-only">{count > 0 ? `, ${count} saved` : ""}</span>
    </NavLink>
  );
}
