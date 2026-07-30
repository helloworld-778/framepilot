import type { SceneBrief } from "@/types";

export interface DemoBrief {
  slug: string;
  label: string;
  blurb: string;
  brief: SceneBrief;
}

/**
 * Four original demo briefs. No real business, person, or product is referenced;
 * each is written to exercise a different directory, duration, and ratio.
 */
export const DEMO_BRIEFS: DemoBrief[] = [
  {
    slug: "monsoon-coffee",
    label: "Monsoon coffee offer",
    blurb: "A small Jaipur café turning the first rain into a reason to visit.",
    brief: {
      description:
        "A small Jaipur cafe on the first afternoon of the monsoon. Rain streaks the window, steam lifts off a freshly poured cup, and the room glows warm against the grey street outside.",
      directoryId: "premium-product-film",
      purpose: "promotion",
      duration: 15,
      aspectRatio: "9:16",
      primarySubject: "hand-brewed monsoon coffee",
      targetAudience: "Jaipur students and young professionals",
      onScreenText: "Monsoon pour, all week",
    },
  },
  {
    slug: "cultural-fest",
    label: "Cultural fest invitation",
    blurb: "A college fest invite built for a wet Jaipur evening.",
    brief: {
      description:
        "A college campus on a rainy Jaipur evening before the cultural fest opens. String lights reflect in puddles, students carry painted banners, and a stage waits under a canopy.",
      directoryId: "whimsical-fantasy",
      purpose: "invitation",
      duration: 15,
      aspectRatio: "9:16",
      primarySubject: "student performers setting up the stage",
      targetAudience: "students across nearby colleges",
      onScreenText: "Friday, 6 pm, main lawn",
    },
  },
  {
    slug: "craft-collective",
    label: "Craft collective",
    blurb: "A women-led collective showing the work behind each piece.",
    brief: {
      description:
        "A women-led craft collective working through the afternoon in a shared workroom. Block-printed cloth dries on a line, hands press dye into fabric, and finished pieces are stacked by the window.",
      directoryId: "documentary-realism",
      purpose: "promotion",
      duration: 30,
      aspectRatio: "1:1",
      primarySubject: "hand block-printed textiles",
      targetAudience: "buyers who care where things come from",
      onScreenText: "Made by hand, sold direct",
    },
  },
  {
    slug: "plastic-awareness",
    label: "Single-use plastic",
    blurb: "A community message about what a single wrapper becomes.",
    brief: {
      description:
        "A neighbourhood market at closing time where single-use plastic collects along the drain edge. Wind moves a wrapper across wet stone while shutters come down for the night.",
      directoryId: "nonlinear-suspense",
      purpose: "awareness",
      duration: 30,
      aspectRatio: "16:9",
      primarySubject: "a single discarded wrapper",
      targetAudience: "market traders and evening shoppers",
      onScreenText: "It does not leave",
    },
  },
];

export const DEMO_BRIEF_BY_SLUG: Record<string, DemoBrief> = Object.fromEntries(
  DEMO_BRIEFS.map((demo) => [demo.slug, demo]),
);
