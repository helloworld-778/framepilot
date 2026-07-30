import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEMO_BRIEFS } from "@/data/demo-projects";
import { STORAGE_KEYS } from "@/lib/constants";
import { generateDirection } from "@/lib/director";
import {
  clearDraft,
  clearDraftAndProjects,
  isStorageAvailable,
  readDraft,
  readPreferences,
  writeDraft,
  writePreferences,
} from "@/lib/storage";

const demo = DEMO_BRIEFS[0];
if (!demo) {
  throw new Error("Demo briefs are missing");
}
const brief = demo.brief;
const output = generateDirection(brief, { now: "2026-05-01T10:00:00.000Z" });

describe("draft storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("reports storage as available in the browser environment", () => {
    expect(isStorageAvailable()).toBe(true);
  });

  it("returns empty before anything is saved", () => {
    expect(readDraft()).toEqual({ status: "empty" });
  });

  it("round-trips a draft through a simulated reload", () => {
    const write = writeDraft(brief, output, "2026-05-01T10:00:00.000Z");
    expect(write).toEqual({ status: "ok" });

    const read = readDraft();
    expect(read.status).toBe("ok");
    if (read.status === "ok") {
      expect(read.value.brief).toEqual(brief);
      expect(read.value.output.shots).toEqual(output.shots);
      expect(read.value.updatedAt).toBe("2026-05-01T10:00:00.000Z");
    }
  });

  it("keeps local shot edits that were saved with the draft", () => {
    const firstShot = output.shots[0];
    expect(firstShot).toBeDefined();
    const editedShots = output.shots.map((shot, index) =>
      index === 0 ? { ...shot, camera: "Locked, no move at all", edited: true } : shot,
    );
    writeDraft(brief, { ...output, shots: editedShots }, "2026-05-01T11:00:00.000Z");

    const read = readDraft();
    expect(read.status).toBe("ok");
    if (read.status === "ok") {
      expect(read.value.output.shots[0]?.camera).toBe("Locked, no move at all");
      expect(read.value.output.shots[0]?.edited).toBe(true);
    }
  });

  it("clears the draft on request", () => {
    writeDraft(brief, output, "2026-05-01T10:00:00.000Z");
    clearDraft();
    expect(readDraft()).toEqual({ status: "empty" });
  });

  it("quarantines unparseable data and recovers", () => {
    window.localStorage.setItem(STORAGE_KEYS.draft, "{not json at all");

    const read = readDraft();
    expect(read.status).toBe("recovered");
    expect(window.localStorage.getItem(STORAGE_KEYS.draft)).toBeNull();

    const quarantined = Object.keys(window.localStorage).filter((key) =>
      key.startsWith("framepilot:corrupt:"),
    );
    expect(quarantined.length).toBe(1);
  });

  it("quarantines data that no longer matches the schema", () => {
    window.localStorage.setItem(
      STORAGE_KEYS.draft,
      JSON.stringify({ schemaVersion: 1, updatedAt: "x", brief: { description: "too short" } }),
    );

    expect(readDraft().status).toBe("recovered");
    expect(window.localStorage.getItem(STORAGE_KEYS.draft)).toBeNull();
  });

  it("refuses to write an invalid draft", () => {
    const broken = { ...output, shots: [] } as typeof output;
    expect(writeDraft(brief, broken, "2026-05-01T10:00:00.000Z")).toEqual({
      status: "failed",
      reason: "unknown",
    });
  });

  it("reports a quota failure instead of throwing", () => {
    // jsdom exposes these on the prototype, so patch there.
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });

    expect(writeDraft(brief, output, "2026-05-01T10:00:00.000Z")).toEqual({
      status: "failed",
      reason: "quota",
    });
  });
});

describe("preferences storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to an empty preference set", () => {
    expect(readPreferences()).toEqual({ schemaVersion: 1 });
  });

  it("merges patches instead of replacing them", () => {
    writePreferences({ lastDirectoryId: "whimsical-fantasy" });
    writePreferences({ lastDuration: 30 });

    expect(readPreferences()).toEqual({
      schemaVersion: 1,
      lastDirectoryId: "whimsical-fantasy",
      lastDuration: 30,
    });
  });

  it("ignores stored preferences that fail validation", () => {
    window.localStorage.setItem(
      STORAGE_KEYS.preferences,
      JSON.stringify({ schemaVersion: 1, lastDuration: 11 }),
    );
    expect(readPreferences()).toEqual({ schemaVersion: 1 });
  });
});

describe("clearDraftAndProjects", () => {
  it("clears the draft but leaves other origins' keys and our preferences alone", () => {
    window.localStorage.setItem("unrelated:key", "keep me");
    writeDraft(brief, output, "2026-05-01T10:00:00.000Z");
    writePreferences({ lastDuration: 8 });

    clearDraftAndProjects();

    expect(window.localStorage.getItem("unrelated:key")).toBe("keep me");
    expect(readDraft()).toEqual({ status: "empty" });
    // Preferences are a convenience, not user work, so a reset keeps them.
    expect(readPreferences()).toEqual({ schemaVersion: 1, lastDuration: 8 });
  });
});
