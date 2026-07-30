import { describe, expect, it } from "vitest";

import { CREATIVE_DIRECTORIES } from "@/data/directories";
import { MIN_SHOT_SECONDS, SCENE_DURATION_LIST } from "@/lib/constants";
import { allocateDurations } from "@/lib/duration-plan";

describe("allocateDurations", () => {
  it("hits the exact total for every directory and duration", () => {
    for (const directory of CREATIVE_DIRECTORIES) {
      for (const duration of SCENE_DURATION_LIST) {
        const beats = directory.shotPlan[duration];
        const durations = allocateDurations(
          duration,
          beats.map((beat) => beat.weight),
        );

        expect(durations).toHaveLength(beats.length);
        expect(durations.reduce((sum, value) => sum + value, 0)).toBe(duration);
        expect(durations.every((value) => Number.isInteger(value))).toBe(true);
        expect(Math.min(...durations)).toBeGreaterThanOrEqual(MIN_SHOT_SECONDS);
      }
    }
  });

  it("respects weight ordering when seconds allow it", () => {
    expect(allocateDurations(15, [0.5, 0.3, 0.2])).toEqual([8, 4, 3]);
  });

  it("borrows from the longest shot to honour the minimum", () => {
    const durations = allocateDurations(10, [0.85, 0.1, 0.05]);
    expect(durations.reduce((sum, value) => sum + value, 0)).toBe(10);
    expect(Math.min(...durations)).toBeGreaterThanOrEqual(MIN_SHOT_SECONDS);
  });

  it("spreads evenly when the minimum cannot be met", () => {
    const durations = allocateDurations(4, [0.4, 0.3, 0.3]);
    expect(durations.reduce((sum, value) => sum + value, 0)).toBe(4);
  });

  it("rejects nonsense input", () => {
    expect(() => allocateDurations(0, [1])).toThrow();
    expect(() => allocateDurations(10, [])).toThrow();
    expect(() => allocateDurations(2.5, [1])).toThrow();
  });
});
