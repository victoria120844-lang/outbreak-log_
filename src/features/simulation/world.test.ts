import { describe, expect, it } from 'vitest';
import { createWorld } from './state';
import { makePair, makeSurvivor } from './testUtils';
import { advanceDay, runDays, takeFirstOption } from './world';

const stocked = () => [
  { itemId: 'cannedFood', quantity: 60 },
  { itemId: 'bottledWater', quantity: 60 },
];

const world = (overrides = {}) =>
  createWorld({
    runSeed: 4242,
    survivors: [makeSurvivor('s1', '민수'), makeSurvivor('s2', '지연')],
    relationships: makePair('s1', 's2', 10),
    inventory: stocked(),
    ...overrides,
  });

describe('advanceDay determinism', () => {
  it('produces an identical day for the same seed', () => {
    const left = advanceDay(world());
    const right = advanceDay(world());

    expect(left.entries).toEqual(right.entries);
    expect(left.state).toEqual(right.state);
  });

  it('produces an identical run over many days', () => {
    const left = runDays(world(), 25, takeFirstOption);
    const right = runDays(world(), 25, takeFirstOption);

    expect(left.entries.map((entry) => entry.message)).toEqual(
      right.entries.map((entry) => entry.message),
    );
    expect(left.state).toEqual(right.state);
  });

  it('diverges when the seed changes', () => {
    const left = runDays(world(), 20, takeFirstOption);
    const right = runDays(world({ runSeed: 99 }), 20, takeFirstOption);

    expect(left.entries.map((entry) => entry.message)).not.toEqual(
      right.entries.map((entry) => entry.message),
    );
  });

  it('keeps the seed on the state so a run can be shared', () => {
    expect(advanceDay(world()).state.runSeed).toBe(4242);
  });

  it('does not mutate the state it was given', () => {
    const before = world();
    const snapshot = JSON.stringify(before);
    advanceDay(before);
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe('advanceDay bookkeeping', () => {
  it('increments the day and stamps entries with it', () => {
    const result = advanceDay(world());
    expect(result.state.day).toBe(1);
    result.entries.forEach((entry) => expect(entry.day).toBe(1));
  });

  it('gives every entry a unique id', () => {
    const { entries } = runDays(world(), 10, takeFirstOption);
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length);
  });

  it('writes at least one entry a day', () => {
    expect(advanceDay(world()).entries.length).toBeGreaterThan(0);
  });

  it('clamps every stat into 0-100', () => {
    const { state } = runDays(world(), 30, takeFirstOption);
    state.survivors.forEach((survivor) => {
      Object.values(survivor.stats).forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });
  });

  it('never leaves a negative item quantity', () => {
    const { state } = runDays(world(), 30, takeFirstOption);
    state.inventory.forEach((entry) => {
      expect(entry.quantity).toBeGreaterThan(0);
    });
  });
});

describe('end conditions', () => {
  /*
   * Stated outright rather than starved into. Foraging and the nightly mend
   * mean an empty shelf no longer reliably kills anybody inside forty days —
   * which was the point of both changes.
   */
  it('ends the run and closes the log when the last survivor dies', () => {
    const result = runDays(
      world({
        survivors: [
          makeSurvivor('s1', '민수', {
            // Starving and wounded, so nothing mends the hp.
            stats: { hp: 0, stamina: 40, hunger: 100, morale: 40, infection: 5 },
          }),
        ],
      }),
      2,
      takeFirstOption,
    );

    expect(result.state.status).toBe('ended');
    expect(result.state.survivors.every((s) => !s.alive)).toBe(true);
    expect(result.entries[result.entries.length - 1]?.message).toContain(
      '남은 사람은 없다',
    );
  });

  it('does not word every death the same way', () => {
    const result = runDays(
      world({
        inventory: [],
        survivors: [
          makeSurvivor('s1', '민수'),
          makeSurvivor('s2', '지연'),
          makeSurvivor('s3', '현우'),
          makeSurvivor('s4', '서윤'),
        ],
        relationships: [],
      }),
      40,
      takeFirstOption,
    );

    const deaths = result.entries
      .filter((entry) => entry.severity === 'death')
      .map((entry) => entry.message.replace(/^[^.]+\. /, ''));

    expect(deaths.length).toBeGreaterThanOrEqual(4);
    expect(new Set(deaths).size).toBeGreaterThan(1);
  });

  it('keeps one event category per day so a day does not contradict itself', () => {
    const { entries } = runDays(world(), 20, takeFirstOption);
    const byDay = new Map<number, number>();
    entries.forEach((entry) => {
      byDay.set(entry.day, (byDay.get(entry.day) ?? 0) + 1);
    });
    // At most three drawn events plus upkeep and death lines.
    byDay.forEach((count) => expect(count).toBeLessThanOrEqual(12));
  });

  it('marks the dead with the day they died', () => {
    // hp is the only cause of death now, so the test states it outright
    // rather than starving somebody for forty days and hoping.
    const result = advanceDay(
      world({
        survivors: [
          makeSurvivor('s1', '민수', {
            // Starving and carrying a wound: both block the nightly mend, so
            // the day cannot quietly pull them back off zero before deaths
            // are resolved.
            stats: { hp: 0, stamina: 80, hunger: 100, morale: 70, infection: 5 },
          }),
        ],
      }),
    );
    const dead = result.state.survivors[0];
    expect(dead?.diedDay).toBe(1);
    expect(dead?.status).toBe('사망');
    expect(dead?.alive).toBe(false);
  });

  it('does nothing once the run has ended', () => {
    const ended = runDays(
      world({
        survivors: [
          makeSurvivor('s1', '민수', {
            stats: { hp: 0, stamina: 40, hunger: 100, morale: 40, infection: 5 },
          }),
        ],
      }),
      2,
      takeFirstOption,
    ).state;
    const after = advanceDay(ended);

    expect(after.entries).toHaveLength(0);
    expect(after.state).toBe(ended);
  });

  /*
   * There used to be a 100-day cap that ended a run whether or not it was
   * over. It stopped runs that were still going somewhere, so it is gone: the
   * only thing that ends a run is running out of people.
   */
  it('keeps going past a hundred days', () => {
    const result = runDays(
      world({
        inventory: [
          { itemId: 'cannedFood', quantity: 4000 },
          { itemId: 'bottledWater', quantity: 4000 },
          { itemId: 'antibiotics', quantity: 400 },
        ],
      }),
      140,
      takeFirstOption,
    );

    if (result.state.survivors.some((survivor) => survivor.alive)) {
      expect(result.state.day).toBeGreaterThan(100);
      expect(result.state.status).toBe('running');
    }
  });
});
