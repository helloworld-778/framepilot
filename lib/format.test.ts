import { describe, expect, it } from "vitest";

import { formatRelative, formatTimestamp } from "@/lib/format";

const now = new Date("2026-05-01T12:00:00.000Z");

function minutesAgo(minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString();
}

describe("formatRelative", () => {
  it("reads as just now inside the first minute", () => {
    expect(formatRelative(minutesAgo(0), now)).toBe("just now");
    expect(formatRelative(new Date(now.getTime() - 30_000).toISOString(), now)).toBe("just now");
  });

  it("handles the single-minute case", () => {
    expect(formatRelative(new Date(now.getTime() - 60_000).toISOString(), now)).toBe(
      "a minute ago",
    );
  });

  it("counts minutes, then hours, then days", () => {
    expect(formatRelative(minutesAgo(20), now)).toBe("20 minutes ago");
    expect(formatRelative(minutesAgo(60), now)).toBe("an hour ago");
    expect(formatRelative(minutesAgo(60 * 5), now)).toBe("5 hours ago");
    expect(formatRelative(minutesAgo(60 * 24), now)).toBe("yesterday");
    expect(formatRelative(minutesAgo(60 * 24 * 3), now)).toBe("3 days ago");
  });

  it("falls back to an absolute date beyond a week", () => {
    const old = minutesAgo(60 * 24 * 30);
    expect(formatRelative(old, now)).toBe(formatTimestamp(old));
  });

  it("never throws on unusable input", () => {
    expect(formatRelative("not a date", now)).toBe("Unknown date");
    expect(formatTimestamp("")).toBe("Unknown date");
  });
});

describe("formatTimestamp", () => {
  it("includes the day, month, year, and time", () => {
    const formatted = formatTimestamp("2026-05-01T12:00:00.000Z");
    expect(formatted).toMatch(/2026/);
    expect(formatted).toMatch(/\d{1,2}/);
    expect(formatted.length).toBeGreaterThan(8);
  });
});
