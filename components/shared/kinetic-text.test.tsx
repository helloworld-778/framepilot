import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { HeroSection } from "@/components/landing/hero-section";
import {
  KineticPhrase,
  KineticText,
  hasRevealed,
  resetRevealMemory,
} from "@/components/shared/kinetic-text";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { DEMO_BRIEFS } from "@/data/demo-projects";
import { generateDirection } from "@/lib/director";

const demo = DEMO_BRIEFS[0];
if (!demo) {
  throw new Error("Demo briefs are missing");
}
const output = generateDirection(demo.brief, { now: "2026-05-01T10:00:00.000Z" });

beforeEach(() => {
  resetRevealMemory();
});

describe("KineticText", () => {
  it("keeps the text in the DOM so it reads without JavaScript animation", () => {
    render(
      <KineticText>
        <KineticPhrase>Direct the scene</KineticPhrase>
        <KineticPhrase>before you generate it.</KineticPhrase>
      </KineticText>,
    );

    expect(screen.getByText("Direct the scene")).toBeInTheDocument();
    expect(screen.getByText("before you generate it.")).toBeInTheDocument();
  });

  it("reveals by phrase, never by character", () => {
    render(
      <KineticText>
        <KineticPhrase>Direct the scene</KineticPhrase>
      </KineticText>,
    );

    const phrase = screen.getByText("Direct the scene");
    // One element per phrase: no per-character spans.
    expect(phrase.children).toHaveLength(0);
    expect(phrase.parentElement?.className).toContain("fp-reveal");
  });

  it("plays once per key and renders statically afterwards", () => {
    const first = render(
      <KineticText revealKey="seed-abc">
        <KineticPhrase>Monsoon pour</KineticPhrase>
      </KineticText>,
    );
    expect(screen.getByText("Monsoon pour").parentElement?.className).toContain(
      "fp-reveal",
    );
    expect(hasRevealed("seed-abc")).toBe(true);
    first.unmount();

    // Reopening the same generated output must not replay the reveal.
    render(
      <KineticText revealKey="seed-abc">
        <KineticPhrase>Monsoon pour</KineticPhrase>
      </KineticText>,
    );
    expect(screen.getByText("Monsoon pour").parentElement?.className).not.toContain(
      "fp-reveal",
    );
  });

  it("treats a different generated output as a new arrival", () => {
    render(
      <KineticText revealKey="seed-one">
        <KineticPhrase>First</KineticPhrase>
      </KineticText>,
    );
    render(
      <KineticText revealKey="seed-two">
        <KineticPhrase>Second</KineticPhrase>
      </KineticText>,
    );

    expect(screen.getByText("Second").parentElement?.className).toContain("fp-reveal");
  });
});

describe("reveal usage", () => {
  it("uses the exact hero headline copy inside a single h1", () => {
    render(<HeroSection />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Direct the scenebefore you generate it.");
    expect(screen.getByText("before you generate it.").className).toContain(
      "text-brand-soft",
    );
  });

  it("keeps the workspace project title exact and revealed once", () => {
    const { unmount } = render(<WorkspaceHeader output={output} />);

    expect(
      screen.getByRole("heading", { level: 1, name: output.projectTitle }),
    ).toBeInTheDocument();
    expect(hasRevealed(`workspace-title-${output.meta.seed}`)).toBe(true);
    unmount();

    // A save or a reopen re-renders the same seed: no second reveal.
    render(<WorkspaceHeader output={output} />);
    expect(
      screen.getByText(output.projectTitle).parentElement?.className,
    ).not.toContain("fp-reveal");
  });

  it("shows a renamed project title without animating it again", () => {
    render(<WorkspaceHeader output={output} projectTitle="Monsoon launch cut" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Monsoon launch cut" }),
    ).toBeInTheDocument();
  });
});
