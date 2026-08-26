import { describe, expect, it } from 'vitest';
import { createDayRng, mulberry32, pickWeighted, randomInt } from './rng';

describe('mulberry32', () => {
  it('produces the same stream for the same seed', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const left = [a(), a(), a(), a()];
    const right = [b(), b(), b(), b()];
    expect(left).toEqual(right);
  });

  it('produces a different stream for a different seed', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it('stays inside [0, 1)', () => {
    const rng = mulberry32(7);
    for (let index = 0; index < 500; index += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('createDayRng', () => {
  it('gives each day its own reproducible stream', () => {
    expect(createDayRng(99, 5)()).toBe(createDayRng(99, 5)());
  });

  it('does not repeat the previous day', () => {
    expect(createDayRng(99, 5)()).not.toBe(createDayRng(99, 6)());
  });
});

describe('randomInt', () => {
  it('covers the range inclusively', () => {
    const rng = mulberry32(3);
    const seen = new Set<number>();
    for (let index = 0; index < 400; index += 1) {
      const value = randomInt(rng, 1, 3);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(3);
      seen.add(value);
    }
    expect(seen.size).toBe(3);
  });
});

describe('pickWeighted', () => {
  it('never returns a zero-weight entry', () => {
    const rng = mulberry32(11);
    for (let index = 0; index < 200; index += 1) {
      const picked = pickWeighted(rng, [
        { value: 'never', weight: 0 },
        { value: 'always', weight: 5 },
      ]);
      expect(picked).toBe('always');
    }
  });

  it('returns undefined when nothing is eligible', () => {
    expect(pickWeighted(mulberry32(1), [])).toBeUndefined();
    expect(
      pickWeighted(mulberry32(1), [{ value: 'x', weight: 0 }]),
    ).toBeUndefined();
  });
});
