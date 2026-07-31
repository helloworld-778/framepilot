"use client";

import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { usePointerBloom } from "@/components/shared/interactive-card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { DirectoryId, PaletteSwatch } from "@/types";
import { cn } from "@/lib/utils";

export interface OptionCard<TValue extends string> {
  value: TValue;
  label: string;
  hint?: string;
  /** Small visual, e.g. an aspect-ratio frame drawn in CSS. */
  visual?: ReactNode;
  icon?: LucideIcon;
  /** Scopes the direction theme to this card. */
  directionId?: DirectoryId;
  swatches?: PaletteSwatch[];
  meta?: string;
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
 * One accessible pattern for every single-choice field on the form: a radio
 * group under the hood, so arrow keys work and selection is announced. The
 * visual treatment is director-mode — palette bands, accent halo, and an
 * explicit active indicator — but the semantics are unchanged.
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
  const bloom = usePointerBloom();
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
          "grid gap-2.5",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "sm:grid-cols-3",
          columns === 4 && "grid-cols-2 sm:grid-cols-4",
          columns === "auto" && "sm:grid-cols-2",
        )}
      >
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const selected = option.value === value;
          const Icon = option.icon;

          return (
            <div
              key={option.value}
              className="relative"
              {...(option.directionId ? { "data-direction": option.directionId } : {})}
            >
              <RadioGroupItem id={id} value={option.value} className="peer sr-only" />
              <Label
                htmlFor={id}
                {...bloom}
                className={cn(
                  "fp-card-interactive relative flex h-full cursor-pointer flex-col items-start gap-1 overflow-hidden rounded-lg border p-3 text-left",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                  selected
                    ? "fp-selected"
                    : "border-hairline bg-surface/60 hover:border-hairline-strong",
                )}
              >
                {option.swatches ? (
                  <span aria-hidden className="absolute inset-x-0 top-0 flex h-1">
                    {option.swatches.map((swatch) => (
                      <span
                        key={swatch.hex}
                        className="flex-1"
                        style={{ backgroundColor: swatch.hex }}
                      />
                    ))}
                  </span>
                ) : null}

                <span
                  className={cn(
                    "flex w-full items-start justify-between gap-2",
                    option.swatches && "mt-1.5",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {Icon ? (
                      <Icon
                        aria-hidden
                        className={cn(
                          "size-4 shrink-0",
                          selected ? "text-dir-soft" : "text-ink-faint",
                        )}
                      />
                    ) : null}
                    {option.visual ? <span aria-hidden>{option.visual}</span> : null}
                    <span
                      className={cn(
                        "text-sm font-medium",
                        selected ? "text-ink" : "text-ink-muted",
                      )}
                    >
                      {option.label}
                    </span>
                  </span>

                  {/* Fixed-size slot, so selecting never shifts layout. */}
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      selected
                        ? "border-dir/70 bg-dir/25 text-dir-soft"
                        : "border-hairline-strong text-transparent",
                    )}
                  >
                    <Check className="size-2.5" />
                  </span>
                </span>

                {option.hint ? (
                  <span className="text-xs leading-snug text-ink-faint">{option.hint}</span>
                ) : null}

                {option.meta ? (
                  <span className="fp-slate mt-1 text-[0.6rem] uppercase">{option.meta}</span>
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
