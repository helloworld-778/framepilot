"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  ActionFeedbackButton,
  type ActionOutcome,
  type ActionState,
} from "@/components/shared/action-feedback-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RenameProjectDialogProps {
  trigger: ReactNode;
  currentTitle: string;
  /** Reports the real result so the submit button can show it. */
  onRename: (title: string) => ActionOutcome | void | Promise<ActionOutcome | void>;
}

export function RenameProjectDialog({
  trigger,
  currentTitle,
  onRename,
}: RenameProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentTitle);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<ActionState>("idle");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    };
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setValue(currentTitle);
      setError(null);
      setState("idle");
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setError("A project needs a name.");
      return;
    }

    setState("working");
    let outcome: ActionOutcome = { ok: true };
    try {
      const result = await onRename(trimmed);
      if (result) {
        outcome = result;
      }
    } catch {
      outcome = { ok: false, message: "Rename failed" };
    }

    if (!outcome.ok) {
      setState("error");
      setError(outcome.message);
      return;
    }

    setState("success");
    closeTimer.current = setTimeout(() => setOpen(false), 320);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-hairline-strong bg-surface-raised sm:max-w-md">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
            <DialogDescription>
              Only the name changes. The brief, storyboard, and score stay as they are.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-2">
            <Label htmlFor="project-title" className="text-sm text-ink">
              Project name
            </Label>
            <Input
              id="project-title"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              maxLength={90}
              autoComplete="off"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "project-title-error" : undefined}
              className="border-hairline-strong bg-surface/60"
            />
            {error ? (
              <p id="project-title-error" role="alert" className="text-xs text-signal-danger">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <ActionFeedbackButton
              type="submit"
              idleLabel="Save name"
              workingLabel="Renaming…"
              successLabel="Renamed"
              errorLabel="Rename failed"
              state={state}
              variant="default"
              size="default"
              announceSuccess="Project renamed"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
