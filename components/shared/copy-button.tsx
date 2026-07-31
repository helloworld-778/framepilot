"use client";

import { Copy } from "lucide-react";

import {
  ActionFeedbackButton,
  type ActionOutcome,
} from "@/components/shared/action-feedback-button";

interface CopyButtonProps {
  value: string;
  label: string;
  /** Shown on the button after a successful copy. */
  confirmation?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

/**
 * Clipboard writes need a user gesture and can fail on insecure origins or when
 * the permission is refused, so the failure is surfaced honestly rather than
 * being swallowed.
 */
export function CopyButton({
  value,
  label,
  confirmation = "Copied",
  variant = "outline",
  size = "sm",
  className,
}: CopyButtonProps) {
  async function copy(): Promise<ActionOutcome> {
    try {
      await navigator.clipboard.writeText(value);
      return { ok: true };
    } catch {
      return { ok: false, message: "Copy failed" };
    }
  }

  return (
    <ActionFeedbackButton
      idleLabel={label}
      workingLabel="Copying…"
      successLabel={confirmation}
      errorLabel="Copy failed"
      onAction={copy}
      icon={Copy}
      variant={variant}
      size={size}
      className={className}
      ariaLabel={label}
      announceSuccess={`${label}: copied to clipboard`}
      announceError={`${label}: copy failed`}
    />
  );
}
