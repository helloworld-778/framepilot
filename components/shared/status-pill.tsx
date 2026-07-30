import { AlertTriangle, Check, X } from "lucide-react";

import type { CheckStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<CheckStatus, string> = {
  pass: "border-signal-success/40 bg-signal-success/10 text-signal-success",
  warn: "border-signal-warning/40 bg-signal-warning/10 text-signal-warning",
  fail: "border-signal-danger/40 bg-signal-danger/10 text-signal-danger",
};

const STATUS_LABELS: Record<CheckStatus, string> = {
  pass: "Pass",
  warn: "Check",
  fail: "Fix",
};

const STATUS_ICONS: Record<CheckStatus, typeof Check> = {
  pass: Check,
  warn: AlertTriangle,
  fail: X,
};

export function StatusPill({
  status,
  className,
}: {
  status: CheckStatus;
  className?: string;
}) {
  const Icon = STATUS_ICONS[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[0.68rem] font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      <Icon aria-hidden className="size-3" />
      {STATUS_LABELS[status]}
    </span>
  );
}
