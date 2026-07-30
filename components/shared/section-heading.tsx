import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-brand-soft">
            {eyebrow}
          </p>
        ) : null}
        <Tag
          className={cn(
            "font-semibold text-ink",
            Tag === "h1" ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl",
          )}
        >
          {title}
        </Tag>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-[0.95rem]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
