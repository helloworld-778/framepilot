"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Check,
  Clapperboard,
  Crop,
  Film,
  Lightbulb,
  Pencil,
  RotateCcw,
  Scissors,
  Undo2,
  Volume2,
  X,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { DirectionCanvas } from "@/components/shared/direction-canvas";
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

/** Production-spec rows. Every field stays visible — nothing is hidden away. */
const SPEC_ROWS = [
  { key: "camera", label: "Camera", icon: Camera },
  { key: "lighting", label: "Lighting", icon: Lightbulb },
  { key: "composition", label: "Composition", icon: Crop },
  { key: "sound", label: "Sound", icon: Volume2 },
  { key: "transition", label: "Transition", icon: Scissors },
] as const;

const ROLE_LABELS: Record<StoryboardShot["role"], string> = {
  establish: "Establish",
  withhold: "Withhold",
  fragment: "Fragment",
  reveal: "Reveal",
  develop: "Develop",
  detail: "Detail",
  resolve: "Resolve",
};

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

  const inputClass =
    "border-hairline-strong bg-canvas-deep/70 text-sm transition-[border-color,box-shadow] focus-visible:border-dir/60 focus-visible:ring-[3px] focus-visible:ring-dir/25";

  return (
    <motion.article
      layout
      id={`shot-${shot.id}`}
      tabIndex={-1}
      aria-labelledby={`shot-title-${shot.id}`}
      onFocus={() => onFocus(shot.id)}
      className={cn(
        "fp-panel scroll-mt-28 overflow-hidden transition-colors",
        isActive && "border-dir/60",
      )}
    >
      <div className="flex flex-col gap-0 sm:flex-row">
        {/* Shot identity zone: number, role, duration, and a mood strip. */}
        <div className="relative flex shrink-0 items-stretch border-b border-hairline sm:w-40 sm:border-b-0 sm:border-r">
          <div className="relative w-full overflow-hidden p-4">
            <DirectionCanvas seed={shot.order * 5} />
            <div className="relative flex h-full flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2 sm:flex-col">
                <span className="fp-slate text-[0.62rem] uppercase">
                  Shot {String(shot.order).padStart(2, "0")}
                </span>
                <Badge
                  variant="outline"
                  className="shrink-0 border-hairline-strong bg-canvas-deep/70 font-mono text-[0.65rem] text-ink-muted"
                >
                  {shot.durationSeconds}s
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Clapperboard aria-hidden className="size-3.5 text-dir" />
                <span className="text-[0.7rem] font-medium text-ink-muted">
                  {ROLE_LABELS[shot.role]}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline px-5 py-4">
            <div className="min-w-0">
              <h3
                id={`shot-title-${shot.id}`}
                className="text-base font-medium text-ink"
              >
                {shot.title}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-faint">
                <Film aria-hidden className="size-3" />
                {shot.shotType}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {shot.edited ? (
                <Badge className="border border-highlight/40 bg-highlight/15 text-[0.65rem] text-highlight hover:bg-highlight/15">
                  Edited
                </Badge>
              ) : null}
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
                className="space-y-4 bg-canvas-deep/40 px-5 py-5"
              >
                <p className="fp-slate text-[0.6rem] uppercase">Edit workbench</p>

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
                  {SPEC_ROWS.map((row) => (
                    <EditField
                      key={row.key}
                      id={`${row.key}-${shot.id}`}
                      label={row.label}
                      error={form.formState.errors[row.key]?.message}
                    >
                      <Input
                        id={`${row.key}-${shot.id}`}
                        className={inputClass}
                        {...form.register(row.key)}
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

                <dl className="mt-4 grid gap-x-6 border-t border-hairline pt-2 sm:grid-cols-2">
                  {SPEC_ROWS.map((row) => (
                    <div
                      key={row.key}
                      className="flex gap-2.5 border-b border-hairline/60 py-2.5 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
                    >
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded border border-hairline-strong bg-surface-lifted text-dir">
                        <row.icon aria-hidden className="size-3" />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-[0.62rem] uppercase tracking-slate text-ink-faint">
                          {row.label}
                        </dt>
                        <dd className="mt-0.5 text-[0.82rem] leading-snug text-ink-muted">
                          {shot[row.key]}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
}
