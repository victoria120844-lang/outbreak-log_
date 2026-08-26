import { describe, expect, it } from 'vitest';
import { createDraft, createWorld } from './state';
import { makeSurvivor } from './testUtils';
import {
  BASE_HUNGER_GAIN,
  BASE_STAMINA_LOSS,
  SHORTAGE_HUNGER_GAIN,
  SHORTAGE_MORALE_LOSS,
  RECOVERY_HP,
  STARVATION_GRACE_DAYS,
  STARVATION_HP_LOSS,
  runUpkeep,
} from './upkeep';

/** INTP has no efficiency or rationing bonus, so the arithmetic stays plain. */
const plainSurvivor = () => makeSurvivor('s1', '민수', { mbti: 'INTP' });

/** Above every ration-saving chance, so a unit is always spent. */
const noLuck = () => 0.99;

const draftWith = (inventory: { itemId: string; quantity: number }[]) =>
  createDraft(
    createWorld({
      runSeed: 1,
      survivors: [plainSurvivor()],
      inventory,
    }),
  );

describe('runUpkeep', () => {
  it('burns stamina and adds hunger every day', () => {
    const draft = draftWith([]);
    runUpkeep(draft, noLuck);

    const survivor = draft.survivors[0];
    expect(survivor?.stats.stamina).toBe(80 - BASE_STAMINA_LOSS);
  });

  it('feeds and waters a survivor from the shelf', () => {
    const draft = draftWith([
      { itemId: 'cannedFood', quantity: 1 },
      { itemId: 'bottledWater', quantity: 1 },
    ]);
    runUpkeep(draft, noLuck);

    const survivor = draft.survivors[0];
    // 30 + 8 base, then -25 from 통조림 and -5 from 생수.
    expect(survivor?.stats.hunger).toBe(8);
    // -10 stamina, then +10 from 생수.
    expect(survivor?.stats.stamina).toBe(80);
    expect(survivor?.stats.morale).toBe(70);
  });

  it('spends exactly one unit of each per survivor', () => {
    const draft = draftWith([
      { itemId: 'cannedFood', quantity: 3 },
      { itemId: 'bottledWater', quantity: 3 },
    ]);
    runUpkeep(draft, noLuck);

    expect(
      draft.inventory.find((entry) => entry.itemId === 'cannedFood')?.quantity,
    ).toBe(2);
    expect(
      draft.inventory.find((entry) => entry.itemId === 'bottledWater')?.quantity,
    ).toBe(2);
  });

  it('drives hunger up sharply and morale down when the shelf is empty', () => {
    const draft = draftWith([]);
    runUpkeep(draft, noLuck);

    const survivor = draft.survivors[0];
    expect(survivor?.stats.hunger).toBe(
      30 + BASE_HUNGER_GAIN + SHORTAGE_HUNGER_GAIN,
    );
    expect(survivor?.stats.morale).toBe(70 - SHORTAGE_MORALE_LOSS);
  });

  it('logs the shortage', () => {
    const draft = draftWith([]);
    runUpkeep(draft, noLuck);
    expect(draft.entries.some((entry) => entry.message.includes('배급'))).toBe(
      true,
    );
  });

  it('leaves hp alone on the first day without food', () => {
    const draft = draftWith([]);
    runUpkeep(draft, noLuck);
    expect(draft.survivors[0]?.stats.hp).toBe(100);
  });

  it('starts draining hp once the grace period runs out', () => {
    const draft = draftWith([]);
    for (let day = 0; day < STARVATION_GRACE_DAYS; day += 1) {
      runUpkeep(draft, noLuck);
    }

    expect(draft.survivors[0]?.stats.hp).toBe(100 - STARVATION_HP_LOSS);
    expect(draft.deprivation['s1']?.food).toBe(STARVATION_GRACE_DAYS);
  });

  it('reports the shortage on a new miss, not on every day of it', () => {
    const draft = draftWith([]);
    runUpkeep(draft, noLuck);
    runUpkeep(draft, noLuck);
    runUpkeep(draft, noLuck);

    const shortages = draft.entries.filter((entry) =>
      entry.message.includes('배급이 끊겼다'),
    );
    expect(shortages).toHaveLength(1);
  });

  it('reports again when someone who was eating starts missing', () => {
    const draft = draftWith([
      { itemId: 'cannedFood', quantity: 1 },
      { itemId: 'bottledWater', quantity: 1 },
    ]);
    runUpkeep(draft, noLuck);
    runUpkeep(draft, noLuck);

    expect(
      draft.entries.filter((entry) => entry.message.includes('배급이 끊겼다')),
    ).toHaveLength(1);
  });

  it('warns about starvation on the day it starts, not every day after', () => {
    const draft = draftWith([]);
    const starvationLines = () =>
      draft.entries.filter((entry) => entry.message.includes('굶었다')).length;

    for (let day = 0; day < STARVATION_GRACE_DAYS; day += 1) {
      runUpkeep(draft, noLuck);
    }
    const afterCrossing = starvationLines();

    runUpkeep(draft, noLuck);
    runUpkeep(draft, noLuck);
    const afterFourDays = starvationLines();

    expect(afterCrossing).toBe(1);
    expect(afterFourDays).toBe(1);
    // hp keeps draining even though the log stays quiet.
    // Five days without: the drain starts on the third and never stops.
    expect(draft.survivors[0]?.stats.hp).toBe(100 - STARVATION_HP_LOSS * 3);
  });

  it('resets the counter as soon as a ration arrives', () => {
    const draft = draftWith([]);
    runUpkeep(draft, noLuck);
    expect(draft.deprivation['s1']?.food).toBe(1);

    draft.inventory.push({ itemId: 'cannedFood', quantity: 1 });
    draft.inventory.push({ itemId: 'bottledWater', quantity: 1 });
    runUpkeep(draft, noLuck);

    expect(draft.deprivation['s1']?.food).toBe(0);
    // Fed and watered, so the body mends a little overnight.
    expect(draft.survivors[0]?.stats.hp).toBe(100 + RECOVERY_HP);
  });

  it('still drains hp when only the water ran out', () => {
    const draft = draftWith([{ itemId: 'cannedFood', quantity: 10 }]);
    for (let day = 0; day < STARVATION_GRACE_DAYS; day += 1) {
      runUpkeep(draft, noLuck);
    }

    expect(draft.deprivation['s1']?.food).toBe(0);
    expect(draft.deprivation['s1']?.water).toBe(STARVATION_GRACE_DAYS);
    expect(draft.survivors[0]?.stats.hp).toBe(100 - STARVATION_HP_LOSS);
  });

  it('applies per-day trait deltas', () => {
    const draft = createDraft(
      createWorld({
        runSeed: 1,
        survivors: [
          makeSurvivor('s1', '민수', { mbti: 'INTP', traits: ['strongBody'] }),
        ],
        inventory: [
          { itemId: 'cannedFood', quantity: 1 },
          { itemId: 'bottledWater', quantity: 1 },
        ],
      }),
    );
    runUpkeep(draft, noLuck);

    // +10 hp and +10 stamina from 강한 체력, plus the nightly mend.
    expect(draft.survivors[0]?.stats.hp).toBe(110 + RECOVERY_HP);
    expect(draft.survivors[0]?.stats.stamina).toBe(90);
  });

  it('lets a J profile stretch rations', () => {
    const draft = createDraft(
      createWorld({
        runSeed: 1,
        survivors: [makeSurvivor('s1', '민수', { mbti: 'ISTJ' })],
        inventory: [
          { itemId: 'cannedFood', quantity: 1 },
          { itemId: 'bottledWater', quantity: 1 },
        ],
      }),
    );
    // Below the save chance, so the unit is kept.
    runUpkeep(draft, () => 0.01);

    expect(
      draft.inventory.find((entry) => entry.itemId === 'cannedFood')?.quantity,
    ).toBe(1);
    expect(draft.deprivation['s1']?.food).toBe(0);
  });

  it('skips the dead', () => {
    const draft = createDraft(
      createWorld({
        runSeed: 1,
        survivors: [
          makeSurvivor('s1', '민수', { alive: false, status: '사망' }),
        ],
        inventory: [{ itemId: 'cannedFood', quantity: 1 }],
      }),
    );
    runUpkeep(draft, noLuck);

    expect(draft.survivors[0]?.stats.stamina).toBe(80);
    expect(
      draft.inventory.find((entry) => entry.itemId === 'cannedFood')?.quantity,
    ).toBe(1);
  });
});
