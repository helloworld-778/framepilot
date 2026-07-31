import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SceneBriefForm } from "@/components/scene-form/scene-brief-form";
import { ResultsWorkspace } from "@/components/workspace/results-workspace";
import { DEMO_BRIEFS } from "@/data/demo-projects";
import { STORAGE_KEYS } from "@/lib/constants";
import { generateDirection } from "@/lib/director";
import { findProject, readProjects, saveProject } from "@/lib/project-store";
import { readDraft, writeDraft } from "@/lib/storage";
import type { DirectorOutput, SavedProject, SceneBrief } from "@/types";

const push = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/create",
  useSearchParams: () => searchParams,
}));

const demo = DEMO_BRIEFS[0];
const otherDemo = DEMO_BRIEFS[3];
if (!demo || !otherDemo) {
  throw new Error("Demo briefs are missing");
}
const brief: SceneBrief = demo.brief;

function editedOutput(source: SceneBrief, at = "2026-05-01T09:00:00.000Z"): DirectorOutput {
  const generated = generateDirection(source, { now: at });
  return {
    ...generated,
    shots: generated.shots.map((shot, index) =>
      index === 0 ? { ...shot, camera: "Locked, no move at all", edited: true } : shot,
    ),
  };
}

function seedDraft(source: SceneBrief, at = "2026-05-01T09:30:00.000Z") {
  writeDraft(source, editedOutput(source), at);
  const raw = window.localStorage.getItem(STORAGE_KEYS.draft);
  if (!raw) {
    throw new Error("failed to seed draft");
  }
  return raw;
}

function seedProject(source: SceneBrief): SavedProject {
  const result = saveProject(source, editedOutput(source), "2026-05-01T08:00:00.000Z", {
    title: "Monsoon launch cut",
  });
  if (result.status !== "ok") {
    throw new Error("failed to seed project");
  }
  return result.project;
}

function submitButton() {
  return screen.getByRole("button", { name: /re-direct scene|direct my scene/i });
}

beforeEach(() => {
  push.mockClear();
  searchParams = new URLSearchParams();
  window.localStorage.clear();
});

describe("Edit brief entry points", () => {
  it("offers Edit brief for the current draft, pointing at draft edit mode", async () => {
    writeDraft(brief, editedOutput(brief), "2026-05-01T09:30:00.000Z");
    render(<ResultsWorkspace />);

    expect(await screen.findByRole("link", { name: /edit brief/i })).toHaveAttribute(
      "href",
      "/create?edit=draft",
    );
  });

  it("offers Edit brief for a saved project, passing only its id", async () => {
    const project = seedProject(brief);
    render(<ResultsWorkspace source={{ kind: "project", id: project.id }} />);

    const link = await screen.findByRole("link", { name: /edit brief/i });
    expect(link).toHaveAttribute(
      "href",
      `/create?edit=project&id=${encodeURIComponent(project.id)}`,
    );
    // The brief itself is never serialised into the URL.
    expect(link.getAttribute("href")).not.toContain(brief.description.slice(0, 12));
  });
});

describe("editing the current working draft", () => {
  it("prefills all nine values and identifies the mode", async () => {
    seedDraft(brief);
    searchParams = new URLSearchParams("edit=draft");
    render(<SceneBriefForm />);

    await waitFor(() =>
      expect((screen.getByLabelText(/scene description/i) as HTMLTextAreaElement).value).toBe(
        brief.description,
      ),
    );
    expect(screen.getByLabelText(/primary subject/i)).toHaveValue(brief.primarySubject);
    expect(screen.getByLabelText(/target audience/i)).toHaveValue(brief.targetAudience);
    expect(screen.getByLabelText(/on-screen text/i)).toHaveValue(brief.onScreenText);
    expect(screen.getByRole("radio", { name: /premium product film/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /^promotion/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /15 sec/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /9:16/i })).toBeChecked();

    expect(screen.getByText("Editing your current working brief")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Re-directing replaces this working draft with a new plan. Your current shot edits will be replaced.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /re-direct scene/i })).toBeInTheDocument();
  });

  it("re-directs in place with no redundant replacement dialog", async () => {
    seedDraft(brief);
    searchParams = new URLSearchParams("edit=draft");
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await waitFor(() => expect(screen.getByLabelText(/primary subject/i)).toHaveValue(brief.primarySubject));

    await user.click(screen.getByRole("radio", { name: /30 sec/i }));
    await user.click(submitButton());

    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const stored = readDraft();
    expect(stored.status).toBe("ok");
    if (stored.status === "ok") {
      expect(stored.value.brief.duration).toBe(30);
      expect(stored.value.output.meta.totalDurationSeconds).toBe(30);
      // The revised brief produced a new plan, and the old shot edit is gone.
      expect(stored.value.output.shots.every((shot) => !shot.edited)).toBe(true);
      expect(
        stored.value.output.shots.some((shot) => shot.camera === "Locked, no move at all"),
      ).toBe(false);
    }
  });

  it("changing the direction changes the generated structure", async () => {
    seedDraft(brief);
    searchParams = new URLSearchParams("edit=draft");
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await waitFor(() => expect(screen.getByLabelText(/primary subject/i)).toHaveValue(brief.primarySubject));

    await user.click(screen.getByRole("radio", { name: /nonlinear suspense/i }));
    await user.click(submitButton());

    await waitFor(() => expect(push).toHaveBeenCalled());
    const stored = readDraft();
    if (stored.status === "ok") {
      expect(stored.value.brief.directoryId).toBe("nonlinear-suspense");
      expect(stored.value.output.directoryId).toBe("nonlinear-suspense");
      expect(stored.value.output.shots[0]?.role).toBe("withhold");
    }
  });

  it("falls back to the Pass 1 guard when the stored draft changed meanwhile", async () => {
    seedDraft(brief);
    searchParams = new URLSearchParams("edit=draft");
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await waitFor(() => expect(screen.getByLabelText(/primary subject/i)).toHaveValue(brief.primarySubject));

    // Another tab replaces the draft while this brief is being revised.
    const newerRaw = seedDraft(otherDemo.brief, "2026-05-01T11:00:00.000Z");

    await user.click(submitButton());

    expect(await screen.findByRole("dialog")).toHaveTextContent("Replace current draft?");
    expect(window.localStorage.getItem(STORAGE_KEYS.draft)).toBe(newerRaw);
    expect(push).not.toHaveBeenCalled();
  });

  it("offers a way back to the workspace", async () => {
    seedDraft(brief);
    searchParams = new URLSearchParams("edit=draft");
    render(<SceneBriefForm />);

    expect(await screen.findByRole("link", { name: /back to workspace/i })).toHaveAttribute(
      "href",
      "/workspace",
    );
  });

  it("confirms before discarding typed changes on the way out", async () => {
    seedDraft(brief);
    searchParams = new URLSearchParams("edit=draft");
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await waitFor(() => expect(screen.getByLabelText(/primary subject/i)).toHaveValue(brief.primarySubject));
    await user.type(screen.getByLabelText(/primary subject/i), " and a second cup");

    // The plain link is replaced by a guarded control once the form is dirty.
    expect(screen.queryByRole("link", { name: /back to workspace/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /back to workspace/i }));

    expect(await screen.findByRole("dialog")).toHaveTextContent(/discard brief changes\?/i);
    expect(push).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /discard changes/i }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));
  });
});

describe("editing a saved project's brief", () => {
  it("prefills from the project and states that the project will not change", async () => {
    const project = seedProject(brief);
    searchParams = new URLSearchParams(`edit=project&id=${project.id}`);
    render(<SceneBriefForm />);

    await waitFor(() =>
      expect((screen.getByLabelText(/scene description/i) as HTMLTextAreaElement).value).toBe(
        brief.description,
      ),
    );
    expect(screen.getByText("Editing a saved project’s brief")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Re-directing creates a new working draft. This saved project will not change.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to project/i })).toHaveAttribute(
      "href",
      `/projects/${project.id}`,
    );
  });

  it("creates a working draft and leaves the project byte-for-byte unchanged", async () => {
    const project = seedProject(brief);
    const projectsRaw = window.localStorage.getItem(STORAGE_KEYS.projects);
    searchParams = new URLSearchParams(`edit=project&id=${project.id}`);
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await waitFor(() => expect(screen.getByLabelText(/primary subject/i)).toHaveValue(brief.primarySubject));

    await user.click(screen.getByRole("radio", { name: /30 sec/i }));
    await user.click(submitButton());

    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));

    // The project is untouched, including its saved shot edit.
    expect(window.localStorage.getItem(STORAGE_KEYS.projects)).toBe(projectsRaw);
    expect(readProjects()).toHaveLength(1);
    const reread = findProject(project.id);
    expect(reread).toEqual(project);
    expect(reread?.brief.duration).toBe(15);
    expect(reread?.output.shots[0]?.camera).toBe("Locked, no move at all");

    // The new plan became the working draft only.
    const stored = readDraft();
    expect(stored.status).toBe("ok");
    if (stored.status === "ok") {
      expect(stored.value.brief.duration).toBe(30);
    }
  });

  it("invokes the Pass 1 guard when a different working draft already exists", async () => {
    const project = seedProject(brief);
    const draftRaw = seedDraft(otherDemo.brief, "2026-05-01T10:00:00.000Z");
    searchParams = new URLSearchParams(`edit=project&id=${project.id}`);
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await waitFor(() => expect(screen.getByLabelText(/primary subject/i)).toHaveValue(brief.primarySubject));
    await user.click(submitButton());

    expect(await screen.findByRole("dialog")).toHaveTextContent("Replace current draft?");
    expect(window.localStorage.getItem(STORAGE_KEYS.draft)).toBe(draftRaw);
    expect(push).not.toHaveBeenCalled();

    // Pass 1's actions still work from here.
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(window.localStorage.getItem(STORAGE_KEYS.draft)).toBe(draftRaw);
  });
});

describe("edit-mode recovery", () => {
  it("explains a missing draft and keeps a usable new-brief flow", async () => {
    searchParams = new URLSearchParams("edit=draft");
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    expect(
      await screen.findByText(/that working draft is no longer in this browser/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /direct my scene/i })).toBeInTheDocument();
    expect(screen.queryByText("Editing your current working brief")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(/scene description/i));
    await user.paste(
      "A quiet workshop at first light while someone lays out tools across a scarred bench.",
    );
    await user.click(submitButton());

    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));
  });

  it("explains a missing project without fabricating a brief", async () => {
    searchParams = new URLSearchParams("edit=project&id=not-a-real-id");
    render(<SceneBriefForm />);

    expect(
      await screen.findByText(/that saved project is not in this browser/i),
    ).toBeInTheDocument();
    expect((screen.getByLabelText(/scene description/i) as HTMLTextAreaElement).value).toBe("");
  });

  it("leaves the normal create experience alone without edit context", async () => {
    render(<SceneBriefForm />);

    expect(screen.getByRole("button", { name: /direct my scene/i })).toBeInTheDocument();
    expect(screen.queryByText(/editing/i)).not.toBeInTheDocument();
    expect(screen.getByText("Runs locally. Nothing is sent anywhere.")).toBeInTheDocument();
  });
});
