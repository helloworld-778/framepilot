import { describe, expect, it } from "vitest";

import { getDirectory } from "@/data/directories";
import { generateDirection } from "@/lib/director";
import { evaluateReadiness } from "@/lib/quality-check";
import type { SceneBrief } from "@/types";

const strongBrief: SceneBrief = {
  description:
    "A women-led craft collective works through the afternoon in a shared workroom while block-printed cloth dries on a line and hands press dye into fabric.",
  directoryId: "documentary-realism",
  purpose: "promotion",
  duration: 30,
  aspectRatio: "9:16",
  primarySubject: "hand block-printed textiles",
  targetAudience: "buyers who care where things come from",
  onScreenText: "Made by hand, sold direct",
};

function scoreFor(brief: SceneBrief) {
  const output = generateDirection(brief);
  return evaluateReadiness(brief, output.shots, getDirectory(brief.directoryId));
}

describe("evaluateReadiness", () => {
  it("weights every check to a total of 100", () => {
    const { checks } = scoreFor(strongBrief);
    expect(checks.reduce((sum, check) => sum + check.weight, 0)).toBe(100);
  });

  it("returns an integer inside 0–100", () => {
    const { score } = scoreFor(strongBrief);
    expect(Number.isInteger(score)).toBe(true);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("scores a complete brief highly", () => {
    expect(scoreFor(strongBrief).score).toBeGreaterThanOrEqual(85);
  });

  it("drops the score as detail is removed", () => {
    const full = scoreFor(strongBrief).score;
    const noSubject = scoreFor({ ...strongBrief, primarySubject: "" }).score;
    const noAudience = scoreFor({ ...strongBrief, primarySubject: "", targetAudience: "" }).score;
    expect(noSubject).toBeLessThan(full);
    expect(noAudience).toBeLessThan(noSubject);
  });

  it("flags a thin description without failing the whole brief", () => {
    const { checks } = scoreFor({
      ...strongBrief,
      description: "A workroom with cloth drying and hands pressing dye all day.",
    });
    const check = checks.find((entry) => entry.id === "scene-specificity");
    expect(check?.status).toBe("warn");
    expect(check?.suggestion).toBeTruthy();
  });

  it("fails an aspect-purpose mismatch softly with guidance", () => {
    const { checks } = scoreFor({ ...strongBrief, aspectRatio: "16:9" });
    const check = checks.find((entry) => entry.id === "format-fit");
    expect(check?.status).toBe("warn");
    expect(check?.suggestion).toContain("9:16");
  });

  it("fails on a borrowed-style request and explains the fix", () => {
    const { checks, score } = scoreFor({
      ...strongBrief,
      description: `${strongBrief.description} Please make it in the style of a famous director.`,
    });
    const check = checks.find((entry) => entry.id === "ip-safety");
    expect(check?.status).toBe("fail");
    expect(check?.suggestion).toBeTruthy();
    expect(score).toBeLessThan(100);
  });

  it("warns when a promotion carries no on-screen text", () => {
    const { checks } = scoreFor({ ...strongBrief, onScreenText: "" });
    const check = checks.find((entry) => entry.id === "onscreen-text");
    expect(check?.status).toBe("warn");
  });

  it("fails an over-long on-screen line", () => {
    const { checks } = scoreFor({
      ...strongBrief,
      onScreenText: "one two three four five six seven eight nine ten eleven twelve",
    });
    const check = checks.find((entry) => entry.id === "onscreen-text");
    expect(check?.status).toBe("warn");
  });

  it("fails direction coverage when a field is emptied by an edit", () => {
    const output = generateDirection(strongBrief);
    const damaged = output.shots.map((shot, index) =>
      index === 0 ? { ...shot, camera: "" } : shot,
    );
    const { checks, score } = evaluateReadiness(
      strongBrief,
      damaged,
      getDirectory(strongBrief.directoryId),
    );
    const check = checks.find((entry) => entry.id === "direction-coverage");
    expect(check?.status).toBe("fail");
    expect(score).toBeLessThan(output.readinessScore);
  });

  it("gives every non-pass check an actionable suggestion", () => {
    const { checks, suggestions } = scoreFor({
      ...strongBrief,
      description: "A workroom, some cloth.",
      primarySubject: "",
      targetAudience: "",
      onScreenText: "",
    });
    const nonPass = checks.filter((check) => check.status !== "pass");
    expect(nonPass.length).toBeGreaterThan(0);
    for (const check of nonPass) {
      expect(check.suggestion, `${check.id} has no suggestion`).toBeTruthy();
    }
    expect(suggestions.length).toBe(nonPass.length);
  });
});
