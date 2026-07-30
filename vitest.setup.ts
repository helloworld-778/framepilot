import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// jsdom does not implement matchMedia; Framer Motion and our reduced-motion
// helpers both read it.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// jsdom has no layout engine; several Radix primitives probe these.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

if (!("ResizeObserver" in globalThis)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

if (!("PointerEvent" in globalThis)) {
  globalThis.PointerEvent = globalThis.MouseEvent as unknown as typeof PointerEvent;
}

// Radix primitives call these before jsdom defines them.
for (const method of ["hasPointerCapture", "setPointerCapture", "releasePointerCapture"] as const) {
  if (!(method in Element.prototype)) {
    Object.defineProperty(Element.prototype, method, { value: () => false });
  }
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
