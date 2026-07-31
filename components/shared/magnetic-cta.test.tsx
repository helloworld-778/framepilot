import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MagneticCta } from "@/components/shared/magnetic-cta";
import { Button } from "@/components/ui/button";

/** Drives the two media queries the primitive depends on. */
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

afterEach(() => {
  setEnvironment({ finePointer: false, reducedMotion: false });
});

describe("MagneticCta", () => {
  it("renders its child as the only interactive control", () => {
    setEnvironment({ finePointer: true, reducedMotion: false });
    render(
      <MagneticCta>
        <Button type="button">Create a scene</Button>
      </MagneticCta>,
    );

    const button = screen.getByRole("button", { name: "Create a scene" });
    expect(button).toBeInTheDocument();
    // Exactly one control: the wrapper must never introduce a nested button.
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(button.closest("button")).toBe(button);
    expect(button.parentElement?.tagName).toBe("SPAN");
  });

  it("keeps the child clickable and focusable", async () => {
    setEnvironment({ finePointer: true, reducedMotion: false });
    let clicks = 0;
    render(
      <MagneticCta>
        <Button type="button" onClick={() => (clicks += 1)}>
          Direct my scene
        </Button>
      </MagneticCta>,
    );

    const button = screen.getByRole("button", { name: "Direct my scene" });
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(clicks).toBe(1);
  });

  it("renders a plain static wrapper on a coarse pointer", () => {
    setEnvironment({ finePointer: false, reducedMotion: false });
    render(
      <MagneticCta>
        <Button type="button">Create a scene</Button>
      </MagneticCta>,
    );

    const wrapper = screen.getByRole("button").parentElement;
    // No motion transform is applied when pointer tracking is disabled.
    expect(wrapper?.getAttribute("style") ?? "").not.toContain("translate");
  });

  it("renders a plain static wrapper under reduced motion", () => {
    setEnvironment({ finePointer: true, reducedMotion: true });
    render(
      <MagneticCta>
        <Button type="button">Create a scene</Button>
      </MagneticCta>,
    );

    const wrapper = screen.getByRole("button").parentElement;
    expect(wrapper?.getAttribute("style") ?? "").not.toContain("translate");
    expect(screen.getByRole("button", { name: "Create a scene" })).toBeInTheDocument();
  });

  it("survives pointer movement without breaking the child", () => {
    setEnvironment({ finePointer: true, reducedMotion: false });
    render(
      <MagneticCta>
        <Button type="button">Create a scene</Button>
      </MagneticCta>,
    );

    const wrapper = screen.getByRole("button").parentElement as HTMLElement;
    fireEvent.pointerMove(wrapper, { clientX: 10, clientY: 10 });
    fireEvent.pointerLeave(wrapper);

    expect(screen.getByRole("button", { name: "Create a scene" })).toBeInTheDocument();
  });
});
