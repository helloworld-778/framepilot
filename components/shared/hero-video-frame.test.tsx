import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HeroShowreel } from "@/components/landing/hero-showreel";
import { HeroVideoFrame } from "@/components/shared/hero-video-frame";
import { DIRECTORY_IDS } from "@/lib/schemas";
import { HERO_CLIPS, HERO_SHOWREEL_ORDER, heroFrameLabel } from "@/lib/hero-media";
import type { DirectoryId } from "@/types";

/** Lets a test pretend the user asked for reduced motion. */
function setReducedMotion(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? matches : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function videos(): HTMLVideoElement[] {
  return Array.from(document.querySelectorAll("video"));
}

afterEach(() => {
  setReducedMotion(false);
});

describe("hero media manifest", () => {
  it("maps every direction to its fixed clip paths", () => {
    expect(HERO_CLIPS["nonlinear-suspense"].webm).toBe("/media/hero/suspense-loop.webm");
    expect(HERO_CLIPS["nonlinear-suspense"].mp4).toBe("/media/hero/suspense-loop.mp4");
    expect(HERO_CLIPS["whimsical-fantasy"].webm).toBe("/media/hero/fantasy-loop.webm");
    expect(HERO_CLIPS["whimsical-fantasy"].mp4).toBe("/media/hero/fantasy-loop.mp4");
    expect(HERO_CLIPS["documentary-realism"].webm).toBe("/media/hero/realism-loop.webm");
    expect(HERO_CLIPS["documentary-realism"].mp4).toBe("/media/hero/realism-loop.mp4");
    expect(HERO_CLIPS["premium-product-film"].webm).toBe("/media/hero/product-loop.webm");
    expect(HERO_CLIPS["premium-product-film"].mp4).toBe("/media/hero/product-loop.mp4");
  });

  it("covers all four directions with unique clips and ordered labels", () => {
    expect(Object.keys(HERO_CLIPS).sort()).toEqual([...DIRECTORY_IDS].sort());
    const sources = Object.values(HERO_CLIPS).flatMap((clip) => [clip.webm, clip.mp4]);
    expect(new Set(sources).size).toBe(8);
    expect(HERO_SHOWREEL_ORDER.map((id) => heroFrameLabel(id))).toEqual([
      "01 Suspense",
      "02 Fantasy",
      "03 Realism",
      "04 Product",
    ]);
  });
});

describe("HeroVideoFrame", () => {
  it.each(DIRECTORY_IDS.map((id) => [id] as [DirectoryId]))(
    "renders %s with WebM before MP4 and no controls",
    (id) => {
      render(<HeroVideoFrame directoryId={id} caption="caption" />);

      const video = videos()[0];
      expect(video).toBeDefined();
      const sources = Array.from(video?.querySelectorAll("source") ?? []);
      expect(sources.map((source) => source.getAttribute("type"))).toEqual([
        "video/webm",
        "video/mp4",
      ]);
      expect(sources[0]?.getAttribute("src")).toBe(HERO_CLIPS[id].webm);
      expect(sources[1]?.getAttribute("src")).toBe(HERO_CLIPS[id].mp4);

      expect(video?.muted).toBe(true);
      expect(video).toHaveAttribute("playsinline");
      expect(video).toHaveAttribute("preload", "metadata");
      expect(video).toHaveAttribute("aria-hidden", "true");
      expect(video).toHaveAttribute("tabindex", "-1");
      expect(video?.hasAttribute("controls")).toBe(false);
      expect(video?.autoplay).toBe(true);
      expect(video?.loop).toBe(true);
    },
  );

  it("scopes the direction theme and keeps the label readable", () => {
    render(<HeroVideoFrame directoryId="whimsical-fantasy" caption="Warm and flowing" />);

    expect(screen.getByText("02 Fantasy")).toBeInTheDocument();
    expect(screen.getByText("Warm and flowing")).toBeInTheDocument();
    expect(document.querySelector('[data-direction="whimsical-fantasy"]')).not.toBeNull();
  });

  it("does not autoplay or loop under reduced motion, and keeps the frame intact", () => {
    setReducedMotion(true);
    const pause = vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => {});
    render(<HeroVideoFrame directoryId="nonlinear-suspense" caption="Cold and withheld" />);

    const video = videos()[0];
    expect(video?.autoplay).toBe(false);
    expect(video?.loop).toBe(false);
    expect(video?.muted).toBe(true);
    expect(video?.hasAttribute("controls")).toBe(false);
    // Belt and braces: the element is paused as soon as the preference is known.
    expect(pause).toHaveBeenCalled();
    // Label and layout survive.
    expect(screen.getByText("01 Suspense")).toBeInTheDocument();
    expect(screen.getByText("Cold and withheld")).toBeInTheDocument();
  });

  it("falls back to the CSS canvas when the media fails to load", () => {
    render(<HeroVideoFrame directoryId="documentary-realism" caption="Grounded" />);

    const video = videos()[0];
    expect(video).toBeDefined();
    // jsdom never loads media, so simulate the browser's error event.
    if (video) {
      fireEvent.error(video);
    }

    expect(videos()).toHaveLength(0);
    expect(document.querySelector(".fp-mood")).not.toBeNull();
    expect(screen.getByText("03 Realism")).toBeInTheDocument();
  });

  it("always renders a CSS mood layer behind the clip", () => {
    render(<HeroVideoFrame directoryId="premium-product-film" caption="Clean" />);
    expect(document.querySelector(".fp-mood")).not.toBeNull();
  });
});

describe("HeroShowreel", () => {
  it("renders one frame per direction in manifest order", () => {
    render(<HeroShowreel />);

    expect(videos()).toHaveLength(4);
    for (const id of HERO_SHOWREEL_ORDER) {
      expect(screen.getByText(heroFrameLabel(id))).toBeInTheDocument();
    }
  });

  it("uses no iframes or external hosts", () => {
    render(<HeroShowreel />);

    expect(document.querySelectorAll("iframe")).toHaveLength(0);
    for (const source of Array.from(document.querySelectorAll("source"))) {
      expect(source.getAttribute("src")).toMatch(/^\/media\/hero\//);
    }
  });

  it("states plainly that FramePilot does not generate video", () => {
    render(<HeroShowreel />);
    expect(screen.getByText(/does not\s+generate the video/i)).toBeInTheDocument();
  });
});

describe("reduced-motion store", () => {
  it("reacts to the media query rather than guessing", () => {
    const spy = vi.spyOn(window, "matchMedia");
    render(<HeroVideoFrame directoryId="nonlinear-suspense" caption="c" />);
    expect(spy).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
  });
});
