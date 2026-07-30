import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SceneBriefForm } from "@/components/scene-form/scene-brief-form";
import { readDraft } from "@/lib/storage";

const push = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => searchParams,
}));

const validDescription =
  "A small cafe on the first afternoon of the monsoon. Rain marks the window while someone pours a fresh cup behind the counter.";

describe("SceneBriefForm", () => {
  beforeEach(() => {
    push.mockClear();
    searchParams = new URLSearchParams();
    window.localStorage.clear();
  });

  it("blocks submission and explains the problem when the description is missing", async () => {
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await user.click(screen.getByRole("button", { name: /direct my scene/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/at least 24 characters/i);
    expect(push).not.toHaveBeenCalled();
    expect(readDraft()).toEqual({ status: "empty" });
  });

  it("rejects a description that is too short to direct from", async () => {
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await user.type(screen.getByLabelText(/scene description/i), "Rain outside.");
    await user.click(screen.getByRole("button", { name: /direct my scene/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("generates a plan, saves it locally, and moves to the workspace", async () => {
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await user.click(screen.getByLabelText(/scene description/i));
    await user.paste(validDescription);
    await user.type(screen.getByLabelText(/primary subject/i), "hand-brewed monsoon coffee");
    await user.click(screen.getByRole("button", { name: /direct my scene/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));

    const draft = readDraft();
    expect(draft.status).toBe("ok");
    if (draft.status === "ok") {
      expect(draft.value.brief.description).toBe(validDescription);
      expect(draft.value.brief.primarySubject).toBe("hand-brewed monsoon coffee");
      expect(draft.value.output.shots.length).toBeGreaterThanOrEqual(3);
      const total = draft.value.output.shots.reduce(
        (sum, shot) => sum + shot.durationSeconds,
        0,
      );
      expect(total).toBe(draft.value.brief.duration);
    }
  });

  it("carries the chosen direction and runtime into the generated plan", async () => {
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await user.click(screen.getByLabelText(/scene description/i));
    await user.paste(validDescription);
    await user.click(screen.getByRole("radio", { name: /nonlinear suspense/i }));
    await user.click(screen.getByRole("radio", { name: /30 sec/i }));
    await user.click(screen.getByRole("button", { name: /direct my scene/i }));

    await waitFor(() => expect(push).toHaveBeenCalled());

    const draft = readDraft();
    expect(draft.status).toBe("ok");
    if (draft.status === "ok") {
      expect(draft.value.brief.directoryId).toBe("nonlinear-suspense");
      expect(draft.value.brief.duration).toBe(30);
      expect(draft.value.output.meta.totalDurationSeconds).toBe(30);
    }
  });

  it("prefills from a demo brief chip", async () => {
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await user.click(screen.getByRole("button", { name: /monsoon coffee offer/i }));

    const description = screen.getByLabelText(/scene description/i);
    await waitFor(() =>
      expect((description as HTMLTextAreaElement).value).toMatch(/monsoon/i),
    );
    expect(screen.getByLabelText(/primary subject/i)).toHaveValue(
      "hand-brewed monsoon coffee",
    );
  });

  it("prefills from a ?demo= link", async () => {
    searchParams = new URLSearchParams("demo=plastic-awareness");
    render(<SceneBriefForm />);

    await waitFor(() =>
      expect(screen.getByLabelText(/primary subject/i)).toHaveValue("a single discarded wrapper"),
    );
  });
});

