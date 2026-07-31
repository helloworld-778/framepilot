import { describe, expect, it } from "vitest";

import { DEMO_BRIEFS } from "@/data/demo-projects";
import {
  GENERATION_RUN_STATUSES,
  PROVENANCE_MODES,
  RECORD_STATUSES,
  REFERENCE_ASSET_STATUSES,
  aiDirectionRequestSchema,
  aiDirectionResponseSchema,
  aiDirectionResultSchema,
  cloudProjectSchema,
  cloudProjectVersionSchema,
  creativeDirectionRecordSchema,
  generationProvenanceSchema,
  generationRunSchema,
  promptPolicySchema,
  referenceAssetSchema,
  workspaceProfileSchema,
} from "@/lib/cloud/types";
import { generateDirection } from "@/lib/director";
import { directorOutputSchema } from "@/lib/schemas";
import type { DirectorOutput, SceneBrief } from "@/types";

const demo = DEMO_BRIEFS[0];
if (!demo) {
  throw new Error("Demo briefs are missing");
}

const brief: SceneBrief = demo.brief;
const output: DirectorOutput = generateDirection(brief, {
  now: "2026-08-01T12:00:00.000Z",
});

const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";
const UUID_C = "33333333-3333-4333-8333-333333333333";
const NOW = "2026-08-01T12:00:00.000Z";

function provenance() {
  return {
    runId: UUID_A,
    mode: "ai" as const,
    status: "succeeded" as const,
    modelId: "example-model-1",
    policySlug: "framepilot-global",
    policyVersion: 1,
    directionId: brief.directoryId,
    directionVersion: 1,
    inputHash: "sha256:aaa",
    outputHash: "sha256:bbb",
    latencyMs: 1240,
    createdAt: NOW,
  };
}

describe("v2 enum contracts mirror the SQL enums", () => {
  it("uses the same labels as the PostgreSQL types", () => {
    // These must stay byte-identical to the enums in the foundation migration.
    expect(RECORD_STATUSES).toEqual(["draft", "active", "archived"]);
    expect(PROVENANCE_MODES).toEqual(["local", "ai", "imported"]);
    expect(GENERATION_RUN_STATUSES).toEqual([
      "queued",
      "running",
      "succeeded",
      "failed",
      "rejected",
    ]);
    expect(REFERENCE_ASSET_STATUSES).toEqual([
      "pending",
      "approved",
      "rejected",
      "archived",
    ]);
  });
});

describe("workspaceProfileSchema", () => {
  const valid = {
    id: UUID_A,
    ownerId: UUID_B,
    name: "Jaipur cafe work",
    status: "active" as const,
    version: 1,
    profile: { city: "Jaipur" },
    createdAt: NOW,
    updatedAt: NOW,
  };

  it("accepts a well-formed record", () => {
    expect(workspaceProfileSchema.parse(valid)).toEqual(valid);
  });

  it("rejects an unknown status", () => {
    expect(
      workspaceProfileSchema.safeParse({ ...valid, status: "published" }).success,
    ).toBe(false);
  });

  it("rejects a non-object profile, matching the SQL jsonb_typeof check", () => {
    expect(workspaceProfileSchema.safeParse({ ...valid, profile: [] }).success).toBe(
      false,
    );
    expect(
      workspaceProfileSchema.safeParse({ ...valid, profile: "nope" }).success,
    ).toBe(false);
  });

  it("rejects a blank name and a non-positive version", () => {
    expect(workspaceProfileSchema.safeParse({ ...valid, name: "   " }).success).toBe(
      false,
    );
    expect(workspaceProfileSchema.safeParse({ ...valid, version: 0 }).success).toBe(
      false,
    );
  });

  it("rejects a non-uuid owner", () => {
    expect(
      workspaceProfileSchema.safeParse({ ...valid, ownerId: "owner-1" }).success,
    ).toBe(false);
  });

  it("rejects a timestamp that is not ISO 8601", () => {
    expect(
      workspaceProfileSchema.safeParse({ ...valid, createdAt: "yesterday" }).success,
    ).toBe(false);
  });
});

describe("creativeDirectionRecordSchema", () => {
  const valid = {
    id: "documentary-realism" as const,
    label: "Documentary Realism",
    summary: "Natural or motivated light in grounded locations.",
    moodWords: ["grounded", "honest", "unstyled"],
    rules: { pacing: "observational" },
    version: 1,
    status: "active" as const,
    createdAt: NOW,
    updatedAt: NOW,
  };

  it("accepts a canonical direction", () => {
    expect(creativeDirectionRecordSchema.parse(valid)).toEqual(valid);
  });

  it("rejects an id outside the four canonical directions", () => {
    // Reusing the v1 DirectoryId union is what makes this fail.
    expect(
      creativeDirectionRecordSchema.safeParse({ ...valid, id: "gritty-noir" }).success,
    ).toBe(false);
  });

  it("requires at least one mood word", () => {
    expect(
      creativeDirectionRecordSchema.safeParse({ ...valid, moodWords: [] }).success,
    ).toBe(false);
  });
});

describe("promptPolicySchema", () => {
  const valid = {
    id: UUID_A,
    slug: "framepilot-global",
    version: 1,
    status: "active" as const,
    systemInstruction: "You are FramePilot.",
    safetyRules: ["Refuse harmful briefs."],
    ipRules: ["No protected-style imitation."],
    outputRequirements: { format: "json" },
    maxReferenceChunks: 0,
    effectiveFrom: NOW,
    createdAt: NOW,
    updatedAt: NOW,
  };

  it("accepts the shape of the seeded global policy", () => {
    expect(promptPolicySchema.parse(valid)).toEqual(valid);
  });

  it("allows a null effectiveFrom", () => {
    expect(promptPolicySchema.safeParse({ ...valid, effectiveFrom: null }).success).toBe(
      true,
    );
  });

  it("rejects a negative reference-chunk budget", () => {
    expect(
      promptPolicySchema.safeParse({ ...valid, maxReferenceChunks: -1 }).success,
    ).toBe(false);
  });

  it("accepts zero, the Phase 1 default", () => {
    expect(
      promptPolicySchema.safeParse({ ...valid, maxReferenceChunks: 0 }).success,
    ).toBe(true);
  });

  it("rejects a blank system instruction and a zero version", () => {
    expect(
      promptPolicySchema.safeParse({ ...valid, systemInstruction: "  " }).success,
    ).toBe(false);
    expect(promptPolicySchema.safeParse({ ...valid, version: 0 }).success).toBe(false);
  });
});

describe("cloudProjectSchema", () => {
  const valid = {
    id: UUID_A,
    ownerId: UUID_B,
    title: "Monsoon launch cut",
    status: "active" as const,
    currentVersionId: null,
    createdAt: NOW,
    updatedAt: NOW,
  };

  it("accepts a project with no current version yet", () => {
    expect(cloudProjectSchema.parse(valid)).toEqual(valid);
  });

  it("accepts a project pointing at a version", () => {
    expect(
      cloudProjectSchema.safeParse({ ...valid, currentVersionId: UUID_C }).success,
    ).toBe(true);
  });

  it("rejects a blank title", () => {
    expect(cloudProjectSchema.safeParse({ ...valid, title: " " }).success).toBe(false);
  });
});

describe("cloudProjectVersionSchema", () => {
  const valid = {
    id: UUID_A,
    projectId: UUID_B,
    versionNumber: 1,
    provenance: "local" as const,
    brief,
    output,
    metadata: {},
    createdAt: NOW,
  };

  it("accepts a real v1 brief and output unchanged", () => {
    const parsed = cloudProjectVersionSchema.parse(valid);

    // The whole point of reusing the v1 schemas: a cloud round-trip cannot
    // reshape a deterministic plan.
    expect(parsed.output).toEqual(output);
    expect(parsed.brief).toEqual(brief);
  });

  it("rejects an invalid provenance mode", () => {
    expect(
      cloudProjectVersionSchema.safeParse({ ...valid, provenance: "cloud" }).success,
    ).toBe(false);
  });

  it("rejects a version number below one", () => {
    expect(
      cloudProjectVersionSchema.safeParse({ ...valid, versionNumber: 0 }).success,
    ).toBe(false);
  });

  it("rejects an output that violates the existing v1 contract", () => {
    const broken = { ...output, shots: [] };

    expect(cloudProjectVersionSchema.safeParse({ ...valid, output: broken }).success).toBe(
      false,
    );
  });

  it("rejects a non-object metadata value", () => {
    expect(
      cloudProjectVersionSchema.safeParse({ ...valid, metadata: [1, 2] }).success,
    ).toBe(false);
  });

  it("has no updatedAt, because versions are append-only", () => {
    expect(Object.keys(cloudProjectVersionSchema.shape)).not.toContain("updatedAt");
  });
});

describe("generationRunSchema", () => {
  const valid = {
    id: UUID_A,
    ownerId: UUID_B,
    cloudProjectId: null,
    mode: "ai" as const,
    status: "succeeded" as const,
    modelId: "example-model-1",
    policySlug: "framepilot-global",
    policyVersion: 1,
    directionId: brief.directoryId,
    directionVersion: 1,
    workspaceProfileId: null,
    referenceAssetIds: [],
    inputHash: "sha256:aaa",
    outputHash: "sha256:bbb",
    latencyMs: 900,
    errorCode: null,
    safeErrorMessage: null,
    createdAt: NOW,
    completedAt: NOW,
  };

  it("accepts a completed run", () => {
    expect(generationRunSchema.parse(valid)).toEqual(valid);
  });

  it("accepts an anonymised run whose owner was deleted", () => {
    // owner_id is ON DELETE SET NULL, so the audit trail outlives the account.
    expect(generationRunSchema.safeParse({ ...valid, ownerId: null }).success).toBe(true);
  });

  it("accepts a queued run with nothing measured yet", () => {
    expect(
      generationRunSchema.safeParse({
        ...valid,
        status: "queued",
        latencyMs: null,
        outputHash: null,
        completedAt: null,
      }).success,
    ).toBe(true);
  });

  it("rejects an unknown run status", () => {
    expect(generationRunSchema.safeParse({ ...valid, status: "pending" }).success).toBe(
      false,
    );
  });

  it("rejects negative latency, matching the SQL check", () => {
    expect(generationRunSchema.safeParse({ ...valid, latencyMs: -5 }).success).toBe(
      false,
    );
  });

  it("rejects a direction outside the canonical set", () => {
    expect(
      generationRunSchema.safeParse({ ...valid, directionId: "gritty-noir" }).success,
    ).toBe(false);
  });
});

describe("referenceAssetSchema", () => {
  const valid = {
    id: UUID_A,
    ownerId: UUID_B,
    workspaceProfileId: null,
    storagePath: "owner/uuid/lookbook.pdf",
    fileName: "lookbook.pdf",
    mimeType: "application/pdf",
    byteSize: 20_480,
    status: "pending" as const,
    metadata: {},
    createdAt: NOW,
    updatedAt: NOW,
  };

  it("accepts metadata for a pending asset", () => {
    expect(referenceAssetSchema.parse(valid)).toEqual(valid);
  });

  it("rejects a zero or negative byte size", () => {
    expect(referenceAssetSchema.safeParse({ ...valid, byteSize: 0 }).success).toBe(false);
    expect(referenceAssetSchema.safeParse({ ...valid, byteSize: -1 }).success).toBe(
      false,
    );
  });

  it("rejects an unknown asset status", () => {
    expect(referenceAssetSchema.safeParse({ ...valid, status: "active" }).success).toBe(
      false,
    );
  });

  it("rejects a blank storage path", () => {
    expect(referenceAssetSchema.safeParse({ ...valid, storagePath: " " }).success).toBe(
      false,
    );
  });
});

describe("AI direction request envelope", () => {
  it("accepts a brief alone and defaults the reference list to empty", () => {
    const parsed = aiDirectionRequestSchema.parse({ brief });

    expect(parsed.referenceAssetIds).toEqual([]);
    expect(parsed.brief).toEqual(brief);
  });

  it("accepts optional direction, profile, and idempotency handles", () => {
    const parsed = aiDirectionRequestSchema.parse({
      brief,
      directionId: "whimsical-fantasy",
      workspaceProfileId: UUID_A,
      referenceAssetIds: [UUID_B, UUID_C],
      clientRequestId: UUID_A,
    });

    expect(parsed.directionId).toBe("whimsical-fantasy");
    expect(parsed.referenceAssetIds).toHaveLength(2);
  });

  it("rejects an invalid brief, reusing v1 validation", () => {
    expect(
      aiDirectionRequestSchema.safeParse({
        brief: { ...brief, description: "too short" },
      }).success,
    ).toBe(false);
  });

  it("rejects a non-uuid reference id", () => {
    expect(
      aiDirectionRequestSchema.safeParse({ brief, referenceAssetIds: ["asset-1"] })
        .success,
    ).toBe(false);
  });

  it("carries no policy body or credential field", () => {
    const keys = Object.keys(aiDirectionRequestSchema.shape);

    // A caller must never be able to substitute a weaker policy or supply a key.
    expect(keys).not.toContain("systemInstruction");
    expect(keys).not.toContain("policy");
    expect(keys).not.toContain("apiKey");
    expect(keys).not.toContain("modelId");
  });
});

describe("AI direction response envelope", () => {
  const valid = { output, provenance: provenance() };

  it("keeps the output byte-compatible with the existing DirectorOutput contract", () => {
    const parsed = aiDirectionResponseSchema.parse(valid);

    expect(parsed.output).toEqual(output);
    // The same object still satisfies the untouched v1 schema.
    expect(directorOutputSchema.safeParse(parsed.output).success).toBe(true);
  });

  it("keeps provenance as a sibling, never merged into the output", () => {
    const parsed = aiDirectionResponseSchema.parse(valid);

    expect(parsed.provenance.runId).toBe(UUID_A);
    expect(parsed.output).not.toHaveProperty("provenance");
    expect(parsed.output).not.toHaveProperty("runId");
  });

  it("rejects a response missing provenance entirely", () => {
    expect(aiDirectionResponseSchema.safeParse({ output }).success).toBe(false);
  });

  it("rejects malformed provenance", () => {
    const cases = [
      { ...provenance(), runId: "run-1" },
      { ...provenance(), mode: "offline" },
      { ...provenance(), status: "done" },
      { ...provenance(), policyVersion: 0 },
      { ...provenance(), directionVersion: -1 },
      { ...provenance(), directionId: "gritty-noir" },
      { ...provenance(), latencyMs: -1 },
      { ...provenance(), inputHash: "" },
      { ...provenance(), createdAt: "not-a-date" },
      { ...provenance(), policySlug: "" },
    ];

    for (const bad of cases) {
      expect(aiDirectionResponseSchema.safeParse({ output, provenance: bad }).success).toBe(
        false,
      );
    }
  });

  it("rejects an output that fails the v1 schema", () => {
    expect(
      aiDirectionResponseSchema.safeParse({
        output: { ...output, readinessScore: 140 },
        provenance: provenance(),
      }).success,
    ).toBe(false);
  });

  it("allows a null modelId for a locally generated plan", () => {
    expect(
      generationProvenanceSchema.safeParse({
        ...provenance(),
        mode: "local",
        modelId: null,
      }).success,
    ).toBe(true);
  });
});

describe("AI direction result union", () => {
  it("discriminates a success envelope", () => {
    const parsed = aiDirectionResultSchema.parse({
      ok: true,
      output,
      provenance: provenance(),
    });

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.output.projectTitle).toBe(output.projectTitle);
    }
  });

  it("discriminates a failure envelope", () => {
    const parsed = aiDirectionResultSchema.parse({
      ok: false,
      runId: null,
      code: "policy_refused",
      message: "That brief cannot be directed.",
      retryable: false,
    });

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.retryable).toBe(false);
      expect(parsed.code).toBe("policy_refused");
    }
  });

  it("strips an output smuggled onto a failure envelope", () => {
    const parsed = aiDirectionResultSchema.parse({
      ok: false,
      runId: null,
      code: "failed",
      message: "That brief cannot be directed.",
      retryable: true,
      output,
    });

    // Zod strips unknown keys rather than failing, so a caller can never read a
    // plan off a failed result.
    expect(parsed).not.toHaveProperty("output");
  });

  it("rejects a result with no discriminant", () => {
    expect(
      aiDirectionResultSchema.safeParse({ output, provenance: provenance() }).success,
    ).toBe(false);
  });
});
