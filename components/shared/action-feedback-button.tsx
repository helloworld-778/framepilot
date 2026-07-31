"use client";

import { Check, Loader2, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Honest action feedback.
 *
 * The control itself reports what happened, in addition to any toast. Success is
 * only ever shown after the real action resolves — there are no timed fakes and
 * no artificial delay. Failure stays visible and the button returns to a
 * retryable idle state.
 */

export type ActionState = "idle" | "working" | "success" | "error";

export type ActionOutcome = { ok: true; message?: string } | { ok: false; message: string };

export interface ActionFeedbackButtonProps {
  idleLabel: string;
  workingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  /** Run the action and report the real result. Sync or async. */
  onAction?: () => ActionOutcome | void | Promise<ActionOutcome | void>;
  /** Drive the state from outside instead, e.g. a form submission. */
  state?: ActionState;
  icon?: LucideIcon;
  type?: "button" | "submit";
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "default" | "lg";
  className?: string;
  /** Accessible name, when the visible label changes between states. */
  ariaLabel?: string;
  /** Announcement text; defaults to "<label>: <state>". */
  announceSuccess?: string;
  announceError?: string;
  /** How long the resolved state stays before returning to idle. */
  resetAfterMs?: number;
  disabled?: boolean;
  onSettled?: (outcome: ActionOutcome) => void;
}

const DEFAULT_RESET_MS = 2200;

export function ActionFeedbackButton({
  idleLabel,
  workingLabel,
  successLabel,
  errorLabel,
  onAction,
  state: controlledState,
  icon: Icon,
  type = "button",
  variant = "outline",
  size = "sm",
  className,
  ariaLabel,
  announceSuccess,
  announceError,
  resetAfterMs = DEFAULT_RESET_MS,
  disabled,
  onSettled,
}: ActionFeedbackButtonProps) {
  const [internalState, setInternalState] = useState<ActionState>("idle");
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const state = controlledState ?? internalState;

  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, []);

  const scheduleReset = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    timeout.current = setTimeout(() => {
      setInternalState("idle");
      setFailureMessage(null);
    }, resetAfterMs);
  }, [resetAfterMs]);

  async function handleClick() {
    if (!onAction || internalState === "working") {
      return;
    }

    setInternalState("working");
    setFailureMessage(null);

    let outcome: ActionOutcome = { ok: true };
    try {
      const result = await onAction();
      if (result) {
        outcome = result;
      }
    } catch {
      outcome = { ok: false, message: errorLabel ?? "Something went wrong" };
    }

    if (outcome.ok) {
      setInternalState("success");
    } else {
      setInternalState("error");
      setFailureMessage(outcome.message);
    }
    onSettled?.(outcome);
    scheduleReset();
  }

  const label =
    state === "working"
      ? (workingLabel ?? idleLabel)
      : state === "success"
        ? (successLabel ?? idleLabel)
        : state === "error"
          ? (failureMessage ?? errorLabel ?? idleLabel)
          : idleLabel;

  const glyph =
    state === "working" ? (
      // The global reduced-motion rule stops this spinning; the icon still reads
      // as "in progress" because the label says so.
      <Loader2 aria-hidden className="size-3.5 motion-safe:animate-spin" />
    ) : state === "success" ? (
      <Check aria-hidden className="size-3.5" />
    ) : state === "error" ? (
      <TriangleAlert aria-hidden className="size-3.5" />
    ) : Icon ? (
      <Icon aria-hidden className="size-3.5" />
    ) : null;

  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      onClick={onAction ? handleClick : undefined}
      disabled={disabled || state === "working"}
      aria-label={ariaLabel ?? idleLabel}
      aria-busy={state === "working" || undefined}
      data-state={state}
      className={cn(
        state === "error" && "text-signal-danger",
        state === "success" && "text-signal-success",
        className,
      )}
    >
      {/* Fixed glyph slot keeps the button from resizing between states. */}
      {glyph ? <span className="grid size-3.5 place-items-center">{glyph}</span> : null}
      <span>{label}</span>
      <span aria-live="polite" className="sr-only">
        {state === "success"
          ? (announceSuccess ?? `${idleLabel}: ${successLabel ?? "done"}`)
          : ""}
        {state === "error"
          ? (announceError ?? `${idleLabel}: ${failureMessage ?? errorLabel ?? "failed"}`)
          : ""}
      </span>
    </Button>
  );
}
