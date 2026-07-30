import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResultsWorkspace } from "@/components/workspace/results-workspace";
import { DEMO_BRIEFS } from "@/data/demo-projects";
import { generateDirection } from "@/lib/director";
import { readDraft, writeDraft } from "@/lib/storage";
import type { DirectorOutput } from "@/types";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const demo = DEMO_BRIEFS[0];
if (!demo) {
  throw new Error("Demo briefs are missing");
}

const demoBrief = demo.brief;

function seedDraft(): DirectorOutput {
  const output = generateDirection(demoBrief, { now: "2026-05-01T10:00:00.000Z" });
  writeDraft(demoBrief, output, "2026-05-01T10:00:00.000Z");
  return output;
}

describe("ResultsWorkspace", () => {
  beforeEach(() => {
    push.mockClear();
    window.localStorage.clear();
  });

  it("invites the user to start when there is no draft", () => {
    render(<ResultsWorkspace />);

    expect(
      screen.getByRole("heading", { name: /no scene in the workspace yet/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create a scene/i })).toHaveAttribute(
      "href",
      "/create",
    );
  });

  it("renders the saved plan: title, rationale, timeline, shots, prompts, score", async () => {
    const output = seedDraft();
    render(<ResultsWorkspace />);

    expect(
      await screen.findByRole("heading", { level: 1, name: output.projectTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(output.creativeRationale)).toBeInTheDocument();
    expect(screen.getByText(output.logline)).toBeInTheDocument();

    for (const shot of output.shots) {
      expect(screen.getByRole("heading", { name: shot.title })).toBeInTheDocument();
    }

    const timeline = screen.getByRole("group", { name: /shot timeline/i });
    expect(within(timeline).getAllByRole("button")).toHaveLength(output.shots.length);

    expect(
      screen.getByRole("img", {
        name: new RegExp(`readiness ${output.readinessScore} out of 100`, "i"),
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(output.negativePrompt)).toBeInTheDocument();
  });

  it("moves between timeline segments with the arrow keys", async () => {
    const output = seedDraft();
    const user = userEvent.setup();
    render(<ResultsWorkspace />);

    const timeline = await screen.findByRole("group", { name: /shot timeline/i });
    const segments = within(timeline).getAllByRole("button");
    const first = segments[0];
    const second = segments[1];
    expect(first).toBeDefined();
    expect(second).toBeDefined();

    await user.click(first as HTMLElement);
    await waitFor(() => expect(first).toHaveAttribute("aria-current", "true"));

    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(second).toHaveAttribute("aria-current", "true"));
    expect(second).toHaveFocus();
    expect(output.shots.length).toBeGreaterThan(1);
  });

  it("keeps an edited shot through a save and a reload", async () => {
    seedDraft();
    const user = userEvent.setup();
    const view = render(<ResultsWorkspace />);

    await user.click((await screen.findAllByRole("button", { name: /edit shot 1/i }))[0]!);

    const camera = screen.getByLabelText("Camera");
    await user.clear(camera);
    await user.type(camera, "Locked frame, no move at all");
    await user.click(screen.getByRole("button", { name: /save shot/i }));

    expect(await screen.findByText(/local edits are not saved yet/i)).toBeInTheDocument();
    expect(screen.getByText("Edited")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /save draft/i }));
    await waitFor(() =>
      expect(screen.queryByText(/local edits are not saved yet/i)).not.toBeInTheDocument(),
    );

    const stored = readDraft();
    expect(stored.status).toBe("ok");
    if (stored.status === "ok") {
      expect(stored.value.output.shots[0]?.camera).toBe("Locked frame, no move at all");
      expect(stored.value.output.shots[0]?.edited).toBe(true);
    }

    // Simulate a reload by remounting from storage.
    view.unmount();
    render(<ResultsWorkspace />);
    expect(await screen.findByText("Locked frame, no move at all")).toBeInTheDocument();
  });

  it("recalculates readiness when an edit removes direction", async () => {
    const output = seedDraft();
    const user = userEvent.setup();
    render(<ResultsWorkspace />);

    await user.click((await screen.findAllByRole("button", { name: /edit shot 1/i }))[0]!);
    const sound = screen.getByLabelText("Sound");
    await user.clear(sound);
    await user.type(sound, "x");
    await user.click(screen.getByRole("button", { name: /save shot/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole("img", {
          name: new RegExp(`readiness ${output.readinessScore} out of 100`, "i"),
        }),
      ).not.toBeInTheDocument(),
    );
  });

  it("downloads the plan as valid JSON", async () => {
    const output = seedDraft();
    const user = userEvent.setup();

    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:framepilot");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      value: createObjectURL,
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: revokeObjectURL,
      configurable: true,
    });

    render(<ResultsWorkspace />);
    await user.click(await screen.findByRole("button", { name: /download json/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0]?.[0];
    expect(blob).toBeInstanceOf(Blob);
    if (!blob) {
      throw new Error("Download did not produce a blob");
    }
    expect(blob.type).toBe("application/json");

    const text = await blob.text();
    const parsed = JSON.parse(text) as DirectorOutput;
    expect(parsed.projectTitle).toBe(output.projectTitle);
    expect(parsed.shots).toHaveLength(output.shots.length);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:framepilot");
  });

  it("clears everything on reset and returns to the brief", async () => {
    seedDraft();
    const user = userEvent.setup();
    render(<ResultsWorkspace />);

    await user.click(await screen.findByRole("button", { name: /reset demo/i }));
    await user.click(await screen.findByRole("button", { name: /reset everything/i }));

    await waitFor(() => expect(readDraft()).toEqual({ status: "empty" }));
    expect(push).toHaveBeenCalledWith("/create");
  });
});
