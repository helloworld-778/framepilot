"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  Clapperboard,
  Megaphone,
  PenLine,
  Radio,
  Timer,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { DemoPrefillChips } from "@/components/scene-form/demo-prefill-chips";
import { LiveMoodboard } from "@/components/scene-form/live-moodboard";
import {
  OptionCardGroup,
  type OptionCard,
} from "@/components/scene-form/option-card-group";
import { ProgressRail } from "@/components/scene-form/progress-rail";
import { ReplaceDraftDialog } from "@/components/scene-form/replace-draft-dialog";
import {
  ActionFeedbackButton,
  type ActionOutcome,
  type ActionState,
} from "@/components/shared/action-feedback-button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MagneticCta } from "@/components/shared/magnetic-cta";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CREATIVE_DIRECTORIES } from "@/data/directories";
import { DEMO_BRIEF_BY_SLUG, type DemoBrief } from "@/data/demo-projects";
import {
  ASPECT_HINTS,
  ASPECT_LABELS,
  ASPECT_RATIO_LIST,
  DEFAULT_SCENE_BRIEF,
  DESCRIPTION_LIMIT,
  DIRECTORY_ID_LIST,
  DURATION_HINTS,
  DURATION_LABELS,
  PURPOSE_HINTS,
  PURPOSE_LABELS,
  SCENE_DURATION_LIST,
  SCENE_PURPOSE_LIST,
} from "@/lib/constants";
import { generateDirection } from "@/lib/director";
import { directionAttr, directoryTheme } from "@/lib/directory-theme";
import {
  getDraftSnapshot,
  getServerDraftSnapshot,
  parseDraftSnapshot,
  saveStoredDraftAsProject,
  subscribeToDraft,
} from "@/lib/draft-store";
import {
  editSourceKey,
  editSourceReturnHref,
  fingerprintEnvelope,
  parseEditRequest,
  resolveEditSource,
} from "@/lib/edit-source";
import {
  getProjectsSnapshot,
  getServerProjectsSnapshot,
  parseProjectsSnapshot,
  subscribeToProjects,
} from "@/lib/project-store";
import { sceneFormSchema } from "@/lib/schemas";
import {
  readDraft,
  readPreferences,
  writeDraft,
  writePreferences,
} from "@/lib/storage";
import type {
  AspectRatio,
  DirectoryId,
  SceneBrief,
  SceneDuration,
  ScenePurpose,
} from "@/types";
import { cn } from "@/lib/utils";

/** Aspect previews are drawn, not imported. */
function AspectFrame({ ratio }: { ratio: AspectRatio }) {
  const size =
    ratio === "9:16" ? "h-7 w-4" : ratio === "16:9" ? "h-4 w-7" : "size-5";
  return (
    <span
      aria-hidden
      className={cn("block rounded-[3px] border border-current opacity-60", size)}
    />
  );
}

const directoryOptions: OptionCard<DirectoryId>[] = CREATIVE_DIRECTORIES.map(
  (directory) => ({
    value: directory.id,
    label: directory.name,
    hint: directory.tagline,
    directionId: directory.id,
    swatches: directory.palette,
    meta: directoryTheme(directory.id).label,
  }),
);

const PURPOSE_ICONS: Record<ScenePurpose, LucideIcon> = {
  promotion: Megaphone,
  invitation: CalendarClock,
  awareness: Radio,
  "short-story": BookOpen,
};

const purposeOptions: OptionCard<ScenePurpose>[] = SCENE_PURPOSE_LIST.map((purpose) => ({
  value: purpose,
  label: PURPOSE_LABELS[purpose],
  hint: PURPOSE_HINTS[purpose],
  icon: PURPOSE_ICONS[purpose],
}));

const durationOptions: OptionCard<`${SceneDuration}`>[] = SCENE_DURATION_LIST.map(
  (duration) => ({
    value: `${duration}` as `${SceneDuration}`,
    label: DURATION_LABELS[duration],
    hint: DURATION_HINTS[duration],
    icon: Timer,
  }),
);

const aspectOptions: OptionCard<AspectRatio>[] = ASPECT_RATIO_LIST.map((ratio) => ({
  value: ratio,
  label: ASPECT_LABELS[ratio],
  hint: ASPECT_HINTS[ratio],
  visual: <AspectFrame ratio={ratio} />,
}));

function isDirectoryId(value: string | null): value is DirectoryId {
  return value !== null && DIRECTORY_ID_LIST.includes(value as DirectoryId);
}

export function SceneBriefForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The demo in play is either the one in the URL or the last chip clicked, so
  // it is derived rather than synchronised in an effect.
  const [clickedDemo, setClickedDemo] = useState<string | undefined>(undefined);
  const [submitState, setSubmitState] = useState<ActionState>("idle");
  /** Holds the validated brief while the replace-draft guard is open. */
  const [pendingBrief, setPendingBrief] = useState<SceneBrief | null>(null);
  const appliedParams = useRef(false);
  const appliedEdit = useRef<string | null>(null);
  /** Fingerprint of the draft this edit session opened, captured at prefill. */
  const entryFingerprint = useRef<string | null>(null);
  const submitRef = useRef<HTMLButtonElement | null>(null);
  const activeDemo = clickedDemo ?? searchParams.get("demo") ?? undefined;

  // Edit mode reads its brief from the canonical stores, never from the URL.
  const draftRaw = useSyncExternalStore(
    subscribeToDraft,
    getDraftSnapshot,
    getServerDraftSnapshot,
  );
  const projectsRaw = useSyncExternalStore(
    subscribeToProjects,
    getProjectsSnapshot,
    getServerProjectsSnapshot,
  );
  const editRequest = useMemo(
    () => parseEditRequest(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const editSource = useMemo(
    () =>
      resolveEditSource(
        editRequest,
        parseDraftSnapshot(draftRaw),
        parseProjectsSnapshot(projectsRaw),
      ),
    [editRequest, draftRaw, projectsRaw],
  );

  const form = useForm<SceneBrief>({
    resolver: zodResolver(sceneFormSchema),
    defaultValues: DEFAULT_SCENE_BRIEF,
    mode: "onSubmit",
  });

  // `useWatch` is the subscription-based API, so it stays compiler-friendly.
  // It reports a partial snapshot, so defaults fill any field not yet touched.
  const watched = useWatch({ control: form.control });
  const values: SceneBrief = { ...DEFAULT_SCENE_BRIEF, ...watched };

  /**
   * Prefill for edit mode. Runs once per source: the stores resolve after
   * hydration, so this waits for the real brief rather than guessing at render.
   * The draft's fingerprint at entry is captured here and compared at submit.
   */
  useEffect(() => {
    const key = editSourceKey(editSource);
    if (key === null || appliedEdit.current === key) {
      return;
    }
    appliedEdit.current = key;
    entryFingerprint.current =
      editSource.status === "draft" ? editSource.fingerprint : null;
    if (editSource.status === "draft" || editSource.status === "project") {
      form.reset(editSource.brief);
    }
  }, [editSource, form]);

  // Apply ?demo= and ?direction= once, and otherwise fall back to the last
  // direction the user worked in. Edit mode owns the values instead.
  useEffect(() => {
    if (appliedParams.current || editRequest.mode !== "none") {
      return;
    }
    appliedParams.current = true;

    const demoSlug = searchParams.get("demo");
    const demo = demoSlug ? DEMO_BRIEF_BY_SLUG[demoSlug] : undefined;
    if (demo) {
      form.reset(demo.brief);
      return;
    }

    const direction = searchParams.get("direction");
    if (isDirectoryId(direction)) {
      form.setValue("directoryId", direction);
      return;
    }

    const preferences = readPreferences();
    if (preferences.lastDirectoryId) {
      form.setValue("directoryId", preferences.lastDirectoryId);
    }
    if (preferences.lastAspectRatio) {
      form.setValue("aspectRatio", preferences.lastAspectRatio);
    }
    if (preferences.lastDuration) {
      form.setValue("duration", preferences.lastDuration);
    }
  }, [form, searchParams, editRequest.mode]);

  function applyDemo(demo: DemoBrief) {
    form.reset(demo.brief);
    setClickedDemo(demo.slug);
    toast.success(`Loaded the ${demo.label.toLowerCase()} brief.`);
  }

  /** Generates, stores, and opens the workspace. The only writer of the draft. */
  function commitBrief(brief: SceneBrief) {
    setSubmitState("working");
    try {
      const output = generateDirection(brief, { now: new Date().toISOString() });
      const write = writeDraft(brief, output, new Date().toISOString());

      writePreferences({
        lastDirectoryId: brief.directoryId,
        lastAspectRatio: brief.aspectRatio,
        lastDuration: brief.duration,
      });

      if (write.status === "failed") {
        setSubmitState("error");
        toast.error(
          write.reason === "quota"
            ? "Browser storage is full. Clear some space and try again."
            : "This browser blocked local storage, so the plan could not be kept.",
        );
        return;
      }

      // Stays in the working state through the navigation, so the control never
      // claims success before the workspace actually opens.
      router.push("/workspace");
    } catch {
      setSubmitState("error");
      toast.error("Something went wrong while directing this scene.");
    }
  }

  /**
   * Checked at submission time rather than on render, because the draft slot can
   * change during a session (another tab, a reset, a save). Only a readable
   * draft counts: a corrupt one stays with the existing quarantine path.
   *
   * Re-directing the very draft you opened is an intentional replacement, so the
   * Pass 1 guard is skipped for that one case — identified by fingerprint, not by
   * any new stored field. If the slot now holds a *different* draft, or you came
   * from a saved project, the guard applies exactly as before.
   */
  function onSubmit(brief: SceneBrief) {
    const stored = readDraft();
    const liveFingerprint =
      stored.status === "ok" ? fingerprintEnvelope(stored.value) : null;

    if (editRequest.mode === "draft") {
      const unchanged =
        liveFingerprint !== null && liveFingerprint === entryFingerprint.current;
      if (liveFingerprint === null || unchanged) {
        commitBrief(brief);
        return;
      }
      setPendingBrief(brief);
      return;
    }

    if (liveFingerprint !== null) {
      setPendingBrief(brief);
      return;
    }
    commitBrief(brief);
  }

  function handleCancelReplace() {
    // No write, no delete, no navigation: the stored draft and every typed value
    // stay exactly as they were. Focus is restored by the dialog's close handler.
    setPendingBrief(null);
    setSubmitState("idle");
  }

  function handleReplaceDraft() {
    const brief = pendingBrief;
    setPendingBrief(null);
    if (brief) {
      commitBrief(brief);
    }
  }

  async function handleSaveDraftFirst(): Promise<ActionOutcome> {
    const brief = pendingBrief;
    if (!brief) {
      return { ok: false, message: "Nothing to replace" };
    }

    const archived = saveStoredDraftAsProject(new Date().toISOString());
    if (archived.status !== "ok") {
      const message =
        archived.reason === "quota"
          ? "Browser storage is full. Delete an older project and try again."
          : archived.reason === "missing"
            ? "The current draft could not be read, so it was not saved."
            : "The current draft could not be saved.";
      toast.error(message);
      // The dialog stays open and the draft is untouched, so the user can retry.
      return { ok: false, message: "Could not save the current draft" };
    }

    toast.success("Current draft saved locally");
    setPendingBrief(null);
    commitBrief(brief);
    return { ok: true };
  }

  const descriptionValue = values.description ?? "";
  const descriptionError = form.formState.errors.description?.message;

  const isEditing = editSource.status === "draft" || editSource.status === "project";
  const returnHref = editSourceReturnHref(editSource);
  const backLabel =
    editSource.status === "project" ? "Back to project" : "Back to workspace";

  return (
    <div
      {...directionAttr(values.directoryId)}
      className="relative mx-auto w-full max-w-[88rem] px-5 py-12 sm:px-8"
    >
      <ProgressRail current="brief" />

      {isEditing ? (
        <div className="fp-panel mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="flex items-center gap-2 text-sm text-ink">
            <PenLine aria-hidden className="size-3.5 text-dir" />
            {editSource.status === "project"
              ? "Editing a saved project’s brief"
              : "Editing your current working brief"}
          </p>
          {form.formState.isDirty ? (
            <ConfirmDialog
              trigger={
                <Button type="button" variant="ghost" size="sm" className="text-ink-muted">
                  {backLabel}
                </Button>
              }
              title="Discard brief changes?"
              description="Your edits to this brief have not been directed yet. Leaving now discards them. The stored plan is not affected."
              confirmLabel="Discard changes"
              workingLabel="Leaving…"
              successLabel="Discarded"
              onConfirm={() => {
                router.push(returnHref);
                return { ok: true };
              }}
            />
          ) : (
            <Button asChild variant="ghost" size="sm" className="text-ink-muted">
              <Link href={returnHref}>{backLabel}</Link>
            </Button>
          )}
        </div>
      ) : null}

      {editSource.status === "missing" ? (
        <p className="mb-6 flex items-start gap-2 rounded-md border border-signal-warning/40 bg-signal-warning/10 p-3 text-xs text-signal-warning">
          <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {editSource.requested === "draft"
            ? "That working draft is no longer in this browser, so there was nothing to load. Write a new brief below."
            : "That saved project is not in this browser, so there was nothing to load. Write a new brief below."}
        </p>
      ) : null}

      <SectionHeading
        as="h1"
        eyebrow="Scene brief"
        title="Tell FramePilot what happens"
        description="Two sentences and four choices is enough. The more physical detail you give, the more specific the direction gets."
      />

      <form
        // Wrapped so the submit path is only ever built inside the event, which
        // keeps the draft fingerprint read out of render.
        onSubmit={(event) => {
          void form.handleSubmit(onSubmit)(event);
        }}
        noValidate
        className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12"
      >
        <div className="space-y-10">
          <DemoPrefillChips onSelect={applyDemo} activeSlug={activeDemo} />

          <div className="fp-panel space-y-2 p-5">
            <div className="flex items-baseline justify-between gap-4">
              <Label htmlFor="description" className="text-sm font-medium text-ink">
                Scene description <span className="text-signal-danger">*</span>
              </Label>
              <span
                className={cn(
                  "font-mono text-[0.7rem]",
                  descriptionValue.length > DESCRIPTION_LIMIT
                    ? "text-signal-danger"
                    : "text-ink-faint",
                )}
              >
                {descriptionValue.length}/{DESCRIPTION_LIMIT}
              </span>
            </div>
            <Textarea
              id="description"
              rows={6}
              placeholder="A small cafe on the first afternoon of the monsoon. Rain streaks the window, steam lifts off a fresh cup, and the room glows warm against the grey street."
              aria-describedby={
                descriptionError ? "description-error" : "description-hint"
              }
              aria-invalid={descriptionError ? true : undefined}
              className="resize-y border-hairline-strong bg-canvas-deep/60 text-sm leading-relaxed transition-[border-color,box-shadow] focus-visible:border-dir/60 focus-visible:ring-[3px] focus-visible:ring-dir/25"
              {...form.register("description")}
            />
            {descriptionError ? (
              <p id="description-error" role="alert" className="text-xs text-signal-danger">
                {descriptionError}
              </p>
            ) : (
              <p id="description-hint" className="text-xs text-ink-faint">
                Name the place, the light, and one thing that physically moves.
              </p>
            )}
          </div>

          <OptionCardGroup
            name="directoryId"
            legend="Creative direction *"
            description="Each direction changes the shot structure, not just the wording."
            options={directoryOptions}
            value={values.directoryId}
            onChange={(next) => form.setValue("directoryId", next, { shouldDirty: true })}
            columns={2}
            error={form.formState.errors.directoryId?.message}
          />

          <OptionCardGroup
            name="purpose"
            legend="Purpose"
            options={purposeOptions}
            value={values.purpose}
            onChange={(next) => form.setValue("purpose", next, { shouldDirty: true })}
            columns={2}
            error={form.formState.errors.purpose?.message}
          />

          <div className="grid gap-8 sm:grid-cols-2">
            <OptionCardGroup
              name="duration"
              legend="Runtime"
              options={durationOptions}
              value={`${values.duration}` as `${SceneDuration}`}
              onChange={(next) =>
                form.setValue("duration", Number(next) as SceneDuration, {
                  shouldDirty: true,
                })
              }
              columns={3}
              error={form.formState.errors.duration?.message}
            />

            <OptionCardGroup
              name="aspectRatio"
              legend="Aspect ratio"
              options={aspectOptions}
              value={values.aspectRatio}
              onChange={(next) => form.setValue("aspectRatio", next, { shouldDirty: true })}
              columns={3}
              error={form.formState.errors.aspectRatio?.message}
            />
          </div>

          <div className="fp-panel space-y-5 p-5">
            <div>
              <h2 className="text-sm font-medium text-ink">Optional detail</h2>
              <p className="mt-1 text-xs text-ink-muted">
                Each field you fill in raises the readiness score and tightens the direction.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primarySubject" className="text-sm text-ink">
                  Primary subject
                </Label>
                <Input
                  id="primarySubject"
                  placeholder="hand-brewed monsoon coffee"
                  className="border-hairline-strong bg-canvas-deep/60 transition-[border-color,box-shadow] focus-visible:border-dir/60 focus-visible:ring-[3px] focus-visible:ring-dir/25"
                  aria-invalid={form.formState.errors.primarySubject ? true : undefined}
                  {...form.register("primarySubject")}
                />
                {form.formState.errors.primarySubject ? (
                  <p role="alert" className="text-xs text-signal-danger">
                    {form.formState.errors.primarySubject.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience" className="text-sm text-ink">
                  Target audience
                </Label>
                <Input
                  id="targetAudience"
                  placeholder="students and young professionals"
                  className="border-hairline-strong bg-canvas-deep/60 transition-[border-color,box-shadow] focus-visible:border-dir/60 focus-visible:ring-[3px] focus-visible:ring-dir/25"
                  aria-invalid={form.formState.errors.targetAudience ? true : undefined}
                  {...form.register("targetAudience")}
                />
                {form.formState.errors.targetAudience ? (
                  <p role="alert" className="text-xs text-signal-danger">
                    {form.formState.errors.targetAudience.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="onScreenText" className="text-sm text-ink">
                On-screen text
              </Label>
              <Input
                id="onScreenText"
                placeholder="Monsoon pour, all week"
                className="border-hairline-strong bg-canvas-deep/60 transition-[border-color,box-shadow] focus-visible:border-dir/60 focus-visible:ring-[3px] focus-visible:ring-dir/25"
                aria-describedby="onScreenText-hint"
                aria-invalid={form.formState.errors.onScreenText ? true : undefined}
                {...form.register("onScreenText")}
              />
              {form.formState.errors.onScreenText ? (
                <p role="alert" className="text-xs text-signal-danger">
                  {form.formState.errors.onScreenText.message}
                </p>
              ) : (
                <p id="onScreenText-hint" className="text-xs text-ink-faint">
                  Eight words or fewer survives a phone screen.
                </p>
              )}
            </div>
          </div>

          <div className="fp-panel fp-panel-tinted flex flex-wrap items-center gap-3 p-5">
            <MagneticCta>
              <ActionFeedbackButton
                ref={submitRef}
                type="submit"
                idleLabel={isEditing ? "Re-direct scene" : "Direct my scene"}
                workingLabel="Directing…"
                successLabel="Directed"
                icon={Clapperboard}
                state={submitState}
                variant="default"
                size="lg"
                announceSuccess="Scene directed. Opening the workspace."
              />
            </MagneticCta>
            <p className="max-w-md text-xs leading-snug text-ink-faint">
              {editSource.status === "project"
                ? "Re-directing creates a new working draft. This saved project will not change."
                : editSource.status === "draft"
                  ? "Re-directing replaces this working draft with a new plan. Your current shot edits will be replaced."
                  : "Runs locally. Nothing is sent anywhere."}
            </p>
          </div>
        </div>

        <LiveMoodboard brief={values} />
      </form>

      <ReplaceDraftDialog
        open={pendingBrief !== null}
        restoreFocusTo={submitRef}
        onCancel={handleCancelReplace}
        onReplace={handleReplaceDraft}
        onSaveFirst={handleSaveDraftFirst}
      />
    </div>
  );
}

