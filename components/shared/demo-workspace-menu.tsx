"use client";

import { ArrowRight, Compass, FolderOpen, HardDrive, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import type { ActionOutcome } from "@/components/shared/action-feedback-button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resetEverything } from "@/lib/draft-store";
import {
  getProjectsSnapshot,
  getServerProjectsSnapshot,
  parseProjectsSnapshot,
  subscribeToProjects,
} from "@/lib/project-store";

/**
 * Workspace identity, told truthfully.
 *
 * FramePilot has no accounts, so this is not a profile menu: it states where the
 * work actually lives, how much of it there is, and offers the two routes plus
 * the existing confirmation-gated reset. Nothing here implies sign-in, sync, or
 * remote storage, because none of that exists.
 *
 * The count comes from the same validated project store the rest of the app
 * uses, read through `useSyncExternalStore`, so it is SSR-safe and updates after
 * every save, delete, and reset without polling.
 */
export function DemoWorkspaceMenu() {
  const raw = useSyncExternalStore(
    subscribeToProjects,
    getProjectsSnapshot,
    getServerProjectsSnapshot,
  );
  const parsed = useMemo(() => parseProjectsSnapshot(raw), [raw]);
  const [resetOpen, setResetOpen] = useState(false);

  const count = parsed.projects.length;
  const countLabel =
    count === 0 ? "No saved projects" : count === 1 ? "1 saved project" : `${count} saved projects`;

  function handleReset(): ActionOutcome {
    resetEverything();
    toast.success("Demo data cleared from this browser.");
    return { ok: true };
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Open demo workspace menu"
            className="gap-2 px-1.5 text-ink-muted hover:text-ink sm:px-2"
          >
            <span
              aria-hidden
              className="grid size-6 place-items-center rounded-md border border-hairline-strong bg-surface-lifted font-mono text-[0.65rem] text-brand-soft"
            >
              FP
            </span>
            <span className="hidden text-[0.8rem] lg:inline">Demo workspace</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="min-w-[16.5rem]">
          <DropdownMenuLabel>
            <p className="text-sm font-medium text-ink">Demo workspace</p>
            <p className="mt-1 text-xs leading-snug text-ink-muted">
              Projects stay in this browser.
            </p>
          </DropdownMenuLabel>

          <div className="mx-1 mt-1 rounded-md border border-hairline bg-canvas-deep/60 px-2.5 py-2">
            <p className="flex items-center gap-1.5 text-[0.68rem] text-ink-muted">
              <HardDrive aria-hidden className="size-3.5 text-brand-soft" />
              Local only · No account required
            </p>
            <p className="mt-1.5 font-mono text-[0.68rem] text-ink-faint">{countLabel}</p>
          </div>

          <DropdownMenuSeparator />

          {/*
            Navigational group. The trigger is visible at every width, so these
            are the reliable route to each page on a phone — including the
            directions reference, whose header link only appears from `sm`.
          */}
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/projects">
                <FolderOpen aria-hidden />
                Open projects
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/create">
                <ArrowRight aria-hidden />
                Create a scene
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/directories">
                <Compass aria-hidden />
                Creative directions
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => {
              // Keep the menu's focus handling intact, then open the guarded dialog.
              event.preventDefault();
              setResetOpen(true);
            }}
          >
            <RotateCcw aria-hidden />
            Reset demo data
          </DropdownMenuItem>

          <p className="px-2.5 pb-1 pt-2 text-[0.65rem] leading-snug text-ink-faint">
            Cloud sync is not enabled.
          </p>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* The same confirmation-gated reset used in the workspace. */}
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset the demo?"
        description="This clears the current draft and every saved project from this browser. It cannot be undone."
        confirmLabel="Reset everything"
        workingLabel="Resetting…"
        successLabel="Demo reset"
        onConfirm={handleReset}
      />
    </>
  );
}
