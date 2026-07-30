"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  label: string;
  /** Announced and shown after a successful copy. */
  confirmation?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

type CopyState = "idle" | "copied" | "error";

/**
 * Clipboard writes need a user gesture and can fail on insecure origins, so the
 * failure path is visible rather than silent.
 */
export function CopyButton({
  value,
  label,
  confirmation = "Copied",
  variant = "outline",
  size = "sm",
  className,
}: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("error");
    }
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    timeout.current = setTimeout(() => setState("idle"), 2200);
  }

  const text =
    state === "copied" ? confirmation : state === "error" ? "Copy failed" : label;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(state === "error" && "text-signal-danger", className)}
      aria-label={label}
    >
      {state === "copied" ? (
        <Check aria-hidden className="size-3.5" />
      ) : (
        <Copy aria-hidden className="size-3.5" />
      )}
      <span>{text}</span>
      <span aria-live="polite" className="sr-only">
        {state === "copied" ? `${label}: copied to clipboard` : ""}
        {state === "error" ? `${label}: copy failed` : ""}
      </span>
    </Button>
  );
}
