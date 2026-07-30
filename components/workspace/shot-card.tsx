"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, Lightbulb, Pencil, RotateCcw, Scissors, Undo2, Volume2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { shotEditSchema } from "@/lib/schemas";
import type { ShotEdit, StoryboardShot } from "@/types";
import { cn } from "@/lib/utils";

interface ShotCardProps {
  shot: StoryboardShot;
  isActive: boolean;
  onSave: (shotId: string, edit: ShotEdit) => void;
  onRevert: (shotId: string) => void;
  onFocus: (shotId: string) => void;
}

const DIRECTION_ROWS = [
  { key: "camera", label: "Camera", icon: Camera },
  { key: "lighting", label: "Lighting", icon: Lightbulb },
  { key: "composition", label: "Composition", icon: Scissors },
  { key: "sound", label: "Sound", icon: Volume2 },
] as const;

function toEditValues(shot: StoryboardShot): ShotEdit {
  return {
    title: shot.title,
    shotType: shot.shotType,
    visualDirection: shot.visualDirection,
    camera: shot.camera,
    lighting: shot.lighting,
    composition: shot.composition,
    sound: shot.sound,
    transition: shot.transition,
  };
}

function EditField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-ink-muted">
        {label}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-signal-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ShotCard({ shot, isActive, onSave, onRevert, onFocus }: ShotCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ShotEdit>({
    resolver: zodResolver(shotEditSchema),
    defaultValues: toEditValues(shot),
  });

  function startEditing() {
    form.reset(toEditValues(shot));
    setIsEditing(true);
    onFocus(shot.id);
  }

  function submit(values: ShotEdit) {
    onSave(shot.id, values);
    setIsEditing(false);
  }

  const inputClass = "border-hairline-strong bg-surface-sunken/70 text-sm";

  return (
    <article
      id={`shot-${shot.id}`}
      tabIndex={-1}
      aria-labelledby={`shot-title-${shot.id}`}
      onFocus={() => onFocus(shot.id)}
      className={cn(
        "scroll-mt-28 rounded-lg border bg-surface/60 transition-colors",
        isActive ? "border-brand/60" : "border-hairline",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-brand-soft">
              Shot {String(shot.order).padStart(2, "0")}
            </span>
            <Badge
              variant="outline"
              className="border-hairline-strong font-mono text-[0.65rem] text-ink-muted"
            >
              {shot.durationSeconds}s
            </Badge>
            {shot.edited ? (
              <Badge className="bg-highlight/15 text-[0.65rem] text-highlight hover:bg-highlight/15">
                Edited
              </Badge>
            ) : null}
          </div>
          <h3
            id={`shot-title-${shot.id}`}
            className="mt-1.5 text-base font-medium text-ink"
          >
            {shot.title}
          </h3>
          <p className="mt-0.5 text-xs text-ink-faint">{shot.shotType}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {shot.edited && !isEditing ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onRevert(shot.id)}
              className="text-ink-muted hover:text-ink"
            >
              <RotateCcw aria-hidden className="size-3.5" />
              Revert
            </Button>
          ) : null}
          {isEditing ? null : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={startEditing}
              aria-label={`Edit shot ${shot.order}`}
            >
              <Pencil aria-hidden className="size-3.5" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* No `mode="wait"`: the incoming panel should mount immediately rather
          than waiting on an exit animation. */}
      <AnimatePresence initial={false}>
        {isEditing ? (
          <motion.form
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onSubmit={form.handleSubmit(submit)}
            noValidate
            className="space-y-4 px-5 py-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <EditField
                id={`title-${shot.id}`}
                label="Shot title"
                error={form.formState.errors.title?.message}
              >
                <Input
                  id={`title-${shot.id}`}
                  className={inputClass}
                  {...form.register("title")}
                />
              </EditField>
              <EditField
                id={`shotType-${shot.id}`}
                label="Shot type"
                error={form.formState.errors.shotType?.message}
              >
                <Input
                  id={`shotType-${shot.id}`}
                  className={inputClass}
                  {...form.register("shotType")}
                />
              </EditField>
            </div>

            <EditField
              id={`visualDirection-${shot.id}`}
              label="Visual direction"
              error={form.formState.errors.visualDirection?.message}
            >
              <Textarea
                id={`visualDirection-${shot.id}`}
                rows={3}
                className={cn(inputClass, "leading-relaxed")}
                {...form.register("visualDirection")}
              />
            </EditField>

            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["camera", "Camera"],
                  ["lighting", "Lighting"],
                  ["composition", "Composition"],
                  ["sound", "Sound"],
                  ["transition", "Transition"],
                ] as const
              ).map(([field, label]) => (
                <EditField
                  key={field}
                  id={`${field}-${shot.id}`}
                  label={label}
                  error={form.formState.errors[field]?.message}
                >
                  <Input
                    id={`${field}-${shot.id}`}
                    className={inputClass}
                    {...form.register(field)}
                  />
                </EditField>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
              <Button type="submit" size="sm">
                <Check aria-hidden className="size-3.5" />
                Save shot
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
              >
                <X aria-hidden className="size-3.5" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-ink-muted"
                onClick={() => form.reset(toEditValues(shot))}
              >
                <Undo2 aria-hidden className="size-3.5" />
                Reset fields
              </Button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="px-5 py-5"
          >
            <p className="text-sm leading-relaxed text-ink">{shot.visualDirection}</p>

            <dl className="mt-4 grid gap-x-6 gap-y-3 border-t border-hairline pt-4 sm:grid-cols-2">
              {DIRECTION_ROWS.map((row) => (
                <div key={row.key} className="flex gap-2.5">
                  <row.icon aria-hidden className="mt-0.5 size-3.5 shrink-0 text-ink-faint" />
                  <div className="min-w-0">
                    <dt className="text-[0.68rem] uppercase tracking-[0.12em] text-ink-faint">
                      {row.label}
                    </dt>
                    <dd className="mt-0.5 text-[0.82rem] leading-snug text-ink-muted">
                      {shot[row.key]}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex gap-2.5 border-t border-hairline pt-3">
              <span className="text-[0.68rem] uppercase tracking-[0.12em] text-ink-faint">
                Transition
              </span>
              <span className="text-[0.82rem] leading-snug text-ink-muted">{shot.transition}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
