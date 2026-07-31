"use client";

import { FolderOpen, RotateCcw } from "lucide-react";
import type { RefObject } from "react";

import {
  ActionFeedbackButton,
  type ActionOutcome,
} from "@/components/shared/action-feedback-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReplaceDraftDialogProps {
  open: boolean;
  /** Focus returns here on close, since the dialog opens without a trigger. */
  restoreFocusTo?: RefObject<HTMLButtonElement | null>;
  /** Called for Escape, the overlay, and Cancel. Must not mutate anything. */
  onCancel: () => void;
  /** Overwrite the stored draft with the newly submitted scene. */
  onReplace: () => void;
  /**
   * Save the *stored* draft as a project first. Reports the real result so a
   * failure keeps the dialog open and retryable.
   */
  onSaveFirst: () => ActionOutcome | Promise<ActionOutcome>;
}

/**
 * Guards the single working draft slot.
 *
 * `ConfirmDialog` is deliberately not reused here: it models one confirm plus a
 * cancel and closes itself on success, which cannot express three outcomes
 * without weakening the delete and reset flows that depend on it. This dialog is
 * built from the same primitives, so focus trapping, Escape dismissal, and focus
 * restoration behave identically.
 *
 * Nothing is written until the user picks Replace or Save-first.
 */
export function ReplaceDraftDialog({
  open,
  restoreFocusTo,
  onCancel,
  onReplace,
  onSaveFirst,
}: ReplaceDraftDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onCancel();
        }
      }}
    >
      <DialogContent
        className="border-hairline-strong bg-surface-raised sm:max-w-lg"
        onCloseAutoFocus={(event) => {
          const target = restoreFocusTo?.current;
          if (target) {
            // Radix would restore to whatever was focused at open time; the
            // submit control is the honest place to land.
            event.preventDefault();
            target.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Replace current draft?</DialogTitle>
          <DialogDescription>
            FramePilot keeps one working draft in this browser. Directing this scene will
            replace the current draft.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col sm:items-stretch">
          <Button type="button" variant="destructive" onClick={onReplace}>
            <RotateCcw aria-hidden className="size-3.5" />
            Replace draft
          </Button>

          <ActionFeedbackButton
            idleLabel="Save current draft first"
            workingLabel="Saving…"
            successLabel="Current draft saved locally"
            errorLabel="Could not save the current draft"
            onAction={onSaveFirst}
            icon={FolderOpen}
            variant="outline"
            size="default"
            announceSuccess="Current draft saved locally as a project"
          />

          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
