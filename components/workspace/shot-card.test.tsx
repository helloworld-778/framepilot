import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ShotCard } from "@/components/workspace/shot-card";
import { DEMO_BRIEFS } from "@/data/demo-projects";
import { generateDirection } from "@/lib/director";
import type { StoryboardShot } from "@/types";

function firstShot(): StoryboardShot {
  const demo = DEMO_BRIEFS[0];
  if (!demo) {
    throw new Error("Demo briefs are missing");
  }
  const shot = generateDirection(demo.brief).shots[0];
  if (!shot) {
    throw new Error("Generated plan has no shots");
  }
  return shot;
}

function renderCard(overrides: Partial<StoryboardShot> = {}) {
  const shot = { ...firstShot(), ...overrides };
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

describe("ShotCard", () => {
  it("shows every direction field in view mode", () => {
    const { shot } = renderCard();

    expect(screen.getByRole("heading", { name: shot.title })).toBeInTheDocument();
    expect(screen.getByText(shot.shotType)).toBeInTheDocument();
    expect(screen.getByText(shot.visualDirection)).toBeInTheDocument();
    expect(screen.getByText(shot.camera)).toBeInTheDocument();
    expect(screen.getByText(shot.lighting)).toBeInTheDocument();
    expect(screen.getByText(shot.composition)).toBeInTheDocument();
    expect(screen.getByText(shot.sound)).toBeInTheDocument();
    expect(screen.getByText(shot.transition)).toBeInTheDocument();
    expect(screen.getByText(`${shot.durationSeconds}s`)).toBeInTheDocument();
  });

  it("saves an edited field and reports it upward", async () => {
    const user = userEvent.setup();
    const { shot, onSave } = renderCard();

    await user.click(screen.getByRole("button", { name: /edit shot/i }));

    const camera = screen.getByLabelText("Camera");
    await user.clear(camera);
    await user.type(camera, "Locked frame, no move at all");
    await user.click(screen.getByRole("button", { name: /save shot/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      shot.id,
      expect.objectContaining({
        camera: "Locked frame, no move at all",
        title: shot.title,
        lighting: shot.lighting,
      }),
    );
  });

  it("discards changes on cancel", async () => {
    const user = userEvent.setup();
    const { shot, onSave } = renderCard();

    await user.click(screen.getByRole("button", { name: /edit shot/i }));
    await user.clear(screen.getByLabelText("Camera"));
    await user.type(screen.getByLabelText("Camera"), "Handheld, drifting");
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(shot.camera)).toBeInTheDocument();
  });

  it("refuses to save an emptied field and says why", async () => {
    const user = userEvent.setup();
    const { onSave } = renderCard();

    await user.click(screen.getByRole("button", { name: /edit shot/i }));
    await user.clear(screen.getByLabelText("Lighting"));
    await user.click(screen.getByRole("button", { name: /save shot/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/lighting direction cannot be empty/i);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("offers revert only once a shot has been edited", async () => {
    const user = userEvent.setup();
    expect(screen.queryByRole("button", { name: /revert/i })).not.toBeInTheDocument();

    const { shot, onRevert } = renderCard({ edited: true });
    expect(screen.getByText("Edited")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /revert/i }));
    expect(onRevert).toHaveBeenCalledWith(shot.id);
  });
});
