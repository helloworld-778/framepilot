import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ActionFeedbackButton } from "@/components/shared/action-feedback-button";

describe("ActionFeedbackButton", () => {
  it("starts idle with the plain label", () => {
    render(<ActionFeedbackButton idleLabel="Download JSON" />);
    expect(screen.getByRole("button", { name: "Download JSON" })).toHaveAttribute(
      "data-state",
      "idle",
    );
  });

  it("reports working, then the real success result", async () => {
    const user = userEvent.setup();
    let resolve: (() => void) | undefined;
    const gate = new Promise<void>((done) => {
      resolve = () => done();
    });

    render(
      <ActionFeedbackButton
        idleLabel="Save draft"
        workingLabel="Saving…"
        successLabel="Saved locally"
        onAction={async () => {
          await gate;
          return { ok: true } as const;
        }}
      />,
    );

    const button = screen.getByRole("button", { name: "Save draft" });
    await user.click(button);

    // Success must not appear before the action resolves.
    expect(button).toHaveAttribute("data-state", "working");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    expect(screen.getByText("Saving…")).toBeInTheDocument();
    expect(screen.queryByText("Saved locally")).not.toBeInTheDocument();

    resolve?.();
    await waitFor(() => expect(screen.getByText("Saved locally")).toBeInTheDocument());
    expect(button).toHaveAttribute("data-state", "success");
  });

  it("announces success to assistive technology", async () => {
    const user = userEvent.setup();
    render(
      <ActionFeedbackButton
        idleLabel="Save project"
        successLabel="Saved locally"
        announceSuccess="Project saved locally in this browser"
        onAction={() => ({ ok: true }) as const}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save project" }));
    expect(
      await screen.findByText("Project saved locally in this browser"),
    ).toBeInTheDocument();
  });

  it("shows a failure message and stays retryable", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn<() => { ok: false; message: string }>()
      .mockReturnValue({ ok: false, message: "Storage full" });

    render(
      <ActionFeedbackButton
        idleLabel="Save draft"
        errorLabel="Save failed"
        onAction={action}
      />,
    );

    const button = screen.getByRole("button", { name: "Save draft" });
    await user.click(button);

    await waitFor(() => expect(button).toHaveAttribute("data-state", "error"));
    expect(screen.getByText("Storage full")).toBeInTheDocument();
    expect(button).toBeEnabled();

    // Retry works: the accessible name never changed, so it is still findable.
    await user.click(button);
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("treats a thrown error as an honest failure", async () => {
    const user = userEvent.setup();
    render(
      <ActionFeedbackButton
        idleLabel="Copy prompt"
        errorLabel="Copy failed"
        onAction={() => {
          throw new Error("no clipboard");
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Copy prompt" }));
    await waitFor(() => expect(screen.getByText("Copy failed")).toBeInTheDocument());
  });

  it("blocks duplicate activation while working", async () => {
    const user = userEvent.setup();
    let calls = 0;
    let resolve: (() => void) | undefined;
    const gate = new Promise<void>((done) => {
      resolve = () => done();
    });

    render(
      <ActionFeedbackButton
        idleLabel="Download JSON"
        onAction={async () => {
          calls += 1;
          await gate;
        }}
      />,
    );

    const button = screen.getByRole("button", { name: "Download JSON" });
    await user.click(button);
    await user.click(button).catch(() => {});
    expect(calls).toBe(1);

    resolve?.();
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("can be driven from outside, e.g. by a form submission", () => {
    render(
      <ActionFeedbackButton
        type="submit"
        idleLabel="Direct my scene"
        workingLabel="Directing…"
        state="working"
      />,
    );

    const button = screen.getByRole("button", { name: "Direct my scene" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toBeDisabled();
    expect(screen.getByText("Directing…")).toBeInTheDocument();
  });

  it("keeps a stable accessible name across states", async () => {
    const user = userEvent.setup();
    render(
      <ActionFeedbackButton
        idleLabel="Copy negative prompt"
        successLabel="Copied"
        onAction={() => ({ ok: true }) as const}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Copy negative prompt" }));
    await waitFor(() => expect(screen.getByText("Copied")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Copy negative prompt" })).toBeInTheDocument();
  });
});
