import { describe, expect, it } from "vitest";

import { DEFAULT_SCENE_BRIEF } from "@/lib/constants";
import { DESCRIPTION_MAX, sceneBriefSchema, shotEditSchema } from "@/lib/schemas";

const validBrief = {
  description:
    "A market at closing time where wind pushes a wrapper across wet stone while shutters come down.",
  directoryId: "nonlinear-suspense",
  purpose: "awareness",
  duration: 30,
  aspectRatio: "16:9",
};

describe("sceneBriefSchema", () => {
  it("accepts a valid brief and applies optional defaults", () => {
    const parsed = sceneBriefSchema.parse(validBrief);
    expect(parsed.primarySubject).toBe("");
    expect(parsed.targetAudience).toBe("");
    expect(parsed.onScreenText).toBe("");
  });

  it("trims the description before validating", () => {
    const parsed = sceneBriefSchema.parse({
      ...validBrief,
      description: `   ${validBrief.description}   `,
    });
    expect(parsed.description).toBe(validBrief.description);
  });

  it("rejects a description that is too short", () => {
    const result = sceneBriefSchema.safeParse({ ...validBrief, description: "Too short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["description"]);
    }
  });

  it("rejects a description that is too long", () => {
    const result = sceneBriefSchema.safeParse({
      ...validBrief,
      description: "a".repeat(DESCRIPTION_MAX + 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown enum values", () => {
    expect(sceneBriefSchema.safeParse({ ...validBrief, directoryId: "noir-pastiche" }).success).toBe(
      false,
    );
    expect(sceneBriefSchema.safeParse({ ...validBrief, purpose: "trailer" }).success).toBe(false);
    expect(sceneBriefSchema.safeParse({ ...validBrief, aspectRatio: "4:3" }).success).toBe(false);
  });

  it("rejects durations outside 8, 15, and 30 seconds", () => {
    expect(sceneBriefSchema.safeParse({ ...validBrief, duration: 12 }).success).toBe(false);
    expect(sceneBriefSchema.safeParse({ ...validBrief, duration: 8 }).success).toBe(true);
    expect(sceneBriefSchema.safeParse({ ...validBrief, duration: 15 }).success).toBe(true);
    expect(sceneBriefSchema.safeParse({ ...validBrief, duration: 30 }).success).toBe(true);
  });

  it("caps the optional fields", () => {
    expect(
      sceneBriefSchema.safeParse({ ...validBrief, onScreenText: "x".repeat(61) }).success,
    ).toBe(false);
    expect(
      sceneBriefSchema.safeParse({ ...validBrief, primarySubject: "x".repeat(81) }).success,
    ).toBe(false);
  });

  it("treats the shipped default brief as incomplete until described", () => {
    expect(sceneBriefSchema.safeParse(DEFAULT_SCENE_BRIEF).success).toBe(false);
  });
});

describe("shotEditSchema", () => {
  const validEdit = {
    title: "Macro — crema bloom",
    shotType: "Extreme close-up",
    visualDirection: "Crema blooms across the surface.",
    camera: "Locked tripod, slow push",
    lighting: "Single soft source at 45 degrees",
    composition: "Rim on the lower third",
    sound: "Close pour detail",
    transition: "Match cut on the highlight",
  };

  it("accepts a complete edit", () => {
    expect(shotEditSchema.safeParse(validEdit).success).toBe(true);
  });

  it("rejects an emptied field", () => {
    for (const key of Object.keys(validEdit)) {
      const result = shotEditSchema.safeParse({ ...validEdit, [key]: "   " });
      expect(result.success, `${key} should be required`).toBe(false);
    }
  });
});
