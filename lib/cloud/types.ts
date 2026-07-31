import { z } from "zod";

import {
  directorOutputSchema,
  directoryIdSchema,
  sceneBriefSchema,
} from "@/lib/schemas";

/**
 * Shared data contracts for the OPTIONAL v2 cloud layer.
 *
 * These mirror the tables in `supabase/migrations/*_v2_foundation_schema.sql`.
 * Nothing in FramePilot v1 imports this module, and no v1 schema, type, or stored
 * payload is modified by it.
 *
 * The existing `sceneBriefSchema` and `directorOutputSchema` are reused directly
 * rather than restated, so a v2 record can never drift from the v1 contract. The
 * enum string values are kept identical to the PostgreSQL enum labels.
 */

/* ------------------------------------------------------------------ *
 * Primitives shared with the database enums
 * ------------------------------------------------------------------ */

export const RECORD_STATUSES = ["draft", "active", "archived"] as const;
export const PROVENANCE_MODES = ["local", "ai", "imported"] as const;
export const GENERATION_RUN_STATUSES = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "rejected",
] as const;
export const REFERENCE_ASSET_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "archived",
] as const;

export const recordStatusSchema = z.enum(RECORD_STATUSES);
export const provenanceModeSchema = z.enum(PROVENANCE_MODES);
export const generationRunStatusSchema = z.enum(GENERATION_RUN_STATUSES);
export const referenceAssetStatusSchema = z.enum(REFERENCE_ASSET_STATUSES);

/** timestamptz round-trips as ISO 8601 with either `Z` or a numeric offset. */
export const isoTimestampSchema = z.iso.datetime({ offset: true });

/** Matches the SQL `jsonb_typeof(...) = 'object'` check constraints. */
export const jsonObjectSchema = z.record(z.string(), z.unknown());

const positiveVersionSchema = z.number().int().positive();

/* ------------------------------------------------------------------ *
 * workspace_profiles
 * ------------------------------------------------------------------ */

export const workspaceProfileSchema = z.object({
  id: z.uuid(),
  ownerId: z.uuid(),
  name: z.string().trim().min(1),
  status: recordStatusSchema,
  version: positiveVersionSchema,
  profile: jsonObjectSchema,
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

/* ------------------------------------------------------------------ *
 * creative_directions — published reference data
 * ------------------------------------------------------------------ */

/**
 * `id` reuses the v1 `directoryIdSchema` union, so a seeded row that is not one of
 * the four canonical directions fails validation at the boundary.
 */
export const creativeDirectionRecordSchema = z.object({
  id: directoryIdSchema,
  label: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  moodWords: z.array(z.string().trim().min(1)).min(1),
  rules: jsonObjectSchema,
  version: positiveVersionSchema,
  status: recordStatusSchema,
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

/* ------------------------------------------------------------------ *
 * prompt_policies
 * ------------------------------------------------------------------ */

export const promptPolicySchema = z.object({
  id: z.uuid(),
  slug: z.string().trim().min(1),
  version: positiveVersionSchema,
  status: recordStatusSchema,
  systemInstruction: z.string().trim().min(1),
  safetyRules: z.array(z.string().min(1)),
  ipRules: z.array(z.string().min(1)),
  outputRequirements: jsonObjectSchema,
  maxReferenceChunks: z.number().int().min(0),
  effectiveFrom: isoTimestampSchema.nullable(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

/* ------------------------------------------------------------------ *
 * cloud_projects and immutable versions
 * ------------------------------------------------------------------ */

export const cloudProjectSchema = z.object({
  id: z.uuid(),
  ownerId: z.uuid(),
  title: z.string().trim().min(1),
  status: recordStatusSchema,
  currentVersionId: z.uuid().nullable(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

/**
 * A version row carries a full v1 brief and output. Reusing the v1 schemas here is
 * the guarantee that a cloud round-trip cannot corrupt or reshape a plan.
 *
 * There is no `updatedAt`: version rows are append-only, matching the absence of
 * UPDATE/DELETE policies in SQL.
 */
export const cloudProjectVersionSchema = z.object({
  id: z.uuid(),
  projectId: z.uuid(),
  versionNumber: positiveVersionSchema,
  provenance: provenanceModeSchema,
  brief: sceneBriefSchema,
  output: directorOutputSchema,
  metadata: jsonObjectSchema,
  createdAt: isoTimestampSchema,
});

/* ------------------------------------------------------------------ *
 * generation_runs — audit and provenance
 * ------------------------------------------------------------------ */

export const generationRunSchema = z.object({
  id: z.uuid(),
  ownerId: z.uuid().nullable(),
  cloudProjectId: z.uuid().nullable(),
  mode: provenanceModeSchema,
  status: generationRunStatusSchema,
  modelId: z.string().min(1).nullable(),
  policySlug: z.string().min(1).nullable(),
  policyVersion: positiveVersionSchema.nullable(),
  directionId: directoryIdSchema.nullable(),
  directionVersion: positiveVersionSchema.nullable(),
  workspaceProfileId: z.uuid().nullable(),
  referenceAssetIds: z.array(z.uuid()),
  inputHash: z.string().min(1).nullable(),
  outputHash: z.string().min(1).nullable(),
  latencyMs: z.number().int().min(0).nullable(),
  errorCode: z.string().min(1).nullable(),
  safeErrorMessage: z.string().min(1).nullable(),
  createdAt: isoTimestampSchema,
  completedAt: isoTimestampSchema.nullable(),
});

/* ------------------------------------------------------------------ *
 * reference_assets — metadata only
 * ------------------------------------------------------------------ */

export const referenceAssetSchema = z.object({
  id: z.uuid(),
  ownerId: z.uuid(),
  workspaceProfileId: z.uuid().nullable(),
  storagePath: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  byteSize: z.number().int().positive(),
  status: referenceAssetStatusSchema,
  metadata: jsonObjectSchema,
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

/* ------------------------------------------------------------------ *
 * AI direction envelope — request and response
 * ------------------------------------------------------------------ */

/**
 * What a future server-side generation boundary would accept.
 *
 * Only identifiers travel here — never a policy body or a model key. The server
 * resolves the active policy itself, so a caller cannot substitute a weaker one.
 */
export const aiDirectionRequestSchema = z.object({
  brief: sceneBriefSchema,
  /** Optional override; the server falls back to the brief's own direction. */
  directionId: directoryIdSchema.optional(),
  workspaceProfileId: z.uuid().optional(),
  referenceAssetIds: z.array(z.uuid()).default([]),
  /** Idempotency handle so a retried request cannot double-bill or double-write. */
  clientRequestId: z.uuid().optional(),
});

/**
 * Provenance recorded alongside every generated plan.
 *
 * Deliberately excludes prompts, raw responses, and credentials: hashes and
 * identifiers are enough to audit a run without becoming a secret store.
 */
export const generationProvenanceSchema = z.object({
  runId: z.uuid(),
  mode: provenanceModeSchema,
  status: generationRunStatusSchema,
  modelId: z.string().min(1).nullable(),
  policySlug: z.string().min(1),
  policyVersion: positiveVersionSchema,
  directionId: directoryIdSchema,
  directionVersion: positiveVersionSchema,
  inputHash: z.string().min(1),
  outputHash: z.string().min(1),
  latencyMs: z.number().int().min(0),
  createdAt: isoTimestampSchema,
});

/**
 * The success envelope.
 *
 * `output` is exactly `directorOutputSchema` — the same contract the v1 workspace
 * already renders — and provenance is a strictly separate sibling object. That
 * separation is what lets a v2 plan drop straight into existing v1 UI without any
 * shape negotiation.
 */
export const aiDirectionResponseSchema = z.object({
  output: directorOutputSchema,
  provenance: generationProvenanceSchema,
});

/** Failure envelope. `message` is user-safe; it never carries provider detail. */
export const aiDirectionErrorSchema = z.object({
  runId: z.uuid().nullable(),
  code: z.string().min(1),
  message: z.string().min(1),
  retryable: z.boolean(),
});

export const aiDirectionResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true) }).extend(aiDirectionResponseSchema.shape),
  z.object({ ok: z.literal(false) }).extend(aiDirectionErrorSchema.shape),
]);

/* ------------------------------------------------------------------ *
 * Inferred types
 * ------------------------------------------------------------------ */

export type RecordStatus = z.infer<typeof recordStatusSchema>;
export type ProvenanceMode = z.infer<typeof provenanceModeSchema>;
export type GenerationRunStatus = z.infer<typeof generationRunStatusSchema>;
export type ReferenceAssetStatus = z.infer<typeof referenceAssetStatusSchema>;

export type WorkspaceProfile = z.infer<typeof workspaceProfileSchema>;
export type CreativeDirectionRecord = z.infer<typeof creativeDirectionRecordSchema>;
export type PromptPolicy = z.infer<typeof promptPolicySchema>;
export type CloudProject = z.infer<typeof cloudProjectSchema>;
export type CloudProjectVersion = z.infer<typeof cloudProjectVersionSchema>;
export type GenerationRun = z.infer<typeof generationRunSchema>;
export type ReferenceAsset = z.infer<typeof referenceAssetSchema>;

export type AiDirectionRequest = z.infer<typeof aiDirectionRequestSchema>;
export type AiDirectionRequestInput = z.input<typeof aiDirectionRequestSchema>;
export type GenerationProvenance = z.infer<typeof generationProvenanceSchema>;
export type AiDirectionResponse = z.infer<typeof aiDirectionResponseSchema>;
export type AiDirectionError = z.infer<typeof aiDirectionErrorSchema>;
export type AiDirectionResult = z.infer<typeof aiDirectionResultSchema>;
