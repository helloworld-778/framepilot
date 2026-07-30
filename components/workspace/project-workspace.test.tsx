import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResultsWorkspace } from "@/components/workspace/results-workspace";
import { DEMO_BRIEFS } from "@/data/demo-projects";
import { generateDirection } from "@/lib/director";
import { findProject, readProjects, saveProject } from "@/lib/project-store";
import { readDraft, writeDraft } from "@/lib/storage";
import type { DirectorOutput, SavedProject } from "@/types";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const demo = DEMO_BRIEFS[0];
if (!demo) {
  throw new Error("Demo briefs are missing");
}
const brief = demo.brief;

function editedOutput(): DirectorOutput {
  const output = generateDirection(brief, { now: "2026-05-01T10:00:00.000Z" });
  return {
    ...output,
    shots: output.shots.map((shot, index) =>
      index === 0 ? { ...shot, camera: "Locked, no move at all", edited: true } : shot,
    ),
  };
}

function seedProject(title = "Monsoon launch cut"): SavedProject {
  const result = saveProject(brief, editedOutput(), "2026-05-01T10:00:00.000Z", { title });
  if (result.status !== "ok") {
    throw new Error("save failed");
  }
  return result.project;
}

describe("ResultsWorkspace — saved project mode", () => {
  beforeEach(() => {
    push.mockClear();
    window.localStorage.clear();
  });

  it("restores the brief, storyboard, shot edits, and readiness score", async () => {
    const project = seedProject();
    render(<ResultsWorkspace source={{ kind: "project", id: project.id }} />);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Monsoon launch cut" }),
    ).toBeInTheDocument();

    // The saved edit and its badge survive the round trip.
    expect(screen.getByText("Locked, no move at all")).toBeInTheDocument();
    expect(screen.getByText("Edited")).toBeInTheDocument();

    for (const shot of project.output.shots) {
      expect(screen.getByRole("heading", { name: shot.title })).toBeInTheDocument();
    }

    expect(
      screen.getByRole("img", {
        name: new RegExp(`readiness ${project.output.readinessScore} out of 100`, "i"),
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(project.output.negativePrompt)).toBeInTheDocument();
  });

  it("offers Save changes rather than Save draft", async () => {
    const project = seedProject();
    render(<ResultsWorkspace source={{ kind: "project", id: project.id }} />);

    expect(await screen.findByRole("button", { name: /save changes/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save draft/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save as project/i })).not.toBeInTheDocument();
  });

  it("writes further edits back to the same project record", async () => {
    const project = seedProject();
    const user = userEvent.setup();
    render(<ResultsWorkspace source={{ kind: "project", id: project.id }} />);

    await user.click((await screen.findAllByRole("button", { name: /edit shot 2/i }))[0]!);
    const sound = screen.getByLabelText("Sound");
    await user.clear(sound);
    await user.type(sound, "Rain bed under a close pour");
    await user.click(screen.getByRole("button", { name: /save shot/i }));

    expect(await screen.findByText(/local edits are not saved yet/i)).toHaveTextContent(
      /save changes/i,
    );

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(findProject(project.id)?.output.shots[1]?.sound).toBe(
        "Rain bed under a close pour",
      ),
    );
    expect(readProjects()).toHaveLength(1);
    expect(findProject(project.id)?.createdAt).toBe(project.createdAt);
  });

  it("renames from the workspace action bar", async () => {
    const project = seedProject();
    const user = userEvent.setup();
    render(<ResultsWorkspace source={{ kind: "project", id: project.id }} />);

    await user.click(await screen.findByRole("button", { name: /^rename$/i }));
    const field = await screen.findByLabelText(/project name/i);
    await user.clear(field);
    await user.type(field, "Monsoon teaser");
    await user.click(screen.getByRole("button", { name: /save name/i }));

    await waitFor(() => expect(findProject(project.id)?.title).toBe("Monsoon teaser"));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Monsoon teaser" }),
    ).toBeInTheDocument();
  });

  it("explains itself when the project is not in this browser", () => {
    render(<ResultsWorkspace source={{ kind: "project", id: "missing-id" }} />);

    expect(
      screen.getByRole("heading", { name: /that project is not in this browser/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /saved projects/i })).toHaveAttribute(
      "href",
      "/projects",
    );
    expect(screen.getByRole("link", { name: /create a scene/i })).toHaveAttribute(
      "href",
      "/create",
    );
  });
});

describe("ResultsWorkspace — save as project", () => {
  beforeEach(() => {
    push.mockClear();
    window.localStorage.clear();
  });

  it("turns the current draft into a saved project and opens it", async () => {
    const output = editedOutput();
    writeDraft(brief, output, "2026-05-01T10:00:00.000Z");
    const user = userEvent.setup();
    render(<ResultsWorkspace />);

    await user.click(await screen.findByRole("button", { name: /save as project/i }));

    await waitFor(() => expect(readProjects()).toHaveLength(1));
    const [project] = readProjects();
    expect(project?.brief).toEqual(brief);
    expect(project?.output.shots[0]?.camera).toBe("Locked, no move at all");
    expect(project?.output.readinessScore).toBe(output.readinessScore);
    expect(push).toHaveBeenCalledWith(`/projects/${project?.id}`);

    // The draft is left alone, so the user has not lost their working copy.
    expect(readDraft().status).toBe("ok");
  });

  it("clears the draft and every project on reset", async () => {
    writeDraft(brief, editedOutput(), "2026-05-01T10:00:00.000Z");
    seedProject();
    const user = userEvent.setup();
    render(<ResultsWorkspace />);

    await user.click(await screen.findByRole("button", { name: /reset demo/i }));
    await user.click(await screen.findByRole("button", { name: /reset everything/i }));

    await waitFor(() => expect(readDraft()).toEqual({ status: "empty" }));
    expect(readProjects()).toEqual([]);
    expect(push).toHaveBeenCalledWith("/create");
  });

  it("links to the saved projects list from the action bar", async () => {
    writeDraft(brief, editedOutput(), "2026-05-01T10:00:00.000Z");
    render(<ResultsWorkspace />);

    expect(await screen.findByRole("link", { name: /saved projects/i })).toHaveAttribute(
      "href",
      "/projects",
    );
  });
});
