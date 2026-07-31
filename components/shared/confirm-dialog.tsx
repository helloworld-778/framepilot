"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  ActionFeedbackButton,
  type ActionOutcome,
} from "@/components/shared/action-feedback-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  /** Omit when driving the dialog from elsewhere, e.g. a menu item. */
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  workingLabel?: string;
  successLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => ActionOutcome | void | Promise<ActionOutcome | void>;
}

/**
 * Used for anything that discards work, so nothing destructive is one click.
 *
 * The dialog now stays open while the action runs: the confirm button reports
 * working, then the real result, and only closes once the action has actually
 * succeeded. A failure keeps the dialog open so the user can retry.
 */
export function ConfirmDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
  title,
  description,
  confirmLabel,
  workingLabel,
  successLabel,
  cancelLabel = "Cancel",
  destructive = true,
  onConfirm,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = controlledOpen ?? internalOpen;

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    };
  }, []);

  function setOpen(next: boolean) {
    setInternalOpen(next);
    onOpenChange?.(next);
  }

  function handleSettled(outcome: ActionOutcome) {
    if (!outcome.ok) {
      return;
    }
    // Let the confirmed state register, then close. Tied to the real result.
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }
    closeTimer.current = setTimeout(() => setOpen(false), 320);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="border-hairline-strong bg-surface-raised sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              {cancelLabel}
            </Button>
          </DialogClose>
          <ActionFeedbackButton
            idleLabel={confirmLabel}
            workingLabel={workingLabel ?? "Working…"}
            successLabel={successLabel ?? "Done"}
            onAction={onConfirm}
            onSettled={handleSettled}
            variant={destructive ? "destructive" : "default"}
            size="default"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
