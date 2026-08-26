import { describe, expect, it } from 'vitest';
import {
  INFECTION_MAX_GAIN,
  INFECTION_MIN_GAIN,
  INFECTION_TAKES_HOLD,
  runInfection,
  trustToward,
} from './infection';
import { mulberry32 } from './rng';
import { createDraft, createWorld } from './state';
import { makePair, makeSurvivor } from './testUtils';

const infected = (infection: number, overrides = {}) =>
  makeSurvivor('s1', '민수', {
    stats: { hp: 100, stamina: 80, hunger: 30, morale: 70, infection },
    ...overrides,
  });

const draftWith = (
  infection: number,
  inventory: { itemId: string; quantity: number }[] = [],
) =>
  createDraft(
    createWorld({ runSeed: 1, survivors: [infected(infection)], inventory }),
  );

describe('runInfection', () => {
  it('leaves a clean survivor alone', () => {
    const draft = draftWith(0);
    runInfection(draft, mulberry32(1));
    expect(draft.survivors[0]?.stats.infection).toBe(0);
    expect(draft.entries).toHaveLength(0);
  });

  it('climbs by 6-12 a day once it has taken hold', () => {
    const start = INFECTION_TAKES_HOLD + 5;
    for (let seed = 1; seed <= 40; seed += 1) {
      const draft = draftWith(start);
      runInfection(draft, mulberry32(seed));
      const value = draft.survivors[0]?.stats.infection ?? 0;
      expect(value - start).toBeGreaterThanOrEqual(INFECTION_MIN_GAIN);
      expect(value - start).toBeLessThanOrEqual(INFECTION_MAX_GAIN);
    }
  });

  /*
   * A scratch is not a bite. Below the line the body wins: without this every
   * 4-point cut on a window frame climbed like a bite did and was terminal,
   * which cost about two of every five survivors in a measured run.
   */
  it('closes a wound that never took hold', () => {
    const draft = draftWith(INFECTION_TAKES_HOLD - 5);
    runInfection(draft, mulberry32(3));

    expect(draft.survivors[0]?.stats.infection).toBeLessThan(
      INFECTION_TAKES_HOLD - 5,
    );
  });

  it('never goes down on its own once it has taken hold', () => {
    const draft = draftWith(40);
    runInfection(draft, mulberry32(5));
    expect(draft.survivors[0]?.stats.infection).toBeGreaterThan(40);
  });

  it('knocks the infection back with 항생제 and spends one', () => {
    const withMeds = draftWith(40, [{ itemId: 'antibiotics', quantity: 2 }]);
    const without = draftWith(40);
    runInfection(withMeds, mulberry32(9));
    runInfection(without, mulberry32(9));

    expect(withMeds.survivors[0]?.stats.infection).toBeLessThan(
      without.survivors[0]?.stats.infection ?? 0,
    );
    expect(
      withMeds.inventory.find((entry) => entry.itemId === 'antibiotics')
        ?.quantity,
    ).toBe(1);
  });

  it('logs the antibiotics being used', () => {
    const draft = draftWith(40, [{ itemId: 'antibiotics', quantity: 1 }]);
    runInfection(draft, mulberry32(9));
    expect(
      draft.entries.some((entry) => entry.message.includes('항생제')),
    ).toBe(true);
  });

  /*
   * Infection no longer kills. Reaching 100 turns the survivor: they leave the
   * roster, the group has to decide what to do about them, and only that
   * decision ends them. Death has exactly one cause now, and it is hp.
   */
  it('turns at 100 rather than killing', () => {
    const draft = draftWith(95);
    runInfection(draft, mulberry32(2));

    expect(draft.survivors[0]?.alive).toBe(false);
    expect(draft.survivors[0]?.status).toBe('좀비');
    expect(draft.survivors[0]?.diedDay).toBeUndefined();
    expect(draft.survivors[0]?.turnedDay).toBe(draft.day);
  });

  it('reports who turned', () => {
    const draft = draftWith(95);
    const turned = runInfection(draft, mulberry32(2));

    expect(turned).toEqual(['s1']);
    expect(draft.entries.some((entry) => entry.severity === 'death')).toBe(true);
  });

  it('leaves nobody turned while the infection is still climbing', () => {
    const draft = draftWith(40);
    expect(runInfection(draft, mulberry32(2))).toHaveLength(0);
    expect(draft.survivors[0]?.status).toBe('생존');
  });

  it('costs the people who watched it', () => {
    const draft = createDraft(
      createWorld({
        runSeed: 1,
        survivors: [infected(95), makeSurvivor('s2', '지연')],
        relationships: makePair('s1', 's2', 70),
      }),
    );
    runInfection(draft, mulberry32(2));

    expect(draft.survivors[1]?.stats.morale).toBeLessThan(70);
  });
});

describe('trustToward', () => {
  it('averages what the rest of the group feels', () => {
    const draft = createDraft(
      createWorld({
        runSeed: 1,
        survivors: [
          makeSurvivor('s1', '민수'),
          makeSurvivor('s2', '지연'),
          makeSurvivor('s3', '현우'),
        ],
        relationships: [...makePair('s1', 's2', 40), ...makePair('s1', 's3', -20)],
      }),
    );
    expect(trustToward(draft, 's1')).toBe(10);
  });

  it('is null when nobody has an opinion', () => {
    const draft = createDraft(
      createWorld({ runSeed: 1, survivors: [makeSurvivor('s1', '민수')] }),
    );
    expect(trustToward(draft, 's1')).toBeNull();
  });
});
