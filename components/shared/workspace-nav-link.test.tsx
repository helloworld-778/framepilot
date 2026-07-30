import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  ProjectsNavLink,
  WorkspaceNavLink,
} from "@/components/shared/workspace-nav-link";
import { DEMO_BRIEFS } from "@/data/demo-projects";
import { generateDirection } from "@/lib/director";
import { saveProject } from "@/lib/project-store";
import { writeDraft } from "@/lib/storage";

const demo = DEMO_BRIEFS[0];
if (!demo) {
  throw new Error("Demo briefs are missing");
}
const brief = demo.brief;
const output = generateDirection(brief, { now: "2026-05-01T10:00:00.000Z" });

describe("WorkspaceNavLink", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("points at the brief form when there is no draft", () => {
    render(<WorkspaceNavLink />);
    expect(screen.getByRole("link", { name: "Workspace" })).toHaveAttribute("href", "/create");
  });

  it("points at the workspace once a draft exists", () => {
    writeDraft(brief, output, "2026-05-01T10:00:00.000Z");
    render(<WorkspaceNavLink />);
    expect(screen.getByRole("link", { name: "Workspace" })).toHaveAttribute("href", "/workspace");
  });

  it("falls back to the brief form when the draft is unreadable", () => {
    window.localStorage.setItem("framepilot:draft:v1", "{not json");
    render(<WorkspaceNavLink />);
    expect(screen.getByRole("link", { name: "Workspace" })).toHaveAttribute("href", "/create");
  });
});

describe("ProjectsNavLink", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("links to the list with no count when nothing is saved", () => {
    render(<ProjectsNavLink />);
    const link = screen.getByRole("link", { name: /projects/i });
    expect(link).toHaveAttribute("href", "/projects");
    expect(link.textContent).toBe("Projects");
  });

  it("announces how many projects are saved", () => {
    saveProject(brief, output, "2026-05-01T10:00:00.000Z");
    render(<ProjectsNavLink />);

    expect(screen.getByRole("link", { name: /projects, 1 saved/i })).toBeInTheDocument();
  });
});
