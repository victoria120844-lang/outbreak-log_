import { describe, expect, it } from 'vitest';
import { buildProfile } from '@/features/simulation/profile';
import { mulberry32 } from '@/features/simulation/rng';
import { makeSurvivor } from '@/features/simulation/testUtils';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  ABILITY_MAX,
  ABILITY_MIN,
  abilityTotal,
  clampAbility,
  rollAbilities,
} from './abilities';

describe('abilities', () => {
  it('names all five in Korean', () => {
    expect(ABILITY_KEYS).toHaveLength(5);
    expect(ABILITY_KEYS.map((key) => ABILITY_LABELS[key])).toEqual([
      '지력',
      '체력',
      '민첩',
      '힘',
      '운',
    ]);
  });

  it('rolls inside the range', () => {
    const rng = mulberry32(4);
    for (let index = 0; index < 200; index += 1) {
      const rolled = rollAbilities(rng);
      ABILITY_KEYS.forEach((key) => {
        expect(rolled[key]).toBeGreaterThanOrEqual(ABILITY_MIN);
        expect(rolled[key]).toBeLessThanOrEqual(ABILITY_MAX);
      });
    }
  });

  it('does not roll the same five numbers every time', () => {
    const rng = mulberry32(9);
    const totals = new Set<number>();
    for (let index = 0; index < 40; index += 1) {
      totals.add(abilityTotal(rollAbilities(rng)));
    }
    expect(totals.size).toBeGreaterThan(3);
  });

  it('clamps out-of-range values', () => {
    expect(clampAbility(-5)).toBe(ABILITY_MIN);
    expect(clampAbility(99)).toBe(ABILITY_MAX);
  });
});

describe('abilities feed the action profile', () => {
  const withAbility = (key: (typeof ABILITY_KEYS)[number], score: number) =>
    buildProfile(
      makeSurvivor('a', 'A', {
        abilities: {
          intellect: 5,
          endurance: 5,
          agility: 5,
          strength: 5,
          luck: 5,
          [key]: score,
        },
      }),
    );

  it('lets 힘 decide a fight', () => {
    expect(withAbility('strength', 9).combat).toBeGreaterThan(
      withAbility('strength', 2).combat,
    );
  });

  it('lets 민첩 decide whether running works', () => {
    expect(withAbility('agility', 9).fleeSurvival).toBeGreaterThan(
      withAbility('agility', 2).fleeSurvival,
    );
  });

  it('lets 지력 decide medicine', () => {
    expect(withAbility('intellect', 9).medical).toBeGreaterThan(
      withAbility('intellect', 2).medical,
    );
  });

  it('lets 운 decide how strange the day gets', () => {
    expect(withAbility('luck', 9).chanceEncounter).toBeGreaterThan(
      withAbility('luck', 2).chanceEncounter,
    );
  });

  it('leaves an average survivor unchanged', () => {
    const average = buildProfile(makeSurvivor('a', 'A'));
    expect(average.combat).toBeCloseTo(1, 5);
  });
});
