import type { CreativeDirectory, SceneBrief } from "@/types";

/**
 * Pull concrete, usable signals out of a free-text brief with a small keyword
 * lexicon. This is what stops generated direction from reading like a template:
 * the shots talk about rain, steam, and hands because those words were found,
 * not because every brief gets the same adjectives.
 */

export interface BriefSignals {
  /** Always non-empty; templates depend on it. */
  subject: string;
  setting: string;
  place: string;
  timeOfDay: string;
  weatherAdjective: string;
  textures: string[];
  actions: string[];
  audience: string;
  onScreenText: string;
  interiority: "interior" | "exterior" | "unspecified";
  wordCount: number;
  hasConcreteAction: boolean;
  hasConcreteNoun: boolean;
}

const PLACE_WORDS = [
  "cafe",
  "café",
  "coffee shop",
  "kitchen",
  "bakery",
  "workroom",
  "workshop",
  "studio",
  "shop",
  "store",
  "stall",
  "market",
  "street",
  "lane",
  "alley",
  "campus",
  "classroom",
  "library",
  "lawn",
  "courtyard",
  "terrace",
  "rooftop",
  "balcony",
  "doorway",
  "window",
  "riverbank",
  "park",
  "playground",
  "hall",
  "stage",
  "office",
  "warehouse",
  "garage",
  "farm",
  "field",
  "temple",
  "station",
  "bus stop",
  "home",
  "room",
] as const;

const TIME_WORDS = [
  "morning",
  "midday",
  "afternoon",
  "evening",
  "night",
  "dawn",
  "dusk",
  "sunrise",
  "sunset",
  "midnight",
] as const;

const WEATHER_MAP: ReadonlyArray<readonly [string, string]> = [
  ["monsoon", "monsoon"],
  ["downpour", "rain-soaked"],
  ["raining", "rainy"],
  ["rainy", "rainy"],
  ["rain", "rainy"],
  ["drizzle", "drizzling"],
  ["storm", "stormy"],
  ["thunder", "storm-lit"],
  ["fog", "foggy"],
  ["mist", "misty"],
  ["haze", "hazy"],
  ["overcast", "overcast"],
  ["cloudy", "overcast"],
  ["humid", "humid"],
  ["sunny", "sunlit"],
  ["sunlight", "sunlit"],
  ["sunshine", "sunlit"],
  ["heat", "heat-soaked"],
  ["wind", "windy"],
  ["snow", "snowy"],
  ["cold", "cold"],
];

const MATERIAL_MAP: ReadonlyArray<readonly [string, string]> = [
  ["steam", "rising steam"],
  ["glass", "cold glass"],
  ["window", "rain-marked glass"],
  ["puddle", "standing water"],
  ["water", "standing water"],
  ["stone", "wet stone"],
  ["concrete", "damp concrete"],
  ["pavement", "rain-dark pavement"],
  ["wood", "worn wood"],
  ["metal", "brushed metal"],
  ["steel", "brushed steel"],
  ["ceramic", "unglazed ceramic"],
  ["cup", "warm ceramic"],
  ["mug", "warm ceramic"],
  ["cloth", "hand-worked cloth"],
  ["fabric", "hand-worked cloth"],
  ["textile", "hand-worked cloth"],
  ["dye", "wet dye"],
  ["thread", "loose thread"],
  ["paper", "soft paper"],
  ["banner", "painted banner"],
  ["paint", "fresh paint"],
  ["plastic", "creased plastic"],
  ["wrapper", "creased plastic"],
  ["light", "drifting light"],
  ["lantern", "lantern glow"],
  ["string lights", "small warm bulbs"],
  ["dust", "dust in the air"],
  ["leaf", "wet leaves"],
  ["coffee", "fresh crema"],
  ["tea", "steeped colour"],
  ["bread", "torn crumb"],
];

const ACTION_MAP: ReadonlyArray<readonly [string, string]> = [
  ["pour", "pouring slowly"],
  ["brew", "brewing in close detail"],
  ["stir", "stirring once, unhurried"],
  ["press", "pressing by hand"],
  ["print", "printing a block by hand"],
  ["stitch", "stitching a seam"],
  ["sew", "stitching a seam"],
  ["weave", "working the weave"],
  ["dry", "drying in the air"],
  ["hang", "hanging in the light"],
  ["stack", "stacking finished work"],
  ["carry", "carrying something across frame"],
  ["walk", "walking through frame"],
  ["run", "moving quickly through frame"],
  ["set up", "setting up for the evening"],
  ["build", "building the setup"],
  ["arrange", "arranging the last details"],
  ["paint", "painting a last stroke"],
  ["serve", "serving across the counter"],
  ["hand", "handing something over"],
  ["sit", "settling into place"],
  ["wait", "waiting without speaking"],
  ["laugh", "laughing mid-sentence"],
  ["talk", "talking off-camera"],
  ["sweep", "sweeping the floor"],
  ["clean", "clearing the surface"],
  ["close", "closing up for the night"],
  ["open", "opening up for the day"],
  ["drift", "drifting across the ground"],
  ["move", "moving across the frame"],
  ["blow", "blown along by the wind"],
  ["collect", "collecting where nobody looks"],
  ["reflect", "catching a reflection"],
  ["lift", "lifting into the light"],
  ["dance", "moving in time"],
  ["perform", "performing for the room"],
  ["rehearse", "running it once more"],
];

const INTERIOR_WORDS = ["indoor", "inside", "interior", "room", "kitchen", "workroom", "cafe", "café", "hall", "office"];
const EXTERIOR_WORDS = ["outdoor", "outside", "exterior", "street", "market", "lawn", "park", "field", "rooftop", "campus", "riverbank"];

function normalise(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function findFirst(
  haystack: string,
  entries: ReadonlyArray<readonly [string, string]>,
): string {
  for (const [needle, value] of entries) {
    if (haystack.includes(needle)) {
      return value;
    }
  }
  return "";
}

function findAll(
  haystack: string,
  entries: ReadonlyArray<readonly [string, string]>,
  limit: number,
): string[] {
  const found: string[] = [];
  for (const [needle, value] of entries) {
    if (haystack.includes(needle) && !found.includes(value)) {
      found.push(value);
      if (found.length >= limit) {
        break;
      }
    }
  }
  return found;
}

function derivePlace(haystack: string): string {
  for (const word of PLACE_WORDS) {
    if (haystack.includes(word)) {
      return word === "café" ? "cafe" : word;
    }
  }
  return "";
}

function deriveSubject(brief: SceneBrief, haystack: string): string {
  const stated = brief.primarySubject.trim();
  if (stated.length > 0) {
    return stated;
  }
  const material = findFirst(haystack, MATERIAL_MAP);
  if (material) {
    return material;
  }
  const place = derivePlace(haystack);
  if (place) {
    return `the ${place} itself`;
  }
  return "the subject at the centre of the scene";
}

function buildSetting(place: string, timeOfDay: string, weather: string): string {
  const base = place ? `the ${place}` : "the location in the brief";
  if (weather && timeOfDay) {
    return timeOfDay === "night"
      ? `${base} on a ${weather} night`
      : `${base} on a ${weather} ${timeOfDay}`;
  }
  if (weather) {
    return `${base} in ${weather} light`;
  }
  if (timeOfDay) {
    return timeOfDay === "night" ? `${base} at night` : `${base} in the ${timeOfDay}`;
  }
  return base;
}

export function extractSignals(
  brief: SceneBrief,
  directory: CreativeDirectory,
): BriefSignals {
  const haystack = normalise(`${brief.description} ${brief.primarySubject}`);
  const words = haystack.split(" ").filter((word) => word.length > 0);

  const place = derivePlace(haystack);
  const timeOfDay = TIME_WORDS.find((word) => haystack.includes(word)) ?? "";
  const weatherAdjective = findFirst(haystack, WEATHER_MAP);

  const detectedTextures = findAll(haystack, MATERIAL_MAP, 3);
  const textures = [...detectedTextures, ...directory.textureWords].filter(
    (value, index, list) => list.indexOf(value) === index,
  );

  const detectedActions = findAll(haystack, ACTION_MAP, 3);
  const actions =
    detectedActions.length > 0
      ? detectedActions
      : ["holding still while the light changes", "moving just enough to read as alive"];

  const interiorHits = INTERIOR_WORDS.filter((word) => haystack.includes(word)).length;
  const exteriorHits = EXTERIOR_WORDS.filter((word) => haystack.includes(word)).length;

  return {
    subject: deriveSubject(brief, haystack),
    setting: buildSetting(place, timeOfDay, weatherAdjective),
    place,
    timeOfDay,
    weatherAdjective,
    textures,
    actions,
    audience:
      brief.targetAudience.trim().length > 0
        ? brief.targetAudience.trim()
        : "the people this is for",
    onScreenText:
      brief.onScreenText.trim().length > 0 ? brief.onScreenText.trim() : "the closing line",
    interiority:
      interiorHits === exteriorHits
        ? "unspecified"
        : interiorHits > exteriorHits
          ? "interior"
          : "exterior",
    wordCount: words.length,
    hasConcreteAction: detectedActions.length > 0,
    hasConcreteNoun: detectedTextures.length > 0 || place.length > 0,
  };
}
