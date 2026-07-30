"use client";

import { useState, type ReactNode } from "react";

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
  onRename: (title: string) => void;
}

export function RenameProjectDialog({
  trigger,
  currentTitle,
  onRename,
}: RenameProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentTitle);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setValue(currentTitle);
      setError(null);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setError("A project needs a name.");
      return;
    }
    onRename(trimmed);
    setOpen(false);
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
            <Button type="submit">Save name</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
