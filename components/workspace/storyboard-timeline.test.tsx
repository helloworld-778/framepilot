import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StoryboardTimeline } from "@/components/workspace/storyboard-timeline";
import { DEMO_BRIEFS } from "@/data/demo-projects";
import { generateDirection } from "@/lib/director";
import type { StoryboardShot } from "@/types";

/**
 * The timeline's promise is that segment width is truthful to shot duration.
 * jsdom has no layout engine, so the assertions here read the two things the
 * component actually publishes: the visible per-shot timings, and the flex
 * growth factor that drives width. No pixels, no snapshots.
 */

function shot(
  order: number,
  role: StoryboardShot["role"],
  durationSeconds: number,
): StoryboardShot {
  return {
    id: `shot-${order}`,
    order,
    role,
    title: `Shot ${order}`,
    durationSeconds,
    shotType: "Medium, 35mm equivalent",
    visualDirection: "Rain marks the window.",
    camera: "Locked off",
    lighting: "Single hard key",
    composition: "Subject on the left third",
    sound: "Room tone",
    transition: "Cut",
    edited: false,
  };
}

/** Deliberately uneven so proportions cannot pass by accident. */
const unevenShots = [
  shot(1, "establish", 2),
  shot(2, "develop", 5),
  shot(3, "resolve", 8),
];

function growthFactors(segments: HTMLElement[]): number[] {
  return segments.map((segment) => Number(segment.parentElement?.style.flexGrow));
}

function renderTimeline(
  shots: StoryboardShot[],
  totalSeconds: number,
  activeShotId: string | null = null,
) {
  const onSelect = vi.fn();
  render(
    <StoryboardTimeline
      shots={shots}
      activeShotId={activeShotId}
      onSelect={onSelect}
      totalSeconds={totalSeconds}
    />,
  );
  const group = screen.getByRole("group", { name: /shot timeline/i });
  return { onSelect, group, segments: within(group).getAllByRole("button") };
}

describe("StoryboardTimeline proportional widths", () => {
  it("shows one segment per shot, each labelled with its own duration", () => {
    const { segments } = renderTimeline(unevenShots, 15);

    expect(segments).toHaveLength(3);
    expect(within(segments[0]!).getByText("2s")).toBeInTheDocument();
    expect(within(segments[1]!).getByText("5s")).toBeInTheDocument();
    expect(within(segments[2]!).getByText("8s")).toBeInTheDocument();
  });

  it("gives a longer shot a proportionally wider segment than a shorter one", () => {
    const { segments } = renderTimeline(unevenShots, 15);

    const growth = growthFactors(segments);
    // Growth factor is the duration itself, and basis is zero, so width is
    // driven purely by duration rather than by content.
    expect(growth).toEqual([2, 5, 8]);
    expect(growth[2]!).toBeGreaterThan(growth[1]!);
    expect(growth[1]!).toBeGreaterThan(growth[0]!);
    for (const segment of segments) {
      expect(Number.parseFloat(segment.parentElement?.style.flexBasis ?? "")).toBe(0);
    }
  });

  it("keeps equal-duration shots at equal width", () => {
    const even = [shot(1, "establish", 5), shot(2, "develop", 5), shot(3, "resolve", 5)];
    const { segments } = renderTimeline(even, 15);

    expect(growthFactors(segments)).toEqual([5, 5, 5]);
  });

  it("lays the segments end to end across the selected runtime", () => {
    const { segments, group } = renderTimeline(unevenShots, 15);

    // Cumulative ranges: no gaps, no overlaps, last one lands on the runtime.
    expect(segments[0]).toHaveTextContent("0s–2s");
    expect(segments[1]).toHaveTextContent("2s–7s");
    expect(segments[2]).toHaveTextContent("7s–15s");
    expect(group.textContent).not.toContain("NaN");

    const total = unevenShots.reduce((sum, item) => sum + item.durationSeconds, 0);
    expect(total).toBe(15);
    expect(screen.getByText(/3 shots · 15s/)).toBeInTheDocument();
  });

  it("stays truthful for every runtime the generator produces", () => {
    for (const demo of DEMO_BRIEFS) {
      const output = generateDirection(demo.brief, { now: "2026-05-01T10:00:00.000Z" });
      const { segments, group } = renderTimeline(
        output.shots,
        output.meta.totalDurationSeconds,
      );

      expect(growthFactors(segments)).toEqual(
        output.shots.map((item) => item.durationSeconds),
      );

      let elapsed = 0;
      for (const [index, item] of output.shots.entries()) {
        expect(segments[index]).toHaveTextContent(
          `${elapsed}s–${elapsed + item.durationSeconds}s`,
        );
        elapsed += item.durationSeconds;
      }
      expect(elapsed).toBe(demo.brief.duration);
      expect(group.textContent).toContain(`${demo.brief.duration}s`);

      // Each iteration renders its own tree; clear it before the next runtime.
      screen.getByRole("group", { name: /shot timeline/i }).remove();
    }
  });
});

describe("StoryboardTimeline keyboard contract", () => {
  it("moves and selects with the arrow keys, wrapping at both ends", async () => {
    const user = userEvent.setup();
    const { segments, onSelect } = renderTimeline(unevenShots, 15, "shot-1");

    await user.click(segments[0]!);
    expect(onSelect).toHaveBeenLastCalledWith("shot-1");

    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(segments[1]).toHaveFocus());
    expect(onSelect).toHaveBeenLastCalledWith("shot-2");

    await user.keyboard("{ArrowLeft}");
    await waitFor(() => expect(segments[0]).toHaveFocus());
    expect(onSelect).toHaveBeenLastCalledWith("shot-1");

    // Wraps backwards from the first segment to the last.
    await user.keyboard("{ArrowLeft}");
    await waitFor(() => expect(segments[2]).toHaveFocus());
    expect(onSelect).toHaveBeenLastCalledWith("shot-3");

    // And forwards from the last segment back to the first.
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(segments[0]).toHaveFocus());
    expect(onSelect).toHaveBeenLastCalledWith("shot-1");
  });

  it("jumps to the first and last shot with Home and End", async () => {
    const user = userEvent.setup();
    const { segments, onSelect } = renderTimeline(unevenShots, 15, "shot-2");

    await user.click(segments[1]!);

    await user.keyboard("{End}");
    await waitFor(() => expect(segments[2]).toHaveFocus());
    expect(onSelect).toHaveBeenLastCalledWith("shot-3");

    await user.keyboard("{Home}");
    await waitFor(() => expect(segments[0]).toHaveFocus());
    expect(onSelect).toHaveBeenLastCalledWith("shot-1");
  });

  it("marks only the active shot as current", () => {
    const { segments } = renderTimeline(unevenShots, 15, "shot-2");

    expect(segments[0]).not.toHaveAttribute("aria-current");
    expect(segments[1]).toHaveAttribute("aria-current", "true");
    expect(segments[2]).not.toHaveAttribute("aria-current");
  });
});
