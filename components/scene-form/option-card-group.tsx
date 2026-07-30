"use client";

import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export interface OptionCard<TValue extends string> {
  value: TValue;
  label: string;
  hint?: string;
  /** Small visual, e.g. an aspect-ratio frame drawn in CSS. */
  visual?: ReactNode;
}

interface OptionCardGroupProps<TValue extends string> {
  name: string;
  legend: string;
  description?: string;
  options: OptionCard<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  columns?: "auto" | 2 | 3 | 4;
  error?: string;
}

/**
 * One accessible pattern for every single-choice field on the form. A radio
 * group under the hood, so arrow keys work and the selection is announced.
 */
export function OptionCardGroup<TValue extends string>({
  name,
  legend,
  description,
  options,
  value,
  onChange,
  columns = "auto",
  error,
}: OptionCardGroupProps<TValue>) {
  const describedBy = [description ? `${name}-description` : null, error ? `${name}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-ink">{legend}</legend>
      {description ? (
        <p id={`${name}-description`} className="text-xs text-ink-muted">
          {description}
        </p>
      ) : null}

      <RadioGroup
        value={value}
        onValueChange={(next) => onChange(next as TValue)}
        aria-label={legend}
        aria-describedby={describedBy.length > 0 ? describedBy : undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          "grid gap-2",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "sm:grid-cols-3",
          columns === 4 && "grid-cols-2 sm:grid-cols-4",
          columns === "auto" && "sm:grid-cols-2",
        )}
      >
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const selected = option.value === value;
          return (
            <div key={option.value} className="relative">
              <RadioGroupItem id={id} value={option.value} className="peer sr-only" />
              <Label
                htmlFor={id}
                className={cn(
                  "flex h-full cursor-pointer flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                  selected
                    ? "border-brand/70 bg-brand/10"
                    : "border-hairline bg-surface/60 hover:border-hairline-strong",
                )}
              >
                {option.visual ? <span className="mb-1">{option.visual}</span> : null}
                <span
                  className={cn(
                    "text-sm font-medium",
                    selected ? "text-ink" : "text-ink-muted",
                  )}
                >
                  {option.label}
                </span>
                {option.hint ? (
                  <span className="text-xs leading-snug text-ink-faint">{option.hint}</span>
                ) : null}
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      {error ? (
        <p id={`${name}-error`} role="alert" className="text-xs text-signal-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
