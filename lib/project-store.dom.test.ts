import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEMO_BRIEFS } from "@/data/demo-projects";
import { PROJECT_CAP, STORAGE_KEYS } from "@/lib/constants";
import { generateDirection } from "@/lib/director";
import {
  deleteProject,
  findProject,
  parseProjectsSnapshot,
  readProjects,
  renameProject,
  saveProject,
} from "@/lib/project-store";
import { readProjectsEnvelope } from "@/lib/storage";
import { savedProjectSchema } from "@/lib/schemas";
import type { SceneBrief } from "@/types";

const demo = DEMO_BRIEFS[0];
if (!demo) {
  throw new Error("Demo briefs are missing");
}
const brief: SceneBrief = demo.brief;
const output = generateDirection(brief, { now: "2026-05-01T10:00:00.000Z" });

/** Distinct briefs, so each save produces a distinct seed and id. */
function briefNumber(index: number): SceneBrief {
  return {
    ...brief,
    primarySubject: `subject variant ${index}`,
  };
}

function isoAt(minute: number): string {
  return `2026-05-01T${String(10 + Math.floor(minute / 60)).padStart(2, "0")}:${String(
    minute % 60,
  ).padStart(2, "0")}:00.000Z`;
}

describe("saveProject", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts with no projects", () => {
    expect(readProjects()).toEqual([]);
  });

  it("writes a valid, versioned saved record", () => {
    const result = saveProject(brief, output, "2026-05-01T10:00:00.000Z");
    expect(result.status).toBe("ok");

    const envelope = readProjectsEnvelope();
    expect(envelope.status).toBe("ok");
    if (envelope.status === "ok") {
      expect(envelope.value.schemaVersion).toBe(1);
      expect(envelope.value.projects).toHaveLength(1);
      const [project] = envelope.value.projects;
      expect(() => savedProjectSchema.parse(project)).not.toThrow();
      expect(project?.title).toBe(output.projectTitle);
      expect(project?.createdAt).toBe("2026-05-01T10:00:00.000Z");
      expect(project?.updatedAt).toBe("2026-05-01T10:00:00.000Z");
      expect(project?.output.shots).toEqual(output.shots);
      expect(project?.output.readinessScore).toBe(output.readinessScore);
    }
  });

  it("keeps local shot edits inside the saved record", () => {
    const editedShots = output.shots.map((shot, index) =>
      index === 0 ? { ...shot, camera: "Locked, no move at all", edited: true } : shot,
    );
    saveProject(brief, { ...output, shots: editedShots }, "2026-05-01T10:00:00.000Z");

    const [project] = readProjects();
    expect(project?.output.shots[0]?.camera).toBe("Locked, no move at all");
    expect(project?.output.shots[0]?.edited).toBe(true);
  });

  it("accepts an explicit title", () => {
    saveProject(brief, output, isoAt(0), { title: "  Monsoon launch cut  " });
    expect(readProjects()[0]?.title).toBe("Monsoon launch cut");
  });

  it("updates in place when saving over an existing project", () => {
    const first = saveProject(brief, output, isoAt(0));
    expect(first.status).toBe("ok");
    if (first.status !== "ok") {
      return;
    }

    const second = saveProject(brief, output, isoAt(30), { existingId: first.project.id });
    expect(second.status).toBe("ok");

    const projects = readProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0]?.id).toBe(first.project.id);
    expect(projects[0]?.createdAt).toBe(isoAt(0));
    expect(projects[0]?.updatedAt).toBe(isoAt(30));
  });

  it("lists newest first", () => {
    saveProject(briefNumber(1), generateDirection(briefNumber(1)), isoAt(0));
    saveProject(briefNumber(2), generateDirection(briefNumber(2)), isoAt(10));
    saveProject(briefNumber(3), generateDirection(briefNumber(3)), isoAt(5));

    expect(readProjects().map((project) => project.updatedAt)).toEqual([
      isoAt(10),
      isoAt(5),
      isoAt(0),
    ]);
  });

  it("caps the list and evicts the oldest by updatedAt", () => {
    for (let index = 0; index < PROJECT_CAP; index += 1) {
      const variant = briefNumber(index);
      saveProject(variant, generateDirection(variant), isoAt(index));
    }
    expect(readProjects()).toHaveLength(PROJECT_CAP);
    const oldest = readProjects().at(-1);
    expect(oldest?.updatedAt).toBe(isoAt(0));

    const extra = briefNumber(999);
    const result = saveProject(extra, generateDirection(extra), isoAt(500));

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.total).toBe(PROJECT_CAP);
      expect(result.evicted).toHaveLength(1);
      expect(result.evicted[0]?.updatedAt).toBe(isoAt(0));
    }

    const projects = readProjects();
    expect(projects).toHaveLength(PROJECT_CAP);
    expect(projects.some((project) => project.updatedAt === isoAt(0))).toBe(false);
    expect(projects[0]?.updatedAt).toBe(isoAt(500));
  });

  it("reports a quota failure rather than throwing", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });

    expect(saveProject(brief, output, isoAt(0))).toEqual({
      status: "failed",
      reason: "quota",
    });
  });
});

describe("findProject", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("restores brief, output, edits, score, and timestamps", () => {
    const editedShots = output.shots.map((shot, index) =>
      index === 1 ? { ...shot, sound: "Room tone only", edited: true } : shot,
    );
    const edited = { ...output, shots: editedShots };
    const saved = saveProject(brief, edited, isoAt(0));
    expect(saved.status).toBe("ok");
    if (saved.status !== "ok") {
      return;
    }

    const found = findProject(saved.project.id);
    expect(found?.brief).toEqual(brief);
    expect(found?.output.shots[1]?.sound).toBe("Room tone only");
    expect(found?.output.shots[1]?.edited).toBe(true);
    expect(found?.output.readinessScore).toBe(edited.readinessScore);
    expect(found?.createdAt).toBe(isoAt(0));
  });

  it("returns undefined for an unknown id", () => {
    expect(findProject("does-not-exist")).toBeUndefined();
  });
});

describe("renameProject", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists a new title and bumps updatedAt", () => {
    const saved = saveProject(brief, output, isoAt(0));
    if (saved.status !== "ok") {
      throw new Error("save failed");
    }

    const result = renameProject(saved.project.id, "  Monsoon teaser  ", isoAt(20));
    expect(result.status).toBe("ok");

    const found = findProject(saved.project.id);
    expect(found?.title).toBe("Monsoon teaser");
    expect(found?.updatedAt).toBe(isoAt(20));
    expect(found?.createdAt).toBe(isoAt(0));
  });

  it("refuses an empty title and an unknown id", () => {
    const saved = saveProject(brief, output, isoAt(0));
    if (saved.status !== "ok") {
      throw new Error("save failed");
    }

    expect(renameProject(saved.project.id, "   ", isoAt(20)).status).toBe("failed");
    expect(renameProject("nope", "Title", isoAt(20))).toEqual({
      status: "failed",
      reason: "missing",
    });
    expect(findProject(saved.project.id)?.title).toBe(output.projectTitle);
  });
});

describe("deleteProject", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("removes only the chosen project", () => {
    const a = saveProject(briefNumber(1), generateDirection(briefNumber(1)), isoAt(0));
    const b = saveProject(briefNumber(2), generateDirection(briefNumber(2)), isoAt(10));
    if (a.status !== "ok" || b.status !== "ok") {
      throw new Error("save failed");
    }

    expect(deleteProject(a.project.id).status).toBe("ok");

    const remaining = readProjects();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.id).toBe(b.project.id);
  });

  it("reports a missing project instead of failing silently", () => {
    expect(deleteProject("nope")).toEqual({ status: "failed", reason: "missing" });
  });
});

describe("corrupt project data", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("quarantines unparseable data and recovers to an empty list", () => {
    window.localStorage.setItem(STORAGE_KEYS.projects, "{not json");

    expect(readProjectsEnvelope().status).toBe("recovered");
    expect(readProjects()).toEqual([]);
    expect(window.localStorage.getItem(STORAGE_KEYS.projects)).toBeNull();
    expect(
      Object.keys(window.localStorage).filter((key) =>
        key.startsWith("framepilot:corrupt:"),
      ),
    ).toHaveLength(1);
  });

  it("quarantines records that no longer match the schema", () => {
    window.localStorage.setItem(
      STORAGE_KEYS.projects,
      JSON.stringify({ schemaVersion: 1, projects: [{ id: "x", title: "" }] }),
    );

    expect(readProjectsEnvelope().status).toBe("recovered");
    expect(window.localStorage.getItem(STORAGE_KEYS.projects)).toBeNull();
  });

  it("reports unreadable snapshots to the UI layer", () => {
    expect(parseProjectsSnapshot("{not json")).toEqual({
      status: "unreadable",
      projects: [],
    });
    expect(parseProjectsSnapshot(null)).toEqual({ status: "empty", projects: [] });
  });

  it("keeps saving possible after a recovery", () => {
    window.localStorage.setItem(STORAGE_KEYS.projects, "{not json");
    readProjects();

    expect(saveProject(brief, output, isoAt(0)).status).toBe("ok");
    expect(readProjects()).toHaveLength(1);
  });
});
