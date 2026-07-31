import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResultsWorkspace } from "@/components/workspace/results-workspace";
import { DEMO_BRIEFS } from "@/data/demo-projects";
import { generateDirection } from "@/lib/director";
import { saveProject } from "@/lib/project-store";
import { writeDraft } from "@/lib/storage";
import type { SceneBrief } from "@/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/workspace",
  useSearchParams: () => new URLSearchParams(),
}));

const demo = DEMO_BRIEFS[0];
if (!demo) {
  throw new Error("Demo briefs are missing");
}
const brief: SceneBrief = demo.brief;

const READINESS_COPY =
  "This scores how ready the brief and plan are to hand to a generator — not the quality of the finished video.";
const DRAFT_COPY = "Working draft: one scene you can keep refining in this browser.";
const PROJECT_COPY = "Saved projects: separate local copies you can reopen later.";
const TIMING_COPY =
  "Shot timings are set by the selected runtime so the storyboard adds up exactly.";

function seedDraft() {
  writeDraft(
    brief,
    generateDirection(brief, { now: "2026-05-01T10:00:00.000Z" }),
    "2026-05-01T10:00:00.000Z",
  );
}

describe("readiness explanation", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("states what the score means, with no interaction required", async () => {
    seedDraft();
    render(<ResultsWorkspace />);

    const panel = (await screen.findByRole("heading", { name: /production readiness/i })).closest(
      "section",
    );
    expect(panel).not.toBeNull();
    if (!panel) {
      return;
    }

    const explanation = within(panel).getByText(READINESS_COPY);
    // Permanently visible: not behind a tooltip, disclosure, or hover state.
    expect(explanation).toBeVisible();
  });

  it("associates the explanation with the score for assistive technology", async () => {
    seedDraft();
    render(<ResultsWorkspace />);

    const dial = await screen.findByRole("img", { name: /production readiness/i });
    const describedBy = dial.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy ?? "")?.textContent).toBe(READINESS_COPY);
  });

  it("keeps the band label and score alongside it", async () => {
    seedDraft();
    const output = generateDirection(brief, { now: "2026-05-01T10:00:00.000Z" });
    render(<ResultsWorkspace />);

    expect(
      await screen.findByRole("img", {
        name: new RegExp(`readiness ${output.readinessScore} out of 100`, "i"),
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(READINESS_COPY)).toBeVisible();
  });

  it("shows it for a reopened saved project too", async () => {
    const output = generateDirection(brief, { now: "2026-05-01T10:00:00.000Z" });
    const saved = saveProject(brief, output, "2026-05-01T10:05:00.000Z");
    if (saved.status !== "ok") {
      throw new Error("save failed");
    }
    render(<ResultsWorkspace source={{ kind: "project", id: saved.project.id }} />);

    expect(await screen.findByText(READINESS_COPY)).toBeVisible();
  });
});

describe("working draft versus saved projects", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("explains both before the save actions are used", async () => {
    seedDraft();
    render(<ResultsWorkspace />);

    const draftLine = await screen.findByText(DRAFT_COPY);
    const projectLine = screen.getByText(PROJECT_COPY);
    expect(draftLine).toBeVisible();
    expect(projectLine).toBeVisible();

    // Present in the same region as the save controls, ahead of them in the DOM.
    const saveButton = screen.getByRole("button", { name: /save draft/i });
    expect(draftLine.compareDocumentPosition(saveButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(projectLine.compareDocumentPosition(saveButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("appears in saved-project mode as well", async () => {
    const output = generateDirection(brief, { now: "2026-05-01T10:00:00.000Z" });
    const saved = saveProject(brief, output, "2026-05-01T10:05:00.000Z");
    if (saved.status !== "ok") {
      throw new Error("save failed");
    }
    render(<ResultsWorkspace source={{ kind: "project", id: saved.project.id }} />);

    expect(await screen.findByText(DRAFT_COPY)).toBeVisible();
    expect(screen.getByText(PROJECT_COPY)).toBeVisible();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("claims nothing about cloud storage, sync, sharing, or accounts", async () => {
    seedDraft();
    render(<ResultsWorkspace />);
    await screen.findByText(DRAFT_COPY);

    const text = document.body.textContent ?? "";
    for (const banned of [
      "cloud",
      "Cloud",
      "sync",
      "Sync",
      "backup",
      "backed up",
      "account",
      "Account",
      "share",
      "Shared",
      "collaborat",
      "unlimited",
    ]) {
      expect(text).not.toContain(banned);
    }
  });

  it("leaves the existing action labels unchanged", async () => {
    seedDraft();
    render(<ResultsWorkspace />);

    expect(await screen.findByRole("button", { name: /save draft/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save as project/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download json/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset demo/i })).toBeInTheDocument();
  });
});

describe("fixed shot timings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("explains the timings inside the storyboard timeline", async () => {
    seedDraft();
    render(<ResultsWorkspace />);

    const timelineHeading = await screen.findByRole("heading", {
      name: /storyboard timeline/i,
    });
    const section = timelineHeading.closest("section");
    expect(section).not.toBeNull();
    if (!section) {
      return;
    }

    expect(within(section).getByText(TIMING_COPY)).toBeVisible();
  });

  it("does not offer any way to edit a duration", async () => {
    seedDraft();
    render(<ResultsWorkspace />);

    const timelineHeading = await screen.findByRole("heading", {
      name: /storyboard timeline/i,
    });
    const section = timelineHeading.closest("section");
    expect(section?.querySelectorAll("input, textarea, select, [role='slider']")).toHaveLength(0);
  });

  it("keeps the timeline's keyboard instructions intact", async () => {
    seedDraft();
    render(<ResultsWorkspace />);

    const group = await screen.findByRole("group", {
      name: /shot timeline\. use the arrow keys to move between shots\./i,
    });
    expect(group).toBeInTheDocument();
    // The explanation sits outside the segment group, so it cannot obscure it.
    expect(within(group).queryByText(TIMING_COPY)).not.toBeInTheDocument();
  });

  it("still shows every truthful shot duration", async () => {
    seedDraft();
    const output = generateDirection(brief, { now: "2026-05-01T10:00:00.000Z" });
    render(<ResultsWorkspace />);

    const group = await screen.findByRole("group", { name: /shot timeline/i });
    const total = output.shots.reduce((sum, shot) => sum + shot.durationSeconds, 0);
    expect(total).toBe(brief.duration);
    for (const shot of output.shots) {
      expect(within(group).getAllByText(`${shot.durationSeconds}s`).length).toBeGreaterThan(0);
    }
  });
});
