/** Deterministic RNG. A run replays exactly from its seed. */
export type Rng = () => number;

const GOLDEN = 0x9e3779b9;

export const mulberry32 = (seed: number): Rng => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Each day gets its own stream derived from the run seed, so replaying day 40
 * never requires stepping through the 39 days before it.
 */
export const createDayRng = (runSeed: number, day: number): Rng =>
  mulberry32((runSeed + Math.imul(day + 1, GOLDEN)) >>> 0);

/** Integer in [min, max], inclusive. */
export const randomInt = (rng: Rng, min: number, max: number): number =>
  min + Math.floor(rng() * (max - min + 1));

export const pick = <T>(rng: Rng, items: readonly T[]): T | undefined => {
  if (items.length === 0) return undefined;
  return items[Math.floor(rng() * items.length)];
};

export interface Weighted<T> {
  value: T;
  weight: number;
}

export const pickWeighted = <T>(
  rng: Rng,
  entries: ReadonlyArray<Weighted<T>>,
): T | undefined => {
  const total = entries.reduce(
    (sum, entry) => sum + Math.max(0, entry.weight),
    0,
  );
  if (total <= 0) return undefined;

  let cursor = rng() * total;
  for (const entry of entries) {
    cursor -= Math.max(0, entry.weight);
    if (cursor < 0) return entry.value;
  }
  return entries[entries.length - 1]?.value;
};

/** A fresh seed for a new run, derived from the clock. */
export const createRunSeed = (): number =>
  (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
