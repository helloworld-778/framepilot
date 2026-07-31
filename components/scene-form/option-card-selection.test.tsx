import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SceneBriefForm } from "@/components/scene-form/scene-brief-form";
import { DEFAULT_SCENE_BRIEF } from "@/lib/constants";
import { readDraft } from "@/lib/storage";

/**
 * Every single-choice field on the brief form is one shared primitive built on a
 * real radio group. These tests hold it to that public contract: a radiogroup
 * with an accessible name, exactly one `aria-checked` radio, keyboard-driven
 * selection, and submitted values that match what is checked.
 *
 * Keyboard note: the group is a roving-tabindex radio group, so the arrow keys
 * move the tab stop and Space commits the focused option. Radix additionally
 * checks an option the moment an arrow key focuses it, but that shortcut relies
 * on `focusin` landing before `keyup`, which jsdom does not reproduce. These
 * tests therefore assert the arrow-then-Space path, which is the part of the
 * contract this environment can observe honestly.
 */

const push = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => searchParams,
}));

const validDescription =
  "A small cafe on the first afternoon of the monsoon. Rain marks the window while someone pours a fresh cup behind the counter.";

function group(name: RegExp): HTMLElement {
  return screen.getByRole("radiogroup", { name });
}

function checkedIn(container: HTMLElement): HTMLElement[] {
  return within(container).getAllByRole("radio", { checked: true });
}

const GROUPS = [
  { field: "Creative direction", name: /creative direction/i, checked: "Documentary Realism" },
  { field: "Purpose", name: /^purpose$/i, checked: "Promotion" },
  { field: "Runtime", name: /^runtime$/i, checked: "15 sec" },
  { field: "Aspect ratio", name: /^aspect ratio$/i, checked: "9:16 vertical" },
] as const;

async function describeScene(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText(/scene description/i));
  await user.paste(validDescription);
}

describe("option card selection semantics", () => {
  beforeEach(() => {
    push.mockClear();
    searchParams = new URLSearchParams();
    window.localStorage.clear();
  });

  it("exposes each choice as a radio group with exactly one checked option", () => {
    render(<SceneBriefForm />);

    for (const entry of GROUPS) {
      const container = group(entry.name);
      const radios = within(container).getAllByRole("radio");
      expect(radios.length).toBeGreaterThan(1);

      const checked = checkedIn(container);
      expect(checked).toHaveLength(1);
      expect(checked[0]).toHaveAccessibleName(new RegExp(entry.checked, "i"));

      // Unselected options are reported as unchecked, not merely unstyled.
      for (const radio of radios) {
        expect(radio).toHaveAttribute("aria-checked", radio === checked[0] ? "true" : "false");
      }
    }
  });

  it("starts on the documented defaults", () => {
    render(<SceneBriefForm />);

    expect(
      screen.getByRole("radio", { name: /documentary realism/i, checked: true }),
    ).toBeInTheDocument();
    expect(DEFAULT_SCENE_BRIEF.directoryId).toBe("documentary-realism");
    expect(screen.getByRole("radio", { name: /15 sec/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /9:16 vertical/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /^promotion/i })).toBeChecked();
  });

  it("is reachable by keyboard as a single tab stop", async () => {
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    const runtime = group(/^runtime$/i);
    const radios = within(runtime).getAllByRole("radio");
    expect(radios.length).toBeGreaterThan(1);

    // Roving tabindex: the whole group is one Tab stop, not one per option. Until
    // an option is focused the group itself holds the stop.
    expect(runtime).toHaveAttribute("tabindex", "0");
    for (const radio of radios) {
      expect(radio).toHaveAttribute("tabindex", "-1");
    }

    const checked = checkedIn(runtime)[0]!;
    await user.click(checked);
    expect(checked).toHaveFocus();
    // Focusing an option makes it the sole tab stop.
    expect(checked).toHaveAttribute("tabindex", "0");
    for (const radio of radios) {
      if (radio !== checked) {
        expect(radio).toHaveAttribute("tabindex", "-1");
      }
    }
  });

  it("moves the tab stop with the arrow keys, wrapping at the ends", async () => {
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    const runtime = group(/^runtime$/i);
    const [eight, fifteen, thirty] = within(runtime).getAllByRole("radio");

    await user.click(eight!);
    await waitFor(() => expect(eight).toBeChecked());

    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(fifteen).toHaveFocus());

    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(thirty).toHaveFocus());

    // The group loops, so a runtime is always one keypress away.
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(eight).toHaveFocus());

    await user.keyboard("{ArrowLeft}");
    await waitFor(() => expect(thirty).toHaveFocus());
  });

  it("commits the focused option with the keyboard and reports it through accessible state", async () => {
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    const runtime = group(/^runtime$/i);
    const eight = within(runtime).getByRole("radio", { name: /8 sec/i });
    const thirty = within(runtime).getByRole("radio", { name: /30 sec/i });

    await user.click(eight);
    await waitFor(() => expect(eight).toBeChecked());
    expect(thirty).not.toBeChecked();

    await user.keyboard("{ArrowLeft}[Space]");

    await waitFor(() => expect(thirty).toBeChecked());
    expect(thirty).toHaveFocus();
    expect(eight).not.toBeChecked();
    // Selection is exclusive and exposed as state, not just as a style.
    expect(checkedIn(runtime)).toHaveLength(1);
    expect(thirty).toHaveAttribute("aria-checked", "true");
    expect(eight).toHaveAttribute("aria-checked", "false");
  });

  it("selects a creative direction from the keyboard", async () => {
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    const directions = within(group(/creative direction/i)).getAllByRole("radio");
    await user.click(directions[0]!);
    await waitFor(() => expect(directions[0]).toBeChecked());

    await user.keyboard("{ArrowRight}[Space]");

    await waitFor(() => expect(directions[1]).toBeChecked());
    expect(directions[0]).not.toBeChecked();
    expect(checkedIn(group(/creative direction/i))).toHaveLength(1);
  });

  it("keeps selection independent between groups", async () => {
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await user.click(screen.getByRole("radio", { name: /nonlinear suspense/i }));
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: /nonlinear suspense/i })).toBeChecked(),
    );

    // Choosing a direction must not disturb purpose, runtime, or ratio.
    expect(checkedIn(group(/^purpose$/i))[0]).toHaveAccessibleName(/promotion/i);
    expect(checkedIn(group(/^runtime$/i))[0]).toHaveAccessibleName(/15 sec/i);
    expect(checkedIn(group(/^aspect ratio$/i))[0]).toHaveAccessibleName(/9:16/i);
  });

  it("submits the keyboard-selected values, not the defaults", async () => {
    const user = userEvent.setup();
    render(<SceneBriefForm />);
    await describeScene(user);

    // Direction: click the first card, then step to the next with the keyboard.
    const directions = within(group(/creative direction/i)).getAllByRole("radio");
    await user.click(directions[0]!);
    await user.keyboard("{ArrowRight}[Space]");
    const selectedDirection = directions[1]!;
    await waitFor(() => expect(selectedDirection).toBeChecked());

    // Runtime: 30 sec, chosen with the keyboard from 8 sec.
    await user.click(within(group(/^runtime$/i)).getByRole("radio", { name: /8 sec/i }));
    await user.keyboard("{ArrowRight}{ArrowRight}[Space]");
    await waitFor(() =>
      expect(within(group(/^runtime$/i)).getByRole("radio", { name: /30 sec/i })).toBeChecked(),
    );

    // Aspect ratio and purpose, chosen by activating the card label.
    await user.click(screen.getByRole("radio", { name: /16:9 landscape/i }));
    await user.click(screen.getByRole("radio", { name: /^awareness/i }));

    await user.click(screen.getByRole("button", { name: /direct my scene/i }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));

    const draft = readDraft();
    expect(draft.status).toBe("ok");
    if (draft.status === "ok") {
      expect(draft.value.brief.duration).toBe(30);
      expect(draft.value.brief.aspectRatio).toBe("16:9");
      expect(draft.value.brief.purpose).toBe("awareness");
      // The submitted direction is the one still reported as checked.
      expect(selectedDirection.getAttribute("value")).toBe(draft.value.brief.directoryId);
      expect(draft.value.output.directoryId).toBe(draft.value.brief.directoryId);
    }
  });

  it("keeps validation intact when only the choices are touched", async () => {
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    await user.click(screen.getByRole("radio", { name: /whimsical fantasy/i }));
    await user.click(screen.getByRole("button", { name: /direct my scene/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/at least 24 characters/i);
    expect(push).not.toHaveBeenCalled();
    expect(readDraft()).toEqual({ status: "empty" });
    // The choice survives the failed submission.
    expect(screen.getByRole("radio", { name: /whimsical fantasy/i })).toBeChecked();
  });

  it("moves checked state to match a demo prefill", async () => {
    const user = userEvent.setup();
    render(<SceneBriefForm />);

    expect(screen.getByRole("radio", { name: /documentary realism/i })).toBeChecked();

    await user.click(screen.getByRole("button", { name: /single-use plastic/i }));

    await waitFor(() =>
      expect(screen.getByRole("radio", { name: /nonlinear suspense/i })).toBeChecked(),
    );
    expect(screen.getByRole("radio", { name: /documentary realism/i })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /30 sec/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /16:9 landscape/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /^awareness/i })).toBeChecked();
    expect(checkedIn(group(/creative direction/i))).toHaveLength(1);
  });
});
