import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectList } from "@/components/projects/project-list";
import { DEMO_BRIEFS } from "@/data/demo-projects";
import { PROJECT_CAP, PROJECT_CAP_WARNING_AT } from "@/lib/constants";
import { generateDirection } from "@/lib/director";
import { readProjects, saveProject } from "@/lib/project-store";
import type { SceneBrief } from "@/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const coffee = DEMO_BRIEFS[0];
const plastic = DEMO_BRIEFS[3];
if (!coffee || !plastic) {
  throw new Error("Demo briefs are missing");
}

function isoAt(minute: number): string {
  return `2026-05-01T10:${String(minute).padStart(2, "0")}:00.000Z`;
}

function seed(brief: SceneBrief, minute: number, title?: string) {
  const result = saveProject(brief, generateDirection(brief), isoAt(minute), { title });
  if (result.status !== "ok") {
    throw new Error("save failed");
  }
  return result.project;
}

describe("ProjectList", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("guides the user to the brief form when nothing is saved", () => {
    render(<ProjectList />);

    expect(screen.getByRole("heading", { name: /nothing saved yet/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create a scene/i })).toHaveAttribute(
      "href",
      "/create",
    );
  });

  it("renders each project's metadata", () => {
    const project = seed(coffee.brief, 0, "Monsoon launch cut");
    render(<ProjectList />);

    const card = screen.getByRole("article");
    expect(within(card).getByRole("heading", { name: "Monsoon launch cut" })).toBeInTheDocument();
    expect(within(card).getByText("Premium Product Film")).toBeInTheDocument();
    expect(within(card).getByText("15 sec")).toBeInTheDocument();
    expect(within(card).getByText("9:16")).toBeInTheDocument();
    const readiness = within(card).getByText("Readiness").closest("div");
    expect(readiness).not.toBeNull();
    expect(readiness?.textContent).toContain(String(project.output.readinessScore));
    expect(readiness?.textContent).toContain("/100");
    expect(within(card).getByRole("link", { name: /open monsoon launch cut/i })).toHaveAttribute(
      "href",
      `/projects/${project.id}`,
    );
  });

  it("lists the newest project first", () => {
    seed(coffee.brief, 0, "Older project");
    seed(plastic.brief, 30, "Newer project");
    render(<ProjectList />);

    const headings = screen.getAllByRole("heading", { level: 3 }).map((node) => node.textContent);
    expect(headings).toEqual(["Newer project", "Older project"]);
  });

  it("renames a project and keeps it after a remount", async () => {
    const project = seed(coffee.brief, 0, "First name");
    const user = userEvent.setup();
    const view = render(<ProjectList />);

    await user.click(screen.getByRole("button", { name: /rename first name/i }));
    const field = await screen.findByLabelText(/project name/i);
    await user.clear(field);
    await user.type(field, "Second name");
    await user.click(screen.getByRole("button", { name: /save name/i }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Second name" })).toBeInTheDocument(),
    );
    expect(readProjects()[0]?.title).toBe("Second name");
    expect(readProjects()[0]?.createdAt).toBe(project.createdAt);

    view.unmount();
    render(<ProjectList />);
    expect(screen.getByRole("heading", { name: "Second name" })).toBeInTheDocument();
  });

  it("requires confirmation before deleting, and deletes only that project", async () => {
    seed(coffee.brief, 0, "Keep me");
    seed(plastic.brief, 10, "Delete me");
    const user = userEvent.setup();
    render(<ProjectList />);

    await user.click(screen.getByRole("button", { name: /delete delete me/i }));

    // Still present until the dialog is confirmed.
    expect(readProjects()).toHaveLength(2);
    expect(await screen.findByRole("dialog")).toHaveTextContent(/cannot be undone/i);

    await user.click(screen.getByRole("button", { name: /^delete project$/i }));

    await waitFor(() => expect(readProjects()).toHaveLength(1));
    expect(readProjects()[0]?.title).toBe("Keep me");
    expect(screen.queryByRole("heading", { name: "Delete me" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Keep me" })).toBeInTheDocument();
  });

  it("keeps a project when the delete dialog is cancelled", async () => {
    seed(coffee.brief, 0, "Keep me");
    const user = userEvent.setup();
    render(<ProjectList />);

    await user.click(screen.getByRole("button", { name: /delete keep me/i }));
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(readProjects()).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Keep me" })).toBeInTheDocument();
  });

  it("warns as the project cap approaches", () => {
    for (let index = 0; index < PROJECT_CAP_WARNING_AT; index += 1) {
      seed({ ...coffee.brief, primarySubject: `variant ${index}` }, index);
    }
    render(<ProjectList />);

    expect(
      screen.getByText(new RegExp(`${PROJECT_CAP_WARNING_AT} of ${PROJECT_CAP} projects saved`, "i")),
    ).toBeInTheDocument();
  });

  it("reports the limit once it is reached", () => {
    for (let index = 0; index < PROJECT_CAP; index += 1) {
      seed({ ...coffee.brief, primarySubject: `variant ${index}` }, index);
    }
    render(<ProjectList />);

    expect(screen.getByText(/removing the oldest one|remove the oldest one/i)).toBeInTheDocument();
  });

  it("tells the user when saved projects had to be set aside", () => {
    window.localStorage.setItem("framepilot:projects:v1", "{not json");
    render(<ProjectList />);

    expect(screen.getByText(/could not be read/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /nothing saved yet/i })).toBeInTheDocument();
  });
});
