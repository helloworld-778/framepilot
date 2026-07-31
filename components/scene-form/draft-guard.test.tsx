import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SceneBriefForm } from "@/components/scene-form/scene-brief-form";
import { DEMO_BRIEFS } from "@/data/demo-projects";
import { STORAGE_KEYS } from "@/lib/constants";
import { generateDirection } from "@/lib/director";
import { readProjects } from "@/lib/project-store";
import { readDraft, writeDraft } from "@/lib/storage";
import type { DirectorOutput, SceneBrief } from "@/types";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/create",
  useSearchParams: () => new URLSearchParams(),
}));

/** The scene already in the draft slot, carrying a local shot edit. */
const existingDemo = DEMO_BRIEFS[3];
if (!existingDemo) {
  throw new Error("Demo briefs are missing");
}
const existingBrief: SceneBrief = existingDemo.brief;

const NEW_DESCRIPTION =
  "A rooftop terrace at dusk while a small crew sets up string lights and someone carries chairs across the tiles.";

function seedExistingDraft(): { output: DirectorOutput; raw: string } {
  const generated = generateDirection(existingBrief, { now: "2026-05-01T09:00:00.000Z" });
  const output: DirectorOutput = {
    ...generated,
    shots: generated.shots.map((shot, index) =>
      index === 0 ? { ...shot, camera: "Locked, no move at all", edited: true } : shot,
    ),
  };
  writeDraft(existingBrief, output, "2026-05-01T09:30:00.000Z");
  const raw = window.localStorage.getItem(STORAGE_KEYS.draft);
  if (!raw) {
    throw new Error("Failed to seed the draft");
  }
  return { output, raw };
}

async function typeNewBrief(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText(/scene description/i));
  await user.paste(NEW_DESCRIPTION);
  await user.type(screen.getByLabelText(/primary subject/i), "string lights being hung");
}

function submitButton() {
  return screen.getByRole("button", { name: /direct my scene/i });
}

describe("draft safety guard", () => {
  beforeEach(() => {
    push.mockClear();
    window.localStorage.clear();
  });

  it("does not appear when there is no stored draft, and directs as before", async () => {
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await typeNewBrief(user);
    await user.click(submitButton());

    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const stored = readDraft();
    expect(stored.status).toBe("ok");
    if (stored.status === "ok") {
      expect(stored.value.brief.description).toBe(NEW_DESCRIPTION);
    }
  });

  it("opens the guard and touches nothing when a draft already exists", async () => {
    const { raw } = seedExistingDraft();
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await typeNewBrief(user);
    await user.click(submitButton());

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Replace current draft?");
    expect(dialog).toHaveTextContent(
      "FramePilot keeps one working draft in this browser. Directing this scene will replace the current draft.",
    );

    // Nothing written, nothing navigated, nothing archived.
    expect(window.localStorage.getItem(STORAGE_KEYS.draft)).toBe(raw);
    expect(push).not.toHaveBeenCalled();
    expect(readProjects()).toHaveLength(0);
  });

  it("offers replace, save-first, and cancel in that order", async () => {
    seedExistingDraft();
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await typeNewBrief(user);
    await user.click(submitButton());
    await screen.findByRole("dialog");

    const labels = screen
      .getAllByRole("button")
      .map((button) => button.textContent?.trim())
      .filter((label): label is string =>
        Boolean(
          label &&
            /^(Replace draft|Save current draft first|Cancel)$/.test(label.replace(/\s+/g, " ")),
        ),
      );
    expect(labels).toEqual(["Replace draft", "Save current draft first", "Cancel"]);
  });

  describe("cancel", () => {
    it("closes, mutates nothing, keeps typed values, and restores focus", async () => {
      const { raw } = seedExistingDraft();
      const user = userEvent.setup();
      render(<SceneBriefForm />);

      await typeNewBrief(user);
      await user.click(submitButton());
      await screen.findByRole("dialog");

      await user.click(screen.getByRole("button", { name: /^cancel$/i }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(window.localStorage.getItem(STORAGE_KEYS.draft)).toBe(raw);
      expect(readProjects()).toHaveLength(0);
      expect(push).not.toHaveBeenCalled();

      // Typed values survive.
      expect((screen.getByLabelText(/scene description/i) as HTMLTextAreaElement).value).toBe(
        NEW_DESCRIPTION,
      );
      expect(screen.getByLabelText(/primary subject/i)).toHaveValue(
        "string lights being hung",
      );

      await waitFor(() => expect(submitButton()).toHaveFocus());
    });

    it("closes on Escape without mutating anything", async () => {
      const { raw } = seedExistingDraft();
      const user = userEvent.setup();
      render(<SceneBriefForm />);

      await typeNewBrief(user);
      await user.click(submitButton());
      await screen.findByRole("dialog");

      await user.keyboard("{Escape}");

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(window.localStorage.getItem(STORAGE_KEYS.draft)).toBe(raw);
      expect(push).not.toHaveBeenCalled();
    });

    it("can be reopened after cancelling, with no stale state", async () => {
      seedExistingDraft();
      const user = userEvent.setup();
      render(<SceneBriefForm />);

      await typeNewBrief(user);
      await user.click(submitButton());
      await screen.findByRole("dialog");
      await user.click(screen.getByRole("button", { name: /^cancel$/i }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

      await user.click(submitButton());
      expect(await screen.findByRole("dialog")).toHaveTextContent("Replace current draft?");
    });
  });

  describe("replace draft", () => {
    it("replaces only after confirmation and continues to the workspace", async () => {
      seedExistingDraft();
      const user = userEvent.setup();
      render(<SceneBriefForm />);

      await typeNewBrief(user);
      await user.click(submitButton());
      await screen.findByRole("dialog");

      await user.click(screen.getByRole("button", { name: /^replace draft$/i }));

      await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));
      const stored = readDraft();
      expect(stored.status).toBe("ok");
      if (stored.status === "ok") {
        expect(stored.value.brief.description).toBe(NEW_DESCRIPTION);
        expect(stored.value.brief.primarySubject).toBe("string lights being hung");
      }
    });

    it("does not turn the discarded draft into a project", async () => {
      seedExistingDraft();
      const user = userEvent.setup();
      render(<SceneBriefForm />);

      await typeNewBrief(user);
      await user.click(submitButton());
      await screen.findByRole("dialog");
      await user.click(screen.getByRole("button", { name: /^replace draft$/i }));

      await waitFor(() => expect(push).toHaveBeenCalled());
      expect(readProjects()).toHaveLength(0);
    });
  });

  describe("save current draft first", () => {
    it("archives the old draft verbatim, then replaces it and continues", async () => {
      const { output } = seedExistingDraft();
      const user = userEvent.setup();
      render(<SceneBriefForm />);

      await typeNewBrief(user);
      await user.click(submitButton());
      await screen.findByRole("dialog");

      await user.click(screen.getByRole("button", { name: /save current draft first/i }));

      await waitFor(() => expect(readProjects()).toHaveLength(1));
      const [project] = readProjects();

      // The saved project is the OLD draft, not the newly typed scene.
      expect(project?.brief).toEqual(existingBrief);
      expect(project?.title).toBe(output.projectTitle);

      // Regeneration would change the seed and drop the local edit; neither happens.
      expect(project?.output).toEqual(output);
      expect(project?.output.meta.seed).toBe(output.meta.seed);
      expect(project?.output.shots[0]?.camera).toBe("Locked, no move at all");
      expect(project?.output.shots[0]?.edited).toBe(true);

      // Then the draft is replaced by the new scene and the flow continues.
      await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));
      const stored = readDraft();
      expect(stored.status).toBe("ok");
      if (stored.status === "ok") {
        expect(stored.value.brief.description).toBe(NEW_DESCRIPTION);
      }
    });

    it("keeps the draft and the dialog when saving fails, and reports it", async () => {
      const { raw } = seedExistingDraft();
      const user = userEvent.setup();
      render(<SceneBriefForm />);

      await typeNewBrief(user);
      await user.click(submitButton());
      await screen.findByRole("dialog");

      // Storage refuses every further write.
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError");
      });

      await user.click(screen.getByRole("button", { name: /save current draft first/i }));

      // Reported on the button and again in the live region.
      await waitFor(() =>
        expect(screen.getAllByText(/could not save the current draft/i)).toHaveLength(2),
      );

      // Nothing replaced, nothing archived, nowhere navigated, dialog still usable.
      expect(window.localStorage.getItem(STORAGE_KEYS.draft)).toBe(raw);
      expect(readProjects()).toHaveLength(0);
      expect(push).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^replace draft$/i })).toBeEnabled();
      expect(screen.getByRole("button", { name: /^cancel$/i })).toBeEnabled();
    });
  });

  it("guards against a draft written after the form first rendered", async () => {
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await typeNewBrief(user);

    // Another tab, or a save elsewhere, lands a draft mid-session.
    const { raw } = seedExistingDraft();

    await user.click(submitButton());

    expect(await screen.findByRole("dialog")).toHaveTextContent("Replace current draft?");
    expect(window.localStorage.getItem(STORAGE_KEYS.draft)).toBe(raw);
    expect(push).not.toHaveBeenCalled();
  });

  it("treats a corrupt draft as no draft and leaves quarantine behaviour alone", async () => {
    window.localStorage.setItem(STORAGE_KEYS.draft, "{not json");
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await typeNewBrief(user);
    await user.click(submitButton());

    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      Object.keys(window.localStorage).filter((key) =>
        key.startsWith("framepilot:corrupt:"),
      ),
    ).toHaveLength(1);
  });
});
