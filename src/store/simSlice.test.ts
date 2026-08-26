import { beforeEach, describe, expect, it } from 'vitest';
import { STARTER_SUPPLIES } from '@/data/items';
import { makeSurvivor } from '@/features/simulation/testUtils';
import { resetStore, useStore } from './index';

const state = () => useStore.getState();

const seedRun = (
  survivors = [makeSurvivor('a', '민수'), makeSurvivor('b', '지연')],
  inventory = [
    { itemId: 'cannedFood', quantity: 40 },
    { itemId: 'bottledWater', quantity: 40 },
  ],
) => {
  resetStore();
  // A fresh run now starts stocked, so a test that wants a bare shelf has to
  // clear it first.
  state().inventory.forEach((entry) => state().changeQuantity(entry.itemId, -entry.quantity));
  survivors.forEach((survivor) => state().addSurvivor(survivor));
  state().addItems(inventory);
};

describe('advanceOneDay', () => {
  beforeEach(() => {
    resetStore();
  });

  it('moves the day forward and writes to the log', () => {
    seedRun();
    state().advanceOneDay();

    expect(state().sim.day).toBe(1);
    expect(state().log.length).toBeGreaterThan(0);
  });

  it('leaves the run alone when nobody is alive', () => {
    resetStore();
    state().advanceOneDay();

    expect(state().sim.day).toBe(0);
    expect(state().log).toHaveLength(0);
  });

  /*
   * Both directions are live now: the group eats a unit each per day and
   * forages more than that while it is healthy, so the assertion is that the
   * shelf is actually being worked rather than which way it moved.
   */
  it('keeps the shelf moving as the days pass', () => {
    seedRun([
      makeSurvivor('a', '민수'),
      makeSurvivor('b', '지연'),
      makeSurvivor('c', '현우'),
      makeSurvivor('d', '서윤'),
    ]);

    const cans = () =>
      state().inventory.find((entry) => entry.itemId === 'cannedFood')
        ?.quantity ?? 0;

    // Sampled every day rather than compared end to end: income and spend are
    // close enough now that a thirty-day window can land back on its start.
    const seen = new Set<number>([cans()]);
    for (let index = 0; index < 30; index += 1) {
      const pending = state().sim.pendingChoice;
      if (pending) state().chooseOption(pending.options[0]?.id ?? '');
      state().advanceOneDay();
      seen.add(cans());
    }

    expect(seen.size).toBeGreaterThan(1);
    expect(cans()).toBeGreaterThan(0);
  });

  it('keeps the same seed across days so the run stays replayable', () => {
    seedRun();
    const seed = state().sim.runSeed;
    state().advanceOneDay();
    // Day one may end on a decision; the run waits until it is answered.
    const pending = state().sim.pendingChoice;
    if (pending) state().chooseOption(pending.options[0]?.id ?? '');
    state().advanceOneDay();

    expect(state().sim.runSeed).toBe(seed);
    expect(state().sim.day).toBe(2);
  });

  it('carries deprivation counters out of the engine', () => {
    seedRun(undefined, []);
    state().advanceOneDay();

    // Day 1 is no longer guaranteed to be a miss — foraging runs before
    // upkeep and can put something on an empty shelf. What matters here is
    // that the counters make it across the engine boundary at all.
    expect(state().sim.deprivation['a']).toBeDefined();
    expect(state().sim.deprivation['b']).toBeDefined();
    expect(typeof state().sim.deprivation['a']?.food).toBe('number');
  });

  it('leaves setup phase once the first day runs', () => {
    seedRun();
    expect(state().sim.phase).toBe('setup');
    state().advanceOneDay();
    expect(state().sim.phase).not.toBe('setup');
  });

  it('ends the run when the last survivor dies', () => {
    seedRun([
      makeSurvivor('a', '민수', {
        // hp gone, starving, and carrying a wound — nothing mends them, so
        // the day resolves the death.
        stats: { hp: 0, stamina: 40, hunger: 100, morale: 40, infection: 5 },
      }),
    ]);
    state().advanceOneDay();

    expect(state().sim.phase).toBe('ended');
    expect(state().survivors.every((survivor) => !survivor.alive)).toBe(true);
  });

  it('refuses to advance an ended run', () => {
    // Stated outright rather than starved into it: a lone survivor forages
    // well enough now that forty days no longer reliably kills anybody.
    seedRun([makeSurvivor('a', '민수')]);
    state().advanceOneDay();
    state().setPhase('ended');

    const day = state().sim.day;
    const entries = state().log.length;
    state().advanceOneDay();

    expect(state().sim.day).toBe(day);
    expect(state().log).toHaveLength(entries);
  });

  it('gives every log entry a unique id across days', () => {
    seedRun();
    for (let index = 0; index < 12; index += 1) {
      const pending = state().sim.pendingChoice;
      if (pending) state().chooseOption(pending.options[0]?.id ?? '');
      state().advanceOneDay();
    }

    const ids = state().log.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('resetStore', () => {
  it('clears the roster, the log and the day', () => {
    seedRun();
    state().advanceOneDay();
    resetStore();

    expect(state().survivors).toHaveLength(0);
    expect(state().log).toHaveLength(0);
    // A reset hands the next run its starting supplies.
    expect(state().inventory).toHaveLength(STARTER_SUPPLIES.length);
    expect(state().sim.day).toBe(0);
    expect(state().sim.phase).toBe('setup');
  });

  it('starts the next run on a different seed', () => {
    seedRun();
    const first = state().sim.runSeed;
    resetStore();

    expect(state().sim.runSeed).not.toBe(first);
  });
});

describe('hovered survivor', () => {
  it('tracks which name the log is pointing at', () => {
    resetStore();
    state().setHoveredSurvivor('a');
    expect(state().hoveredSurvivorId).toBe('a');

    state().setHoveredSurvivor(null);
    expect(state().hoveredSurvivorId).toBeNull();
  });
});

describe('using an item on someone', () => {
  beforeEach(() => {
    resetStore();
  });

  it('spends a unit and moves that survivor’s stats', () => {
    seedRun([makeSurvivor('a', '민수', {
      stats: { hp: 50, stamina: 80, hunger: 30, morale: 70, infection: 0 },
    })], [{ itemId: 'bandage', quantity: 2 }]);

    state().useItemOn('bandage', 'a');

    expect(state().survivors[0]?.stats.hp).toBe(60);
    expect(
      state().inventory.find((entry) => entry.itemId === 'bandage')?.quantity,
    ).toBe(1);
  });

  it('writes it to the log so the journal shows the player’s hand', () => {
    seedRun([makeSurvivor('a', '민수')], [{ itemId: 'painkiller', quantity: 1 }]);
    state().useItemOn('painkiller', 'a');

    const last = state().log[state().log.length - 1];
    expect(last?.message).toContain('민수');
    expect(last?.message).toContain('진통제');
  });

  it('refuses when the shelf is empty', () => {
    seedRun([makeSurvivor('a', '민수')], []);
    state().useItemOn('bandage', 'a');

    expect(state().log).toHaveLength(0);
  });

  it('refuses on the dead', () => {
    seedRun(
      [makeSurvivor('a', '민수', { alive: false, status: '사망' })],
      [{ itemId: 'bandage', quantity: 1 }],
    );
    state().useItemOn('bandage', 'a');

    expect(
      state().inventory.find((entry) => entry.itemId === 'bandage')?.quantity,
    ).toBe(1);
  });

  it('refuses items that are carried, not consumed', () => {
    seedRun([makeSurvivor('a', '민수')], [{ itemId: 'bat', quantity: 1 }]);
    state().useItemOn('bat', 'a');

    expect(
      state().inventory.find((entry) => entry.itemId === 'bat')?.quantity,
    ).toBe(1);
  });

  it('never pushes a stat past its ceiling', () => {
    seedRun([makeSurvivor('a', '민수')], [{ itemId: 'tourniquet', quantity: 1 }]);
    state().useItemOn('tourniquet', 'a');

    expect(state().survivors[0]?.stats.hp).toBe(100);
  });
});
