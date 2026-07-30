import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DemoCasesStrip } from "@/components/landing/demo-cases-strip";
import { DEMO_BRIEFS } from "@/data/demo-projects";

describe("DemoCasesStrip", () => {
  it("makes each whole card one labelled link to a prefilled brief", () => {
    render(<DemoCasesStrip />);

    for (const demo of DEMO_BRIEFS) {
      const link = screen.getByRole("link", {
        name: new RegExp(`open the ${demo.label} demo brief`, "i"),
      });
      expect(link).toHaveAttribute("href", `/create?demo=${demo.slug}`);
      // The card content lives inside the link, so the whole card is clickable.
      expect(link.textContent).toContain(demo.label);
      expect(link.textContent).toContain(demo.blurb);
    }
  });

  it("keeps the decorative arrow out of the accessible name", () => {
    render(<DemoCasesStrip />);

    const first = DEMO_BRIEFS[0];
    expect(first).toBeDefined();
    const link = screen.getByRole("link", {
      name: new RegExp(`open the ${first?.label} demo brief`, "i"),
    });
    expect(link.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("exposes a visible focus treatment and is reachable by keyboard", async () => {
    const user = userEvent.setup();
    render(<DemoCasesStrip />);

    await user.tab();

    const focused = document.activeElement as HTMLElement | null;
    expect(focused?.tagName).toBe("A");
    expect(focused?.className).toContain("focus-visible:outline-2");
    expect(focused?.className).toContain("focus-visible:border-brand/60");
  });

  it("only animates the lift for users who allow motion", () => {
    render(<DemoCasesStrip />);

    const link = screen.getAllByRole("link")[0];
    expect(link?.className).toContain("motion-safe:hover:-translate-y-0.5");
  });
});
