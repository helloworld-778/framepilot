import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DemoWorkspaceMenu } from "@/components/shared/demo-workspace-menu";
import { DEMO_BRIEFS } from "@/data/demo-projects";
import { generateDirection } from "@/lib/director";
import { readProjects, saveProject } from "@/lib/project-store";
import { readDraft, writeDraft } from "@/lib/storage";
import type { SceneBrief } from "@/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const demo = DEMO_BRIEFS[0];
if (!demo) {
  throw new Error("Demo briefs are missing");
}
const brief: SceneBrief = demo.brief;

function seed(index: number, minute: number) {
  const variant: SceneBrief = { ...brief, primarySubject: `subject ${index}` };
  saveProject(variant, generateDirection(variant), `2026-05-01T10:${String(minute).padStart(2, "0")}:00.000Z`);
}

async function openMenu() {
  const user = userEvent.setup();
  const trigger = screen.getByRole("button", { name: /open demo workspace menu/i });
  await user.click(trigger);
  await screen.findByRole("menu");
  return { user, trigger };
}

describe("DemoWorkspaceMenu", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders without throwing on the server", () => {
    expect(() => renderToString(<DemoWorkspaceMenu />)).not.toThrow();
  });

  it("labels the trigger for assistive technology", () => {
    render(<DemoWorkspaceMenu />);
    expect(
      screen.getByRole("button", { name: /open demo workspace menu/i }),
    ).toBeInTheDocument();
  });

  it("states plainly that storage is local and no account exists", async () => {
    render(<DemoWorkspaceMenu />);
    await openMenu();

    // The label appears on the trigger and again as the menu heading.
    expect(screen.getAllByText("Demo workspace").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Projects stay in this browser.")).toBeInTheDocument();
    expect(screen.getByText(/local only · no account required/i)).toBeInTheDocument();
    expect(screen.getByText("Cloud sync is not enabled.")).toBeInTheDocument();
  });

  it("never uses account or sync language", async () => {
    render(<DemoWorkspaceMenu />);
    await openMenu();

    const text = document.body.textContent ?? "";
    for (const banned of [
      "Sign in",
      "Log in",
      "Login",
      "Logged in",
      "Your account",
      "Profile",
      "Secure cloud",
      "backed up",
      "Collaborators",
    ]) {
      expect(text).not.toContain(banned);
    }
    expect(document.querySelector('input[type="password"]')).toBeNull();
    expect(document.querySelector('input[type="email"]')).toBeNull();
  });

  it("reports the saved-project count from existing storage", async () => {
    seed(1, 0);
    seed(2, 5);
    render(<DemoWorkspaceMenu />);
    await openMenu();

    expect(screen.getByText("2 saved projects")).toBeInTheDocument();
  });

  it("uses singular and empty wording correctly", async () => {
    render(<DemoWorkspaceMenu />);
    const { user } = await openMenu();
    expect(screen.getByText("No saved projects")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    seed(1, 0);
    await openMenu();
    expect(screen.getByText("1 saved project")).toBeInTheDocument();
  });

  it("links to the two existing routes", async () => {
    render(<DemoWorkspaceMenu />);
    await openMenu();

    expect(screen.getByRole("menuitem", { name: /open projects/i })).toHaveAttribute(
      "href",
      "/projects",
    );
    expect(screen.getByRole("menuitem", { name: /create a scene/i })).toHaveAttribute(
      "href",
      "/create",
    );
  });

  it("closes on Escape and restores focus to its trigger", async () => {
    render(<DemoWorkspaceMenu />);
    const { user, trigger } = await openMenu();

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("keeps reset behind a confirmation and clears nothing on its own", async () => {
    seed(1, 0);
    writeDraft(brief, generateDirection(brief), "2026-05-01T10:00:00.000Z");
    render(<DemoWorkspaceMenu />);
    const { user } = await openMenu();

    await user.click(screen.getByRole("menuitem", { name: /reset demo data/i }));

    // A dialog appears; nothing is cleared yet.
    expect(await screen.findByRole("dialog")).toHaveTextContent(/cannot be undone/i);
    expect(readProjects()).toHaveLength(1);
    expect(readDraft().status).toBe("ok");

    await user.click(screen.getByRole("button", { name: /reset everything/i }));

    await waitFor(() => expect(readProjects()).toHaveLength(0));
    expect(readDraft()).toEqual({ status: "empty" });
  });

  it("leaves data intact when the reset dialog is cancelled", async () => {
    seed(1, 0);
    render(<DemoWorkspaceMenu />);
    const { user } = await openMenu();

    await user.click(screen.getByRole("menuitem", { name: /reset demo data/i }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(readProjects()).toHaveLength(1);
  });
});
