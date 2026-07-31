import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
const fullBrief: SceneBrief = demo.brief;

/** Same scene with every optional field empty. */
const sparseBrief: SceneBrief = {
  ...fullBrief,
  primarySubject: "",
  targetAudience: "",
  onScreenText: "",
};

function seedDraft(brief: SceneBrief) {
  writeDraft(brief, generateDirection(brief, { now: "2026-05-01T10:00:00.000Z" }), "2026-05-01T10:00:00.000Z");
}

function toggle() {
  return screen.getByRole("button", { name: /show brief|hide brief/i });
}

describe("BriefPanel", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("is collapsed by default and announces its state", async () => {
    seedDraft(fullBrief);
    render(<ResultsWorkspace />);

    const button = await screen.findByRole("button", { name: /show brief/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
    // Present in the DOM but hidden, so it is out of the accessibility tree
    // and readable the moment it is expanded.
    expect(screen.getByText(fullBrief.description)).not.toBeVisible();
  });

  it("labels itself and says what it is for", async () => {
    seedDraft(fullBrief);
    render(<ResultsWorkspace />);

    expect(await screen.findByRole("heading", { name: "Brief" })).toBeInTheDocument();
    expect(screen.getByText("What this plan was directed from")).toBeInTheDocument();
  });

  it("toggles open and closed by keyboard, flipping aria-expanded", async () => {
    seedDraft(fullBrief);
    const user = userEvent.setup();
    render(<ResultsWorkspace />);

    const button = await screen.findByRole("button", { name: /show brief/i });
    button.focus();
    await user.keyboard("{Enter}");

    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(fullBrief.description)).toBeVisible();

    await user.keyboard("{Enter}");
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText(fullBrief.description)).not.toBeVisible();
  });

  it("shows the exact directed values for the current draft", async () => {
    seedDraft(fullBrief);
    const user = userEvent.setup();
    render(<ResultsWorkspace />);

    await user.click(await screen.findByRole("button", { name: /show brief/i }));

    const panel = screen.getByRole("heading", { name: "Brief" }).closest("section");
    expect(panel).not.toBeNull();
    if (!panel) {
      return;
    }
    const scope = within(panel);

    expect(scope.getByText(fullBrief.description)).toBeInTheDocument();
    expect(scope.getByText("Premium Product Film")).toBeInTheDocument();
    expect(scope.getByText("Promotion")).toBeInTheDocument();
    expect(scope.getByText("15 sec")).toBeInTheDocument();
    expect(scope.getByText("9:16 vertical")).toBeInTheDocument();
    expect(scope.getByText(fullBrief.primarySubject)).toBeInTheDocument();
    expect(scope.getByText(fullBrief.targetAudience)).toBeInTheDocument();
    expect(scope.getByText(fullBrief.onScreenText)).toBeInTheDocument();
  });

  it("omits optional rows that were never filled in", async () => {
    seedDraft(sparseBrief);
    const user = userEvent.setup();
    render(<ResultsWorkspace />);

    await user.click(await screen.findByRole("button", { name: /show brief/i }));

    expect(screen.getByText(sparseBrief.description)).toBeVisible();
    expect(screen.queryByText("Primary subject")).not.toBeInTheDocument();
    expect(screen.queryByText("Target audience")).not.toBeInTheDocument();
    expect(screen.queryByText("On-screen text")).not.toBeInTheDocument();
  });

  it("behaves identically for a reopened saved project", async () => {
    const output = generateDirection(fullBrief, { now: "2026-05-01T10:00:00.000Z" });
    const saved = saveProject(fullBrief, output, "2026-05-01T10:05:00.000Z");
    if (saved.status !== "ok") {
      throw new Error("save failed");
    }
    const user = userEvent.setup();
    render(<ResultsWorkspace source={{ kind: "project", id: saved.project.id }} />);

    const button = await screen.findByRole("button", { name: /show brief/i });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);
    expect(screen.getByText(fullBrief.description)).toBeVisible();
    expect(screen.getByText(fullBrief.onScreenText)).toBeVisible();
  });

  it("is read-only: no inputs inside the disclosure", async () => {
    seedDraft(fullBrief);
    const user = userEvent.setup();
    render(<ResultsWorkspace />);

    await user.click(await screen.findByRole("button", { name: /show brief/i }));

    const panel = screen.getByRole("heading", { name: "Brief" }).closest("section");
    expect(panel?.querySelectorAll("input, textarea, select")).toHaveLength(0);
  });
});
