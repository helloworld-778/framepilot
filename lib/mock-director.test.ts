import { describe, expect, it } from "vitest";

import { BANNED_REFERENCE_PATTERNS } from "@/data/banned-references";
import { CREATIVE_DIRECTORIES } from "@/data/directories";
import { DEMO_BRIEFS } from "@/data/demo-projects";
import { SCENE_DURATION_LIST, SCENE_PURPOSE_LIST } from "@/lib/constants";
import { generateDirection } from "@/lib/director";
import { collectGeneratedCreativeText } from "@/lib/ip-safety";
import { directorOutputSchema, DIRECTORY_IDS } from "@/lib/schemas";
import type { SceneBrief } from "@/types";

const baseBrief: SceneBrief = {
  description:
    "A small neighbourhood cafe on a rainy afternoon. Steam lifts from a cup while rain marks the window and someone pours a fresh batch behind the counter.",
  directoryId: "premium-product-film",
  purpose: "promotion",
  duration: 15,
  aspectRatio: "9:16",
  primarySubject: "hand-brewed monsoon coffee",
  targetAudience: "students and young professionals",
  onScreenText: "Monsoon pour, all week",
};

function briefWith(overrides: Partial<SceneBrief>): SceneBrief {
  return { ...baseBrief, ...overrides };
}

describe("generateDirection — contract", () => {
  it("returns output that satisfies the DirectorOutput schema", () => {
    const output = generateDirection(baseBrief);
    expect(() => directorOutputSchema.parse(output)).not.toThrow();
  });

  it("produces 3 to 5 shots for every directory and duration", () => {
    for (const directoryId of DIRECTORY_IDS) {
      for (const duration of SCENE_DURATION_LIST) {
        const output = generateDirection(briefWith({ directoryId, duration }));
        expect(output.shots.length).toBeGreaterThanOrEqual(3);
        expect(output.shots.length).toBeLessThanOrEqual(5);
      }
    }
  });

  it("matches the requested duration exactly, every time", () => {
    for (const directoryId of DIRECTORY_IDS) {
      for (const duration of SCENE_DURATION_LIST) {
        const output = generateDirection(briefWith({ directoryId, duration }));
        const total = output.shots.reduce((sum, shot) => sum + shot.durationSeconds, 0);
        expect(total, `${directoryId} at ${duration}s`).toBe(duration);
        expect(output.meta.totalDurationSeconds).toBe(duration);
      }
    }
  });

  it("fills every direction field on every shot", () => {
    for (const directoryId of DIRECTORY_IDS) {
      const output = generateDirection(briefWith({ directoryId }));
      for (const shot of output.shots) {
        expect(shot.title.length).toBeGreaterThan(0);
        expect(shot.shotType.length).toBeGreaterThan(0);
        expect(shot.visualDirection.length).toBeGreaterThan(0);
        expect(shot.camera.length).toBeGreaterThan(0);
        expect(shot.lighting.length).toBeGreaterThan(0);
        expect(shot.composition.length).toBeGreaterThan(0);
        expect(shot.sound.length).toBeGreaterThan(0);
        expect(shot.transition.length).toBeGreaterThan(0);
        expect(shot.edited).toBe(false);
      }
    }
  });

  it("orders shots from 1 with unique ids", () => {
    const output = generateDirection(baseBrief);
    expect(output.shots.map((shot) => shot.order)).toEqual(
      output.shots.map((_shot, index) => index + 1),
    );
    expect(new Set(output.shots.map((shot) => shot.id)).size).toBe(output.shots.length);
  });

  it("carries the format and runtime into the master prompt", () => {
    const output = generateDirection(briefWith({ aspectRatio: "1:1", duration: 30 }));
    expect(output.masterPrompt).toContain("1:1");
    expect(output.masterPrompt).toContain("30s");
  });

  it("emits a deduplicated negative prompt", () => {
    const output = generateDirection(baseBrief);
    const terms = output.negativePrompt.split(", ");
    expect(terms.length).toBeGreaterThan(10);
    expect(new Set(terms).size).toBe(terms.length);
    expect(output.negativePrompt).toContain("no logos");
    expect(output.negativePrompt).toContain("no celebrity likeness");
  });
});

describe("generateDirection — determinism", () => {
  it("returns identical output for the same brief", () => {
    expect(generateDirection(baseBrief)).toEqual(generateDirection(baseBrief));
  });

  it("ignores whitespace and casing noise in the description", () => {
    const noisy = briefWith({
      description: `   ${baseBrief.description.toUpperCase()}   `,
    });
    expect(generateDirection(noisy).meta.seed).toBe(generateDirection(baseBrief).meta.seed);
  });

  it("changes the seed when the brief actually changes", () => {
    const seeds = new Set([
      generateDirection(baseBrief).meta.seed,
      generateDirection(briefWith({ duration: 30 })).meta.seed,
      generateDirection(briefWith({ aspectRatio: "16:9" })).meta.seed,
      generateDirection(briefWith({ primarySubject: "cold brew in a tall glass" })).meta.seed,
    ]);
    expect(seeds.size).toBe(4);
  });

  it("does not read the clock unless a timestamp is supplied", () => {
    const withClock = generateDirection(baseBrief, { now: "2026-01-01T00:00:00.000Z" });
    expect(withClock.meta.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(generateDirection(baseBrief).meta.createdAt).toBe(
      generateDirection(baseBrief).meta.createdAt,
    );
  });
});

describe("generateDirection — directory differentiation", () => {
  const outputs = DIRECTORY_IDS.map((directoryId) =>
    generateDirection(briefWith({ directoryId, duration: 30 })),
  );

  it("gives each directory its own shot structure at every duration", () => {
    for (const duration of SCENE_DURATION_LIST) {
      const structures = DIRECTORY_IDS.map((directoryId) =>
        generateDirection(briefWith({ directoryId, duration }))
          .shots.map((shot) => shot.role)
          .join(">"),
      );
      expect(new Set(structures).size, `duration ${duration}s: ${structures.join(" | ")}`).toBe(
        DIRECTORY_IDS.length,
      );
    }
  });

  it("writes materially different direction, not swapped adjectives", () => {
    const texts = outputs.map((output) =>
      output.shots
        .map((shot) => `${shot.visualDirection} ${shot.camera} ${shot.lighting}`)
        .join(" ")
        .toLowerCase(),
    );

    for (let a = 0; a < texts.length; a += 1) {
      for (let b = a + 1; b < texts.length; b += 1) {
        const left = new Set((texts[a] ?? "").split(/\W+/).filter(Boolean));
        const right = new Set((texts[b] ?? "").split(/\W+/).filter(Boolean));
        const shared = [...left].filter((word) => right.has(word)).length;
        const union = new Set([...left, ...right]).size;
        const similarity = shared / union;
        expect(similarity, `${DIRECTORY_IDS[a]} vs ${DIRECTORY_IDS[b]}`).toBeLessThan(0.45);
      }
    }
  });

  it("keeps each directory's own pacing in the shot lengths", () => {
    for (const output of outputs) {
      const directory = CREATIVE_DIRECTORIES.find((entry) => entry.id === output.directoryId);
      expect(directory).toBeDefined();
      const average =
        output.shots.reduce((sum, shot) => sum + shot.durationSeconds, 0) / output.shots.length;
      expect(average).toBeGreaterThanOrEqual(1);
      expect(average).toBeLessThanOrEqual((directory?.comfortableShotSeconds.max ?? 12) + 4);
    }
  });
});

describe("generateDirection — reference safety sweep", () => {
  it("never emits a borrowed-style or protected reference", () => {
    const briefs: SceneBrief[] = [];
    for (const directoryId of DIRECTORY_IDS) {
      for (const duration of SCENE_DURATION_LIST) {
        for (const purpose of SCENE_PURPOSE_LIST) {
          briefs.push(briefWith({ directoryId, duration, purpose }));
        }
      }
    }
    for (const demo of DEMO_BRIEFS) {
      briefs.push(demo.brief);
    }

    expect(briefs.length).toBeGreaterThanOrEqual(48);

    for (const brief of briefs) {
      const output = generateDirection(brief);
      const strings = collectGeneratedCreativeText(output);
      for (const text of strings) {
        for (const entry of BANNED_REFERENCE_PATTERNS) {
          expect(
            entry.pattern.test(text),
            `pattern ${entry.id} matched generated text: ${text}`,
          ).toBe(false);
        }
      }
    }
  });
});

describe("generateDirection — demo briefs", () => {
  it.each(DEMO_BRIEFS.map((demo) => [demo.slug, demo] as const))(
    "%s produces a usable, high-scoring plan",
    (_slug, demo) => {
      const output = generateDirection(demo.brief);
      expect(() => directorOutputSchema.parse(output)).not.toThrow();
      expect(output.readinessScore).toBeGreaterThanOrEqual(70);
      expect(output.shots.reduce((sum, shot) => sum + shot.durationSeconds, 0)).toBe(
        demo.brief.duration,
      );
    },
  );
});
