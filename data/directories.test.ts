import { describe, expect, it } from "vitest";

import { BANNED_REFERENCE_PATTERNS } from "@/data/banned-references";
import { CREATIVE_DIRECTORIES, DIRECTORY_BY_ID } from "@/data/directories";
import { DEMO_BRIEFS } from "@/data/demo-projects";
import { creativeDirectorySchema, DIRECTORY_IDS, sceneBriefSchema } from "@/lib/schemas";

describe("creative directory data", () => {
  it("covers exactly the four v1 directories", () => {
    expect(CREATIVE_DIRECTORIES.map((entry) => entry.id).sort()).toEqual([...DIRECTORY_IDS].sort());
  });

  it.each(CREATIVE_DIRECTORIES.map((directory) => [directory.id, directory] as const))(
    "%s satisfies the schema",
    (_id, directory) => {
      expect(() => creativeDirectorySchema.parse(directory)).not.toThrow();
    },
  );

  it.each(CREATIVE_DIRECTORIES.map((directory) => [directory.id, directory] as const))(
    "%s has an archetype for every beat it plans",
    (_id, directory) => {
      const roles = new Set(directory.archetypes.map((archetype) => archetype.role));
      for (const beats of Object.values(directory.shotPlan)) {
        for (const beat of beats) {
          expect(roles.has(beat.role)).toBe(true);
        }
      }
    },
  );

  it.each(CREATIVE_DIRECTORIES.map((directory) => [directory.id, directory] as const))(
    "%s plans a different shot rhythm per duration",
    (_id, directory) => {
      const signatures = Object.values(directory.shotPlan).map((beats) =>
        beats.map((beat) => beat.role).join(">"),
      );
      expect(new Set(signatures).size).toBeGreaterThan(1);
    },
  );

  it("keeps every directory id addressable", () => {
    for (const id of DIRECTORY_IDS) {
      expect(DIRECTORY_BY_ID[id].id).toBe(id);
    }
  });

  it("contains no borrowed-style or protected references in its own copy", () => {
    const copy = JSON.stringify(CREATIVE_DIRECTORIES);
    for (const entry of BANNED_REFERENCE_PATTERNS) {
      expect(entry.pattern.test(copy), `pattern ${entry.id} matched directory copy`).toBe(false);
    }
  });
});

describe("demo briefs", () => {
  it("provides four valid briefs across four directories", () => {
    expect(DEMO_BRIEFS).toHaveLength(4);
    expect(new Set(DEMO_BRIEFS.map((demo) => demo.brief.directoryId)).size).toBe(4);
    for (const demo of DEMO_BRIEFS) {
      expect(() => sceneBriefSchema.parse(demo.brief)).not.toThrow();
    }
  });

  it("uses unique slugs", () => {
    expect(new Set(DEMO_BRIEFS.map((demo) => demo.slug)).size).toBe(DEMO_BRIEFS.length);
  });

  it("keeps demo copy free of borrowed references", () => {
    const copy = JSON.stringify(DEMO_BRIEFS);
    for (const entry of BANNED_REFERENCE_PATTERNS) {
      expect(entry.pattern.test(copy), `pattern ${entry.id} matched demo copy`).toBe(false);
    }
  });
});
