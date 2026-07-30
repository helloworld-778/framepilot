import { describe, expect, it } from "vitest";

import { createRng, mulberry32 } from "@/lib/prng";
import { canonicaliseBrief, fnv1a32, seedForBrief } from "@/lib/seed";
import { DEMO_BRIEFS } from "@/data/demo-projects";

const demo = DEMO_BRIEFS[0];
if (!demo) {
  throw new Error("Demo briefs are missing");
}
const brief = demo.brief;

describe("mulberry32", () => {
  it("produces the same stream for the same seed", () => {
    const a = mulberry32(1234);
    const b = mulberry32(1234);
    const left = [a(), a(), a(), a()];
    const right = [b(), b(), b(), b()];
    expect(left).toEqual(right);
  });

  it("produces a different stream for a different seed", () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });

  it("stays inside [0, 1)", () => {
    const next = mulberry32(99);
    for (let index = 0; index < 500; index += 1) {
      const value = next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("createRng", () => {
  it("picks reproducibly from a list", () => {
    const items = ["a", "b", "c", "d", "e"];
    const first = createRng(7);
    const second = createRng(7);
    expect([first.pick(items), first.pick(items)]).toEqual([
      second.pick(items),
      second.pick(items),
    ]);
  });

  it("only ever returns members of the list", () => {
    const items = ["a", "b", "c"];
    const rng = createRng(42);
    for (let index = 0; index < 100; index += 1) {
      expect(items).toContain(rng.pick(items));
    }
  });

  it("throws rather than returning undefined for an empty list", () => {
    expect(() => createRng(1).pick([])).toThrow(/empty list/i);
  });
});

describe("seeding", () => {
  it("canonicalises away whitespace and casing", () => {
    const noisy = {
      ...brief,
      description: `  ${brief.description.toUpperCase()}  `,
      primarySubject: brief.primarySubject.toUpperCase(),
    };
    expect(canonicaliseBrief(noisy)).toBe(canonicaliseBrief(brief));
  });

  it("is insensitive to key order", () => {
    const reordered = {
      onScreenText: brief.onScreenText,
      duration: brief.duration,
      description: brief.description,
      aspectRatio: brief.aspectRatio,
      targetAudience: brief.targetAudience,
      purpose: brief.purpose,
      primarySubject: brief.primarySubject,
      directoryId: brief.directoryId,
    };
    expect(seedForBrief(reordered)).toBe(seedForBrief(brief));
  });

  it("changes when meaning changes", () => {
    expect(seedForBrief({ ...brief, duration: 8 })).not.toBe(seedForBrief(brief));
  });

  it("hashes to a stable 8-character hex seed", () => {
    expect(seedForBrief(brief)).toMatch(/^[0-9a-f]{8}$/);
    expect(fnv1a32("framepilot")).toBe(fnv1a32("framepilot"));
  });
});
