import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ShotCard } from "@/components/workspace/shot-card";
import { DEMO_BRIEFS } from "@/data/demo-projects";
import { generateDirection } from "@/lib/director";
import type { StoryboardShot } from "@/types";

const demo = DEMO_BRIEFS[0];
if (!demo) {
  throw new Error("Demo briefs are missing");
}
const demoBrief = demo.brief;

function baseShot(): StoryboardShot {
  const shot = generateDirection(demoBrief).shots[0];
  if (!shot) {
    throw new Error("Generated plan has no shots");
  }
  return shot;
}

function renderCard(overrides: Partial<StoryboardShot> = {}) {
  const shot = { ...baseShot(), ...overrides };
  const onSave = vi.fn();
  const onRevert = vi.fn();
  render(
    <ShotCard
      shot={shot}
      isActive={false}
      onSave={onSave}
      onRevert={onRevert}
      onFocus={() => {}}
    />,
  );
  return { shot, onSave, onRevert };
}

function editTrigger(order: number) {
  return screen.getByRole("button", { name: `Edit shot ${order}` });
}

describe("shot edit focus management", () => {
  it("moves focus to the shot title field when edit mode opens", async () => {
    const user = userEvent.setup();
    const { shot } = renderCard();

    await user.click(editTrigger(shot.order));

    const title = screen.getByLabelText("Shot title");
    await waitFor(() => expect(title).toHaveFocus());
    // Not the card, not a heading, not the body.
    expect(document.body).not.toHaveFocus();
  });

  it("returns focus to the same Edit trigger after saving", async () => {
    const user = userEvent.setup();
    const { shot, onSave } = renderCard();

    await user.click(editTrigger(shot.order));
    const camera = screen.getByLabelText("Camera");
    await user.clear(camera);
    await user.type(camera, "Locked frame, no move at all");
    await user.click(screen.getByRole("button", { name: /save shot/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(editTrigger(shot.order)).toHaveFocus());
  });

  it("returns focus to the same Edit trigger after cancelling", async () => {
    const user = userEvent.setup();
    const { shot, onSave } = renderCard();

    await user.click(editTrigger(shot.order));
    await user.type(screen.getByLabelText("Camera"), " drifting");
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(onSave).not.toHaveBeenCalled();
    await waitFor(() => expect(editTrigger(shot.order)).toHaveFocus());
  });

  it("keeps the restored trigger's accessible name tied to the shot number", async () => {
    const user = userEvent.setup();
    const { shot } = renderCard({ order: 3 });

    await user.click(editTrigger(shot.order));
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    const restored = editTrigger(3);
    await waitFor(() => expect(restored).toHaveFocus());
    expect(restored).toHaveAccessibleName("Edit shot 3");
  });

  it("keeps focus inside the form when submission is invalid", async () => {
    const user = userEvent.setup();
    const { shot, onSave } = renderCard();

    await user.click(editTrigger(shot.order));
    await user.clear(screen.getByLabelText("Lighting"));
    await user.click(screen.getByRole("button", { name: /save shot/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    // Still editing, and focus has not been yanked back to the trigger or body.
    expect(screen.getByLabelText("Lighting")).toBeInTheDocument();
    expect(document.body).not.toHaveFocus();
    expect(screen.queryByRole("button", { name: `Edit shot ${shot.order}` })).not.toBeInTheDocument();
  });

  it("does not steal focus while the user is typing", async () => {
    const user = userEvent.setup();
    const { shot } = renderCard();

    await user.click(editTrigger(shot.order));
    const composition = screen.getByLabelText("Composition");
    await user.click(composition);
    await user.type(composition, " and hold");

    expect(composition).toHaveFocus();
  });

  it("leaves focus on the Revert trigger, which stays mounted after reverting", async () => {
    const user = userEvent.setup();
    const { shot, onRevert } = renderCard({ edited: true });

    // Revert is offered in view mode only, so reverting never closes an editor.
    const revert = screen.getByRole("button", { name: /revert/i });
    await user.click(revert);

    expect(onRevert).toHaveBeenCalledWith(shot.id);
    expect(revert).toHaveFocus();
    expect(document.body).not.toHaveFocus();
  });

  it("focuses the title field again on a second edit pass", async () => {
    const user = userEvent.setup();
    const { shot } = renderCard();

    await user.click(editTrigger(shot.order));
    await waitFor(() => expect(screen.getByLabelText("Shot title")).toHaveFocus());
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    await waitFor(() => expect(editTrigger(shot.order)).toHaveFocus());

    await user.click(editTrigger(shot.order));
    await waitFor(() => expect(screen.getByLabelText("Shot title")).toHaveFocus());
  });

  it("still registers the title field with the form after ref composition", async () => {
    const user = userEvent.setup();
    const { shot, onSave } = renderCard();

    await user.click(editTrigger(shot.order));
    const title = screen.getByLabelText("Shot title");
    await user.clear(title);
    await user.type(title, "Macro — crema bloom");
    await user.click(screen.getByRole("button", { name: /save shot/i }));

    expect(onSave).toHaveBeenCalledWith(
      shot.id,
      expect.objectContaining({ title: "Macro — crema bloom" }),
    );
  });
});
