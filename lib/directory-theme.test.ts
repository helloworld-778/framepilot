import { describe, expect, it } from "vitest";

import { CREATIVE_DIRECTORIES } from "@/data/directories";
import {
  DIRECTORY_THEMES,
  directionAttr,
  directoryTheme,
} from "@/lib/directory-theme";
import { DIRECTORY_IDS } from "@/lib/schemas";

describe("directory theme map", () => {
  it("covers every direction exactly once", () => {
    expect(Object.keys(DIRECTORY_THEMES).sort()).toEqual([...DIRECTORY_IDS].sort());
  });

  it("gives each direction its own production label", () => {
    const labels = Object.values(DIRECTORY_THEMES).map((theme) => theme.label);
    expect(new Set(labels).size).toBe(DIRECTORY_IDS.length);
  });

  it("provides three mood words and a production label per direction", () => {
    for (const id of DIRECTORY_IDS) {
      const theme = directoryTheme(id);
      expect(theme.moodWords).toHaveLength(3);
      expect(theme.label.length).toBeGreaterThan(3);
    }
  });

  it("scopes theming with a data attribute rather than inline colours", () => {
    expect(directionAttr("whimsical-fantasy")).toEqual({
      "data-direction": "whimsical-fantasy",
    });
  });

  it("stays presentation-only: no directory data is duplicated here", () => {
    // Names, taglines, and palettes must keep coming from data/directories.ts.
    const themeText = JSON.stringify(DIRECTORY_THEMES);
    for (const directory of CREATIVE_DIRECTORIES) {
      expect(themeText).not.toContain(directory.name);
      expect(themeText).not.toContain(directory.tagline);
      for (const swatch of directory.palette) {
        expect(themeText).not.toContain(swatch.hex);
      }
    }
  });
});
