import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DirectoryCard } from "@/components/landing/directory-card";
import {
  INTERACTIVE_CARD_CLASS,
  usePointerBloom,
} from "@/components/shared/interactive-card";
import { CREATIVE_DIRECTORIES } from "@/data/directories";

function setEnvironment({
  finePointer,
  reducedMotion,
}: {
  finePointer: boolean;
  reducedMotion: boolean;
}) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-reduced-motion")
      ? reducedMotion
      : query.includes("pointer: fine")
        ? finePointer
        : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function Probe() {
  const bloom = usePointerBloom();
  return (
    <button type="button" data-testid="card" className={INTERACTIVE_CARD_CLASS} {...bloom}>
      Card
    </button>
  );
}

afterEach(() => {
  setEnvironment({ finePointer: false, reducedMotion: false });
});

describe("usePointerBloom", () => {
  it("writes the pointer position to CSS custom properties on a fine pointer", () => {
    setEnvironment({ finePointer: true, reducedMotion: false });
    render(<Probe />);

    const card = screen.getByTestId("card");
    card.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect;

    fireEvent.pointerMove(card, { clientX: 100, clientY: 50 });

    expect(card.style.getPropertyValue("--bloom-x")).toBe("50.0%");
    expect(card.style.getPropertyValue("--bloom-y")).toBe("50.0%");
  });

  it("clears the position when the pointer leaves", () => {
    setEnvironment({ finePointer: true, reducedMotion: false });
    render(<Probe />);

    const card = screen.getByTestId("card");
    card.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect;

    fireEvent.pointerMove(card, { clientX: 20, clientY: 20 });
    expect(card.style.getPropertyValue("--bloom-x")).not.toBe("");

    fireEvent.pointerLeave(card);
    expect(card.style.getPropertyValue("--bloom-x")).toBe("");
    expect(card.style.getPropertyValue("--bloom-y")).toBe("");
  });

  it("attaches nothing on a coarse pointer", () => {
    setEnvironment({ finePointer: false, reducedMotion: false });
    render(<Probe />);

    const card = screen.getByTestId("card");
    card.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect;

    fireEvent.pointerMove(card, { clientX: 100, clientY: 50 });
    expect(card.style.getPropertyValue("--bloom-x")).toBe("");
  });

  it("attaches nothing under reduced motion", () => {
    setEnvironment({ finePointer: true, reducedMotion: true });
    render(<Probe />);

    const card = screen.getByTestId("card");
    card.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect;

    fireEvent.pointerMove(card, { clientX: 100, clientY: 50 });
    expect(card.style.getPropertyValue("--bloom-x")).toBe("");
  });
});

describe("interactive card contract", () => {
  it("gives direction cards the shared class and a direction scope", () => {
    const [directory] = CREATIVE_DIRECTORIES;
    expect(directory).toBeDefined();
    if (!directory) {
      return;
    }

    render(<DirectoryCard directory={directory} />);

    const card = screen.getByRole("article");
    expect(card.className).toContain(INTERACTIVE_CARD_CLASS);
    // The bloom must be able to read --dir-* from this subtree.
    expect(card).toHaveAttribute("data-direction", directory.id);
  });

  it("keeps keyboard users informed without any pointer position", () => {
    const [directory] = CREATIVE_DIRECTORIES;
    if (!directory) {
      return;
    }
    setEnvironment({ finePointer: false, reducedMotion: false });
    render(<DirectoryCard directory={directory} />);

    // The focus treatment is CSS-driven via :focus-visible/:focus-within on the
    // shared class, so it needs no pointer coordinates to be visible.
    const card = screen.getByRole("article");
    const link = screen.getByRole("link", { name: /use this direction/i });
    link.focus();

    expect(link).toHaveFocus();
    expect(card.className).toContain(INTERACTIVE_CARD_CLASS);
    expect(link.className).toContain("focus-visible:outline-2");
    expect(card.style.getPropertyValue("--bloom-x")).toBe("");
  });
});
