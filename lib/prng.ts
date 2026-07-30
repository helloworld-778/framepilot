/**
 * Seeded pseudo-random source. `Math.random` is never used anywhere in the
 * generation path — every choice has to be reproducible from the brief.
 */

export interface Rng {
  /** Next float in [0, 1). */
  next(): number;
  /** Pick one item. Throws on an empty list rather than returning undefined. */
  pick<T>(items: readonly T[]): T;
}

/** Mulberry32 — compact, well-distributed, and deterministic for a given seed. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: number): Rng {
  const next = mulberry32(seed);

  function pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error("createRng().pick called with an empty list");
    }
    const index = Math.floor(next() * items.length) % items.length;
    const item = items[index];
    if (item === undefined) {
      throw new Error("createRng().pick resolved an empty slot");
    }
    return item;
  }

  return { next, pick };
}
