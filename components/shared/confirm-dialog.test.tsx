import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { ActionOutcome } from "@/components/shared/action-feedback-button";

/**
 * The shared guard in front of anything destructive. Its contract: nothing runs
 * without an explicit confirmation, the dialog reports the real result, and a
 * failure leaves the dialog open and retryable.
 */

interface Deferred {
  promise: Promise<ActionOutcome>;
  resolve: (outcome: ActionOutcome) => void;
}

function deferred(): Deferred {
  let resolve!: (outcome: ActionOutcome) => void;
  const promise = new Promise<ActionOutcome>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function renderDialog(
  onConfirm: () => ActionOutcome | void | Promise<ActionOutcome | void>,
) {
  render(
    <ConfirmDialog
      trigger={<button type="button">Delete draft</button>}
      title="Delete this draft?"
      description="The working draft will be removed from this browser. This cannot be undone."
      confirmLabel="Delete draft permanently"
      workingLabel="Deleting…"
      successLabel="Deleted"
      onConfirm={onConfirm}
    />,
  );
}

async function open(user: ReturnType<typeof userEvent.setup>): Promise<HTMLElement> {
  await user.click(screen.getByRole("button", { name: "Delete draft" }));
  return screen.findByRole("dialog");
}

function confirmButton(dialog: HTMLElement): HTMLElement {
  return within(dialog).getByRole("button", { name: /delete draft permanently/i });
}

describe("ConfirmDialog", () => {
  it("does nothing until it is opened", () => {
    const onConfirm = vi.fn();
    renderDialog(onConfirm);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("presents the title, description, cancel, and confirmation accessibly", async () => {
    const user = userEvent.setup();
    renderDialog(vi.fn());
    const dialog = await open(user);

    expect(dialog).toHaveAccessibleName("Delete this draft?");
    expect(dialog).toHaveAccessibleDescription(/cannot be undone/i);
    expect(
      within(dialog).getByRole("heading", { name: "Delete this draft?" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /^cancel$/i })).toBeInTheDocument();
    expect(confirmButton(dialog)).toBeEnabled();
  });

  it("runs the action only when the confirmation is used", async () => {
    const onConfirm = vi.fn(() => ({ ok: true }) as ActionOutcome);
    const user = userEvent.setup();
    renderDialog(onConfirm);
    const dialog = await open(user);

    expect(onConfirm).not.toHaveBeenCalled();
    await user.click(confirmButton(dialog));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("closes once the action has actually succeeded", async () => {
    const user = userEvent.setup();
    renderDialog(() => ({ ok: true }) as ActionOutcome);
    const dialog = await open(user);

    await user.click(confirmButton(dialog));

    // Success is reported on the control before the dialog goes away.
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: /delete draft permanently/i })).toHaveTextContent(
        /deleted/i,
      ),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("does not run the action when cancelled", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderDialog(onConfirm);
    const dialog = await open(user);

    await user.click(within(dialog).getByRole("button", { name: /^cancel$/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("does not run the action when dismissed with Escape", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderDialog(onConfirm);
    await open(user);

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("reports a working state and refuses a second confirmation", async () => {
    const pending = deferred();
    const onConfirm = vi.fn(() => pending.promise);
    const user = userEvent.setup();
    renderDialog(onConfirm);
    const dialog = await open(user);

    await user.click(confirmButton(dialog));

    const working = within(dialog).getByRole("button", { name: /delete draft permanently/i });
    await waitFor(() => expect(working).toHaveTextContent(/deleting…/i));
    expect(working).toBeDisabled();
    expect(working).toHaveAttribute("aria-busy", "true");

    // A second click while the action is in flight must not run it again.
    await user.click(working);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    pending.resolve({ ok: true });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("stays open and retryable when the action fails", async () => {
    const onConfirm = vi
      .fn<() => ActionOutcome>()
      .mockReturnValueOnce({ ok: false, message: "Browser storage is full" })
      .mockReturnValueOnce({ ok: true });
    const user = userEvent.setup();
    renderDialog(onConfirm);
    const dialog = await open(user);

    await user.click(confirmButton(dialog));

    // The failure is surfaced on the control itself, not only in a toast.
    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: /delete draft permanently/i }),
      ).toHaveTextContent(/browser storage is full/i),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Still usable: the same control retries, and success then closes it.
    const retry = within(dialog).getByRole("button", { name: /delete draft permanently/i });
    await waitFor(() => expect(retry).toBeEnabled());
    await user.click(retry);

    expect(onConfirm).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("treats a thrown action as a failure and keeps the dialog open", async () => {
    const onConfirm = vi.fn(() => {
      throw new Error("storage blew up");
    });
    const user = userEvent.setup();
    renderDialog(onConfirm);
    const dialog = await open(user);

    await user.click(confirmButton(dialog));

    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: /delete draft permanently/i }),
      ).toBeEnabled(),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("treats an action that reports nothing as a success", async () => {
    const onConfirm = vi.fn<() => void>();
    const user = userEvent.setup();
    renderDialog(onConfirm);
    const dialog = await open(user);

    await user.click(confirmButton(dialog));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("reports open state changes to a controlling parent", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        trigger={<button type="button">Discard</button>}
        title="Discard changes?"
        description="Your edits have not been directed yet."
        confirmLabel="Discard changes"
        onOpenChange={onOpenChange}
        onConfirm={() => ({ ok: true })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Discard" }));
    await screen.findByRole("dialog");
    expect(onOpenChange).toHaveBeenCalledWith(true);

    await user.keyboard("{Escape}");
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
