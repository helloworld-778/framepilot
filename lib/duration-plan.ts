import { MIN_SHOT_SECONDS } from "@/lib/constants";

/**
 * Turn beat weights into whole-second shot lengths that sum to exactly the
 * requested duration.
 *
 * Largest-remainder first, then a minimum-length clamp that borrows seconds
 * from the longest shots. The total is never allowed to drift.
 */
export function allocateDurations(
  totalSeconds: number,
  weights: readonly number[],
  minSeconds: number = MIN_SHOT_SECONDS,
): number[] {
  if (weights.length === 0) {
    throw new Error("allocateDurations needs at least one weight");
  }
  if (!Number.isInteger(totalSeconds) || totalSeconds <= 0) {
    throw new Error(`allocateDurations needs a positive whole total, got ${totalSeconds}`);
  }

  const count = weights.length;

  // Not enough seconds to honour the minimum: spread as evenly as possible.
  if (totalSeconds < minSeconds * count) {
    const base = Math.floor(totalSeconds / count);
    const result = new Array<number>(count).fill(base);
    let leftover = totalSeconds - base * count;
    for (let index = 0; leftover > 0; index = (index + 1) % count) {
      result[index] = (result[index] ?? 0) + 1;
      leftover -= 1;
    }
    return result;
  }

  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  if (weightTotal <= 0) {
    throw new Error("allocateDurations needs positive weights");
  }

  const exact = weights.map((weight) => (weight / weightTotal) * totalSeconds);
  const result = exact.map((value) => Math.floor(value));

  // Largest-remainder distribution of the leftover whole seconds.
  let remaining = totalSeconds - result.reduce((sum, value) => sum + value, 0);
  const byRemainder = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  let cursor = 0;
  while (remaining > 0) {
    const target = byRemainder[cursor % byRemainder.length];
    if (target) {
      result[target.index] = (result[target.index] ?? 0) + 1;
      remaining -= 1;
    }
    cursor += 1;
  }

  // Clamp short shots by borrowing from the longest one that can spare a second.
  for (let index = 0; index < result.length; index += 1) {
    while ((result[index] ?? 0) < minSeconds) {
      let donorIndex = -1;
      let donorValue = minSeconds;
      for (let candidate = 0; candidate < result.length; candidate += 1) {
        const value = result[candidate] ?? 0;
        if (candidate !== index && value > donorValue) {
          donorIndex = candidate;
          donorValue = value;
        }
      }
      if (donorIndex === -1) {
        break;
      }
      result[donorIndex] = (result[donorIndex] ?? 0) - 1;
      result[index] = (result[index] ?? 0) + 1;
    }
  }

  const finalTotal = result.reduce((sum, value) => sum + value, 0);
  if (finalTotal !== totalSeconds) {
    throw new Error(
      `allocateDurations drifted: expected ${totalSeconds}s, produced ${finalTotal}s`,
    );
  }

  return result;
}
